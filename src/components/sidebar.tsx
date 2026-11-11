"use client";

import { motion } from "motion/react";
import {
  Share2,
  Users,
  FolderKanban,
  ListChecks,
  ChevronsUpDown,
  GitBranch,
  Video,
  Calendar,
  CalendarDays,
  LayoutGrid,
  Sparkles,
  LayoutDashboard,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";

// Icono SVG oficial de Instagram
function InstagramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
import { useTheme } from "@/lib/use-theme";
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
  currentRoleView?: "admin" | "audiovisual" | "community";
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
  const isCommunity = currentRoleView === "community";
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  // Nombre e iniciales según la vista
  const displayName = isCommunity
    ? "Valentina C."
    : isAudiovisual
    ? "Andrés M."
    : profile?.name ?? "Cristian A.";

  const roleLabel = isCommunity
    ? "Community Manager"
    : isAudiovisual
    ? "Creador Audiovisual AI"
    : profile
    ? ROLE_LABELS[profile.role] ?? profile.role
    : "Administrador";

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
            <div className="text-[15px] font-bold text-text-primary">Orbit</div>
            <div className="text-[11px] font-medium text-text-tertiary">
              {isAudiovisual || isCommunity ? "Mi diario" : "Mi equipo"}
            </div>
          </div>
        </div>

        {/* Interruptor de tema claro/oscuro */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          className="relative w-11 h-6 rounded-full bg-surface-2 border border-border flex items-center px-0.5 cursor-pointer shrink-0"
        >
          <motion.div
            className="w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center"
            animate={{ x: isDark ? 18 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {isDark ? (
              <Moon className="w-3 h-3 text-[#4f46e5]" />
            ) : (
              <Sun className="w-3 h-3 text-amber-500" />
            )}
          </motion.div>
        </button>
      </div>

      {/* Si está en la vista de Community Manager */}
      {isCommunity ? (
        <div className="flex flex-col gap-6 flex-1 overflow-y-auto">
          {/* Tarjeta de usuario destacada de Valentina C. con icono Instagram */}
          <div className="rounded-2xl bg-pink-50/70 border border-pink-100 p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center text-white shadow-2xs shrink-0">
              <InstagramIcon className="w-5 h-5" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-[13.5px] font-bold text-text-primary truncate">
                Valentina C.
              </div>
              <div className="text-[11px] font-semibold text-pink-600 truncate">
                Community Manager
              </div>
            </div>
          </div>

          {/* Sección: ESPACIO */}
          <div className="flex flex-col gap-1">
            <div className="text-[10px] font-bold text-text-tertiary tracking-widest mb-2">
              ESPACIO
            </div>

            {/* Dashboard */}
            <button
              onClick={() => onSelectNav?.("dashboard")}
              className={`h-10 rounded-[10px] flex items-center gap-3 px-3 text-left transition cursor-pointer ${
                activeNav === "dashboard"
                  ? "bg-pink-50/80 text-pink-700 font-bold border border-pink-200/60 shadow-xs"
                  : "text-text-secondary font-medium hover:bg-surface-2"
              }`}
            >
              <LayoutDashboard className="w-[18px] h-[18px] text-pink-500" />
              <span className="text-[13px] flex-1">Dashboard</span>
            </button>

            {/* Diario de hoy */}
            <button
              onClick={() => onSelectNav?.("diario_hoy")}
              className={`h-10 rounded-[10px] flex items-center justify-between px-3 text-left transition cursor-pointer ${
                activeNav === "diario_hoy"
                  ? "bg-pink-50/80 text-pink-700 font-bold border border-pink-200/60 shadow-xs"
                  : "text-text-secondary font-medium hover:bg-surface-2"
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-[18px] h-[18px] text-pink-500" />
                <span className="text-[13px]">Diario de hoy</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-pink-100/80 text-pink-600">
                8/15
              </span>
            </button>

            {/* Semana */}
            <button
              onClick={() => onSelectNav?.("semana")}
              className={`h-10 rounded-[10px] flex items-center gap-3 px-3 text-left transition cursor-pointer ${
                activeNav === "semana"
                  ? "bg-pink-50/80 text-pink-700 font-bold border border-pink-200/60 shadow-xs"
                  : "text-text-secondary font-medium hover:bg-surface-2"
              }`}
            >
              <CalendarDays className="w-[18px] h-[18px] text-text-tertiary" />
              <span className="text-[13px] flex-1">Semana</span>
            </button>

            {/* Parrilla IG */}
            <button
              onClick={() => onSelectNav?.("parrilla_ig")}
              className={`h-10 rounded-[10px] flex items-center gap-3 px-3 text-left transition cursor-pointer ${
                activeNav === "parrilla_ig"
                  ? "bg-pink-50/80 text-pink-700 font-bold border border-pink-200/60 shadow-xs"
                  : "text-text-secondary font-medium hover:bg-surface-2"
              }`}
            >
              <LayoutGrid className="w-[18px] h-[18px] text-text-tertiary" />
              <span className="text-[13px] flex-1">Parrilla IG</span>
            </button>
          </div>

          {/* Sección: MARCAS */}
          <div className="flex flex-col gap-1">
            <div className="text-[10px] font-bold text-text-tertiary tracking-widest mb-2">
              MARCAS
            </div>
            {[
              { name: "Casa Luifer", target: "56 / sem", color: "#ec4899" },
              { name: "Montana", target: "39 / sem", color: "#3b82f6" },
            ].map((brand) => {
              const isSelected = activeProjectName === brand.name;
              return (
                <button
                  key={brand.name}
                  onClick={() => onSelectProjectName?.(brand.name)}
                  className={`h-10 rounded-[10px] flex items-center justify-between px-3 text-left transition cursor-pointer text-[12.5px] ${
                    isSelected
                      ? "bg-surface-2 text-text-primary font-bold"
                      : "text-text-secondary font-medium hover:bg-surface-2"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: brand.color }}
                    />
                    <span className="truncate">{brand.name}</span>
                  </div>
                  <span className="text-[11px] text-text-tertiary font-medium">
                    {brand.target}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : isAudiovisual ? (
        <div className="flex flex-col gap-6 flex-1">
          {/* Tarjeta de usuario destacada de Andrés M. con icono Cámara */}
          <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-2xs shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-[13.5px] font-bold text-text-primary truncate">
                Andrés M.
              </div>
              <div className="text-[11px] font-semibold text-indigo-600 truncate">
                Creador Audiovisual AI
              </div>
            </div>
          </div>

          {/* Sección: MI DÍA */}
          <div className="flex flex-col gap-1">
            <div className="text-[10px] font-bold text-text-tertiary tracking-widest mb-2">
              MI DÍA
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
            {["Casa Luifer"].map((proj) => {
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

      {/* User Footer limpio original */}
      <div className="h-14 rounded-xl bg-surface-2 flex items-center justify-between px-3 shrink-0 border border-transparent hover:border-border transition">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-[12px] shrink-0 ${
              isCommunity
                ? "bg-pink-500"
                : isAudiovisual
                ? "bg-[#4f46e5]"
                : "bg-accent"
            }`}
          >
            {initials}
          </div>
          <div className="flex-1 leading-tight min-w-0">
            <div className="text-[13px] font-semibold text-text-primary truncate">
              {displayName}
            </div>
            <div className="text-[11px] text-text-tertiary truncate">
              {roleLabel}
            </div>
          </div>
        </div>

        {onLogout ? (
          <button
            type="button"
            onClick={onLogout}
            title="Cerrar sesión"
            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface transition cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ChevronsUpDown className="w-4 h-4 text-text-tertiary shrink-0" />
        )}
      </div>
    </aside>
  );
}

