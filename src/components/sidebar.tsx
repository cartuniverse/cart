"use client";

import {
  Share2,
  Users,
  FolderKanban,
  ListChecks,
  ChevronsUpDown,
  GitBranch,
  Video,
  Calendar,
  Sparkles,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import type { Profile } from "@/lib/types";

const NAV = [
  { id: "organigrama", icon: Share2, label: "Organigrama" },
  { id: "proyectos", icon: FolderKanban, label: "Proyectos" },
  { id: "tareas", icon: ListChecks, label: "Tareas" },
];

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  director_area: "Director de área",
  disenador_ai: "Diseñador AI",
  community_manager: "Community Manager",
  creador_audiovisual: "Creador Audiovisual AI",
};

interface SidebarProps {
  activeNav?: string;
  onSelectNav?: (navId: string) => void;
  currentRoleView?: "admin" | "audiovisual";
  profile?: Profile | null;
  onLogout?: () => void;
  activeProjectName?: string;
  onSelectProjectName?: (projectName: string) => void;
}

export function Sidebar({
  activeNav = "organigrama",
  onSelectNav,
  currentRoleView = "admin",
  profile,
  onLogout,
  activeProjectName = "Casa Luifer",
  onSelectProjectName,
}: SidebarProps) {
  const isAudiovisual = currentRoleView === "audiovisual";
  const displayName = profile?.name ?? "Usuario";
  const roleLabel = profile ? ROLE_LABELS[profile.role] ?? profile.role : "";
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="w-[260px] shrink-0 h-full bg-surface border-r border-[var(--border)] flex flex-col px-5 py-6 gap-6">
      {/* Brand Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-black border border-border shadow-xs">
            <img src="/cart-logo.png" alt="Cart Logo" className="w-full h-full object-cover" />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-bold text-text-primary">Cart</div>
            <div className="text-[11px] font-medium text-text-tertiary">
              {isAudiovisual ? "Mi diario" : "Mi equipo"}
            </div>
          </div>
        </div>
      </div>

      {/* Si está en la vista del Creador Audiovisual */}
      {isAudiovisual ? (
        <div className="flex flex-col gap-6 flex-1">
          {/* Sección: ESPACIO */}
          <div className="flex flex-col gap-1">
            <div className="text-[10px] font-bold text-text-tertiary tracking-widest mb-2">
              ESPACIO
            </div>
            {/* Botón Dashboard */}
            <button
              onClick={() => onSelectNav?.("dashboard")}
              className={`h-10 rounded-[10px] flex items-center gap-3 px-3 text-left transition cursor-pointer ${
                activeNav === "dashboard"
                  ? "bg-accent-soft text-text-primary font-bold shadow-xs"
                  : "text-text-secondary font-medium hover:bg-surface-2"
              }`}
            >
              <LayoutDashboard className="w-[18px] h-[18px]" />
              <span className="text-[13px] flex-1">Dashboard</span>
            </button>

            {/* Botón Diario de hoy */}
            <button
              onClick={() => onSelectNav?.("diario_hoy")}
              className={`h-10 rounded-[10px] flex items-center justify-between px-3 text-left transition cursor-pointer ${
                activeNav === "diario_hoy"
                  ? "bg-accent-soft text-text-primary font-bold shadow-xs"
                  : "text-text-secondary font-medium hover:bg-surface-2"
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-[18px] h-[18px]" />
                <span className="text-[13px]">Diario de hoy</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-surface-2 text-text-secondary border border-border">
                2/3
              </span>
            </button>
          </div>

          {/* Sección: MIS PROYECTOS */}
          <div className="flex flex-col gap-1">
            <div className="text-[10px] font-bold text-text-tertiary tracking-widest mb-2">
              MIS PROYECTOS
            </div>
            {[activeProjectName].map((proj) => {
              const isSelected = activeProjectName === proj;
              return (
                <button
                  key={proj}
                  onClick={() => onSelectProjectName?.(proj)}
                  className={`h-9 rounded-[10px] flex items-center gap-2.5 px-3 text-left transition cursor-pointer text-[12.5px] ${
                    isSelected
                      ? "bg-surface-2 text-text-primary font-bold"
                      : "text-text-secondary font-medium hover:bg-surface-2"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      background:
                        proj === "Casa Luifer"
                          ? "#ec4899"
                          : proj === "Orbit"
                          ? "#6366f1"
                          : "#10b981",
                    }}
                  />
                  <span className="truncate">{proj}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Navegación estándar de Administrador */
        <div className="flex flex-col gap-1 flex-1">
          <div className="text-[10px] font-bold text-text-tertiary tracking-widest mb-2">
            ESPACIO
          </div>
          {NAV.map(({ id, icon: Icon, label }) => {
            const isActive = activeNav === id;
            return (
              <button
                key={id}
                onClick={() => onSelectNav?.(id)}
                className={`h-10 rounded-[10px] flex items-center gap-3 px-3 text-left transition cursor-pointer ${
                  isActive
                    ? "bg-accent-soft text-text-primary font-bold shadow-xs"
                    : "text-text-secondary font-medium hover:bg-surface-2"
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
                <span className="text-[13px] flex-1">{label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* User Footer */}
      <button
        onClick={onLogout}
        title="Cerrar sesión"
        className="h-14 rounded-xl bg-surface-2 flex items-center gap-2.5 px-2.5 shrink-0 hover:bg-surface border border-transparent hover:border-border transition cursor-pointer text-left"
      >
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-[12px] ${
            isAudiovisual ? "bg-[#4f46e5]" : "bg-accent"
          }`}
        >
          {initials}
        </div>
        <div className="flex-1 leading-tight min-w-0">
          <div className="text-[13px] font-semibold text-text-primary truncate">
            {displayName}
          </div>
          <div className="text-[11px] text-text-tertiary truncate">{roleLabel}</div>
        </div>
        <LogOut className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
      </button>
    </aside>
  );
}

