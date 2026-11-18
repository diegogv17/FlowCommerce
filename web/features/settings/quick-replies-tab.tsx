'use client';

import { useState } from 'react';
import { MessageSquareText, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Skeleton,
  Textarea,
} from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { useDeleteQuickReply, useQuickReplies, useSaveQuickReply } from './hooks';
import type { QuickReply } from './types';

// Igual que SHORTCUT_PATTERN del backend (domain/quick-reply.ts).
const SHORTCUT_RE = /^[a-z0-9][a-z0-9_-]{0,39}$/;

/** Respuestas rápidas: el asesor escribe "/atajo" en Conversaciones. */
export function QuickRepliesTab() {
  const replies = useQuickReplies();
  const remove = useDeleteQuickReply();
  const [editing, setEditing] = useState<QuickReply | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<QuickReply | null>(null);

  return (
    <Card className="max-w-4xl p-6">
      <CardHeader
        title="Respuestas rápidas"
        subtitle="Mensajes frecuentes que el equipo inserta escribiendo / en una conversación."
        action={
          <Button size="sm" onClick={() => setEditing('new')}>
            <Plus className="h-3.5 w-3.5" aria-hidden /> Nueva
          </Button>
        }
      />

      {replies.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : replies.isError ? (
        <ErrorState message={errorMessage(replies.error)} onRetry={() => replies.refetch()} />
      ) : !replies.data?.length ? (
        <EmptyState
          icon={<MessageSquareText className="h-6 w-6" />}
          title="Aún no hay respuestas rápidas"
          description="Crea saludos, horarios, datos de pago… y respóndele a tus clientes en segundos."
          action={
            <Button size="sm" className="mt-2" onClick={() => setEditing('new')}>
              Crear la primera
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-line/70">
          {replies.data.map((reply) => (
            <li key={reply.id} className="flex items-start gap-3 py-3">
              <code className="mt-0.5 shrink-0 rounded-lg bg-brand-50 px-2 py-0.5 font-mono text-xs font-semibold text-brand-700">
                /{reply.shortcut}
              </code>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{reply.title}</p>
                <p className="mt-0.5 line-clamp-2 whitespace-pre-line text-sm text-muted">{reply.content}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" aria-label={`Editar ${reply.title}`} onClick={() => setEditing(reply)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" aria-label={`Eliminar ${reply.title}`} onClick={() => setToDelete(reply)}>
                  <Trash2 className="h-4 w-4 text-rose-500" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing !== null ? (
        <QuickReplyDialog reply={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      ) : null}
      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
        title="¿Eliminar esta respuesta rápida?"
        description={toDelete ? `/${toDelete.shortcut} dejará de estar disponible para el equipo.` : undefined}
        confirmLabel="Eliminar"
        danger
        loading={remove.isPending}
      />
    </Card>
  );
}

function QuickReplyDialog({ reply, onClose }: { reply: QuickReply | null; onClose: () => void }) {
  const save = useSaveQuickReply();
  const [shortcut, setShortcut] = useState(reply?.shortcut ?? '');
  const [title, setTitle] = useState(reply?.title ?? '');
  const [content, setContent] = useState(reply?.content ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = shortcut.trim().replace(/^\//, '').toLowerCase();
    const found: Record<string, string> = {};
    if (!SHORTCUT_RE.test(clean)) found.shortcut = 'Empieza con letra o número; solo minúsculas, números, - y _.';
    if (!title.trim()) found.title = 'Escribe un título.';
    if (!content.trim()) found.content = 'Escribe el mensaje.';
    setErrors(found);
    if (Object.keys(found).length) return;
    save.mutate(
      { id: reply?.id, input: { shortcut: clean, title: title.trim(), content: content.trim() } },
      { onSuccess: onClose },
    );
  }

  return (
    <Dialog open onClose={onClose} title={reply ? 'Editar respuesta rápida' : 'Nueva respuesta rápida'}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <Field label="Atajo" error={errors.shortcut}>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center font-mono text-sm text-muted">/</span>
              <Input
                autoFocus
                className="pl-6 font-mono"
                placeholder="saludo"
                maxLength={41}
                value={shortcut}
                onChange={(event) => setShortcut(event.target.value)}
              />
            </div>
          </Field>
          <Field label="Título" error={errors.title}>
            <Input placeholder="Saludo inicial" maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
        </div>
        <Field label="Mensaje" error={errors.content}>
          <Textarea
            className="min-h-32"
            placeholder="Hola, gracias por escribirnos. ¿En qué le podemos ayudar?"
            maxLength={4096}
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={save.isPending}>
            Guardar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
