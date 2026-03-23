import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('members').select('*');
  console.log("Error:", error);
  console.log("Data:", data);
}

check();
