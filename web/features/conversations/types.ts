import type {
  LeadSource,
  LeadStage,
  MessageDirection,
  MessageType,
  QuoteStatus,
} from '@flowcommerce/types';

// Tipos de respuesta de la API, copiados de los DTO del backend
// (src/messages/presentation/dto, src/files, src/quick-replies, src/quotes).
// Las fechas llegan como string ISO.

/** MessageDto (message.dto.ts) */
export interface Message {
  id: string;
  projectId: string;
  leadId: string;
  whatsappMessageId: string;
  direction: MessageDirection;
  type: MessageType;
  /** Texto. En plantillas, ya renderizado; en archivos, el pie o "[Documento] nombre.pdf". */
  content: string;
  templateName: string | null;
  attachmentId: string | null;
  /** SENT, DELIVERED, READ, FAILED, RECEIVED… */
  status: string;
  errorMessage: string | null;
  /** Solo INBOUND: null = no leído en el CRM. */
  readAt: string | null;
  creadoEn: string;
}

/** LeadMessagesDto: GET /leads/:leadId/messages */
export interface LeadMessagesPage {
  /** Del más antiguo al más reciente. */
  data: Message[];
  /** Enviar como ?before= para cargar más antiguos. null = no hay más. */
  nextCursor: string | null;
  /** Hasta cuándo se puede enviar texto libre. null = el cliente nunca escribió. */
  windowOpenUntil: string | null;
}

/** ConversationLeadDto */
export interface ConversationLead {
  id: string;
  name: string;
  phone: string | null;
  company: string | null;
  stage: LeadStage;
}

/** ConversationDto: un elemento de GET /conversations */
export interface Conversation {
  lead: ConversationLead;
  lastMessage: Message;
  unreadCount: number;
  windowOpenUntil: string | null;
}

/** UnreadCountDto: GET /conversations/unread-count */
export interface UnreadCount {
  conversations: number;
  messages: number;
}

/** Query de GET /conversations (ListConversationsQueryDto). */
export interface ConversationFilters {
  search?: string;
  unread?: boolean;
}

/** QuickReplyDto: GET /quick-replies */
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

/** WhatsAppTemplateDto: GET /whatsapp/templates */
export interface WhatsAppTemplate {
  name: string;
  language: string;
  category: string;
  status: string;
  bodyText: string | null;
  bodyParameterCount: number;
  /** true = no se puede enviar desde el CRM (encabezado con datos). */
  headerNeedsParameters: boolean;
}

/** AttachmentDto: respuesta de POST /attachments */
export interface UploadedAttachment {
  id: string;
  projectId: string;
  leadId: string | null;
  clientId: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  source: string;
  uploadedByUserId: string | null;
  creadoEn: string;
}

/** Body de POST /messages/template (SendTemplateMessageDto). */
export interface SendTemplateInput {
  name: string;
  language: string;
  parameters: string[];
}

/** Lo que el panel derecho usa de LeadDto (GET /leads/:leadId). */
export interface LeadPanelData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  stage: LeadStage;
  company: string | null;
  source: LeadSource | null;
  estimatedValue: number | null;
  assignedUser: { id: string; name: string } | null;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
}

/** Lo que el panel derecho usa de QuoteDto (GET /quotes?leadId=). */
export interface LeadQuoteSummary {
  id: string;
  folio: string;
  total: number;
  status: QuoteStatus;
  creadoEn: string;
}
