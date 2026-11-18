'use client';

import { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCheck,
  Clock,
  Download,
  FileText,
  ImageOff,
  LayoutTemplate,
  Music,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { api, errorMessage } from '@/lib/api';
import { useProject } from '@/hooks/use-project';
import { Spinner } from '@/components/ui';
import { useAttachmentObjectUrl } from './hooks';
import type { Message } from './types';
import { attachmentName, formatTime, isMediaPlaceholder, messageStatus } from './utils';

function StatusIcon({ status }: { status: string }) {
  const info = messageStatus(status);
  const props = { className: 'h-3.5 w-3.5', 'aria-label': info.label };
  return (
    <span title={info.label} className={cn(info.kind === 'read' && 'text-sky-200', info.kind === 'failed' && 'text-rose-200')}>
      {info.kind === 'pending' ? <Clock {...props} /> : null}
      {info.kind === 'sent' ? <Check {...props} /> : null}
      {info.kind === 'delivered' || info.kind === 'read' ? <CheckCheck {...props} /> : null}
      {info.kind === 'failed' ? <AlertCircle {...props} /> : null}
    </span>
  );
}

function InlineImage({ message, outbound }: { message: Message; outbound: boolean }) {
  const { data: url, isLoading, isError } = useAttachmentObjectUrl(message.attachmentId);
  if (isLoading) {
    return (
      <div className="flex h-40 w-56 items-center justify-center rounded-xl bg-slate-100">
        <Spinner />
      </div>
    );
  }
  if (isError || !url) {
    return (
      <div className={cn('flex items-center gap-2 text-xs', outbound ? 'text-white/80' : 'text-muted')}>
        <ImageOff className="h-4 w-4" /> No se pudo cargar la imagen
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={attachmentName(message)}
        className="max-h-72 w-auto max-w-full rounded-xl object-cover"
      />
    </a>
  );
}

function FileChip({ message, outbound }: { message: Message; outbound: boolean }) {
  const { path } = useProject();
  const [downloading, setDownloading] = useState(false);
  const name = attachmentName(message);
  const Icon = message.type === 'AUDIO' ? Music : message.type === 'VIDEO' ? Video : FileText;

  const download = async () => {
    if (!message.attachmentId) return;
    setDownloading(true);
    try {
      await api.download(path(`/attachments/${message.attachmentId}/download`), name);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={download}
      disabled={downloading}
      aria-label={`Descargar ${name}`}
      className={cn(
        'flex w-full min-w-48 items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors',
        outbound ? 'bg-white/15 hover:bg-white/25' : 'bg-slate-100 hover:bg-slate-200',
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
      {downloading ? <Spinner className={cn('h-4 w-4', outbound && 'text-white')} /> : <Download className="h-4 w-4 shrink-0" />}
    </button>
  );
}

/** Burbuja del chat: entrante a la izquierda, saliente (azul) a la derecha. */
export function MessageBubble({ message }: { message: Message }) {
  const outbound = message.direction === 'OUTBOUND';
  const failed = outbound && message.status.toUpperCase() === 'FAILED';
  const hasFile = !!message.attachmentId && message.type !== 'TEXT' && message.type !== 'TEMPLATE';
  const isImage = hasFile && message.type === 'IMAGE';
  // En archivos el contenido es el pie de foto, o solo la etiqueta "[Imagen]".
  const showText = !hasFile || !isMediaPlaceholder(message.content);

  return (
    <div className={cn('flex flex-col', outbound ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm sm:max-w-[75%]',
          outbound
            ? 'rounded-br-md bg-brand-500 text-white'
            : 'rounded-bl-md border border-line bg-white text-ink',
          failed && 'bg-rose-500',
        )}
      >
        {message.type === 'TEMPLATE' ? (
          <p className={cn('mb-1 flex items-center gap-1 text-[11px] font-semibold', outbound ? 'text-white/80' : 'text-muted')}>
            <LayoutTemplate className="h-3 w-3" />
            Plantilla{message.templateName ? ` · ${message.templateName}` : ''}
          </p>
        ) : null}

        {isImage ? (
          <div className={cn(showText && 'mb-2')}>
            <InlineImage message={message} outbound={outbound} />
          </div>
        ) : hasFile ? (
          <div className={cn(showText && 'mb-2')}>
            <FileChip message={message} outbound={outbound} />
          </div>
        ) : null}

        {showText ? <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p> : null}

        <div
          className={cn(
            'mt-1 flex items-center justify-end gap-1 text-[11px]',
            outbound ? 'text-white/75' : 'text-muted',
          )}
        >
          <time dateTime={message.creadoEn}>{formatTime(message.creadoEn)}</time>
          {outbound ? <StatusIcon status={message.status} /> : null}
        </div>
      </div>
      {failed ? (
        <p className="mt-1 flex max-w-[85%] items-start gap-1 text-xs text-rose-600 sm:max-w-[75%]">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>No se entregó{message.errorMessage ? `: ${message.errorMessage}` : '.'}</span>
        </p>
      ) : null}
    </div>
  );
}
