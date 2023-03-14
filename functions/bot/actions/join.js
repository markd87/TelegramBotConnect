const { newUser, checkNewUser } = require("../components/fauna");
const { getUser } = require("../components/helper");

import { superWizard } from "../bot";

module.exports = async (ctx) => {
  const { id, isBot, name, username } = getUser(ctx.from);

  if (isBot) {
    return ctx.reply(`Sorry I only interact with humans!`);
  }

  try {
    // let isNewUser = await newUser(id, name, username);

    let isNewUser = await checkNewUser(id);

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

      ctx.reply(
        `Welcome! Thank you for joining LondonTechCoffee.\nBefore we match you with someone for a random coffee in our weekly pairings, could you please answer a few quick questions:\n\n`
      );
      //   let name = await
      //   ctx.scene.enter("super-wizard");
      superWizard.enter((ctx) => {
        ctx.reply(`What is your name?`);
        ctx.scene.session.user = {};
      });

      //   let occupation = await ctx.reply("What is your occupation?");
      //   console.log(name);
      //   console.log(occupation);

      //   ask = false;
      //   ctx.on("text", (ctx) => {
      //     if (ask) {
      //       occupation = ctx.message.text;
      //     } else {
      //       ask = true;
      //       ctx.reply("What is your occupation?");
      //     }
      //   });
      //   console.log(occupation);
    } else {
      return ctx.reply(
        `It looks like you're already on our weekly pairings list! We're so glad to have you as part of our community, and we hope you're enjoying meeting new people through LondonTechConnect.\nIf you need to pause the pairings for any reason, use the /pause command. \nIf you want to start receiving pairings again, use the /resume command.\nAnd If you'd like to remove yourself from the pairings, type /remove.`
      );
    }
  } catch (e) {
    console.log(e);
    return ctx.reply(`Error occurred`);
  }
};
