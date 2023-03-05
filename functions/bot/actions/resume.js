const { resumeUser } = require("../components/fauna");
const { getUser } = require("../components/helper");

module.exports = async (ctx) => {
  const { id, isBot } = getUser(ctx.from);

  if (isBot) {
    return ctx.reply(`Sorry I only interact with humans!`);
  }

  try {
    let isResume = await resumeUser(id);

    if (isResume) {
      return ctx.reply(
        `Welcome back to LondonTechConnect! We've resumed your pairings, and you'll soon receive details on your next coffee match.`
      );
    } else {
      return ctx.reply(`Oh no! Something went wrong :(`);
    }
  } catch (e) {
    return ctx.reply(`Oh no! Something went wrong :(`);
  }
};
