const { pauseUser } = require("../components/fauna");
const { getUser } = require("../components/helper");

module.exports = async (ctx) => {
  const { id, isBot, name, username } = getUser(ctx.from);

  if (isBot) {
    return ctx.reply(`Sorry I only interact with humans!`);
  }

  try {
    let isPaused = await pauseUser(id, name, username);
    console.log("Pausing...");
    console.log(isPaused);

    if (isPaused) {
      return ctx.reply(
        `Got it, we've paused your pairings for now. You won't receive any new coffee match notifications until you use the /resume command.`
      );
    } else {
      return ctx.reply(`Something went wrong :(`);
    }
  } catch (e) {
    return ctx.reply(`Something went wrong :(`);
  }
};
