// Variables de entorno del frontend (Vite las inyecta al construir).
// Las VITE_* son públicas: nunca pongas aquí secretos.
export const env = {
  apiUrl: ((import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000/api/v1').replace(/\/$/, ''),
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '',
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '',
}
