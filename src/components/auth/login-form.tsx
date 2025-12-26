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

export function LoginForm() {
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

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Glass Card */}
      <div className="relative">
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 rounded-2xl blur-lg opacity-75 animate-pulse" />

        <div className="relative bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Header with Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-600 mb-4 shadow-lg shadow-orange-500/50">
              <Wrench className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-500 to-red-500 tracking-tight">
              {workshopName.toUpperCase()}
            </h1>
            <p className="text-gray-400 mt-2 text-sm">
              Sistema de Gestión Automotriz
            </p>

            {/* Decorative Line */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-orange-500" />
              <Gauge className="w-4 h-4 text-orange-500" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-orange-500" />
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
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={cn(
                'flex-1 py-2.5 text-sm font-semibold rounded-md transition-all duration-300',
                mode === 'register'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              )}
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
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg blur opacity-0 group-focus-within:opacity-50 transition-opacity" />
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Juan Pérez"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg"
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
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg blur opacity-0 group-focus-within:opacity-50 transition-opacity" />
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg"
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
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg blur opacity-0 group-focus-within:opacity-50 transition-opacity" />
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg"
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
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-base rounded-lg shadow-lg shadow-orange-500/25 transition-all duration-300 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98]"
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
