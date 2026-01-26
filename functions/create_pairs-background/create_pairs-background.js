const { Telegraf } = require("telegraf");

let botInstance = null;
let supabaseInstance = null;

function getBot() {
  if (!botInstance) {
    botInstance = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
  }
  return botInstance;
}

function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = require('../bot/components/db');
  }
  return supabaseInstance;
}


function shuffleArray(array) {
  // in place shuffling of array
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

const BATCH_SIZE = 200;

function createPairs(participants, previousPairs, current_date, options = {}) {
  const maxTrials = options.maxTrials ?? 15000;
  const shuffle = options.shuffle ?? shuffleArray;
  const working = participants.slice();

  shuffle(working);

  let last = null;
  if (working.length % 2 !== 0) {
    last = working.pop();
  }

  let trials = 0;
  let stop = false;
  let pairs = [];
  let pairs_to_store = [];
  let lastPlacementPossible = null;

  while (!stop) {
    pairs = [];
    pairs_to_store = [];
    trials += 1;

    shuffle(working);
    const home = working.slice(0, working.length / 2);
    const away = working.slice(working.length / 2);

    for (let i = 0; i < home.length; i++) {
      const id1 = home[i].userId;
      const id2 = away[i].userId;
      const key1 = `${id1}_${id2}`;
      const key2 = `${id2}_${id1}`;

      if (previousPairs.has(key1) || previousPairs.has(key2)) {
        break;
      }

      pairs.push([home[i], away[i]]);
      pairs_to_store.push({
        date: current_date,
        pair: key1,
        name_1: home[i].name,
        name_2: away[i].name,
        username_1: home[i].username,
        username_2: away[i].username,
      });
    }

    if (pairs.length !== working.length / 2) {
      if (trials === maxTrials) {
        stop = true;
      }
      continue;
    }

    if (last) {
      let pairedWithLast = false;
      let possibleSlots = 0;
      for (let i = 0; i < pairs.length; i++) {
        const [p1, p2] = pairs[i];

        const seenBefore =
          previousPairs.has(`${p1.userId}_${last.userId}`) ||
          previousPairs.has(`${p2.userId}_${last.userId}`) ||
          previousPairs.has(`${last.userId}_${p1.userId}`) ||
          previousPairs.has(`${last.userId}_${p2.userId}`);

        if (!seenBefore) {
          possibleSlots += 1;
          pairs[i] = [p1, p2, last];
          pairedWithLast = true;
          pairs_to_store.push(
            {
              date: current_date,
              pair: `${p1.userId}_${last.userId}`,
              name_1: p1.name,
              name_2: last.name,
              username_1: p1.username,
              username_2: last.username,
            },
            {
              date: current_date,
              pair: `${p2.userId}_${last.userId}`,
              name_1: p2.name,
              name_2: last.name,
              username_1: p2.username,
              username_2: last.username,
            }
          );
          break;
        }
      }
      if (!pairedWithLast) {
        lastPlacementPossible = possibleSlots > 0;
        pairs = [];
        pairs_to_store = [];
        if (trials === maxTrials) {
          stop = true;
        }
        continue;
      }
    }

    break;
  }

  if (stop) {
      pairs = [];
      pairs_to_store = [];
  }

  return { pairs, pairs_to_store, stop, trials, lastPlacementPossible };
}

async function getAllParticipants() {
  const supabase = getSupabase();
  let allUsers = [];
  let from = 0;
  let to = BATCH_SIZE - 1;

  while (true) {
    const { data, error } = await supabase
      .from('user')
      .select('userId, username, name, occupation, instagram, linkedin')
      .eq('participate', true)
      .range(from, to);

    if (error) {
      console.error('Error fetching participants:', error);
      break;
    }

    if (!data || data.length === 0) break;

    allUsers = allUsers.concat(data);

    if (data.length < BATCH_SIZE) break; // last page

    from += BATCH_SIZE;
    to += BATCH_SIZE;
  }

  return allUsers;
}

async function getPreviousPairs() {
  const supabase = getSupabase();
  const BATCH_SIZE = 1000;
  let all = [];
  let from = 0;
  let to = BATCH_SIZE - 1;

  while (true) {
    const { data, error } = await supabase
      .from('pairs')
      .select('pair')
      .range(from, to);

    if (error) {
      console.error(error);
      break;
    }

    if (!data || data.length === 0) break;

    all = all.concat(data.map((row) => row.pair));

    if (data.length < BATCH_SIZE) break;

    from += BATCH_SIZE;
    to += BATCH_SIZE;
  }

  return all;
}

async function getLastPairDate() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('pairs')
    .select('date')
    .order('date', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    console.error(error);
    return null;
  }

  return data[0].date;
}

async function storeNewPairs(pairs) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('pairs')
    .insert(pairs);

  if (error) {
    console.error('Error inserting new pairs:', error);
    return false;
  }

  return true;
}


function matchMessage(name, occupation, instagram, linkedin) {
  let message = `Name: ${name}\nOccupation: ${occupation}`;

  if (instagram) {
    message += `\nInstagram: https://www.instagram.com/${instagram}/`;
  }

  if (linkedin) {
    message += `\nLinkedIn: ${linkedin}`;
  }

  return message;
}



exports.handler = async function (event, context) {
  console.log('Received event:', event);

  const bot = getBot();
  const current_date = new Date().toISOString().slice(0, 10);
  const previous_pairs = new Set(await getPreviousPairs()); // set of 'id1_id2'
  const last_date = await getLastPairDate(); // string in YYYY-MM-DD format

  if (last_date === current_date) {
    console.log('Already sent');
    return { statusCode: 200 };
  }

  const participants = await getAllParticipants();
  const { pairs, pairs_to_store, stop, trials, lastPlacementPossible } = createPairs(
    participants,
    previous_pairs,
    current_date
  );

  console.log(participants.length);
  console.log(participants.length / 2);
  console.log('previous pairs:', previous_pairs.size);
  console.log('pairing trials:', trials);

  if (stop) {
    if (lastPlacementPossible === false) {
      console.log('odd participant had no valid trio placements');
    }
    console.log("Can't form pairs");
    return { statusCode: 200 };
  }

  if (!stop) {
    const stored = await storeNewPairs(pairs_to_store);

    if (!stored) {
      console.log('Failed to store new pairs');
      return { statusCode: 500 };
    }

    for (const pair of pairs) {
      const u1 = parseInt(pair[0].userId);
      const u2 = parseInt(pair[1].userId);
      const chat1 = await bot.telegram.getChat(u1);
      const chat2 = await bot.telegram.getChat(u2);

      const uname1 = chat1.username;
      const uname2 = chat2.username;

      if (pair.length === 3) {
        const u3 = parseInt(pair[2].userId);
        const chat3 = await bot.telegram.getChat(u3);
        const uname3 = chat3.username;

        const text = (a, b) =>
          `Hello! As there was an odd number of participants, you've been randomly matched with @${a.username} and @${b.username} for a coffee ☕.\nHere are some details about them:\n\n` +
          matchMessage(a.name, a.occupation, a.instagram, a.linkedin) +
          ' and ' +
          matchMessage(b.name, b.occupation, b.instagram, b.linkedin) +
          `\n\nFeel free to coordinate a time and location that works for both of you. Enjoy!`;

        try {
          await bot.telegram.sendMessage(u1, text(pair[1], pair[2]));
          await bot.telegram.sendMessage(u2, text(pair[0], pair[2]));
          await bot.telegram.sendMessage(u3, text(pair[0], pair[1]));
        } catch (e) {
          console.error('Message error (3-person):', e);
        }

        console.log(u1, u2, u3);
      } else {
        const text1 =
          `Hello! You've been randomly matched with @${uname2} for a coffee ☕.\nHere are some details about them:\n\n` +
          matchMessage(pair[1].name, pair[1].occupation, pair[1].instagram, pair[1].linkedin) +
          `\n\nFeel free to coordinate a time and location that works for both of you. Enjoy!`;

        const text2 =
          `Hello! You've been randomly matched with @${uname1} for a coffee ☕.\nHere are some details about them:\n\n` +
          matchMessage(pair[0].name, pair[0].occupation, pair[0].instagram, pair[0].linkedin) +
          `\n\nFeel free to coordinate a time and location that works for both of you. Enjoy!`;

        try {
          await bot.telegram.sendMessage(u1, text1);
          await bot.telegram.sendMessage(u2, text2);
        } catch (e) {
          console.error('Message error (pair):', e);
        }

        console.log(u1, u2);
      }
    }
  } else {
    console.log("Can't form pairs");
  }

  console.log('new pairs:', pairs);

  return {
    statusCode: 200,
  };
};

exports._internal = {
  createPairs,
};


// exports.handler = async function (event, context) {
//   console.log("Received event:", event);

//   // current date as string
//   let current_date = new Date().toJSON().slice(0, 10);

//   let previous_pairs = await get_previous_pairs();

//   let last_date = previous_pairs["data"].slice(-1)[0].pair.date;

//   // check if pairs have already been store today, meaning messages have been sent
//   // don't send again
//   if (last_date === current_date) {
//     console.log("Already sent");
//     return {
//       statusCode: 200,
//     };
//   }

//   previous_pairs = previous_pairs["data"].map((el) => el.pair.pair);

//   let all_participants = await get_all_participants();
//   all_participants = all_participants["data"];

//   shuffleArray(all_participants);

//   // check if there are odd number of participants
//   // then put aside one of the participants
//   let last = null;
//   if (all_participants.length % 2 != 0) {
//     last = all_participants[all_participants.length - 1];
//     all_participants = all_participants.slice(0, all_participants.length - 1);
//   }

//   let trials = 0;
//   const MAX_TRIALS = 5000;
//   let stop = false;

//   // paired usernames
//   let pairs = [];
//   // paired userIds
//   let pairs_to_store = [];

//   while (pairs.length != all_participants.length / 2 && stop != true) {
//     pairs = [];
//     pairs_to_store = [];
//     trials += 1;

//     shuffleArray(all_participants);
//     const home = all_participants.slice(
//       0,
//       Math.floor(all_participants.length / 2)
//     );
//     const away = all_participants.slice(home.length, all_participants.length);

//     // create pairs
//     for (let m = 0; m < all_participants.length / 2; m += 1) {
//       if (
//         previous_pairs.includes(`${home[m].userId}_${away[m].userId}`) ||
//         previous_pairs.includes(`${away[m].userId}_${home[m].userId}`)
//       ) {
//         break;
//       } else {
//         pairs.push([home[m], away[m]]);
//         pairs_to_store.push({
//           date: current_date,
//           pair: `${home[m].userId}_${away[m].userId}`,
//           name_1: home[m].name,
//           name_2: away[m].name,
//           username_1: home[m].username,
//           username_2: away[m].username,
//         });
//       }
//     }
//     if (trials == MAX_TRIALS) {
//       stop = true;
//       pairs = [];
//       pairs_to_store = [];
//     }
//   }

//   if (stop != true) {
//     // deal with unpaired if odd number of participants
//     if (last) {
//       // loop over pairs
//       for (let i = 0; i < pairs.length; i = i + 1) {
//         let pair = pairs[i];
//         if (
//           !previous_pairs.includes(`${pair[0].userId}_${last.userId}`) &&
//           !previous_pairs.includes(`${pair[1].userId}_${last.userId}`) &&
//           !previous_pairs.includes(`${last.userId}_${pair[0].userId}`) &&
//           !previous_pairs.includes(`${last.userId}_${pair[1].userId}`)
//         ) {
//           pairs.pop([pair[0], pair[1]]);
//           pairs.push([pair[0], pair[1], last]);

//           // update pairs to store
//           pairs_to_store.push({
//             date: current_date,
//             pair: `${pair[0].userId}_${last.userId}`,
//             name_1: pair[0].name,
//             name_2: last.name,
//             username_1: pair[0].username,
//             username_2: last.username,
//           });
//           pairs_to_store.push({
//             date: current_date,
//             pair: `${pair[1].userId}_${last.userId}`,
//             name_1: pair[1].name,
//             name_2: last.name,
//             username_1: pair[1].username,
//             username_2: last.username,
//           });
//           break;
//         }
//       }
//     }

//     // store pairs
//     res = await store_new_pairs(pairs_to_store);

//     // send messages to pairs
//     for (let i = 0; i < pairs.length; i = i + 1) {
//       let user_1 = parseInt(pairs[i][0].userId);
//       let user_2 = parseInt(pairs[i][1].userId);

//       chat_1 = await bot.telegram.getChat(user_1);
//       username_1 = chat_1.username;

//       chat_2 = await bot.telegram.getChat(user_2);
//       username_2 = chat_2.username;

//       if (pairs[i].length == 3) {
//         let user_3 = parseInt(pairs[i][2].userId);

//         chat_3 = await bot.telegram.getChat(user_3);
//         username_3 = chat_3.username;

//         try {
//           await bot.telegram.sendMessage(
//             (chat_id = user_1),
//             (text =
//               `Hello! as there was an odd number of participants, you've been randomly matched with @${username_2} and @${username_3} for a coffee ☕.\nHere are some details about them:\n\n` +
//               match_message(
//                 pairs[i][1].name,
//                 pairs[i][1].occupation,
//                 pairs[i][1].instagram,
//                 pairs[i][1].linkedin
//               ) +
//               " and " +
//               match_message(
//                 pairs[i][2].name,
//                 pairs[i][2].occupation,
//                 pairs[i][2].instagram,
//                 pairs[i][2].linkedin
//               ) +
//               `\n\nFeel free to coordinate a time and location that works for both of you. Enjoy!`)
//           );
//         } catch (error) {
//           console.log(error);
//         }
//         try {
//           await bot.telegram.sendMessage(
//             (chat_id = user_2),
//             (text =
//               `Hello! as there was an odd number of participants, you've been randomly matched with @${username_1} and @${username_3} for a coffee ☕.\nHere are some details about them:\n\n` +
//               match_message(
//                 pairs[i][0].name,
//                 pairs[i][0].occupation,
//                 pairs[i][0].instagram,
//                 pairs[i][0].linkedin
//               ) +
//               " and " +
//               match_message(
//                 pairs[i][2].name,
//                 pairs[i][2].occupation,
//                 pairs[i][2].instagram,
//                 pairs[i][2].linkedin
//               ) +
//               `\n\nFeel free to coordinate a time and location that works for both of you. Enjoy!`)
//           );
//         } catch (error) {
//           console.log(error);
//         }

//         try {
//           await bot.telegram.sendMessage(
//             (chat_id = user_3),
//             (text =
//               `Hello! as there was an odd number of participants, you've been randomly matched with @${username_1} and @${username_2} for a coffee ☕.\nHere are some details about them:\n\n` +
//               match_message(
//                 pairs[i][0].name,
//                 pairs[i][0].occupation,
//                 pairs[i][0].instagram,
//                 pairs[i][0].linkedin
//               ) +
//               " and " +
//               match_message(
//                 pairs[i][1].name,
//                 pairs[i][1].occupation,
//                 pairs[i][1].instagram,
//                 pairs[i][1].linkedin
//               ) +
//               `\n\nFeel free to coordinate a time and location that works for both of you. Enjoy!`)
//           );
//         } catch (error) {
//           console.log(error);
//         }

//         // log message sent
//         console.log(user_1, user_2, user_3);
//       } else {
//         try {
//           await bot.telegram.sendMessage(
//             (chat_id = user_1),
//             (text =
//               `Hello! You've been randomly matched with @${username_2} for a coffee ☕.\nHere are some details about them:\n\n` +
//               match_message(
//                 pairs[i][1].name,
//                 pairs[i][1].occupation,
//                 pairs[i][1].instagram,
//                 pairs[i][1].linkedin
//               ) +
//               `\n\nFeel free to coordinate a time and location that works for both of you. Enjoy!`)
//           );
//         } catch (error) {
//           console.log(error);
//         }
//         try {
//           await bot.telegram.sendMessage(
//             (chat_id = user_2),
//             (text =
//               `Hello! You've been randomly matched with @${username_1} for a coffee ☕.\nHere are some details about them:\n\n` +
//               match_message(
//                 pairs[i][0].name,
//                 pairs[i][0].occupation,
//                 pairs[i][0].instagram,
//                 pairs[i][0].linkedin
//               ) +
//               `\n\nFeel free to coordinate a time and location that works for both of you. Enjoy!`)
//           );
//         } catch (error) {
//           console.log(error);
//         }

//         // log message sent
//         console.log(user_1, user_2);
//       }
//     }
//   } else {
//     console.log("Can't form pairs");
//   }

//   console.log("new", pairs);

//   return {
//     statusCode: 200,
//   };
// };
