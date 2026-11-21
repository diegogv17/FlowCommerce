import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { useState } from 'react'
import { Avatar } from '@/components/ui'
import { useUpdateLeadStatus } from '@/hooks/queries'
import { cn } from '@/lib/cn'
import { money, relativeTime } from '@/lib/format'
import { leadStatusMeta, leadStatusOrder, sourceLabel, toneColor } from '@/lib/labels'
import type { Lead, LeadStatus } from '@/types/domain'

function LeadCard({ lead, dragging }: { lead: Lead; dragging?: boolean }) {
  return (
    <div className={cn('rounded-xl border border-navy-100/70 bg-white p-3.5 shadow-card', dragging && 'rotate-1 shadow-pop')}>
      <div className="flex items-center gap-2.5">
        <Avatar name={lead.name} size={30} />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold">{lead.name}</p>
          <p className="truncate text-xs text-navy-400">{lead.company}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="num font-semibold text-navy-900">{money(lead.value)}</span>
        <span className="text-navy-300">{sourceLabel[lead.source]}</span>
      </div>
      <p className="mt-1.5 text-[11px] text-navy-300">Contacto {relativeTime(lead.lastContactAt)}</p>
    </div>
  )
}

function DraggableCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={cn('cursor-grab touch-none active:cursor-grabbing', isDragging && 'opacity-30')}>
      <LeadCard lead={lead} />
    </div>
  )
}

function Column({ status, leads }: { status: LeadStatus; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const meta = leadStatusMeta[status]
  const total = leads.reduce((a, l) => a + l.value, 0)
  return (
    <div ref={setNodeRef} className={cn('flex w-[268px] shrink-0 flex-col rounded-2xl bg-navy-100/50 p-2.5 transition-colors', isOver && 'bg-flow-100/60')}>
      <div className="mb-2.5 flex items-center gap-2 px-1.5 pt-1">
        <span className="size-2.5 rounded-full" style={{ background: toneColor[meta.tone] }} />
        <h3 className="font-display text-[13px] font-semibold">{meta.label}</h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-navy-500">{leads.length}</span>
        <span className="num ml-auto text-[11px] text-navy-400">{money(total)}</span>
      </div>
      <div className="scroll-thin flex max-h-[calc(100vh-340px)] min-h-24 flex-col gap-2.5 overflow-y-auto">
        {leads.map((l) => <DraggableCard key={l.id} lead={l} />)}
      </div>
    </div>
  )
}

export function LeadsKanban({ leads }: { leads: Lead[] }) {
  const update = useUpdateLeadStatus()
  const [active, setActive] = useState<Lead | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const onStart = (e: DragStartEvent) => setActive(leads.find((l) => l.id === e.active.id) ?? null)
  const onEnd = (e: DragEndEvent) => {
    setActive(null)
    const lead = leads.find((l) => l.id === e.active.id)
    const target = e.over?.id as LeadStatus | undefined
    if (lead && target && target !== lead.status) update.mutate({ id: lead.id, status: target })
  }

  return (
    <DndContext sensors={sensors} onDragStart={onStart} onDragEnd={onEnd} onDragCancel={() => setActive(null)}>
      <div className="scroll-thin flex gap-3 overflow-x-auto p-4">
        {leadStatusOrder.map((s) => <Column key={s} status={s} leads={leads.filter((l) => l.status === s)} />)}
      </div>
      <DragOverlay>{active ? <LeadCard lead={active} dragging /> : null}</DragOverlay>
    </DndContext>
  )
}
