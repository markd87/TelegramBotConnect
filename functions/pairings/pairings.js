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
      q.Paginate(q.Match(q.Index("participants"), true)),
      q.Lambda("user", {
        userId: q.Select(["data", "userId"], q.Get(q.Var("user"))),
        username: q.Select(["data", "username"], q.Get(q.Var("user"))),
      })
    )
  );
}

async function get_previous_pairs() {
  return await client.query(
    q.Map(
      q.Paginate(q.Documents(q.Collection("pairs"))),
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

exports.handler = async function (event, context) {
  console.log("Received event:", event);

  let all_participants = await get_all_participants();
  all_participants = all_participants["data"];

  let previous_pairs = await get_previous_pairs();
  previous_pairs = previous_pairs["data"].map((el) => el.pair);

  console.log(all_participants);
  console.log(previous_pairs);

  shuffleArray(all_participants);

  // check if there are odd number of participants
  // then put aside one of the participants
  let last = null;
  if (all_participants.length % 2 != 0) {
    last = all_participants[all_participants.length - 1];
    all_participants = all_participants.slice(0, all_participants.length - 1);
  }

  let trials = 0;
  const MAX_TRIALS = 1000;
  let stop = false;

  // paired usernames
  let pairs = [];
  // paired userIds
  let pairs_to_store = [];

  while (pairs.length != all_participants.length / 2 && stop != true) {
    pairs = [];
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
        pairs_to_store.push({ pair: `${home[m].userId}_${away[m].userId}` });
      }
    }
    if (trials == MAX_TRIALS) {
      stop = true;
    }
  }

  if (stop != true) {
    // store pairs
    res = await store_new_pairs(pairs_to_store);

    console.log("SENDING MESSAGES");
    console.log(pair[0].userId);
    console.log(pair[1].userId);
    // send messages to pairs
    console.log(bot);
    console.log(bot.telegram);

    bot.start((ctx) => {
      pairs.forEach((pair) => {
        ctx.telegram.sendMessage(
          pair[0].userId,
          `Hello! You've been randomly matched with @${pair[1].username} for a coffee meetup. \nI hope you both have a great time getting to know each other over a cup of coffee. \nFeel free to coordinate a time and location that works for both of you. Enjoy!`
        );
        ctx.telegram.sendMessage(
          pair[1].userId,
          `Hello! You've been randomly matched with @${pair[0].username} for a coffee meetup. \nI hope you both have a great time getting to know each other over a cup of coffee. \nFeel free to coordinate a time and location that works for both of you. Enjoy!`
        );
      });
    });

    // pairs.forEach((pair) => {
    //   bot.telegram.sendMessage(
    //     pair[0].userId,
    //     `Hello! You've been randomly matched with @${pair[1].username} for a coffee meetup. \nI hope you both have a great time getting to know each other over a cup of coffee. \nFeel free to coordinate a time and location that works for both of you. Enjoy!`
    //   );
    //   bot.telegram.sendMessage(
    //     pair[1].userId,
    //     `Hello! You've been randomly matched with @${pair[0].username} for a coffee meetup. \nI hope you both have a great time getting to know each other over a cup of coffee. \nFeel free to coordinate a time and location that works for both of you. Enjoy!`
    //   );
    // });
  } else {
    console.log("Can't form pairs");
  }

  console.log(trials);
  console.log("new", pairs);

  return {
    statusCode: 200,
  };
};
