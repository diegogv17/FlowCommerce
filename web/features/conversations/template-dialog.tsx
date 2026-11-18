'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/api';
import { Button, Dialog, EmptyState, ErrorState, Field, Input, Select, Skeleton } from '@/components/ui';
import { useSendTemplate, useWhatsAppTemplates } from './hooks';
import type { WhatsAppTemplate } from './types';
import { renderTemplate } from './utils';

function templateKey(template: WhatsAppTemplate) {
  return `${template.name}::${template.language}`;
}

/**
 * Enviar una plantilla aprobada por Meta: la única forma de escribirle a un
 * cliente cuando la ventana de 24 h está cerrada.
 */
export function TemplateDialog({
  leadId,
  open,
  onClose,
}: {
  leadId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { data: templates, isLoading, isError, error, refetch } = useWhatsAppTemplates(open);
  const send = useSendTemplate(leadId);
  const [selected, setSelected] = useState('');
  const [parameters, setParameters] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);

  const usable = useMemo(() => (templates ?? []).filter((item) => !item.headerNeedsParameters), [templates]);
  const template = usable.find((item) => templateKey(item) === selected) ?? null;

  // Al abrir, preselecciona la primera plantilla utilizable.
  useEffect(() => {
    if (open && !selected && usable.length > 0) setSelected(templateKey(usable[0]));
  }, [open, selected, usable]);

  // Una casilla por variable {{1}}, {{2}}…
  useEffect(() => {
    setParameters(Array.from({ length: template?.bodyParameterCount ?? 0 }, () => ''));
    setTouched(false);
  }, [template?.name, template?.language, template?.bodyParameterCount]);

  const missing = parameters.some((value) => !value.trim());

  const close = () => {
    setTouched(false);
    onClose();
  };

  const submit = () => {
    setTouched(true);
    if (!template || missing) return;
    send.mutate(
      {
        name: template.name,
        language: template.language,
        parameters: parameters.map((value) => value.trim()),
      },
      {
        onSuccess: () => {
          toast.success('Plantilla enviada');
          close();
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Enviar plantilla"
      description="La ventana de 24 h está cerrada: WhatsApp solo permite retomar la conversación con una plantilla aprobada."
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={send.isPending} disabled={!template}>
            Enviar plantilla
          </Button>
        </>
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10" />
          <Skeleton className="h-24" />
        </div>
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : usable.length === 0 ? (
        <EmptyState
          title="No hay plantillas disponibles"
          description="Crea y espera la aprobación de una plantilla en Configuración → WhatsApp."
        />
      ) : (
        <div className="space-y-4">
          <Field label="Plantilla">
            <Select value={selected} onChange={(event) => setSelected(event.target.value)} aria-label="Plantilla">
              {usable.map((item) => (
                <option key={templateKey(item)} value={templateKey(item)}>
                  {item.name} ({item.language})
                </option>
              ))}
            </Select>
          </Field>

          {parameters.map((value, index) => (
            <Field
              key={index}
              label={`Variable {{${index + 1}}}`}
              error={touched && !value.trim() ? 'Este valor es obligatorio' : undefined}
            >
              <Input
                value={value}
                maxLength={1024}
                onChange={(event) =>
                  setParameters((current) => current.map((item, i) => (i === index ? event.target.value : item)))
                }
              />
            </Field>
          ))}

          {template?.bodyText ? (
            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">Vista previa</p>
              <div className="whitespace-pre-wrap rounded-2xl rounded-br-md bg-brand-500 px-3.5 py-2.5 text-sm text-white">
                {renderTemplate(template.bodyText, parameters)}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Dialog>
  );
}
