'use client';

import Link from 'next/link';
import { Car, Zap, Gauge, Wrench, ArrowRight, Loader2 } from 'lucide-react';
import { useWorkshopConfig } from '@/contexts/workshop-config';

export default function RootPage() {
  const { config, isLoading } = useWorkshopConfig();
  const workshopName = config?.name || 'Taller Pro';

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Animated Gradient Orbs */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-0 -right-40 w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-40 left-20 w-96 h-96 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      {/* Racing Stripes */}
      <div className="absolute inset-0 overflow-hidden opacity-5">
        <div className="absolute top-0 left-1/4 w-2 h-full bg-gradient-to-b from-transparent via-orange-500 to-transparent transform -skew-x-12" />
        <div className="absolute top-0 right-1/4 w-2 h-full bg-gradient-to-b from-transparent via-red-500 to-transparent transform -skew-x-12" />
      </div>

      {/* Tire Track Pattern */}
      <div className="absolute bottom-0 left-0 right-0 h-40 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <pattern id="tire-track" x="0" y="0" width="100" height="20" patternUnits="userSpaceOnUse">
            <rect x="0" y="8" width="30" height="4" fill="currentColor" className="text-orange-500" />
            <rect x="35" y="8" width="15" height="4" fill="currentColor" className="text-orange-500" />
            <rect x="55" y="8" width="15" height="4" fill="currentColor" className="text-orange-500" />
            <rect x="75" y="8" width="20" height="4" fill="currentColor" className="text-orange-500" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#tire-track)" />
        </svg>
      </div>

      {/* Radial Gradient Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-12">
        <div className="text-center space-y-8">
          {/* Hero Section */}
          <div className="space-y-6">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-red-600 mb-6 shadow-2xl shadow-orange-500/50 animate-pulse-slow">
              <Wrench className="w-12 h-12 text-white" />
            </div>

            {/* Main Title */}
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight">
              {isLoading ? (
                <Loader2 className="w-12 h-12 animate-spin mx-auto" />
              ) : (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-500 to-red-500">
                  {workshopName.toUpperCase()}
                </span>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-400 font-medium">
              Sistema de Gestión Automotriz de Alto Rendimiento
            </p>

            {/* Decorative Line */}
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="h-px w-20 bg-gradient-to-r from-transparent to-orange-500" />
              <Gauge className="w-6 h-6 text-orange-500 animate-spin-slow" />
              <div className="h-px w-20 bg-gradient-to-l from-transparent to-orange-500" />
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-300" />
              <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 space-y-3">
                <Car className="w-8 h-8 text-orange-500 mx-auto" />
                <h3 className="text-white font-bold text-lg">Gestión de Vehículos</h3>
                <p className="text-gray-400 text-sm">Control completo del inventario automotriz</p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-300" />
              <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 space-y-3">
                <Wrench className="w-8 h-8 text-orange-500 mx-auto" />
                <h3 className="text-white font-bold text-lg">Órdenes de Trabajo</h3>
                <p className="text-gray-400 text-sm">Seguimiento en tiempo real de reparaciones</p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-300" />
              <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 space-y-3">
                <Zap className="w-8 h-8 text-orange-500 mx-auto" />
                <h3 className="text-white font-bold text-lg">Rendimiento Máximo</h3>
                <p className="text-gray-400 text-sm">Optimiza la eficiencia de tu taller</p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-8">
            <div className="relative inline-block group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse" />
              <Link
                href="/login"
                className="relative inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-lg px-10 py-4 rounded-xl shadow-2xl transition-all duration-300 group-hover:scale-105 active:scale-95"
              >
                <Zap className="w-6 h-6" />
                Iniciar Sesión
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Footer Info */}
          <div className="pt-8 space-y-3">
            <p className="text-gray-500 text-sm">
              Plataforma profesional para talleres automotrices modernos
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Sistema en línea</span>
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

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
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

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
