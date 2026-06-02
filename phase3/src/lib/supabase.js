/**
 * supabase.js
 * -----------
 * Creates and exports a single Supabase client instance.
 * Import this everywhere you need database or auth access.
 *
 * Pattern: singleton — one client for the whole app.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession:    true,   // keep user logged in across page refreshes
    autoRefreshToken:  true,   // refresh JWT automatically
    detectSessionInUrl: true,  // handle OAuth redirects
  }
})
