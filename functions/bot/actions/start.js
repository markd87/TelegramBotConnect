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
    `Welcome to LondonTechCoffee 👋 🇺🇦 🇬🇧 , the bot that helps you meet new people over a cup of coffee!
    \nWhether you're new to London or just looking to expand your network, our bot will match you with a random person in the chat for a friendly chat and a hot drink ☕. 
    \n\nTo join our weekly pairings, type /join in the chat, make sure you have a Telegram username.
    \nIf you need to pause the pairings for any reason, use the /pause command.
    \nIf you want to start receiving pairings again, use the /resume command.
    \nAnd If you'd like to remove yourself from the pairings, type /remove.
    \nTo get a reminder of the available options, type /help.
    
    \nRemember, meeting new people can be a great way to learn new things, expand your horizons, and have fun! \nSo don't be shy, join LondonTechCoffee today and start connecting with your fellow Londoners.`
  );
};
