import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/supabase/auth-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SKEDLY | Tu negocio. Tu marca. Todas tus reservas en un solo lugar.",
  description:
    "La plataforma de gestión de citas y reservas para barberías, salones, clínicas y negocios de servicios.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} scroll-smooth`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-[#f8f9ff]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
