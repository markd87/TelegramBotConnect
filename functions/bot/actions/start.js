const { newUser } = require("../components/fauna");
const { getUser } = require("../components/helper");

module.exports = async (ctx) => {
  const { id, isBot, name } = getUser(ctx.from);

  if (isBot) {
    return ctx.reply(`Sorry I only interact with humans!`);
  }

  try {
    let isNewUser = await newUser(id);
    console.log(isNewUser);
    if (isNewUser) {
      return ctx.reply(
        `Hi! you've been added to London Tech Connect, you'll get a notification when we connect you with another member of the group!`
      );
    } else {
      return ctx.reply(`You are already a part of London Tech Connect`);
    }
  } catch (e) {
    return ctx.reply(`Error occured`);
  }
};
