import { cn } from '@/lib/cn';

export function AuthHeading({ title, subtitle }: { title: string; subtitle?: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p> : null}
    </div>
  );
}

/** Aviso dentro de un formulario de acceso (error, éxito o información). */
export function AuthNotice({
  tone = 'info',
  children,
  className,
}: {
  tone?: 'info' | 'success' | 'error';
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    info: 'border-brand-100 bg-brand-50 text-brand-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error: 'border-rose-200 bg-rose-50 text-rose-700',
  };
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('rounded-xl border px-4 py-3 text-sm leading-relaxed', tones[tone], className)}
    >
      {children}
    </div>
  );
}
