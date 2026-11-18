'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui';
import { QuoteForm } from '@/features/quotes/quote-form';

// Nueva cotización. Acepta ?leadId= y/o ?clientId= (desde la ficha del lead o
// del cliente) para preseleccionar a quién se cotiza.
function NewQuoteContent() {
  const params = useSearchParams();
  return (
    <QuoteForm
      initialLeadId={params.get('leadId') ?? undefined}
      initialClientId={params.get('clientId') ?? undefined}
    />
  );
}

export default function NewQuotePage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <NewQuoteContent />
    </Suspense>
  );
}
