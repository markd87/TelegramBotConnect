const { newUser } = require("../components/fauna");
const { getUser } = require("../components/helper");

module.exports = async (ctx) => {
  const { id, isBot, name, username } = getUser(ctx.from);

  if (isBot) {
    return ctx.reply(`Sorry I only interact with humans!`);
  }

  ctx.reply(
    `Welcome to LondonTechConnect  \xF0\x9F\x91\x8B 🇺🇦 🇬🇧 , the bot that helps you meet new people over a cup of coffee! \xE2\x98\x95. \nWhether you're new to London or just looking to expand your network, our bot will match you with a random person in the chat for a friendly chat and a hot drink. \n\nTo join our weekly pairings, simply type /join in the chat. \nIf you need to pause the pairings for any reason, use the /pause command. \n If you'd like to remove yourself from the pairings, type /remove. \n And if you want to start receiving pairings again, use the /resume command. \n\ Remember, meeting new people can be a great way to learn new things, expand your horizons, and have fun! \n So don't be shy, join LondonTechConnect today and start connecting with your fellow Londoners.`
  );
};
