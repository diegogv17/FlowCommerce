'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, CardHeader, ErrorState, Field, Input, Skeleton } from '@/components/ui';
import { useMe, type Me } from '@/hooks/use-session';
import { useProject } from '@/hooks/use-project';
import { errorMessage } from '@/lib/api';
import { ROLE_LABELS } from '@/lib/labels';
import { useDeleteAvatar, useUpdateProfile, useUploadAvatar } from './hooks';
import { UserAvatar, emptyToNull } from './shared';

const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export function ProfileTab() {
  const { data: me, isLoading, isError, error, refetch } = useMe();

  if (isLoading) return <Skeleton className="h-96 max-w-2xl rounded-2xl" />;
  if (isError || !me) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="max-w-2xl space-y-4">
      <ProfileCard me={me} />
      <Card>
        <CardHeader
          title="Seguridad"
          subtitle="Tu correo y contraseña se gestionan en el inicio de sesión."
          action={
            <Link
              href="/restablecer-contrasena"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-xs font-semibold text-ink hover:bg-slate-50"
            >
              <KeyRound className="h-3.5 w-3.5" aria-hidden /> Cambiar contraseña
            </Link>
          }
          className="mb-0"
        />
      </Card>
    </div>
  );
}

function ProfileCard({ me }: { me: Me }) {
  const { project } = useProject();
  const update = useUpdateProfile();
  const upload = useUploadAvatar();
  const removeAvatar = useDeleteAvatar();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(me.name);
  const [phone, setPhone] = useState(me.phone ?? '');
  const [position, setPosition] = useState(me.position ?? '');
  const [nameError, setNameError] = useState<string>();

  // Si el perfil cambia (p. ej. tras guardar), el formulario se alinea.
  useEffect(() => {
    setName(me.name);
    setPhone(me.phone ?? '');
    setPosition(me.position ?? '');
  }, [me.name, me.phone, me.position]);

  const dirty = name !== me.name || phone !== (me.phone ?? '') || position !== (me.position ?? '');

  function reset() {
    setName(me.name);
    setPhone(me.phone ?? '');
    setPosition(me.position ?? '');
    setNameError(undefined);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2) return setNameError('Escribe tu nombre.');
    setNameError(undefined);
    update.mutate({ name: name.trim(), phone: emptyToNull(phone), position: emptyToNull(position) });
  }

  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) return void toast.error('Usa una imagen PNG, JPG o WebP.');
    if (file.size > AVATAR_MAX_BYTES) return void toast.error('La imagen pesa más de 2 MB.');
    upload.mutate(file);
  }

  return (
    <Card className="p-6">
      <CardHeader title="Tu perfil" subtitle="Cómo te ven tus compañeros y tus clientes." />

      <div className="flex flex-wrap items-center gap-4 border-b border-line pb-6">
        <UserAvatar name={me.name} avatarUrl={me.avatarUrl} size="lg" className="rounded-2xl" />
        <div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={upload.isPending}
              onClick={() => fileRef.current?.click()}
            >
              Cambiar imagen
            </Button>
            {me.avatarUrl ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                loading={removeAvatar.isPending}
                onClick={() => removeAvatar.mutate()}
              >
                Quitar
              </Button>
            ) : null}
          </div>
          <p className="mt-1.5 text-xs text-muted">PNG, JPG o WebP, máximo 2 MB</p>
          <input
            ref={fileRef}
            type="file"
            accept={AVATAR_TYPES.join(',')}
            className="hidden"
            onChange={onFile}
            aria-label="Elegir foto de perfil"
          />
        </div>
        {project ? (
          <Badge className="ml-auto bg-brand-50 text-brand-700">
            {ROLE_LABELS[project.role] ?? project.role} en {project.name}
          </Badge>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Nombre completo" error={nameError}>
          <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={255} autoComplete="name" />
        </Field>
        <Field label="Correo electrónico" hint="El correo no se puede cambiar desde aquí.">
          <Input value={me.email} readOnly disabled />
        </Field>
        <Field label="Teléfono">
          <Input
            type="tel"
            placeholder="+502 5512 9090"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            maxLength={32}
            autoComplete="tel"
          />
        </Field>
        <Field label="Cargo">
          <Input
            placeholder="Asesora comercial"
            value={position}
            onChange={(event) => setPosition(event.target.value)}
            maxLength={100}
            autoComplete="organization-title"
          />
        </Field>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" loading={update.isPending} disabled={!dirty}>
            Guardar cambios
          </Button>
          <Button type="button" variant="secondary" onClick={reset} disabled={!dirty}>
            Descartar
          </Button>
        </div>
      </form>
    </Card>
  );
}
