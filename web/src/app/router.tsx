import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/features/auth/LoginPage'

/** Cada pantalla se carga bajo demanda para mantener liviano el bundle inicial. */
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  /* Pantallas de cuenta (públicas). */
  { path: '/registro', lazy: async () => ({ Component: (await import('@/features/auth/RegisterPage')).RegisterPage }) },
  { path: '/olvide-contrasena', lazy: async () => ({ Component: (await import('@/features/auth/ForgotPasswordPage')).ForgotPasswordPage }) },
  { path: '/restablecer-contrasena', lazy: async () => ({ Component: (await import('@/features/auth/ResetPasswordPage')).ResetPasswordPage }) },
  { path: '/onboarding', lazy: async () => ({ Component: (await import('@/features/auth/OnboardingPage')).OnboardingPage }) },
  { path: '/invitacion', lazy: async () => ({ Component: (await import('@/features/auth/InvitationPage')).InvitationPage }) },
  { path: '/solicitar-acceso', lazy: async () => ({ Component: (await import('@/features/auth/AccessRequestPage')).AccessRequestPage }) },
  { path: '/auth/callback', lazy: async () => ({ Component: (await import('@/features/auth/AuthCallbackPage')).AuthCallbackPage }) },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', lazy: async () => ({ Component: (await import('@/features/dashboard/DashboardPage')).DashboardPage }) },
      { path: 'leads/:id', lazy: async () => ({ Component: (await import('@/features/leads/LeadDetailPage')).LeadDetailPage }) },
      { path: 'leads', lazy: async () => ({ Component: (await import('@/features/leads/LeadsPage')).LeadsPage }) },
      { path: 'conversaciones/:id?', lazy: async () => ({ Component: (await import('@/features/inbox/InboxPage')).InboxPage }) },
      { path: 'cotizaciones', lazy: async () => ({ Component: (await import('@/features/quotes/QuotesPage')).QuotesPage }) },
      { path: 'cotizaciones/nueva', lazy: async () => ({ Component: (await import('@/features/quotes/NewQuotePage')).NewQuotePage }) },
      { path: 'cotizaciones/:id', lazy: async () => ({ Component: (await import('@/features/quotes/QuoteDetailPage')).QuoteDetailPage }) },
      { path: 'clientes', lazy: async () => ({ Component: (await import('@/features/customers/CustomersPage')).CustomersPage }) },
      { path: 'clientes/:id', lazy: async () => ({ Component: (await import('@/features/customers/CustomerDetailPage')).CustomerDetailPage }) },
      { path: 'productos', lazy: async () => ({ Component: (await import('@/features/products/ProductsPage')).ProductsPage }) },
      { path: 'notificaciones', lazy: async () => ({ Component: (await import('@/features/notifications/NotificationsPage')).NotificationsPage }) },
      { path: 'notas', lazy: async () => ({ Component: (await import('@/features/notes/NotesPage')).NotesPage }) },
      { path: 'configuracion', lazy: async () => ({ Component: (await import('@/features/settings/SettingsPage')).SettingsPage }) },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
])
