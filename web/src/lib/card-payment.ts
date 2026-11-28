import { moneyExact } from '@/lib/format'

export type CardBrand = '' | 'visa' | 'mastercard' | 'unknown'

export const CARD_NUMBER_LENGTH = 16
export const SECURITY_CODE_LENGTH = 3
export const INSTALLMENT_OPTIONS = [1, 3, 6, 12] as const
export type Installments = (typeof INSTALLMENT_OPTIONS)[number]

const BRAND_LABELS: Record<CardBrand, string> = {
  '': '',
  visa: 'Visa',
  mastercard: 'Mastercard',
  unknown: 'No reconocida',
}

export const digitsOf = (text: string): string => text.replace(/\D/g, '')

export function detectBrand(digits: string): CardBrand {
  if (digits.length === 0) return ''
  if (digits[0] === '4') return 'visa'
  if (digits[0] === '5') return 'mastercard'
  return 'unknown'
}

export const brandLabel = (brand: CardBrand): string => BRAND_LABELS[brand]

export function formatCardNumber(text: string): string {
  return digitsOf(text).slice(0, CARD_NUMBER_LENGTH).replace(/(\d{4})(?=\d)/g, '$1 ')
}

export function formatExpiry(text: string): string {
  const digits = digitsOf(text).slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

export function formatSecurityCode(text: string): string {
  return digitsOf(text).slice(0, SECURITY_CODE_LENGTH)
}

export function passesLuhn(digits: string): boolean {
  let sum = 0
  let double = false
  for (let index = digits.length - 1; index >= 0; index--) {
    let digit = Number(digits[index])
    if (double) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    double = !double
  }
  return sum % 10 === 0
}

export function validateCardNumber(digits: string): string {
  if (digits.length !== CARD_NUMBER_LENGTH) return 'El número debe tener 16 dígitos.'
  const brand = detectBrand(digits)
  if (brand !== 'visa' && brand !== 'mastercard') return 'Solo se aceptan Visa (inicia con 4) o Mastercard (inicia con 5).'
  if (!passesLuhn(digits)) return 'El número de tarjeta no es válido.'
  return ''
}

export function validateExpiry(text: string, now: Date = new Date()): string {
  const match = /^(\d{2})\/(\d{2})$/.exec(text)
  if (!match) return 'Use el formato MM/AA.'
  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  if (month < 1 || month > 12) return 'El mes debe estar entre 01 y 12.'
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  if (year < currentYear || (year === currentYear && month < currentMonth)) return 'La tarjeta está vencida.'
  return ''
}

export function validateSecurityCode(text: string): string {
  return new RegExp(`^\\d{${SECURITY_CODE_LENGTH}}$`).test(text) ? '' : `El código debe tener ${SECURITY_CODE_LENGTH} dígitos.`
}

export function validateEmail(text: string): string {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim()) ? '' : 'Ingrese un correo válido.'
}

export function splitInstallments(total: number, count: number): number[] {
  const totalCents = Math.round(total * 100)
  const base = Math.floor(totalCents / count)
  const remainder = totalCents - base * count
  return Array.from({ length: count }, (_, index) => (index === count - 1 ? base + remainder : base) / 100)
}

export function installmentLabel(total: number, count: number): string {
  if (count === 1) return `Pago de contado: ${moneyExact(total)}`
  const parts = splitInstallments(total, count)
  const regular = parts[0]
  const last = parts[parts.length - 1]
  if (regular === last) return `${count} cuotas de ${moneyExact(regular)}`
  return `${count - 1} cuotas de ${moneyExact(regular)} y 1 de ${moneyExact(last)}`
}

export function describePaymentReference(reference: string): string {
  const recurrente = /^RECURRENTE-(.+)$/.exec(reference)
  if (recurrente) return `Recurrente Sandbox · checkout ${recurrente[1]} (prueba)`
  const match = /^SIMULADO-(VISA|MASTERCARD)-(\d{4})-(\d+)C$/.exec(reference)
  if (!match) return reference
  const brand = match[1] === 'VISA' ? 'Visa' : 'Mastercard'
  const count = Number(match[3])
  return `${brand} terminada en ${match[2]} · ${count === 1 ? 'contado' : `${count} cuotas`} (simulado)`
}
