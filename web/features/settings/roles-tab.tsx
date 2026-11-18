'use client';

import { Fragment } from 'react';
import { Check, Minus } from 'lucide-react';
import { Card, CardHeader, ErrorState, Skeleton, Table, Td, Th } from '@/components/ui';
import { useProject } from '@/hooks/use-project';
import type { RoleCatalog } from '@/hooks/use-session';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useRoleCatalog } from './hooks';

/** Matriz de permisos por rol (solo lectura: la define el sistema). */
export function RolesTab() {
  const { project } = useProject();
  const catalog = useRoleCatalog();

  if (catalog.isLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (catalog.isError || !catalog.data) {
    return <ErrorState message={errorMessage(catalog.error)} onRetry={() => catalog.refetch()} />;
  }
  const { roles } = catalog.data;
  const areas = groupByArea(catalog.data.permissions);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {roles.map((role) => (
          <Card
            key={role.role}
            className={cn('p-4', project?.role === role.role && 'border-brand-500 ring-2 ring-brand-500/20')}
          >
            <p className="flex items-center justify-between gap-2 font-semibold text-ink">
              {role.label}
              {project?.role === role.role ? (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                  Tu rol
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{role.description}</p>
          </Card>
        ))}
      </div>

      <Card className="p-0">
        <div className="p-5 pb-0">
          <CardHeader
            title="Permisos por rol"
            subtitle="Los permisos son fijos del sistema y no se editan por proyecto."
          />
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Permiso</Th>
              {roles.map((role) => (
                <Th key={role.role} className="text-center">
                  {role.label}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {areas.map(([area, permissions]) => (
              <Fragment key={area}>
                <tr>
                  <td
                    colSpan={roles.length + 1}
                    className="bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted"
                  >
                    {area}
                  </td>
                </tr>
                {permissions.map((permission) => (
                  <tr key={permission.key}>
                    <Td className="min-w-48 text-ink">{permission.label}</Td>
                    {roles.map((role) => {
                      const allowed = role.permissions.includes(permission.key);
                      return (
                        <Td key={role.role} className="text-center">
                          {allowed ? (
                            <Check className="mx-auto h-4 w-4 text-emerald-500" aria-label="Sí" />
                          ) : (
                            <Minus className="mx-auto h-4 w-4 text-slate-300" aria-label="No" />
                          )}
                        </Td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

function groupByArea(permissions: RoleCatalog['permissions']) {
  const map = new Map<string, RoleCatalog['permissions']>();
  for (const permission of permissions) {
    const list = map.get(permission.area) ?? [];
    list.push(permission);
    map.set(permission.area, list);
  }
  return Array.from(map.entries());
}
