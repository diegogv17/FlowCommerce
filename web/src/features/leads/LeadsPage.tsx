import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button, Card, ErrorState, PageHeader, Pagination, PageLoader, Segmented, SearchInput, Select } from '@/components/ui'
import { useDashboard, useLeads, useUsers } from '@/hooks/queries'
import { money } from '@/lib/format'
import { leadStatusMeta, leadStatusOrder } from '@/lib/labels'
import { leadSourceOptions } from '@/services/mappers/leads'
import type { LeadFilters, LeadSource, LeadStatus } from '@/types/domain'
import { LeadsKanban } from './LeadsKanban'
import { LeadsTable } from './LeadsTable'
import { NewLeadModal } from './NewLeadModal'

const PAGE_SIZE = 8

export function LeadsPage() {
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState<'tabla' | 'pipeline'>('tabla')
  const [modal, setModal] = useState(params.get('nuevo') === '1')
  const [search, setSearch] = useState(params.get('search') ?? '')
  const [debounced, setDebounced] = useState(search)
  const [status, setStatus] = useState<LeadStatus | ''>('')
  const [ownerId, setOwnerId] = useState('')
  const [source, setSource] = useState<LeadSource | ''>('')
  const [period, setPeriod] = useState<LeadFilters['period']>('')
  const [sort, setSort] = useState<LeadFilters['sort']>('')
  const [page, setPage] = useState(1)
  const users = useUsers()
  const dashboard = useDashboard()

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (params.get('nuevo') === '1') {
      setModal(true)
      params.delete('nuevo')
      setParams(params, { replace: true })
    }
  }, [params, setParams])

  const filters: LeadFilters = { search: debounced, status, ownerId, source, period, sort, page: view === 'tabla' ? page : 1, pageSize: view === 'tabla' ? PAGE_SIZE : 200 }
  const { data, isLoading, isError, refetch } = useLeads(filters)
  const reset = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v)
    setPage(1)
  }

  const kpis = dashboard.data?.kpis

  return (
    <>
      <PageHeader
        title="Gestión de Leads"
        subtitle={kpis ? `${kpis.activeLeads.value} leads activos · ${money(kpis.estimatedPipeline.value)} en pipeline estimado` : ' '}
        actions={
          <>
            <Segmented value={view} onChange={setView} options={[{ value: 'tabla', label: 'Tabla' }, { value: 'pipeline', label: 'Pipeline' }]} />
            <Button icon={<Plus className="size-4" />} onClick={() => setModal(true)}>Nuevo Lead</Button>
          </>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2.5 border-b border-navy-100/70 p-4">
          <SearchInput className="w-full sm:w-72" placeholder="Buscar por nombre o empresa…" value={search} onChange={(e) => reset(setSearch)(e.target.value)} />
          <Select className="w-auto min-w-36 rounded-full" value={status} onChange={(e) => reset(setStatus)(e.target.value as LeadStatus | '')}>
            <option value="">Estado</option>
            {leadStatusOrder.map((s) => <option key={s} value={s}>{leadStatusMeta[s].label}</option>)}
          </Select>
          <Select className="w-auto min-w-40 rounded-full" value={ownerId} onChange={(e) => reset(setOwnerId)(e.target.value)}>
            <option value="">Responsable</option>
            {users.data?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
          <Select className="w-auto min-w-36 rounded-full" value={source} onChange={(e) => reset(setSource)(e.target.value as LeadSource | '')}>
            <option value="">Fuente</option>
            {leadSourceOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
          <Select className="w-auto min-w-36 rounded-full" value={period} onChange={(e) => reset(setPeriod)(e.target.value as LeadFilters['period'])}>
            <option value="">Fecha</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
          </Select>
          <div className="ml-auto flex items-center gap-2.5">
            {(status || ownerId || source || period || search || sort) && (
              <button onClick={() => { setStatus(''); setOwnerId(''); setSource(''); setPeriod(''); setSort(''); setSearch(''); setPage(1) }} className="text-xs font-medium text-navy-400 hover:text-navy-900">Quitar filtros</button>
            )}
            <Select className="w-auto min-w-44 rounded-full" value={sort} onChange={(e) => reset(setSort)(e.target.value as LeadFilters['sort'])} aria-label="Ordenar por">
              <option value="">Ordenar por: Reciente</option>
              <option value="valor">Ordenar por: Valor</option>
            </Select>
          </div>
        </div>

        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <PageLoader />
        ) : view === 'tabla' ? (
          <>
            <LeadsTable leads={data.data} />
            <Pagination page={data.meta.page} pageSize={data.meta.pageSize} total={data.meta.total} onPage={setPage} noun="leads" />
          </>
        ) : (
          <LeadsKanban leads={data.data} />
        )}
      </Card>

      <NewLeadModal open={modal} onClose={() => setModal(false)} />
    </>
  )
}
