const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

exports.handler = async function (event, context) {
  try {
    chat_id = 258865258;

    const chat = await bot.telegram.getChat(chat_id);

    await bot.telegram.sendMessage(
      (chat_id = chat_id),
      (text = `username test: ${chat.username}`)
    );
  } catch (error) {
    console.log(error);
  }

  console.log("DONE BACKGROUND FUNCTION");

  return {
    statusCode: 200,
  };
};
