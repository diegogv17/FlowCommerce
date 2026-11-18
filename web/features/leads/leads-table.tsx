'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, FilePlus2, MessageCircle } from 'lucide-react';
import { Avatar, Badge, Skeleton, Table, Td, Th, Tr } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { stageInfo } from '@/lib/labels';
import { cn } from '@/lib/cn';
import type { Lead } from './types';
import { formatContactDate, formatDueDate } from './utils';

const iconButton =
  'inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-muted transition-colors hover:bg-slate-200 hover:text-ink';

export function LeadsTable({ leads, loading, currency }: { leads: Lead[]; loading?: boolean; currency?: string }) {
  const router = useRouter();

  return (
    <Table>
      <thead>
        <tr>
          <Th>Lead</Th>
          <Th>Contacto</Th>
          <Th>Estado</Th>
          <Th>Responsable</Th>
          <Th>Último contacto</Th>
          <Th>Próximo seg.</Th>
          <Th className="text-right">Valor est.</Th>
          <Th>
            <span className="sr-only">Acciones</span>
          </Th>
        </tr>
      </thead>
      <tbody>
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <tr key={index}>
                {Array.from({ length: 8 }).map((__, cell) => (
                  <Td key={cell}>
                    <Skeleton className="h-4 w-full max-w-32" />
                  </Td>
                ))}
              </tr>
            ))
          : leads.map((lead) => {
              const stage = stageInfo(lead.stage);
              const overdue = lead.nextFollowUpAt && new Date(lead.nextFollowUpAt).getTime() < Date.now();
              return (
                <Tr key={lead.id} className="cursor-pointer" onClick={() => router.push(`/leads/${lead.id}`)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={lead.name} size="sm" className="bg-slate-100 text-ink" />
                      <div className="min-w-0">
                        <Link
                          href={`/leads/${lead.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="block truncate font-semibold text-ink hover:text-brand-600"
                        >
                          {lead.name}
                        </Link>
                        <p className="truncate text-xs text-muted">{lead.company ?? '—'}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <p className="truncate">{lead.email ?? '—'}</p>
                    <p className="text-xs text-muted">{lead.phone ?? ''}</p>
                  </Td>
                  <Td>
                    <Badge className={stage.color}>{stage.label}</Badge>
                  </Td>
                  <Td className="whitespace-nowrap">{lead.assignedUser?.name ?? <span className="text-muted">Sin asignar</span>}</Td>
                  <Td className="whitespace-nowrap text-muted">{formatContactDate(lead.lastContactAt)}</Td>
                  <Td className={cn('whitespace-nowrap font-semibold', overdue && 'text-rose-600')}>
                    {formatDueDate(lead.nextFollowUpAt)}
                  </Td>
                  <Td className="whitespace-nowrap text-right font-mono">
                    {lead.estimatedValue != null ? formatMoney(lead.estimatedValue, currency) : '—'}
                  </Td>
                  <Td onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1.5">
                      <Link href={`/conversaciones?leadId=${lead.id}`} className={iconButton} aria-label={`Enviar mensaje a ${lead.name}`} title="Mensaje">
                        <MessageCircle className="h-4 w-4" />
                      </Link>
                      <Link href={`/cotizaciones/nueva?leadId=${lead.id}`} className={iconButton} aria-label={`Nueva cotización para ${lead.name}`} title="Nueva cotización">
                        <FilePlus2 className="h-4 w-4" />
                      </Link>
                      <Link href={`/leads/${lead.id}`} className={iconButton} aria-label={`Abrir ${lead.name}`} title="Abrir">
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </Td>
                </Tr>
              );
            })}
      </tbody>
    </Table>
  );
}
