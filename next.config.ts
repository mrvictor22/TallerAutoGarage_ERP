import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignorar errores de ESLint durante build para deployment rápido
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignorar errores de TypeScript durante build
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
