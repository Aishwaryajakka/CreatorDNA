import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

const email = 'aishwaryajakka@hotmail.com'
const password = 'Pass1234'

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: {
    display_name: 'Ash',
    username: 'aishwaryajakka',
  },
})

if (error) {
  console.error(error)
  process.exit(1)
}

console.log('Created user:', data.user.id)