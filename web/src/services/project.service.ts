import type { ApiRole } from '@/types/domain'
import { http, pp } from './http'

/** Datos de la empresa activa (GET/PATCH /projects/:projectId). */
export interface ProjectDetail {
  id: string
  name: string
  slug: string
  description: string | null
  billing: {
    legalName: string | null
    taxId: string | null
    address: string | null
    phone: string | null
    email: string | null
  }
  quoteSettings: {
    taxPercent: number
    folioPrefix: string
    validityDays: number
    defaultTerms: string | null
    currency: string
  }
}

export interface ProjectUpdate {
  name?: string
  description?: string | null
  billing?: Partial<ProjectDetail['billing']>
  quoteSettings?: Partial<ProjectDetail['quoteSettings']>
}

export type InvitableRole = Exclude<ApiRole, 'OWNER'>

export interface Invitation {
  id: string
  email: string
  role: InvitableRole
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED'
  expiresAt: string
  creadoEn: string
}

export const projectService = {
  // pp('') = /projects/<empresa activa>
  get: () => http.get<ProjectDetail>(pp('')),
  update: (input: ProjectUpdate) => http.patch<ProjectDetail>(pp(''), input),
  invitations: () => http.get<Invitation[]>(pp('/invitations')),
  invite: (input: { email: string; role: InvitableRole }) => http.post<Invitation>(pp('/invitations'), input),
  revokeInvitation: (id: string) => http.delete<void>(pp(`/invitations/${id}`)),
}
