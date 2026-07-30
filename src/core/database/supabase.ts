import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl && process.env.NODE_ENV === 'production') {
  console.warn('Warning: SUPABASE_URL is not set in environment variables.');
}
if (!supabaseAnonKey && process.env.NODE_ENV === 'production') {
  console.warn('Warning: SUPABASE_ANON_KEY is not set in environment variables.');
}

// Initialize the Supabase Client with environment variables
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {},
      from: () => ({ select: () => Promise.resolve({ data: [], error: null }) })
    } as any;
