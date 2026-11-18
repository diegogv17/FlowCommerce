'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button, Field, Spinner } from '@/components/ui';
import { getSupabase } from '@/lib/supabase/client';
import { AuthHeading, AuthNotice } from './auth-heading';
import { PasswordInput } from './password-input';
import { MIN_PASSWORD_LENGTH, authErrorMessage } from './utils';

type SessionState = 'checking' | 'ready' | 'missing';

/**
 * Llega aquí desde /auth/callback con la sesión de recuperación ya creada (flujo
 * PKCE con ?code). Si el correo usó el flujo implícito (#access_token=… en el
 * hash, típico de las invitaciones creadas desde el backend), se toma la sesión
 * del hash. También sirve para que un usuario con sesión cambie su contraseña.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const [state, setState] = useState<SessionState>('checking');
  const [hashError, setHashError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const supabase = getSupabase();
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const accessToken = hash.get('access_token');
      const refreshToken = hash.get('refresh_token');
      const description = hash.get('error_description');
      if (description) setHashError('El enlace no es válido o ya venció. Pide uno nuevo.');
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }
      if (window.location.hash) {
        // No dejar los tokens en la barra de direcciones ni en el historial.
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      const { data } = await supabase.auth.getSession();
      if (!cancelled) setState(data.session ? 'ready' : 'missing');
    }
    init().catch(() => {
      if (!cancelled) setState('missing');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const found: Record<string, string> = {};
    if (password.length < MIN_PASSWORD_LENGTH) found.password = `Usa al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    if (confirm !== password) found.confirm = 'Las contraseñas no coinciden.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      const { error: authError } = await getSupabase().auth.updateUser({ password });
      if (authError) {
        setError(authErrorMessage(authError));
        return;
      }
      toast.success('Contraseña actualizada');
      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (state === 'checking') {
    return (
      <div className="flex items-center gap-3 text-sm text-muted">
        <Spinner /> Validando el enlace…
      </div>
    );
  }

  if (state === 'missing') {
    return (
      <>
        <AuthHeading title="Enlace no válido" />
        <AuthNotice tone="error">
          {hashError ??
            'El enlace para restablecer la contraseña venció, ya se usó o se abrió en otro navegador.'}
        </AuthNotice>
        <Link
          href="/olvide-contrasena"
          className="mt-6 inline-block text-sm font-semibold text-brand-500 hover:text-brand-600"
        >
          Pedir un enlace nuevo
        </Link>
      </>
    );
  }

  return (
    <>
      <AuthHeading title="Crea una contraseña nueva" subtitle="Escríbela dos veces para confirmarla." />
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error ? <AuthNotice tone="error">{error}</AuthNotice> : null}
        <Field label="Nueva contraseña" error={errors.password} hint={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`}>
          <PasswordInput
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Field label="Confirma la contraseña" error={errors.confirm}>
          <PasswordInput
            name="confirm"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Guardar contraseña
        </Button>
      </form>
    </>
  );
}
