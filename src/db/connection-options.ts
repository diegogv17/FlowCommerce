import type { Options } from 'postgres';

// Opciones del cliente postgres según dónde esté la base.
//
// Supabase ofrece dos conexiones:
//   - Directa (puerto 5432): sin pooler. Para migraciones y para un servidor
//     de larga vida.
//   - Pooler (Supavisor): en modo «transacción» (puerto 6543) NO admite
//     prepared statements, así que el driver debe crearlas sin nombre
//     (prepare: false); si no, las consultas fallan de forma intermitente.
// Se detecta por el puerto 6543 o por ?pgbouncer=true en la URL, y se puede
// forzar con DATABASE_PREPARE=false.
//
// SSL: Supabase lo exige. postgres.js lo activa con ?sslmode=require en la
// URL; aquí no se toca para no romper la base local de desarrollo (docker).

export function usesTransactionPooler(databaseUrl: string): boolean {
  try {
    const url = new URL(databaseUrl);
    return url.port === '6543' || url.searchParams.get('pgbouncer') === 'true';
  } catch {
    return false;
  }
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function connectionOptions(
  databaseUrl: string,
  env: Record<string, string | undefined> = process.env,
): Options<Record<string, never>> {
  return {
    // Con un pooler externo el pool propio debe ser chico: cada conexión
    // cuenta contra el límite del plan de Supabase. Regla: instancias de la
    // API × DATABASE_POOL_MAX ≤ conexiones que permite el pooler del plan.
    max: positiveInt(env.DATABASE_POOL_MAX, 10),
    // Cierra conexiones ociosas (s) para devolverlas al pooler cuando baja
    // el tráfico, y las renueva cada cierto tiempo (s) para repartir la
    // carga si el pooler o la base se reinician.
    idle_timeout: positiveInt(env.DATABASE_IDLE_TIMEOUT_S, 20),
    max_lifetime: positiveInt(env.DATABASE_MAX_LIFETIME_S, 60 * 30),
    // Falla rápido si la base no responde, en vez de colgar la petición.
    connect_timeout: positiveInt(env.DATABASE_CONNECT_TIMEOUT_S, 10),
    prepare:
      env.DATABASE_PREPARE === 'false'
        ? false
        : !usesTransactionPooler(databaseUrl),
  };
}
