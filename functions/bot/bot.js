const { Telegraf, session, Scenes } = require("telegraf");

const { getUser } = require("./components/helper");

const startAction = require("./actions/start");
const { newUser } = require("./components/fauna");

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
      `What is your name?`,
      Markup.inlineKeyboard([Markup.button.callback("Cancel", "cancel"), ,])
    );
    ctx.scene.session.user = {};
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.scene.session.user.name = ctx.message.text;
    ctx.reply(
      "What is your occupation?",
      Markup.inlineKeyboard([Markup.button.callback("Cancel", "cancel"), ,])
    );
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.scene.session.user.occupation = ctx.message.text;
    ctx.reply(
      "What is your instagram username?",
      Markup.inlineKeyboard([Markup.button.callback("Cancel", "cancel"), ,])
    );
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.scene.session.user.instagram = ctx.message.text;
    ctx.reply(
      "What is your linkedin profile link?",
      Markup.inlineKeyboard([Markup.button.callback("Cancel", "cancel"), ,])
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.scene.session.user.linkedin = ctx.message.text;
    const { id, t_name, isbot, username } = getUser(ctx.from);
    const res = await newUser(
      id,
      ctx.scene.session.user.name,
      username,
      ctx.scene.session.user.occupation,
      ctx.scene.session.user.instagram,
      ctx.scene.session.user.linkedin
    );

    if (res) {
      ctx.reply(
        "Thank you! You have been added to our weekly pairings list, and we'll be in touch soon with details on your coffee match."
      );
    }
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

bot.action("next", (ctx) => {
  return ctx.scene.enter("super-wizard");
});

bot.action("cancel", (ctx) => {
  return ctx.reply(
    "No problem! if you change your mind and want to participate, feel free to message /join again"
  );
});

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
