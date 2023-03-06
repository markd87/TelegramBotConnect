const faunadb = require("faunadb");

const client = new faunadb.Client({ secret: process.env.FAUNA_SECRET_KEY });
const q = faunadb.query;

function shuffleArray(array) {
  // in place shuffling of array
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

exports.handler = async function (event, context) {
  console.log("Received event:", event);

  let all_paricipants = await client.query(
    Map(
      Paginate(Match(Index("participants"), true)),
      Lambda("user", {
        userId: Select(["data", "userId"], Get(Var("user"))),
      })
    )
  );

  // shuffleArray(all_paricipants);

  console.log(all_paricipants);

  let last = null;
  if (all_paricipants.length % 2 != 0) {
    last = all_paricipants[all_paricipants.length - 1];
    all_paricipants = all_paricipants.slice(0, all_paricipants.length - 1);
  }

  return {
    statusCode: 200,
  };
};
