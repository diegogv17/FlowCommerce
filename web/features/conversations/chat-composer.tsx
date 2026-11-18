'use client';

import { useMemo, useRef, useState } from 'react';
import { Clock, LayoutTemplate, Paperclip, Send, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui';
import { ReplySuggestions } from '@/features/ai/reply-suggestions';
import { ATTACHMENT_MAX_BYTES, useQuickReplies, useSendMedia, useSendMessage } from './hooks';
import { TemplateDialog } from './template-dialog';
import type { QuickReply } from './types';

/** Texto "/abc" al final del borrador → busca respuestas rápidas con "abc". */
function slashQuery(text: string): string | null {
  const match = /(?:^|\s)\/([^\s/]*)$/.exec(text);
  return match ? match[1].toLowerCase() : null;
}

function replaceSlash(text: string, content: string): string {
  return text.replace(/(^|\s)\/[^\s/]*$/, (_match, space: string) => `${space}${content}`);
}

/**
 * Compositor del chat: texto, respuestas rápidas con "/", adjuntos y, si la
 * ventana de 24 h está cerrada, el botón para enviar una plantilla.
 */
export function ChatComposer({
  leadId,
  windowOpen,
  windowOpenUntil,
}: {
  leadId: string;
  windowOpen: boolean;
  windowOpenUntil: string | null;
}) {
  const [draft, setDraft] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [dismissedSlash, setDismissedSlash] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const sendText = useSendMessage(leadId);
  const sendMedia = useSendMedia(leadId);
  const { data: quickReplies = [] } = useQuickReplies(windowOpen);

  const query = windowOpen ? slashQuery(draft) : null;
  const suggestions = useMemo<QuickReply[]>(() => {
    if (query === null || draft === dismissedSlash) return [];
    return quickReplies
      .filter(
        (item) =>
          item.shortcut.toLowerCase().replace(/^\//, '').includes(query) ||
          item.title.toLowerCase().includes(query),
      )
      .slice(0, 6);
  }, [query, quickReplies, draft, dismissedSlash]);
  const activeIndex = Math.min(highlight, Math.max(0, suggestions.length - 1));

  const busy = sendText.isPending || sendMedia.isPending;

  const insertQuickReply = (reply: QuickReply) => {
    setDraft((current) => replaceSlash(current, reply.content));
    setHighlight(0);
    textareaRef.current?.focus();
  };

  const submit = () => {
    const content = draft.trim();
    if (!content || busy || !windowOpen) return;
    sendText.mutate(content, {
      onSuccess: () => setDraft(''),
      onError: (error) => toast.error(errorMessage(error)),
    });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setHighlight((activeIndex + 1) % suggestions.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlight((activeIndex - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        insertQuickReply(suggestions[activeIndex]);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setDismissedSlash(draft);
        return;
      }
    }
    // Enter envía; Shift+Enter hace salto de línea.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > ATTACHMENT_MAX_BYTES) {
      toast.error('El archivo supera el máximo de 10 MB');
      return;
    }
    // El texto escrito (si hay) viaja como pie del archivo.
    const caption = draft.trim() || undefined;
    const pending = toast.loading(`Enviando ${file.name}…`);
    sendMedia.mutate(
      { file, caption },
      {
        onSuccess: () => {
          if (caption) setDraft('');
          toast.success('Archivo enviado', { id: pending });
        },
        onError: (error) => toast.error(errorMessage(error), { id: pending }),
      },
    );
  };

  return (
    <div className="border-t border-line bg-white px-3 pb-3 pt-2 sm:px-4">
      {!windowOpen ? (
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <Clock className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1">
            {windowOpenUntil
              ? `La ventana de 24 h se cerró el ${formatDateTime(windowOpenUntil)}.`
              : 'El cliente aún no ha escrito por WhatsApp.'}{' '}
            Solo puedes enviar una plantilla aprobada.
          </span>
          <Button size="sm" onClick={() => setTemplateOpen(true)}>
            <LayoutTemplate className="h-4 w-4" />
            Enviar plantilla
          </Button>
        </div>
      ) : null}

      <div className="relative flex items-end gap-2">
        {suggestions.length > 0 ? (
          <ul
            role="listbox"
            aria-label="Respuestas rápidas"
            className="absolute bottom-full left-0 right-0 z-20 mb-2 max-h-64 overflow-y-auto rounded-xl border border-line bg-white p-1 shadow-lg"
          >
            {suggestions.map((reply, index) => (
              <li key={reply.id} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => insertQuickReply(reply)}
                  onMouseEnter={() => setHighlight(index)}
                  className={cn(
                    'flex w-full flex-col rounded-lg px-3 py-2 text-left',
                    index === activeIndex ? 'bg-brand-50' : 'hover:bg-slate-50',
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <Zap className="h-3.5 w-3.5 text-brand-500" />
                    {reply.title}
                    <span className="font-mono text-xs font-normal text-muted">/{reply.shortcut.replace(/^\//, '')}</span>
                  </span>
                  <span className="line-clamp-1 text-xs text-muted">{reply.content}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <input ref={fileRef} type="file" className="hidden" onChange={onFile} aria-label="Archivo a enviar" />
        <Button
          variant="secondary"
          size="icon"
          aria-label="Adjuntar archivo"
          title="Adjuntar archivo"
          disabled={!windowOpen || busy}
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <label htmlFor={`composer-${leadId}`} className="sr-only">
          Mensaje
        </label>
        <textarea
          id={`composer-${leadId}`}
          ref={textareaRef}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setHighlight(0);
          }}
          onKeyDown={onKeyDown}
          disabled={!windowOpen}
          rows={1}
          maxLength={4096}
          placeholder={windowOpen ? 'Escribe un mensaje… ("/" para respuestas rápidas)' : 'Ventana de 24 h cerrada'}
          className="max-h-36 min-h-10 flex-1 resize-none rounded-2xl border border-line bg-slate-50 px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60 [field-sizing:content]"
        />

        <Button
          onClick={submit}
          loading={sendText.isPending}
          disabled={!windowOpen || !draft.trim() || sendMedia.isPending}
          aria-label="Enviar mensaje"
        >
          {!sendText.isPending ? <Send className="h-4 w-4" /> : null}
          <span className="hidden sm:inline">Enviar</span>
        </Button>
      </div>

      <div className="mt-2">
        <ReplySuggestions
          leadId={leadId}
          onPick={(text) => {
            setDraft(text);
            textareaRef.current?.focus();
          }}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-muted">La IA nunca envía mensajes ni cotizaciones sin tu confirmación.</p>

      <TemplateDialog leadId={leadId} open={templateOpen} onClose={() => setTemplateOpen(false)} />
    </div>
  );
}
