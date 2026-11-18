'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import {
  Banknote,
  Check,
  FileText,
  History,
  Mail,
  MessageCircle,
  Paperclip,
  Plus,
  Trash2,
  Upload,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AiBadge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Pagination,
  Skeleton,
  Table,
  Td,
  Th,
  Tr,
} from '@/components/ui';
import { useProject } from '@/hooks/use-project';
import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatDate, formatDateTime, formatMoney, formatRelative } from '@/lib/format';
import { useQuotes } from '@/features/quotes/hooks';
import { QuoteStatusBadge } from '@/features/quotes/quote-status-badge';
import {
  useClientActivity,
  useClientAttachments,
  useDeleteAttachment,
  useUploadClientAttachment,
} from './hooks';
import type { ActivityEvent, Client } from './types';

// ---------------------------------------------------------------------------
// Datos del cliente
// ---------------------------------------------------------------------------

export function ClientDataCard({
  client,
  onEdit,
  canEdit,
}: {
  client: Client;
  onEdit: () => void;
  canEdit: boolean;
}) {
  const rows: [string, string | null][] = [
    ['Contacto', client.name],
    ['Cargo', client.contactPosition],
    ['Empresa', client.company],
    ['NIT', client.taxId],
    ['Email', client.email],
    ['Teléfono', client.phone],
    ['Responsable', client.assignedUser?.name ?? null],
    ['Cliente desde', formatDate(client.creadoEn)],
  ];
  return (
    <Card>
      <CardHeader
        title="Datos del cliente"
        action={
          canEdit ? (
            <Button size="sm" variant="secondary" onClick={onEdit}>
              Editar
            </Button>
          ) : null
        }
      />
      <dl className="divide-y divide-line/70 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-muted">{label}</dt>
            <dd className="break-all text-right font-semibold text-ink">{value || '—'}</dd>
          </div>
        ))}
      </dl>
      {client.notes ? (
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
          <p className="mb-1 text-xs font-semibold text-muted">Notas</p>
          <p className="whitespace-pre-line text-ink">{client.notes}</p>
        </div>
      ) : null}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Actividad (timeline)
// ---------------------------------------------------------------------------

const ACTIVITY_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  LEAD_CREATED: { icon: UserPlus, color: 'bg-brand-500' },
  LEAD_STAGE_CHANGED: { icon: History, color: 'bg-slate-400' },
  LEAD_ASSIGNED: { icon: UserPlus, color: 'bg-slate-400' },
  LEAD_CONVERTED: { icon: Plus, color: 'bg-brand-500' },
  CLIENT_CREATED: { icon: Plus, color: 'bg-brand-500' },
  QUOTE_CREATED: { icon: FileText, color: 'bg-brand-500' },
  QUOTE_STATUS_CHANGED: { icon: Check, color: 'bg-emerald-600' },
  QUOTE_SENT_BY_EMAIL: { icon: Mail, color: 'bg-blue-500' },
  QUOTE_PAYMENT_LINK_CREATED: { icon: Banknote, color: 'bg-emerald-600' },
  MESSAGE_SENT: { icon: MessageCircle, color: 'bg-emerald-500' },
  MESSAGE_RECEIVED: { icon: MessageCircle, color: 'bg-emerald-500' },
  FOLLOW_UP_CREATED: { icon: History, color: 'bg-violet-500' },
  FOLLOW_UP_COMPLETED: { icon: Check, color: 'bg-violet-500' },
  FOLLOW_UP_CANCELLED: { icon: History, color: 'bg-slate-400' },
  ATTACHMENT_ADDED: { icon: Paperclip, color: 'bg-slate-500' },
};

function Timeline({ events }: { events: ActivityEvent[] }) {
  return (
    <ol className="relative space-y-5">
      {events.map((event, index) => {
        const meta = ACTIVITY_ICONS[event.type] ?? { icon: History, color: 'bg-slate-400' };
        const Icon = meta.icon;
        return (
          <li key={event.id} className="relative flex gap-3">
            {index < events.length - 1 ? (
              <span className="absolute left-[13px] top-8 h-[calc(100%-4px)] w-px bg-line" aria-hidden />
            ) : null}
            <span className={cn('z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white', meta.color)}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">
                {event.quoteId ? (
                  <Link href={`/cotizaciones/${event.quoteId}`} className="hover:text-brand-600">
                    {event.title}
                  </Link>
                ) : event.leadId ? (
                  <Link href={`/leads/${event.leadId}`} className="hover:text-brand-600">
                    {event.title}
                  </Link>
                ) : (
                  event.title
                )}
              </p>
              <p className="text-xs text-muted">
                {event.actor?.name ?? 'Sistema'} · {formatDateTime(event.creadoEn)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const COMMERCIAL_TYPES = [
  'LEAD_CONVERTED',
  'CLIENT_CREATED',
  'QUOTE_CREATED',
  'QUOTE_STATUS_CHANGED',
  'QUOTE_SENT_BY_EMAIL',
  'QUOTE_PAYMENT_LINK_CREATED',
];

/** "Historial comercial" de la pestaña Resumen: solo hitos de venta. */
export function CommercialHistoryCard({ clientId, onSeeAll }: { clientId: string; onSeeAll: () => void }) {
  const activity = useClientActivity(clientId, { types: COMMERCIAL_TYPES, limit: 8 });
  return (
    <Card>
      <CardHeader
        title="Historial comercial"
        action={
          <button type="button" onClick={onSeeAll} className="text-xs font-semibold text-brand-600 hover:underline">
            Ver todo
          </button>
        }
      />
      {activity.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : activity.isError ? (
        <ErrorState message={errorMessage(activity.error)} onRetry={() => activity.refetch()} />
      ) : (activity.data?.data ?? []).length === 0 ? (
        <EmptyState title="Sin movimientos comerciales" description="Aquí verás cotizaciones, envíos y pagos." />
      ) : (
        <Timeline events={activity.data!.data} />
      )}
    </Card>
  );
}

export function ClientActivityTab({ clientId }: { clientId: string }) {
  const [page, setPage] = useState(1);
  const activity = useClientActivity(clientId, { page, limit: 20 });
  return (
    <Card>
      <CardHeader title="Actividad" subtitle="Incluye la actividad de los leads del cliente" />
      {activity.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : activity.isError ? (
        <ErrorState message={errorMessage(activity.error)} onRetry={() => activity.refetch()} />
      ) : (activity.data?.data ?? []).length === 0 ? (
        <EmptyState title="Sin actividad registrada" />
      ) : (
        <>
          <Timeline events={activity.data!.data} />
          <Pagination
            page={activity.data!.meta.page}
            totalPages={activity.data!.meta.totalPages}
            total={activity.data!.meta.total}
            onPage={setPage}
            label="eventos"
          />
        </>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Cotizaciones y pagos
// ---------------------------------------------------------------------------

export function ClientQuotesTab({
  clientId,
  currency,
  canCreate,
  active,
}: {
  clientId: string;
  currency: string;
  canCreate: boolean;
  active: boolean;
}) {
  const [page, setPage] = useState(1);
  const quotes = useQuotes({ clientId, sortBy: 'createdAt', order: 'desc', page });
  const rows = quotes.data?.data ?? [];
  return (
    <Card className="p-0">
      <div className="flex items-center justify-between gap-3 p-5 pb-3">
        <h3 className="text-base font-semibold">Cotizaciones</h3>
        {canCreate && active ? (
          <Link
            href={`/cotizaciones/nueva?clientId=${clientId}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-500 px-3 text-xs font-semibold text-white hover:bg-brand-600"
          >
            <Plus className="h-3.5 w-3.5" /> Nueva cotización
          </Link>
        ) : null}
      </div>
      {quotes.isLoading ? (
        <div className="space-y-3 p-5 pt-0">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : quotes.isError ? (
        <div className="p-5 pt-0">
          <ErrorState message={errorMessage(quotes.error)} onRetry={() => quotes.refetch()} />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={<FileText className="h-6 w-6" />} title="Este cliente aún no tiene cotizaciones" />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th className="pl-5">Número</Th>
                <Th>Fecha</Th>
                <Th className="text-right">Total</Th>
                <Th>Responsable</Th>
                <Th className="pr-5">Estado</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((quote) => (
                <Tr key={quote.id}>
                  <Td className="pl-5">
                    <Link
                      href={`/cotizaciones/${quote.id}`}
                      className="inline-flex items-center gap-2 font-mono font-semibold hover:text-brand-600"
                    >
                      {quote.folio}
                      {quote.origin === 'AI' ? <AiBadge /> : null}
                    </Link>
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{formatDate(quote.creadoEn)}</Td>
                  <Td className="whitespace-nowrap text-right font-mono font-semibold">
                    {formatMoney(quote.total, currency)}
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{quote.createdBy?.name ?? '—'}</Td>
                  <Td className="pr-5">
                    <QuoteStatusBadge status={quote.status} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          <div className="px-4">
            <Pagination
              page={quotes.data?.meta.page ?? page}
              totalPages={quotes.data?.meta.totalPages ?? 1}
              total={quotes.data?.meta.total ?? 0}
              onPage={setPage}
              label="cotizaciones"
            />
          </div>
        </>
      )}
    </Card>
  );
}

export function ClientPaymentsTab({ clientId, currency }: { clientId: string; currency: string }) {
  const [page, setPage] = useState(1);
  const paid = useQuotes({ clientId, status: 'PAID', sortBy: 'createdAt', order: 'desc', page });
  const rows = paid.data?.data ?? [];
  return (
    <Card className="p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 p-5 pb-3">
        <h3 className="text-base font-semibold">Pagos recibidos</h3>
        {paid.data ? (
          <span className="text-sm text-muted">
            Total cobrado:{' '}
            <span className="font-mono font-semibold text-emerald-600">{formatMoney(paid.data.meta.sumTotal, currency)}</span>
          </span>
        ) : null}
      </div>
      {paid.isLoading ? (
        <div className="space-y-3 p-5 pt-0">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : paid.isError ? (
        <div className="p-5 pt-0">
          <ErrorState message={errorMessage(paid.error)} onRetry={() => paid.refetch()} />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={<Banknote className="h-6 w-6" />} title="Sin pagos registrados" />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th className="pl-5">Cotización</Th>
                <Th>Fecha de pago</Th>
                <Th>Referencia</Th>
                <Th className="pr-5 text-right">Monto</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((quote) => (
                <Tr key={quote.id}>
                  <Td className="pl-5">
                    <Link href={`/cotizaciones/${quote.id}`} className="font-mono font-semibold hover:text-brand-600">
                      {quote.folio}
                    </Link>
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{formatDateTime(quote.paidAt)}</Td>
                  <Td className="font-mono text-xs">{quote.paymentReference ?? 'Registrado manualmente'}</Td>
                  <Td className="whitespace-nowrap pr-5 text-right font-mono font-semibold text-emerald-600">
                    {formatMoney(quote.total, currency)}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          <div className="px-4">
            <Pagination
              page={paid.data?.meta.page ?? page}
              totalPages={paid.data?.meta.totalPages ?? 1}
              total={paid.data?.meta.total ?? 0}
              onPage={setPage}
              label="pagos"
            />
          </div>
        </>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Archivos
// ---------------------------------------------------------------------------

const MAX_BYTES = 10 * 1024 * 1024;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ClientFilesTab({ clientId, canUpload }: { clientId: string; canUpload: boolean }) {
  const { path } = useProject();
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const files = useClientAttachments(clientId, page);
  const upload = useUploadClientAttachment(clientId);
  const remove = useDeleteAttachment();
  const rows = files.data?.data ?? [];

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error('El archivo supera el máximo de 10 MB');
      return;
    }
    try {
      await upload.mutateAsync(file);
      toast.success('Archivo subido');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function download(id: string, name: string) {
    try {
      await api.download(path(`/attachments/${id}/download`), name);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete);
      toast.success('Archivo eliminado');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setToDelete(null);
    }
  }

  return (
    <Card className="p-0">
      <div className="flex items-center justify-between gap-3 p-5 pb-3">
        <div>
          <h3 className="text-base font-semibold">Archivos</h3>
          <p className="text-xs text-muted">Contratos, órdenes de compra y documentos del cliente (máx. 10 MB)</p>
        </div>
        {canUpload ? (
          <>
            <input ref={inputRef} type="file" className="hidden" onChange={onFile} aria-label="Subir archivo" />
            <Button size="sm" onClick={() => inputRef.current?.click()} loading={upload.isPending}>
              <Upload className="h-3.5 w-3.5" /> Subir archivo
            </Button>
          </>
        ) : null}
      </div>
      {files.isLoading ? (
        <div className="space-y-3 p-5 pt-0">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : files.isError ? (
        <div className="p-5 pt-0">
          <ErrorState message={errorMessage(files.error)} onRetry={() => files.refetch()} />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={<Paperclip className="h-6 w-6" />} title="Sin archivos" />
      ) : (
        <>
          <ul className="divide-y divide-line/70">
            {rows.map((file) => (
              <li key={file.id} className="flex items-center gap-3 px-5 py-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-muted">
                  <Paperclip className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => download(file.id, file.fileName)}
                    className="block max-w-full truncate text-left text-sm font-semibold text-ink hover:text-brand-600"
                  >
                    {file.fileName}
                  </button>
                  <p className="text-xs text-muted">
                    {formatSize(file.sizeBytes)} · {file.source === 'WHATSAPP' ? 'WhatsApp' : 'Subido'} ·{' '}
                    {formatRelative(file.creadoEn)}
                  </p>
                </div>
                {canUpload ? (
                  <button
                    type="button"
                    onClick={() => setToDelete(file.id)}
                    className="rounded-full p-1.5 text-muted hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Eliminar ${file.fileName}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="px-4">
            <Pagination
              page={files.data?.meta.page ?? page}
              totalPages={files.data?.meta.totalPages ?? 1}
              total={files.data?.meta.total ?? 0}
              onPage={setPage}
              label="archivos"
            />
          </div>
        </>
      )}
      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="¿Eliminar el archivo?"
        description="Se borrará definitivamente."
        confirmLabel="Eliminar"
        danger
        loading={remove.isPending}
      />
    </Card>
  );
}
