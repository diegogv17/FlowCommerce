import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { getServerSupabase } from '@/lib/supabase/server';
import { safeNext } from '@/features/auth/utils';

// Destino de los enlaces que manda Supabase por correo (confirmar registro,
// recuperar contraseña, invitaciones). Convierte el enlace en una sesión
// (cookies) y redirige a ?next.
//  - Flujo PKCE (?code=…): exchangeCodeForSession.
//  - Plantillas con token_hash (?token_hash=…&type=…): verifyOtp.
//  - Flujo implícito (#access_token=… en el hash): el hash no llega al
//    servidor, pero el navegador lo conserva en la redirección; lo procesa la
//    página de destino (p. ej. /restablecer-contrasena).
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const defaultNext = type === 'recovery' || type === 'invite' ? '/restablecer-contrasena' : '/dashboard';
  const next = safeNext(url.searchParams.get('next'), defaultNext);

  const failure = new URL('/login', url.origin);
  failure.searchParams.set('error', 'link');

  if (url.searchParams.get('error') || url.searchParams.get('error_description')) {
    return NextResponse.redirect(failure);
  }

  if (code || (tokenHash && type)) {
    const supabase = await getServerSupabase();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ type: type as EmailOtpType, token_hash: tokenHash as string });
    if (error) return NextResponse.redirect(failure);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
