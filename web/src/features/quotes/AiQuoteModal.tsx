import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Button, Field, Modal, Select, Textarea } from '@/components/ui'
import { useToast } from '@/app/toast'
import { useCreateAiQuote, useCustomers } from '@/hooks/queries'

/** Pide a la IA un borrador de cotización para un cliente; queda pendiente de aprobación. */
export function AiQuoteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const toast = useToast()
  const customers = useCustomers({ pageSize: 100 })
  const create = useCreateAiQuote()
  const [customerId, setCustomerId] = useState('')
  const [prompt, setPrompt] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    create.mutate({ customerId, prompt: prompt.trim() || undefined }, {
      onSuccess: (q) => { toast.success(`Borrador ${q.folio} preparado por IA`); onClose(); navigate(`/cotizaciones/${q.id}`) },
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Generar cotización con IA" footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" form="ai-quote" variant="success" loading={create.isPending} icon={<Sparkles className="size-4" />}>Generar borrador</Button></>}>
      <form id="ai-quote" onSubmit={submit} className="space-y-4">
        <p className="rounded-xl bg-teal-50 px-4 py-3 text-[13px] text-teal-700">El asistente prepara los conceptos y precios con base en el catálogo y la conversación del cliente. Siempre queda pendiente de tu aprobación.</p>
        <Field label="Cliente"><Select required value={customerId} onChange={(e) => setCustomerId(e.target.value)}><option value="">Selecciona un cliente</option>{customers.data?.data.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="Indicaciones para la IA (opcional)" hint="Ej.: 12 usuarios, integración con WhatsApp y capacitación."><Textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} /></Field>
      </form>
    </Modal>
  )
}
