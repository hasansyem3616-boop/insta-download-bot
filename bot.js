const TelegramBot = require('node-telegram-bot-api');
const ig = require('instagram-url-direct');
const express = require('express');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Instagram Story Bot Running ✅');
});

app.listen(process.env.PORT || 3000);

// Create bot (polling mode for simple use)
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

console.log("BOT STARTED");

// Listen for messages
bot.on('message', async (msg) => {
    if (!msg.text) return;

    const chatId = msg.chat.id;
    const link = msg.text.trim();

    // Check if it's an Instagram story link
    if (!link.includes("instagram.com/stories/")) {
        return bot.sendMessage(
            chatId,
            "❌ Please send a public Instagram story link.\n\nExample:\nhttps://www.instagram.com/stories/username/123456789/"
        );
    }

    try {
        await bot.sendMessage(chatId, "Downloading story... ⏳");

        const data = await ig(link);

        if (!data.url_list || data.url_list.length === 0) {
            return bot.sendMessage(
                chatId,
                "❌ Cannot download.\nMake sure:\n- Story is public\n- Link is correct\n- Story is not expired"
            );
        }

        for (const url of data.url_list) {
            if (url.includes(".mp4")) {
                await bot.sendVideo(chatId, url, { caption: "Story downloaded ✅" });
            } else {
                await bot.sendPhoto(chatId, url, { caption: "Story downloaded ✅" });
            }
        }

    } catch (error) {
        console.error(error.message);
        bot.sendMessage(
            chatId,
            "❌ Failed to download story.\nPossible reasons:\n- Private account\n- Story expired (after 24h)\n- Instagram restrictions"
        );
    }
});

