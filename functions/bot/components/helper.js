exports.getUser = (info) => {
  const {
    id,
    is_bot: isBot,
    first_name: firstName,
    last_name: lastName,
    username: username,
  } = info;
  const name = (
    firstName ? firstName : "" + " " + lastName ? lastName : ""
  ).trim();
  return { id, isBot, name, username };
};
