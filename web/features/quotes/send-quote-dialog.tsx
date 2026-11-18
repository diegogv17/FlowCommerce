'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button, Dialog, Field, Input, Textarea } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { useQuoteStatus, useSendQuote } from './hooks';
import type { QuoteDetail } from './types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * "Aprobar y enviar por correo" (POST /quotes/:id/send). Si la cotización está
 * pendiente y `approveFirst` es true, primero se aprueba (PATCH /status
 * APPROVED) y luego se envía: el backend solo envía APPROVED o SENT.
 */
export function SendQuoteDialog({
  open,
  onClose,
  quote,
  defaultTo,
  approveFirst,
}: {
  open: boolean;
  onClose: () => void;
  quote: QuoteDetail;
  defaultTo: string | null;
  approveFirst?: boolean;
}) {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const send = useSendQuote();
  const status = useQuoteStatus();

  useEffect(() => {
    if (open) {
      setTo(defaultTo ?? '');
      setCc('');
      setMessage('');
      setError(null);
    }
  }, [open, defaultTo]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const ccList = cc
      .split(/[,;\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (to.trim() && !EMAIL_RE.test(to.trim())) return setError('El destinatario no es un email válido');
    if (!to.trim() && !defaultTo) return setError('Indica el email del destinatario');
    if (ccList.length > 5) return setError('Máximo 5 correos en copia');
    if (ccList.some((item) => !EMAIL_RE.test(item))) return setError('Hay un email inválido en copia');
    setError(null);

    try {
      if (approveFirst && quote.status === 'PENDING_APPROVAL') {
        await status.mutateAsync({ id: quote.id, status: 'APPROVED' });
      }
      await send.mutateAsync({
        id: quote.id,
        input: {
          to: to.trim() || undefined,
          cc: ccList.length ? ccList : undefined,
          message: message.trim() || undefined,
        },
      });
      toast.success(`${quote.folio} enviada por correo`);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const title = approveFirst && quote.status === 'PENDING_APPROVAL' ? 'Aprobar y enviar por correo' : 'Enviar por correo';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={`Se enviará ${quote.folio} con el PDF adjunto.`}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Destinatario" hint={defaultTo ? `Por defecto: ${defaultTo}` : undefined}>
          <Input type="email" value={to} onChange={(event) => setTo(event.target.value)} maxLength={255} autoFocus />
        </Field>
        <Field label="CC" hint="Hasta 5 correos separados por coma">
          <Input value={cc} onChange={(event) => setCc(event.target.value)} placeholder="gerencia@empresa.com" />
        </Field>
        <Field label="Mensaje" hint="Opcional; si lo dejas vacío se usa el mensaje por defecto">
          <Textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} />
        </Field>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="success" loading={send.isPending || status.isPending}>
            {approveFirst && quote.status === 'PENDING_APPROVAL' ? 'Aprobar y enviar' : 'Enviar'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
