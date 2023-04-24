const { Telegraf } = require("telegraf");
const faunadb = require("faunadb");

const client = new faunadb.Client({ secret: process.env.FAUNA_SECRET_KEY });

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const q = faunadb.query;

function shuffleArray(array) {
  // in place shuffling of array
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

async function get_all_participants() {
  return await client.query(
    q.Map(
      q.Paginate(q.Match(q.Index("participants"), true), { size: 200 }),
      q.Lambda("user", {
        userId: q.Select(["data", "userId"], q.Get(q.Var("user"))),
        username: q.Select(["data", "username"], q.Get(q.Var("user"))),
        name: q.Select(["data", "name"], q.Get(q.Var("user"))),
        occupation: q.Select(["data", "occupation"], q.Get(q.Var("user"))),
        instagram: q.Select(["data", "instagram"], q.Get(q.Var("user"))),
        linkedin: q.Select(["data", "linkedin"], q.Get(q.Var("user"))),
      })
    )
  );
}

async function get_previous_pairs() {
  return await client.query(
    q.Map(
      q.Paginate(q.Documents(q.Collection("pairs")), { size: 1000 }),
      q.Lambda("pair", {
        pair: q.Select(["data", "pair"], q.Get(q.Var("pair"))),
      })
    )
  );
}

async function store_new_pairs(pairs) {
  return await client.query(
    q.Map(
      pairs,
      q.Lambda("data", q.Create(q.Collection("pairs"), { data: q.Var("data") }))
    )
  );
}

function match_message(name, occupation, instagram, linkedin) {
  return `Name: ${name}\nOccupation: ${occupation}\nInstagram: https://www.instagram.com/${instagram}/\nLinkedIn: ${linkedin}`;
}

exports.handler = async function (event, context) {
  console.log("Received event:", event);

  // current date as string
  let current_date = new Date().toJSON().slice(0, 10);

  let all_participants = await get_all_participants();
  all_participants = all_participants["data"];

  let previous_pairs = await get_previous_pairs();
  previous_pairs = previous_pairs["data"].map((el) => el.pair);

  shuffleArray(all_participants);

  // check if there are odd number of participants
  // then put aside one of the participants
  let last = null;
  if (all_participants.length % 2 != 0) {
    last = all_participants[all_participants.length - 1];
    all_participants = all_participants.slice(0, all_participants.length - 1);
  }

  let trials = 0;
  const MAX_TRIALS = 5000;
  let stop = false;

  // paired usernames
  let pairs = [];
  // paired userIds
  let pairs_to_store = [];

  while (pairs.length != all_participants.length / 2 && stop != true) {
    pairs = [];
    pairs_to_store = [];
    trials += 1;

    shuffleArray(all_participants);
    const home = all_participants.slice(
      0,
      Math.floor(all_participants.length / 2)
    );
    const away = all_participants.slice(home.length, all_participants.length);

    // create pairs
    for (let m = 0; m < all_participants.length / 2; m += 1) {
      if (
        previous_pairs.includes(`${home[m].userId}_${away[m].userId}`) ||
        previous_pairs.includes(`${away[m].userId}_${home[m].userId}`)
      ) {
        break;
      } else {
        pairs.push([home[m], away[m]]);
        pairs_to_store.push({
          date: current_date,
          pair: `${home[m].userId}_${away[m].userId}`,
          name_1: home[m].name,
          name_2: away[m].name,
          username_1: home[m].username,
          username_2: away[m].username,
        });
      }
    }
    if (trials == MAX_TRIALS) {
      stop = true;
      pairs = [];
      pairs_to_store = [];
    }
  }

  if (stop != true) {
    // deal with unpaired if odd number of participants
    if (last) {
      // loop over pairs
      for (let i = 0; i < pairs.length; i = i + 1) {
        let pair = pairs[i];
        if (
          !previous_pairs.includes(`${pair[0].userId}_${last.userId}`) &&
          !previous_pairs.includes(`${pair[1].userId}_${last.userId}`) &&
          !previous_pairs.includes(`${last.userId}_${pair[0].userId}`) &&
          !previous_pairs.includes(`${last.userId}_${pair[1].userId}`)
        ) {
          pairs.pop([pair[0], pair[1]]);
          pairs.push([pair[0], pair[1], last]);

          // update pairs to store
          pairs_to_store.push({
            date: current_date,
            pair: `${pair[0].userId}_${last.userId}`,
            name_1: pair[0].name,
            name_2: last.name,
            username_1: pair[0].username,
            username_2: last.username,
          });
          pairs_to_store.push({
            date: current_date,
            pair: `${pair[1].userId}_${last.userId}`,
            name_1: pair[1].name,
            name_2: last.name,
            username_1: pair[1].username,
            username_2: last.username,
          });
          break;
        }
      }
    }

    // store pairs
    res = await store_new_pairs(pairs_to_store);

    // send messages to pairs
    for (let i = 0; i < pairs.length; i = i + 1) {
      let user_1 = parseInt(pairs[i][0].userId);
      let user_2 = parseInt(pairs[i][1].userId);

      if (pairs[i].length == 3) {
        let user_3 = parseInt(pairs[i][2].userId);

        try {
          await bot.telegram.sendMessage(
            (chat_id = user_1),
            (text =
              `Hello! as there was an odd number of participants, you've been randomly matched with @${pairs[i][1].username} and @${pairs[i][2].username} for a coffee ☕.\nHere are some details about them:\n\n` +
              match_message(
                pairs[i][1].name,
                pairs[i][1].occupation,
                pairs[i][1].instagram,
                pairs[i][1].linkedin
              ) +
              " and " +
              match_message(
                pairs[i][2].name,
                pairs[i][2].occupation,
                pairs[i][2].instagram,
                pairs[i][2].linkedin
              ) +
              `\n\nFeel free to coordinate a time and location that works for both of you. Enjoy!`)
          );
        } catch (error) {
          console.log(error);
        }
        try {
          await bot.telegram.sendMessage(
            (chat_id = user_2),
            (text =
              `Hello! as there was an odd number of participants, you've been randomly matched with @${pairs[i][0].username} and @${pairs[i][2].username} for a coffee ☕.\nHere are some details about them:\n\n` +
              match_message(
                pairs[i][0].name,
                pairs[i][0].occupation,
                pairs[i][0].instagram,
                pairs[i][0].linkedin
              ) +
              " and " +
              match_message(
                pairs[i][2].name,
                pairs[i][2].occupation,
                pairs[i][2].instagram,
                pairs[i][2].linkedin
              ) +
              `\n\nFeel free to coordinate a time and location that works for both of you. Enjoy!`)
          );
        } catch (error) {
          console.log(error);
        }

        try {
          await bot.telegram.sendMessage(
            (chat_id = user_3),
            (text =
              `Hello! as there was an odd number of participants, you've been randomly matched with @${pairs[i][0].username} and @${pairs[i][1].username} for a coffee ☕.\nHere are some details about them:\n\n` +
              match_message(
                pairs[i][0].name,
                pairs[i][0].occupation,
                pairs[i][0].instagram,
                pairs[i][0].linkedin
              ) +
              " and " +
              match_message(
                pairs[i][1].name,
                pairs[i][1].occupation,
                pairs[i][1].instagram,
                pairs[i][1].linkedin
              ) +
              `\n\nFeel free to coordinate a time and location that works for both of you. Enjoy!`)
          );
        } catch (error) {
          console.log(error);
        }
      } else {
        try {
          await bot.telegram.sendMessage(
            (chat_id = user_1),
            (text =
              `Hello! You've been randomly matched with @${pairs[i][1].username} for a coffee ☕.\nHere are some details about them:\n\n` +
              match_message(
                pairs[i][1].name,
                pairs[i][1].occupation,
                pairs[i][1].instagram,
                pairs[i][1].linkedin
              ) +
              `\n\nFeel free to coordinate a time and location that works for both of you. Enjoy!`)
          );
        } catch (error) {
          console.log(error);
        }
        try {
          await bot.telegram.sendMessage(
            (chat_id = user_2),
            (text =
              `Hello! You've been randomly matched with @${pairs[i][0].username} for a coffee ☕.\nHere are some details about them:\n\n` +
              match_message(
                pairs[i][0].name,
                pairs[i][0].occupation,
                pairs[i][0].instagram,
                pairs[i][0].linkedin
              ) +
              `\n\nFeel free to coordinate a time and location that works for both of you. Enjoy!`)
          );
        } catch (error) {
          console.log(error);
        }
      }
    }
  } else {
    console.log("Can't form pairs");
  }

  console.log("new", pairs);

  return {
    statusCode: 200,
  };
};
