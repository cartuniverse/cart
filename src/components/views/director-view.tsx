"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { fadeInUp, staggerContainer } from "@/lib/motion-variants";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Flame,
  LayoutGrid,
  Loader2,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Video,
} from "lucide-react";
import { getWeeklyAllDesignLogs } from "@/lib/supabase";
import type { DailyDesignLog } from "@/lib/types";

// ─── Plan semanal (mismo que designer-daily-view) ────────────────────────────
type DayPlan = {
  label: string;
  shortLabel: string;
  clTheme: string;
  isCreativo: boolean;
  creativoTag?: string;
  dayColor: string;
  cl: { key: keyof DailyDesignLog; title: string }[];
  mt: { key: keyof DailyDesignLog; title: string }[];
};

const WEEK_PLAN: Record<number, DayPlan> = {
  1: {
    label: "Lunes", shortLabel: "L", clTheme: "Traje hombre",
    isCreativo: false, dayColor: "#4a6fa5",
    cl: [
      { key: "formatClHistorias", title: "Orgánico" },
      { key: "formatClMovimiento", title: "Carrusel" },
      { key: "formatClPost", title: "Testimonio" },
    ],
    mt: [
      { key: "formatMtHistorias", title: "Orgánico producto" },
      { key: "formatMtCarruseles", title: "Historia producto" },
    ],
  },
  2: {
    label: "Martes", shortLabel: "M", clTheme: "Novias",
    isCreativo: true, creativoTag: "Creativo 1/2", dayColor: "#a04e6a",
    cl: [
      { key: "formatClHistorias", title: "Orgánico" },
      { key: "formatClMovimiento", title: "Creativo" },
      { key: "formatClPost", title: "Post feed" },
    ],
    mt: [
      { key: "formatMtHistorias", title: "Historia interactiva" },
      { key: "formatMtCarruseles", title: "Carrusel MT" },
    ],
  },
  3: {
    label: "Miércoles", shortLabel: "Mi", clTheme: "Quinces",
    isCreativo: false, dayColor: "#6a5a9e",
    cl: [
      { key: "formatClHistorias", title: "Orgánico" },
      { key: "formatClMovimiento", title: "Carrusel" },
      { key: "formatClPost", title: "Testimonio" },
    ],
    mt: [
      { key: "formatMtHistorias", title: "Orgánico producto" },
      { key: "formatMtCarruseles", title: "Historia producto" },
    ],
  },
  4: {
    label: "Jueves", shortLabel: "J", clTheme: "Primera comunión",
    isCreativo: true, creativoTag: "Creativo 2/2", dayColor: "#3d7a60",
    cl: [
      { key: "formatClHistorias", title: "Orgánico" },
      { key: "formatClMovimiento", title: "Creativo" },
      { key: "formatClPost", title: "Post feed" },
    ],
    mt: [
      { key: "formatMtHistorias", title: "Historia interactiva" },
      { key: "formatMtCarruseles", title: "Carrusel MT" },
    ],
  },
  5: {
    label: "Viernes", shortLabel: "V", clTheme: "Creativo libre",
    isCreativo: false, dayColor: "#b07a3c",
    cl: [
      { key: "formatClHistorias", title: "Orgánico" },
      { key: "formatClMovimiento", title: "Carrusel" },
      { key: "formatClPost", title: "Testimonio" },
    ],
    mt: [
      { key: "formatMtHistorias", title: "Orgánico producto" },
      { key: "formatMtCarruseles", title: "Historia producto" },
    ],
  },
};

const CL_PLAN_WEEK = 15;
const MT_PLAN_WEEK = 10;
const PLAN_DIA = 5;

// ─── Helpers de fecha ────────────────────────────────────────────────────────
function formatDateDisplay(d: Date): string {
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekDays(d: Date): Date[] {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return Array.from({ length: 5 }, (_, i) => {
    const nd = new Date(mon);
    nd.setDate(mon.getDate() + i);
    return nd;
  });
}

function logTotal(l: DailyDesignLog) {
  return (
    (l.formatClHistorias ?? 0) +
    (l.formatClMovimiento ?? 0) +
    (l.formatClPost ?? 0) +
    (l.formatMtHistorias ?? 0) +
    (l.formatMtCarruseles ?? 0)
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export function DirectorView() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [weeklyLogs, setWeeklyLogs] = useState<DailyDesignLog[]>([]);
  const [loading, setLoading] = useState(true);

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const weekISOs = useMemo(() => weekDays.map(toISO), [weekDays]);
  const currentISO = toISO(selectedDate);
  const dow = selectedDate.getDay();
  const todayPlan = WEEK_PLAN[dow] ?? WEEK_PLAN[1];

  useEffect(() => {
    setLoading(true);
    getWeeklyAllDesignLogs(weekISOs).then((logs) => {
      setWeeklyLogs(logs);
      setLoading(false);
    });

    if (typeof window !== "undefined") {
      const handler = () => {
        getWeeklyAllDesignLogs(weekISOs).then(setWeeklyLogs);
      };
      window.addEventListener("daily_log_updated", handler);
      return () => window.removeEventListener("daily_log_updated", handler);
    }
  }, [weekISOs.join(",")]);

  // Log de hoy del diseñador (toma el primero si hay varios)
  const todayLog = weeklyLogs.find((l) => l.date === currentISO) ?? null;

  const clHoy = (todayLog?.formatClHistorias ?? 0) + (todayLog?.formatClMovimiento ?? 0) + (todayLog?.formatClPost ?? 0);
  const mtHoy = (todayLog?.formatMtHistorias ?? 0) + (todayLog?.formatMtCarruseles ?? 0);
  const totalHoy = clHoy + mtHoy;

  const { clSem, mtSem, clPct, mtPct } = useMemo(() => {
    let cl = 0, mt = 0;
    weeklyLogs.forEach((l) => {
      cl += (l.formatClHistorias ?? 0) + (l.formatClMovimiento ?? 0) + (l.formatClPost ?? 0);
      mt += (l.formatMtHistorias ?? 0) + (l.formatMtCarruseles ?? 0);
    });
    return {
      clSem: cl,
      mtSem: mt,
      clPct: Math.min(100, Math.round((cl / CL_PLAN_WEEK) * 100)),
      mtPct: Math.min(100, Math.round((mt / MT_PLAN_WEEK) * 100)),
    };
  }, [weeklyLogs]);

  const dayTotals = weekDays.map((d) => {
    const iso = toISO(d);
    const log = weeklyLogs.find((l) => l.date === iso);
    return log ? logTotal(log) : 0;
  });

  const designerName = todayLog?.designerName ?? "Diseñador AI";
  const designerInitials = designerName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  const behindToday = totalHoy < PLAN_DIA && dow >= 1 && dow <= 5;
  const pendingFormats = todayPlan.cl
    .filter((f) => (todayLog?.[f.key] as number ?? 0) < 1)
    .map((f) => `CL · ${f.title}`)
    .concat(
      todayPlan.mt
        .filter((f) => (todayLog?.[f.key] as number ?? 0) < 1)
        .map((f) => `MT · ${f.title}`)
    );

  return (
    <div className="flex-1 h-full flex flex-col min-w-0 bg-bg overflow-hidden">

      {/* ── Navbar ── */}
      <header className="h-[60px] shrink-0 bg-surface border-b border-[var(--border)] px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 text-[11.5px] min-w-0">
          <span className="text-text-tertiary font-medium">Mi espacio</span>
          <span className="text-text-tertiary mx-1">›</span>
          <span className="text-text-primary font-semibold">Seguimiento del equipo</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Navegación de fecha */}
          <div className="h-8 rounded-xl bg-surface border border-[var(--border)] px-2 flex items-center gap-1 shadow-2xs">
            <button
              onClick={() => setSelectedDate((p) => { const n = new Date(p); n.setDate(p.getDate() - 1); return n; })}
              className="w-5 h-5 rounded flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1 px-1 text-[11px] font-semibold text-text-primary whitespace-nowrap">
              <CalendarIcon className="w-3 h-3 text-text-tertiary" />
              {formatDateDisplay(selectedDate)}
            </div>
            <button
              onClick={() => setSelectedDate((p) => { const n = new Date(p); n.setDate(p.getDate() + 1); return n; })}
              className="w-5 h-5 rounded flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="h-8 px-3 rounded-xl bg-amber-50 text-amber-700 text-[11px] font-semibold hover:bg-amber-100 transition cursor-pointer border border-amber-100"
          >
            Hoy
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto p-5">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center h-40 gap-2 text-text-tertiary text-sm"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando datos del equipo...
            </motion.div>
          ) : (
            <motion.div
              key={currentISO}
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="max-w-[1340px] mx-auto flex flex-col lg:flex-row gap-5 items-start"
            >

              {/* ════════ COLUMNA IZQUIERDA ════════ */}
              <div className="flex-1 min-w-0 flex flex-col gap-4">

                {/* Stats */}
                <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    {
                      icon: <Flame className="w-3.5 h-3.5" />,
                      iconBg: "#fef3c7", iconColor: "#d97706",
                      label: "Creadas hoy",
                      value: `${totalHoy}`,
                      sub: `Meta: ${PLAN_DIA} piezas`,
                      accent: totalHoy >= PLAN_DIA ? "#10b981" : totalHoy > 0 ? "#f59e0b" : "#ef4444",
                    },
                    {
                      icon: <span className="text-[9px] font-black">CL</span>,
                      iconBg: "#fdf2f8", iconColor: "#ec4899",
                      label: "CL · semana",
                      value: `${clSem}`,
                      sub: `Plan: ${CL_PLAN_WEEK} piezas`,
                      accent: "#ec4899",
                    },
                    {
                      icon: <span className="text-[9px] font-black">MT</span>,
                      iconBg: "#eff6ff", iconColor: "#3b82f6",
                      label: "MT · semana",
                      value: `${mtSem}`,
                      sub: `Plan: ${MT_PLAN_WEEK} piezas`,
                      accent: "#3b82f6",
                    },
                    {
                      icon: behindToday ? <span className="text-[10px]">⚠</span> : <span className="text-[10px]">✓</span>,
                      iconBg: behindToday ? "#fee2e2" : "#dcfce7", iconColor: behindToday ? "#ef4444" : "#10b981",
                      label: "Estado hoy",
                      value: behindToday ? `${PLAN_DIA - totalHoy}` : "Al día",
                      sub: behindToday ? "piezas pendientes" : "Plan completado",
                      accent: behindToday ? "#ef4444" : "#10b981",
                    },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl bg-surface border border-[var(--border)] p-4 shadow-2xs flex flex-col gap-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: s.iconBg, color: s.iconColor }}>
                          {s.icon}
                        </div>
                        <span className="text-[11px] font-semibold text-text-secondary leading-tight">{s.label}</span>
                      </div>
                      <div>
                        <div className="text-[26px] font-bold leading-none" style={{ color: s.accent }}>{s.value}</div>
                        <div className="text-[10px] text-text-tertiary mt-1">{s.sub}</div>
                      </div>
                    </div>
                  ))}
                </motion.div>

                {/* Sección equipo */}
                <motion.div variants={fadeInUp} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                    Equipo · Entregas de hoy
                  </span>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                  {todayPlan.isCreativo && (
                    <span className="h-5 px-2 rounded-full bg-amber-50 text-amber-700 text-[9.5px] font-bold flex items-center gap-1 border border-amber-200">
                      <Sparkles className="w-2.5 h-2.5" />
                      {todayPlan.creativoTag}
                    </span>
                  )}
                </motion.div>

                {/* ── Tarjeta del Diseñador AI ── */}
                <motion.div variants={fadeInUp} className="rounded-2xl bg-surface border border-[var(--border)] shadow-2xs overflow-hidden">

                  {/* Header del miembro */}
                  <div className="px-5 py-4 flex items-center gap-4 border-b border-[var(--border)]">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-white font-bold text-[13px]"
                      style={{ backgroundColor: "#6366f1" }}>
                      {designerInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-bold text-text-primary">{designerName}</span>
                        <span className="h-5 px-2 rounded-full bg-violet-50 text-violet-700 text-[9.5px] font-bold flex items-center border border-violet-200">
                          Diseñador AI
                        </span>
                        {todayPlan.isCreativo ? (
                          <span className="h-5 px-2 rounded-full bg-amber-50 text-amber-700 text-[9.5px] font-bold flex items-center gap-1 border border-amber-200">
                            <Sparkles className="w-2.5 h-2.5" />
                            {todayPlan.creativoTag}
                          </span>
                        ) : (
                          <span className="h-5 px-2 rounded-full text-[9.5px] font-bold flex items-center gap-1 border"
                            style={{ backgroundColor: "#fdf2f8", color: "#ec4899", borderColor: "#fce7f3" }}>
                            <Flame className="w-2.5 h-2.5" />
                            Día Orgánico
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-tertiary mt-0.5">
                        Casa Luífer + Montana · 3 CL + 2 MT/día · CL: {todayPlan.clTheme}
                      </div>
                    </div>
                    {/* Chips resumen */}
                    <div className="flex items-center gap-2 shrink-0">
                      {[
                        { label: "Hoy", value: `${totalHoy}/${PLAN_DIA}`, color: totalHoy >= PLAN_DIA ? "#10b981" : "#f59e0b" },
                        { label: "CL sem", value: `${clSem}/${CL_PLAN_WEEK}`, color: "#ec4899" },
                        { label: "MT sem", value: `${mtSem}/${MT_PLAN_WEEK}`, color: "#3b82f6" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="w-[64px] h-[48px] rounded-xl bg-surface-2/60 border border-[var(--border)] flex flex-col items-center justify-center gap-0.5">
                          <span className="text-[14px] font-bold leading-tight" style={{ color }}>{value}</span>
                          <span className="text-[9px] font-medium text-text-tertiary">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cuerpo: CL + MT */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">

                    {/* Casa Luífer */}
                    <div className="rounded-xl border p-3 flex flex-col gap-3"
                      style={{ backgroundColor: "#fdf2f8", borderColor: "#fce7f3" }}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[9px] font-bold"
                          style={{ backgroundColor: "#ec4899" }}>CL</div>
                        <span className="text-[12px] font-bold flex-1" style={{ color: "#ec4899" }}>Casa Luífer</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
                          style={{ backgroundColor: "#ec489915", color: "#ec4899" }}>
                          {clHoy}/3 hoy
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {todayPlan.cl.map((f) => {
                          const done = (todayLog?.[f.key] as number ?? 0) >= 1;
                          const count = todayLog?.[f.key] as number ?? 0;
                          return (
                            <div key={String(f.key)} className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-emerald-500" : "bg-surface-2 border border-[var(--border)]"}`}>
                                {done && <span className="text-white text-[8px] font-bold">✓</span>}
                              </div>
                              <span className={`text-[11px] flex-1 ${done ? "text-text-primary font-semibold" : "text-text-tertiary"}`}>
                                {f.title}
                              </span>
                              <span className="text-[11px] font-bold" style={{ color: done ? "#ec4899" : "var(--text-tertiary)" }}>
                                ×{count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {/* Barra CL */}
                      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: "#fce7f3" }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (clHoy / 3) * 100)}%`, backgroundColor: "#ec4899" }} />
                      </div>
                    </div>

                    {/* Montana */}
                    <div className="rounded-xl border p-3 flex flex-col gap-3"
                      style={{ backgroundColor: "#eff6ff", borderColor: "#dbeafe" }}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[9px] font-bold"
                          style={{ backgroundColor: "#3b82f6" }}>MT</div>
                        <span className="text-[12px] font-bold flex-1" style={{ color: "#3b82f6" }}>Montana</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
                          style={{ backgroundColor: "#3b82f615", color: "#3b82f6" }}>
                          {mtHoy}/2 hoy
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {todayPlan.mt.map((f) => {
                          const done = (todayLog?.[f.key] as number ?? 0) >= 1;
                          const count = todayLog?.[f.key] as number ?? 0;
                          return (
                            <div key={String(f.key)} className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-emerald-500" : "bg-surface-2 border border-[var(--border)]"}`}>
                                {done && <span className="text-white text-[8px] font-bold">✓</span>}
                              </div>
                              <span className={`text-[11px] flex-1 ${done ? "text-text-primary font-semibold" : "text-text-tertiary"}`}>
                                {f.title}
                              </span>
                              <span className="text-[11px] font-bold" style={{ color: done ? "#3b82f6" : "var(--text-tertiary)" }}>
                                ×{count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {/* Barra MT */}
                      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: "#dbeafe" }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (mtHoy / 2) * 100)}%`, backgroundColor: "#3b82f6" }} />
                      </div>
                    </div>
                  </div>

                  {/* Strip semanal */}
                  <div className="mx-4 mb-4 rounded-xl bg-surface-2/50 border border-[var(--border)] px-4 py-2.5 flex items-center gap-4">
                    {[
                      { label: "CL · semana", value: `${clSem}/${CL_PLAN_WEEK}`, pct: clPct, color: "#ec4899" },
                      { label: "MT · semana", value: `${mtSem}/${MT_PLAN_WEEK}`, pct: mtPct, color: "#3b82f6" },
                    ].map((item, i) => (
                      <>
                        {i > 0 && <div key={`div-${i}`} className="w-px h-6 bg-[var(--border)]" />}
                        <div key={item.label} className="flex-1 flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold" style={{ color: item.color }}>{item.label}</span>
                            <span className="text-[11px] font-bold" style={{ color: item.color }}>{item.value}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                          </div>
                        </div>
                      </>
                    ))}
                    <div className="text-[11px] font-bold text-text-tertiary shrink-0">
                      {clPct + mtPct > 0 ? `${Math.round((clSem + mtSem) / (CL_PLAN_WEEK + MT_PLAN_WEEK) * 100)}%` : "0%"}
                    </div>
                  </div>
                </motion.div>

                {/* Alertas de pendientes */}
                {behindToday && pendingFormats.length > 0 && (
                  <motion.div variants={fadeInUp}
                    className="rounded-2xl border border-red-200 bg-red-50 p-4 flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 text-[13px]">⚠</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">Pendientes hoy</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {pendingFormats.map((f) => (
                        <span key={f} className="h-6 px-2.5 rounded-full bg-white border border-red-200 text-[10.5px] font-semibold text-red-600 flex items-center">
                          {f}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* ════════ PANEL DERECHO ════════ */}
              <motion.div variants={fadeInUp} className="w-full lg:w-[310px] shrink-0 flex flex-col gap-3.5">

                {/* HOY · PLAN ACTIVO */}
                <div className="rounded-2xl bg-surface border border-[var(--border)] overflow-hidden shadow-2xs">
                  <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2 bg-surface-2/40">
                    <CalendarIcon className="w-3.5 h-3.5 text-text-tertiary" />
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-text-secondary">
                      Hoy · Plan activo
                    </span>
                  </div>
                  <div className="p-3 flex flex-col gap-2.5">
                    {/* Día tipo */}
                    <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl"
                      style={{ backgroundColor: todayPlan.isCreativo ? "#fef3c7" : "#fdf2f8" }}>
                      {todayPlan.isCreativo
                        ? <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        : <Flame className="w-3.5 h-3.5 shrink-0" style={{ color: "#ec4899" }} />}
                      <span className="text-[11px] font-bold"
                        style={{ color: todayPlan.isCreativo ? "#d97706" : "#ec4899" }}>
                        {todayPlan.label} · {todayPlan.isCreativo ? todayPlan.creativoTag : "Día Orgánico"}
                      </span>
                    </div>

                    {/* CL */}
                    <div className="rounded-xl p-2.5 flex flex-col gap-1.5" style={{ backgroundColor: "#fdf2f8" }}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded flex items-center justify-center text-white text-[7px] font-bold" style={{ backgroundColor: "#ec4899" }}>CL</div>
                        <span className="text-[10px] font-bold" style={{ color: "#ec4899" }}>Casa Luífer · 3 piezas</span>
                      </div>
                      {todayPlan.cl.map((f) => (
                        <div key={String(f.key)} className="flex items-center gap-1.5 text-[10.5px] text-text-secondary pl-1">
                          <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: "#ec4899" }} />
                          {f.title}
                        </div>
                      ))}
                    </div>

                    {/* MT */}
                    <div className="rounded-xl p-2.5 flex flex-col gap-1.5" style={{ backgroundColor: "#eff6ff" }}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded flex items-center justify-center text-white text-[7px] font-bold" style={{ backgroundColor: "#3b82f6" }}>MT</div>
                        <span className="text-[10px] font-bold" style={{ color: "#3b82f6" }}>Montana · 2 piezas</span>
                      </div>
                      {todayPlan.mt.map((f) => (
                        <div key={String(f.key)} className="flex items-center gap-1.5 text-[10.5px] text-text-secondary pl-1">
                          <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: "#3b82f6" }} />
                          {f.title}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AVANCE SEMANAL */}
                <div className="rounded-2xl bg-surface border border-[var(--border)] p-4 flex flex-col gap-3.5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-text-secondary">Avance semanal</span>
                  </div>

                  {[
                    { name: "Casa Luífer", done: clSem, goal: CL_PLAN_WEEK, pct: clPct, color: "#ec4899" },
                    { name: "Montana", done: mtSem, goal: MT_PLAN_WEEK, pct: mtPct, color: "#3b82f6" },
                  ].map((b) => (
                    <div key={b.name} className="flex items-center gap-3">
                      <div className="relative w-[48px] h-[48px] shrink-0">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3.4" />
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke={b.color} strokeWidth="3.4"
                            strokeDasharray={`${b.pct} 100`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[8.5px] font-bold text-text-primary">{b.pct}%</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-text-tertiary">{b.name}</div>
                        <div className="text-[15px] font-bold text-text-primary">{b.done} / {b.goal}</div>
                        <div className="h-1.5 w-full bg-surface-2 rounded-full mt-1 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${b.pct}%`, backgroundColor: b.color }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ESTA SEMANA L-V */}
                <div className="rounded-2xl bg-surface border border-[var(--border)] p-4 flex flex-col gap-3 shadow-2xs">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-text-secondary">Esta semana · L–V</span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {weekDays.map((dayDate, idx) => {
                      const dayISO = toISO(dayDate);
                      const isCur = dayISO === currentISO;
                      const cnt = dayTotals[idx];
                      const plan = WEEK_PLAN[idx + 1];
                      return (
                        <motion.button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedDate(dayDate)}
                          whileHover={{ scale: 1.06 }}
                          whileTap={{ scale: 0.94 }}
                          className={`h-[52px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition cursor-pointer border ${
                            isCur ? "bg-amber-50 border-amber-200" : "bg-surface-2/30 border-[var(--border)] hover:bg-surface-2"
                          }`}
                        >
                          <span className="text-[8.5px] font-bold uppercase"
                            style={{ color: isCur ? "#d97706" : plan?.dayColor ?? "var(--text-tertiary)" }}>
                            {plan?.shortLabel ?? ""}
                          </span>
                          <span className={`text-[13px] font-bold ${isCur ? "text-amber-700" : "text-text-primary"}`}>
                            {cnt}
                          </span>
                          {cnt >= PLAN_DIA && <span className="text-[7.5px] text-emerald-500 font-bold">✓</span>}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Reglas del plan */}
                <div className="rounded-2xl bg-surface border border-[var(--border)] p-4 flex flex-col gap-2.5 shadow-2xs">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-text-tertiary">Reglas del plan</span>
                  <div className="flex flex-col gap-1.5">
                    {[
                      "5 piezas / día · 25 piezas / semana",
                      "3 CL · 2 MT por día",
                      "Mar & Jue → días creativos (Disney/Yapping)",
                      "Lun/Mié/Vie → Org. + Carrusel + Testimonio",
                      "Solo Instagram · Lunes a viernes",
                    ].map((r) => (
                      <div key={r} className="flex items-start gap-1.5 text-[10px] text-text-secondary leading-snug">
                        <span className="mt-1 w-1 h-1 rounded-full bg-text-tertiary shrink-0" />
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
