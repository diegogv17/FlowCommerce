import { getAccessToken } from '@/lib/supabase/client';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

// Error de la API con el formato del GlobalExceptionFilter del backend:
// { statusCode, message: string | string[], error }.
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

type Query = Record<string, string | number | boolean | null | undefined | string[]>;

export function toQueryString(query?: Query): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length) params.set(key, value.join(','));
    } else {
      params.set(key, String(value));
    }
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

interface RequestOptions {
  method?: string;
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
  /** Devuelve la Response cruda (PDF, descargas, streams). */
  raw?: boolean;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = await authHeaders();
  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_URL}${path}${toQueryString(options.query)}`, {
    method: options.method ?? (body ? 'POST' : 'GET'),
    headers,
    body,
    signal: options.signal,
  });

  if (!response.ok) {
    let message = response.statusText || 'Error de la API';
    let details: unknown;
    try {
      details = await response.json();
      const raw = (details as { message?: string | string[] }).message;
      if (raw) message = Array.isArray(raw) ? raw.join('. ') : raw;
    } catch {
      // cuerpo vacío o no JSON
    }
    if (response.status === 401 && typeof window !== 'undefined') {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new ApiError(response.status, message, details);
  }

  if (options.raw) return response as unknown as T;
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) =>
    apiFetch<T>(path, { query, signal }),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: body ?? {} }),
  patch: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body: unknown) => apiFetch<T>(path, { method: 'PUT', body }),
  delete: <T = void>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, form: FormData, method = 'POST') =>
    apiFetch<T>(path, { method, body: form }),
  /** Descarga un archivo protegido (PDF, adjunto) y lo abre o lo guarda. */
  async download(path: string, filename: string, open = false) {
    const response = await apiFetch<Response>(path, { raw: true });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    if (open) {
      window.open(url, '_blank', 'noopener');
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
};

/** Ruta de un recurso del proyecto: p('abc', '/leads') → /projects/abc/leads */
export function projectPath(projectId: string, path = '') {
  return `/projects/${projectId}${path}`;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado';
}
