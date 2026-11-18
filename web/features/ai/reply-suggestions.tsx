'use client';

import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { aiErrorMessage, useReplySuggestions } from './hooks';

/**
 * Botón «✦ Sugerir respuesta» del compositor de Conversaciones. Pide 2-3
 * respuestas a la IA y las muestra como chips sobre el botón; al elegir una
 * se pasa a `onPick` (normalmente, rellenar el campo de mensaje). La IA nunca
 * envía nada: el asesor revisa y pulsa Enviar.
 */
export function ReplySuggestions({ leadId, onPick }: { leadId: string; onPick: (text: string) => void }) {
  const suggestions = useReplySuggestions(leadId);
  const [open, setOpen] = useState(false);
  const { reset } = suggestions;

  // Al cambiar de conversación se descartan las sugerencias del lead anterior.
  useEffect(() => {
    reset();
    setOpen(false);
  }, [leadId, reset]);

  const request = () => {
    setOpen(true);
    suggestions.mutate();
  };

  const pick = (text: string) => {
    onPick(text);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ai"
        size="md"
        onClick={request}
        loading={suggestions.isPending}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {!suggestions.isPending ? <Sparkles className="h-4 w-4" aria-hidden /> : null}
        <span className="hidden sm:inline">Sugerir respuesta</span>
        <span className="sm:hidden">Sugerir</span>
      </Button>

      {open ? (
        <div
          className="absolute bottom-full right-0 z-30 mb-2 w-[min(90vw,26rem)] rounded-2xl border border-violet-200 bg-white p-3 shadow-xl"
          role="dialog"
          aria-label="Respuestas sugeridas por IA"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-violet-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Respuestas sugeridas
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-muted hover:bg-slate-100"
              aria-label="Cerrar sugerencias"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {suggestions.isPending ? (
            <div className="space-y-2" aria-live="polite">
              <p className="text-xs text-muted">Leyendo la conversación…</p>
              <div className="h-9 animate-pulse rounded-xl bg-violet-100/70" />
              <div className="h-9 animate-pulse rounded-xl bg-violet-100/70" />
            </div>
          ) : null}

          {suggestions.isError ? (
            <div className="space-y-2" role="alert">
              <p className="text-sm text-rose-700">{aiErrorMessage(suggestions.error)}</p>
              <Button type="button" variant="outline" size="sm" onClick={request}>
                Reintentar
              </Button>
            </div>
          ) : null}

          {suggestions.data ? (
            <ul className="flex flex-col gap-2">
              {suggestions.data.suggestions.map((text) => (
                <li key={text}>
                  <button
                    type="button"
                    onClick={() => pick(text)}
                    className="w-full rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-left text-sm text-ink transition-colors hover:border-violet-300 hover:bg-violet-100"
                  >
                    {text}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <p className="mt-2 text-[11px] text-muted">Elige una para editarla antes de enviarla.</p>
        </div>
      ) : null}
    </div>
  );
}
