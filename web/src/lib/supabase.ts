import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/config/env'

let client: SupabaseClient | undefined

/**
 * Cliente de Supabase del navegador (una sola instancia).
 * Supabase hace el login, el registro y la recuperación de contraseña;
 * nuestra API solo verifica el token (Authorization: Bearer).
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    if (!env.supabaseUrl || !env.supabaseAnonKey) {
      throw new Error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en web/.env')
    }
    client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
    })
  }
  return client
}

export async function getAccessToken(): Promise<string | null> {
  const { data } = await getSupabase().auth.getSession()
  return data.session?.access_token ?? null
}

/** URL absoluta de una ruta del front (para los enlaces de los correos). */
export function appUrl(path: string): string {
  return `${window.location.origin}${path}`
}
