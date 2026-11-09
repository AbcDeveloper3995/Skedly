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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass) && pass.length >= 10) score++;
    return score; // 0, 1, 2, or 3
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

    if (password.length < 8) {
      setErrorMsg("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    if (!agreeTerms) {
      setErrorMsg("Debes aceptar los términos del servicio y la política de privacidad.");
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
        // 4. Create initial membership as owner
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

      // 7. Check if session was granted or confirmation required
      if (authData.session) {
        router.push("/onboarding");
      } else {
        setSuccessMsg(
          "¡Cuenta creada con éxito! Hemos enviado un enlace de confirmación a tu correo para activar tu cuenta."
        );
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Registration error:", error);
      setErrorMsg(error.message || "Ocurrió un error al crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
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
      console.error("Google register error:", error);
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
              className="font-medium text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="text-primary font-bold transition-colors"
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
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Lado del Formulario (7 columnas) */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="w-full max-w-xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-xl border border-surface-container-high">
                {/* Encabezado del Formulario */}
                <div className="mb-6 sm:mb-8">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md text-white font-bold text-base">
                      SK
                    </div>
                    <span className="font-bold text-lg text-on-surface tracking-tight">Skedly</span>
                    <span className="ml-auto inline-flex items-center px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold">
                      Propietarios
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight mb-2">
                    Crea tu cuenta de propietario
                  </h1>
                  <p className="text-xs sm:text-sm text-on-surface-variant">
                    Comienza a organizar tu negocio y gestionar tus citas con Skedly.
                  </p>
                </div>

                {/* Mensajes de Alerta */}
                {errorMsg && (
                  <div className="mb-5 p-3.5 rounded-xl bg-error-container text-on-error-container text-xs sm:text-sm flex items-start gap-2 border border-error/20">
                    <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5 text-error">error</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="mb-5 p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs sm:text-sm flex items-start gap-2 border border-emerald-200">
                    <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5 text-emerald-600">check_circle</span>
                    <div>{successMsg}</div>
                  </div>
                )}

                {/* Botón de Registro Social con Google */}
                <button
                  type="button"
                  onClick={handleGoogleRegister}
                  disabled={googleLoading}
                  className="w-full h-11 px-4 bg-white hover:bg-surface-container-low text-on-surface border border-surface-container-high text-sm font-medium rounded-lg flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.99] shadow-xs mb-6 cursor-pointer disabled:opacity-50"
                >
                  <svg aria-hidden="true" className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  <span>{googleLoading ? "Conectando..." : "Registrarse con Google"}</span>
                </button>

                {/* Separador */}
                <div className="relative flex items-center justify-center mb-6">
                  <div className="w-full h-px bg-surface-container-high" />
                  <span className="absolute px-3 bg-white text-xs text-on-surface-variant uppercase tracking-wider font-medium">
                    O regístrate con tu correo
                  </span>
                </div>

                {/* Formulario de Registro */}
                <form className="space-y-4" onSubmit={handleRegister}>
                  {/* Campo Nombre Completo */}
                  <div>
                    <label className="block text-xs sm:text-sm text-on-surface mb-1.5 font-medium" htmlFor="fullName">
                      Nombre completo
                    </label>
                    <div className="relative">
                      <input
                        className="w-full h-11 px-4 bg-surface-container-low focus:bg-white text-on-surface placeholder:text-outline text-sm rounded-lg border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                        id="fullName"
                        name="fullName"
                        placeholder="Ej. Mateo Ramos"
                        required
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Campo Nombre del Negocio */}
                  <div>
                    <label className="block text-xs sm:text-sm text-on-surface mb-1.5 font-medium" htmlFor="businessName">
                      Nombre de tu negocio
                    </label>
                    <div className="relative">
                      <input
                        className="w-full h-11 px-4 bg-surface-container-low focus:bg-white text-on-surface placeholder:text-outline text-sm rounded-lg border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                        id="businessName"
                        name="businessName"
                        placeholder="Ej. Barbería Elite o Studio Aura"
                        required
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Campo Correo Electrónico */}
                  <div>
                    <label className="block text-xs sm:text-sm text-on-surface mb-1.5 font-medium" htmlFor="email">
                      Correo electrónico profesional
                    </label>
                    <div className="relative">
                      <input
                        className="w-full h-11 px-4 bg-surface-container-low focus:bg-white text-on-surface placeholder:text-outline text-sm rounded-lg border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
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
                  <div>
                    <label className="block text-xs sm:text-sm text-on-surface mb-1.5 font-medium" htmlFor="password">
                      Contraseña
                    </label>
                    <div className="relative flex items-center">
                      <input
                        className="w-full h-11 pl-4 pr-11 bg-surface-container-low focus:bg-white text-on-surface placeholder:text-outline text-sm rounded-lg border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                        id="password"
                        name="password"
                        placeholder="Mínimo 8 caracteres"
                        required
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        aria-label="Mostrar u ocultar contraseña"
                        className="absolute right-3 p-1 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>

                    {/* Indicador de Fortaleza */}
                    <div className="mt-2 space-y-1.5">
                      <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden flex gap-1">
                        <div
                          className={`h-full w-1/3 transition-colors duration-300 ${
                            strength >= 1 ? "bg-amber-500" : "bg-surface-container-highest"
                          }`}
                        />
                        <div
                          className={`h-full w-1/3 transition-colors duration-300 ${
                            strength >= 2 ? "bg-blue-500" : "bg-surface-container-highest"
                          }`}
                        />
                        <div
                          className={`h-full w-1/3 transition-colors duration-300 ${
                            strength >= 3 ? "bg-emerald-500" : "bg-surface-container-highest"
                          }`}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-on-surface-variant">
                          {password.length === 0
                            ? "Seguridad: Ingresa al menos 8 caracteres"
                            : strength === 1
                            ? "Seguridad: Débil"
                            : strength === 2
                            ? "Seguridad: Buena"
                            : "Seguridad: Fuerte"}
                        </span>
                        <span className="text-outline">Números o símbolos recomendados</span>
                      </div>
                    </div>
                  </div>

                  {/* Campo Confirmar Contraseña */}
                  <div>
                    <label className="block text-xs sm:text-sm text-on-surface mb-1.5 font-medium" htmlFor="confirmPassword">
                      Confirmar contraseña
                    </label>
                    <div className="relative flex items-center">
                      <input
                        className="w-full h-11 pl-4 pr-11 bg-surface-container-low focus:bg-white text-on-surface placeholder:text-outline text-sm rounded-lg border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="Repite tu contraseña"
                        required
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        aria-label="Mostrar u ocultar confirmación de contraseña"
                        className="absolute right-3 p-1 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showConfirmPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="mt-1 text-xs text-error font-medium">
                        Las contraseñas no coinciden.
                      </p>
                    )}
                  </div>

                  {/* Términos y Condiciones Checkbox */}
                  <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        className="mt-1 w-4 h-4 rounded bg-surface-container-low text-primary accent-primary cursor-pointer transition-all"
                        id="termsCheckbox"
                        required
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                      />
                      <span className="text-xs text-on-surface-variant select-none leading-relaxed">
                        Acepto los{" "}
                        <Link className="text-primary hover:underline font-medium" href="#">
                          Términos del Servicio
                        </Link>{" "}
                        y la{" "}
                        <Link className="text-primary hover:underline font-medium" href="#">
                          Política de Privacidad
                        </Link>{" "}
                        de Skedly.
                      </span>
                    </label>
                  </div>

                  {/* Botón Principal */}
                  <div className="pt-2">
                    <button
                      className="w-full h-12 bg-primary hover:bg-primary-container text-on-primary text-sm font-semibold rounded-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99] cursor-pointer disabled:opacity-60"
                      type="submit"
                      disabled={loading}
                    >
                      <span>{loading ? "Creando tu cuenta..." : "Crear mi cuenta"}</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>

                  {/* Nota de Valor Sin Fricción */}
                  <div className="p-3 bg-surface-container-low rounded-lg flex items-center justify-center text-center border border-surface-container-high/60">
                    <p className="text-[11px] text-on-surface-variant font-medium">
                      ✨ Prueba gratuita de 14 días • Sin tarjeta de crédito requerida • Listo en minutos
                    </p>
                  </div>

                  {/* Link Iniciar Sesión */}
                  <div className="text-center pt-2">
                    <p className="text-xs sm:text-sm text-on-surface-variant">
                      ¿Ya tienes una cuenta?
                      <Link className="text-primary font-semibold hover:underline ml-1" href="/login">
                        Iniciar sesión
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>

            {/* Panel Lateral de Soporte de Marca (5 columnas) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Tarjeta Principal de Beneficios */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-surface-container-high relative overflow-hidden">
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold mb-4">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>Plataforma Todo en Uno</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight mb-3">
                    Todo lo que necesitas para tu negocio en una sola cuenta
                  </h2>
                  <p className="text-xs sm:text-sm text-on-surface-variant mb-6 leading-relaxed">
                    Digitaliza tu agenda en minutos. Skedly elimina las llamadas innecesarias y reduce el ausentismo con confirmaciones automáticas.
                  </p>

                  {/* Lista de Viñetas Destacadas */}
                  <div className="space-y-5">
                    {/* Viñeta 1 */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-low text-primary flex items-center justify-center shrink-0 shadow-xs border border-surface-container-high">
                        <span className="material-symbols-outlined text-[20px]">schedule</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-on-surface">
                          Control de citas en tiempo real
                        </h3>
                        <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                          Sincronización instantánea en tu móvil y ordenador para evitar duplicidades de reservas.
                        </p>
                      </div>
                    </div>

                    {/* Viñeta 2 */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-low text-primary flex items-center justify-center shrink-0 shadow-xs border border-surface-container-high">
                        <span className="material-symbols-outlined text-[20px]">public</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-on-surface">
                          Página web pública de reservas
                        </h3>
                        <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                          Un portal personalizado y elegante con tu enlace propio listo para compartir en Instagram o WhatsApp sin coste adicional.
                        </p>
                      </div>
                    </div>

                    {/* Viñeta 3 */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-low text-primary flex items-center justify-center shrink-0 shadow-xs border border-surface-container-high">
                        <span className="material-symbols-outlined text-[20px]">group</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-on-surface">
                          Multi-profesional y horarios flexibles
                        </h3>
                        <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                          Gestiona agendas individuales para tu equipo, descansos personalizados y bloqueos por vacaciones.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Métrica / Prueba Social Compacta */}
              <div className="bg-white p-5 rounded-2xl flex items-center gap-4 shadow-sm border border-surface-container-high">
                <div className="flex -space-x-3 overflow-hidden shrink-0">
                  <div className="inline-block h-10 w-10 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center ring-2 ring-white">
                    MR
                  </div>
                  <div className="inline-block h-10 w-10 rounded-full bg-secondary text-white text-xs font-bold flex items-center justify-center ring-2 ring-white">
                    SG
                  </div>
                  <div className="inline-block h-10 w-10 rounded-full bg-tertiary text-white text-xs font-bold flex items-center justify-center ring-2 ring-white">
                    DL
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-500">
                    <span className="material-symbols-outlined text-[16px]">star</span>
                    <span className="material-symbols-outlined text-[16px]">star</span>
                    <span className="material-symbols-outlined text-[16px]">star</span>
                    <span className="material-symbols-outlined text-[16px]">star</span>
                    <span className="material-symbols-outlined text-[16px]">star</span>
                    <span className="text-xs font-bold text-on-surface ml-1">4.9/5</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Más de <strong className="text-on-surface">3,400 profesionales</strong> confían en Skedly cada mes.
                  </p>
                </div>
              </div>

              {/* Gráfico Visual de Reserva en Vivo */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-surface-container-high">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-on-surface flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                    Demostración de agenda activa
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-semibold">
                    Hoy
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low border border-surface-container-high/60">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-on-surface">10:00 AM</span>
                      <span className="text-xs text-on-surface-variant">Cita confirmada (45 min)</span>
                    </div>
                    <span className="text-[11px] text-primary font-semibold">Agendada</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container border border-surface-container-high/60">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-on-surface">11:30 AM</span>
                      <span className="text-xs text-on-surface-variant">Espacio libre disponible</span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant font-medium">Reservable</span>
                  </div>
                </div>
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
