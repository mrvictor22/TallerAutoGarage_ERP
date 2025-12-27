'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, CheckCircle2, AlertCircle, Gauge, Zap, Shield } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useWorkshopConfig } from '@/contexts/workshop-config';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { updatePassword } = useAuthStore();
  const { config } = useWorkshopConfig();

  const primaryColor = config?.primary_color || '#f97316';
  const secondaryColor = config?.secondary_color || '#ef4444';
  const workshopName = config?.name || 'Taller Pro';

  // Check for valid session on mount
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      setHasSession(!!session);
      setCheckingSession(false);

      // If no session, redirect to login
      if (!session) {
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error || errorDescription) {
          router.push(`/es/login?error=${error || 'session_expired'}&error_description=${errorDescription || 'El enlace ha expirado o es inválido'}`);
        } else {
          router.push('/es/login?error=session_expired&error_description=El enlace de restablecimiento ha expirado');
        }
      }
    };

    checkSession();
  }, [router, searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password length
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      const result = await updatePassword(password);

      if (result.success) {
        setSuccess(true);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/es/login?message=password_updated');
        }, 2000);
      } else {
        setError(result.error || 'Error al actualizar la contraseña');
      }
    } catch {
      setError('Error de conexión al actualizar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const gradientStyle = {
    background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
  };

  const glowGradientStyle = {
    background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor}, ${primaryColor})`
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!hasSession) {
    return null; // Will redirect
  }

  if (success) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px]" />

        {/* Radial Gradient Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />

        {/* Success Content */}
        <div className="relative z-10 w-full max-w-md px-4">
          <div className="relative">
            {/* Glow Effect */}
            <div
              className="absolute -inset-1 rounded-2xl blur-lg opacity-75 animate-pulse"
              style={glowGradientStyle}
            />

            <div className="relative bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
              <div
                className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 animate-bounce"
                style={{
                  background: `linear-gradient(135deg, #10b981 0%, #059669 100%)`,
                  boxShadow: '0 10px 25px -5px #10b98180'
                }}
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-4">
                ¡Contraseña Actualizada!
              </h2>
              <p className="text-gray-400 mb-6">
                Tu contraseña ha sido restablecida exitosamente.
                <br />
                Serás redirigido al login...
              </p>

              <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
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
          <pattern id="tire-track-reset" x="0" y="0" width="100" height="20" patternUnits="userSpaceOnUse">
            <rect x="0" y="8" width="30" height="4" fill={primaryColor} />
            <rect x="35" y="8" width="15" height="4" fill={primaryColor} />
            <rect x="55" y="8" width="15" height="4" fill={primaryColor} />
            <rect x="75" y="8" width="20" height="4" fill={primaryColor} />
          </pattern>
          <rect width="100%" height="100%" fill="url(#tire-track-reset)" />
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
        <div className="w-full max-w-md mx-auto">
          {/* Glass Card */}
          <div className="relative">
            {/* Glow Effect */}
            <div
              className="absolute -inset-1 rounded-2xl blur-lg opacity-75 animate-pulse"
              style={glowGradientStyle}
            />

            <div className="relative bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
              {/* Header with Logo */}
              <div className="text-center mb-8">
                <div
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                    boxShadow: `0 10px 25px -5px ${primaryColor}80`
                  }}
                >
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h1
                  className="text-3xl font-black text-transparent bg-clip-text tracking-tight"
                  style={{
                    backgroundImage: `linear-gradient(to right, white, ${primaryColor}, ${secondaryColor})`
                  }}
                >
                  {workshopName.toUpperCase()}
                </h1>
                <p className="text-gray-400 mt-2 text-sm">
                  Restablecer Contraseña
                </p>

                {/* Decorative Line */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div
                    className="h-px w-12"
                    style={{ background: `linear-gradient(to right, transparent, ${primaryColor})` }}
                  />
                  <Gauge className="w-4 h-4" style={{ color: primaryColor }} />
                  <div
                    className="h-px w-12"
                    style={{ background: `linear-gradient(to left, transparent, ${primaryColor})` }}
                  />
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300 text-sm font-medium">
                    Nueva Contraseña
                  </Label>
                  <div className="relative group">
                    <div
                      className="absolute inset-0 rounded-lg blur opacity-0 group-focus-within:opacity-50 transition-opacity"
                      style={gradientStyle}
                    />
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:transition-colors" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-lg"
                        style={{
                          '--tw-ring-color': `${primaryColor}33`,
                          borderColor: 'rgba(255,255,255,0.1)'
                        } as React.CSSProperties}
                        required
                        minLength={6}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Mínimo 6 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-300 text-sm font-medium">
                    Confirmar Contraseña
                  </Label>
                  <div className="relative group">
                    <div
                      className="absolute inset-0 rounded-lg blur opacity-0 group-focus-within:opacity-50 transition-opacity"
                      style={gradientStyle}
                    />
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:transition-colors" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Repite tu contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={cn(
                          "pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-lg",
                          confirmPassword && password !== confirmPassword && "border-red-500/50"
                        )}
                        style={{
                          '--tw-ring-color': `${primaryColor}33`,
                          borderColor: confirmPassword && password !== confirmPassword
                            ? 'rgba(239, 68, 68, 0.5)'
                            : 'rgba(255,255,255,0.1)'
                        } as React.CSSProperties}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Las contraseñas no coinciden
                    </p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Las contraseñas coinciden
                    </p>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive" className="bg-red-500/10 border-red-500/50 text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || password !== confirmPassword || password.length < 6}
                  className="w-full h-12 text-white font-bold text-base rounded-lg shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                    boxShadow: `0 10px 25px -5px ${primaryColor}40`
                  }}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5" />
                      Restablecer Contraseña
                    </>
                  )}
                </Button>
              </form>

              {/* Footer */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => router.push('/es/login')}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                  disabled={isLoading}
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </div>
          </div>
        </div>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
