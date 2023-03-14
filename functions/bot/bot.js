const { Telegraf, session } = require("telegraf");

const Stage = require("telegraf/stage");
const WizardScene = require("telegraf/scenes/wizard");

// import TelegrafQuestion from "telegraf-question";
const startAction = require("./actions/start");

// bot.use(
//   TelegrafQuestion({
//     cancelTimeout: 300000, // 5 min
//   })
// );

const superWizard = new WizardScene(
  "super-wizard",
  (ctx) => {
    ctx.reply("What's your name?");
    ctx.wizard.state.data = {};
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.wizard.state.data.name = ctx.message.text;
    ctx.reply("Enter your phone number");
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.wizard.state.data.phone = ctx.message.text;
    ctx.reply(`Your name is ${ctx.wizard.state.data.name}`);
    ctx.reply(`Your phone is ${ctx.wizard.state.data.phone}`);
    return ctx.scene.leave();
  }
);
const stage = new Stage([superWizard]);

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
bot.use(session());
bot.use(stage.middleware());

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
