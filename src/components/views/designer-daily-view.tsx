"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { fadeInUp, popIn, staggerContainer } from "@/lib/motion-variants";
import {
  Calendar as CalendarIcon,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Image,
  LayoutGrid,
  Loader2,
  MessageSquare,
  Minus,
  Plus,
  Save,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import {
  getDailyDesignLog,
  getMonthlyDesignLogs,
  getWeeklyDesignLogs,
  saveDailyDesignLog,
  uploadDesignCapture,
} from "@/lib/supabase";
import type { DailyDesignLog } from "@/lib/types";

// ─── Tipos internos ───────────────────────────────────────────────────────────
type FormatKey = "clHistorias" | "clMovimiento" | "clPost" | "clHistoriaProducto" | "clHistoriaInteractiva" | "mtHistorias" | "mtCarruseles";
type CountsState = Record<FormatKey, number>;
type NotesState = Record<FormatKey, string>;

// ─── Plan semanal: información capturada de la imagen ─────────────────────────
// Distribución según la asignación: Samuel vs Miguel
type DayPlan = {
  label: string;
  shortLabel: string;
  clTheme: string;
  isCreativo: boolean;
  creativoTag?: string;
  dayColor: string;
  cl: { key: FormatKey; title: string; hint: string }[];
  mt: { key: FormatKey; title: string; hint: string }[];
};

// Cronograma de SAMUEL — CL alterna: Lun/Mié/Vie = Historia producto · Mar/Jue = Historia interactiva
const SAMUEL_WEEK_PLAN: Record<number, DayPlan> = {
  1: {
    label: "Lunes", shortLabel: "L",
    clTheme: "Traje hombre",
    isCreativo: false,
    dayColor: "#4a6fa5",
    cl: [
      { key: "clHistorias", title: "Orgánico traje", hint: "Traje hombre · story flat lay" },
      { key: "clMovimiento", title: "Carrusel", hint: "5–7 slides de producto" },
      { key: "clPost", title: "Testimonio", hint: "Review de cliente en feed" },
      { key: "clHistoriaProducto", title: "Historia producto", hint: "Historia de producto CL · story" },
    ],
    mt: [
      { key: "mtHistorias", title: "Orgánico producto", hint: "Catálogo editorial MT" },
      { key: "mtCarruseles", title: "Imagen producto (historia)", hint: "Imagen de producto story" },
    ],
  },
  2: {
    label: "Martes", shortLabel: "M",
    clTheme: "Novias",
    isCreativo: true,
    creativoTag: "Creativo 1/2",
    dayColor: "#a04e6a",
    cl: [
      { key: "clHistorias", title: "Orgánico novias", hint: "Novias · story editorial" },
      { key: "clMovimiento", title: "Creativo (Disney)", hint: "Video creativo Disney CL" },
      { key: "clPost", title: "Post", hint: "Publicación cuadrada/portrait" },
      { key: "clHistoriaInteractiva", title: "Historia interactiva", hint: "Encuesta o trivia CL · story" },
    ],
    mt: [
      { key: "mtHistorias", title: "Imagen interactiva (historia)", hint: "Trivia o encuesta MT" },
      { key: "mtCarruseles", title: "Carrusel", hint: "5–7 slides editorial MT" },
    ],
  },
  3: {
    label: "Miércoles", shortLabel: "Mi",
    clTheme: "Quinces",
    isCreativo: false,
    dayColor: "#6a5a9e",
    cl: [
      { key: "clHistorias", title: "Orgánico quince", hint: "Quinces · story flat lay" },
      { key: "clMovimiento", title: "Carrusel", hint: "5–7 slides de producto" },
      { key: "clPost", title: "Testimonio", hint: "Review de cliente en feed" },
      { key: "clHistoriaProducto", title: "Historia producto", hint: "Historia de producto CL · story" },
    ],
    mt: [
      { key: "mtHistorias", title: "Orgánico producto", hint: "Catálogo editorial MT" },
      { key: "mtCarruseles", title: "Imagen producto (historia)", hint: "Imagen de producto story" },
    ],
  },
  4: {
    label: "Jueves", shortLabel: "J",
    clTheme: "Primera comunión",
    isCreativo: true,
    creativoTag: "Creativo 2/2",
    dayColor: "#3d7a60",
    cl: [
      { key: "clHistorias", title: "Orgánico comunión", hint: "Primera comunión · story" },
      { key: "clMovimiento", title: "Creativo (Disney)", hint: "Video creativo Disney CL" },
      { key: "clPost", title: "Post", hint: "Publicación cuadrada/portrait" },
      { key: "clHistoriaInteractiva", title: "Historia interactiva", hint: "Encuesta o trivia CL · story" },
    ],
    mt: [
      { key: "mtHistorias", title: "Imagen interactiva (historia)", hint: "Trivia o encuesta MT" },
      { key: "mtCarruseles", title: "Carrusel", hint: "5–7 slides editorial MT" },
    ],
  },
  5: {
    label: "Viernes", shortLabel: "V",
    clTheme: "Creativo",
    isCreativo: false,
    dayColor: "#b07a3c",
    cl: [
      { key: "clHistorias", title: "Orgánico", hint: "Creativo libre · story CL" },
      { key: "clMovimiento", title: "Carrusel", hint: "5–7 slides de producto" },
      { key: "clPost", title: "Testimonio", hint: "Review de cliente en feed" },
      { key: "clHistoriaProducto", title: "Historia producto", hint: "Historia de producto CL · story" },
    ],
    mt: [
      { key: "mtHistorias", title: "Orgánico producto", hint: "Catálogo editorial MT" },
      { key: "mtCarruseles", title: "Imagen producto (historia)", hint: "Imagen de producto story" },
    ],
  },
};

// Cronograma de MIGUEL — CL alterna: Lun/Mié/Vie = Historia producto · Mar/Jue = Historia interactiva
const MIGUEL_WEEK_PLAN: Record<number, DayPlan> = {
  1: {
    label: "Lunes", shortLabel: "L",
    clTheme: "Traje hombre",
    isCreativo: true,
    creativoTag: "Creativo 1/3",
    dayColor: "#4a6fa5",
    cl: [
      { key: "clHistorias", title: "Orgánico traje", hint: "Traje hombre · story flat lay" },
      { key: "clMovimiento", title: "Creativo (yapping)", hint: "Video creativo Yapping CL" },
      { key: "clPost", title: "Post", hint: "Publicación en feed" },
      { key: "clHistoriaProducto", title: "Historia producto", hint: "Historia de producto CL · story" },
    ],
    mt: [
      { key: "mtHistorias", title: "Imagen interactiva (historia)", hint: "Trivia o encuesta MT" },
      { key: "mtCarruseles", title: "Carrusel", hint: "5–7 slides editorial MT" },
    ],
  },
  2: {
    label: "Martes", shortLabel: "M",
    clTheme: "Novias",
    isCreativo: false,
    dayColor: "#a04e6a",
    cl: [
      { key: "clHistorias", title: "Orgánico novias", hint: "Novias · story editorial" },
      { key: "clMovimiento", title: "Carrusel", hint: "5–7 slides de novias" },
      { key: "clPost", title: "Testimonio", hint: "Review de cliente en feed" },
      { key: "clHistoriaInteractiva", title: "Historia interactiva", hint: "Encuesta o trivia CL · story" },
    ],
    mt: [
      { key: "mtHistorias", title: "Orgánico producto", hint: "Catálogo editorial MT" },
      { key: "mtCarruseles", title: "Imagen producto (historia)", hint: "Imagen de producto story" },
    ],
  },
  3: {
    label: "Miércoles", shortLabel: "Mi",
    clTheme: "Quinces",
    isCreativo: true,
    creativoTag: "Creativo 2/3",
    dayColor: "#6a5a9e",
    cl: [
      { key: "clHistorias", title: "Orgánico quince", hint: "Quinces · story flat lay" },
      { key: "clMovimiento", title: "Creativo (yapping)", hint: "Video creativo Yapping CL" },
      { key: "clPost", title: "Post", hint: "Publicación en feed" },
      { key: "clHistoriaProducto", title: "Historia producto", hint: "Historia de producto CL · story" },
    ],
    mt: [
      { key: "mtHistorias", title: "Creativo (yapping)", hint: "Video creativo Yapping MT" },
      { key: "mtCarruseles", title: "Imagen interactiva (historia)", hint: "Trivia o encuesta MT" },
    ],
  },
  4: {
    label: "Jueves", shortLabel: "J",
    clTheme: "Primera comunión",
    isCreativo: false,
    dayColor: "#3d7a60",
    cl: [
      { key: "clHistorias", title: "Orgánico comunión", hint: "Primera comunión · story" },
      { key: "clMovimiento", title: "Carrusel", hint: "5–7 slides de comunión" },
      { key: "clPost", title: "Testimonio", hint: "Review de cliente en feed" },
      { key: "clHistoriaInteractiva", title: "Historia interactiva", hint: "Encuesta o trivia CL · story" },
    ],
    mt: [
      { key: "mtHistorias", title: "Orgánico producto", hint: "Catálogo editorial MT" },
      { key: "mtCarruseles", title: "Imagen producto (historia)", hint: "Imagen de producto story" },
    ],
  },
  5: {
    label: "Viernes", shortLabel: "V",
    clTheme: "Creativo",
    isCreativo: true,
    creativoTag: "Creativo 3/3",
    dayColor: "#b07a3c",
    cl: [
      { key: "clHistorias", title: "Orgánico", hint: "Creativo libre · story CL" },
      { key: "clMovimiento", title: "Creativo", hint: "Video creativo CL · Viernes" },
      { key: "clPost", title: "Post", hint: "Publicación en feed" },
      { key: "clHistoriaProducto", title: "Historia producto", hint: "Historia de producto CL · story" },
    ],
    mt: [
      { key: "mtHistorias", title: "Imagen interactiva (historia)", hint: "Trivia o encuesta MT" },
    ],
  },
};

// ─── Helpers de fecha ─────────────────────────────────────────────────────────
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
  return Array.from({ length: 5 }, (_, i) => { const nd = new Date(mon); nd.setDate(mon.getDate() + i); return nd; });
}

const emptyCounts = (): CountsState => ({ clHistorias: 0, clMovimiento: 0, clPost: 0, clHistoriaProducto: 0, clHistoriaInteractiva: 0, mtHistorias: 0, mtCarruseles: 0 });
const emptyNotes = (): NotesState => ({ clHistorias: "", clMovimiento: "", clPost: "", clHistoriaProducto: "", clHistoriaInteractiva: "", mtHistorias: "", mtCarruseles: "" });

// ─── Componente principal ─────────────────────────────────────────────────────
export function DesignerDailyView({
  designerId = "designer",
  designerName = "Diseñador",
  designerEmail,
}: {
  designerId?: string;
  designerName?: string;
  designerEmail?: string;
}) {
  // Determinar si es Miguel o Samuel según email, id o nombre
  const isMiguel = useMemo(() => {
    const s = `${designerEmail ?? ""} ${designerId} ${designerName}`.toLowerCase();
    return s.includes("miguel") || s.includes("bolivar");
  }, [designerEmail, designerId, designerName]);

  const activeWeekPlan = isMiguel ? MIGUEL_WEEK_PLAN : SAMUEL_WEEK_PLAN;
  const CL_PLAN_WEEK = 20; // 4 formatos CL/día × 5 días (alternando hist. producto / hist. interactiva)
  const MT_PLAN_WEEK = isMiguel ? 9 : 10;
  const TOTAL_PLAN_WEEK = isMiguel ? 29 : 30; // 20 CL + 9/10 MT

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    // Usar fecha actual local sin hardcodear
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  });
  const [counts, setCounts] = useState<CountsState>(emptyCounts);
  const [notes, setNotes] = useState<NotesState>(emptyNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [weeklyLogs, setWeeklyLogs] = useState<Record<string, DailyDesignLog>>({});
  const [monthLogs, setMonthLogs] = useState<Record<string, DailyDesignLog>>({});

  // Mes visible en el calendario mensual
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const weekISOs = useMemo(() => weekDays.map(toISO), [weekDays]);
  const currentISO = toISO(selectedDate);
  const dow = selectedDate.getDay(); // 0=dom … 6=sab
  const todayPlan: DayPlan = activeWeekPlan[dow] ?? activeWeekPlan[1];
  const clTodayTarget = todayPlan.cl.length;
  const mtTodayTarget = todayPlan.mt.length;
  const planDiaTotal = clTodayTarget + mtTodayTarget;

  // Cargar registro del día y semana actual
  useEffect(() => {
    getDailyDesignLog(currentISO, designerId).then((log) => {
      if (log) {
        setCounts({
          clHistorias: log.formatClHistorias,
          clMovimiento: log.formatClMovimiento,
          clPost: log.formatClPost ?? 0,
          clHistoriaProducto: log.formatClHistoriaProducto ?? 0,
          clHistoriaInteractiva: log.formatClHistoriaInteractiva ?? 0,
          mtHistorias: log.formatMtHistorias,
          mtCarruseles: log.formatMtCarruseles,
        });
        setNotes({
          clHistorias: log.notesClHistorias,
          clMovimiento: log.notesClMovimiento,
          clPost: log.notesClPost ?? "",
          clHistoriaProducto: log.notesClHistoriaProducto ?? "",
          clHistoriaInteractiva: log.notesClHistoriaInteractiva ?? "",
          mtHistorias: log.notesMtHistorias,
          mtCarruseles: log.notesMtCarruseles,
        });
      } else {
        setCounts(emptyCounts());
        setNotes(emptyNotes());
      }
      setHasUnsavedChanges(false);
    });
    getWeeklyDesignLogs(weekISOs, designerId).then(setWeeklyLogs);
  }, [currentISO, designerId, weekISOs]);

  // Sincronizar mes visible si se cambia de fecha a otro mes
  useEffect(() => {
    if (calendarMonth.getFullYear() !== selectedDate.getFullYear() || calendarMonth.getMonth() !== selectedDate.getMonth()) {
      setCalendarMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [selectedDate]);

  // Cargar registros mensuales para pintar el calendario
  useEffect(() => {
    getMonthlyDesignLogs(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, designerId).then(setMonthLogs);
  }, [calendarMonth, designerId]);

  const updateCount = (key: FormatKey, delta: number) => {
    setCounts((p) => ({ ...p, [key]: Math.max(0, p[key] + delta) }));
    setHasUnsavedChanges(true);
  };

  const updateNote = (key: FormatKey, value: string) => {
    setNotes((p) => ({ ...p, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saved = await saveDailyDesignLog({
        date: currentISO, designerId, designerName,
        formatClHistorias: counts.clHistorias, formatClMovimiento: counts.clMovimiento, formatClPost: counts.clPost,
        formatClHistoriaProducto: counts.clHistoriaProducto, formatClHistoriaInteractiva: counts.clHistoriaInteractiva,
        formatMtHistorias: counts.mtHistorias, formatMtCarruseles: counts.mtCarruseles,
        notesClHistorias: notes.clHistorias, notesClMovimiento: notes.clMovimiento, notesClPost: notes.clPost,
        notesClHistoriaProducto: notes.clHistoriaProducto, notesClHistoriaInteractiva: notes.clHistoriaInteractiva,
        notesMtHistorias: notes.mtHistorias, notesMtCarruseles: notes.mtCarruseles,
      });
      setWeeklyLogs((p) => ({ ...p, [currentISO]: saved }));
      setMonthLogs((p) => ({ ...p, [currentISO]: saved }));
      setHasUnsavedChanges(false);
      setShowSaved(true);
      if (typeof window !== "undefined") window.dispatchEvent(new Event("daily_log_updated"));
      setTimeout(() => setShowSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // Navegar semana anterior / siguiente
  const handlePrevWeek = () => {
    setSelectedDate((p) => {
      const n = new Date(p);
      n.setDate(p.getDate() - 7);
      return n;
    });
  };

  const handleNextWeek = () => {
    setSelectedDate((p) => {
      const n = new Date(p);
      n.setDate(p.getDate() + 7);
      return n;
    });
  };

  const totalHoy = counts.clHistorias + counts.clMovimiento + counts.clPost + counts.clHistoriaProducto + counts.clHistoriaInteractiva + counts.mtHistorias + counts.mtCarruseles;
  const clHoy = counts.clHistorias + counts.clMovimiento + counts.clPost + counts.clHistoriaProducto + counts.clHistoriaInteractiva;
  const mtHoy = counts.mtHistorias + counts.mtCarruseles;

  const weeklyAgg = useMemo(() => {
    let clSem = 0, mtSem = 0;
    weekISOs.forEach((d) => {
      if (d === currentISO) { clSem += clHoy; mtSem += mtHoy; }
      else {
        const l = weeklyLogs[d];
        if (l) {
          clSem += l.formatClHistorias + l.formatClMovimiento + (l.formatClPost ?? 0) + (l.formatClHistoriaProducto ?? 0) + (l.formatClHistoriaInteractiva ?? 0);
          mtSem += l.formatMtHistorias + l.formatMtCarruseles;
        }
      }
    });
    return {
      clSem, mtSem,
      clPct: Math.min(100, Math.round((clSem / CL_PLAN_WEEK) * 100)),
      mtPct: Math.min(100, Math.round((mtSem / MT_PLAN_WEEK) * 100)),
    };
  }, [weekISOs, currentISO, clHoy, mtHoy, weeklyLogs]);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 h-full flex flex-col min-w-0 bg-bg overflow-hidden">

      {/* ── Navbar ── */}
      <header className="h-[60px] shrink-0 bg-surface border-b border-[var(--border)] px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 text-[11.5px] min-w-0">
          <span className="text-text-tertiary font-medium">Mi espacio</span>
          <span className="text-text-tertiary mx-1">›</span>
          <span className="text-text-tertiary font-medium truncate">Casa Luífer & Montana</span>
          <span className="text-text-tertiary mx-1">›</span>
          <span className="text-text-primary font-semibold">Plan continuo</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Navegador de semana */}
          <div className="flex items-center rounded-xl bg-surface border border-[var(--border)] p-0.5 shadow-2xs">
            <button
              onClick={handlePrevWeek}
              title="Semana anterior"
              className="h-7 px-2 rounded-lg flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sem. anterior</span>
            </button>
            <div className="h-4 w-px bg-[var(--border)] mx-1" />
            <button
              onClick={handleNextWeek}
              title="Semana siguiente"
              className="h-7 px-2 rounded-lg flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 transition cursor-pointer"
            >
              <span className="hidden sm:inline">Sem. siguiente</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Selector de día actual */}
          <div className="h-8 rounded-xl bg-surface border border-[var(--border)] px-2 flex items-center gap-1 shadow-2xs">
            <button onClick={() => setSelectedDate((p) => { const n = new Date(p); n.setDate(p.getDate() - 1); return n; })} className="w-5 h-5 rounded flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition cursor-pointer">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1 px-1 text-[11px] font-semibold text-text-primary whitespace-nowrap">
              <CalendarIcon className="w-3 h-3 text-text-tertiary" />
              {formatDateDisplay(selectedDate)}
            </div>
            <button onClick={() => setSelectedDate((p) => { const n = new Date(p); n.setDate(p.getDate() + 1); return n; })} className="w-5 h-5 rounded flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition cursor-pointer">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <button onClick={() => { const now = new Date(); setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)); }} className="h-8 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[11px] font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition cursor-pointer border border-amber-100 dark:border-amber-900/50">
            Hoy
          </button>

          {/* BOTÓN GUARDAR DÍA DESTACADO Y PROMINENTE */}
          <motion.button
            onClick={handleSave}
            disabled={isSaving}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            animate={
              hasUnsavedChanges
                ? {
                    boxShadow: [
                      "0 0 0 0 rgba(16, 185, 129, 0)",
                      "0 0 0 6px rgba(16, 185, 129, 0.25)",
                      "0 0 0 0 rgba(16, 185, 129, 0)",
                    ],
                  }
                : showSaved
                ? { scale: [1, 1.08, 1] }
                : {}
            }
            transition={
              hasUnsavedChanges
                ? { repeat: Infinity, duration: 2 }
                : { duration: 0.3 }
            }
            className={`h-9 px-4 rounded-xl text-[12px] font-bold flex items-center gap-2 transition cursor-pointer disabled:opacity-50 shadow-md ${
              hasUnsavedChanges
                ? "bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/50"
                : "bg-[#111113] text-white dark:bg-white dark:text-[#111113] hover:opacity-95"
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isSaving ? (
                <motion.span key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </motion.span>
              ) : showSaved ? (
                <motion.span key="d" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 18 }} className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>¡Día guardado!</span>
                </motion.span>
              ) : (
                <motion.span key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                  <Save className={`w-3.5 h-3.5 ${hasUnsavedChanges ? "text-emerald-200 animate-pulse" : ""}`} />
                  <span>{hasUnsavedChanges ? "Guardar día *" : "Guardar día"}</span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto p-5">
        <motion.div key={currentISO} variants={staggerContainer} initial="hidden" animate="show"
          className="max-w-[1340px] mx-auto flex flex-col lg:flex-row gap-5 items-start">

          {/* ════════ COLUMNA IZQUIERDA ════════ */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">

            {/* Hero – Lo que te toca hoy */}
            <motion.div variants={fadeInUp}
              className="rounded-2xl bg-surface border border-[var(--border)] p-5 shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: todayPlan.isCreativo ? "#fef3c7" : "#fdf2f8", border: `1px solid ${todayPlan.isCreativo ? "#fde68a" : "#fce7f3"}` }}>
                    {todayPlan.isCreativo
                      ? <Sparkles className="w-5 h-5 text-amber-500" />
                      : <Flame className="w-5 h-5 text-pink-500" />
                    }
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-[15.5px] font-bold text-text-primary leading-tight">
                        Lo que te toca crear hoy
                      </h2>
                      {todayPlan.isCreativo ? (
                        <span className="h-5 px-2 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold flex items-center gap-1 border border-amber-200">
                          <Sparkles className="w-2.5 h-2.5" />
                          {todayPlan.creativoTag}
                        </span>
                      ) : (
                        <span className="h-5 px-2 rounded-full bg-pink-50 text-pink-700 text-[10px] font-semibold flex items-center border border-pink-100">
                          Lun–Vie · solo Instagram
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-tertiary leading-snug">
                      <span className="font-semibold" style={{ color: todayPlan.dayColor }}>CL · {todayPlan.clTheme}</span>
                      <span className="mx-1.5 text-text-tertiary/50">·</span>
                      <span>MT · Producto</span>
                      <span className="mx-1.5 text-text-tertiary/50">·</span>
                      <span>{planDiaTotal} piezas totales: {clTodayTarget} CL + {mtTodayTarget} MT</span>
                    </p>
                  </div>
                </div>

                {/* Stat chips */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  {[
                    { label: "Creadas hoy", value: totalHoy, color: totalHoy >= planDiaTotal ? "text-emerald-500" : "text-amber-600" },
                    { label: "Plan día", value: planDiaTotal, color: "text-text-primary" },
                    { label: "Semana", value: weeklyAgg.clSem + weeklyAgg.mtSem, color: "text-blue-500" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="w-[70px] h-[54px] rounded-xl bg-surface-2/60 border border-[var(--border)] flex flex-col items-center justify-center gap-0.5">
                      <span className={`text-[17px] font-bold leading-tight ${color}`}>{value}</span>
                      <span className="text-[9px] font-medium text-text-tertiary text-center leading-tight">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ── Tarjetas de marca ── */}
            <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* ── Casa Luífer ── */}
              <motion.div variants={popIn} className="rounded-2xl bg-surface border border-[var(--border)] shadow-2xs overflow-hidden">
                {/* Header de marca */}
                <div className="px-4 py-3 flex items-center gap-2.5 border-b border-[var(--border)]">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-[11px] shrink-0" style={{ backgroundColor: "#ec4899" }}>
                    CL
                  </div>
                  <div className="flex-1 min-w-0 leading-tight">
                    <div className="text-[13px] font-bold text-text-primary">Casa Luífer</div>
                    <div className="text-[10px] text-text-tertiary">
                      {todayPlan.isCreativo ? `Día creativo · ${todayPlan.creativoTag}` : `Temática: ${todayPlan.clTheme}`}
                    </div>
                  </div>
                  <span className="h-5 px-2 rounded-full text-[10px] font-bold flex items-center border shrink-0 bg-[#fdf2f8] dark:bg-pink-950/40 text-[#ec4899] dark:text-pink-300 border-[#fce7f3] dark:border-pink-900/50">
                    {clHoy}/{clTodayTarget}
                  </span>
                </div>
                {/* Formato rows */}
                <div className="p-3 flex flex-col gap-2">
                  {todayPlan.cl.map((f) => (
                    <FormatRow
                      key={f.key}
                      formatKey={f.key}
                      title={f.title}
                      hint={f.hint}
                      count={counts[f.key]}
                      weekTotal={0}
                      perWeek={CL_PLAN_WEEK / 4}
                      brandColor="#ec4899"
                      bgSoft="#fdf2f8"
                      borderSoft="#fce7f3"
                      note={notes[f.key]}
                      designerId={designerId}
                      date={currentISO}
                      onDelta={(d) => updateCount(f.key, d)}
                      onNote={(v) => updateNote(f.key, v)}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Montana */}
              <motion.div variants={popIn} className="rounded-2xl bg-surface border border-[var(--border)] shadow-2xs overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-2.5 border-b border-[var(--border)]">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-[11px] shrink-0" style={{ backgroundColor: "#3b82f6" }}>
                    MT
                  </div>
                  <div className="flex-1 min-w-0 leading-tight">
                    <div className="text-[13px] font-bold text-text-primary">Montana</div>
                    <div className="text-[10px] text-text-tertiary">
                      {todayPlan.isCreativo ? "Historia interactiva + Carrusel" : "Orgánico producto + Historia"}
                    </div>
                  </div>
                  <span className="h-5 px-2 rounded-full text-[10px] font-bold flex items-center border shrink-0 bg-[#eff6ff] dark:bg-blue-950/40 text-[#3b82f6] dark:text-blue-300 border-[#dbeafe] dark:border-blue-900/50">
                    {mtHoy}/{mtTodayTarget}
                  </span>
                </div>
                <div className="p-3 flex flex-col gap-2">
                  {todayPlan.mt.map((f) => (
                    <FormatRow
                      key={f.key}
                      formatKey={f.key}
                      title={f.title}
                      hint={f.hint}
                      count={counts[f.key]}
                      weekTotal={0}
                      perWeek={MT_PLAN_WEEK / 2}
                      brandColor="#3b82f6"
                      bgSoft="#eff6ff"
                      borderSoft="#dbeafe"
                      note={notes[f.key]}
                      designerId={designerId}
                      date={currentISO}
                      onDelta={(d) => updateCount(f.key, d)}
                      onNote={(v) => updateNote(f.key, v)}
                    />
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* BARRA INFERIOR / RECORDATORIO DE GUARDADO */}
            {hasUnsavedChanges && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Save className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <div className="text-[13px] font-bold text-text-primary">
                      Tienes cambios sin guardar en este día
                    </div>
                    <div className="text-[11px] text-text-secondary">
                      No olvides presionar guardar para que el progreso quede registrado en la base de datos.
                    </div>
                  </div>
                </div>

                <motion.button
                  onClick={handleSave}
                  disabled={isSaving}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  className="w-full sm:w-auto h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[12.5px] flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0 transition"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Guardar día ahora
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
          </div>

          {/* ════════ PANEL DERECHO ════════ */}
          <motion.div variants={fadeInUp} className="w-full lg:w-[320px] shrink-0 flex flex-col gap-3.5">

            {/* CALENDARIO MENSUAL */}
            <div className="rounded-2xl bg-surface border border-[var(--border)] overflow-hidden shadow-2xs">
              <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between gap-2 bg-surface-2/40">
                <div className="flex items-center gap-2 min-w-0">
                  <CalendarIcon className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                  <span className="text-[11px] font-bold text-text-primary capitalize truncate">
                    {calendarMonth.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                    }}
                    title="Mes anterior"
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      const now = new Date();
                      setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                      setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0));
                    }}
                    title="Mes actual"
                    className="px-1.5 h-6 rounded-lg text-[9.5px] font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-2 transition cursor-pointer"
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => {
                      setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                    }}
                    title="Mes siguiente"
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Grid de días del mes */}
              <div className="p-3 flex flex-col gap-1.5">
                {/* Cabecera de días de la semana */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
                    <span
                      key={d}
                      className={`text-[9.5px] font-bold ${
                        i >= 5 ? "text-text-tertiary/40" : "text-text-tertiary"
                      }`}
                    >
                      {d}
                    </span>
                  ))}
                </div>

                {/* Días */}
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const year = calendarMonth.getFullYear();
                    const month = calendarMonth.getMonth();
                    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Dom
                    const leadBlanks = (firstDayOfMonth + 6) % 7; // Lunes=0
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const cells = [];

                    for (let b = 0; b < leadBlanks; b++) {
                      cells.push(<div key={`b-${b}`} className="h-8" />);
                    }

                    for (let day = 1; day <= daysInMonth; day++) {
                      const dateObj = new Date(year, month, day, 12, 0, 0);
                      const iso = toISO(dateObj);
                      const isSelected = iso === currentISO;
                      const isInSelectedWeek = weekISOs.includes(iso);
                      const dayOfWeek = dateObj.getDay();
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                      // Conteo de piezas registradas
                      let loggedCount = 0;
                      if (iso === currentISO) {
                        loggedCount = totalHoy;
                      } else {
                        const log = monthLogs[iso] || weeklyLogs[iso];
                        if (log) {
                          loggedCount =
                            (log.formatClHistorias ?? 0) +
                            (log.formatClMovimiento ?? 0) +
                            (log.formatClPost ?? 0) +
                            (log.formatClHistoriaProducto ?? 0) +
                            (log.formatClHistoriaInteractiva ?? 0) +
                            (log.formatMtHistorias ?? 0) +
                            (log.formatMtCarruseles ?? 0);
                        }
                      }

                      const hasActivity = loggedCount > 0;

                      cells.push(
                        <button
                          key={iso}
                          onClick={() => setSelectedDate(dateObj)}
                          title={`${iso}: ${loggedCount} piezas`}
                          className={`h-8 rounded-lg flex flex-col items-center justify-center relative transition cursor-pointer text-[11px] font-semibold ${
                            isSelected
                              ? "bg-emerald-600 text-white font-bold shadow-xs scale-105 z-10"
                              : isInSelectedWeek
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                              : isWeekend
                              ? "text-text-tertiary/40 hover:bg-surface-2/40"
                              : "text-text-primary hover:bg-surface-2"
                          }`}
                        >
                          <span>{day}</span>
                          {hasActivity && !isSelected && (
                            <span
                              className={`w-1 h-1 rounded-full absolute bottom-0.5 ${
                                loggedCount >= 5 ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                            />
                          )}
                        </button>
                      );
                    }

                    return cells;
                  })()}
                </div>

                {/* Leyenda y saltos de semana */}
                <div className="pt-2 mt-1 border-t border-[var(--border)] flex items-center justify-between text-[10px] text-text-tertiary">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Con registros</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevWeek}
                      className="hover:text-text-primary underline cursor-pointer"
                    >
                      ‹ Sem. ant.
                    </button>
                    <span>·</span>
                    <button
                      onClick={handleNextWeek}
                      className="hover:text-text-primary underline cursor-pointer"
                    >
                      Sem. sig. ›
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Plan Semanal Integrado */}
            <div className="rounded-2xl bg-surface border border-[var(--border)] overflow-hidden shadow-2xs">
              <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between gap-2 bg-surface-2/40">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-3.5 h-3.5 text-text-tertiary" />
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-text-secondary">
                    Plan semanal · {isMiguel ? "Miguel" : "Samuel"}
                  </span>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-surface border border-[var(--border)] text-text-tertiary">
                  {TOTAL_PLAN_WEEK} piezas/sem
                </span>
              </div>
              <div className="flex flex-col divide-y divide-[var(--border)]">
                {Object.entries(activeWeekPlan).map(([dayNum, plan]) => {
                  const dn = Number(dayNum);
                  const isToday = dn === dow;
                  const dayPieces = plan.cl.length + plan.mt.length;
                  return (
                    <button
                      key={dn}
                      type="button"
                      onClick={() => {
                        const target = weekDays[dn - 1];
                        if (target) setSelectedDate(target);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 flex items-start gap-3 transition cursor-pointer ${isToday ? "bg-amber-50/60 dark:bg-amber-950/20" : "hover:bg-surface-2/40"}`}
                    >
                      {/* Day label badge */}
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[9.5px] shrink-0 mt-0.5"
                        style={{ backgroundColor: plan.dayColor }}>
                        {plan.shortLabel}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-text-primary">{plan.label}</span>
                          {plan.isCreativo && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                              {plan.creativoTag}
                            </span>
                          )}
                          {isToday && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
                              Hoy
                            </span>
                          )}
                        </div>
                        {/* CL line */}
                        <div className="text-[10px] text-text-tertiary leading-snug mt-0.5">
                          <span className="font-semibold" style={{ color: "#ec4899" }}>CL</span>
                          <span className="text-text-tertiary/50 mx-1">·</span>
                          {plan.cl.map((f) => f.title).join(" · ")}
                        </div>
                        {/* MT line */}
                        <div className="text-[10px] text-text-tertiary leading-snug">
                          <span className="font-semibold" style={{ color: "#3b82f6" }}>MT</span>
                          <span className="text-text-tertiary/50 mx-1">·</span>
                          {plan.mt.map((f) => f.title).join(" · ")}
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-text-tertiary shrink-0 mt-1">{dayPieces}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Progreso semanal */}
            <div className="rounded-2xl bg-surface border border-[var(--border)] p-4 flex flex-col gap-3.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-text-secondary">
                  Esta semana
                </span>
              </div>
              {[
                { name: "Casa Luífer", done: weeklyAgg.clSem, goal: CL_PLAN_WEEK, pct: weeklyAgg.clPct, color: "#ec4899" },
                { name: "Montana", done: weeklyAgg.mtSem, goal: MT_PLAN_WEEK, pct: weeklyAgg.mtPct, color: "#3b82f6" },
              ].map((b) => (
                <div key={b.name} className="flex items-center gap-3">
                  <div className="relative w-[48px] h-[48px] shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f1f4" strokeWidth="3.4" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke={b.color} strokeWidth="3.4"
                        strokeDasharray={`${b.pct} 100`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[8.5px] font-bold text-text-primary">{b.pct}%</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 leading-tight">
                    <div className="text-[10px] text-text-tertiary">{b.name}</div>
                    <div className="text-[15px] font-bold text-text-primary">{b.done} / {b.goal}</div>
                    <div className="h-1.5 w-full bg-surface-2 rounded-full mt-1 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${b.pct}%`, backgroundColor: b.color }} />
                    </div>
                  </div>
                </div>
              ))}

              <div className="h-px bg-[var(--border)]" />

              {/* L-V grid */}
              <div className="grid grid-cols-5 gap-1">
                {weekDays.map((dayDate, idx) => {
                  const dayISO = toISO(dayDate);
                  const isCur = dayISO === currentISO;
                  let cnt = 0;
                  if (isCur) cnt = totalHoy;
                  else { const l = weeklyLogs[dayISO]; if (l) cnt = l.formatClHistorias + l.formatClMovimiento + (l.formatClPost ?? 0) + (l.formatClHistoriaProducto ?? 0) + (l.formatClHistoriaInteractiva ?? 0) + l.formatMtHistorias + l.formatMtCarruseles; }
                  const planDay = activeWeekPlan[idx + 1];
                  const dayPiecesGoal = (planDay?.cl.length ?? 3) + (planDay?.mt.length ?? 2);
                  return (
                    <motion.button key={idx} type="button" onClick={() => setSelectedDate(dayDate)}
                      whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                      className={`h-[46px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition cursor-pointer border ${isCur ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50" : "bg-surface-2/30 border-[var(--border)] hover:bg-surface-2"}`}>
                      <span className="text-[8.5px] font-bold uppercase" style={{ color: isCur ? "#d97706" : planDay?.dayColor ?? "var(--text-tertiary)" }}>
                        {planDay?.shortLabel ?? ""}
                      </span>
                      <span className={`text-[12px] font-bold ${isCur ? "text-amber-700 dark:text-amber-300" : "text-text-primary"}`}>{cnt}</span>
                      {cnt >= dayPiecesGoal && <span className="text-[7.5px] text-emerald-500 font-bold">✓</span>}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Reglas del plan */}
            <div className="rounded-2xl bg-surface border border-[var(--border)] p-4 flex flex-col gap-2.5 shadow-2xs">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-text-tertiary">Reglas del plan ({isMiguel ? "Miguel" : "Samuel"})</span>
              <div className="flex flex-col gap-1.5">
                {(isMiguel
                  ? [
                      "29 piezas / semana · 4 CL/día + MT",
                      "CL alterna: Lun/Mié/Vie = Historia producto · Mar/Jue = Historia interactiva",
                      "Lunes, Miércoles y Viernes → días creativos",
                      "Videos creativos CL: Yapping Lun & Mié, Creativo Viernes",
                      "Montana: Yapping Miércoles, Interactivas Lun/Mié/Vie",
                      "Solo Instagram · Lunes a viernes",
                    ]
                  : [
                      "30 piezas / semana · 4 CL/día + 2 MT/día",
                      "CL alterna: Lun/Mié/Vie = Historia producto · Mar/Jue = Historia interactiva",
                      "Martes y Jueves → días creativos (Disney)",
                      "Lunes, Miércoles y Viernes → Orgánicos + Carrusel + Testimonio",
                      "Montana: Orgánico producto + historias",
                      "Solo Instagram · Lunes a viernes",
                    ]
                ).map((r) => (
                  <div key={r} className="flex items-start gap-1.5 text-[10px] text-text-secondary leading-snug">
                    <span className="mt-1 w-1 h-1 rounded-full bg-text-tertiary shrink-0" />
                    {r}
                  </div>
                ))}
              </div>
            </div>

            {/* Creado hoy */}
            {totalHoy > 0 && (
              <div className="rounded-2xl bg-surface border border-[var(--border)] p-4 flex flex-col gap-2.5 shadow-2xs">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-text-tertiary">Creado hoy</span>
                <div className="flex flex-col gap-1.5">
                  {todayPlan.cl.filter((f) => counts[f.key] > 0).map((f) => (
                    <div key={f.key} className="flex items-center gap-2 text-[10.5px]">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#ec4899" }} />
                      <span className="text-text-primary font-semibold">CL · {f.title}</span>
                      <span className="ml-auto text-text-tertiary font-bold">×{counts[f.key]}</span>
                    </div>
                  ))}
                  {todayPlan.mt.filter((f) => counts[f.key] > 0).map((f) => (
                    <div key={f.key} className="flex items-center gap-2 text-[10.5px]">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#3b82f6" }} />
                      <span className="text-text-primary font-semibold">MT · {f.title}</span>
                      <span className="ml-auto text-text-tertiary font-bold">×{counts[f.key]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Sub-componente FormatRow ─────────────────────────────────────────────────
function FormatRow({
  formatKey, title, hint, count, perWeek, weekTotal, brandColor, bgSoft, borderSoft,
  note, designerId, date, onDelta, onNote,
}: {
  formatKey: FormatKey;
  title: string;
  hint: string;
  count: number;
  weekTotal: number;
  perWeek: number;
  brandColor: string;
  bgSoft: string;
  borderSoft: string;
  note: string;
  designerId: string;
  date: string;
  onDelta: (d: number) => void;
  onNote: (v: string) => void;
}) {
  const isDone = count >= 1;
  const Icon = formatIcon(title);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasImage = note.startsWith("http") || note.startsWith("data:image");

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    const url = await uploadDesignCapture(file, designerId, date, formatKey);
    if (url) {
      onNote(url);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => { if (ev.target?.result) onNote(ev.target.result as string); };
      reader.readAsDataURL(file);
      setUploadError("Supabase no disponible · guardado local");
    }
    setUploading(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (!item) return;
    e.preventDefault();
    const file = item.getAsFile();
    if (file) handleUpload(file);
  }

  const isCL = brandColor === "#ec4899";
  const doneBgClass = isCL 
    ? "bg-[#fdf2f8] dark:bg-pink-950/20 border-[#fce7f3] dark:border-pink-900/40" 
    : "bg-[#eff6ff] dark:bg-blue-950/20 border-[#dbeafe] dark:border-blue-900/40";
  const badgeDoneClass = isCL
    ? "bg-[#fdf2f8] dark:bg-pink-950/50 text-[#ec4899] dark:text-pink-300 border-[#fce7f3] dark:border-pink-900/60"
    : "bg-[#eff6ff] dark:bg-blue-950/50 text-[#3b82f6] dark:text-blue-300 border-[#dbeafe] dark:border-blue-900/60";
  const iconBoxClass = isCL
    ? "bg-[#fdf2f8] dark:bg-pink-950/40 border-[#fce7f3] dark:border-pink-900/50"
    : "bg-[#eff6ff] dark:bg-blue-950/40 border-[#dbeafe] dark:border-blue-900/50";

  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all ${
        isDone ? doneBgClass : "bg-transparent border-[var(--border)]"
      }`}
    >
      {/* Title row */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${iconBoxClass}`}
        >
          <Icon className="w-4 h-4" style={{ color: brandColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-text-primary truncate leading-tight">{title}</div>
          <div className="text-[11px] text-text-tertiary truncate leading-snug mt-0.5">{hint}</div>
        </div>
        {isDone && (
          <span className={`h-5 px-2 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0 border ${badgeDoneClass}`}>
            ✓ Hecho
          </span>
        )}
      </div>

      {/* Stepper */}
      <div className="rounded-xl bg-white dark:bg-surface-2 border border-[var(--border)] flex items-center gap-2 px-3 py-2">
        <motion.button type="button" onClick={() => onDelta(-1)} disabled={count <= 0}
          whileHover={count > 0 ? { scale: 1.1 } : {}} whileTap={count > 0 ? { scale: 0.88 } : {}}
          className="w-7 h-7 rounded-lg flex items-center justify-center bg-surface-2 text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shrink-0">
          <Minus className="w-3.5 h-3.5" />
        </motion.button>
        <div className="flex-1 flex items-baseline gap-1 justify-center">
          <motion.span key={count} initial={{ scale: 1.4, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 450, damping: 22 }}
            className="text-[20px] font-bold text-text-primary leading-none">{count}</motion.span>
          <span className="text-[11px] text-text-tertiary">hoy</span>
        </div>
        <motion.button type="button" onClick={() => onDelta(1)}
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }}
          className="w-7 h-7 rounded-lg bg-[#111113] text-white flex items-center justify-center hover:opacity-90 transition cursor-pointer shrink-0">
          <Plus className="w-3.5 h-3.5" />
        </motion.button>
      </div>

      {/* Zona de captura */}
      {uploading ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-surface-2/40 flex items-center justify-center gap-2 px-3 py-5">
          <Loader2 className="w-4 h-4 text-text-tertiary animate-spin" />
          <span className="text-[11px] text-text-tertiary">Subiendo captura...</span>
        </div>
      ) : hasImage ? (
        <div className="relative group rounded-xl overflow-hidden border border-[var(--border)]" style={{ aspectRatio: "16/9" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={note} alt="Captura de pieza" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
          <button type="button" onClick={() => { onNote(""); setUploadError(null); }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div
          onPaste={handlePaste}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl border border-dashed border-[var(--border)] bg-surface-2/40 flex flex-col items-center justify-center gap-2 px-3 py-5 cursor-pointer hover:bg-surface-2/70 hover:border-text-tertiary/40 transition group"
        >
          <Camera className="w-5 h-5 text-text-tertiary group-hover:text-text-secondary transition" />
          <span className="text-[11px] text-text-tertiary group-hover:text-text-secondary transition text-center leading-snug">
            Pega captura o sube imagen de la pieza
          </span>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      )}

      {uploadError && (
        <p className="text-[10px] text-amber-600 leading-tight px-0.5">{uploadError}</p>
      )}
    </div>
  );
}

function formatIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("video") || t.includes("creativo") || t.includes("yapping") || t.includes("disney")) return Video;
  if (t.includes("carrusel")) return LayoutGrid;
  if (t.includes("post") || t.includes("testimonio")) return Image;
  return MessageSquare;
}
