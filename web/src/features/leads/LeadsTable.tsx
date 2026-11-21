import { Link, useNavigate } from 'react-router-dom'
import { Eye, FilePlus2, MessageSquare } from 'lucide-react'
import { Avatar, Badge, EmptyState, IconButton } from '@/components/ui'
import { formatFollowUp, money, relativeTime } from '@/lib/format'
import { leadStatusMeta } from '@/lib/labels'
import type { Lead } from '@/types/domain'

const th = 'px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-navy-300 uppercase'

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const navigate = useNavigate()
  if (leads.length === 0) return <EmptyState title="Sin resultados" text="No encontramos leads con esos filtros." />
  return (
    <div className="scroll-thin overflow-x-auto">
      <table className="w-full min-w-[960px] text-[13px]">
        <thead>
          <tr className="border-b border-navy-100/70">
            <th className={th}>Lead</th>
            <th className={th}>Contacto</th>
            <th className={th}>Estado</th>
            <th className={th}>Responsable</th>
            <th className={th}>Último contacto</th>
            <th className={th}>Próximo seg.</th>
            <th className={`${th} text-right`}>Valor</th>
            <th className={th} />
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-100/60">
          {leads.map((l) => (
            <tr key={l.id} className="transition-colors hover:bg-navy-50/50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={l.name} size={34} />
                  <div>
                    <Link to={`/leads/${l.id}`} className="font-semibold hover:text-flow-600">{l.name}</Link>
                    <p className="text-xs text-navy-400">{l.company}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <p>{l.email}</p>
                <p className="num text-xs text-navy-400">{l.phone}</p>
              </td>
              <td className="px-4 py-3"><Badge tone={leadStatusMeta[l.status].tone}>{leadStatusMeta[l.status].label}</Badge></td>
              <td className="px-4 py-3 text-navy-600">{l.ownerName}</td>
              <td className="px-4 py-3 text-navy-500">{relativeTime(l.lastContactAt)}</td>
              <td className="num px-4 py-3 text-xs font-medium">{formatFollowUp(l.nextFollowUpAt)}</td>
              <td className="num px-4 py-3 text-right font-medium">{money(l.value)}</td>
              <td className="px-2 py-3">
                <div className="flex justify-end gap-0.5">
                  <IconButton aria-label="Abrir conversación" onClick={() => navigate('/conversaciones')}><MessageSquare className="size-4" /></IconButton>
                  <IconButton aria-label="Nueva cotización" onClick={() => navigate('/cotizaciones/nueva')}><FilePlus2 className="size-4" /></IconButton>
                  <IconButton aria-label="Ver lead" onClick={() => navigate(`/leads/${l.id}`)}><Eye className="size-4" /></IconButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
