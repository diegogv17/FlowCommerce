'use client';

import { ApiKeysSection } from './api-keys-section';
import { WebhooksSection } from './webhooks-section';

export function IntegrationsTab() {
  return (
    <div className="space-y-4">
      <ApiKeysSection />
      <WebhooksSection />
    </div>
  );
}
