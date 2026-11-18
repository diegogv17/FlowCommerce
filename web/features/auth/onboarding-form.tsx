'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, Field, Input, Spinner, Textarea } from '@/components/ui';
import { Logo } from '@/components/layout/logo';
import { ApiError, api, errorMessage } from '@/lib/api';
import { useLogout, useMe, useMyProjects } from '@/hooks/use-session';
import { rememberProject } from './utils';

interface CreatedProject {
  id: string;
  name: string;
  slug: string;
}

// Mismo patrón que valida CreateProjectDto: kebab-case con guiones simples.
const SLUG_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

/** Primer paso tras registrarse: crear la empresa (proyecto) del usuario. */
export function OnboardingForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useLogout();
  const { data: me } = useMe();
  const { data: projects, isLoading } = useMyProjects();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const create = useMutation({
    mutationFn: () =>
      api.post<CreatedProject>('/projects', {
        name: name.trim(),
        slug,
        description: description.trim() || undefined,
      }),
    onSuccess: async (project) => {
      rememberProject(project.id);
      await queryClient.invalidateQueries({ queryKey: ['projects', 'my'] });
      toast.success(`¡Listo! ${project.name} está creada.`);
      router.replace('/dashboard');
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        setErrors({ slug: 'Ese identificador ya está en uso. Prueba con otro.' });
      } else {
        toast.error(errorMessage(error));
      }
    },
  });

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (name.trim().length < 2) found.name = 'Escribe el nombre de tu empresa.';
    if (!SLUG_RE.test(slug)) found.slug = 'Usa minúsculas, números y guiones (sin espacios).';
    setErrors(found);
    if (Object.keys(found).length === 0) create.mutate();
  }

  const hasProjects = (projects?.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-canvas px-4 py-10">
      <div className="mx-auto flex max-w-lg flex-col gap-8">
        <div className="flex items-center justify-between">
          <Logo />
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
          >
            <LogOut className="h-4 w-4" aria-hidden /> Salir
          </button>
        </div>

        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            {me?.name ? `Hola, ${me.name.split(' ')[0]}` : 'Bienvenido'}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Crea tu empresa para empezar. Podrás invitar a tu equipo y ajustar los datos de facturación
            después, en Configuración.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-7 w-7" />
          </div>
        ) : (
          <Card className="p-6">
            {hasProjects ? (
              <div className="mb-5 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">
                Ya perteneces a {projects!.length === 1 ? 'un proyecto' : `${projects!.length} proyectos`}.{' '}
                <Link href="/dashboard" className="font-semibold underline">
                  Ir al dashboard
                </Link>
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <Field label="Nombre de la empresa" error={errors.name}>
                <Input
                  autoFocus
                  placeholder="Distribuidora El Quetzal"
                  value={name}
                  onChange={(event) => onNameChange(event.target.value)}
                  maxLength={255}
                />
              </Field>
              <Field
                label="Identificador"
                error={errors.slug}
                hint="Único y permanente: no se puede cambiar después."
              >
                <Input
                  className="font-mono text-xs"
                  placeholder="distribuidora-el-quetzal"
                  value={slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setSlug(event.target.value.toLowerCase());
                  }}
                  maxLength={255}
                />
              </Field>
              <Field label="Descripción (opcional)">
                <Textarea
                  placeholder="¿Qué vende tu empresa?"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={2000}
                />
              </Field>
              <Button type="submit" size="lg" className="w-full" loading={create.isPending}>
                Crear empresa
              </Button>
            </form>
          </Card>
        )}

        <p className="text-center text-xs text-muted">
          ¿Te invitaron a una empresa existente? Abre el enlace de invitación que llegó a tu correo.
        </p>
      </div>
    </div>
  );
}
