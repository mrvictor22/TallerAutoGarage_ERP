'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User, Wrench, Gauge, Zap, CheckCircle, AlertCircle, Clock, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useWorkshopConfig } from '@/contexts/workshop-config';
import { cn } from '@/lib/utils';

interface LoginFormProps {
  primaryColor?: string;
  secondaryColor?: string;
  notification?: {
    title: string;
    description: string;
    type: 'success' | 'warning' | 'error';
  } | null;
  onDismissNotification?: () => void;
}

export function LoginForm({
  primaryColor = '#f97316',
  secondaryColor = '#ef4444',
  notification,
  onDismissNotification
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkError, setMagicLinkError] = useState('');
  const [magicLinkSuccess, setMagicLinkSuccess] = useState('');

  const router = useRouter();
  const { login, signUp, signInWithMagicLink } = useAuthStore();
  const { config } = useWorkshopConfig();
  const workshopName = config?.name || 'Taller Pro';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const result = await login(email, password);

    if (result.success) {
      router.push('/es/dashboard');
    } else {
      setError(result.error || 'Error al iniciar sesión');
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    const result = await signUp(email, password, fullName);

    if (result.success) {
      if (result.error) {
        setSuccess(result.error);
      } else {
        router.push('/es/dashboard');
      }
    } else {
      setError(result.error || 'Error al crear cuenta');
    }

    setIsLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setMagicLinkLoading(true);
    setMagicLinkError('');
    setMagicLinkSuccess('');

    const result = await signInWithMagicLink(magicLinkEmail);

    if (result.success) {
      setMagicLinkSuccess('Hemos enviado un enlace de acceso a tu correo');
      setMagicLinkEmail('');
    } else {
      setMagicLinkError(result.error || 'Error al enviar enlace de acceso');
    }

    setMagicLinkLoading(false);
  };

  const gradientStyle = {
    background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
  };

  const glowGradientStyle = {
    background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor}, ${primaryColor})`
  };

  const getNotificationStyles = (type: 'success' | 'warning' | 'error') => {
    switch (type) {
      case 'success':
        return {
          gradient: 'from-green-500 to-emerald-500',
          icon: CheckCircle,
          shadow: 'shadow-green-500/50'
        };
      case 'warning':
        return {
          gradient: 'from-amber-500 to-orange-500',
          icon: Clock,
          shadow: 'shadow-orange-500/50'
        };
      case 'error':
        return {
          gradient: 'from-red-500 to-rose-500',
          icon: AlertCircle,
          shadow: 'shadow-red-500/50'
        };
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Glass Card */}
      <div className="relative">
        {/* Glow Effect */}
        <div
          className="absolute -inset-1 rounded-2xl blur-lg opacity-75 animate-pulse"
          style={glowGradientStyle}
        />

        <div className="relative bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Notification Banner - Sticky at top inside card */}
          {notification && (
            <div className="mb-6 -mt-2 -mx-2">
              {(() => {
                const styles = getNotificationStyles(notification.type);
                const Icon = styles.icon;
                return (
                  <div className={cn(
                    "relative bg-gradient-to-r",
                    styles.gradient,
                    "rounded-xl p-4 shadow-lg",
                    styles.shadow,
                    "border-2 border-white/20",
                    "backdrop-blur-sm"
                  )}>
                    {/* Racing stripes decoration */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent" />

                    <button
                      onClick={onDismissNotification}
                      className="absolute top-2 right-2 p-1.5 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
                      aria-label="Cerrar notificación"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>

                    <div className="flex items-start gap-3 pr-6">
                      <div className="flex-shrink-0 mt-0.5">
                        <Icon className="w-6 h-6 text-white drop-shadow-lg" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white text-base leading-tight drop-shadow-md">
                          {notification.title}
                        </p>
                        <p className="text-white/95 text-sm mt-1.5 leading-snug">
                          {notification.description}
                        </p>
                      </div>
                    </div>

                    {/* Decorative corner accents */}
                    <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-white/30 rounded-tl-sm" />
                    <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-white/30 rounded-br-sm" />
                  </div>
                );
              })()}
            </div>
          )}

          {/* Header with Logo */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                boxShadow: `0 10px 25px -5px ${primaryColor}80`
              }}
            >
              <Wrench className="w-10 h-10 text-white" />
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
              Sistema de Gestión Automotriz
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

          {/* Toggle Buttons */}
          <div className="flex mb-6 bg-white/5 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={cn(
                'flex-1 py-2.5 text-sm font-semibold rounded-md transition-all duration-300',
                mode === 'login'
                  ? 'text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              )}
              style={mode === 'login' ? gradientStyle : undefined}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={cn(
                'flex-1 py-2.5 text-sm font-semibold rounded-md transition-all duration-300',
                mode === 'register'
                  ? 'text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              )}
              style={mode === 'register' ? gradientStyle : undefined}
            >
              Registrarse
            </button>
          </div>

          {/* Form */}
          <form onSubmit={mode === 'login' ? handleLogin : handleSignUp} className="space-y-5">
            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-300 text-sm font-medium">
                  Nombre Completo
                </Label>
                <div className="relative group">
                  <div
                    className="absolute inset-0 rounded-lg blur opacity-0 group-focus-within:opacity-50 transition-opacity"
                    style={gradientStyle}
                  />
                  <div className="relative">
                    <User
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:transition-colors"
                      style={{ '--tw-text-opacity': 1 } as React.CSSProperties}
                    />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Juan Pérez"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-lg"
                      style={{
                        '--tw-ring-color': `${primaryColor}33`,
                        borderColor: 'rgba(255,255,255,0.1)'
                      } as React.CSSProperties}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 text-sm font-medium">
                Correo Electrónico
              </Label>
              <div className="relative group">
                <div
                  className="absolute inset-0 rounded-lg blur opacity-0 group-focus-within:opacity-50 transition-opacity"
                  style={gradientStyle}
                />
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-lg"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-300 text-sm font-medium">
                  Contraseña
                </Label>
                {mode === 'login' && (
                  <Link
                    href="/es/forgot-password"
                    className="text-xs font-medium transition-colors hover:text-white"
                    style={{ color: primaryColor }}
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                )}
              </div>
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
                    placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-lg"
                    required
                    minLength={mode === 'register' ? 6 : undefined}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/50 text-red-400">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-500/10 border-green-500/50 text-green-400">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-white font-bold text-base rounded-lg shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
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
                  {mode === 'login' ? 'Acceder al Sistema' : 'Crear Cuenta'}
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          {mode === 'register' && (
            <p className="mt-6 text-xs text-center text-gray-500">
              Los nuevos usuarios se registran como técnicos.
              <br />
              Contacta al administrador para cambiar tu rol.
            </p>
          )}

          {/* Divider with "o" */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">o</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Magic Link Section */}
          {!showMagicLink ? (
            <button
              type="button"
              onClick={() => {
                setShowMagicLink(true);
                setMagicLinkError('');
                setMagicLinkSuccess('');
              }}
              className="w-full text-center text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Acceso sin contraseña
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-300">Acceso sin contraseña</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowMagicLink(false);
                    setMagicLinkEmail('');
                    setMagicLinkError('');
                    setMagicLinkSuccess('');
                  }}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>

              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="magic-link-email" className="text-gray-300 text-sm font-medium">
                    Correo Electrónico
                  </Label>
                  <div className="relative group">
                    <div
                      className="absolute inset-0 rounded-lg blur opacity-0 group-focus-within:opacity-50 transition-opacity"
                      style={gradientStyle}
                    />
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:transition-colors" />
                      <Input
                        id="magic-link-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={magicLinkEmail}
                        onChange={(e) => setMagicLinkEmail(e.target.value)}
                        className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-lg"
                        required
                        disabled={magicLinkLoading}
                      />
                    </div>
                  </div>
                </div>

                {magicLinkError && (
                  <Alert variant="destructive" className="bg-red-500/10 border-red-500/50 text-red-400">
                    <AlertDescription>{magicLinkError}</AlertDescription>
                  </Alert>
                )}

                {magicLinkSuccess && (
                  <Alert className="bg-green-500/10 border-green-500/50 text-green-400">
                    <AlertDescription>{magicLinkSuccess}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={magicLinkLoading}
                  className="w-full h-12 text-white font-bold text-base rounded-lg shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                    boxShadow: `0 10px 25px -5px ${primaryColor}40`
                  }}
                >
                  {magicLinkLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Mail className="mr-2 h-5 w-5" />
                      Enviar enlace de acceso
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
