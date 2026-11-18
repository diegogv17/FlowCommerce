'use client';

import Link from 'next/link';
import type { PlanId } from './plans';
import { trackCtaClick, trackGenerateLead, trackPlanSelected, type CtaLocation } from './track';

// Único pedazo de JS de los CTA: un <Link> que avisa a GA4 al hacer clic.
// Así la landing sigue siendo un Server Component.
export function TrackedLink({
  href,
  ubicacion,
  etiqueta,
  plan,
  ciclo,
  lead,
  className,
  children,
  'aria-label': ariaLabel,
}: {
  href: string;
  ubicacion: CtaLocation;
  etiqueta?: string;
  /** Si viene, además registra 'select_plan'. */
  plan?: PlanId;
  ciclo?: 'mensual' | 'anual';
  /** Si es true, además registra 'generate_lead' (contacto comercial). */
  lead?: boolean;
  className?: string;
  children: React.ReactNode;
  'aria-label'?: string;
}) {
  function handleClick() {
    trackCtaClick(ubicacion, etiqueta);
    if (plan) trackPlanSelected(plan, ciclo);
    if (lead) trackGenerateLead(ubicacion);
  }

  // Enlaces externos (mailto:, https://) van con <a> normal.
  if (!href.startsWith('/') && !href.startsWith('#')) {
    return (
      <a href={href} className={className} onClick={handleClick} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} onClick={handleClick} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
