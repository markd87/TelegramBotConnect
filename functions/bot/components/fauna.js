const faunadb = require("faunadb");

const client = new faunadb.Client({ secret: process.env.FAUNA_SECRET_KEY });
const q = faunadb.query;

exports.checkNewUser = async (id) => {
  try {
    const ret = await new Promise((res, rej) => {
      client.query(q.Exists(q.Match(q.Index("userId"), id)));
    });
    res(ret);
  } catch (err) {
    console.log(err);
    res(false);
  }
};

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
            match: q.Match(q.Index("userId"), id),
            matchExists: q.Exists(q.Var("match")),
            ref: q.If(
              q.Var("matchExists"),
              q.Select("ref", q.Get(q.Var("match"))),
              null
            ),
          },
          q.If(
            q.Var("matchExists"),
            q.Update(q.Var("ref"), { data: { participate: false } }),
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
            match: q.Match(q.Index("userId"), id),
            matchExists: q.Exists(q.Var("match")),
            ref: q.If(
              q.Var("matchExists"),
              q.Select("ref", q.Get(q.Var("match"))),
              null
            ),
          },
          q.If(
            q.Var("matchExists"),
            q.Update(q.Var("ref"), { data: { participate: true } }),
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
            match: q.Match(q.Index("userId"), id),
            matchExists: q.Exists(q.Var("match")),
            ref: q.If(
              q.Var("matchExists"),
              q.Select("ref", q.Get(q.Var("match"))),
              null
            ),
          },
          q.If(q.Var("matchExists"), q.Delete(q.Var("ref")), null)
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
