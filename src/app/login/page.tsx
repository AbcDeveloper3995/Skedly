"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg("Por favor ingresa tu correo y contraseña.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Credenciales inválidas. Revisa tu correo y contraseña.");
        }
        if (error.message.includes("Email not confirmed")) {
          throw new Error("Por favor confirma tu correo electrónico antes de ingresar.");
        }
        throw error;
      }

      if (data.session) {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Login error:", error);
      setErrorMsg(error.message || "Ocurrió un error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Google login error:", error);
      setErrorMsg(error.message || "Error al conectar con Google.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="bg-surface font-sans text-on-surface min-h-screen flex flex-col selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* HEADER NAVEGACIÓN SUPERIOR */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-surface-container-high shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm font-bold text-sm tracking-wider">
              SK
            </div>
            <span className="font-bold text-lg text-on-surface tracking-tight">Skedly</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href="/login"
              className="text-primary font-bold transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="font-medium text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Crear cuenta
            </Link>
            <Link
              href="/forgot-password"
              className="font-medium text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Recuperar contraseña
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Volver al inicio</span>
            </Link>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="w-full pt-16 bg-surface flex-1 flex flex-col justify-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex items-center justify-center">
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 rounded-3xl bg-white shadow-xl border border-surface-container-high overflow-hidden min-h-[640px]">
            {/* Columna Izquierda: Formulario de inicio de sesión */}
            <div className="lg:col-span-6 xl:col-span-7 p-6 sm:p-10 lg:p-14 flex flex-col justify-between">
              <div className="w-full max-w-md mx-auto">
                {/* Identidad de Marca */}
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md text-white font-bold text-base">
                    SK
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-lg text-on-surface tracking-tight leading-none">Skedly</span>
                    <span className="text-xs text-on-surface-variant font-medium mt-0.5">Control de agenda pro</span>
                  </div>
                </div>

                {/* Titulares */}
                <div className="space-y-1.5 mb-6 sm:mb-8">
                  <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">Bienvenido de nuevo</h1>
                  <p className="text-sm text-on-surface-variant">Accede a tu cuenta y mantén tu negocio organizado.</p>
                </div>

                {/* Mensaje de Error */}
                {errorMsg && (
                  <div className="mb-5 p-3.5 rounded-xl bg-error-container text-on-error-container text-xs sm:text-sm flex items-start gap-2 border border-error/20">
                    <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5 text-error">error</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Botón Social Google */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="w-full h-11 px-4 rounded-lg bg-white border border-surface-container-high shadow-xs hover:bg-surface-container-low transition-all duration-200 flex items-center justify-center gap-3 text-sm text-on-surface font-medium cursor-pointer disabled:opacity-50"
                >
                  <svg aria-hidden="true" className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" fill="#4285F4" />
                    <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z" fill="#34A853" />
                    <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15Z" fill="#FBBC05" />
                    <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" fill="#EA4335" />
                  </svg>
                  <span>{googleLoading ? "Conectando..." : "Continuar con Google"}</span>
                </button>

                {/* Separador */}
                <div className="relative my-6 flex items-center justify-center">
                  <div className="w-full h-px bg-surface-container-high" />
                  <span className="absolute bg-white px-3 text-xs uppercase text-on-surface-variant font-medium tracking-wider">
                    o con tu correo
                  </span>
                </div>

                {/* Formulario Principal */}
                <form className="space-y-4" onSubmit={handleLogin}>
                  {/* Campo Correo */}
                  <div className="space-y-1.5">
                    <label className="block text-xs sm:text-sm font-medium text-on-surface" htmlFor="email">
                      Correo electrónico
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant pointer-events-none text-[20px]">
                        mail
                      </span>
                      <input
                        className="w-full h-11 pl-11 pr-4 rounded-lg bg-white border border-surface-container-high text-sm text-on-surface placeholder:text-outline shadow-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        id="email"
                        name="email"
                        placeholder="tu@negocio.com"
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Campo Contraseña */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs sm:text-sm font-medium text-on-surface" htmlFor="password">
                        Contraseña
                      </label>
                      <Link
                        className="text-xs font-semibold text-primary hover:underline transition-colors"
                        href="/forgot-password"
                      >
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant pointer-events-none text-[20px]">
                        lock
                      </span>
                      <input
                        className="w-full h-11 pl-11 pr-11 rounded-lg bg-white border border-surface-container-high text-sm text-on-surface placeholder:text-outline shadow-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        id="password"
                        name="password"
                        placeholder="••••••••••••"
                        required
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        aria-label="Mostrar u ocultar contraseña"
                        className="absolute right-3 p-1 rounded-md text-on-surface-variant hover:text-on-surface transition-colors focus:outline-none cursor-pointer"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Recordar Sesión */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        className="w-4 h-4 rounded text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                        id="remember"
                        name="remember"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span className="text-xs sm:text-sm text-on-surface-variant">
                        Recordar mi sesión en este dispositivo
                      </span>
                    </label>
                  </div>

                  {/* Botón Submit */}
                  <button
                    className="w-full h-11 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
                    type="submit"
                    disabled={loading}
                  >
                    <span>{loading ? "Accediendo..." : "Iniciar sesión"}</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </form>

                {/* Pie del Formulario */}
                <div className="mt-8 text-center space-y-3">
                  <p className="text-xs sm:text-sm text-on-surface-variant">
                    ¿Todavía no tienes una cuenta?
                    <Link className="font-semibold text-primary hover:underline ml-1" href="/register">
                      Crear cuenta
                    </Link>
                  </p>
                  <p className="text-[11px] text-on-surface-variant/80 leading-relaxed">
                    Al continuar, aceptas nuestros{" "}
                    <Link className="underline hover:text-on-surface" href="#">
                      Términos de servicio
                    </Link>{" "}
                    y{" "}
                    <Link className="underline hover:text-on-surface" href="#">
                      Política de privacidad
                    </Link>
                    .
                  </p>
                </div>
              </div>

              {/* Micro-indicador de estado en esquina inferior */}
              <div className="w-full max-w-md mx-auto pt-6 flex items-center justify-between text-on-surface-variant text-[11px] border-t border-surface-container-high/60 mt-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Sistemas operativos en línea</span>
                </div>
                <span>Cifrado SSL de 256 bits</span>
              </div>
            </div>

            {/* Columna Derecha: Panel de Soporte Visual / Showcase de Marca */}
            <div className="lg:col-span-6 xl:col-span-5 bg-surface-container-low p-6 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden border-t lg:border-t-0 lg:border-l border-surface-container-high">
              {/* Elemento decorativo atmosférico */}
              <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary-fixed filter blur-3xl opacity-60 pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-secondary-container filter blur-3xl opacity-50 pointer-events-none" />

              <div className="relative z-10">
                {/* Tag de Estado en vivo */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-xs mb-6 border border-surface-container-high">
                  <span className="material-symbols-outlined text-primary text-[16px]">sync</span>
                  <span className="text-xs text-on-surface font-semibold">Sincronización en tiempo real activa</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight mb-3">
                  La plataforma de gestión para profesionales de alto rendimiento.
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  Automatiza recordatorios, reduce inasistencias y mantén el control financiero de tus citas en una sola vista.
                </p>
              </div>

              {/* Tarjeta de Demostración Interactiva / Preview de Agenda */}
              <div className="relative z-10 my-8 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface">Agenda de Hoy</span>
                    <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-primary text-[11px] font-semibold">
                      4 Citas
                    </span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant">Miércoles, 24 Mayo</span>
                </div>

                {/* Cita 1: Confirmada */}
                <div className="p-3.5 rounded-2xl bg-white shadow-xs border border-surface-container-high/60 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">DR</span>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-on-surface leading-snug">Dr. Rafael Méndez</p>
                      <p className="text-[11px] text-on-surface-variant">Consulta Integral • 09:30 AM</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold flex items-center gap-1 border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Confirmada
                  </span>
                </div>

                {/* Cita 2: En curso */}
                <div className="p-3.5 rounded-2xl bg-white shadow-xs border border-surface-container-high/60 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-secondary">CL</span>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-on-surface leading-snug">Clara Lozano &amp; Asoc.</p>
                      <p className="text-[11px] text-on-surface-variant">Revisión Fiscal • 11:00 AM</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-primary text-[11px] font-semibold flex items-center gap-1 border border-blue-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    En curso
                  </span>
                </div>

                {/* Cita 3: WhatsApp OK */}
                <div className="p-3.5 rounded-2xl bg-white shadow-xs border border-surface-container-high/60 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-tertiary">MA</span>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-on-surface leading-snug">Marco Antonio Silva</p>
                      <p className="text-[11px] text-on-surface-variant">Sesión Estratégica • 02:15 PM</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold flex items-center gap-1 border border-amber-100">
                    <span className="material-symbols-outlined text-[13px]">schedule</span>
                    WhatsApp OK
                  </span>
                </div>
              </div>

              {/* Métrica de Confianza y Testimonio Compacto */}
              <div className="relative z-10 rounded-2xl bg-white border border-surface-container-high p-4 mt-auto shadow-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex -space-x-2 overflow-hidden">
                    <div className="inline-block h-7 w-7 rounded-full bg-primary text-on-primary text-[11px] flex items-center justify-center ring-2 ring-white font-semibold">
                      LM
                    </div>
                    <div className="inline-block h-7 w-7 rounded-full bg-tertiary text-on-tertiary text-[11px] flex items-center justify-center ring-2 ring-white font-semibold">
                      CR
                    </div>
                    <div className="inline-block h-7 w-7 rounded-full bg-secondary text-on-secondary text-[11px] flex items-center justify-center ring-2 ring-white font-semibold">
                      AT
                    </div>
                  </div>
                  <span className="text-xs font-bold text-on-surface">Red de +1,200 profesionales</span>
                </div>
                <p className="text-xs text-on-surface-variant italic leading-relaxed">
                  &ldquo;Skedly redujo nuestras citas olvidadas en un 42% desde el primer mes. Es simple, elegante e infalible.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-surface-container-low py-6 border-t border-surface-container-high">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-on-surface-variant">
            © 2025 Skedly SaaS. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6 text-xs text-on-surface-variant">
            <Link className="hover:text-primary transition-colors" href="#">
              Términos del Servicio
            </Link>
            <Link className="hover:text-primary transition-colors" href="#">
              Política de Privacidad
            </Link>
            <Link className="hover:text-primary transition-colors" href="#">
              Centro de Ayuda
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
