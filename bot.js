const TelegramBot = require('node-telegram-bot-api');
const ig = require('instagram-url-direct').default;
const express = require('express');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Instagram Downloader Bot Running ✅');
});

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.BOT_TOKEN;
const URL = process.env.RENDER_EXTERNAL_URL;

if (!TOKEN) {
    console.error("BOT_TOKEN is NOT set!");
    process.exit(1);
}

const bot = new TelegramBot(TOKEN);

// Set webhook
bot.setWebHook(`${URL}/bot${TOKEN}`);
console.log("Webhook set to:", `${URL}/bot${TOKEN}`);

app.post(`/bot${TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Small delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper (tries up to 3 times)
async function fetchWithRetry(link, attempts = 3) {
    for (let i = 1; i <= attempts; i++) {
        try {
            return await ig(link);
        } catch (err) {
            console.log(`Attempt ${i} failed`);
            if (i === attempts) throw err;
            await delay(1500); // wait before retry
        }
    }
}

bot.on('message', async (msg) => {
    if (!msg.text) return;

    const chatId = msg.chat.id;
    const link = msg.text.trim();

    if (!link.includes("instagram.com")) {
        return bot.sendMessage(chatId,
            "Send a public Instagram link:\n\n• Post\n• Reel\n• Story"
        );
    }

    try {
        await bot.sendMessage(chatId, "Processing link... ⏳");

        const data = await fetchWithRetry(link);
        const urls = data?.url_list;

        if (!urls || urls.length === 0) {
            return bot.sendMessage(chatId,
                "❌ Cannot download.\nMake sure:\n- Content is public\n- Link is valid\n- Story is not expired"
            );
        }

        // Detect content type
        let type = "Post";
        if (link.includes("/reel/")) type = "Reel";
        if (link.includes("/stories/")) type = "Story";

        await bot.sendMessage(chatId,
            `Downloading ${urls.length} file(s) from ${type}...`
        );

        // Telegram allows max 10 media per group
        for (let i = 0; i < urls.length; i += 10) {

            const group = urls.slice(i, i + 10).map((url, index) => ({
                type: url.includes(".mp4") ? "video" : "photo",
                media: url,
                caption: (i === 0 && index === 0)
                    ? `Downloaded from ${type} ✅`
                    : undefined
            }));

            if (group.length === 1) {
                if (group[0].type === "video") {
                    await bot.sendVideo(chatId, group[0].media, {
                        caption: `Downloaded from ${type} ✅`
                    });
                } else {
                    await bot.sendPhoto(chatId, group[0].media, {
                        caption: `Downloaded from ${type} ✅`
                    });
                }
            } else {
                await bot.sendMediaGroup(chatId, group);
            }

            await delay(800); // small delay between groups
        }

    } catch (err) {
        console.error("Instagram error:", err);

        await bot.sendMessage(chatId,
            "❌ Download failed.\n\nPossible reasons:\n" +
            "• Private account\n" +
            "• Story expired (24h)\n" +
            "• Instagram blocked request\n" +
            "• Rate limit reached\n\nTry again in a few minutes."
        );
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
