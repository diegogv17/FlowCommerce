'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Check, Copy, ExternalLink, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { QuoteStatus } from '@flowcommerce/types';
import { Button, Card, ConfirmDialog, ErrorState, Skeleton } from '@/components/ui';
import { useProject } from '@/hooks/use-project';
import { errorMessage } from '@/lib/api';
import { formatDate, formatDateTime, formatMoney } from '@/lib/format';
import { useClient } from '@/features/clients/hooks';
import {
  useDeleteQuote,
  useDownloadQuotePdf,
  useLeadSummary,
  usePaymentLink,
  useProjectDetail,
  useQuote,
  useQuoteStatus,
} from '@/features/quotes/hooks';
import { QuoteDocument, type QuoteContact } from '@/features/quotes/quote-document';
import { QuoteStatusBadge } from '@/features/quotes/quote-status-badge';
import { SendQuoteDialog } from '@/features/quotes/send-quote-dialog';

// Transiciones que requieren confirmación explícita, con su texto.
const CONFIRM_COPY: Partial<Record<QuoteStatus, { title: string; description: string; label: string; danger?: boolean }>> = {
  APPROVED: {
    title: '¿Aprobar la cotización?',
    description: 'Quedará lista para enviarse al cliente.',
    label: 'Aprobar',
  },
  DRAFT: {
    title: '¿Devolver a borrador?',
    description: 'El asesor podrá editarla y volver a enviarla a aprobación.',
    label: 'Devolver a borrador',
  },
  ACCEPTED: {
    title: '¿Marcar como aceptada por el cliente?',
    description: 'Después podrás generar el link de pago.',
    label: 'Marcar aceptada',
  },
  REJECTED: {
    title: '¿Marcar como rechazada por el cliente?',
    description: 'Es un estado final: para retomar la venta habrá que crear una nueva cotización.',
    label: 'Marcar rechazada',
    danger: true,
  },
  PAID: {
    title: '¿Registrar el pago manualmente?',
    description: 'Normalmente el pago lo confirma el servicio de Pagos. Úsalo solo si cobraste por otro medio.',
    label: 'Marcar pagada',
  },
};

export default function QuoteDetailPage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const router = useRouter();
  const { can } = useProject();
  const quote = useQuote(quoteId);
  const project = useProjectDetail();
  const client = useClient(quote.data?.clientId ?? null);
  const lead = useLeadSummary(quote.data?.leadId ?? null);

  const status = useQuoteStatus();
  const remove = useDeleteQuote();
  const paymentLink = usePaymentLink();
  const download = useDownloadQuotePdf();

  const [confirmTarget, setConfirmTarget] = useState<QuoteStatus | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sendOpen, setSendOpen] = useState<null | 'approve' | 'send'>(null);
  const [copied, setCopied] = useState(false);

  if (quote.isLoading) {
    return (
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Skeleton className="h-[720px] w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (quote.isError || !quote.data) {
    return (
      <Card>
        <ErrorState
          message={errorMessage(quote.error ?? new Error('Cotización no encontrada'))}
          onRetry={() => quote.refetch()}
        />
      </Card>
    );
  }

  const data = quote.data;
  const currency = project.data?.quoteSettings.currency ?? 'GTQ';
  const canCreate = can('QUOTE_CREATE');
  const canApprove = can('QUOTE_APPROVE');

  // Contacto: el cliente si la cotización tiene uno; si no, el lead.
  const c = client.data;
  const l = lead.data;
  const contact: QuoteContact = {
    company: c?.company ?? l?.company ?? data.client?.name ?? null,
    name: c?.name ?? l?.name ?? data.lead?.name ?? null,
    position: c?.contactPosition ?? l?.contactPosition ?? null,
    email: c?.email ?? l?.email ?? null,
    phone: c?.phone ?? l?.phone ?? null,
  };

  async function transition(target: QuoteStatus) {
    try {
      await status.mutateAsync({ id: data.id, status: target });
      toast.success('Estado actualizado');
      setConfirmTarget(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function deleteDraft() {
    try {
      await remove.mutateAsync(data.id);
      toast.success(`Borrador ${data.folio} eliminado`);
      router.push('/cotizaciones');
    } catch (error) {
      toast.error(errorMessage(error));
      setConfirmDelete(false);
    }
  }

  async function createPaymentLink() {
    try {
      await paymentLink.mutateAsync(data.id);
      toast.success('Link de pago generado');
    } catch (error) {
      // 503 si Pagos no está configurado: se muestra el mensaje del backend.
      toast.error(errorMessage(error));
    }
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar; selecciona el link manualmente');
    }
  }

  function downloadPdf() {
    download.mutate(
      { id: data.id, folio: data.folio },
      { onError: (error) => toast.error(errorMessage(error)) },
    );
  }

  const confirm = confirmTarget ? CONFIRM_COPY[confirmTarget] : undefined;
  const busy = status.isPending;

  return (
    <div>
      <div className="mb-4 text-sm text-muted">
        <Link href="/cotizaciones" className="inline-flex items-center gap-1 font-medium hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Volver a Cotizaciones
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 rounded-2xl bg-slate-200/70 p-3 sm:p-8">
          <QuoteDocument quote={data} project={project.data} contact={contact} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Card>
            <div className="mb-4 flex items-center justify-between gap-2">
              <span className="font-mono text-lg font-semibold">{data.folio}</span>
              <QuoteStatusBadge status={data.status} />
            </div>
            <dl className="divide-y divide-line/70 text-sm">
              <Info label="Cliente" value={contact.company ?? '—'} />
              <Info label="Contacto" value={contact.name ?? '—'} />
              <Info label="Fecha" value={formatDate(data.creadoEn)} />
              <Info label="Validez" value={data.validUntil ? formatDate(data.validUntil) : 'Sin vencimiento'} />
              <Info label="Total" value={formatMoney(data.total, currency)} />
              <Info label="Responsable" value={data.createdBy?.name ?? '—'} />
              {data.sentAt ? <Info label="Enviada" value={formatDateTime(data.sentAt)} /> : null}
              {data.paidAt ? <Info label="Pagada" value={formatDateTime(data.paidAt)} /> : null}
              {data.paymentReference ? <Info label="Ref. de pago" value={data.paymentReference} /> : null}
            </dl>
            {data.origin === 'AI' ? (
              <div className="mt-4 rounded-xl border border-line bg-slate-50 p-3 text-xs text-muted">
                <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                  <Sparkles className="h-4 w-4" /> Generada por IA
                </p>
                Basada en el catálogo de productos y en la conversación con el lead. Requiere aprobación humana antes
                del envío.
              </div>
            ) : null}
          </Card>

          <Card className="space-y-2">
            {data.status === 'DRAFT' && canCreate ? (
              <>
                <Button
                  className="w-full"
                  onClick={() => transition('PENDING_APPROVAL')}
                  loading={busy}
                  disabled={data.items.length === 0}
                  title={data.items.length === 0 ? 'Agrega al menos una partida' : undefined}
                >
                  Enviar a aprobación
                </Button>
                <Link
                  href={`/cotizaciones/${data.id}/editar`}
                  className="flex h-10 w-full items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-ink hover:bg-slate-200"
                >
                  Editar
                </Link>
              </>
            ) : null}

            {data.status === 'PENDING_APPROVAL' ? (
              <>
                {canApprove ? (
                  <>
                    <Button variant="success" className="w-full" onClick={() => setSendOpen('approve')}>
                      Aprobar y enviar
                    </Button>
                    <Button variant="secondary" className="w-full" onClick={() => setConfirmTarget('APPROVED')}>
                      Solo aprobar
                    </Button>
                  </>
                ) : (
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Esperando la aprobación de un responsable con permiso para aprobar.
                  </p>
                )}
                {canCreate ? (
                  <Button variant="secondary" className="w-full" onClick={() => setConfirmTarget('DRAFT')}>
                    Devolver a borrador
                  </Button>
                ) : null}
              </>
            ) : null}

            {data.status === 'APPROVED' && canCreate ? (
              <Button variant="success" className="w-full" onClick={() => setSendOpen('send')}>
                Enviar por correo
              </Button>
            ) : null}

            {data.status === 'SENT' && canCreate ? (
              <>
                <Button variant="success" className="w-full" onClick={() => setConfirmTarget('ACCEPTED')}>
                  Marcar aceptada por el cliente
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => setSendOpen('send')}>
                  Reenviar por correo
                </Button>
              </>
            ) : null}

            {data.status === 'ACCEPTED' ? (
              <div className="space-y-2">
                {data.paymentLinkUrl ? (
                  <div className="rounded-xl border border-line bg-slate-50 p-3">
                    <p className="mb-1 text-xs font-semibold text-muted">Link de pago</p>
                    <p className="break-all font-mono text-xs text-ink">{data.paymentLinkUrl}</p>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyLink(data.paymentLinkUrl!)}>
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? 'Copiado' : 'Copiar'}
                      </Button>
                      <a
                        href={data.paymentLinkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-brand-600 hover:bg-brand-50"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Abrir
                      </a>
                    </div>
                  </div>
                ) : canCreate ? (
                  <Button className="w-full" onClick={createPaymentLink} loading={paymentLink.isPending}>
                    Generar link de pago
                  </Button>
                ) : null}
                {canApprove ? (
                  <Button variant="secondary" className="w-full" onClick={() => setConfirmTarget('PAID')}>
                    Marcar pagada
                  </Button>
                ) : null}
              </div>
            ) : null}

            <Button variant="secondary" className="w-full" onClick={downloadPdf} loading={download.isPending}>
              Descargar PDF
            </Button>

            {data.status === 'SENT' && canCreate ? (
              <button
                type="button"
                onClick={() => setConfirmTarget('REJECTED')}
                className="w-full py-2 text-sm font-semibold text-rose-600 hover:underline"
              >
                Marcar rechazada por el cliente
              </button>
            ) : null}

            {data.status === 'DRAFT' && canCreate ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="w-full py-2 text-sm font-semibold text-rose-600 hover:underline"
              >
                Eliminar borrador
              </button>
            ) : null}
          </Card>
        </aside>
      </div>

      {confirm && confirmTarget ? (
        <ConfirmDialog
          open
          onClose={() => setConfirmTarget(null)}
          onConfirm={() => transition(confirmTarget)}
          title={confirm.title}
          description={confirm.description}
          confirmLabel={confirm.label}
          danger={confirm.danger}
          loading={busy}
        />
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteDraft}
        title="¿Eliminar el borrador?"
        description={`${data.folio} se borrará definitivamente.`}
        confirmLabel="Eliminar"
        danger
        loading={remove.isPending}
      />

      <SendQuoteDialog
        open={sendOpen !== null}
        onClose={() => setSendOpen(null)}
        quote={data}
        defaultTo={contact.email}
        approveFirst={sendOpen === 'approve'}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-semibold text-ink">{value}</dd>
    </div>
  );
}
