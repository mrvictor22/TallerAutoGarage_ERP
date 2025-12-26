'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User, Wrench, Gauge, Zap } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useWorkshopConfig } from '@/contexts/workshop-config';
import { cn } from '@/lib/utils';

interface LoginFormProps {
  primaryColor?: string;
  secondaryColor?: string;
}

export function LoginForm({ primaryColor = '#f97316', secondaryColor = '#ef4444' }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const router = useRouter();
  const { login, signUp } = useAuthStore();
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

  const gradientStyle = {
    background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
  };

  const glowGradientStyle = {
    background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor}, ${primaryColor})`
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
              <Label htmlFor="password" className="text-gray-300 text-sm font-medium">
                Contraseña
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
        </div>
      </div>
    </div>
  );
}
