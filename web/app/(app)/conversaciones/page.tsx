'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Info, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Avatar, Button, EmptyState, Skeleton } from '@/components/ui';
import { ChatThread } from '@/features/conversations/chat-thread';
import { ConversationList } from '@/features/conversations/conversation-list';
import { LeadPanel } from '@/features/conversations/lead-panel';
import { useLeadPanel } from '@/features/conversations/hooks';

/** Qué columna se ve en pantallas angostas (en escritorio se ven todas). */
type MobileView = 'list' | 'chat' | 'lead';

function ChatHeader({
  leadId,
  onBack,
  onInfo,
}: {
  leadId: string;
  onBack: () => void;
  onInfo: () => void;
}) {
  const { data: lead, isLoading } = useLeadPanel(leadId);
  return (
    <div className="flex items-center gap-3 border-b border-line px-3 py-3 sm:px-4">
      <button
        type="button"
        onClick={onBack}
        aria-label="Volver a la bandeja"
        className="rounded-full p-1.5 text-muted hover:bg-slate-100 lg:hidden"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      {isLoading ? (
        <>
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </>
      ) : (
        <>
          <Avatar name={lead?.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{lead?.name ?? 'Lead'}</p>
            <p className="truncate text-xs text-muted">
              {[lead?.company, lead?.phone].filter(Boolean).join(' · ') || 'WhatsApp'}
            </p>
          </div>
        </>
      )}
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onInfo}
          aria-label="Ver datos del lead"
          title="Datos del lead"
          className="xl:hidden"
        >
          <Info className="h-4 w-4" />
        </Button>
        <Link href={`/leads/${leadId}`}>
          <Button variant="secondary" size="sm">
            Ver lead
          </Button>
        </Link>
      </div>
    </div>
  );
}

function ConversationsScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const leadId = searchParams.get('leadId');
  // Con ?leadId= se abre directo el chat (también en móvil).
  const [view, setView] = useState<MobileView>(leadId ? 'chat' : 'list');

  const selectLead = useCallback(
    (id: string) => {
      router.replace(`${pathname}?leadId=${id}`, { scroll: false });
      setView('chat');
    },
    [pathname, router],
  );

  // Si el leadId cambia por fuera (toast "Ver", buscador), mostrar el chat.
  useEffect(() => {
    if (leadId) setView((current) => (current === 'list' ? 'chat' : current));
  }, [leadId]);

  // En escritorio, sin ?leadId= se abre la conversación más reciente.
  const preselect = useCallback(
    (firstLeadId: string) => {
      if (leadId) return;
      if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
        router.replace(`${pathname}?leadId=${firstLeadId}`, { scroll: false });
      }
    },
    [leadId, pathname, router],
  );

  const columnHeight = 'h-[calc(100dvh-11rem)] md:h-[calc(100dvh-7.5rem)]';

  return (
    <div
      className={cn(
        'grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_300px]',
      )}
    >
      <ConversationList
        selectedLeadId={leadId}
        onSelect={selectLead}
        onFirstLoaded={preselect}
        className={cn(columnHeight, view === 'list' ? 'flex' : 'hidden', 'lg:flex')}
      />

      <section
        aria-label="Chat"
        className={cn(
          'min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm',
          columnHeight,
          view === 'chat' ? 'flex' : 'hidden',
          view === 'lead' ? 'xl:flex' : 'lg:flex',
        )}
      >
        {leadId ? (
          <>
            <ChatHeader leadId={leadId} onBack={() => setView('list')} onInfo={() => setView('lead')} />
            <ChatThread key={leadId} leadId={leadId} className="flex-1" />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={<MessageCircle className="h-6 w-6" />}
              title="Selecciona una conversación"
              description="Elige un chat de la bandeja para ver el historial y responder."
            />
          </div>
        )}
      </section>

      {leadId ? (
        <LeadPanel
          key={leadId}
          leadId={leadId}
          onBack={() => setView('chat')}
          className={cn(columnHeight, view === 'lead' ? 'flex' : 'hidden', 'xl:flex')}
        />
      ) : (
        <div className={cn('hidden rounded-2xl bg-white shadow-sm', columnHeight, 'xl:block')} />
      )}
    </div>
  );
}

export default function ConversacionesPage() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <Skeleton className="h-[60vh] rounded-2xl" />
          <Skeleton className="hidden h-[60vh] rounded-2xl lg:block" />
        </div>
      }
    >
      <ConversationsScreen />
    </Suspense>
  );
}
