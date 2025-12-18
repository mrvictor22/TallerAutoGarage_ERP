import type { Metadata } from "next";
import { Providers } from '@/lib/providers';
import "./globals.css";

export const metadata: Metadata = {
  title: "Taller Pro - Sistema de Gestión Automotriz",
  description: "Sistema completo de gestión para talleres automotrices",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
