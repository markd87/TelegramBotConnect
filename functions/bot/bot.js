const { Telegraf, session, Scenes, Markup } = require("telegraf");

// const WizardScene = require("telegraf/scenes/wizard");

// import TelegrafQuestion from "telegraf-question";
const startAction = require("./actions/start");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
// bot.use(
//   TelegrafQuestion({
//     cancelTimeout: 300000, // 5 min
//   })
// );

const superWizard = new Scenes.WizardScene(
  "super-wizard",
  (ctx) => {
    ctx.reply(
      `To continue click next`,
      Markup.inlineKeyboard([Markup.callbackButton("➡️ Next", "next")]).extra()
    );
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.scene.session.user = {};
    ctx.reply(`What is your name?`);
    ctx.scene.session.user = {};
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.scene.session.user.name = ctx.message.text;
    ctx.reply("What is your occupation?");
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.scene.session.user.occupation = ctx.message.text;
    ctx.reply("What is your instagram username?");
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.scene.session.user.instagram = ctx.message.text;
    ctx.reply("What is your linkedin profile link?");
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.scene.session.user.linkedin = ctx.message.text;
    ctx.reply(
      "Thank you! You have been added to our weekly pairings list, and we'll be in touch soon with details on your coffee match."
    );

    return ctx.scene.leave();
  }
);
const stage = new Scenes.Stage([superWizard]);

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
