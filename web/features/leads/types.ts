import type {
  ActivityType,
  AttachmentSource,
  FollowUpStatus,
  FollowUpType,
  LeadSource,
  LeadStage,
  QuoteStatus,
  RecordOrigin,
  Role,
} from '@flowcommerce/types';

// Tipos de respuesta de la API, copiados de los DTO del backend
// (src/<modulo>/presentation/dto). Las fechas llegan como string ISO.

export interface RefSummary {
  id: string;
  name: string;
}

/** LeadDto (src/leads/presentation/dto/lead.dto.ts) */
export interface Lead {
  id: string;
  projectId: string;
  name: string;
  email: string | null;
  phone: string | null;
  stage: LeadStage;
  score: number;
  company: string | null;
  contactPosition: string | null;
  origin: RecordOrigin;
  source: LeadSource | null;
  estimatedValue: number | null;
  notes: string | null;
  assignedUserId: string | null;
  assignedUser: RefSummary | null;
  clientId: string | null;
  client: RefSummary | null;
  interestProductId: string | null;
  interestProduct: RefSummary | null;
  lastContactAt: string | null;
  /** Próximo seguimiento PENDING; null si no tiene. */
  nextFollowUpAt: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

/** Campos de LEAD_SORT_FIELDS (lead.repository.ts). */
export type LeadSortField = 'createdAt' | 'updatedAt' | 'name' | 'estimatedValue' | 'lastContactAt';

/** Query de GET /leads (ListLeadsQueryDto). */
export interface LeadFilters {
  stages?: LeadStage[];
  search?: string;
  assignedUserId?: string;
  source?: LeadSource;
  clientId?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: LeadSortField;
  order?: 'asc' | 'desc';
}

/** Body de POST /leads (CreateLeadDto) y PATCH /leads/:id (UpdateLeadDto). */
export interface LeadInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  stage?: LeadStage;
  company?: string | null;
  contactPosition?: string | null;
  source?: LeadSource | null;
  estimatedValue?: number | null;
  notes?: string | null;
  assignedUserId?: string | null;
  interestProductId?: string | null;
}

/** LeadViewDto (src/lead-views/presentation/lead-views.dto.ts) */
export interface LeadViewFilters {
  stage?: LeadStage;
  stages?: LeadStage[];
  search?: string;
  assignedUserId?: string;
  source?: LeadSource;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: LeadSortField;
  order?: 'asc' | 'desc';
}

export interface LeadView {
  id: string;
  projectId: string;
  name: string;
  filters: LeadViewFilters;
  createdAt: string;
  updatedAt: string;
}

/** MemberDto (src/projects/presentation/dto/member.dto.ts) */
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

/** ProductDto, solo lo que usa el selector de "producto de interés". */
export interface ProductOption {
  id: string;
  name: string;
  price: number;
  active: boolean;
}

/** FollowUpDto (src/follow-ups/presentation/dto/follow-up.dto.ts) */
export interface FollowUp {
  id: string;
  projectId: string;
  leadId: string;
  lead: RefSummary;
  type: FollowUpType;
  title: string;
  notes: string | null;
  dueAt: string;
  status: FollowUpStatus;
  /** PENDING y con la fecha ya pasada. */
  overdue: boolean;
  assignedUserId: string | null;
  assignedUser: RefSummary | null;
  createdByUserId: string | null;
  completedAt: string | null;
  outcome: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface CreateFollowUpInput {
  type?: FollowUpType;
  title: string;
  notes?: string | null;
  dueAt: string;
  assignedUserId?: string | null;
}

export interface UpdateFollowUpInput {
  type?: FollowUpType;
  title?: string;
  notes?: string | null;
  dueAt?: string;
  assignedUserId?: string | null;
  status?: FollowUpStatus;
  outcome?: string | null;
}

/** ConvertLeadDto / ConvertLeadResponseDto (clients/presentation/dto/convert-lead.dto.ts) */
export interface ConvertLeadInput {
  clientId?: string;
  company?: string | null;
  taxId?: string | null;
  assignedUserId?: string | null;
  markAsWon?: boolean;
}

export interface ClientSummary {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  taxId: string | null;
}

export interface ConvertLeadResponse {
  client: ClientSummary;
  lead: Lead;
  possibleDuplicates: ClientSummary[];
}

/** ActivityEventDto (src/activity/presentation/dto/activity.dto.ts) */
export interface ActivityEvent {
  id: string;
  projectId: string;
  type: ActivityType;
  title: string;
  actor: RefSummary | null;
  leadId: string | null;
  clientId: string | null;
  quoteId: string | null;
  metadata: Record<string, unknown>;
  creadoEn: string;
}

/** AttachmentDto (src/files/presentation/dto/attachment.dto.ts) */
export interface Attachment {
  id: string;
  projectId: string;
  leadId: string | null;
  clientId: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  source: AttachmentSource;
  uploadedByUserId: string | null;
  creadoEn: string;
}

/** QuoteDto (src/quotes/presentation/dto/quote.dto.ts), campos que usa la pestaña. */
export interface LeadQuote {
  id: string;
  leadId: string;
  folio: string;
  status: QuoteStatus;
  subtotal: number;
  total: number;
  validUntil: string | null;
  origin: RecordOrigin;
  createdBy: { id: string; name: string } | null;
  sentAt: string | null;
  creadoEn: string;
}
