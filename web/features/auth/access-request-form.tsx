'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button, Field, Input } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { AuthHeading, AuthNotice } from './auth-heading';
import { isValidEmail } from './utils';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /auth/access-requests { projectId, email }. El backend responde 202
 * siempre (no revela si el correo existe); solo da 404 si el proyecto no
 * existe. El código del proyecto llega en el enlace que comparte el
 * administrador (/solicitar-acceso?proyecto=<id>) o se escribe a mano.
 */
export function AccessRequestForm() {
  const params = useSearchParams();
  const fromLink = params.get('proyecto') ?? params.get('projectId') ?? '';
  const [projectId, setProjectId] = useState(fromLink);
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const found: Record<string, string> = {};
    if (!UUID_RE.test(projectId.trim())) found.projectId = 'El código del proyecto no es válido.';
    if (!isValidEmail(email)) found.email = 'Escribe un correo válido.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      await api.post('/auth/access-requests', { projectId: projectId.trim(), email: email.trim() });
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('No encontramos ese proyecto. Revisa el enlace o el código que te compartieron.');
      } else if (err instanceof ApiError && err.status === 429) {
        setError('Demasiadas solicitudes. Espera unos minutos y vuelve a intentarlo.');
      } else if (err instanceof ApiError && err.status === 400) {
        setError('Revisa los datos: el correo o el código del proyecto no son válidos.');
      } else {
        setError('No pudimos enviar la solicitud. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AuthHeading
        title="Solicita acceso"
        subtitle="Pide a los administradores de tu empresa que te den acceso a FlowCommerce."
      />

      {sent ? (
        <AuthNotice tone="success">
          Recibimos tu solicitud. Los administradores del proyecto la revisarán y, si la aprueban, te
          llegará un correo para crear tu contraseña.
        </AuthNotice>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error ? <AuthNotice tone="error">{error}</AuthNotice> : null}
          {fromLink && UUID_RE.test(fromLink) ? null : (
            <Field
              label="Código del proyecto"
              error={errors.projectId}
              hint="Pídelo a tu administrador (Configuración → Usuarios → enlace de solicitud)."
            >
              <Input
                name="projectId"
                className="h-11 font-mono text-xs"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
              />
            </Field>
          )}
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
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Enviar solicitud
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-semibold text-brand-500 hover:text-brand-600">
          Inicia sesión
        </Link>
      </p>
    </>
  );
}
