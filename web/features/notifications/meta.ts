import {
  BadgeDollarSign,
  CalendarX,
  Check,
  CheckCheck,
  CircleAlert,
  Clock,
  FileClock,
  KeyRound,
  MessageCircle,
  Undo2,
  UserPlus,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { NotificationCategory, NotificationType } from '@flowcommerce/types';

// Icono, color y etiqueta de cada tipo (mockup Notificaciones). Los valores se
// escriben aquí como literales tipados en lugar de importar las constantes de
// @flowcommerce/types: así solo se importan tipos (no hace falta el build del
// paquete en tiempo de ejecución) y TypeScript avisa si falta un tipo nuevo.

export interface NotificationMeta {
  icon: LucideIcon;
  /** Fondo + color del icono cuadrado. */
  iconClass: string;
  label: string;
  /** Colores de la etiqueta junto al título. */
  badgeClass: string;
}

const QUOTE_BADGE = 'bg-blue-50 text-blue-600';

export const NOTIFICATION_META: Record<NotificationType, NotificationMeta> = {
  QUOTE_PENDING_APPROVAL: { icon: FileClock, iconClass: 'bg-brand-500 text-white', label: 'Cotización', badgeClass: QUOTE_BADGE },
  QUOTE_APPROVED: { icon: Check, iconClass: 'bg-emerald-500 text-white', label: 'Cotización', badgeClass: 'bg-emerald-50 text-emerald-700' },
  QUOTE_RETURNED: { icon: Undo2, iconClass: 'bg-amber-500 text-white', label: 'Cotización', badgeClass: 'bg-amber-50 text-amber-700' },
  QUOTE_ACCEPTED: { icon: CheckCheck, iconClass: 'bg-teal-500 text-white', label: 'Cotización', badgeClass: 'bg-teal-50 text-teal-700' },
  QUOTE_REJECTED: { icon: X, iconClass: 'bg-rose-500 text-white', label: 'Cotización', badgeClass: 'bg-rose-50 text-rose-600' },
  QUOTE_PAID: { icon: BadgeDollarSign, iconClass: 'bg-green-600 text-white', label: 'Cotización', badgeClass: 'bg-green-50 text-green-700' },
  QUOTE_EXPIRED: { icon: CalendarX, iconClass: 'bg-slate-400 text-white', label: 'Cotización', badgeClass: 'bg-slate-100 text-slate-600' },
  MESSAGE_RECEIVED: { icon: MessageCircle, iconClass: 'bg-slate-200 text-slate-700', label: 'Mensaje', badgeClass: 'bg-slate-100 text-slate-700' },
  LEAD_ASSIGNED: { icon: UserPlus, iconClass: 'bg-cyan-500 text-white', label: 'Lead', badgeClass: 'bg-cyan-50 text-cyan-700' },
  FOLLOW_UP_DUE: { icon: Clock, iconClass: 'bg-amber-500 text-white', label: 'Seguimiento', badgeClass: 'bg-amber-50 text-amber-700' },
  LEAD_STALE: { icon: CircleAlert, iconClass: 'bg-amber-500 text-white', label: 'Lead', badgeClass: 'bg-orange-50 text-orange-700' },
  ACCESS_REQUESTED: { icon: KeyRound, iconClass: 'bg-violet-500 text-white', label: 'Acceso', badgeClass: 'bg-violet-50 text-violet-700' },
};

export function notificationMeta(type: string): NotificationMeta {
  return (
    NOTIFICATION_META[type as NotificationType] ?? {
      icon: CircleAlert,
      iconClass: 'bg-slate-200 text-slate-700',
      label: 'Aviso',
      badgeClass: 'bg-slate-100 text-slate-700',
    }
  );
}

/** Píldoras de la bandeja (NotificationCategory del backend). */
export const NOTIFICATION_TABS: { value: NotificationCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'FOLLOW_UP', label: 'Seguimientos' },
  { value: 'MESSAGE', label: 'Mensajes' },
  { value: 'QUOTE', label: 'Cotizaciones' },
  { value: 'LEAD', label: 'Leads' },
];
