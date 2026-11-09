"use client";

import React, { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg("Ingresa una dirección de correo válida.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/dashboard/configuracion`,
      });

      if (error) {
        throw error;
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Password reset error:", error);
      setErrorMsg(error.message || "Ocurrió un error al enviar el enlace.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendNotice(null);
    try {
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/dashboard/configuracion`,
      });
      setResendNotice("¡Enlace reenviado con éxito! Revisa tu bandeja de entrada.");
    } catch {
      setResendNotice("No se pudo reenviar. Inténtalo de nuevo en unos minutos.");
    } finally {
      setResending(false);
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
              className="font-medium text-on-surface-variant hover:text-on-surface transition-colors"
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
              className="text-primary font-bold transition-colors"
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
        <div className="relative w-full py-12 md:py-20 flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Ambient subtle background graphics */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-primary-fixed/40 via-surface-tint/5 to-transparent blur-3xl pointer-events-none rounded-full" />
          <div className="absolute top-1/3 -right-24 w-80 h-80 bg-secondary-container/30 blur-2xl pointer-events-none rounded-full" />
          <div className="absolute bottom-10 -left-20 w-80 h-80 bg-tertiary-fixed/30 blur-2xl pointer-events-none rounded-full" />

          <div className="w-full max-w-md relative z-10 flex flex-col gap-6">
            {/* Trust & Protocol Badge */}
            <div className="flex items-center justify-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white shadow-xs border border-surface-container-high text-secondary">
                <span className="material-symbols-outlined text-[15px] text-primary">lock</span>
                <span className="text-[11px] tracking-wider uppercase font-semibold">
                  Recuperación Segura SSL 256-bit
                </span>
              </div>
            </div>

            {/* Main Interactive Container Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-surface-container-high overflow-hidden p-6 sm:p-10 transition-all duration-300">
              {!submitted ? (
                /* STATE 1: Request Form */
                <div className="flex flex-col">
                  {/* Header Area */}
                  <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-secondary-container/60 text-primary flex items-center justify-center mb-5 shadow-xs border border-secondary-container">
                      <span className="material-symbols-outlined text-[28px]">lock_reset</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight mb-2">
                      Recupera tu contraseña
                    </h1>
                    <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm leading-relaxed">
                      Te enviaremos un enlace verificado para restablecer tu contraseña y retomar el control de tu agenda.
                    </p>
                  </div>

                  {/* Mensaje de Error */}
                  {errorMsg && (
                    <div className="mb-5 p-3.5 rounded-xl bg-error-container text-on-error-container text-xs sm:text-sm flex items-start gap-2 border border-error/20">
                      <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5 text-error">error</span>
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Form Element */}
                  <form className="flex flex-col gap-5" onSubmit={handleSendLink}>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs sm:text-sm text-on-surface font-medium" htmlFor="recovery-email">
                          Correo electrónico
                        </label>
                        <span className="text-[11px] text-secondary font-medium">Tu cuenta registrada</span>
                      </div>
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 material-symbols-outlined text-outline text-[20px] pointer-events-none">
                          mail
                        </span>
                        <input
                          autoComplete="email"
                          className="w-full h-11 pl-10 pr-4 rounded-lg bg-surface-container-low text-on-surface text-sm placeholder:text-outline border border-surface-container-high focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          id="recovery-email"
                          placeholder="tu@negocio.com"
                          required
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Submit Action */}
                    <button
                      className="w-full h-11 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-sm font-semibold shadow-sm transition-all duration-200 flex items-center justify-center gap-2 group active:scale-[0.99] cursor-pointer disabled:opacity-60"
                      type="submit"
                      disabled={loading}
                    >
                      <span>{loading ? "Enviando enlace..." : "Enviar enlace"}</span>
                      <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-0.5">
                        arrow_forward
                      </span>
                    </button>
                  </form>

                  {/* Back Navigation Link */}
                  <div className="mt-8 pt-6 border-t border-surface-container-high/60 flex items-center justify-center">
                    <Link
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-secondary hover:text-primary transition-colors group font-semibold"
                      href="/login"
                    >
                      <span className="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-1">
                        arrow_back
                      </span>
                      <span>Volver a iniciar sesión</span>
                    </Link>
                  </div>
                </div>
              ) : (
                /* STATE 2: Success Confirmation */
                <div className="flex flex-col items-center text-center">
                  {/* Verified Icon Stamp */}
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5 shadow-xs border border-emerald-200">
                    <span className="material-symbols-outlined text-[36px]">check_circle</span>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-3 border border-emerald-200">
                    Enviado con éxito
                  </span>

                  <h2 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight mb-2">
                    Correo de recuperación enviado
                  </h2>
                  <p className="text-xs sm:text-sm text-on-surface-variant mb-4 leading-relaxed">
                    Si existe una cuenta asociada a{" "}
                    <span className="font-semibold text-on-surface">{email}</span>, recibirás instrucciones para restablecer tu clave en unos momentos.
                  </p>

                  {/* Instructions Cardlet */}
                  <div className="w-full bg-surface-container-low rounded-xl p-4 mb-6 flex flex-col gap-2.5 text-left border border-surface-container-high/60">
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">schedule</span>
                      <p className="text-xs text-on-surface">
                        El enlace de seguridad caduca en <strong>15 minutos</strong> por motivos de protección.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-outline text-[20px] shrink-0 mt-0.5">mark_email_unread</span>
                      <p className="text-xs text-on-surface-variant">
                        ¿No lo visualizas? Recuerda revisar tu carpeta de correo no deseado o <strong>Spam</strong>.
                      </p>
                    </div>
                  </div>

                  {resendNotice && (
                    <div className="w-full p-2.5 mb-4 rounded-lg bg-blue-50 text-primary text-xs font-medium border border-blue-100">
                      {resendNotice}
                    </div>
                  )}

                  {/* Secondary Actions */}
                  <div className="w-full flex flex-col gap-2.5">
                    <button
                      className="w-full h-11 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-sm font-semibold border border-surface-container-high transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      onClick={handleResend}
                      type="button"
                      disabled={resending}
                    >
                      <span className="material-symbols-outlined text-[18px]">replay</span>
                      <span>{resending ? "Reenviando..." : "Reenviar enlace"}</span>
                    </button>
                    <Link
                      className="w-full h-11 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 shadow-xs"
                      href="/login"
                    >
                      <span>Ir a iniciar sesión</span>
                      <span className="material-symbols-outlined text-[18px]">login</span>
                    </Link>
                  </div>

                  {/* Edit mail trigger */}
                  <button
                    className="mt-6 text-xs text-secondary hover:text-primary transition-colors cursor-pointer font-medium"
                    onClick={() => {
                      setSubmitted(false);
                      setResendNotice(null);
                    }}
                    type="button"
                  >
                    ¿Ingresaste un correo equivocado? Corregir
                  </button>
                </div>
              )}
            </div>

            {/* Support & Help Footer Module */}
            <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-xs border border-surface-container-high">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-surface-container text-secondary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">contact_support</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-on-surface">¿Problemas de acceso?</span>
                  <span className="text-[11px] text-on-surface-variant">Nuestro equipo de soporte puede ayudarte</span>
                </div>
              </div>
              <a
                className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary text-xs font-semibold shadow-xs border border-surface-container-high transition-colors"
                href="mailto:soporte@skedly.com"
              >
                Contactar
              </a>
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

