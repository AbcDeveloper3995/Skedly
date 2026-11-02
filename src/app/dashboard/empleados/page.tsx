"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";

interface EmployeeItem {
  id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  is_active: boolean;
}

export default function EmpleadosPage() {
  const { currentBusiness } = useAuth();
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Nuevo Empleado
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  const loadEmployees = async (businessId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("employees")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: true });

    if (data) {
      setEmployees(data as EmployeeItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentBusiness?.id) {
      loadEmployees(currentBusiness.id);
    }
  }, [currentBusiness]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness?.id) return;
    setSaving(true);

    try {
      const { data, error } = await supabase
        .from("employees")
        .insert({
          business_id: currentBusiness.id,
          display_name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          bio: bio.trim() || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setEmployees([...employees, data as EmployeeItem]);
      }
      setIsModalOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      setBio("");
    } catch (err) {
      console.error("Error creating employee:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1440px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#45464c]">
            <Link href="/dashboard" className="hover:text-[#0b1c30]">
              Inicio
            </Link>
            <span>/</span>
            <span>Gestión</span>
            <span>/</span>
            <span className="text-[#0b1c30] font-semibold">Empleados</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#0b1c30] tracking-tight mt-1">
            Equipo y Profesionales
          </h1>
          <p className="text-sm text-[#45464c] mt-0.5">
            Gestiona los miembros del equipo que atienden servicios y tienen
            disponibilidad de agenda.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="h-10 px-4 rounded-xl bg-[#2c4dd6] text-white text-xs font-semibold shadow-md hover:bg-[#4a68f0] transition-all flex items-center gap-2 w-fit"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          <span>Nuevo Profesional</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center text-xs text-slate-400">
            Cargando empleados...
          </div>
        ) : employees.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center gap-3 text-slate-400 bg-white rounded-2xl border border-[#dce9ff]">
            <span className="material-symbols-outlined text-4xl text-[#c6c6cd]">
              badge
            </span>
            <p className="text-sm font-semibold text-slate-600">
              Aún no has registrado profesionales en tu equipo.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#2c4dd6] text-white text-xs font-semibold rounded-lg"
            >
              Registrar primer profesional
            </button>
          </div>
        ) : (
          employees.map((emp) => (
            <div
              key={emp.id}
              className="p-6 bg-white rounded-2xl shadow-sm border border-[#dce9ff] flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#2c4dd6] text-white flex items-center justify-center font-bold text-sm shadow">
                    {emp.display_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0b1c30]">
                      {emp.display_name}
                    </h3>
                    <p className="text-xs text-[#76777d]">
                      {emp.phone || emp.email || "Profesional de servicios"}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    emp.is_active
                      ? "bg-[#7ffc97] text-[#002109]"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {emp.is_active ? "Activo" : "Pausado"}
                </span>
              </div>

              {emp.bio && (
                <p className="text-xs text-[#45464c] line-clamp-2 leading-relaxed">
                  {emp.bio}
                </p>
              )}

              <div className="pt-3 border-t border-[#eff4ff] flex items-center justify-between text-xs text-[#2c4dd6] font-semibold">
                <span>Horarios asignados</span>
                <span className="material-symbols-outlined text-base">
                  arrow_forward
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL NUEVO EMPLEADO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0b1c30]">
                Registrar Profesional
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre a mostrar *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Carlos Mendoza"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="carlos@negocio.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 55 9876 5432"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Biografía / Especialidad
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Especialista en cortes degradados y ritual de toalla caliente..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#2c4dd6] text-white hover:bg-[#4a68f0] disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar Profesional"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
