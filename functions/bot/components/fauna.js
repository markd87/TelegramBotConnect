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

exports.pauseUser = (id) => {
  return new Promise((res, rej) => {
    client
      .query(
        q.Let(
          {
            userRef: q.Ref(q.Collection("user"), id),
            userExists: q.Exists(q.Var("userRef")),
            user: q.If(q.Var("userExists"), q.Get(q.Var("userRef")), null),
          },
          q.If(
            q.Var("userExists"),
            q.Update(q.Ref(q.Collection("user"), id), {
              data: { participate: false },
            }),
            null
          )
        )
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

exports.resumeUser = (id) => {
  return new Promise((res, rej) => {
    client
      .query(
        q.Let(
          {
            userRef: q.Ref(q.Collection("user"), id),
            userExists: q.Exists(q.Var("userRef")),
            user: q.If(q.Var("userExists"), q.Get(q.Var("userRef")), null),
          },
          q.If(
            q.Var("userExists"),
            q.Update(q.Ref(q.Collection("user"), id), {
              data: { participate: True },
            }),
            null
          )
        )
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

exports.removeUser = (id) => {
  return new Promise((res, rej) => {
    client
      .query(
        q.Let(
          {
            userRef: q.Ref(q.Collection("user"), id),
            userExists: q.Exists(q.Var("userRef")),
          },
          q.If(
            q.Var("userExists"),
            q.Delete(q.Ref(q.Collection("user"), id)),
            null
          )
        )
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
