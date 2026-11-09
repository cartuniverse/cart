"use client";

import { Grid3x3, Plus, Share2 } from "lucide-react";

interface NavbarProps {
  currentTab: "grafo" | "cuadricula";
  onTabChange: (tab: "grafo" | "cuadricula") => void;
  onAddPerson: () => void;
}

export function Navbar({ currentTab, onTabChange, onAddPerson }: NavbarProps) {
  return (
    <header className="h-[72px] shrink-0 bg-surface border-b border-[var(--border)] flex items-center px-7 gap-5">
      {/* Breadcrumb: solo "Organigrama" */}
      <div className="flex items-center">
        <span className="text-[16px] font-bold text-text-primary">
          Organigrama
        </span>
      </div>

      <div className="flex-1" />

      {/* Tabs: solo "Grafo" y "Cuadrícula" */}
      <div className="h-9 rounded-[10px] bg-surface-2 p-1 flex items-center gap-0.5">
        <button
          onClick={() => onTabChange("grafo")}
          className={`h-full px-3 rounded-lg flex items-center gap-1.5 text-[12px] transition cursor-pointer ${
            currentTab === "grafo"
              ? "bg-surface border border-[var(--border)] text-text-primary font-semibold shadow-xs"
              : "text-text-secondary font-medium hover:bg-surface"
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          Grafo
        </button>

        <button
          onClick={() => onTabChange("cuadricula")}
          className={`h-full px-3 rounded-lg flex items-center gap-1.5 text-[12px] transition cursor-pointer ${
            currentTab === "cuadricula"
              ? "bg-surface border border-[var(--border)] text-text-primary font-semibold shadow-xs"
              : "text-text-secondary font-medium hover:bg-surface"
          }`}
        >
          <Grid3x3 className="w-3.5 h-3.5" />
          Cuadrícula
        </button>
      </div>

      {/* Botón "Agregar persona" (se eliminaron los botones de notificaciones y configuración) */}
      <div className="flex items-center">
        <button
          onClick={onAddPerson}
          className="h-9 rounded-[10px] bg-text-primary flex items-center gap-1.5 px-3.5 text-[13px] font-semibold text-white hover:opacity-90 active:scale-95 transition shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar persona
        </button>
      </div>
    </header>
  );
}
