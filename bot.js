const TelegramBot = require('node-telegram-bot-api');
const ig = require('instagram-url-direct');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Bot Running'));
app.listen(process.env.PORT || 3000);

// Debug: check if BOT_TOKEN is set
console.log('BOT_TOKEN is', process.env.BOT_TOKEN ? 'SET' : 'NOT SET');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.on('message', async (msg) => {
    if (!msg.text) return;

    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text.includes("instagram.com")) {
        return bot.sendMessage(chatId, "Send a public Instagram post, story, or reel link 📸");
    }

    try {
        const data = await ig(text);
        const urls = data.url_list;

        if (!urls || urls.length === 0) {
            return bot.sendMessage(chatId, "❌ Cannot download this link. Make sure the content is public.");
        }

        const contentType = urls[0].includes(".mp4") ? "Video" : "Photo";
        await bot.sendMessage(
            chatId,
            `Downloading ${urls.length} ${contentType}${urls.length > 1 ? "s" : ""}...`
        );

        // Telegram allows max 10 media per group
        for (let i = 0; i < urls.length; i += 10) {
            const group = urls.slice(i, i + 10).map((url, index) => ({
                type: url.includes(".mp4") ? "video" : "photo",
                media: url,
                caption: (i === 0 && index === 0) ? "Downloaded ✅" : undefined
            }));

            if (group.length === 1) {
                if (group[0].type === "video") {
                    await bot.sendVideo(chatId, group[0].media, { caption: "Downloaded ✅" });
                } else {
                    await bot.sendPhoto(chatId, group[0].media, { caption: "Downloaded ✅" });
                }
            } else {
                await bot.sendMediaGroup(chatId, group);
            }
        }

    } catch (err) {
        console.error("Download error:", err.message);
        await bot.sendMessage(
            chatId,
            "❌ Failed to download. Possible reasons:\n" +
            "- Content is private or deleted\n" +
            "- Link is invalid\n" +
            "- Instagram restrictions"
        );
    }
});

