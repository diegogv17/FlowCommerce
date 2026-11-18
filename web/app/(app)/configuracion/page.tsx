'use client';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { SettingsView } from '@/features/settings/settings-view';

export default function SettingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <SettingsView />
    </Suspense>
  );
}
