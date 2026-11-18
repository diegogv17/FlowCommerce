'use client';

import { useParams } from 'next/navigation';
import { Card, ErrorState, Skeleton } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { useQuote } from '@/features/quotes/hooks';
import { QuoteForm } from '@/features/quotes/quote-form';

// Editar un borrador. El formulario se monta cuando la cotización ya cargó,
// para inicializar su estado una sola vez con los datos guardados.
export default function EditQuotePage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const quote = useQuote(quoteId);

  if (quote.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (quote.isError || !quote.data) {
    return (
      <Card>
        <ErrorState message={errorMessage(quote.error ?? new Error('Cotización no encontrada'))} onRetry={() => quote.refetch()} />
      </Card>
    );
  }
  return <QuoteForm key={quote.data.id} quote={quote.data} />;
}
