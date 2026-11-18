'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import {
  ArrowRightLeft,
  Building2,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  CreditCard,
  Download,
  FileCheck2,
  FilePlus2,
  FileText,
  Inbox,
  Mail,
  MessageCircle,
  Paperclip,
  Send,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ActivityType } from '@flowcommerce/types';
import { AiBadge, Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, Skeleton, Table, Td, Th, Tr } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatDate, formatDateTime, formatMoney, formatRelative } from '@/lib/format';
import { quoteStatusInfo } from '@/lib/labels';
import { useProject } from '@/hooks/use-project';
import { useDeleteAttachment, useLeadActivity, useLeadAttachments, useLeadQuotes, useUploadAttachment } from './hooks';
import type { Attachment } from './types';
import { formatBytes } from './utils';

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

/* ------------------------------ Cotizaciones ------------------------------ */

export function QuotesTab({ leadId }: { leadId: string }) {
  const { can } = useProject();
  const { data, isLoading, isError, error, refetch } = useLeadQuotes(leadId);
  const quotes = data?.data ?? [];

  return (
    <Card className="p-0">
      <div className="flex items-center justify-between gap-3 p-5 pb-3">
        <h3 className="text-base font-semibold">Cotizaciones</h3>
        {can('QUOTE_CREATE') ? (
          <Link href={`/cotizaciones/nueva?leadId=${leadId}`}>
            <Button size="sm">
              <FilePlus2 className="h-3.5 w-3.5" /> Nueva cotización
            </Button>
          </Link>
        ) : null}
      </div>
      {isError ? (
        <div className="p-5 pt-0">
          <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
        </div>
      ) : isLoading ? (
        <div className="p-5 pt-0">
          <ListSkeleton />
        </div>
      ) : quotes.length === 0 ? (
        <EmptyState title="Sin cotizaciones" description="Crea la primera cotización para este lead." icon={<FileText className="h-6 w-6" />} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Folio</Th>
              <Th>Estado</Th>
              <Th>Creada</Th>
              <Th>Vigencia</Th>
              <Th>Asesor</Th>
              <Th className="text-right">Total</Th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote) => {
              const status = quoteStatusInfo(quote.status);
              return (
                <Tr key={quote.id}>
                  <Td>
                    <Link href={`/cotizaciones/${quote.id}`} className="font-semibold text-brand-600 hover:underline">
                      {quote.folio}
                    </Link>
                    {quote.origin === 'AI' ? <AiBadge className="ml-2" /> : null}
                  </Td>
                  <Td>
                    <Badge className={status.color}>{status.label}</Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{formatDate(quote.creadoEn)}</Td>
                  <Td className="whitespace-nowrap text-muted">{formatDate(quote.validUntil)}</Td>
                  <Td className="whitespace-nowrap">{quote.createdBy?.name ?? '—'}</Td>
                  <Td className="whitespace-nowrap text-right font-mono font-semibold">{formatMoney(quote.total)}</Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

/* -------------------------------- Actividad ------------------------------- */

const ACTIVITY_ICONS: Record<ActivityType, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  LEAD_CREATED: { icon: UserPlus, color: 'bg-cyan-100 text-cyan-700' },
  LEAD_STAGE_CHANGED: { icon: ArrowRightLeft, color: 'bg-violet-100 text-violet-700' },
  LEAD_ASSIGNED: { icon: UserCheck, color: 'bg-blue-100 text-blue-700' },
  LEAD_CONVERTED: { icon: Building2, color: 'bg-emerald-100 text-emerald-700' },
  CLIENT_CREATED: { icon: Building2, color: 'bg-emerald-100 text-emerald-700' },
  QUOTE_CREATED: { icon: FilePlus2, color: 'bg-amber-100 text-amber-700' },
  QUOTE_STATUS_CHANGED: { icon: FileCheck2, color: 'bg-amber-100 text-amber-700' },
  QUOTE_SENT_BY_EMAIL: { icon: Mail, color: 'bg-blue-100 text-blue-700' },
  QUOTE_PAYMENT_LINK_CREATED: { icon: CreditCard, color: 'bg-green-100 text-green-700' },
  MESSAGE_SENT: { icon: Send, color: 'bg-emerald-100 text-emerald-700' },
  MESSAGE_RECEIVED: { icon: MessageCircle, color: 'bg-emerald-100 text-emerald-700' },
  FOLLOW_UP_CREATED: { icon: CalendarPlus, color: 'bg-brand-50 text-brand-600' },
  FOLLOW_UP_COMPLETED: { icon: CalendarCheck, color: 'bg-emerald-100 text-emerald-700' },
  FOLLOW_UP_CANCELLED: { icon: CalendarX, color: 'bg-slate-100 text-slate-600' },
  ATTACHMENT_ADDED: { icon: Paperclip, color: 'bg-slate-100 text-slate-700' },
};

export function ActivityTab({ leadId }: { leadId: string }) {
  const { data, isLoading, isError, error, refetch } = useLeadActivity(leadId);
  const events = data?.data ?? [];

  return (
    <Card>
      <h3 className="mb-4 text-base font-semibold">Actividad</h3>
      {isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : isLoading ? (
        <ListSkeleton />
      ) : events.length === 0 ? (
        <EmptyState title="Sin actividad" description="Aquí aparecerá todo lo que pase con este lead." />
      ) : (
        <ol className="relative">
          {events.map((event, index) => {
            const meta = ACTIVITY_ICONS[event.type] ?? { icon: Inbox, color: 'bg-slate-100 text-slate-600' };
            const Icon = meta.icon;
            return (
              <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
                {index < events.length - 1 ? <span aria-hidden className="absolute left-[17px] top-9 h-[calc(100%-2rem)] w-px bg-line" /> : null}
                <span className={cn('relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full', meta.color)}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <p className="text-sm font-medium text-ink">{event.title}</p>
                  <p className="text-xs text-muted" title={formatDateTime(event.creadoEn)}>
                    {event.actor?.name ?? 'Sistema'} · {formatRelative(event.creadoEn)}
                  </p>
                  {event.quoteId ? (
                    <Link href={`/cotizaciones/${event.quoteId}`} className="text-xs font-semibold text-brand-600 hover:underline">
                      Ver cotización
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

/* --------------------------------- Archivos -------------------------------- */

const MAX_BYTES = 10 * 1024 * 1024;

export function AttachmentsTab({ leadId }: { leadId: string }) {
  const { can, path } = useProject();
  const canEdit = can('LEAD_UPDATE');
  const { data, isLoading, isError, error, refetch } = useLeadAttachments(leadId);
  const upload = useUploadAttachment(leadId);
  const remove = useDeleteAttachment();
  const input = useRef<HTMLInputElement>(null);
  const [deleting, setDeleting] = useState<Attachment | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const files = data?.data ?? [];

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error('El archivo supera el máximo de 10 MB');
      return;
    }
    upload.mutate(file, {
      onSuccess: () => toast.success(`"${file.name}" subido`),
      onError: (err) => toast.error(errorMessage(err)),
    });
  };

  const download = async (file: Attachment) => {
    setDownloading(file.id);
    try {
      await api.download(path(`/attachments/${file.id}/download`), file.fileName);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDownloading(null);
    }
  };

  const confirmDelete = () => {
    if (!deleting) return;
    remove.mutate(deleting.id, {
      onSuccess: () => {
        toast.success('Archivo eliminado');
        setDeleting(null);
      },
      onError: (err) => toast.error(errorMessage(err)),
    });
  };

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Archivos</h3>
          <p className="text-xs text-muted">Imágenes, PDF, Office, audio o video. Máx. 10 MB.</p>
        </div>
        {canEdit ? (
          <>
            <input ref={input} type="file" className="sr-only" onChange={onFile} aria-label="Elegir archivo" />
            <Button size="sm" onClick={() => input.current?.click()} loading={upload.isPending}>
              <Upload className="h-3.5 w-3.5" /> Subir archivo
            </Button>
          </>
        ) : null}
      </div>
      {isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : isLoading ? (
        <ListSkeleton />
      ) : files.length === 0 ? (
        <EmptyState title="Sin archivos" description="Sube propuestas, contratos o fotos del proyecto." icon={<Paperclip className="h-6 w-6" />} />
      ) : (
        <ul className="divide-y divide-line/60">
          {files.map((file) => (
            <li key={file.id} className="flex items-center gap-3 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-muted">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.fileName}</p>
                <p className="text-xs text-muted">
                  {formatBytes(file.sizeBytes)} · {formatDate(file.creadoEn)}
                  {file.source === 'WHATSAPP' ? ' · recibido por WhatsApp' : ''}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Descargar ${file.fileName}`}
                onClick={() => download(file)}
                loading={downloading === file.id}
              >
                {downloading === file.id ? null : <Download className="h-4 w-4" />}
              </Button>
              {canEdit ? (
                <Button size="icon" variant="ghost" aria-label={`Eliminar ${file.fileName}`} onClick={() => setDeleting(file)}>
                  <Trash2 className="h-4 w-4 text-rose-500" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="¿Eliminar archivo?"
        description={deleting ? `"${deleting.fileName}" se borra definitivamente.` : undefined}
        confirmLabel="Eliminar"
        danger
        loading={remove.isPending}
      />
    </Card>
  );
}
