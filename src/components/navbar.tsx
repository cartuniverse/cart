"use client";

import { FolderKanban, Grid3x3, Plus, Share2 } from "lucide-react";

interface NavbarProps {
  currentTab: "grafo" | "cuadricula";
  onTabChange: (tab: "grafo" | "cuadricula") => void;
  onAddPerson: () => void;
  showStatusEmoji?: boolean;
  onToggleStatusEmoji?: () => void;
  selectedProject?: string | null;
  onSelectProject?: (proj: string | null) => void;
  availableProjects?: string[];
}

export function Navbar({
  currentTab,
  onTabChange,
  onAddPerson,
  showStatusEmoji = true,
  onToggleStatusEmoji,
  selectedProject = null,
  onSelectProject,
  availableProjects = ["Cart", "Mobile App", "Branding", "Web Platform"],
}: NavbarProps) {
  return (
    <header className="h-[72px] shrink-0 bg-surface border-b border-[var(--border)] flex items-center px-7 gap-4">
      {/* Breadcrumb: solo "Organigrama" */}
      <div className="flex items-center">
        <span className="text-[16px] font-bold text-text-primary">
          Organigrama
        </span>
      </div>

      <div className="flex-1" />

      {/* Filtro de Proyecto en Canvas/Navbar */}
      <div className="flex items-center gap-1.5 bg-surface-2 border border-[var(--border)] rounded-[10px] px-2.5 h-9">
        <FolderKanban className="w-3.5 h-3.5 text-text-secondary" />
        <select
          value={selectedProject || ""}
          onChange={(e) => onSelectProject?.(e.target.value ? e.target.value : null)}
          className="bg-transparent text-[12px] font-medium text-text-primary outline-none cursor-pointer pr-1"
        >
          <option value="">Todos los proyectos</option>
          {availableProjects.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Toggle para Activar / Desactivar Emojis de Estatus Laboral */}
      {onToggleStatusEmoji && (
        <button
          onClick={onToggleStatusEmoji}
          title={showStatusEmoji ? "Desactivar emojis de estatus (🧑🏻‍💻 / 💤)" : "Activar emojis de estatus (🧑🏻‍💻 / 💤)"}
          className={`h-9 px-3 rounded-[10px] border flex items-center gap-2 text-[12px] transition cursor-pointer ${showStatusEmoji
              ? "bg-surface border-border text-text-primary font-medium shadow-2xs hover:bg-surface-2"
              : "bg-surface-2 border-transparent text-text-tertiary hover:text-text-primary"
            }`}
        >
          <span className="text-[13px]">{showStatusEmoji ? "🧑🏻‍💻" : "💤"}</span>
          <span className="font-medium">{showStatusEmoji ? "Estatus: ON" : "Estatus: OFF"}</span>
        </button>
      )}

      {/* Tabs: solo "Grafo" y "Cuadrícula" */}
      <div className="h-9 rounded-[10px] bg-surface-2 p-1 flex items-center gap-0.5">
        <button
          onClick={() => onTabChange("grafo")}
          className={`h-full px-3 rounded-lg flex items-center gap-1.5 text-[12px] transition cursor-pointer ${currentTab === "grafo"
              ? "bg-surface border border-[var(--border)] text-text-primary font-semibold shadow-xs"
              : "text-text-secondary font-medium hover:bg-surface"
            }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          Grafo
        </button>

        <button
          onClick={() => onTabChange("cuadricula")}
          className={`h-full px-3 rounded-lg flex items-center gap-1.5 text-[12px] transition cursor-pointer ${currentTab === "cuadricula"
              ? "bg-surface border border-[var(--border)] text-text-primary font-semibold shadow-xs"
              : "text-text-secondary font-medium hover:bg-surface"
            }`}
        >
          <Grid3x3 className="w-3.5 h-3.5" />
          Cuadrícula
        </button>
      </div>

      {/* Botón "Agregar persona" */}
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
