'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthConfirmPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Procesando autenticación...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient();

      // Check if there's a hash with tokens
      const hash = window.location.hash;

      if (hash && hash.includes('access_token')) {
        // Parse the hash
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');

        if (accessToken && refreshToken) {
          // Set the session
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            setMessage('Error al procesar la autenticación: ' + error.message);
            return;
          }

          if (type === 'recovery') {
            // Redirect to password reset page or dashboard
            setMessage('Sesión recuperada. Redirigiendo...');
            router.push('/es/dashboard');
          } else {
            router.push('/es/dashboard');
          }
        }
      } else {
        // No hash, check for existing session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          router.push('/es/dashboard');
        } else {
          router.push('/es/login');
        }
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-lg text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}
