import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    const missing = []
    if (!supabaseUrl) missing.push('VITE_SUPABASE_URL')
    if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY')
    throw new Error(`Missing Supabase environment variables: ${missing.join(', ')}`)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
