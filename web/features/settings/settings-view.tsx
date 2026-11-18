'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, Tabs } from '@/components/ui';
import { useProject } from '@/hooks/use-project';
import { CompanyTab } from './company-tab';
import { IntegrationsTab } from './integrations-tab';
import { ProfileTab } from './profile-tab';
import { QuickRepliesTab } from './quick-replies-tab';
import { QuotesTab } from './quotes-tab';
import { RolesTab } from './roles-tab';
import { UsersTab } from './users-tab';
import { WhatsAppTab } from './whatsapp-tab';

type TabKey =
  | 'perfil'
  | 'usuarios'
  | 'roles'
  | 'empresa'
  | 'cotizaciones'
  | 'whatsapp'
  | 'respuestas'
  | 'integraciones';

/**
 * Configuración con pestañas. La pestaña vive en ?tab= para poder enlazarla
 * (p. ej. la notificación de solicitud de acceso abre ?tab=usuarios). Las
 * pestañas que el rol no puede usar se ocultan; el backend valida igual.
 */
export function SettingsView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { can } = useProject();

  const tabs: { value: TabKey; label: string; visible: boolean }[] = [
    { value: 'perfil', label: 'Perfil', visible: true },
    { value: 'usuarios', label: 'Usuarios', visible: can('MEMBER_READ') },
    { value: 'roles', label: 'Roles', visible: can('MEMBER_READ') },
    { value: 'empresa', label: 'Empresa', visible: can('PROJECT_READ') },
    { value: 'cotizaciones', label: 'Cotizaciones', visible: can('PROJECT_READ') },
    { value: 'whatsapp', label: 'WhatsApp', visible: can('PROJECT_UPDATE') },
    { value: 'respuestas', label: 'Respuestas rápidas', visible: can('WHATSAPP_SEND_MESSAGE') },
    { value: 'integraciones', label: 'Integraciones', visible: can('PROJECT_UPDATE') },
  ];
  const visible = tabs.filter((tab) => tab.visible);
  const requested = params.get('tab');
  const active: TabKey = visible.find((tab) => tab.value === requested)?.value ?? 'perfil';

  function select(tab: TabKey) {
    const next = new URLSearchParams(params.toString());
    if (tab === 'perfil') next.delete('tab');
    else next.set('tab', tab);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div>
      <PageHeader
        title="Configuración"
        subtitle="Administra tu cuenta, tu equipo y las reglas del asistente comercial."
      />
      <Tabs
        tabs={visible.map((tab) => ({ value: tab.value, label: tab.label }))}
        value={active}
        onChange={select}
        className="mb-6"
      />
      {active === 'perfil' ? <ProfileTab /> : null}
      {active === 'usuarios' ? <UsersTab /> : null}
      {active === 'roles' ? <RolesTab /> : null}
      {active === 'empresa' ? <CompanyTab /> : null}
      {active === 'cotizaciones' ? <QuotesTab /> : null}
      {active === 'whatsapp' ? <WhatsAppTab /> : null}
      {active === 'respuestas' ? <QuickRepliesTab /> : null}
      {active === 'integraciones' ? <IntegrationsTab /> : null}
    </div>
  );
}
