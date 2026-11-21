import type { ApiRole, ProfileInput, ProjectSummary, Role, User } from '@/types/domain'
import { env } from '@/config/env'
import { http, pp } from './http'

/* Formas que devuelve la API */
interface ApiProfile {
  id: string
  name: string
  email: string
  phone: string | null
  position: string | null
  avatarUrl: string | null
}

interface ApiMember {
  id: string
  userId: string
  role: ApiRole
  name: string
  email: string
  phone?: string | null
  position?: string | null
  avatarUrl?: string | null
}

const ROLE_UI: Record<ApiRole, { role: Role; label: string }> = {
  OWNER: { role: 'admin', label: 'Propietario' },
  ADMIN: { role: 'admin', label: 'Administrador' },
  MEMBER: { role: 'asesor', label: 'Asesor' },
  VIEWER: { role: 'supervisor', label: 'Solo lectura' },
}

/** La API devuelve avatarUrl como ruta (/api/v1/users/…); se vuelve absoluta. */
export function absoluteAvatar(path: string | null | undefined): string | null {
  if (!path) return null
  if (/^https?:/.test(path)) return path
  const origin = env.apiUrl.replace(/\/api\/v1$/, '')
  return `${origin}${path}`
}

export function toUser(p: ApiProfile, apiRole?: ApiRole): User {
  const ui = ROLE_UI[apiRole ?? 'MEMBER']
  return {
    id: p.id,
    userId: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone ?? undefined,
    position: p.position,
    avatarUrl: absoluteAvatar(p.avatarUrl),
    role: ui.role,
    roleLabel: ui.label,
    apiRole,
  }
}

function memberToUser(m: ApiMember): User {
  const ui = ROLE_UI[m.role] ?? ROLE_UI.MEMBER
  // `id` = userId: así sirve como ownerId / assignedUserId en leads y filtros.
  return {
    id: m.userId,
    userId: m.userId,
    name: m.name,
    email: m.email,
    phone: m.phone ?? undefined,
    position: m.position ?? null,
    avatarUrl: absoluteAvatar(m.avatarUrl),
    role: ui.role,
    roleLabel: ui.label,
    apiRole: m.role,
  }
}

export const authService = {
  /** Perfil del usuario de la sesión (sin rol; el rol depende de la empresa). */
  profile: () => http.get<ApiProfile>('/users/me'),
  myProjects: () => http.get<ProjectSummary[]>('/projects/my'),
  createProject: (input: { name: string; slug: string; description?: string }) =>
    http.post<ProjectSummary>('/projects', input),
  updateProfile: (input: ProfileInput & { position?: string | null }) =>
    http.patch<ApiProfile>('/users/me', {
      name: input.name,
      phone: input.phone?.trim() ? input.phone.trim() : null,
      ...(input.position !== undefined ? { position: input.position } : {}),
    }),
  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return http.upload<ApiProfile>('/users/me/avatar', form, 'PUT')
  },
  /** Equipo de la empresa activa (selects de responsable y Configuración → Usuarios). */
  users: async () => (await http.get<ApiMember[]>(pp('/members'))).map(memberToUser),
}
