import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/features/auth/reset-password-form';

export const metadata: Metadata = { title: 'Nueva contraseña' };

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
