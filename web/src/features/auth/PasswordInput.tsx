import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui'
import { cn } from '@/lib/cn'

/** Campo de contraseña con el botón del ojo para mostrarla u ocultarla. */
export function PasswordInput({ className, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input {...rest} type={show ? 'text' : 'password'} className={cn('pr-11', className)} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute top-1/2 right-3 -translate-y-1/2 text-navy-300 hover:text-navy-600"
        aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}
