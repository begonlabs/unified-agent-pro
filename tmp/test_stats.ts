import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
try { process.loadEnvFile(resolve(__dirname, '../.env.production')); } catch (e) {}

const serviceKey = process.env.VITE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(process.env.VITE_SUPABASE_URL!, serviceKey!);

async function run() {
  const userId = 'c577eb22-38b7-4304-b6ba-b8e2be7c843d';

  const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          created_at,
          messages ( created_at )
        `)
        .eq('user_id', userId);

  if (error) return console.error(error);

  let totalAll = 0;
  let total7d = 0;
  let total30d = 0;
  let total90d = 0;

  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Ojo: la base de datos de test local vs producción podría tener fechas distintas.
  // Pero calculemos sobre el total.
  conversations?.forEach(c => {
      c.messages?.forEach(m => {
          totalAll++;
          const d = new Date(m.created_at);
          if (d >= d7) total7d++;
          if (d >= d30) total30d++;
          if (d >= d90) total90d++;
      });
  });

  console.log('--- STATS MOCK ---');
  console.log('TOTAL ALL TIME:', totalAll);
  console.log('TOTAL 7 DAYS:', total7d);
  console.log('TOTAL 30 DAYS:', total30d);
  console.log('TOTAL 90 DAYS:', total90d);
  console.log('--- DB SUMMARY END ---');
}
run().catch(console.error);
