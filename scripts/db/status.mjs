// Estado de la base de datos de un ambiente (staging/production) sin
// imprimir nunca la contraseña. Lo usan los workflows de CD y se puede correr
// en local:  DATABASE_URL=... node scripts/db/status.mjs [--fail-if-pending]
//
// Muestra: servidor, migraciones aplicadas vs. las del repo (pendientes) y
// tablas de "public" sin Row Level Security.
import { readFileSync } from 'node:fs';
import postgres from 'postgres';

const url = process.env.SUPABASE_DB_URL || process.env.DIRECT_URL || process.env.DATABASE_URL;
const failIfPending = process.argv.includes('--fail-if-pending');

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

if (!url) fail('Falta SUPABASE_DB_URL (secreto del ambiente en GitHub).');

let parsed;
try {
  parsed = new URL(url);
} catch {
  fail('SUPABASE_DB_URL no es una URL válida. ¿La contraseña tiene caracteres especiales sin codificar (%40 para @, %23 para #)?');
}

// La conexión directa db.<ref>.supabase.co solo tiene IPv6 y los runners de
// GitHub Actions solo IPv4: hay que usar el Session pooler (puerto 5432).
if (/^db\.[a-z0-9]+\.supabase\.co$/.test(parsed.hostname) && process.env.GITHUB_ACTIONS) {
  fail(
    'SUPABASE_DB_URL usa la conexión directa (IPv6), que GitHub Actions no alcanza. ' +
      'Usa la cadena "Session pooler" de Supabase → Connect (host *.pooler.supabase.com, puerto 5432, usuario postgres.<ref>).',
  );
}
if (parsed.port === '6543') {
  fail('El puerto 6543 es el Transaction pooler: sirve para la API, no para migraciones. Usa el Session pooler (5432).');
}

const isLocal = ['localhost', '127.0.0.1'].includes(parsed.hostname);
const sql = postgres(url, {
  max: 1,
  ssl: isLocal ? false : 'require',
  connect_timeout: 15,
  prepare: false,
  onnotice: () => {},
});

const summary = [];
const log = (line = '') => {
  console.log(line);
  summary.push(line);
};

try {
  const [server] = await sql`select current_database() as db, current_user as "user", version() as version`;
  log(`### Base de datos: \`${parsed.hostname}\``);
  log(`- Base: \`${server.db}\` · usuario: \`${server.user}\``);
  log(`- Servidor: ${server.version.split(',')[0]}`);

  const journal = JSON.parse(readFileSync('src/db/migrations/meta/_journal.json', 'utf8'));
  const [{ exists }] = await sql`select to_regclass('drizzle.__drizzle_migrations') is not null as exists`;
  const applied = exists
    ? new Set((await sql`select created_at from drizzle.__drizzle_migrations`).map((r) => Number(r.created_at)))
    : new Set();
  const pending = journal.entries.filter((entry) => !applied.has(Number(entry.when)));

  log(`- Migraciones: ${journal.entries.length - pending.length}/${journal.entries.length} aplicadas`);
  if (pending.length) {
    log(`- Pendientes (${pending.length}):`);
    for (const entry of pending) log(`  - \`${entry.tag}\``);
  }

  const noRls = await sql`
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity order by 1`;
  if (noRls.length) {
    log(`- ⚠️ Tablas de public SIN RLS (la anon key de Supabase podría leerlas): ${noRls.map((r) => r.relname).join(', ')}`);
  } else {
    log('- RLS activo en todas las tablas de public ✅');
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    const { appendFileSync } = await import('node:fs');
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary.join('\n')}\n`);
  }
  if (failIfPending && pending.length) fail(`${pending.length} migraciones pendientes.`);
} catch (error) {
  fail(`No se pudo consultar la base: ${error.message}`);
} finally {
  await sql.end({ timeout: 5 });
}
