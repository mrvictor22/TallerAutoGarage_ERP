'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Wrench, Gauge, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useWorkshopConfig } from '@/contexts/workshop-config';

interface ForgotPasswordFormProps {
  primaryColor?: string;
  secondaryColor?: string;
  onNotification?: (notification: { title: string; description: string; type: 'success' | 'error' } | null) => void;
}

export function ForgotPasswordForm({
  primaryColor = '#f97316',
  secondaryColor = '#ef4444',
  onNotification
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { resetPasswordForEmail } = useAuthStore();
  const { config } = useWorkshopConfig();
  const workshopName = config?.name || 'Taller Pro';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const result = await resetPasswordForEmail(email);

      if (result.success) {
        setSuccess(true);
        setEmail('');
        if (onNotification) {
          onNotification({
            title: 'Correo Enviado',
            description: 'Hemos enviado un enlace de recuperación a tu correo',
            type: 'success'
          });
        }
      } else {
        setError(result.error || 'Error al enviar el correo de recuperación');
      }
    } catch {
      setError('Error de conexión. Por favor intenta de nuevo.');
    }

    setIsLoading(false);
  };

  const gradientStyle = {
    background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
  };

  const glowGradientStyle = {
    background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor}, ${primaryColor})`
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto">
        {/* Glass Card - Success State */}
        <div className="relative">
          {/* Glow Effect */}
          <div
            className="absolute -inset-1 rounded-2xl blur-lg opacity-75 animate-pulse"
            style={glowGradientStyle}
          />

          <div className="relative bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            {/* Success Icon */}
            <div className="text-center mb-6">
              <div
                className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, #10b981 0%, #059669 100%)`,
                  boxShadow: '0 10px 25px -5px #10b98180'
                }}
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Correo Enviado
              </h2>
              <p className="text-gray-400 text-sm">
                Hemos enviado un enlace de recuperación a tu correo electrónico
              </p>
            </div>

            {/* Success Message */}
            <Alert className="bg-green-500/10 border-green-500/50 text-green-400 mb-6">
              <AlertDescription className="text-center">
                Por favor revisa tu bandeja de entrada y haz clic en el enlace para restablecer tu contraseña.
              </AlertDescription>
            </Alert>

            {/* Back to Login Button */}
            <Link href="/es/login" className="block">
              <Button
                type="button"
                className="w-full h-12 text-white font-bold text-base rounded-lg shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                  boxShadow: `0 10px 25px -5px ${primaryColor}40`
                }}
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Volver al Inicio de Sesión
              </Button>
            </Link>

            {/* Footer Note */}
            <p className="mt-6 text-xs text-center text-gray-500">
              Si no recibes el correo en unos minutos, revisa tu carpeta de spam.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
              Recuperación de Contraseña
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

          {/* Instructions */}
          <div className="mb-6 text-center">
            <p className="text-gray-300 text-sm">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
                    autoComplete="email"
                  />
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/50 text-red-400">
                <AlertDescription>{error}</AlertDescription>
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
                  <Mail className="mr-2 h-5 w-5" />
                  Enviar Enlace de Recuperación
                </>
              )}
            </Button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link
              href="/es/login"
              className="inline-flex items-center text-sm font-medium transition-colors hover:text-white"
              style={{ color: primaryColor }}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver al Inicio de Sesión
            </Link>
          </div>

          {/* Footer */}
          <p className="mt-6 text-xs text-center text-gray-500">
            ¿No tienes una cuenta?{' '}
            <Link
              href="/es/login"
              className="font-medium transition-colors hover:text-white"
              style={{ color: primaryColor }}
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
