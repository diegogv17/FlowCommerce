'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Dialog, Field, Input } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { useConvertLead } from './hooks';
import type { ClientSummary, Lead } from './types';

/** POST /leads/:id/convert: crea el cliente con los datos del lead. */
export function ConvertLeadDialog({ open, onClose, lead }: { open: boolean; onClose: () => void; lead: Lead }) {
  const convert = useConvertLead(lead.id);
  const [company, setCompany] = useState('');
  const [taxId, setTaxId] = useState('');
  const [markAsWon, setMarkAsWon] = useState(true);
  const [result, setResult] = useState<{ clientId: string; duplicates: ClientSummary[] } | null>(null);

  useEffect(() => {
    if (open) {
      setCompany(lead.company ?? '');
      setTaxId('');
      setMarkAsWon(lead.stage !== 'WON');
      setResult(null);
    }
  }, [open, lead.company, lead.stage]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    convert.mutate(
      { company: company.trim() || null, taxId: taxId.trim() || null, markAsWon },
      {
        onSuccess: (response) => {
          toast.success(`Cliente "${response.client.name}" creado`);
          if (response.possibleDuplicates.length) {
            setResult({ clientId: response.client.id, duplicates: response.possibleDuplicates });
          } else {
            onClose();
          }
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  };

  if (result) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title="Cliente creado"
        footer={
          <Link href={`/clientes/${result.clientId}`}>
            <Button>Ver cliente</Button>
          </Link>
        }
      >
        <div className="flex gap-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Posibles duplicados</p>
            <p>Ya existen clientes con el mismo correo o empresa:</p>
            <ul className="mt-2 list-disc pl-5">
              {result.duplicates.map((client) => (
                <li key={client.id}>
                  <Link href={`/clientes/${client.id}`} className="underline">
                    {client.name}
                  </Link>
                  {client.company ? ` · ${client.company}` : ''}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} title="Convertir a cliente" description="Se crea el cliente con el nombre, correo y teléfono del lead.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Empresa">
          <Input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={255} />
        </Field>
        <Field label="NIT">
          <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} maxLength={32} placeholder="CF o 1234567-8" />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={markAsWon} onChange={(e) => setMarkAsWon(e.target.checked)} className="h-4 w-4 accent-brand-500" />
          Marcar el lead como Ganado
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="success" loading={convert.isPending}>
            Convertir
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
