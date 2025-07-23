const supabase = require('./db');

// const client = new faunadb.Client({ secret: process.env.FAUNA_SECRET_KEY });
// const q = faunadb.query;

async function checkNewUser(id) {
  const { data, error } = await supabase
    .from('user')                   // your table name
    .select('userId')
    .eq('userId', String(id))        // ✅ force to string
    .maybeSingle();                  // ✅ allows 0 or 1 rows

    if (error) {
      console.error('Supabase error checking user:', error);
      return false;
    }

    return !data; // true if user doesn't exist
}


async function newUser(id, name, username, occupation, instagram, linkedin) {
  console.log(id)

  const { error } = await supabase
    .from('user') // replace with your actual table name
    .insert([
      {
        userId: id,
        participate: true,
        name: name,
        username: username || name,
        occupation: occupation,
        instagram: instagram,
        linkedin: linkedin,
      }
    ])

  if (error) {
    console.error(error)
    return false
  }

  return true
}

async function pauseUser(id) {
  // First, try to find the user
  const { data, error: fetchError } = await supabase
    .from('user')
    .select('userId') // assuming "id" is the primary key; fetch only what's needed
    .eq('userId', id)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      // Row not found
      return false
    }
    console.error(fetchError)
    return false
  }

  // Then, update the user's "participate" field to false
  const { error: updateError } = await supabase
    .from('user')
    .update({ participate: false })
    .eq('userId', id)

  if (updateError) {
    console.error(updateError)
    return false
  }

  return true
}



async function resumeUser(id) {
  // Step 1: Try to find the user
  const { data, error: fetchError } = await supabase
    .from('user')
    .select('userId') // or 'userId' if it's the primary key
    .eq('userId', id)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      // No such user
      return false
    }
    console.error(fetchError)
    return false
  }

  // Step 2: Update "participate" to true
  const { error: updateError } = await supabase
    .from('user')
    .update({ participate: true })
    .eq('userId', id)

  if (updateError) {
    console.error(updateError)
    return false
  }

  return true
}


async function removeUser(id) {
  const { data, error } = await supabase
    .from('user')
    .delete()
    .eq('userId', id)
    .select()

  if (error) {
    console.error(error)
    return false
  }

  return data.length > 0
}

module.exports = { checkNewUser, newUser, pauseUser, resumeUser, removeUser};