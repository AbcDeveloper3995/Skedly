"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";

interface CustomerItem {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
}

export default function ClientesPage() {
  const { currentBusiness } = useAuth();
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal Nuevo Cliente
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const loadCustomers = async (businessId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (data) {
      setCustomers(data as CustomerItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentBusiness?.id) {
      loadCustomers(currentBusiness.id);
    }
  }, [currentBusiness]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness?.id) return;
    setSaving(true);

    try {
      const { data, error } = await supabase
        .from("customers")
        .insert({
          business_id: currentBusiness.id,
          full_name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          notes: notes.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setCustomers([data as CustomerItem, ...customers]);
      }
      setIsModalOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      setNotes("");
    } catch (err) {
      console.error("Error creating customer:", err);
    } finally {
      setSaving(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1440px] mx-auto">
      {/* HEADER & ACTIONS BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#45464c]">
            <Link href="/dashboard" className="hover:text-[#0b1c30]">
              Inicio
            </Link>
            <span>/</span>
            <span>Gestión</span>
            <span>/</span>
            <span className="text-[#0b1c30] font-semibold">Clientes</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#0b1c30] tracking-tight mt-1">
            Gestión de Clientes
          </h1>
          <p className="text-sm text-[#45464c] mt-0.5">
            Consulta la base de datos, teléfonos e historial de visitas de tus
            clientes.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-4 rounded-xl bg-[#2c4dd6] text-white text-xs font-semibold shadow-md hover:bg-[#4a68f0] transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>Nuevo cliente</span>
          </button>
        </div>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white shadow-sm border border-[#dce9ff] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-[#45464c] font-semibold">
              Total Clientes
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-[#0b1c30]">
                {customers.length}
              </span>
              <span className="text-[11px] font-bold text-[#009842] bg-[#7ffc97]/30 px-2 py-0.5 rounded-full">
                Base activa
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#dee1ff] flex items-center justify-center text-[#2c4dd6]">
            <span className="material-symbols-outlined text-2xl">groups</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white shadow-sm border border-[#dce9ff] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-[#45464c] font-semibold">
              Clientes Recurrentes
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-[#0b1c30]">68%</span>
              <span className="text-xs text-[#45464c]">Fidelidad estimada</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#dee1ff] flex items-center justify-center text-[#2c4dd6]">
            <span className="material-symbols-outlined text-2xl">
              published_with_changes
            </span>
          </div>
        </div>
      </div>

      {/* SEARCH AND TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#dce9ff] overflow-hidden">
        <div className="p-4 border-b border-[#eff4ff] flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d] text-lg">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, teléfono o correo..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#eff4ff] border border-transparent focus:border-[#2c4dd6] text-xs text-[#0b1c30] placeholder-[#76777d] outline-none"
            />
          </div>
          <span className="text-xs text-[#45464c] font-medium">
            {filtered.length} clientes encontrados
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center text-xs text-slate-400">
            Cargando clientes...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center gap-3 text-slate-400">
            <span className="material-symbols-outlined text-4xl text-[#c6c6cd]">
              person_off
            </span>
            <p className="text-sm font-semibold text-slate-600">
              No se encontraron clientes registrados.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#2c4dd6] text-white text-xs font-semibold rounded-lg"
            >
              Agregar el primer cliente
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#eff4ff] text-[#45464c] font-semibold border-b border-[#dce9ff]">
                <tr>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Teléfono</th>
                  <th className="py-3.5 px-4">Correo</th>
                  <th className="py-3.5 px-4">Notas</th>
                  <th className="py-3.5 px-4 text-right">Registrado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eff4ff]">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f8f9ff] transition-colors">
                    <td className="py-3 px-4 font-bold text-[#0b1c30] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#dee1ff] text-[#001257] flex items-center justify-center font-bold text-xs shrink-0">
                        {item.full_name.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{item.full_name}</span>
                    </td>
                    <td className="py-3 px-4 text-[#45464c]">
                      {item.phone || "—"}
                    </td>
                    <td className="py-3 px-4 text-[#45464c]">
                      {item.email || "—"}
                    </td>
                    <td className="py-3 px-4 text-[#76777d] truncate max-w-xs">
                      {item.notes || "—"}
                    </td>
                    <td className="py-3 px-4 text-right text-[#76777d]">
                      {new Date(item.created_at).toLocaleDateString("es-ES")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL NUEVO CLIENTE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0b1c30]">
                Nuevo Cliente
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Jorge Ramírez"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 55 1234 5678"
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
                  placeholder="cliente@ejemplo.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas / Preferencias
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Prefiere citas los viernes por la tarde"
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
                  {saving ? "Guardando..." : "Guardar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
