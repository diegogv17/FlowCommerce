import type { Note, NoteInput } from '@/types/domain'
import { authService } from './auth.service'
import { ApiError, getCurrentProject, http, pp, type ApiPaginated } from './http'
import { splitNoteBody, toNote, type ApiFollowUp, type ApiFollowUpStatus } from './mappers/leads'

/**
 * "Notas y seguimientos" de la interfaz = seguimientos (follow-ups) de la API.
 *  - Se crean dentro de un lead: POST /leads/:leadId/follow-ups (lead y fecha obligatorios).
 *  - Se listan, editan, completan y borran en /follow-ups.
 *  - DONE y CANCELLED son finales: no se pueden reabrir.
 */

const PAGE_LIMIT = 100
const MAX_PAGES = 5

/* Nombres del equipo para mostrar el autor (createdByUserId). Caché por empresa. */
let membersCache: { projectId: string; names: Promise<Map<string, string>> } | null = null

function memberNames(): Promise<Map<string, string>> {
  const projectId = getCurrentProject() ?? ''
  if (!membersCache || membersCache.projectId !== projectId) {
    const names = authService
      .users()
      .then((users) => new Map(users.map((u) => [u.id, u.name])))
      .catch(() => new Map<string, string>())
    membersCache = { projectId, names }
  }
  return membersCache.names
}

async function mapAll(items: ApiFollowUp[]): Promise<Note[]> {
  const names = await memberNames()
  return items.map((f) => toNote(f, (userId) => (userId ? names.get(userId) : undefined)))
}

async function mapOne(item: ApiFollowUp): Promise<Note> {
  return (await mapAll([item]))[0]
}

async function list(params: { leadId?: string; done?: boolean } = {}): Promise<Note[]> {
  const status: ApiFollowUpStatus | undefined = params.done === undefined ? undefined : params.done ? 'DONE' : 'PENDING'
  const query = { leadId: params.leadId, status, limit: PAGE_LIMIT }
  const first = await http.get<ApiPaginated<ApiFollowUp>>(pp('/follow-ups'), { params: { ...query, page: 1 } })
  const pages = Math.min(first.meta.totalPages, MAX_PAGES)
  const rest = await Promise.all(
    Array.from({ length: Math.max(pages - 1, 0) }, (_, i) =>
      http.get<ApiPaginated<ApiFollowUp>>(pp('/follow-ups'), { params: { ...query, page: i + 2 } }),
    ),
  )
  return mapAll([first, ...rest].flatMap((r) => r.data))
}

async function create(input: NoteInput): Promise<Note> {
  if (!input.leadId) throw new ApiError(400, 'Selecciona el lead del seguimiento.')
  if (!input.followUpAt) throw new ApiError(400, 'Indica la fecha del seguimiento.')
  const { title, notes } = splitNoteBody(input.body)
  const created = await http.post<ApiFollowUp>(pp(`/leads/${input.leadId}/follow-ups`), {
    type: input.type ?? 'TASK',
    title,
    notes,
    dueAt: new Date(input.followUpAt).toISOString(),
  })
  return mapOne(created)
}

async function update(id: string, input: Partial<Pick<Note, 'body' | 'done' | 'followUpAt'>>): Promise<Note> {
  if (input.done === false) {
    throw new ApiError(409, 'Un seguimiento completado no se puede reabrir. Registra uno nuevo.')
  }
  const body: Record<string, unknown> = {}
  if (input.body !== undefined) Object.assign(body, splitNoteBody(input.body))
  if (input.followUpAt) body.dueAt = new Date(input.followUpAt).toISOString()
  if (input.done === true) body.status = 'DONE'
  return mapOne(await http.patch<ApiFollowUp>(pp(`/follow-ups/${id}`), body))
}

export const notesService = {
  list,
  create,
  update,
  remove: (id: string) => http.delete<void>(pp(`/follow-ups/${id}`)),
}
