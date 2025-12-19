import { AuthRedirect } from '@/components/auth/auth-redirect';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <AuthRedirect locale={locale}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Sistema de Gestión del Taller
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Bienvenido al sistema de gestión automotriz
            </p>
            <div className="space-y-4">
              <a
                href={`/${locale}/login`}
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Iniciar Sesión
              </a>
            </div>
          </div>
        </div>
      </div>
    </AuthRedirect>
  );
}
