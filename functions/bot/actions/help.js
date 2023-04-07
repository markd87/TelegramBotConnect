const { getUser } = require("../components/helper");

module.exports = async (ctx) => {
  const { id, isBot, name, username } = getUser(ctx.from);

  if (isBot) {
    return ctx.reply(`Sorry I only interact with humans!`);
  }

  ctx.reply(
    `Sure, here are the available options:
    \n\nTo join our weekly pairings, type /join in the chat.
    \nIf you need to pause the pairings for any reason, use the /pause command.
    \nIf you want to start receiving pairings again, use the /resume command.
    \nAnd If you'd like to remove yourself from the pairings, type /remove.`
  );
};
