const { Telegraf } = require("telegraf");

// import TelegrafQuestion from "telegraf-question";
const startAction = require("./actions/start");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
// bot.use(
//   TelegrafQuestion({
//     cancelTimeout: 300000, // 5 min
//   })
// );

bot.start((ctx) => {
  return startAction(ctx);
});

// register commands
bot.command("join", require("./actions/join"));
bot.command("pause", require("./actions/pause"));
bot.command("resume", require("./actions/resume"));
bot.command("remove", require("./actions/remove"));

exports.handler = async (event) => {
  try {
    await bot.handleUpdate(JSON.parse(event.body));
    return { statusCode: 200, body: "" };
  } catch (e) {
    console.log(e);
    return {
      statusCode: 400,
      body: "This endpoint is meant for bot and telegram communication",
    };
  }
};
