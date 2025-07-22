export function getUser(info) {
  const {
    id,
    is_bot: isBot,
    first_name: firstName,
    last_name: lastName,
    username,
  } = info;

  const name = `${firstName || ''} ${lastName || ''}`.trim();

  return { id, isBot, name, username };
}
