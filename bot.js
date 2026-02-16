const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const ytDlp = require("yt-dlp-exec");
const app = express();
app.use(express.json());

const token = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;

// Initialize bot
const bot = new TelegramBot(token);
bot.setWebHook(`${process.env.RENDER_EXTERNAL_URL}/bot${token}`);

// Webhook route
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Handle messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const url = msg.text;

  if (!url || !url.startsWith("http")) {
    return bot.sendMessage(chatId, "Send a valid YouTube/Dailymotion/Bilibili link.");
  }

  bot.sendMessage(chatId, "Getting direct download link...");

  try {
    const result = await ytDlp(url, { getUrl: true, format: "best" });
    bot.sendMessage(chatId, `✅ Direct link:\n${result}`);
  } catch (err) {
    console.log(err);
    bot.sendMessage(chatId, "❌ Failed to get video link. Try again.");
  }
});

// Start express server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

