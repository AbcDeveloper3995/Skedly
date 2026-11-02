import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      {/* HEADER / NAVIGATION */}
      <header className="fixed top-0 w-full z-50 bg-[#f8f9ff]/85 backdrop-blur-xl border-b border-[#c6c6cd]/30 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-sm">
              SK
            </div>
            <span className="font-semibold text-lg text-[#0b1c30] tracking-tight">
              SKEDLY
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#inicio"
              className="text-[#2c4dd6] font-semibold text-sm transition-colors"
            >
              Inicio
            </a>
            <a
              href="#funcionalidades"
              className="text-[#45464c] hover:text-[#0b1c30] font-medium text-sm transition-colors"
            >
              Funcionalidades
            </a>
            <a
              href="#experiencia"
              className="text-[#45464c] hover:text-[#0b1c30] font-medium text-sm transition-colors"
            >
              Experiencia
            </a>
            <a
              href="#sectores"
              className="text-[#45464c] hover:text-[#0b1c30] font-medium text-sm transition-colors"
            >
              Sectores
            </a>
            <a
              href="#personalizacion"
              className="text-[#45464c] hover:text-[#0b1c30] font-medium text-sm transition-colors"
            >
              Personalización
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-[#45464c] hover:text-[#0b1c30] transition-colors rounded-lg"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-[#2c4dd6] text-white text-sm font-medium rounded-lg shadow-sm hover:bg-[#4a68f0] transition-all"
            >
              Comenzar gratis
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="w-full pt-16">
        {/* 1. HERO SECTION */}
        <section
          id="inicio"
          className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column Content */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 w-fit">
                <span className="text-xs uppercase tracking-wider text-[#2c4dd6] font-semibold bg-[#dee1ff]/70 px-3 py-1 rounded-full">
                  LA PLATAFORMA DE RESERVAS PARA TU NEGOCIO
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-bold text-[#0b1c30] tracking-tight leading-tight">
                Tu negocio. Tu marca.{" "}
                <span className="text-[#2c4dd6]">Todas tus reservas</span> en un
                solo lugar.
              </h1>
              <p className="text-lg text-[#45464c] max-w-xl leading-relaxed">
                Gestiona tus citas, clientes y equipo desde un solo lugar. Crea
                tu propia página de reservas y ofrece a tus clientes una
                experiencia sencilla y profesional.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/register"
                  className="px-6 py-3 bg-[#2c4dd6] text-white font-medium rounded-lg shadow-sm hover:bg-[#4a68f0] transition-all flex items-center gap-2"
                >
                  <span>Comenzar gratis</span>
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_forward
                  </span>
                </Link>
                <a
                  href="#funcionalidades"
                  className="px-6 py-3 bg-white text-[#0b1c30] font-medium rounded-lg border border-[#c6c6cd]/50 shadow-sm hover:bg-[#eff4ff] transition-all"
                >
                  Conocer la plataforma
                </a>
              </div>
              <div className="flex items-center gap-2 text-[#45464c] text-sm pt-1">
                <span
                  className="material-symbols-outlined text-[#2c4dd6] text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
                <span>Fácil de configurar · Diseñado para crecer contigo</span>
              </div>
            </div>

            {/* Right Column: Rich Product UI Mockup */}
            <div className="lg:col-span-6 relative">
              <div className="relative bg-white rounded-2xl shadow-2xl border border-[#dce9ff] p-5 lg:p-6 overflow-hidden">
                {/* Mockup Topbar */}
                <div className="flex items-center justify-between pb-3 mb-4 bg-[#eff4ff]/60 -m-5 lg:-m-6 p-4 px-5 lg:px-6 border-b border-[#dce9ff]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#213145] flex items-center justify-center text-[#eaf1ff] font-semibold text-xs shadow-inner">
                      BA
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0b1c30] leading-tight">
                        Barbería Alpha
                      </p>
                      <p className="text-[11px] text-[#45464c]">
                        Sucursal Central
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#7ffc97] text-[#002109]">
                      <span className="w-2 h-2 rounded-full bg-[#009842] animate-pulse"></span>
                      Abierto
                    </span>
                    <span className="material-symbols-outlined text-[#76777d] text-[20px] p-1 rounded-md hover:bg-white/80 cursor-pointer">
                      notifications
                    </span>
                  </div>
                </div>

                {/* Mini KPI Strip */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3.5 bg-[#eff4ff] rounded-xl border border-[#dce9ff]/60">
                    <p className="text-[11px] text-[#45464c] uppercase font-semibold">
                      Ingresos Hoy
                    </p>
                    <p className="text-xl font-bold text-[#0b1c30] mt-0.5">
                      $28,450
                    </p>
                    <div className="flex items-center gap-1 text-xs text-[#009842] font-semibold mt-1">
                      <span className="material-symbols-outlined text-[14px]">
                        trending_up
                      </span>
                      <span>+14.2% vs ayer</span>
                    </div>
                  </div>
                  <div className="p-3.5 bg-[#eff4ff] rounded-xl border border-[#dce9ff]/60">
                    <p className="text-[11px] text-[#45464c] uppercase font-semibold">
                      Citas del Día
                    </p>
                    <p className="text-xl font-bold text-[#0b1c30] mt-0.5">
                      24 citas
                    </p>
                    <div className="flex items-center gap-1 text-xs text-[#2c4dd6] font-semibold mt-1">
                      <span className="material-symbols-outlined text-[14px]">
                        schedule
                      </span>
                      <span>92% ocupación</span>
                    </div>
                  </div>
                </div>

                {/* SVG Sparkline Trend */}
                <div className="p-3.5 bg-[#eff4ff] rounded-xl border border-[#dce9ff]/60 mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#45464c] font-medium">
                      Flujo semanal de reservas
                    </span>
                    <span className="text-xs text-[#2c4dd6] font-semibold">
                      142 completadas
                    </span>
                  </div>
                  <svg
                    className="w-full h-12 text-[#2c4dd6] overflow-visible"
                    fill="none"
                    viewBox="0 0 380 60"
                  >
                    <path
                      d="M0 45 C40 38, 70 50, 110 32 C150 14, 180 30, 220 18 C260 8, 300 24, 340 10 L380 6"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="2.5"
                    />
                    <circle cx="380" cy="6" fill="currentColor" r="4" />
                    <path
                      d="M0 45 C40 38, 70 50, 110 32 C150 14, 180 30, 220 18 C260 8, 300 24, 340 10 L380 6 L380 60 L0 60 Z"
                      fill="currentColor"
                      fillOpacity="0.08"
                    />
                  </svg>
                </div>

                {/* Appointment Feed Strip */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-[#45464c] text-xs font-semibold px-1">
                    <span>PRÓXIMAS CITAS</span>
                    <span className="text-[#2c4dd6] hover:underline cursor-pointer">
                      Ver agenda completa
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#e5eeff] rounded-xl border border-[#dce9ff]">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-9 rounded-full bg-[#2c4dd6]"></div>
                      <div>
                        <p className="text-sm font-semibold text-[#0b1c30]">
                          Alejandro Torres
                        </p>
                        <p className="text-xs text-[#45464c]">
                          Corte Degradado + Barba · 11:30 AM
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium bg-[#7ffc97] text-[#002109] px-2.5 py-1 rounded-full">
                      Confirmada
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#eff4ff] rounded-xl border border-[#dce9ff]/60">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-9 rounded-full bg-[#4a68f0]"></div>
                      <div>
                        <p className="text-sm font-semibold text-[#0b1c30]">
                          Daniel Ruiz
                        </p>
                        <p className="text-xs text-[#45464c]">
                          Perfilado y Ritual Facial · 12:15 PM
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium bg-[#dee1ff] text-[#001257] px-2.5 py-1 rounded-full">
                      En espera
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. TRUST & SOCIAL PROOF STRIP */}
        <section className="w-full bg-[#eff4ff] py-8 border-y border-[#dce9ff]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col items-center gap-4 text-center">
            <p className="text-xs font-semibold text-[#45464c] uppercase tracking-wider">
              Una plataforma diseñada para negocios que trabajan con citas
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-[#0b1c30] text-sm font-medium border border-[#dce9ff]/60">
                <span className="material-symbols-outlined text-[#2c4dd6] text-base">
                  spa
                </span>
                <span>Belleza</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-[#0b1c30] text-sm font-medium border border-[#dce9ff]/60">
                <span className="material-symbols-outlined text-[#2c4dd6] text-base">
                  content_cut
                </span>
                <span>Barberías</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-[#0b1c30] text-sm font-medium border border-[#dce9ff]/60">
                <span className="material-symbols-outlined text-[#2c4dd6] text-base">
                  stethoscope
                </span>
                <span>Salud</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-[#0b1c30] text-sm font-medium border border-[#dce9ff]/60">
                <span className="material-symbols-outlined text-[#2c4dd6] text-base">
                  self_improvement
                </span>
                <span>Bienestar</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-[#0b1c30] text-sm font-medium border border-[#dce9ff]/60">
                <span className="material-symbols-outlined text-[#2c4dd6] text-base">
                  business_center
                </span>
                <span>Servicios profesionales</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. FEATURES SECTION ("TODO EN UN SOLO LUGAR") */}
        <section
          id="funcionalidades"
          className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-24"
        >
          <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col gap-3">
            <span className="text-xs text-[#2c4dd6] font-semibold uppercase tracking-wider">
              TODO EN UN SOLO LUGAR
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0b1c30] tracking-tight">
              Menos tareas administrativas. Más tiempo para tu negocio.
            </h2>
            <p className="text-base lg:text-lg text-[#45464c] leading-relaxed">
              Skedly reúne las herramientas que necesitas para organizar tu
              operación y ofrecer una mejor experiencia a tus clientes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Feature 1 */}
            <div className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md border border-[#dce9ff]/70 transition-shadow flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#dee1ff] flex items-center justify-center text-[#001257]">
                <span className="material-symbols-outlined text-2xl">
                  calendar_month
                </span>
              </div>
              <h3 className="text-lg font-semibold text-[#0b1c30]">
                Agenda inteligente
              </h3>
              <p className="text-sm text-[#45464c] leading-relaxed">
                Organiza tus citas y consulta la disponibilidad de tu equipo
                desde un solo lugar.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md border border-[#dce9ff]/70 transition-shadow flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#dee1ff] flex items-center justify-center text-[#001257]">
                <span className="material-symbols-outlined text-2xl">
                  event_available
                </span>
              </div>
              <h3 className="text-lg font-semibold text-[#0b1c30]">
                Reservas online
              </h3>
              <p className="text-sm text-[#45464c] leading-relaxed">
                Permite que tus clientes reserven fácilmente desde tu propia
                página web.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md border border-[#dce9ff]/70 transition-shadow flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#dee1ff] flex items-center justify-center text-[#001257]">
                <span className="material-symbols-outlined text-2xl">group</span>
              </div>
              <h3 className="text-lg font-semibold text-[#0b1c30]">
                Gestión de clientes
              </h3>
              <p className="text-sm text-[#45464c] leading-relaxed">
                Mantén organizada la información y el historial de tus clientes.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md border border-[#dce9ff]/70 transition-shadow flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#dee1ff] flex items-center justify-center text-[#001257]">
                <span className="material-symbols-outlined text-2xl">badge</span>
              </div>
              <h3 className="text-lg font-semibold text-[#0b1c30]">
                Control de equipo
              </h3>
              <p className="text-sm text-[#45464c] leading-relaxed">
                Gestiona profesionales, horarios y servicios de manera sencilla.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md border border-[#dce9ff]/70 transition-shadow flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#dee1ff] flex items-center justify-center text-[#001257]">
                <span className="material-symbols-outlined text-2xl">language</span>
              </div>
              <h3 className="text-lg font-semibold text-[#0b1c30]">
                Tu propia página web
              </h3>
              <p className="text-sm text-[#45464c] leading-relaxed">
                Presenta tu negocio con tu marca, tus servicios y tus opciones de
                reserva.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md border border-[#dce9ff]/70 transition-shadow flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#dee1ff] flex items-center justify-center text-[#001257]">
                <span className="material-symbols-outlined text-2xl">
                  bar_chart
                </span>
              </div>
              <h3 className="text-lg font-semibold text-[#0b1c30]">
                Estadísticas
              </h3>
              <p className="text-sm text-[#45464c] leading-relaxed">
                Consulta el rendimiento de tu negocio y toma mejores decisiones.
              </p>
            </div>
          </div>
        </section>

        {/* 4. BOOKING EXPERIENCE HIGHLIGHT */}
        <section
          id="experiencia"
          className="w-full bg-[#eff4ff] py-20 lg:py-24 border-y border-[#dce9ff]"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Text benefits */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-[#2c4dd6] font-semibold uppercase tracking-wider">
                    EXPERIENCIA FLUIDA
                  </span>
                  <h2 className="text-3xl lg:text-4xl font-bold text-[#0b1c30] tracking-tight">
                    Reservar una cita nunca debería ser complicado.
                  </h2>
                  <p className="text-base text-[#45464c] leading-relaxed">
                    Ofrece a tus clientes una experiencia de reserva sencilla,
                    rápida y adaptada a la forma en que trabaja tu negocio.
                  </p>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-[#dce9ff]/60">
                    <span
                      className="material-symbols-outlined text-[#2c4dd6] text-2xl shrink-0 mt-0.5"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#0b1c30]">
                        Menos pasos para reservar.
                      </p>
                      <p className="text-xs text-[#45464c] mt-0.5">
                        Un flujo lineal de 4 pasos que reduce la fricción al
                        mínimo.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-[#dce9ff]/60">
                    <span
                      className="material-symbols-outlined text-[#2c4dd6] text-2xl shrink-0 mt-0.5"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#0b1c30]">
                        Horarios disponibles de forma clara.
                      </p>
                      <p className="text-xs text-[#45464c] mt-0.5">
                        Sincronización en tiempo real evitando solapamientos o
                        llamadas innecesarias.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-[#dce9ff]/60">
                    <span
                      className="material-symbols-outlined text-[#2c4dd6] text-2xl shrink-0 mt-0.5"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#0b1c30]">
                        Una experiencia cómoda desde cualquier dispositivo.
                      </p>
                      <p className="text-xs text-[#45464c] mt-0.5">
                        Optimizado al 100% para teléfonos móviles, tablets y
                        ordenadores.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Phone Mockup */}
              <div className="lg:col-span-7 flex justify-center">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#dce9ff] p-6 flex flex-col gap-5">
                  {/* Step Indicators */}
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#45464c] bg-[#eff4ff] p-2.5 rounded-lg border border-[#dce9ff]">
                    <span className="text-[#2c4dd6]">1. Servicio</span>
                    <span className="text-[#c6c6cd]">&gt;</span>
                    <span className="text-[#2c4dd6]">2. Profesional</span>
                    <span className="text-[#c6c6cd]">&gt;</span>
                    <span className="text-[#2c4dd6]">3. Horario</span>
                    <span className="text-[#c6c6cd]">&gt;</span>
                    <span>4. Fin</span>
                  </div>

                  {/* Selected Service Card */}
                  <div className="p-4 bg-[#e5eeff] rounded-xl flex items-center justify-between border border-[#dce9ff]">
                    <div>
                      <p className="text-sm font-semibold text-[#0b1c30]">
                        Corte clásico + Barba
                      </p>
                      <p className="text-xs text-[#45464c]">45 min de duración</p>
                    </div>
                    <span className="text-lg text-[#2c4dd6] font-bold">
                      $35.00
                    </span>
                  </div>

                  {/* Specialist Avatars */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-[#45464c] uppercase tracking-wider">
                      Especialista seleccionado
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 p-2.5 bg-[#dee1ff]/70 border border-[#2c4dd6]/40 rounded-xl">
                        <div className="w-9 h-9 rounded-full bg-[#2c4dd6] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                          CM
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0b1c30]">
                            Carlos M.
                          </p>
                          <p className="text-[11px] text-[#2c4dd6] font-semibold">
                            Seleccionado
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2.5 bg-[#eff4ff] rounded-xl border border-[#dce9ff]/60 opacity-70">
                        <div className="w-9 h-9 rounded-full bg-[#dce9ff] text-[#0b1c30] flex items-center justify-center text-xs font-semibold">
                          MR
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#0b1c30]">
                            Miguel R.
                          </p>
                          <p className="text-[11px] text-[#45464c]">Disponible</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Date & Time Slot selection */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-[#45464c] uppercase tracking-wider">
                      Horarios para hoy, 24 Octubre
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      <button className="py-2.5 px-1 text-center text-xs font-medium rounded-lg bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30] border border-[#dce9ff]/60 transition-colors">
                        09:00
                      </button>
                      <button className="py-2.5 px-1 text-center text-xs font-medium rounded-lg bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30] border border-[#dce9ff]/60 transition-colors">
                        09:30
                      </button>
                      <button className="py-2.5 px-1 text-center text-xs font-bold rounded-lg bg-[#2c4dd6] text-white shadow-sm">
                        10:15
                      </button>
                      <button className="py-2.5 px-1 text-center text-xs font-medium rounded-lg bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30] border border-[#dce9ff]/60 transition-colors">
                        11:30
                      </button>
                    </div>
                  </div>

                  {/* Book button */}
                  <button className="w-full py-3 bg-[#2c4dd6] hover:bg-[#4a68f0] text-white font-medium text-sm rounded-xl shadow-md transition-all">
                    Confirmar reserva
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. INDUSTRIES SECTION */}
        <section
          id="sectores"
          className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-24"
        >
          <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col gap-3">
            <span className="text-xs text-[#2c4dd6] font-semibold uppercase tracking-wider">
              SECTORES ADAPTADOS
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0b1c30] tracking-tight">
              Una plataforma. Diferentes tipos de negocio.
            </h2>
            <p className="text-base lg:text-lg text-[#45464c] leading-relaxed">
              Configura catálogos, duraciones de turno, calendarios de
              especialistas y reglas según la dinámica de tu sector.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* 1. Barberías y salones */}
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md border border-[#dce9ff]/80 transition-all flex flex-col gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#dee1ff] text-[#001257] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">
                  content_cut
                </span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#0b1c30]">
                  Barberías y salones
                </h3>
                <p className="text-xs text-[#45464c] mt-2 leading-relaxed">
                  Gestión por sillón de trabajo, reservas rápidas y fidelización
                  de clientes recurrentes.
                </p>
              </div>
              <div className="mt-auto pt-2">
                <span className="text-xs text-[#2c4dd6] font-semibold flex items-center gap-1">
                  Explorar sector{" "}
                  <span className="material-symbols-outlined text-sm">
                    arrow_forward
                  </span>
                </span>
              </div>
            </div>

            {/* 2. Belleza y spas */}
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md border border-[#dce9ff]/80 transition-all flex flex-col gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#dee1ff] text-[#001257] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">spa</span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#0b1c30]">
                  Belleza y spas
                </h3>
                <p className="text-xs text-[#45464c] mt-2 leading-relaxed">
                  Paquetes multi-servicio, cabinas privadas y asignación de
                  esteticistas especializadas.
                </p>
              </div>
              <div className="mt-auto pt-2">
                <span className="text-xs text-[#2c4dd6] font-semibold flex items-center gap-1">
                  Explorar sector{" "}
                  <span className="material-symbols-outlined text-sm">
                    arrow_forward
                  </span>
                </span>
              </div>
            </div>

            {/* 3. Clínicas y consultorios */}
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md border border-[#dce9ff]/80 transition-all flex flex-col gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#dee1ff] text-[#001257] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">
                  medical_services
                </span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#0b1c30]">
                  Clínicas y salud
                </h3>
                <p className="text-xs text-[#45464c] mt-2 leading-relaxed">
                  Fichas de pacientes, agenda por consultorio y recordatorios
                  automáticos previos.
                </p>
              </div>
              <div className="mt-auto pt-2">
                <span className="text-xs text-[#2c4dd6] font-semibold flex items-center gap-1">
                  Explorar sector{" "}
                  <span className="material-symbols-outlined text-sm">
                    arrow_forward
                  </span>
                </span>
              </div>
            </div>

            {/* 4. Terapia y bienestar */}
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md border border-[#dce9ff]/80 transition-all flex flex-col gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#dee1ff] text-[#001257] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">
                  psychology
                </span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#0b1c30]">
                  Terapia y bienestar
                </h3>
                <p className="text-xs text-[#45464c] mt-2 leading-relaxed">
                  Consultas recurrentes, sincronización flexible y espacios
                  protegidos para sesiones.
                </p>
              </div>
              <div className="mt-auto pt-2">
                <span className="text-xs text-[#2c4dd6] font-semibold flex items-center gap-1">
                  Explorar sector{" "}
                  <span className="material-symbols-outlined text-sm">
                    arrow_forward
                  </span>
                </span>
              </div>
            </div>

            {/* 5. Servicios profesionales */}
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md border border-[#dce9ff]/80 transition-all flex flex-col gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#dee1ff] text-[#001257] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">
                  business_center
                </span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#0b1c30]">
                  Servicios profesionales
                </h3>
                <p className="text-xs text-[#45464c] mt-2 leading-relaxed">
                  Asesorías legales, contables y sesiones de consultoría 1 a 1
                  con control de tiempo.
                </p>
              </div>
              <div className="mt-auto pt-2">
                <span className="text-xs text-[#2c4dd6] font-semibold flex items-center gap-1">
                  Explorar sector{" "}
                  <span className="material-symbols-outlined text-sm">
                    arrow_forward
                  </span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 6. WEBSITE CUSTOMIZATION SECTION */}
        <section
          id="personalizacion"
          className="w-full bg-[#eff4ff] py-20 lg:py-24 border-y border-[#dce9ff]"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col gap-3">
              <span className="text-xs text-[#2c4dd6] font-semibold uppercase tracking-wider">
                PERSONALIZACIÓN TOTAL
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#0b1c30] tracking-tight">
                Tu página de reservas debe sentirse como tu negocio.
              </h2>
              <p className="text-base lg:text-lg text-[#45464c] leading-relaxed">
                Personaliza la presencia online de tu negocio y permite que tus
                clientes conozcan tus servicios y reserven contigo.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Brand Settings Widget */}
              <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-md border border-[#dce9ff] flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#eff4ff]">
                  <span className="material-symbols-outlined text-[#2c4dd6] text-xl">
                    tune
                  </span>
                  <h3 className="text-sm font-bold text-[#0b1c30]">
                    Panel de Configuración
                  </h3>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#45464c]">
                    Color primario de la marca
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500 shadow-sm border border-white"></span>
                    <span className="text-xs text-[#0b1c30] font-mono">
                      #D97706 (Dorado Premium)
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#45464c]">
                    Tipografía del sitio
                  </label>
                  <div className="p-2.5 bg-[#eff4ff] rounded-lg text-[#0b1c30] text-xs font-medium flex justify-between items-center border border-[#dce9ff]/60">
                    <span>Inter Editorial Elegance</span>
                    <span className="material-symbols-outlined text-sm text-[#76777d]">
                      unfold_more
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#45464c]">
                    Identidad gráfica
                  </label>
                  <div className="p-2.5 bg-[#eff4ff] rounded-lg flex items-center justify-between border border-[#dce9ff]/60">
                    <span className="text-xs text-[#0b1c30] font-mono">
                      alpha_barbershop_logo.svg
                    </span>
                    <span className="material-symbols-outlined text-[#009842] text-sm">
                      check
                    </span>
                  </div>
                </div>
                <button className="w-full mt-2 py-2.5 bg-[#0b1c30] text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-[#213145] transition-colors">
                  Publicar cambios en vivo
                </button>
              </div>

              {/* Custom Website Showcase Display */}
              <div className="lg:col-span-8 bg-[#213145] text-[#eaf1ff] rounded-2xl shadow-xl overflow-hidden p-6 lg:p-8 border border-[#45464c]/40">
                <div className="flex items-center justify-between pb-5 mb-6 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-[#213145] flex items-center justify-center font-bold text-lg shadow">
                      α
                    </div>
                    <div>
                      <p className="text-base font-bold text-white">
                        Barbería Alpha
                      </p>
                      <p className="text-xs text-[#eaf1ff]/70">
                        Cortes de autor &amp; Afeitado tradicional
                      </p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-amber-500 text-[#213145] text-xs font-bold rounded-lg shadow hover:bg-amber-400 transition-colors">
                    Reservar ahora
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col gap-1.5">
                    <p className="text-sm font-semibold text-amber-400">
                      Degradado Clásico
                    </p>
                    <p className="text-xs text-[#eaf1ff]/80">30 min · $25.00</p>
                    <p className="text-[11px] text-[#eaf1ff]/60 leading-relaxed mt-1">
                      Tijera, navaja y toalla caliente al terminar.
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col gap-1.5">
                    <p className="text-sm font-semibold text-amber-400">
                      Ritual Barba &amp; Aceite
                    </p>
                    <p className="text-xs text-[#eaf1ff]/80">40 min · $30.00</p>
                    <p className="text-[11px] text-[#eaf1ff]/60 leading-relaxed mt-1">
                      Tratamiento con vapor y bálsamo hidratante.
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col gap-1.5">
                    <p className="text-sm font-semibold text-amber-400">
                      Combo Master Alpha
                    </p>
                    <p className="text-xs text-[#eaf1ff]/80">60 min · $48.00</p>
                    <p className="text-[11px] text-[#eaf1ff]/60 leading-relaxed mt-1">
                      Experiencia completa VIP con bebida incluida.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. FINAL CTA SECTION */}
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-24">
          <div className="bg-[#141b2b] text-white rounded-3xl p-10 lg:p-16 text-center flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl flex flex-col gap-3">
              <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                Empieza a organizar tu negocio de una mejor manera.
              </h2>
              <p className="text-base text-[#c0c6db] leading-relaxed">
                Descubre una forma más sencilla de gestionar tus citas y conectar
                con tus clientes.
              </p>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-3 pt-2">
              <Link
                href="/register"
                className="px-8 py-3.5 bg-[#2c4dd6] text-white font-semibold text-sm rounded-xl shadow-lg hover:bg-[#4a68f0] transition-all"
              >
                Comenzar gratis
              </Link>
              <p className="text-xs text-[#7d8497]">
                Prueba de 14 días sin compromiso · Sin tarjeta de crédito requerida
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-[#eff4ff] border-t border-[#dce9ff]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
            <div className="md:col-span-2 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs tracking-wider">
                  SK
                </div>
                <span className="font-bold text-base text-[#0b1c30]">
                  SKEDLY
                </span>
              </div>
              <p className="text-xs text-[#45464c] max-w-sm leading-relaxed">
                Plataforma integral de gestión de citas, fidelización de clientes
                y control operativo para empresas y profesionales de servicios.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#0b1c30] mb-1">
                Producto
              </span>
              <a
                className="text-xs text-[#45464c] hover:text-[#0b1c30] transition-colors"
                href="#funcionalidades"
              >
                Agenda Digital
              </a>
              <a
                className="text-xs text-[#45464c] hover:text-[#0b1c30] transition-colors"
                href="#experiencia"
              >
                Reservas Online
              </a>
              <a
                className="text-xs text-[#45464c] hover:text-[#0b1c30] transition-colors"
                href="#personalizacion"
              >
                Página de Negocio
              </a>
              <a
                className="text-xs text-[#45464c] hover:text-[#0b1c30] transition-colors"
                href="#sectores"
              >
                Sectores
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#0b1c30] mb-1">
                Sectores
              </span>
              <a
                className="text-xs text-[#45464c] hover:text-[#0b1c30] transition-colors"
                href="#sectores"
              >
                Barberías &amp; Salones
              </a>
              <a
                className="text-xs text-[#45464c] hover:text-[#0b1c30] transition-colors"
                href="#sectores"
              >
                Salud &amp; Bienestar
              </a>
              <a
                className="text-xs text-[#45464c] hover:text-[#0b1c30] transition-colors"
                href="#sectores"
              >
                Consultoría &amp; Coaching
              </a>
              <a
                className="text-xs text-[#45464c] hover:text-[#0b1c30] transition-colors"
                href="#sectores"
              >
                Estudios de Fitness
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#0b1c30] mb-1">
                Empresa
              </span>
              <a
                className="text-xs text-[#45464c] hover:text-[#0b1c30] transition-colors"
                href="#"
              >
                Sobre Nosotros
              </a>
              <a
                className="text-xs text-[#45464c] hover:text-[#0b1c30] transition-colors"
                href="#"
              >
                Términos de Servicio
              </a>
              <a
                className="text-xs text-[#45464c] hover:text-[#0b1c30] transition-colors"
                href="#"
              >
                Privacidad
              </a>
              <a
                className="text-xs text-[#45464c] hover:text-[#0b1c30] transition-colors"
                href="#"
              >
                Centro de Ayuda
              </a>
            </div>
          </div>

          <div className="pt-8 border-t border-[#dce9ff] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#45464c]">
              © 2026 SKEDLY. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6 text-xs text-[#45464c]">
              <span>Seguridad SSL</span>
              <span>Disponibilidad 99.9%</span>
              <span>Soporte</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
