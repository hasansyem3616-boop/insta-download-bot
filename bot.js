const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const token = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;

const bot = new TelegramBot(token);

// Set webhook
bot.setWebHook(`${process.env.RENDER_EXTERNAL_URL}/bot${token}`);

app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const url = msg.text;

  if (!url || !url.startsWith("http")) {
    return bot.sendMessage(chatId, "Send a valid video link.");
  }

  bot.sendMessage(chatId, "Fetching download link...");

  try {
    // Example free API (may change in future)
    const apiUrl = `https://api.vreden.my.id/api/ytmp4?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl);

    if (!response.data || !response.data.result) {
      return bot.sendMessage(chatId, "❌ Could not fetch video.");
    }

    const downloadLink = response.data.result.url;

    bot.sendMessage(chatId, `✅ Download link:\n${downloadLink}`);

  } catch (error) {
    console.log(error.message);
    bot.sendMessage(chatId, "❌ Failed to get video link.");
  }
});

app.listen(PORT, () => console.log("Server running..."));
