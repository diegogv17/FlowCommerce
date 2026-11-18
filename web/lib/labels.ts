import type { LeadSource, LeadStage, QuoteStatus } from '@flowcommerce/types';

// Etiquetas en español y colores de los estados (según los mockups).

export const LEAD_STAGES: { value: LeadStage; label: string; color: string; bar: string }[] = [
  { value: 'NEW' as LeadStage, label: 'Nuevo', color: 'bg-cyan-100 text-cyan-700', bar: 'bg-cyan-500' },
  { value: 'CONTACTED' as LeadStage, label: 'Contactado', color: 'bg-blue-100 text-blue-700', bar: 'bg-blue-500' },
  { value: 'QUALIFIED' as LeadStage, label: 'Seguimiento', color: 'bg-violet-100 text-violet-700', bar: 'bg-violet-500' },
  { value: 'PROPOSAL' as LeadStage, label: 'Cotización', color: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500' },
  { value: 'NEGOTIATION' as LeadStage, label: 'Negociación', color: 'bg-orange-100 text-orange-700', bar: 'bg-orange-500' },
  { value: 'WON' as LeadStage, label: 'Ganado', color: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' },
  { value: 'LOST' as LeadStage, label: 'Perdido', color: 'bg-rose-100 text-rose-700', bar: 'bg-rose-500' },
];

export function stageInfo(stage: string) {
  return LEAD_STAGES.find((item) => item.value === stage) ?? {
    value: stage as LeadStage,
    label: stage,
    color: 'bg-slate-100 text-slate-700',
    bar: 'bg-slate-400',
  };
}

export const QUOTE_STATUSES: { value: QuoteStatus; label: string; color: string; chart: string }[] = [
  { value: 'DRAFT' as QuoteStatus, label: 'Borrador', color: 'bg-violet-100 text-violet-700', chart: '#8b5cf6' },
  { value: 'PENDING_APPROVAL' as QuoteStatus, label: 'Pendiente', color: 'bg-amber-100 text-amber-700', chart: '#f59e0b' },
  { value: 'APPROVED' as QuoteStatus, label: 'Aprobada', color: 'bg-emerald-100 text-emerald-700', chart: '#10b981' },
  { value: 'SENT' as QuoteStatus, label: 'Enviada', color: 'bg-blue-100 text-blue-700', chart: '#3b82f6' },
  { value: 'ACCEPTED' as QuoteStatus, label: 'Aceptada', color: 'bg-teal-100 text-teal-700', chart: '#14b8a6' },
  { value: 'PAID' as QuoteStatus, label: 'Pagada', color: 'bg-green-100 text-green-700', chart: '#16a34a' },
  { value: 'REJECTED' as QuoteStatus, label: 'Rechazada', color: 'bg-rose-100 text-rose-700', chart: '#f43f5e' },
];

export function quoteStatusInfo(status: string) {
  return QUOTE_STATUSES.find((item) => item.value === status) ?? {
    value: status as QuoteStatus,
    label: status,
    color: 'bg-slate-100 text-slate-700',
    chart: '#94a3b8',
  };
}

export const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: 'WEBSITE' as LeadSource, label: 'Sitio web' },
  { value: 'WHATSAPP' as LeadSource, label: 'WhatsApp' },
  { value: 'REFERRAL' as LeadSource, label: 'Referido' },
  { value: 'SOCIAL_MEDIA' as LeadSource, label: 'Redes sociales' },
  { value: 'EVENT' as LeadSource, label: 'Evento' },
  { value: 'COLD_OUTREACH' as LeadSource, label: 'Prospección' },
  { value: 'OTHER' as LeadSource, label: 'Otro' },
];

export function sourceLabel(source: string | null | undefined) {
  return LEAD_SOURCES.find((item) => item.value === source)?.label ?? source ?? '—';
}

export const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  MEMBER: 'Asesor',
  VIEWER: 'Solo lectura',
};
