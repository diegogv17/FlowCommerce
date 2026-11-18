'use client';

import { useQuery } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Permission } from '@flowcommerce/types';
import { api, projectPath } from '@/lib/api';
import { useMyProjects, type MyProject, type RoleCatalog } from './use-session';

const STORAGE_KEY = 'fc.projectId';

interface ProjectContextValue {
  project: MyProject | null;
  projectId: string;
  projects: MyProject[];
  isLoading: boolean;
  selectProject: (id: string) => void;
  /** ¿El rol del usuario en este proyecto tiene el permiso? */
  can: (permission: Permission | `${Permission}`) => boolean;
  /** Ruta de la API del proyecto: path('/leads') → /projects/:id/leads */
  path: (suffix?: string) => string;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

function readStored(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { data: projects = [], isLoading } = useMyProjects();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setSelected(readStored());
  }, []);

  const project = useMemo(
    () => projects.find((item) => item.id === selected) ?? projects[0] ?? null,
    [projects, selected],
  );

  const { data: catalog } = useQuery({
    queryKey: ['roles', project?.id],
    queryFn: () => api.get<RoleCatalog>(projectPath(project!.id, '/roles')),
    enabled: Boolean(project),
    staleTime: Infinity,
  });

  const can = useCallback(
    (permission: string) => {
      if (!project) return false;
      const role = catalog?.roles.find((item) => item.role === project.role);
      // Mientras carga el catálogo se asume permiso; el backend decide igual.
      return role ? role.permissions.includes(permission as Permission) : true;
    },
    [catalog, project],
  );

  const selectProject = useCallback((id: string) => {
    setSelected(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // almacenamiento no disponible
    }
  }, []);

  const value = useMemo<ProjectContextValue>(
    () => ({
      project,
      projectId: project?.id ?? '',
      projects,
      isLoading,
      selectProject,
      can,
      path: (suffix = '') => projectPath(project?.id ?? '', suffix),
    }),
    [project, projects, isLoading, selectProject, can],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const value = useContext(ProjectContext);
  if (!value) throw new Error('useProject debe usarse dentro de <ProjectProvider>');
  return value;
}
