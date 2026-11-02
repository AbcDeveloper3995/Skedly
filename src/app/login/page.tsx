"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setForgotSuccess(null);

    if (!email.trim()) {
      setErrorMsg("Ingresa tu correo electrónico para enviar el enlace de recuperación.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login?reset=true`,
      });

      if (error) throw error;

      setForgotSuccess(
        "Se ha enviado un enlace de restablecimiento a tu correo electrónico. Por favor verifica tu bandeja."
      );
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Error al solicitar restablecimiento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex flex-col justify-between antialiased">
      <div className="flex-1 flex flex-col lg:flex-row w-full min-h-screen">
        {/* LEFT SIDE: Brand & Dashboard Preview Panel (~45%) */}
        <div className="w-full lg:w-[45%] bg-[#111827] p-8 lg:p-14 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Glows */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#4F6DF5]/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Top: Brand Logo */}
          <div className="relative z-10">
            <Link href="/" className="flex items-center space-x-3 mb-10 w-fit">
              <div className="w-10 h-10 rounded-xl bg-[#4F6DF5] flex items-center justify-center shadow-lg shadow-[#4F6DF5]/30">
                <svg
                  className="w-6 h-6 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="3" ry="3"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                  <path d="m9 16 2 2 4-4"></path>
                </svg>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">
                SKEDLY
              </span>
            </Link>

            {/* Headline */}
            <div className="max-w-md">
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white mb-4 leading-tight">
                El control de tu agenda, en un solo lugar.
              </h1>
              <p className="text-slate-400 text-sm lg:text-base leading-relaxed">
                Accede a tu panel para gestionar tus citas de hoy, coordinar a
                tu equipo y atender a tus clientes con la máxima precisión.
              </p>
            </div>
          </div>

          {/* Middle: Rich Glass Card UI Mockup */}
          <div className="relative z-10 my-8">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-[#4F6DF5] flex items-center justify-center font-bold text-xs text-white">
                    BA
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">
                      Barbería Alpha
                    </p>
                    <p className="text-[11px] text-slate-400">Panel en vivo</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Operando
                </span>
              </div>

              {/* Quick stats strip */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[11px] text-slate-400">Citas programadas</p>
                  <p className="text-lg font-bold text-white mt-0.5">24 hoy</p>
                  <span className="text-[10px] text-emerald-400">
                    +14% vs ayer
                  </span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[11px] text-slate-400">Ocupación equipo</p>
                  <p className="text-lg font-bold text-white mt-0.5">92%</p>
                  <span className="text-[10px] text-[#4F6DF5]">4 barberos</span>
                </div>
              </div>

              {/* Sample appointment */}
              <div className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg border border-white/5">
                <div className="flex items-center space-x-2.5">
                  <div className="w-1.5 h-7 rounded-full bg-[#4F6DF5]"></div>
                  <div>
                    <p className="text-xs font-medium text-white">
                      Alejandro Torres
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Corte + Barba · 11:30 AM
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Confirmada
                </span>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="relative z-10 pt-4 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
            <span>© 2026 SKEDLY SaaS</span>
            <span>Seguridad SSL 256-bit</span>
          </div>
        </div>

        {/* RIGHT SIDE: Auth Form (~55%) */}
        <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 lg:p-16">
          <div className="w-full max-w-md">
            {activeTab === "login" ? (
              <>
                {/* Header */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Bienvenido de nuevo
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Ingresa tus credenciales para acceder a tu panel.
                  </p>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
                    <span className="material-symbols-outlined text-red-500 shrink-0 text-xl">
                      error
                    </span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Correo Electrónico
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nombre@negocio.com"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#4F6DF5]/20 focus:border-[#4F6DF5] text-sm text-slate-800 bg-white placeholder-slate-400"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="password"
                        className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                      >
                        Contraseña
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg(null);
                          setActiveTab("forgot");
                        }}
                        className="text-xs text-[#4F6DF5] hover:text-[#3D5AE8] hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#4F6DF5]/20 focus:border-[#4F6DF5] text-sm text-slate-800 bg-white placeholder-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-2">
                      <input
                        id="rememberMe"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-[#4F6DF5] focus:ring-[#4F6DF5]"
                      />
                      <label
                        htmlFor="rememberMe"
                        className="text-xs text-slate-600 cursor-pointer"
                      >
                        Recordar mi sesión
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 bg-[#4F6DF5] hover:bg-[#3D5AE8] disabled:opacity-60 text-white font-semibold text-sm rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Verificando credenciales...</span>
                      </>
                    ) : (
                      <span>Iniciar Sesión</span>
                    )}
                  </button>
                </form>

                {/* Footer switcher */}
                <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                  <p className="text-xs text-slate-500">
                    ¿Todavía no tienes una cuenta de negocio?{" "}
                    <Link
                      href="/register"
                      className="font-semibold text-[#4F6DF5] hover:text-[#3D5AE8] hover:underline"
                    >
                      Comenzar gratis
                    </Link>
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Recuperar Contraseña Tab */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Recuperar contraseña
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Introduce el correo con el que te registraste y te enviaremos
                    un enlace seguro para restablecer tu clave.
                  </p>
                </div>

                {errorMsg && (
                  <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
                    <span className="material-symbols-outlined text-red-500 shrink-0 text-xl">
                      error
                    </span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {forgotSuccess ? (
                  <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="material-symbols-outlined text-emerald-600 text-xl">
                        mark_email_read
                      </span>
                      <span>Enlace enviado</span>
                    </div>
                    <p className="text-xs leading-relaxed">{forgotSuccess}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("login");
                        setForgotSuccess(null);
                      }}
                      className="mt-3 text-xs font-semibold text-emerald-700 underline text-left hover:text-emerald-900"
                    >
                      ← Volver a Iniciar Sesión
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label
                        htmlFor="recovery-email"
                        className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                      >
                        Correo Electrónico
                      </label>
                      <input
                        id="recovery-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nombre@negocio.com"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#4F6DF5]/20 focus:border-[#4F6DF5] text-sm text-slate-800 bg-white placeholder-slate-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 py-3 bg-[#4F6DF5] hover:bg-[#3D5AE8] disabled:opacity-60 text-white font-semibold text-sm rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Enviando enlace...</span>
                        </>
                      ) : (
                        <span>Enviar enlace de recuperación</span>
                      )}
                    </button>

                    <div className="pt-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg(null);
                          setActiveTab("login");
                        }}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                      >
                        ← Volver a Iniciar Sesión
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
