const { Telegraf, session, Scenes } = require("telegraf");

// const WizardScene = require("telegraf/scenes/wizard");

// import TelegrafQuestion from "telegraf-question";
const startAction = require("./actions/start");

// bot.use(
//   TelegrafQuestion({
//     cancelTimeout: 300000, // 5 min
//   })
// );

const superWizard = new Scenes.WizardScene(
  "super-wizard",
  (ctx) => {
    ctx.reply(
      `Welcome! Thank you for joining LondonTechCoffee.\nBefore we match you with someone for a random coffee in our weekly pairings, could you please answer a few quick questions:\n\n`
    );
    ctx.reply(`What is your name?`);
    ctx.scene.session.user = {};
    ctx.scene.session.user.userId = ctx.update.callback_query.from.id;
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
    ctx.reply("Thank you!");
    ctx.reply(`Your name is ${ctx.wizard.state.name}`);
    ctx.reply(`Your occupation is ${ctx.wizard.state.occupation}`);
    ctx.reply(
      `You have been added to our weekly pairings list, and we'll be in touch soon with details on your coffee match.`
    );
    return ctx.scene.leave();
  }
);
const stage = new Scenes.Stage([superWizard]);

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
