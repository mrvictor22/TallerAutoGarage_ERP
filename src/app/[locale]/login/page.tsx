'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { useWorkshopConfig } from '@/contexts/workshop-config';
import { CheckCircle, AlertCircle, Clock, X, Loader2 } from 'lucide-react';

const messages: Record<string, { title: string; description: string; type: 'success' | 'warning' | 'error' }> = {
  'email_verified': {
    title: 'Correo Verificado',
    description: 'Tu correo ha sido verificado exitosamente. Tu cuenta está pendiente de aprobación por un administrador.',
    type: 'success'
  },
  'pending_approval': {
    title: 'Cuenta Pendiente de Aprobación',
    description: 'Tu correo ha sido verificado. Un administrador debe aprobar tu cuenta antes de que puedas acceder al sistema.',
    type: 'warning'
  },
  'email_updated': {
    title: 'Correo Actualizado',
    description: 'Tu correo electrónico ha sido actualizado exitosamente. Inicia sesión con tu nuevo correo.',
    type: 'success'
  },
  'password_reset_success': {
    title: 'Contraseña Actualizada',
    description: 'Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión.',
    type: 'success'
  }
};

const errorMessages: Record<string, string> = {
  'otp_expired': 'El enlace de confirmación ha expirado. Por favor, regístrate de nuevo.',
  'access_denied': 'Acceso denegado. El enlace puede haber expirado o ser inválido.',
  'verification_failed': 'Error al verificar el correo. Por favor, intenta de nuevo.',
  'exchange_failed': 'Error al procesar la autenticación.',
  'session_failed': 'No se pudo establecer la sesión. Por favor, intenta de nuevo.',
  'session_expired': 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.'
};

function LoginPageContent() {
  const searchParams = useSearchParams();
  const { config } = useWorkshopConfig();
  const primaryColor = config?.primary_color || '#f97316';
  const secondaryColor = config?.secondary_color || '#ef4444';
  const hasProcessedParams = useRef(false);

  const [notification, setNotification] = useState<{
    title: string;
    description: string;
    type: 'success' | 'warning' | 'error';
  } | null>(null);

  // Process URL params on mount only
  useEffect(() => {
    // Prevent processing more than once
    if (hasProcessedParams.current) return;

    const confirmed = searchParams.get('confirmed');
    const message = searchParams.get('message');
    const error = searchParams.get('error');
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description');

    if (confirmed === 'true' && message && messages[message]) {
      hasProcessedParams.current = true;
      setNotification(messages[message]);
      // Clean URL after a small delay to ensure state is set
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 100);
    } else if (error || errorCode) {
      hasProcessedParams.current = true;
      const errorMsg = errorMessages[errorCode || error || ''] ||
        errorDescription?.replace(/\+/g, ' ') ||
        'Ha ocurrido un error de autenticación';
      setNotification({
        title: 'Error',
        description: errorMsg,
        type: 'error'
      });
      // Clean URL after a small delay to ensure state is set
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 100);
    }
  }, [searchParams]);

  const getNotificationStyles = (type: 'success' | 'warning' | 'error') => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-500/90',
          border: 'border-green-400/50',
          icon: CheckCircle
        };
      case 'warning':
        return {
          bg: `bg-gradient-to-r from-amber-500/90 to-orange-500/90`,
          border: 'border-amber-400/50',
          icon: Clock
        };
      case 'error':
        return {
          bg: 'bg-red-500/90',
          border: 'border-red-400/50',
          icon: AlertCircle
        };
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in fade-in slide-in-from-top-4">
          {(() => {
            const styles = getNotificationStyles(notification.type);
            const Icon = styles.icon;
            return (
              <div className={`relative ${styles.bg} backdrop-blur-sm text-white rounded-xl p-4 shadow-2xl border ${styles.border}`}>
                <button
                  onClick={() => setNotification(null)}
                  className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-start gap-3">
                  <Icon className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{notification.title}</p>
                    <p className="text-sm opacity-90 mt-1">{notification.description}</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Animated Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Animated Gradient Orbs */}
      <div
        className="absolute top-0 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"
        style={{ backgroundColor: primaryColor }}
      />
      <div
        className="absolute top-0 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"
        style={{ backgroundColor: secondaryColor }}
      />
      <div
        className="absolute -bottom-40 left-20 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"
        style={{ backgroundColor: primaryColor }}
      />

      {/* Racing Stripes */}
      <div className="absolute inset-0 overflow-hidden opacity-5">
        <div
          className="absolute top-0 left-1/4 w-1 h-full transform -skew-x-12"
          style={{ background: `linear-gradient(to bottom, transparent, ${primaryColor}, transparent)` }}
        />
        <div
          className="absolute top-0 left-3/4 w-1 h-full transform -skew-x-12"
          style={{ background: `linear-gradient(to bottom, transparent, ${secondaryColor}, transparent)` }}
        />
      </div>

      {/* Tire Track Pattern */}
      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <pattern id="tire-track-login" x="0" y="0" width="100" height="20" patternUnits="userSpaceOnUse">
            <rect x="0" y="8" width="30" height="4" fill={primaryColor} />
            <rect x="35" y="8" width="15" height="4" fill={primaryColor} />
            <rect x="55" y="8" width="15" height="4" fill={primaryColor} />
            <rect x="75" y="8" width="20" height="4" fill={primaryColor} />
          </pattern>
          <rect width="100%" height="100%" fill="url(#tire-track-login)" />
        </svg>
      </div>

      {/* Speed Lines - Top Right */}
      <div className="absolute top-20 right-0 w-96 h-1 opacity-20">
        <div
          className="absolute inset-0 animate-speed-line"
          style={{ background: `linear-gradient(to left, ${primaryColor}, transparent)` }}
        />
      </div>
      <div className="absolute top-32 right-0 w-80 h-0.5 opacity-15">
        <div
          className="absolute inset-0 animate-speed-line animation-delay-1000"
          style={{ background: `linear-gradient(to left, ${secondaryColor}, transparent)` }}
        />
      </div>
      <div className="absolute top-44 right-0 w-72 h-0.5 opacity-10">
        <div
          className="absolute inset-0 animate-speed-line animation-delay-2000"
          style={{ background: `linear-gradient(to left, ${primaryColor}, transparent)` }}
        />
      </div>

      {/* Speed Lines - Bottom Left */}
      <div className="absolute bottom-20 left-0 w-96 h-1 opacity-20">
        <div
          className="absolute inset-0 animate-speed-line-reverse"
          style={{ background: `linear-gradient(to right, ${primaryColor}, transparent)` }}
        />
      </div>
      <div className="absolute bottom-32 left-0 w-80 h-0.5 opacity-15">
        <div
          className="absolute inset-0 animate-speed-line-reverse animation-delay-1500"
          style={{ background: `linear-gradient(to right, ${secondaryColor}, transparent)` }}
        />
      </div>

      {/* Radial Gradient Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />

      {/* Content */}
      <div className="relative z-10 w-full px-4 py-8">
        <LoginForm primaryColor={primaryColor} secondaryColor={secondaryColor} />
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes speed-line {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(-100%);
            opacity: 0;
          }
        }

        @keyframes speed-line-reverse {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-speed-line {
          animation: speed-line 3s ease-in-out infinite;
        }

        .animate-speed-line-reverse {
          animation: speed-line-reverse 3s ease-in-out infinite;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }

        .animation-delay-1500 {
          animation-delay: 1.5s;
        }
      `}</style>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
