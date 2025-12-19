'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

interface AuthRedirectProps {
  locale: string;
  children: React.ReactNode;
}

export function AuthRedirect({ locale, children }: AuthRedirectProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient();
      const hash = window.location.hash;

      // Check if there's a hash with tokens (from email link)
      if (hash && hash.includes('access_token')) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (!error) {
            router.push(`/${locale}/dashboard`);
            return;
          }
        }
      }

      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        router.push(`/${locale}/dashboard`);
      } else {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [router, locale]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
