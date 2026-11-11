"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(email.trim(), password);

    if (error) {
      setError("Credenciales inválidas. Verifica tu correo y contraseña.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-bg">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8 flex flex-col gap-4 shadow-sm"
      >
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-black border border-border">
            <img src="/cart-logo.png" alt="Cart" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-lg font-bold text-text-primary">Iniciar sesión</h1>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium text-text-secondary">Correo</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 rounded-lg border border-border bg-bg px-3 text-[13px] text-text-primary outline-none focus:border-accent"
            placeholder="nombre@empresa.com"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium text-text-secondary">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 rounded-lg border border-border bg-bg px-3 text-[13px] text-text-primary outline-none focus:border-accent"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-[12px] text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="h-10 rounded-lg bg-accent text-white text-[13px] font-semibold mt-2 disabled:opacity-60 cursor-pointer"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
