'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Field, Input } from '@/components/ui';
import { getSupabase } from '@/lib/supabase/client';
import { AuthHeading, AuthNotice } from './auth-heading';
import { PasswordInput } from './password-input';
import { authErrorMessage, isValidEmail, safeNext } from './utils';

const REMEMBER_KEY = 'fc.rememberEmail';

// Mensajes que llegan en ?error= desde /auth/callback.
const CALLBACK_ERRORS: Record<string, string> = {
  link: 'El enlace no es válido o ya venció. Pide uno nuevo.',
};

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const next = safeNext(params.get('next'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    const code = params.get('error');
    return code ? CALLBACK_ERRORS[code] ?? 'No pudimos validar el enlace.' : null;
  });

  // "Recordarme" guarda el correo en este navegador para la próxima vez.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(REMEMBER_KEY);
      if (saved) setEmail(saved);
    } catch {
      // almacenamiento no disponible
    }
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!isValidEmail(email)) return setError('Escribe un correo válido.');
    if (!password) return setError('Escribe tu contraseña.');

    setLoading(true);
    try {
      const { error: authError } = await getSupabase().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) {
        setError(authErrorMessage(authError));
        return;
      }
      try {
        if (remember) window.localStorage.setItem(REMEMBER_KEY, email.trim());
        else window.localStorage.removeItem(REMEMBER_KEY);
      } catch {
        // almacenamiento no disponible
      }
      // Limpia datos en caché de una sesión anterior (otro usuario).
      queryClient.clear();
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AuthHeading
        title="Bienvenido de nuevo"
        subtitle="Ingresa a tu panel comercial y continúa el seguimiento de tus leads."
      />

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
            required
          />
        </Field>

        <Field label="Contraseña">
          <PasswordInput
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>

        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-muted">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 rounded border-line accent-brand-500"
            />
            Recordarme
          </label>
          <Link href="/olvide-contrasena" className="font-semibold text-brand-500 hover:text-brand-600">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Iniciar sesión
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        ¿No tienes cuenta?{' '}
        <Link href="/solicitar-acceso" className="font-semibold text-brand-500 hover:text-brand-600">
          Solicita acceso
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-muted">
        ¿Vas a registrar tu empresa?{' '}
        <Link
          href={next !== '/dashboard' ? `/registro?next=${encodeURIComponent(next)}` : '/registro'}
          className="font-semibold text-ink hover:text-brand-600"
        >
          Crea una cuenta
        </Link>
      </p>
    </>
  );
}
