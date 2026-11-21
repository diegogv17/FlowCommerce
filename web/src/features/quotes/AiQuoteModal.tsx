import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Button, Field, Modal, Select, Textarea } from '@/components/ui'
import { useToast } from '@/app/toast'
import { useCreateAiQuote, useQuoteLeads } from '@/hooks/queries'

/**
 * Pide a la IA un borrador para un lead (POST /assistant/quote-draft). La API
 * lo guarda en borrador con origen IA; aquí solo se abre para revisarlo.
 */
export function AiQuoteModal({ open, onClose, defaultLeadId = '' }: { open: boolean; onClose: () => void; defaultLeadId?: string }) {
  const navigate = useNavigate()
  const toast = useToast()
  const leads = useQuoteLeads()
  const create = useCreateAiQuote()
  const [leadId, setLeadId] = useState(defaultLeadId)
  const [prompt, setPrompt] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!leadId) return toast.error('Selecciona un lead')
    create.mutate({ leadId, prompt }, {
      onSuccess: (r) => {
        toast.success(`Borrador ${r.folio} preparado por IA`)
        r.warnings.forEach((w) => toast.error(`Ajuste de la IA: ${w}`))
        onClose()
        navigate(`/cotizaciones/${r.id}`)
      },
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Generar cotización con IA" footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" form="ai-quote" variant="success" loading={create.isPending} icon={<Sparkles className="size-4" />}>Generar borrador</Button></>}>
      <form id="ai-quote" onSubmit={submit} className="space-y-4">
        <p className="rounded-xl bg-teal-50 px-4 py-3 text-[13px] text-teal-700">El asistente arma las partidas con productos del catálogo activo, a partir del lead, su conversación y tus indicaciones. Queda en borrador para que la revises y la envíes a aprobación.</p>
        <Field label="Lead">
          <Select required value={leadId} onChange={(e) => setLeadId(e.target.value)}>
            <option value="">{leads.isLoading ? 'Cargando leads…' : 'Selecciona un lead'}</option>
            {leads.data?.map((l) => <option key={l.id} value={l.id}>{l.name}{l.company ? ` · ${l.company}` : ''}</option>)}
          </Select>
        </Field>
        <Field label="Indicaciones para la IA (opcional)" hint="Ej.: 12 usuarios, integración con WhatsApp y capacitación."><Textarea rows={3} maxLength={1000} value={prompt} onChange={(e) => setPrompt(e.target.value)} /></Field>
      </form>
    </Modal>
  )
}
