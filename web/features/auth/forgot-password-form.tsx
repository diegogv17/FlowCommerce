'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button, Field, Input } from '@/components/ui';
import { getSupabase } from '@/lib/supabase/client';
import { AuthHeading, AuthNotice } from './auth-heading';
import { callbackUrl, isValidEmail } from './utils';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!isValidEmail(email)) return setError('Escribe un correo válido.');
    setLoading(true);
    try {
      await getSupabase().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: callbackUrl('/restablecer-contrasena'),
      });
    } catch {
      // Respuesta neutra: no se revela si el correo existe ni si falló.
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  return (
    <>
      <AuthHeading
        title="Recupera tu contraseña"
        subtitle="Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva."
      />

      {sent ? (
        <AuthNotice tone="success">
          Si existe una cuenta con ese correo, te enviamos un enlace para restablecer la contraseña.
          Revisa tu bandeja de entrada (y la carpeta de spam).
        </AuthNotice>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error ? <AuthNotice tone="error">{error}</AuthNotice> : null}
          <Field label="Correo electrónico">
            <Input
              type="email"
              name="email"
              autoComplete="email"
              className="h-11"
              placeholder="tu@empresa.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Enviar enlace
          </Button>
        </form>
      )}

      <Link
        href="/login"
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Volver a iniciar sesión
      </Link>
    </>
  );
}
