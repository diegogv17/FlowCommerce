import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Spinner } from '@/components/ui';
import { InvitationView } from '@/features/auth/invitation-view';

export const metadata: Metadata = { title: 'Invitación' };

export default function InvitationPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <InvitationView />
    </Suspense>
  );
}
