// Tipos de cotizaciones, copiados de src/quotes/presentation/dto.
import type { QuoteStatus, RecordOrigin } from '@flowcommerce/types';
import type { Paginated } from '@/lib/api';

export interface QuoteRef {
  id: string;
  name: string;
}

/** Asesor que creó la cotización (columna Responsable y PDF). */
export interface QuoteAdvisor {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface QuoteItem {
  id: string;
  quoteId: string;
  productId: string;
  description: string;
  quantity: number;
  /** Precio de lista copiado del catálogo al guardar. */
  unitPrice: number;
  discountPercent: number;
  /** quantity * unitPrice - descuento de la línea (antes de IVA). */
  lineTotal: number;
  position: number;
}

export interface Quote {
  id: string;
  projectId: string;
  leadId: string;
  lead: QuoteRef | null;
  clientId: string | null;
  client: QuoteRef | null;
  folio: string;
  subtotal: number;
  discount: number;
  adjustment: number;
  taxPercent: number;
  tax: number;
  total: number;
  status: QuoteStatus;
  validUntil: string | null;
  notes: string | null;
  terms: string | null;
  createdByUserId: string | null;
  createdBy: QuoteAdvisor | null;
  origin: RecordOrigin;
  paymentLinkUrl: string | null;
  paymentReference: string | null;
  approvedAt: string | null;
  sentAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  paidAt: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface QuoteDetail extends Quote {
  items: QuoteItem[];
}

export interface PaginatedQuotes extends Paginated<Quote> {
  meta: Paginated<Quote>['meta'] & {
    /** Suma de total de TODAS las cotizaciones del filtro. */
    sumTotal: number;
  };
}

export interface QuoteFilters {
  status?: QuoteStatus;
  clientId?: string;
  leadId?: string;
  createdByUserId?: string;
  origin?: RecordOrigin;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: 'createdAt' | 'total' | 'folio';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/** Partida del body: el precio NO se envía, sale del catálogo. */
export interface QuoteItemInput {
  productId: string;
  quantity: number;
  discountPercent?: number;
  description?: string;
}

export interface CreateQuoteInput {
  leadId: string;
  clientId?: string | null;
  validUntil?: string | null;
  notes?: string | null;
  terms?: string | null;
  adjustment?: number;
  items?: QuoteItemInput[];
}

export type UpdateQuoteInput = Omit<CreateQuoteInput, 'leadId'>;

export interface SendQuoteInput {
  to?: string;
  cc?: string[];
  message?: string;
}

/** Datos del proyecto que salen en el documento (GET /projects/:id). */
export interface ProjectDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  billing: {
    legalName: string | null;
    taxId: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
  };
  quoteSettings: {
    taxPercent: number;
    folioPrefix: string;
    validityDays: number;
    defaultTerms: string | null;
    currency: string;
  };
}

/** Lo que el formulario necesita de un lead (GET /leads y /leads/:id). */
export interface LeadSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  contactPosition: string | null;
  clientId: string | null;
  client: QuoteRef | null;
}
