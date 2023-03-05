const { removeUser } = require("../components/fauna");
const { getUser } = require("../components/helper");

module.exports = async (ctx) => {
  const { id, isBot } = getUser(ctx.from);

  if (isBot) {
    return ctx.reply(`Sorry I only interact with humans!`);
  }

  try {
    let isRemove = await removeUser(id);

    if (isRemove) {
      return ctx.reply(
        `We're sorry to see you go! You've been removed from our weekly pairings list, and you won't receive any further coffee match notifications.\nRemember, if you change your mind and want to start receiving pairings again, simply use the /join command to opt back in. And if you ever want to pause the pairings for a while, you can use the /pause command.`
      );
    } else {
      return ctx.reply(`Oh no! Something went wrong :(`);
    }
  } catch (e) {
    return ctx.reply(`Oh no! Something went wrong :(`);
  }
};
