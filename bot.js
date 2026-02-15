const TelegramBot = require('node-telegram-bot-api');
const ig = require('instagram-url-direct');
const express = require('express');

const app = express();
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
    res.send('Instagram Bot Running ✅');
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

// Telegram webhook endpoint
app.post(`/bot${TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Handle messages
bot.on('message', async (msg) => {
    if (!msg.text) return;

    const chatId = msg.chat.id;
    const link = msg.text.trim();

    if (!link.includes("instagram.com")) {
        return bot.sendMessage(chatId, "Send a public Instagram link 📸");
    }

    try {
        await bot.sendMessage(chatId, "Downloading... ⏳");

        const data = await ig(link);
        const urls = data.url_list;

        if (!urls || urls.length === 0) {
            return bot.sendMessage(chatId, "❌ Cannot download. Make sure content is public.");
        }

        for (const url of urls) {
            if (url.includes(".mp4")) {
                await bot.sendVideo(chatId, url, { caption: "Downloaded ✅" });
            } else {
                await bot.sendPhoto(chatId, url, { caption: "Downloaded ✅" });
            }
        }

    } catch (err) {
        console.error(err.message);
        bot.sendMessage(chatId,
            "❌ Failed.\nPossible reasons:\n- Private account\n- Expired story\n- Invalid link"
        );
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
