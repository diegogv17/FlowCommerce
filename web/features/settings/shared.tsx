'use client';

import { useState } from 'react';
import { Check, Copy, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, Button, Dialog } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useAvatarUrl } from './use-avatar-url';

export function CopyButton({
  value,
  label = 'Copiar',
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar. Selecciona el texto y cópialo a mano.');
    }
  }
  return (
    <Button type="button" variant="outline" size="sm" onClick={copy} className={className}>
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {copied ? 'Copiado' : label}
    </Button>
  );
}

/**
 * Muestra UNA sola vez un secreto (API key, secreto de firma de webhook). Al
 * cerrar el diálogo se descarta: la API no lo vuelve a devolver.
 */
export function SecretDialog({
  secret,
  title,
  description,
  onClose,
}: {
  secret: string | null;
  title: string;
  description: string;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={secret !== null}
      onClose={onClose}
      title={title}
      description={description}
      footer={<Button onClick={onClose}>Ya la guardé</Button>}
    >
      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        Cópiala ahora y guárdala en un lugar seguro. Por seguridad no la volveremos a mostrar.
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="min-w-0 flex-1 select-all break-all rounded-xl bg-slate-900 px-3 py-2.5 font-mono text-xs text-emerald-300">
          {secret}
        </code>
        {secret ? <CopyButton value={secret} /> : null}
      </div>
    </Dialog>
  );
}

/** Avatar que resuelve la foto protegida con useAvatarUrl. */
export function UserAvatar({
  name,
  avatarUrl,
  size = 'md',
  className,
}: {
  name: string | null | undefined;
  avatarUrl: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const src = useAvatarUrl(avatarUrl);
  return <Avatar name={name} src={src} size={size} className={className} />;
}

/** Interruptor accesible (pausar/reactivar). */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
        checked ? 'bg-emerald-500' : 'bg-slate-300',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

/** "" → null para los campos opcionales que la API acepta como null. */
export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
