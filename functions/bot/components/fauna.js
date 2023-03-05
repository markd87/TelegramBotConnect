const faunadb = require("faunadb");

const client = new faunadb.Client({ secret: process.env.FAUNA_SECRET_KEY });
const q = faunadb.query;

exports.newUser = (id, name, username) => {
  console.log(id);

  return new Promise((res, rej) => {
    client
      .query(
        q.Create(q.Collection("user"), {
          data: {
            userId: id,
            participate: true,
            name: name,
            username: username,
          },
        })
      )
      .then((ret) => {
        res(true);
      })
      .catch((err) => {
        console.log(err);
        res(false);
      });
  });
};
