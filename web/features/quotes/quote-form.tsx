'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Plus, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AiBadge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Label,
  PageHeader,
  Select,
  Skeleton,
  Textarea,
} from '@/components/ui';
import { GenerateQuoteDialog } from '@/features/ai/generate-quote-dialog';
import { useClient, useClientOptions } from '@/features/clients/hooks';
import { useActiveProducts } from '@/features/products/hooks';
import type { Product } from '@/features/products/types';
import { useProject } from '@/hooks/use-project';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { calculateQuote } from './calculator';
import {
  useCreateQuote,
  useLeadOptions,
  useLeadSummary,
  useProjectDetail,
  useQuoteStatus,
  useUpdateQuote,
} from './hooks';
import { QuoteStatusBadge } from './quote-status-badge';
import type { QuoteDetail, QuoteItemInput, UpdateQuoteInput } from './types';
import { useDebounced } from './use-debounced';

// Formulario compartido de "Nueva cotización" y "Editar borrador".
//
// Los precios NO se editan: salen del catálogo y el servidor los vuelve a leer
// al guardar. El resumen de la derecha es solo una vista previa calculada con
// la misma fórmula que src/quotes/domain/quote-calculator.ts.

interface Row {
  key: string;
  productId: string;
  quantity: string;
  discountPercent: string;
  /** Descripción propia de la partida (p. ej. la que puso la IA). */
  description?: string;
  /** Datos guardados de una partida cuyo producto ya no está activo. */
  fallback?: { name: string; unitPrice: number; maxDiscountPercent: number };
}

let rowSeq = 0;
const newKey = () => `row-${Date.now()}-${rowSeq++}`;

const emptyRow = (): Row => ({ key: newKey(), productId: '', quantity: '1', discountPercent: '0' });

const orNull = (value: string) => (value.trim() ? value.trim() : null);
const twoDecimals = (value: string) => /^\d+(\.\d{1,2})?$/.test(value.trim());

/** yyyy-mm-dd (input date) ↔ ISO al final del día local. */
const toDateInput = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-CA') : '');
const fromDateInput = (value: string) => new Date(`${value}T23:59:59`).toISOString();

type SaveIntent = 'draft' | 'approval' | 'preview';

export function QuoteForm({
  quote,
  initialLeadId,
  initialClientId,
}: {
  /** Con cotización = editar ese borrador. */
  quote?: QuoteDetail;
  initialLeadId?: string;
  initialClientId?: string;
}) {
  const router = useRouter();
  const { can } = useProject();
  const isEdit = !!quote;

  const [leadId, setLeadId] = useState(quote?.leadId ?? initialLeadId ?? '');
  const [clientId, setClientId] = useState(quote?.clientId ?? initialClientId ?? '');
  const [leadSearch, setLeadSearch] = useState('');
  const [rows, setRows] = useState<Row[]>(() =>
    quote
      ? quote.items
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((item) => ({
            key: newKey(),
            productId: item.productId,
            quantity: String(item.quantity),
            discountPercent: String(item.discountPercent),
            description: item.description,
            fallback: { name: item.description, unitPrice: item.unitPrice, maxDiscountPercent: item.discountPercent },
          }))
      : [emptyRow()],
  );
  const [adjustment, setAdjustment] = useState(quote && quote.adjustment ? String(quote.adjustment) : '');
  const [validUntil, setValidUntil] = useState(toDateInput(quote?.validUntil ?? null));
  const [notes, setNotes] = useState(quote?.notes ?? '');
  const [terms, setTerms] = useState(quote?.terms ?? '');
  const [savedId, setSavedId] = useState<string | null>(quote?.id ?? null);
  const [busy, setBusy] = useState<SaveIntent | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const project = useProjectDetail();
  const products = useActiveProducts();
  const clientOptions = useClientOptions();
  const selectedClient = useClient(clientId || null);
  const selectedLead = useLeadSummary(leadId || null);
  const debouncedSearch = useDebounced(leadSearch);
  const leadOptions = useLeadOptions(
    clientId ? { clientId } : { search: debouncedSearch.trim() || undefined },
  );

  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const changeStatus = useQuoteStatus();

  const settings = project.data?.quoteSettings;
  const currency = settings?.currency ?? 'GTQ';
  const taxPercent = settings?.taxPercent ?? quote?.taxPercent ?? 12;
  const money = (value: number) => formatMoney(value, currency);

  // Condiciones por defecto del proyecto en una cotización nueva (una sola vez).
  const termsInitialized = useRef(isEdit);
  useEffect(() => {
    if (termsInitialized.current || !settings) return;
    termsInitialized.current = true;
    if (!terms && settings.defaultTerms) setTerms(settings.defaultTerms);
  }, [settings, terms]);

  // Si llega ?leadId= y el lead ya es cliente, se completa el cliente.
  const leadLinked = useRef(isEdit);
  useEffect(() => {
    if (leadLinked.current || !selectedLead.data) return;
    leadLinked.current = true;
    if (!clientId && selectedLead.data.clientId) setClientId(selectedLead.data.clientId);
  }, [selectedLead.data, clientId]);

  // Con un cliente elegido y un único lead vinculado, se selecciona solo.
  useEffect(() => {
    if (isEdit || !clientId || leadId || !leadOptions.data) return;
    if (leadOptions.data.length === 1) setLeadId(leadOptions.data[0]!.id);
  }, [isEdit, clientId, leadId, leadOptions.data]);

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const product of products.data ?? []) map.set(product.id, product);
    return map;
  }, [products.data]);

  // Datos por fila: precio y tope de descuento del catálogo (o lo guardado si
  // el producto ya no está activo).
  const resolved = rows.map((row) => {
    const product = productById.get(row.productId);
    const unitPrice = product?.price ?? row.fallback?.unitPrice ?? 0;
    const maxDiscount = product?.maxDiscountPercent ?? row.fallback?.maxDiscountPercent ?? 0;
    const inactive = !!row.productId && !product && !products.isLoading;
    return { row, product, unitPrice, maxDiscount, inactive };
  });

  const calc = calculateQuote(
    resolved
      .filter((item) => item.row.productId)
      .map((item) => ({
        quantity: Number(item.row.quantity) || 0,
        unitPrice: item.unitPrice,
        discountPercent: Number(item.row.discountPercent) || 0,
      })),
    taxPercent,
    Number(adjustment) || 0,
  );
  // calc.lines solo incluye filas con producto; se mapean por índice.
  let lineIndex = 0;
  const lineTotals = resolved.map((item) => (item.row.productId ? calc.lines[lineIndex++]?.lineTotal ?? 0 : 0));

  // ----- Validación -----
  const rowErrors = resolved.map(({ row, maxDiscount, inactive }) => {
    if (!row.productId) return 'Elige un producto';
    if (inactive) return 'Producto inactivo: cámbialo o quítalo';
    const quantity = Number(row.quantity);
    if (!twoDecimals(row.quantity) || quantity < 0.01) return 'Cantidad inválida';
    const discount = Number(row.discountPercent || 0);
    if (!twoDecimals(row.discountPercent || '0') || discount > maxDiscount) {
      return `Descuento máximo ${maxDiscount}%`;
    }
    return null;
  });
  const adjustmentError =
    adjustment && !twoDecimals(adjustment)
      ? 'Importe inválido'
      : calc.adjustmentExceeded
        ? `No puede superar ${money(calc.maxAdjustment)}`
        : null;
  const leadError = leadId ? null : 'Elige el lead de la cotización';

  // ----- Fila -----
  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function changeProduct(key: string, productId: string) {
    // Al cambiar de producto se descarta la descripción y el descuento previos.
    updateRow(key, { productId, description: undefined, fallback: undefined, discountPercent: '0' });
  }

  function changeDiscount(key: string, value: string, max: number) {
    // Se limita al máximo del producto mientras se escribe.
    const number = Number(value);
    updateRow(key, { discountPercent: value !== '' && number > max ? String(max) : value });
  }

  // ----- Guardar -----
  function buildItems(): QuoteItemInput[] {
    return rows.map((row) => {
      const item: QuoteItemInput = {
        productId: row.productId,
        quantity: Number(row.quantity),
        discountPercent: Number(row.discountPercent || 0),
      };
      if (row.description) item.description = row.description;
      return item;
    });
  }

  async function save(): Promise<QuoteDetail> {
    const common: UpdateQuoteInput = {
      notes: orNull(notes),
      terms: orNull(terms),
      adjustment: Number(adjustment || 0),
      items: buildItems(),
    };
    if (savedId) {
      return updateQuote.mutateAsync({
        id: savedId,
        input: {
          ...common,
          clientId: clientId || null,
          // En edición, vacío = sin vencimiento.
          validUntil: validUntil ? fromDateInput(validUntil) : null,
        },
      });
    }
    const created = await createQuote.mutateAsync({
      ...common,
      leadId,
      // Sin cliente elegido, el servidor usa el del lead.
      clientId: clientId || undefined,
      // Sin fecha, el servidor aplica la vigencia por defecto del proyecto.
      validUntil: validUntil ? fromDateInput(validUntil) : undefined,
    });
    setSavedId(created.id);
    return created;
  }

  async function handle(intent: SaveIntent) {
    setShowErrors(true);
    if (leadError || adjustmentError || rowErrors.some(Boolean)) {
      toast.error(leadError ?? adjustmentError ?? 'Revisa las partidas marcadas');
      return;
    }
    if (intent === 'approval' && rows.length === 0) {
      toast.error('Agrega al menos un producto antes de enviar a aprobación');
      return;
    }
    setBusy(intent);
    try {
      const saved = await save();
      if (intent === 'approval') {
        await changeStatus.mutateAsync({ id: saved.id, status: 'PENDING_APPROVAL' as QuoteDetail['status'] });
        toast.success(`${saved.folio} enviada a aprobación`);
        router.push(`/cotizaciones/${saved.id}`);
      } else if (intent === 'preview') {
        router.push(`/cotizaciones/${saved.id}`);
      } else {
        toast.success(`Borrador ${saved.folio} guardado`);
        if (!isEdit) router.replace(`/cotizaciones/${saved.id}/editar`);
      }
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  // ----- Opciones de los selectores -----
  const clients = useMemo(() => {
    const list = clientOptions.data ?? [];
    const current = selectedClient.data;
    return current && !list.some((item) => item.id === current.id) ? [current, ...list] : list;
  }, [clientOptions.data, selectedClient.data]);

  const leads = useMemo(() => {
    const list = leadOptions.data ?? [];
    const current = selectedLead.data;
    return current && !list.some((item) => item.id === current.id) ? [current, ...list] : list;
  }, [leadOptions.data, selectedLead.data]);

  function selectClient(id: string) {
    setClientId(id);
    // Se conserva el lead solo si pertenece al cliente elegido.
    if (!isEdit && id && selectedLead.data?.clientId !== id) setLeadId('');
  }

  function selectLead(id: string) {
    setLeadId(id);
    const lead = leads.find((item) => item.id === id);
    if (lead?.clientId && !clientId) setClientId(lead.clientId);
  }

  // ----- Render -----
  if (!can('QUOTE_CREATE')) {
    return (
      <Card>
        <EmptyState title="Sin permiso" description="Tu rol no permite crear ni editar cotizaciones." />
      </Card>
    );
  }

  if (quote && quote.status !== 'DRAFT') {
    return (
      <Card>
        <EmptyState
          title="Esta cotización ya no es un borrador"
          description="Solo se pueden editar cotizaciones en estado Borrador. Si estaba pendiente, devuélvela a borrador desde su vista."
          action={
            <Link href={`/cotizaciones/${quote.id}`} className="mt-2 text-sm font-semibold text-brand-600">
              Ver cotización
            </Link>
          }
        />
      </Card>
    );
  }

  const contact = selectedClient.data ?? null;
  const lead = selectedLead.data ?? null;
  const contactName = contact?.name ?? lead?.name ?? '';
  const company = contact?.company ?? lead?.company ?? '';
  const email = contact?.email ?? lead?.email ?? '';
  const phone = contact?.phone ?? lead?.phone ?? '';
  const isAi = quote?.origin === 'AI';
  const aiField = isAi ? 'border-emerald-400 ring-1 ring-emerald-200' : '';

  const subtitle = [company, contactName].filter(Boolean).join(' · ') || 'Elige el cliente o lead a cotizar';

  return (
    <div>
      <PageHeader
        back={
          <Link href="/cotizaciones" className="inline-flex items-center gap-1 font-medium hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Volver a Cotizaciones
          </Link>
        }
        title={quote ? `Cotización ${quote.folio}` : 'Nueva cotización'}
        subtitle={isAi ? `Borrador generado por IA${company ? ` para ${company}` : ''}` : subtitle}
        actions={
          <div className="inline-flex rounded-full bg-slate-200/70 p-1" role="group" aria-label="Modo de creación">
            <button
              type="button"
              className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-brand-600 shadow-sm"
              aria-pressed="true"
            >
              {isEdit ? 'Editar manualmente' : 'Crear manualmente'}
            </button>
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold text-muted hover:text-ink"
              aria-pressed="false"
            >
              <Sparkles className="h-4 w-4" /> Generar con IA
            </button>
          </div>
        }
      />

      {isAi ? (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-line bg-white/70 p-4 sm:flex-row sm:items-center">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="font-semibold text-ink">Cotización preparada por IA</p>
            <p className="text-sm text-muted">
              Revisa la información antes de aprobarla. Los campos con borde verde fueron completados automáticamente a
              partir del catálogo de productos y de la conversación con el lead.
            </p>
          </div>
          {quote ? <QuoteStatusBadge status={quote.status} /> : null}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          {/* Datos del cliente */}
          <Card>
            <CardHeader title="Datos del cliente" subtitle="Toda cotización pertenece a un lead; el cliente es opcional." />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Cliente">
                <Select value={clientId} onChange={(event) => selectClient(event.target.value)}>
                  <option value="">{isEdit ? 'Sin cliente' : 'Sin cliente (usar el del lead)'}</option>
                  {clients.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.company ? `${item.company} · ${item.name}` : item.name}
                      {item.active ? '' : ' (inactivo)'}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Lead *" error={showErrors ? (leadError ?? undefined) : undefined}>
                {isEdit ? (
                  <Input value={lead?.name ?? quote?.lead?.name ?? ''} disabled aria-label="Lead" />
                ) : (
                  <div className="space-y-2">
                    {!clientId ? (
                      <Input
                        aria-label="Buscar lead"
                        placeholder="Buscar lead por nombre, email o empresa…"
                        value={leadSearch}
                        onChange={(event) => setLeadSearch(event.target.value)}
                      />
                    ) : null}
                    <Select value={leadId} onChange={(event) => selectLead(event.target.value)} aria-label="Lead">
                      <option value="">
                        {leadOptions.isLoading ? 'Cargando leads…' : leads.length ? 'Elige un lead' : 'Sin leads'}
                      </option>
                      {leads.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                          {item.company ? ` · ${item.company}` : ''}
                        </option>
                      ))}
                    </Select>
                    {clientId && leadOptions.data && leadOptions.data.length === 0 ? (
                      <p className="text-xs text-amber-700">
                        Este cliente no tiene leads vinculados. Convierte o vincula un lead al cliente para poder
                        cotizarle.
                      </p>
                    ) : null}
                  </div>
                )}
              </Field>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {[
                { label: 'Contacto', value: contactName },
                { label: 'Empresa', value: company },
                { label: 'Email', value: email },
                { label: 'Teléfono', value: phone },
              ].map((field) => (
                <div key={field.label}>
                  <Label className="flex items-center gap-1.5">
                    {field.label} {isAi && field.value ? <AiBadge className="px-1.5 py-0 text-[10px]" /> : null}
                  </Label>
                  <Input value={field.value || '—'} readOnly aria-label={field.label} className={cn('bg-slate-50', aiField)} />
                </div>
              ))}
            </div>
          </Card>

          {/* Partidas */}
          <Card className="p-0">
            <div className="flex items-center justify-between px-5 pt-5">
              <h3 className="text-base font-semibold text-ink">Productos y servicios</h3>
              <span className="text-xs text-muted">Precios tomados del catálogo</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    <th className="px-5 py-2.5">Producto / servicio</th>
                    <th className="w-24 px-2 py-2.5 text-center">Cant.</th>
                    <th className="w-28 px-2 py-2.5 text-right">P. unitario</th>
                    <th className="w-24 px-2 py-2.5 text-center">Desc. %</th>
                    <th className="w-28 px-2 py-2.5 text-right">Subtotal</th>
                    <th className="w-12 px-2 py-2.5">
                      <span className="sr-only">Quitar</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-4">
                        <Skeleton className="h-10 w-full" />
                      </td>
                    </tr>
                  ) : null}
                  {!products.isLoading &&
                    resolved.map(({ row, product, unitPrice, maxDiscount, inactive }, index) => {
                      const error = showErrors ? rowErrors[index] : null;
                      return (
                        <tr key={row.key} className="border-b border-line/60 align-top">
                          <td className="px-5 py-3">
                            <Select
                              aria-label={`Producto de la partida ${index + 1}`}
                              value={row.productId}
                              onChange={(event) => changeProduct(row.key, event.target.value)}
                              className={cn(error && !row.productId && 'border-rose-400', isAi && row.productId && aiField)}
                            >
                              <option value="">Elige un producto…</option>
                              {inactive && row.fallback ? (
                                <option value={row.productId}>{row.fallback.name} (inactivo)</option>
                              ) : null}
                              {(products.data ?? []).map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name}
                                </option>
                              ))}
                            </Select>
                            {row.description && product && row.description !== product.name ? (
                              <p className="mt-1 text-xs text-muted">{row.description}</p>
                            ) : product?.description ? (
                              <p className="mt-1 line-clamp-1 text-xs text-muted">{product.description}</p>
                            ) : null}
                            {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
                          </td>
                          <td className="px-2 py-3">
                            <Input
                              aria-label={`Cantidad de la partida ${index + 1}`}
                              type="number"
                              inputMode="decimal"
                              min={0.01}
                              step="1"
                              value={row.quantity}
                              onChange={(event) => updateRow(row.key, { quantity: event.target.value })}
                              className="text-center font-semibold"
                            />
                          </td>
                          <td className="px-2 py-3 pt-5 text-right font-mono">{row.productId ? money(unitPrice) : '—'}</td>
                          <td className="px-2 py-3">
                            {row.productId && maxDiscount > 0 ? (
                              <Input
                                aria-label={`Descuento de la partida ${index + 1} (máximo ${maxDiscount}%)`}
                                title={`Máximo ${maxDiscount}%`}
                                type="number"
                                inputMode="decimal"
                                min={0}
                                max={maxDiscount}
                                step="1"
                                value={row.discountPercent}
                                onChange={(event) => changeDiscount(row.key, event.target.value, maxDiscount)}
                                className="text-center"
                              />
                            ) : (
                              <p className="pt-2 text-center text-muted" title="Este producto no admite descuento">
                                —
                              </p>
                            )}
                          </td>
                          <td className="px-2 py-3 pt-5 text-right font-mono font-semibold">
                            {row.productId ? money(lineTotals[index] ?? 0) : '—'}
                          </td>
                          <td className="px-2 py-3 pt-4">
                            <button
                              type="button"
                              onClick={() => setRows((prev) => prev.filter((item) => item.key !== row.key))}
                              className="rounded-full p-1.5 text-muted hover:bg-rose-50 hover:text-rose-600"
                              aria-label={`Quitar la partida ${index + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            {!products.isLoading && (products.data ?? []).length === 0 ? (
              <p className="px-5 pt-4 text-sm text-amber-700">
                No hay productos activos en el catálogo.{' '}
                <Link href="/productos" className="font-semibold underline">
                  Agrega productos
                </Link>{' '}
                para poder cotizar.
              </p>
            ) : null}
            <div className="p-5">
              <button
                type="button"
                onClick={() => setRows((prev) => [...prev, emptyRow()])}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-line px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50"
              >
                <Plus className="h-4 w-4" /> Agregar producto/servicio
              </button>
            </div>
          </Card>

          {/* Condiciones */}
          <Card>
            <CardHeader title="Notas y condiciones" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Ajuste comercial (Q)"
                error={adjustmentError ?? undefined}
                hint="Descuento global en dinero; se resta antes del IVA"
              >
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={adjustment}
                  onChange={(event) => setAdjustment(event.target.value.replace('-', ''))}
                />
              </Field>
              <Field
                label="Válida hasta"
                hint={
                  isEdit
                    ? 'Vacío = sin vencimiento'
                    : `Vacío = ${settings?.validityDays ?? 30} días desde hoy`
                }
              >
                <Input
                  type="date"
                  value={validUntil}
                  min={new Date().toLocaleDateString('en-CA')}
                  onChange={(event) => setValidUntil(event.target.value)}
                />
              </Field>
              <Field label="Notas para el cliente" className="sm:col-span-2">
                <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={5000} />
              </Field>
              <Field label="Términos y condiciones" className="sm:col-span-2">
                <Textarea
                  value={terms}
                  onChange={(event) => setTerms(event.target.value)}
                  maxLength={10000}
                  className="min-h-28"
                />
              </Field>
            </div>
          </Card>
        </div>

        {/* Resumen y acciones */}
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Card>
            <h3 className="mb-4 text-base font-semibold text-ink">Resumen</h3>
            <dl className="space-y-3 text-sm">
              <SummaryRow label="Subtotal" value={money(calc.subtotal)} />
              <SummaryRow label="Descuento" value={calc.discount ? `−${money(calc.discount)}` : money(0)} />
              <SummaryRow label={`IVA (${taxPercent}%)`} value={money(calc.tax)} />
              <SummaryRow label="Ajuste comercial" value={calc.adjustment ? `−${money(calc.adjustment)}` : money(0)} />
            </dl>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
              <span className="text-xs font-bold uppercase tracking-wide text-ink">Total</span>
              <span className="font-mono text-2xl font-semibold text-emerald-600">{money(calc.total)}</span>
            </div>
            <p className="mt-3 text-[11px] text-muted">
              Vista previa. Los importes definitivos los calcula el servidor con los precios vigentes del catálogo.
            </p>
          </Card>
          <Card className="space-y-2">
            <Button className="w-full" onClick={() => handle('preview')} loading={busy === 'preview'} disabled={!!busy}>
              Vista previa
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => handle('approval')}
              loading={busy === 'approval'}
              disabled={!!busy}
            >
              Enviar a aprobación
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => handle('draft')}
              loading={busy === 'draft'}
              disabled={!!busy}
            >
              Guardar borrador
            </Button>
            {isAi ? (
              <p className="rounded-xl bg-amber-400 px-3 py-2 text-xs font-medium text-amber-950">
                El envío al cliente requiere tu aprobación explícita. La IA no envía nada por su cuenta.
              </p>
            ) : null}
          </Card>
        </aside>
      </div>

      <GenerateQuoteDialog
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        leadId={leadId || undefined}
        clientId={clientId || undefined}
      />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="font-mono font-semibold text-ink">{value}</dd>
    </div>
  );
}
