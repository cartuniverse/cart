"use client";

import {
  Share2,
  Users,
  FolderKanban,
  ListChecks,
  ChevronsUpDown,
  GitBranch,
} from "lucide-react";

const NAV = [
  { id: "organigrama", icon: Share2, label: "Organigrama" },
  { id: "tareas", icon: ListChecks, label: "Tareas" },
];

export function Sidebar({
  activeNav = "organigrama",
  onSelectNav,
}: {
  activeNav?: string;
  onSelectNav?: (navId: string) => void;
}) {
  return (
    <aside className="w-[260px] shrink-0 h-full bg-surface border-r border-[var(--border)] flex flex-col px-5 py-6 gap-6">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-black border border-border shadow-xs">
          <img src="/cart-logo.png" alt="Cart Logo" className="w-full h-full object-cover" />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-bold text-text-primary">Cart</div>
          <div className="text-[11px] font-medium text-text-tertiary">Mi equipo</div>
        </div>
      </div>

      {/* Nav section */}
      <div className="flex flex-col gap-1">
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

      <div className="flex-1" />

      {/* User */}
      <div className="h-14 rounded-xl bg-surface-2 flex items-center gap-2.5 px-2.5">
        <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
          <span className="text-[12px] font-bold text-white">CA</span>
        </div>
        <div className="flex-1 leading-tight">
          <div className="text-[13px] font-semibold text-text-primary">Cristian A.</div>
          <div className="text-[11px] text-text-tertiary">Mi cuenta</div>
        </div>
        <ChevronsUpDown className="w-3.5 h-3.5 text-text-tertiary" />
      </div>
    </aside>
  );
}
