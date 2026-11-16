import { createClient } from '@supabase/supabase-js';

const getEnv = (key, fallback = '') => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return fallback;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL', 'https://gtkjhdbegudsuuecskqt.supabase.co');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY', 'sb_publishable_i7MTL33jbEYKKa4y2xJYHw_rbaN464e');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Secondary client for POS Sync (desh-digital-hub)
const posUrl = getEnv('VITE_POS_SUPABASE_URL');
const posKey = getEnv('VITE_POS_SUPABASE_ANON_KEY');

export const posSupabase = (posUrl && posKey) 
  ? createClient(posUrl, posKey) 
  : null;
