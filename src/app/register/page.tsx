"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim() || !businessName.trim() || !email.trim() || !password) {
      setErrorMsg("Por favor completa todos los campos requeridos.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (!agreeTerms) {
      setErrorMsg("Debes aceptar los términos y condiciones.");
      return;
    }

    setLoading(true);

    try {
      // 1. Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            name: fullName.trim(),
          },
        },
      });

      if (authError) throw authError;

      const user = authData.user;
      if (!user) {
        throw new Error("No se pudo crear la cuenta de usuario.");
      }

      // 2. Generate unique slug for business
      const baseSlug = generateSlug(businessName) || "mi-negocio";
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const uniqueSlug = `${baseSlug}-${randomSuffix}`;

      // 3. Create business record (RLS: created_by = auth.uid())
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .insert({
          name: businessName.trim(),
          slug: uniqueSlug,
          created_by: user.id,
          currency: "MXN",
          timezone: "America/Mexico_City",
          status: "active",
          is_published: false,
        })
        .select()
        .single();

      if (businessError) {
        console.warn("Error creating business, user registered:", businessError);
      } else if (businessData) {
        // 4. Create initial membership as owner (RLS: membership_insert_initial_owner)
        const { error: memberError } = await supabase
          .from("business_memberships")
          .insert({
            business_id: businessData.id,
            user_id: user.id,
            role: "owner",
          });

        if (memberError) {
          console.warn("Membership error:", memberError);
        }

        // 5. Create default location
        await supabase.from("locations").insert({
          business_id: businessData.id,
          name: "Sucursal Principal",
          country: "MX",
          is_active: true,
          is_default: true,
        });

        // 6. Create default website settings
        await supabase.from("website_settings").insert({
          business_id: businessData.id,
          headline: `Bienvenido a ${businessName.trim()}`,
          about_text: "Agenda tu cita con los mejores profesionales.",
          primary_color: "#2C4DD6",
          show_prices: true,
          show_employee_profiles: true,
          booking_enabled: true,
        });
      }

      // Check if session exists (auto-confirmed) or email confirmation is required
      if (authData.session) {
        router.push("/dashboard");
      } else {
        setSuccessMsg(
          "¡Cuenta creada con éxito! Hemos enviado un enlace de confirmación a tu correo electrónico. Por favor verifica tu bandeja."
        );
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Register error:", error);
      setErrorMsg(error.message || "Ocurrió un error al registrar la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex flex-col justify-between antialiased">
      <div className="flex-1 flex flex-col lg:flex-row w-full min-h-screen">
        {/* LEFT SIDE: Brand & Value Proposition Panel (~45%) */}
        <div className="w-full lg:w-[45%] bg-[#111827] p-8 lg:p-14 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Glows */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#4F6DF5]/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

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
                Lleva la gestión de tu negocio al siguiente nivel.
              </h1>
              <p className="text-slate-400 text-sm lg:text-base leading-relaxed">
                Únete a cientos de empresas de servicios que ya automatizan sus
                reservas, reducen cancelaciones y ahorran horas operativas cada
                semana.
              </p>
            </div>
          </div>

          {/* Middle: Feature Highlights */}
          <div className="relative z-10 my-8 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Página de reservas pública personalizada
                </p>
                <p className="text-xs text-slate-400">
                  Tus clientes reservan 24/7 sin llamadas ni mensajes manuales.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Sincronización de horarios de equipo
                </p>
                <p className="text-xs text-slate-400">
                  Asigna turnos, servicios y evita solapamientos con exclusion
                  GiST.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Directorio de clientes e historial
                </p>
                <p className="text-xs text-slate-400">
                  Toda la información de tus clientes en una base de datos segura
                  y privada.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom: Testimonial Quote */}
          <div className="relative z-10 pt-6 border-t border-slate-800">
            <p className="text-xs text-slate-400 italic mb-2">
              &quot;Configuramos la barbería en 10 minutos y al día siguiente ya
              teníamos 18 reservas automatizadas.&quot;
            </p>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                BA
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  Barbería Alpha
                </p>
                <p className="text-[11px] text-slate-500">
                  Cliente Skedly desde 2024
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Register Form (~55%) */}
        <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 lg:p-16">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Crea tu cuenta de negocio
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Comienza hoy tu prueba gratuita de 14 días. Sin tarjeta de
                crédito.
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
                <span className="material-symbols-outlined text-red-500 shrink-0 text-xl">
                  error
                </span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message Alert */}
            {successMsg && (
              <div className="mb-6 p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex flex-col gap-2">
                <div className="flex items-center gap-2 font-semibold">
                  <span className="material-symbols-outlined text-emerald-600 text-xl">
                    mark_email_read
                  </span>
                  <span>Verificación enviada</span>
                </div>
                <p className="text-xs leading-relaxed">{successMsg}</p>
                <Link
                  href="/login"
                  className="mt-2 text-xs font-semibold text-emerald-700 underline hover:text-emerald-900"
                >
                  Ir a Iniciar Sesión →
                </Link>
              </div>
            )}

            {/* Form */}
            {!successMsg && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Tu Nombre Completo
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Carlos Mendoza"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#4F6DF5]/20 focus:border-[#4F6DF5] text-sm text-slate-800 bg-white placeholder-slate-400"
                  />
                </div>

                <div>
                  <label
                    htmlFor="businessName"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Nombre del Negocio
                  </label>
                  <input
                    id="businessName"
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ej. Barbería Alpha"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#4F6DF5]/20 focus:border-[#4F6DF5] text-sm text-slate-800 bg-white placeholder-slate-400"
                  />
                </div>

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
                    placeholder="tunegocio@ejemplo.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#4F6DF5]/20 focus:border-[#4F6DF5] text-sm text-slate-800 bg-white placeholder-slate-400"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
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

                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="grid grid-cols-4 gap-1.5 h-1">
                        <div
                          className={`rounded-full ${
                            strength >= 1 ? "bg-red-500" : "bg-slate-200"
                          }`}
                        ></div>
                        <div
                          className={`rounded-full ${
                            strength >= 2 ? "bg-amber-500" : "bg-slate-200"
                          }`}
                        ></div>
                        <div
                          className={`rounded-full ${
                            strength >= 3 ? "bg-blue-500" : "bg-slate-200"
                          }`}
                        ></div>
                        <div
                          className={`rounded-full ${
                            strength >= 4 ? "bg-emerald-500" : "bg-slate-200"
                          }`}
                        ></div>
                      </div>
                      <p className="text-[11px] text-slate-500 text-right">
                        {strength <= 1 && "Seguridad baja"}
                        {strength === 2 && "Seguridad regular"}
                        {strength === 3 && "Seguridad buena"}
                        {strength >= 4 && "Seguridad fuerte"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Terms checkbox */}
                <div className="flex items-start space-x-2 pt-2">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#4F6DF5] focus:ring-[#4F6DF5]"
                  />
                  <label htmlFor="terms" className="text-xs text-slate-600">
                    Acepto los{" "}
                    <a href="#" className="text-[#4F6DF5] hover:underline">
                      Términos de servicio
                    </a>{" "}
                    y la{" "}
                    <a href="#" className="text-[#4F6DF5] hover:underline">
                      Política de privacidad
                    </a>{" "}
                    de Skedly.
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-3 bg-[#4F6DF5] hover:bg-[#3D5AE8] disabled:opacity-60 text-white font-semibold text-sm rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Creando tu cuenta...</span>
                    </>
                  ) : (
                    <span>Crear cuenta y comenzar</span>
                  )}
                </button>
              </form>
            )}

            {/* Footer switcher */}
            <div className="mt-8 pt-6 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-500">
                ¿Ya tienes una cuenta de negocio?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#4F6DF5] hover:text-[#3D5AE8] hover:underline"
                >
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
