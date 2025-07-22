import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // or SERVICE_ROLE_KEY for server-side
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase