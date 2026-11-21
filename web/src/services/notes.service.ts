import type { Note, NoteInput } from '@/types/domain'
import { http } from './http'

export const notesService = {
  list: (params: { leadId?: string; done?: boolean } = {}) => http.get<Note[]>('/notes', { params }),
  create: (input: NoteInput) => http.post<Note>('/notes', input),
  update: (id: string, input: Partial<Pick<Note, 'body' | 'done' | 'followUpAt'>>) =>
    http.patch<Note>(`/notes/${id}`, input),
  remove: (id: string) => http.delete<{ ok: boolean }>(`/notes/${id}`),
}
