import logo from '@/assets/brand/logo.png'
import symbol from '@/assets/brand/logo-symbol.png'
import logoWhite from '@/assets/brand/logo-white.png'
import symbolWhite from '@/assets/brand/logo-symbol-white.png'
import { cn } from '@/lib/cn'

interface Props {
  variant?: 'full' | 'symbol'
  tone?: 'color' | 'white'
  height?: number
  className?: string
}

/** Logotipo oficial. Mantener proporciones y área de respiro del manual de marca. */
export function Logo({ variant = 'full', tone = 'color', height = 32, className }: Props) {
  const src = variant === 'full' ? (tone === 'white' ? logoWhite : logo) : tone === 'white' ? symbolWhite : symbol
  return (
    <img
      src={src}
      alt="FlowCommerce"
      style={{ height, width: 'auto' }}
      className={cn('block max-w-none shrink-0 self-start object-contain', className)}
      draggable={false}
    />
  )
}
