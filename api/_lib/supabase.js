import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://frpbnexgcxfjpsrlsylt.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZycGJuZXhnY3hmanBzcmxzeWx0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY0NzI4NiwiZXhwIjoyMDk0MjIzMjg2fQ.yuAKh44jIVoSgxpmHY_a-kx2FrtkxfoENgygBDEZiuk';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});
