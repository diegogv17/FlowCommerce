import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, LineChart, MessagesSquare, Sparkles } from 'lucide-react'
import { useAuth } from '@/app/auth'
import { Button, Field, Input } from '@/components/ui'
import { Logo } from '@/components/layout/Logo'

const highlights = [
  { icon: MessagesSquare, text: 'Todas tus conversaciones de ventas en un solo lugar' },
  { icon: Sparkles, text: 'Respuestas sugeridas con IA para cerrar más rápido' },
  { icon: LineChart, text: 'Seguimiento claro de cada lead hasta la venta' },
]

export function LoginPage() {
  const { hasSession, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const linkError = params.get('error') === 'link'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (hasSession) return <Navigate to={(location.state as { from?: string } | null)?.from ?? '/dashboard'} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login({ email, password })
      navigate((location.state as { from?: string } | null)?.from ?? '/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos iniciar sesión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-full lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-navy-900 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -top-32 -right-32 size-[420px] rounded-full bg-flow-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 size-[380px] rounded-full bg-teal-500/15 blur-3xl" />
        <Logo tone="white" height={52} className="relative" />
        <div className="relative max-w-md">
          <h2 className="font-display text-[34px] leading-tight font-semibold">Convierte cada conversación en una venta.</h2>
          <ul className="mt-8 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-[15px] text-white/80">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-white/10">
                  <Icon className="size-4 text-flow-300" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} FlowCommerce</p>
      </section>

      <section className="grid place-items-center p-6">
        <div className="w-full max-w-[400px]">
          <Logo height={36} className="mb-10 lg:hidden" />
          <h1 className="font-display text-[28px] font-semibold">Bienvenido de nuevo</h1>
          <p className="mt-1.5 mb-8 text-sm text-navy-400">Ingresa con tu cuenta para continuar.</p>

          <form onSubmit={submit} className="space-y-4">
            <Field label="Correo electrónico">
              <Input type="email" autoComplete="email" required placeholder="nombre@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Contraseña">
              <div className="relative">
                <Input type={show ? 'text' : 'password'} autoComplete="current-password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-11" />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute top-1/2 right-3 -translate-y-1/2 text-navy-300 hover:text-navy-600" aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>

            <div className="flex justify-end text-xs">
              <Link to="/olvide-contrasena" className="font-medium text-flow-600 hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {linkError && !error && (
              <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700">El enlace del correo expiró o ya se usó. Inicia sesión o pide uno nuevo.</p>
            )}

            {error && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</p>}

            <Button type="submit" size="lg" loading={loading} className="w-full">
              Iniciar sesión
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-navy-400">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="font-medium text-flow-600 hover:underline">
              Crea tu cuenta gratis
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
