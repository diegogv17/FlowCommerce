'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, FilePlus2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, ConfirmDialog, ErrorState, Skeleton, Tabs } from '@/components/ui';
import { useProject } from '@/hooks/use-project';
import { ApiError, errorMessage } from '@/lib/api';
import { formatMoney, formatNumber, initials } from '@/lib/format';
import { ClientFormDialog } from '@/features/clients/client-form-dialog';
import {
  ClientActivityTab,
  ClientDataCard,
  ClientFilesTab,
  ClientPaymentsTab,
  ClientQuotesTab,
  CommercialHistoryCard,
} from '@/features/clients/client-tabs';
import { useClient, useClientStats, useDeleteClient, useUpdateClient } from '@/features/clients/hooks';
import { useProjectDetail } from '@/features/quotes/hooks';

type Tab = 'resumen' | 'actividad' | 'cotizaciones' | 'archivos' | 'pagos';

function monthYear(value: string) {
  return new Date(value).toLocaleDateString('es-GT', { month: 'long', year: 'numeric' });
}

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const router = useRouter();
  const { can } = useProject();
  const client = useClient(clientId);
  const stats = useClientStats(clientId);
  const project = useProjectDetail();
  const update = useUpdateClient();
  const remove = useDeleteClient();

  const [tab, setTab] = useState<Tab>('resumen');
  const [editOpen, setEditOpen] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // 409 al borrar: tiene historial, se sugiere desactivar.
  const [suggestDeactivate, setSuggestDeactivate] = useState(false);

  if (client.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }
  if (client.isError || !client.data) {
    return (
      <Card>
        <ErrorState
          message={errorMessage(client.error ?? new Error('Cliente no encontrado'))}
          onRetry={() => client.refetch()}
        />
      </Card>
    );
  }

  const data = client.data;
  const currency = project.data?.quoteSettings.currency ?? 'GTQ';
  const canUpdate = can('CLIENT_UPDATE');
  const s = stats.data;
  const averageTicket = s && s.paidQuotesCount > 0 ? s.salesTotal / s.paidQuotesCount : null;

  async function setActive(active: boolean) {
    try {
      await update.mutateAsync({ id: data.id, input: { active } });
      toast.success(active ? 'Cliente reactivado' : 'Cliente desactivado');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setConfirmToggle(false);
      setSuggestDeactivate(false);
    }
  }

  async function deleteClient() {
    try {
      await remove.mutateAsync(data.id);
      toast.success('Cliente eliminado');
      router.push('/clientes');
    } catch (error) {
      setConfirmDelete(false);
      if (error instanceof ApiError && error.status === 409) {
        // Tiene leads o cotizaciones: no se puede borrar sin perder historial.
        setSuggestDeactivate(true);
      } else {
        toast.error(errorMessage(error));
      }
    }
  }

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: 'resumen', label: 'Resumen' },
    { value: 'actividad', label: 'Actividad' },
    { value: 'cotizaciones', label: 'Cotizaciones', count: s?.quotesCount },
    { value: 'archivos', label: 'Archivos' },
    { value: 'pagos', label: 'Pagos', count: s?.paidQuotesCount },
  ];

  return (
    <div>
      <div className="mb-4 text-sm text-muted">
        <Link href="/clientes" className="inline-flex items-center gap-1 font-medium hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Volver a Clientes
        </Link>
      </div>

      <Card className="mb-5 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-lg font-semibold text-white">
            {initials(data.name)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-ink">{data.name}</h1>
              {data.active ? (
                <Badge className="bg-emerald-600 text-white">Cliente activo</Badge>
              ) : (
                <Badge className="bg-slate-200 text-slate-600">Inactivo</Badge>
              )}
            </div>
            <p className="text-sm text-muted">
              {[data.company, `Cliente desde ${monthYear(data.creadoEn)}`].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-line">
          <Stat label="Ventas totales" value={s ? formatMoney(s.salesTotal, currency) : null} />
          <Stat label="Cotizaciones" value={s ? formatNumber(s.quotesCount) : null} />
          <Stat label="Ticket promedio" value={s ? (averageTicket === null ? '—' : formatMoney(averageTicket, currency)) : null} />
        </div>
      </Card>

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <Tabs tabs={tabs} value={tab} onChange={setTab} className="flex-1" />
        <div className="flex flex-wrap gap-2">
          {can('QUOTE_CREATE') && data.active ? (
            <Link
              href={`/cotizaciones/nueva?clientId=${data.id}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-500 px-3 text-xs font-semibold text-white hover:bg-brand-600"
            >
              <FilePlus2 className="h-3.5 w-3.5" /> Nueva cotización
            </Link>
          ) : null}
          {canUpdate ? (
            <Button size="sm" variant="outline" onClick={() => (data.active ? setConfirmToggle(true) : setActive(true))}>
              {data.active ? 'Desactivar' : 'Reactivar'}
            </Button>
          ) : null}
          {can('CLIENT_DELETE') ? (
            <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setConfirmDelete(true)}>
              Eliminar
            </Button>
          ) : null}
        </div>
      </div>

      {tab === 'resumen' ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <ClientDataCard client={data} canEdit={canUpdate} onEdit={() => setEditOpen(true)} />
          <CommercialHistoryCard clientId={data.id} onSeeAll={() => setTab('actividad')} />
        </div>
      ) : null}
      {tab === 'actividad' ? <ClientActivityTab clientId={data.id} /> : null}
      {tab === 'cotizaciones' ? (
        <ClientQuotesTab clientId={data.id} currency={currency} canCreate={can('QUOTE_CREATE')} active={data.active} />
      ) : null}
      {tab === 'archivos' ? <ClientFilesTab clientId={data.id} canUpload={canUpdate} /> : null}
      {tab === 'pagos' ? <ClientPaymentsTab clientId={data.id} currency={currency} /> : null}

      <ClientFormDialog open={editOpen} onClose={() => setEditOpen(false)} client={data} />

      <ConfirmDialog
        open={confirmToggle}
        onClose={() => setConfirmToggle(false)}
        onConfirm={() => setActive(false)}
        title="¿Desactivar el cliente?"
        description="No podrá recibir cotizaciones nuevas. Su historial se conserva y puedes reactivarlo cuando quieras."
        confirmLabel="Desactivar"
        danger
        loading={update.isPending}
      />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteClient}
        title="¿Eliminar el cliente?"
        description="Solo se puede eliminar un cliente sin leads ni cotizaciones. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        loading={remove.isPending}
      />
      <ConfirmDialog
        open={suggestDeactivate}
        onClose={() => setSuggestDeactivate(false)}
        onConfirm={() => (data.active ? setActive(false) : setSuggestDeactivate(false))}
        title="No se puede eliminar"
        description="Este cliente tiene leads o cotizaciones asociadas. Para conservar el historial, desactívalo en su lugar."
        confirmLabel={data.active ? 'Desactivar' : 'Entendido'}
        loading={update.isPending}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="px-4 first:pl-0 lg:first:pl-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px]">{label}</p>
      {value === null ? (
        <Skeleton className="mt-1 h-7 w-20" />
      ) : (
        <p className="font-mono text-lg font-semibold text-ink sm:text-xl">{value}</p>
      )}
    </div>
  );
}
