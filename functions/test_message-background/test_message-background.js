const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

exports.handler = async function (event, context) {
  try {
    await bot.telegram.sendMessage(
      (chat_id = 258865258),
      (text = `Test background`)
    );
  } catch (error) {
    console.log(error);
  }

  console.log("DONE BACKGROUND FUNCTION");

  return {
    statusCode: 200,
  };
};
