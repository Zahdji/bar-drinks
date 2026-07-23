if (typeof global.URL === 'undefined') {
  require('react-native-url-polyfill/auto');
}
import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project-ref.supabase.co';
const SUPABASE_URL = (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))
  ? rawUrl
  : `https://${rawUrl}`;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export interface RecipeRow {
  id?: string;
  name: string;
  glass?: string;
  ice?: string;
  ingredients: { name: string; amount: string }[];
  garnish?: string;
  method?: string;
  created_at?: string;
}
