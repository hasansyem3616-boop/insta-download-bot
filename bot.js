const TelegramBot = require("node-telegram-bot-api");
const { exec } = require("child_process");
const fs = require("fs");

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const url = msg.text;

  if (!url || !url.startsWith("http")) {
    return bot.sendMessage(chatId, "Send a valid video link.");
  }

  bot.sendMessage(chatId, "Downloading... Please wait.");

  const filename = `video_${Date.now()}.mp4`;

  exec(`yt-dlp -f mp4 -o "${filename}" "${url}"`, async (error) => {
    if (error) {
      console.log(error);
      return bot.sendMessage(chatId, "❌ Download failed.");
    }

    try {
      await bot.sendVideo(chatId, filename);
      fs.unlinkSync(filename);
    } catch (err) {
      bot.sendMessage(chatId, "Video too large for Telegram (50MB limit).");
    }
  });
});

console.log("Bot running...");
