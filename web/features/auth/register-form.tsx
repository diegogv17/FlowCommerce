'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { MailCheck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Field, Input } from '@/components/ui';
import { getSupabase } from '@/lib/supabase/client';
import { trackSignUp } from '@/features/marketing/track';
import { getPlan } from '@/features/marketing/plans';
import { AuthHeading, AuthNotice } from './auth-heading';
import { PasswordInput } from './password-input';
import { MIN_PASSWORD_LENGTH, authErrorMessage, callbackUrl, isValidEmail, safeNext } from './utils';

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  // Tras registrarse va a crear su empresa, salvo que venga de una invitación.
  const next = safeNext(params.get('next'), '/onboarding');

  const [name, setName] = useState('');
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  function validate() {
    const found: Record<string, string> = {};
    if (name.trim().length < 2) found.name = 'Escribe tu nombre.';
    if (!isValidEmail(email)) found.email = 'Escribe un correo válido.';
    if (password.length < MIN_PASSWORD_LENGTH) {
      found.password = `Usa al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }
    setErrors(found);
    return Object.keys(found).length === 0;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const { data, error: authError } = await getSupabase().auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim() },
          emailRedirectTo: callbackUrl(next),
        },
      });
      if (authError) {
        setError(authErrorMessage(authError));
        return;
      }
      // Evento de conversión de GA4 (sign_up) con el plan elegido en /precios.
      trackSignUp('email', getPlan(params.get('plan'))?.id);
      if (data.session) {
        // Supabase sin confirmación de correo: ya hay sesión.
        queryClient.clear();
        router.replace(next);
        router.refresh();
        return;
      }
      // Hay que confirmar el correo (o la cuenta ya existía: Supabase no lo
      // revela, así que el mensaje es el mismo).
      setSentTo(email.trim());
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (sentTo) {
    return (
      <>
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
          <MailCheck className="h-6 w-6" aria-hidden />
        </div>
        <AuthHeading
          title="Confirma tu correo"
          subtitle={
            <>
              Te enviamos un enlace a <b className="text-ink">{sentTo}</b>. Ábrelo para activar tu cuenta y
              continuar. Si no lo ves, revisa la carpeta de spam.
            </>
          }
        />
        <Link href="/login" className="text-sm font-semibold text-brand-500 hover:text-brand-600">
          Volver a iniciar sesión
        </Link>
      </>
    );
  }

  return (
    <>
      <AuthHeading
        title="Crea tu cuenta"
        subtitle="Registra tu empresa y empieza a ordenar tus leads, conversaciones y cotizaciones."
      />

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error ? <AuthNotice tone="error">{error}</AuthNotice> : null}

        <Field label="Nombre completo" error={errors.name}>
          <Input
            name="name"
            autoComplete="name"
            className="h-11"
            placeholder="Mariana Ruiz"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="Correo electrónico" error={errors.email}>
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
        <Field
          label="Contraseña"
          error={errors.password}
          hint={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`}
        >
          <PasswordInput
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Crear cuenta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        ¿Ya tienes cuenta?{' '}
        <Link
          href={next !== '/onboarding' ? `/login?next=${encodeURIComponent(next)}` : '/login'}
          className="font-semibold text-brand-500 hover:text-brand-600"
        >
          Inicia sesión
        </Link>
      </p>
    </>
  );
}
