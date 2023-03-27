const { getUser } = require("../components/helper");

module.exports = async (ctx) => {
  const { id, isBot, name, username } = getUser(ctx.from);

  // const isMember_test = await ctx.telegram.getChatMember(
  //   (chat_id = -997370885),
  //   (uer_id = id)
  // );

  // const isMember = await ctx.telegram.getChatMember(
  //   (chat_id = -1530060246),
  //   (uer_id = id)
  // );

  // console.log(isMember.status);

  // if (
  //   isMember.status != "member" &&
  //   isMember.status != "creator" &&
  //   isMember.status != "administrator"
  // ) {
  //   return ctx.reply(`Sorry, this bot is only for the LondonTechCommunity`);
  // }

  if (isBot) {
    return ctx.reply(`Sorry I only interact with humans!`);
  }

  ctx.reply(
    `No problem, happy to remind you of the avaialble options:
    \n\nTo join our weekly pairings, type /join in the chat.
    \nIf you need to pause the pairings for any reason, use the /pause command.
    \nIf you want to start receiving pairings again, use the /resume command.
    \nAnd If you'd like to remove yourself from the pairings, type /remove.`
  );
};
