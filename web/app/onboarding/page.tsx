'use client';

import { OnboardingForm } from '@/features/auth/onboarding-form';

// Fuera del grupo (app): no hay menú ni proyecto seleccionado todavía. El
// AppShell redirige aquí cuando el usuario no tiene proyectos.
export default function OnboardingPage() {
  return <OnboardingForm />;
}
