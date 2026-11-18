'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Spinner } from '@/components/ui';
import { ApiError, api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { ROLE_LABELS } from '@/lib/labels';
import { getSupabase } from '@/lib/supabase/client';
import { AuthHeading, AuthNotice } from './auth-heading';
import { rememberProject } from './utils';

interface InvitationPreview {
  projectId: string;
  projectName: string;
  email: string;
  role: string;
  expiresAt: string;
}

interface AcceptedInvitation {
  projectId: string;
  role: string;
}

type SessionInfo = { email: string | null } | null;

/**
 * /invitacion?token=… — El token va en el BODY (POST /invitations/preview y
 * /invitations/accept), nunca en la URL de la API. Aceptar exige sesión con el
 * mismo correo invitado; sin sesión se manda a login/registro con ?next de
 * vuelta a esta pantalla.
 */
export function InvitationView() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const token = params.get('token') ?? '';
  const [session, setSession] = useState<SessionInfo | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (!cancelled) setSession(data.session ? { email: data.session.user.email ?? null } : null);
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const preview = useQuery({
    queryKey: ['invitation-preview', token],
    queryFn: () => api.post<InvitationPreview>('/invitations/preview', { token }),
    enabled: token.length >= 20,
    retry: false,
    staleTime: Infinity,
  });

  const accept = useMutation({
    mutationFn: () => api.post<AcceptedInvitation>('/invitations/accept', { token }),
    onSuccess: async (result) => {
      rememberProject(result.projectId);
      await queryClient.invalidateQueries({ queryKey: ['projects', 'my'] });
      toast.success(`Te uniste a ${preview.data?.projectName ?? 'el proyecto'}`);
      router.replace('/dashboard');
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        toast.error('Esta invitación ya se usó o ya eres miembro del proyecto.');
      } else if (error instanceof ApiError && error.status === 403) {
        toast.error('Inicia sesión con el mismo correo al que llegó la invitación.');
      } else {
        toast.error(errorMessage(error));
      }
    },
  });

  async function switchAccount() {
    await getSupabase().auth.signOut();
    queryClient.clear();
    setSession(null);
  }

  const back = `/invitacion?token=${encodeURIComponent(token)}`;

  if (token.length < 20) {
    return (
      <>
        <AuthHeading title="Invitación no válida" />
        <AuthNotice tone="error">El enlace está incompleto. Ábrelo de nuevo desde el correo.</AuthNotice>
      </>
    );
  }

  if (preview.isLoading || session === undefined) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted">
        <Spinner /> Cargando la invitación…
      </div>
    );
  }

  if (preview.isError || !preview.data) {
    return (
      <>
        <AuthHeading title="Invitación no disponible" />
        <AuthNotice tone="error">
          {preview.error instanceof ApiError && preview.error.status === 429
            ? 'Demasiados intentos. Espera un momento y recarga la página.'
            : 'La invitación no existe, ya se usó, se revocó o venció. Pide una nueva al administrador.'}
        </AuthNotice>
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-brand-500 hover:text-brand-600">
          Ir a iniciar sesión
        </Link>
      </>
    );
  }

  const invitation = preview.data;
  const sessionEmail = session ? session.email : null;
  const sameEmail =
    sessionEmail !== null && sessionEmail.toLowerCase() === invitation.email.toLowerCase();

  return (
    <>
      <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
        <Building2 className="h-6 w-6" aria-hidden />
      </div>
      <AuthHeading
        title={`Te invitaron a ${invitation.projectName}`}
        subtitle={
          <>
            Entrarás como <b className="text-ink">{ROLE_LABELS[invitation.role] ?? invitation.role}</b> con el
            correo <b className="text-ink">{invitation.email}</b>. La invitación vence el{' '}
            {formatDate(invitation.expiresAt)}.
          </>
        }
      />

      {!session ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">Para aceptarla, inicia sesión o crea tu cuenta con ese correo.</p>
          <Link
            href={`/login?next=${encodeURIComponent(back)}`}
            className="flex h-11 w-full items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
          >
            Iniciar sesión
          </Link>
          <Link
            href={`/registro?next=${encodeURIComponent(back)}&email=${encodeURIComponent(invitation.email)}`}
            className="flex h-11 w-full items-center justify-center rounded-full border border-line bg-white text-sm font-semibold text-ink hover:bg-slate-50"
          >
            Crear cuenta
          </Link>
        </div>
      ) : sameEmail ? (
        <Button size="lg" className="w-full" loading={accept.isPending} onClick={() => accept.mutate()}>
          Aceptar invitación
        </Button>
      ) : (
        <div className="space-y-4">
          <AuthNotice tone="error">
            Tienes la sesión abierta como <b>{session.email ?? 'otro usuario'}</b>. Esta invitación es para{' '}
            <b>{invitation.email}</b>.
          </AuthNotice>
          <Button size="lg" variant="outline" className="w-full" onClick={switchAccount}>
            Cerrar sesión y usar otro correo
          </Button>
        </div>
      )}
    </>
  );
}
