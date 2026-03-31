"use client";

import { useState } from "react";

type FormState = {
  name: string;
  email: string;
  country: string;
  phone: string;
  message: string;
};

export default function ContactLeadForm() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    country: "",
    phone: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al enviar. Intentá de nuevo.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="card p-10 text-center">
        <span
          className="material-symbols-outlined text-green-vitality text-5xl mb-4 block"
          style={{ fontVariationSettings: '"FILL" 1' }}
        >
          check_circle
        </span>
        <h3 className="text-2xl font-extrabold text-navy mb-2">¡Mensaje enviado!</h3>
        <p className="text-navy/60">Un asesor especializado te responderá a la brevedad.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="card p-10 space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-widest text-navy/60 px-1">
            Nombre
          </label>
          <input
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
            className="input-field"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-widest text-navy/60 px-1">
            Email
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="input-field"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-widest text-navy/60 px-1">
            País
          </label>
          <input
            name="country"
            type="text"
            value={form.country}
            onChange={handleChange}
            className="input-field"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-widest text-navy/60 px-1">
            Teléfono
          </label>
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            className="input-field"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-widest text-navy/60 px-1">
          Consulta
        </label>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          rows={4}
          required
          className="w-full rounded-2xl bg-gray-100 px-5 py-3 text-sm text-navy outline-none placeholder:text-navy/40 focus:ring-2 focus:ring-orange/30 resize-none"
        />
      </div>

      {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary text-base py-5 disabled:opacity-60"
      >
        {loading ? "ENVIANDO…" : "ENVIAR CONSULTA"}
      </button>
    </form>
  );
}
