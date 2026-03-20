import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import 'https://deno.land/x/dotenv/load.ts'
import { config } from '../supabase/functions/_shared/config.ts'

const SUPABASE_URL = config.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = config.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .not('payment_data', 'is', null)
    .order('created_at', { ascending: false })
    .limit(3)
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log(JSON.stringify(data, null, 2))
  }
}

main()
