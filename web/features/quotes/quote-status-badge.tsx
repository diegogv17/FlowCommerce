import { Badge } from '@/components/ui';
import { cn } from '@/lib/cn';
import { quoteStatusInfo } from '@/lib/labels';

/** Etiqueta del estado de una cotización con los colores de lib/labels. */
export function QuoteStatusBadge({ status, className }: { status: string; className?: string }) {
  const info = quoteStatusInfo(status);
  return <Badge className={cn(info.color, className)}>{info.label}</Badge>;
}
