import type { Role } from '@flowcommerce/types';

// Respuestas de la API usadas en Configuración (fechas llegan como string ISO).

export interface Member {
  id: string; // membershipId
  userId: string;
  projectId: string;
  role: Role;
  name: string;
  email: string;
  phone?: string | null;
  position?: string | null;
  avatarUrl?: string | null;
}

export type InvitableRole = 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface Invitation {
  id: string;
  projectId: string;
  email: string;
  role: InvitableRole;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED';
  invitedByUserId: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  creadoEn: string;
}

export interface AccessRequestItem {
  id: string;
  projectId: string;
  email: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  atendidoEn: string | null;
  atendidoPorUserId: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface BillingProfile {
  legalName: string | null;
  taxId: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export interface QuoteSettings {
  taxPercent: number;
  folioPrefix: string;
  validityDays: number;
  defaultTerms: string | null;
  currency: string;
}

export interface ProjectDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  creadoEn: string;
  actualizadoEn: string;
  billing: BillingProfile;
  quoteSettings: QuoteSettings;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  billing?: Partial<BillingProfile>;
  quoteSettings?: Partial<QuoteSettings>;
}

export interface WhatsAppConfig {
  connected: boolean;
  source: 'project' | 'environment' | 'none';
  phoneNumberId: string | null;
  businessAccountId: string | null;
  /** Últimos 4 caracteres del token (el token nunca vuelve). */
  tokenLast4: string | null;
  updatedAt: string | null;
}

export interface SaveWhatsAppConfigInput {
  phoneNumberId: string;
  businessAccountId?: string;
  token: string;
}

export interface QuickReply {
  id: string;
  projectId: string;
  shortcut: string;
  title: string;
  content: string;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuickReplyInput {
  shortcut: string;
  title: string;
  content: string;
}

export type ApiKeyScope = 'catalog:read' | 'leads:read' | 'leads:write' | 'quotes:write';

export const API_KEY_SCOPES: { value: ApiKeyScope; label: string }[] = [
  { value: 'catalog:read', label: 'Leer catálogo' },
  { value: 'leads:read', label: 'Leer leads' },
  { value: 'leads:write', label: 'Crear leads' },
  { value: 'quotes:write', label: 'Crear cotizaciones' },
];

export interface ApiKey {
  id: string;
  projectId: string;
  name: string;
  prefix: string;
  scopes: ApiKeyScope[];
  createdByUserId: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  creadoEn: string;
}

export interface CreatedApiKey extends ApiKey {
  /** Clave completa: solo llega en la respuesta de creación. */
  key: string;
}

export interface Webhook {
  id: string;
  projectId: string;
  url: string;
  description: string | null;
  events: string[];
  secretPrefix: string;
  active: boolean;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatedWebhook extends Webhook {
  /** Secreto de firma: solo al crear o rotar. */
  secret: string;
}

export interface WebhookInput {
  url: string;
  description?: string | null;
  events: string[];
  active?: boolean;
}

export interface WebhookDelivery {
  id: string;
  event: string;
  status: 'SUCCESS' | 'FAILED';
  attempts: number;
  responseStatus: number | null;
  error: string | null;
  durationMs: number | null;
  createdAt: string;
}

export interface WebhookTestResult {
  status: 'SUCCESS' | 'FAILED';
  attempts: number;
  responseStatus: number | null;
  error: string | null;
}

/** "*" = todos los eventos (ALL_EVENTS del backend). */
export const ALL_WEBHOOK_EVENTS = '*';
