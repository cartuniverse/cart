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
  Sparkles,
  LayoutDashboard,
  LogOut,
  Sun,
  Moon,
  Activity,
  Crown,
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
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/use-theme";
import { Flame, Palette } from "lucide-react";
import { getDailyCommunityLog, getDailyDesignLog, getDailyVideoLog } from "@/lib/supabase";
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
  currentRoleView?: "admin" | "audiovisual" | "community" | "designer" | "director";
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
  const isDesigner = currentRoleView === "designer";
  const isDirector = currentRoleView === "director";
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  // Conteos diarios reales para el badge de "Diario de hoy"
  const [cmTodayCount, setCmTodayCount] = useState<number>(0);
  const [avTodayCount, setAvTodayCount] = useState<number>(0);
  const [designerTodayCount, setDesignerTodayCount] = useState<number>(0);

  useEffect(() => {
    let active = true;
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const refreshCounts = () => {
      if (isCommunity) {
        getDailyCommunityLog(todayIso, activeProjectName).then((log) => {
          if (!active) return;
          if (log) {
            const total =
              (log.formatHistoriaOrganica ?? 0) +
              (log.formatHistoriaProducto ?? 0) +
              (log.formatHistoriaInteractiva ?? 0) +
              (log.formatFeedOrganico ?? 0) +
              (log.formatFeedCreativo ?? 0) +
              (log.formatVideoTestimonio ?? 0) +
              (log.formatCarrusel ?? 0) +
              (log.formatPost ?? 0);
            setCmTodayCount(total);
          } else {
            setCmTodayCount(0);
          }
        });
      } else if (isAudiovisual) {
        getDailyVideoLog(todayIso, activeProjectName).then((log) => {
          if (!active) return;
          if (log) {
            const total =
              log.formatDisneySub30 +
              log.formatDisneyGala +
              log.formatMovimiento +
              log.formatAvatarYapping;
            setAvTodayCount(total);
          } else {
            setAvTodayCount(0);
          }
        });
      } else if (isDesigner) {
        const designerId = profile?.id || "designer";
        getDailyDesignLog(todayIso, designerId).then((log) => {
          if (!active) return;
          if (log) {
            const total =
              (log.formatClHistorias ?? 0) +
              (log.formatClMovimiento ?? 0) +
              (log.formatClPost ?? 0) +
              (log.formatClHistoriaProducto ?? 0) +
              (log.formatClHistoriaInteractiva ?? 0) +
              (log.formatMtHistorias ?? 0) +
              (log.formatMtCarruseles ?? 0);
            setDesignerTodayCount(total);
          } else {
            setDesignerTodayCount(0);
          }
        });
      }
    };

    refreshCounts();

    if (typeof window !== "undefined") {
      window.addEventListener("daily_log_updated", refreshCounts);
      return () => {
        active = false;
        window.removeEventListener("daily_log_updated", refreshCounts);
      };
    }

    return () => {
      active = false;
    };
  }, [isCommunity, isAudiovisual, isDesigner, activeProjectName, activeNav, profile?.id]);

  // Metas diarias sugeridas para cada marca
  const cmDailyTarget = activeProjectName === "Montana" ? 8 : 11;

  // Nombre e iniciales según la vista
  const displayName = isCommunity
    ? (profile?.name ?? "Lizz")
    : isAudiovisual
      ? "Andrés M."
      : isDesigner
        ? (profile?.name ?? "Diseñador")
        : isDirector
          ? (profile?.name ?? (profile?.email?.toLowerCase().includes("david") ? "David S." : "Director"))
          : profile?.name ?? "Cristian A.";

  const roleLabel = isCommunity
    ? "Community Manager"
    : isAudiovisual
      ? "Creador Audiovisual AI"
      : isDesigner
        ? "Diseñador AI"
        : isDirector
          ? "Director de Área"
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
            <div className="text-[15px] font-bold text-text-primary">Cart</div>
            <div className="text-[11px] font-medium text-text-tertiary">
              {isAudiovisual || isCommunity ? "Mi diario" : isDirector ? "Seguimiento" : "Mi equipo"}
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
        <div className="flex flex-col gap-1 flex-1">
          <div className="text-[10px] font-bold text-text-tertiary tracking-widest mb-2">
            VISTAS
          </div>

          {/* Dashboard */}
          <button
            onClick={() => onSelectNav?.("dashboard")}
            className={`h-10 rounded-[10px] flex items-center gap-3 px-3 text-left transition cursor-pointer ${
              activeNav === "dashboard"
                ? "bg-accent-soft text-text-primary font-bold shadow-xs"
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
                ? "bg-accent-soft text-text-primary font-bold shadow-xs"
                : "text-text-secondary font-medium hover:bg-surface-2"
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-[18px] h-[18px] text-pink-500" />
              <span className="text-[13px]">Diario de hoy</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100/80 text-pink-600 border border-pink-200/50">
              {cmTodayCount}/{cmDailyTarget}
            </span>
          </button>
        </div>
      ) : isDesigner ? (
        <div className="flex flex-col gap-1 flex-1">
          <div className="text-[10px] font-bold text-text-tertiary tracking-widest mb-2">
            VISTAS
          </div>

          {/* Plan continuo */}
          <button
            onClick={() => onSelectNav?.("plan_continuo")}
            className={`h-10 rounded-[10px] flex items-center justify-between px-3 text-left transition cursor-pointer ${
              activeNav === "plan_continuo"
                ? "bg-accent-soft text-text-primary font-bold shadow-xs"
                : "text-text-secondary font-medium hover:bg-surface-2"
            }`}
          >
            <div className="flex items-center gap-3">
              <Flame className="w-[18px] h-[18px] text-amber-500" />
              <span className="text-[13px]">Plan continuo</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-700 border border-amber-200/50">
              {designerTodayCount}/6
            </span>
          </button>
        </div>
      ) : isAudiovisual ? (
        <div className="flex flex-col gap-1 flex-1">
          <div className="text-[10px] font-bold text-text-tertiary tracking-widest mb-2">
            VISTAS
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
            <LayoutDashboard className="w-[18px] h-[18px] text-indigo-500" />
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
              <Calendar className="w-[18px] h-[18px] text-indigo-500" />
              <span className="text-[13px]">Diario de hoy</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-surface-2 text-text-secondary border border-border">
              {avTodayCount}/3
            </span>
          </button>
        </div>
      ) : isDirector ? (
        /* Navegación del Director de Área (David) simplificada */
        <div className="flex flex-col gap-1 flex-1">
          <div className="text-[10px] font-bold text-text-tertiary tracking-widest mb-2">
            VISTAS
          </div>

          <button
            onClick={() => onSelectNav?.("seguimiento")}
            className={`h-10 rounded-[10px] flex items-center gap-3 px-3 text-left transition cursor-pointer ${
              activeNav === "seguimiento"
                ? "bg-accent-soft text-text-primary font-bold shadow-xs"
                : "text-text-secondary font-medium hover:bg-surface-2"
            }`}
          >
            <Activity className="w-[18px] h-[18px] text-indigo-500" />
            <span className="text-[13px] flex-1">Seguimiento</span>
          </button>
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
                className={`h-10 rounded-[10px] flex items-center gap-3 px-3 text-left transition cursor-pointer ${isActive
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
                  : isDesigner
                    ? "bg-violet-600"
                    : isDirector
                      ? "bg-emerald-600"
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

