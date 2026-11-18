import { Logo } from '@/components/layout/logo';
import { formatDate, formatMoney } from '@/lib/format';
import type { ProjectDetail, QuoteDetail } from './types';

export interface QuoteContact {
  company: string | null;
  name: string | null;
  position: string | null;
  email: string | null;
  phone: string | null;
}

/**
 * Hoja tipo carta con la cotización (réplica en pantalla del PDF que genera el
 * servidor). Para el PDF oficial se descarga GET /quotes/:id/pdf.
 */
export function QuoteDocument({
  quote,
  project,
  contact,
}: {
  quote: QuoteDetail;
  project: ProjectDetail | undefined;
  contact: QuoteContact;
}) {
  const currency = project?.quoteSettings.currency ?? 'GTQ';
  const money = (value: number) => formatMoney(value, currency);
  const billing = project?.billing;
  const issuer = billing?.legalName || project?.name || '';
  const issuerLine1 = [billing?.taxId ? `NIT ${billing.taxId}` : null, billing?.address].filter(Boolean).join(' · ');
  const issuerLine2 = [billing?.phone, billing?.email].filter(Boolean).join(' · ');
  const items = quote.items.slice().sort((a, b) => a.position - b.position);

  return (
    <article className="mx-auto w-full max-w-[816px] bg-white p-6 text-ink shadow-md sm:p-10" aria-label={`Cotización ${quote.folio}`}>
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Logo />
          <p className="mt-4 font-display text-lg font-semibold">{issuer}</p>
          {issuerLine1 ? <p className="text-xs text-muted">{issuerLine1}</p> : null}
          {issuerLine2 ? <p className="text-xs text-muted">{issuerLine2}</p> : null}
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Cotización</p>
          <p className="font-mono text-2xl font-semibold text-brand-500">{quote.folio}</p>
          <p className="text-xs text-muted">Emitida: {formatDate(quote.creadoEn)}</p>
          <p className="text-xs text-muted">
            Válida hasta: {quote.validUntil ? formatDate(quote.validUntil) : 'sin vencimiento'}
          </p>
        </div>
      </header>

      <div className="my-6 h-0.5 bg-brand-500" />

      <section className="grid gap-6 border-b border-line pb-6 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Cliente</p>
          <p className="mt-1 font-semibold">{contact.company || contact.name || '—'}</p>
          {contact.company && contact.name ? (
            <p className="text-xs text-muted">
              {contact.name}
              {contact.position ? ` · ${contact.position}` : ''}
            </p>
          ) : contact.position ? (
            <p className="text-xs text-muted">{contact.position}</p>
          ) : null}
          <p className="text-xs text-muted">{[contact.email, contact.phone].filter(Boolean).join(' · ')}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Asesor</p>
          <p className="mt-1 font-semibold">{quote.createdBy?.name ?? '—'}</p>
          {quote.createdBy?.email ? <p className="text-xs text-muted">{quote.createdBy.email}</p> : null}
          {quote.createdBy?.phone ? <p className="text-xs text-muted">{quote.createdBy.phone}</p> : null}
        </div>
      </section>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2 text-left">Descripción</th>
              <th className="px-3 py-2 text-center">Cant.</th>
              <th className="px-3 py-2 text-right">P. unit.</th>
              <th className="px-3 py-2 text-center">Desc.</th>
              <th className="px-3 py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted">
                  Sin partidas
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-line/60">
                  <td className="px-3 py-3 font-semibold">{item.description}</td>
                  <td className="px-3 py-3 text-center">{item.quantity}</td>
                  <td className="px-3 py-3 text-right font-mono">{money(item.unitPrice)}</td>
                  <td className="px-3 py-3 text-center text-muted">
                    {item.discountPercent ? `${item.discountPercent}%` : '—'}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold">{money(item.lineTotal)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <dl className="w-full max-w-xs space-y-2 text-sm">
          <Row label="Subtotal" value={money(quote.subtotal)} />
          <Row label="Descuento" value={quote.discount ? `−${money(quote.discount)}` : money(0)} />
          <Row label={`IVA (${quote.taxPercent}%)`} value={money(quote.tax)} />
          <Row label="Ajuste comercial" value={quote.adjustment ? `−${money(quote.adjustment)}` : money(0)} />
          <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-100 px-3 py-3">
            <dt className="text-xs font-bold uppercase tracking-wide">Total</dt>
            <dd className="font-mono text-xl font-semibold text-emerald-600">
              {new Intl.NumberFormat('es-GT', { style: 'currency', currency, minimumFractionDigits: 2 }).format(
                quote.total,
              )}
            </dd>
          </div>
        </dl>
      </div>

      {quote.notes || quote.terms ? (
        <footer className="mt-8 space-y-4 border-t border-line pt-6 text-sm">
          {quote.notes ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Notas</p>
              <p className="mt-1 whitespace-pre-line text-slate-600">{quote.notes}</p>
            </div>
          ) : null}
          {quote.terms ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Condiciones</p>
              <p className="mt-1 whitespace-pre-line text-slate-600">{quote.terms}</p>
            </div>
          ) : null}
        </footer>
      ) : null}
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-mono">{value}</dd>
    </div>
  );
}
