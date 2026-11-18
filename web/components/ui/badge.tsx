import { cn } from '@/lib/cn';

export function Badge({
  className,
  children,
  dot,
}: {
  className?: string;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700',
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

/** Etiqueta morada "IA" para registros con origin = AI. */
export function AiBadge({ className }: { className?: string }) {
  return <Badge className={cn('bg-violet-100 text-violet-700', className)}>✦ IA</Badge>;
}
