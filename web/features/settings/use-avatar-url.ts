'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

/**
 * La foto de perfil es un recurso protegido (GET /users/:id/avatar necesita el
 * Bearer), así que no sirve como <img src>. Este hook la descarga con el token y
 * devuelve un object URL para <Avatar src>. `avatarUrl` es lo que devuelve la
 * API en el perfil o en los miembros ("/api/v1/users/<id>/avatar?v=<hash>"):
 * el ?v cambia con cada foto, así que sirve de clave de caché.
 *
 * Devuelve null mientras carga, si no hay foto o si falla.
 */
export function useAvatarUrl(avatarUrl: string | null | undefined): string | null {
  const path = avatarUrl ? toApiPath(avatarUrl) : null;
  const { data } = useQuery({
    queryKey: ['avatar', path],
    queryFn: async () => {
      const response = await apiFetch<Response>(path!, { raw: true });
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },
    enabled: Boolean(path),
    staleTime: Infinity,
    gcTime: 60 * 60_000,
    retry: false,
  });
  return data ?? null;
}

/** Quita el origen y el prefijo /api/vN: apiFetch ya antepone API_URL. */
function toApiPath(avatarUrl: string): string {
  const withoutOrigin = avatarUrl.replace(/^https?:\/\/[^/]+/i, '');
  return withoutOrigin.replace(/^\/api\/v\d+/, '');
}
