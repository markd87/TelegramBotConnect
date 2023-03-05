const { newUser } = require("../components/fauna");
const { getUser } = require("../components/helper");

module.exports = async (ctx) => {
  const { id, isBot, name, username } = getUser(ctx.from);

  if (isBot) {
    return ctx.reply(`Sorry I only interact with humans!`);
  }

  try {
    let isNewUser = await newUser(id, name, username);
    console.log(isNewUser);
    if (isNewUser) {
      //   ctx.telegram.sendMessage(
      //     (chat_id = 396532677),
      //     (text = "hello from ltc")
      //   );
      //   ctx.telegram.sendMessage(
      //     (chat_id = 396532677),
      //     (text =
      //       "This week you are meeting @Massiania! say Hi to Mark and schedule your meeting :)")
      //   );
      return ctx.reply(
        `Thank you for joining LondonTechConnect! You have been added to our weekly pairings list, and we'll be in touch soon with details on your coffee match.`
      );
    } else {
      return ctx.reply(
        `It looks like you're already on our weekly pairings list! We're so glad to have you as part of our community, 
        and we hope you're enjoying meeting new people through LondonTechConnect.\n
        If you need to pause the pairings for any reason, use the /pause command. 
        If you want to start receiving pairings again, use the /resume command.
        And If you'd like to remove yourself from the pairings, type /remove. 
        `
      );
    }
  } catch (e) {
    console.log(err);
    return ctx.reply(`Error occurred`);
  }
};
