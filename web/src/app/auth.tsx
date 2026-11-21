import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { authService, toUser } from '@/services/auth.service'
import { UNAUTHORIZED_EVENT, getCurrentProject, setCurrentProject } from '@/services/http'
import { getSupabase } from '@/lib/supabase'
import type { LoginPayload, ProfileInput, ProjectSummary, User } from '@/types/domain'

interface AuthState {
  /** Usuario con el rol que tiene en la empresa activa. */
  user: User | null
  /** true mientras se resuelve la sesión, el perfil y las empresas. */
  loading: boolean
  /** Hay sesión de Supabase (aunque todavía no tenga empresa). */
  hasSession: boolean
  projects: ProjectSummary[]
  project: ProjectSummary | null
  selectProject: (id: string) => void
  /** Error al cargar perfil/empresas (API caída, CORS…). */
  loadError: string | null
  /** Vuelve a leer perfil y empresas (después de crear una o aceptar una invitación). */
  refresh: () => Promise<void>
  login: (p: LoginPayload) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (p: ProfileInput) => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

/** Traduce los errores de Supabase Auth a mensajes para el usuario. */
export function authErrorMessage(message: string | undefined): string {
  const m = (message ?? '').toLowerCase()
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (m.includes('email not confirmed')) return 'Confirma tu correo antes de iniciar sesión (revisa tu bandeja de entrada).'
  if (m.includes('already registered')) return 'Ya existe una cuenta con ese correo. Inicia sesión.'
  if (m.includes('password should be')) return 'La contraseña debe tener al menos 8 caracteres.'
  if (m.includes('rate limit')) return 'Demasiados intentos. Espera unos minutos e intenta de nuevo.'
  return message || 'No pudimos completar la acción. Intenta de nuevo.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof authService.profile>> | null>(null)
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [projectId, setProjectId] = useState<string | null>(getCurrentProject())
  const [loadingData, setLoadingData] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const loadedFor = useRef<string | null>(null)

  // 1) Sesión de Supabase (persistida en el navegador).
  useEffect(() => {
    const supabase = getSupabase()
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setSessionReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setSessionReady(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const load = useCallback(async () => {
    setLoadingData(true)
    setLoadError(null)
    try {
      const [p, list] = await Promise.all([authService.profile(), authService.myProjects()])
      setProfile(p)
      setProjects(list)
      const stored = getCurrentProject()
      const chosen = list.find((x) => x.id === stored) ?? list[0] ?? null
      setCurrentProject(chosen?.id ?? null)
      setProjectId(chosen?.id ?? null)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'No pudimos cargar tu cuenta.')
      throw err
    } finally {
      setLoadingData(false)
    }
  }, [])

  // 2) Con sesión: perfil + empresas del usuario.
  const userId = session?.user.id ?? null
  useEffect(() => {
    if (!userId) {
      loadedFor.current = null
      setProfile(null)
      setProjects([])
      return
    }
    if (loadedFor.current === userId) return
    loadedFor.current = userId
    load().catch(() => {
      loadedFor.current = null
    })
  }, [userId, load])

  // 3) La API respondió 401: la sesión ya no sirve.
  useEffect(() => {
    const onUnauthorized = () => {
      getSupabase().auth.signOut().catch(() => undefined)
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  const project = useMemo(() => projects.find((p) => p.id === projectId) ?? null, [projects, projectId])

  const user = useMemo(() => (profile && project ? toUser(profile, project.role) : null), [profile, project])

  const selectProject = useCallback(
    (id: string) => {
      setCurrentProject(id)
      setProjectId(id)
      queryClient.clear()
    },
    [queryClient],
  )

  const login = useCallback(async ({ email, password }: LoginPayload) => {
    const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw new Error(authErrorMessage(error.message))
  }, [])

  const logout = useCallback(async () => {
    try {
      await getSupabase().auth.signOut()
    } finally {
      queryClient.clear()
      setProfile(null)
      setProjects([])
    }
  }, [queryClient])

  const updateProfile = useCallback(async (input: ProfileInput) => {
    setProfile(await authService.updateProfile(input))
  }, [])

  const loading = !sessionReady || (!!session && (loadingData || (!profile && loadedFor.current !== null)))

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      hasSession: !!session,
      projects,
      project,
      selectProject,
      loadError,
      refresh: load,
      login,
      logout,
      updateProfile,
    }),
    [user, loading, session, projects, project, selectProject, loadError, load, login, logout, updateProfile],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
