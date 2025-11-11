// Temporarily disabled Supabase to fix TypeError
// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
// const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// console.log('Supabase URL:', supabaseUrl);
// console.log('Supabase Key exists:', !!supabaseAnonKey);

// if (!supabaseUrl || !supabaseAnonKey) {
//   console.error('Missing Supabase environment variables');
//   throw new Error('Missing Supabase environment variables. Please check your .env file.');
// }

// export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Temporary mock for testing
export const supabase = {
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: null, error: null }),
    update: () => ({ data: null, error: null }),
    delete: () => ({ data: null, error: null }),
  }),
};
