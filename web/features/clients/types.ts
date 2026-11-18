// Tipos de clientes, copiados de src/clients/presentation/dto y de los DTO de
// actividad, adjuntos y miembros que usa la ficha.
import type { ActivityType, Role } from '@flowcommerce/types';
import type { Paginated } from '@/lib/api';

export interface Client {
  id: string;
  projectId: string;
  /** Contacto principal. */
  name: string;
  company: string | null;
  /** Cargo del contacto (sale en el PDF). */
  contactPosition: string | null;
  /** NIT. */
  taxId: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  assignedUserId: string | null;
  assignedUser: { id: string; name: string } | null;
  sourceLeadId: string | null;
  active: boolean;
  /** "Cliente desde". */
  creadoEn: string;
  actualizadoEn: string;
}

/** Números comerciales (GET /clients/:id/stats y cada fila del listado). */
export interface ClientStats {
  quotesCount: number;
  paidQuotesCount: number;
  /** Suma de total de las cotizaciones PAID. */
  salesTotal: number;
  lastActivityAt: string | null;
}

export type ClientListItem = Client & ClientStats;

export interface ClientsSummary {
  activeClients: number;
  billedThisYear: number;
}

export interface PaginatedClients extends Paginated<ClientListItem> {
  summary: ClientsSummary;
}

export interface ClientFilters {
  search?: string;
  assignedUserId?: string;
  active?: boolean;
  sortBy?: 'name' | 'createdAt';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ClientInput {
  name: string;
  company?: string | null;
  contactPosition?: string | null;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  assignedUserId?: string | null;
}

export type UpdateClientInput = Partial<ClientInput> & { active?: boolean };

/** Miembro del proyecto (GET /projects/:id/members). */
export interface Member {
  id: string;
  userId: string;
  projectId: string;
  role: Role;
  name: string;
  email: string;
  phone?: string | null;
  position?: string | null;
  avatarUrl?: string | null;
}

export interface ActivityEvent {
  id: string;
  projectId: string;
  type: ActivityType;
  title: string;
  actor: { id: string; name: string } | null;
  leadId: string | null;
  clientId: string | null;
  quoteId: string | null;
  metadata: Record<string, unknown>;
  creadoEn: string;
}

export interface Attachment {
  id: string;
  projectId: string;
  leadId: string | null;
  clientId: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  source: 'UPLOAD' | 'WHATSAPP';
  uploadedByUserId: string | null;
  creadoEn: string;
}
