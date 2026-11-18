'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { Permission, Role } from '@flowcommerce/types';
import { api } from '@/lib/api';
import { getSupabase } from '@/lib/supabase/client';

export interface Me {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  position: string | null;
  avatarUrl: string | null;
}

export interface MyProject {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  role: Role;
}

export interface RoleCatalog {
  roles: { role: Role; label: string; description: string; permissions: Permission[] }[];
  permissions: { key: Permission; area: string; label: string }[];
}

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: () => api.get<Me>('/users/me') });
}

export function useMyProjects() {
  return useQuery({
    queryKey: ['projects', 'my'],
    queryFn: () => api.get<MyProject[]>('/projects/my'),
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return async () => {
    await getSupabase().auth.signOut();
    queryClient.clear();
    router.replace('/login');
  };
}
