import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Spinner } from '@/components/ui';
import { AccessRequestForm } from '@/features/auth/access-request-form';

export const metadata: Metadata = { title: 'Solicitar acceso' };

export default function AccessRequestPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AccessRequestForm />
    </Suspense>
  );
}
