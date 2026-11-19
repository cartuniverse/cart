"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { fadeInUp, popIn, staggerContainer } from "@/lib/motion-variants";
import {
  Calendar as CalendarIcon,
  Camera,
  ChevronLeft,
  ChevronRight,
  Flame,
  Image,
  LayoutGrid,
  Loader2,
  MessageSquare,
  Minus,
  Plus,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import {
  getDailyDesignLog,
  getWeeklyDesignLogs,
  saveDailyDesignLog,
  uploadDesignCapture,
} from "@/lib/supabase";
import type { DailyDesignLog } from "@/lib/types";

// ─── Tipos internos ───────────────────────────────────────────────────────────
type FormatKey = "clHistorias" | "clMovimiento" | "clPost" | "mtHistorias" | "mtCarruseles";
type CountsState = Record<FormatKey, number>;
type NotesState = Record<FormatKey, string>;

// ─── Plan semanal: información capturada de la imagen ─────────────────────────
// Lunes/Miércoles/Viernes → días "orgánicos" (Carrusel + Testimonio)
// Martes/Jueves → días "creativos" (Creativo Disney/Yapping + Post)
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

const WEEK_PLAN: Record<number, DayPlan> = {
  1: {
    label: "Lunes", shortLabel: "L",
    clTheme: "Traje hombre",
    isCreativo: false,
    dayColor: "#4a6fa5",
    cl: [
      { key: "clHistorias", title: "Orgánico", hint: "Traje hombre · story flat lay" },
      { key: "clMovimiento", title: "Carrusel", hint: "5–7 slides de producto" },
      { key: "clPost", title: "Testimonio", hint: "Review de cliente en feed" },
    ],
    mt: [
      { key: "mtHistorias", title: "Orgánico producto", hint: "Catálogo editorial MT" },
      { key: "mtCarruseles", title: "Historia producto", hint: "Imagen de producto story" },
    ],
  },
  2: {
    label: "Martes", shortLabel: "M",
    clTheme: "Novias",
    isCreativo: true,
    creativoTag: "Creativo 1/2",
    dayColor: "#a04e6a",
    cl: [
      { key: "clHistorias", title: "Orgánico", hint: "Novias · story editorial" },
      { key: "clMovimiento", title: "Creativo (Disney)", hint: "Video creativo CL · Martes" },
      { key: "clPost", title: "Post feed", hint: "Publicación cuadrada/portrait" },
    ],
    mt: [
      { key: "mtHistorias", title: "Historia interactiva", hint: "Trivia o encuesta MT" },
      { key: "mtCarruseles", title: "Carrusel MT", hint: "5–7 slides editorial" },
    ],
  },
  3: {
    label: "Miércoles", shortLabel: "Mi",
    clTheme: "Quinces",
    isCreativo: false,
    dayColor: "#6a5a9e",
    cl: [
      { key: "clHistorias", title: "Orgánico", hint: "Quinces · story flat lay" },
      { key: "clMovimiento", title: "Carrusel", hint: "5–7 slides de producto" },
      { key: "clPost", title: "Testimonio", hint: "Review de cliente en feed" },
    ],
    mt: [
      { key: "mtHistorias", title: "Orgánico producto", hint: "Catálogo editorial MT" },
      { key: "mtCarruseles", title: "Historia producto", hint: "Imagen de producto story" },
    ],
  },
  4: {
    label: "Jueves", shortLabel: "J",
    clTheme: "Primera comunión",
    isCreativo: true,
    creativoTag: "Creativo 2/2",
    dayColor: "#3d7a60",
    cl: [
      { key: "clHistorias", title: "Orgánico", hint: "Primera comunión · story" },
      { key: "clMovimiento", title: "Creativo (Yapping)", hint: "Video creativo CL · Jueves" },
      { key: "clPost", title: "Post feed", hint: "Publicación cuadrada/portrait" },
    ],
    mt: [
      { key: "mtHistorias", title: "Historia interactiva", hint: "Trivia o encuesta MT" },
      { key: "mtCarruseles", title: "Carrusel MT", hint: "5–7 slides editorial" },
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
    ],
    mt: [
      { key: "mtHistorias", title: "Orgánico producto", hint: "Catálogo editorial MT" },
      { key: "mtCarruseles", title: "Historia producto", hint: "Imagen de producto story" },
    ],
  },
};

const FALLBACK_DAY: DayPlan = WEEK_PLAN[1];

// Metas de plan semanal (5 días × piezas por día)
const CL_PLAN_WEEK = 15; // 3 piezas × 5 días
const MT_PLAN_WEEK = 10; // 2 piezas × 5 días
const PLAN_DIA_TOTAL = 5; // 3 CL + 2 MT

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

const emptyCounts = (): CountsState => ({ clHistorias: 0, clMovimiento: 0, clPost: 0, mtHistorias: 0, mtCarruseles: 0 });
const emptyNotes = (): NotesState => ({ clHistorias: "", clMovimiento: "", clPost: "", mtHistorias: "", mtCarruseles: "" });

// ─── Componente principal ─────────────────────────────────────────────────────
export function DesignerDailyView({
  designerId = "designer",
  designerName = "Diseñador",
}: {
  designerId?: string;
  designerName?: string;
}) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    // Usar fecha actual local sin hardcodear
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  });
  const [counts, setCounts] = useState<CountsState>(emptyCounts);
  const [notes, setNotes] = useState<NotesState>(emptyNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [weeklyLogs, setWeeklyLogs] = useState<Record<string, DailyDesignLog>>({});

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const weekISOs = useMemo(() => weekDays.map(toISO), [weekDays]);
  const currentISO = toISO(selectedDate);
  const dow = selectedDate.getDay(); // 0=dom … 6=sab
  const todayPlan: DayPlan = WEEK_PLAN[dow] ?? FALLBACK_DAY;

  useEffect(() => {
    getDailyDesignLog(currentISO, designerId).then((log) => {
      if (log) {
        setCounts({ clHistorias: log.formatClHistorias, clMovimiento: log.formatClMovimiento, clPost: log.formatClPost ?? 0, mtHistorias: log.formatMtHistorias, mtCarruseles: log.formatMtCarruseles });
        setNotes({ clHistorias: log.notesClHistorias, clMovimiento: log.notesClMovimiento, clPost: log.notesClPost ?? "", mtHistorias: log.notesMtHistorias, mtCarruseles: log.notesMtCarruseles });
      } else {
        setCounts(emptyCounts());
        setNotes(emptyNotes());
      }
    });
    getWeeklyDesignLogs(weekISOs, designerId).then(setWeeklyLogs);
  }, [currentISO, designerId, weekISOs]);

  const updateCount = (key: FormatKey, delta: number) =>
    setCounts((p) => ({ ...p, [key]: Math.max(0, p[key] + delta) }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saved = await saveDailyDesignLog({
        date: currentISO, designerId, designerName,
        formatClHistorias: counts.clHistorias, formatClMovimiento: counts.clMovimiento, formatClPost: counts.clPost,
        formatMtHistorias: counts.mtHistorias, formatMtCarruseles: counts.mtCarruseles,
        notesClHistorias: notes.clHistorias, notesClMovimiento: notes.clMovimiento, notesClPost: notes.clPost,
        notesMtHistorias: notes.mtHistorias, notesMtCarruseles: notes.mtCarruseles,
      });
      setWeeklyLogs((p) => ({ ...p, [currentISO]: saved }));
      setShowSaved(true);
      if (typeof window !== "undefined") window.dispatchEvent(new Event("daily_log_updated"));
      setTimeout(() => setShowSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const totalHoy = counts.clHistorias + counts.clMovimiento + counts.clPost + counts.mtHistorias + counts.mtCarruseles;
  const clHoy = counts.clHistorias + counts.clMovimiento + counts.clPost;
  const mtHoy = counts.mtHistorias + counts.mtCarruseles;

  const weeklyAgg = useMemo(() => {
    let clSem = 0, mtSem = 0;
    weekISOs.forEach((d) => {
      if (d === currentISO) { clSem += clHoy; mtSem += mtHoy; }
      else {
        const l = weeklyLogs[d];
        if (l) {
          clSem += l.formatClHistorias + l.formatClMovimiento + (l.formatClPost ?? 0);
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
          <button onClick={() => { const now = new Date(); setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)); }} className="h-8 px-3 rounded-xl bg-amber-50 text-amber-700 text-[11px] font-semibold hover:bg-amber-100 transition cursor-pointer border border-amber-100">
            Hoy
          </button>
          <motion.button onClick={handleSave} disabled={isSaving} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} animate={showSaved ? { scale: [1, 1.07, 1] } : {}} className="h-8 px-3.5 rounded-xl bg-[#111113] text-white dark:bg-white dark:text-[#111113] text-[11px] font-semibold flex items-center gap-1.5 hover:opacity-90 transition cursor-pointer disabled:opacity-50">
            <AnimatePresence mode="wait" initial={false}>
              {isSaving ? (
                <motion.span key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" />Guardando...</motion.span>
              ) : showSaved ? (
                <motion.span key="d" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 18 }} className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span>¡Guardado!</motion.span>
              ) : (
                <motion.span key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5"><span>✓</span>Guardar día</motion.span>
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
                      <span>{PLAN_DIA_TOTAL} piezas totales: 3 CL + 2 MT</span>
                    </p>
                  </div>
                </div>

                {/* Stat chips */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  {[
                    { label: "Creadas hoy", value: totalHoy, color: totalHoy >= PLAN_DIA_TOTAL ? "text-emerald-500" : "text-amber-600" },
                    { label: "Plan día", value: PLAN_DIA_TOTAL, color: "text-text-primary" },
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
                  <span className="h-5 px-2 rounded-full text-[10px] font-bold flex items-center border shrink-0"
                    style={{ backgroundColor: "#fdf2f8", color: "#ec4899", borderColor: "#fce7f3" }}>
                    {clHoy}/3
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
                      perWeek={CL_PLAN_WEEK / 3}
                      brandColor="#ec4899"
                      bgSoft="#fdf2f8"
                      borderSoft="#fce7f3"
                      note={notes[f.key]}
                      designerId={designerId}
                      date={currentISO}
                      onDelta={(d) => updateCount(f.key, d)}
                      onNote={(v) => setNotes((p) => ({ ...p, [f.key]: v }))}
                    />
                  ))}
                </div>
              </motion.div>

              {/* ── Montana ── */}
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
                  <span className="h-5 px-2 rounded-full text-[10px] font-bold flex items-center border shrink-0"
                    style={{ backgroundColor: "#eff6ff", color: "#3b82f6", borderColor: "#dbeafe" }}>
                    {mtHoy}/2
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
                      onNote={(v) => setNotes((p) => ({ ...p, [f.key]: v }))}
                    />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* ════════ PANEL DERECHO ════════ */}
          <motion.div variants={fadeInUp} className="w-full lg:w-[310px] shrink-0 flex flex-col gap-3.5">

            {/* Plan Semanal Integrado */}
            <div className="rounded-2xl bg-surface border border-[var(--border)] overflow-hidden shadow-2xs">
              <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2 bg-surface-2/40">
                <CalendarIcon className="w-3.5 h-3.5 text-text-tertiary" />
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-text-secondary">
                  Plan semanal integrado
                </span>
              </div>
              <div className="flex flex-col divide-y divide-[var(--border)]">
                {Object.entries(WEEK_PLAN).map(([dayNum, plan]) => {
                  const dn = Number(dayNum);
                  const isToday = dn === dow;
                  return (
                    <button
                      key={dn}
                      type="button"
                      onClick={() => {
                        const target = weekDays[dn - 1];
                        if (target) setSelectedDate(target);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 flex items-start gap-3 transition cursor-pointer ${isToday ? "bg-amber-50/60" : "hover:bg-surface-2/40"}`}
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
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                              {plan.creativoTag}
                            </span>
                          )}
                          {isToday && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
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
                      <div className="text-[10px] font-bold text-text-tertiary shrink-0 mt-1">5</div>
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
                  else { const l = weeklyLogs[dayISO]; if (l) cnt = l.formatClHistorias + l.formatClMovimiento + (l.formatClPost ?? 0) + l.formatMtHistorias + l.formatMtCarruseles; }
                  const planDay = WEEK_PLAN[idx + 1];
                  return (
                    <motion.button key={idx} type="button" onClick={() => setSelectedDate(dayDate)}
                      whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                      className={`h-[46px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition cursor-pointer border ${isCur ? "bg-amber-50 border-amber-200" : "bg-surface-2/30 border-[var(--border)] hover:bg-surface-2"}`}>
                      <span className="text-[8.5px] font-bold uppercase" style={{ color: isCur ? "#d97706" : planDay?.dayColor ?? "var(--text-tertiary)" }}>
                        {planDay?.shortLabel ?? ""}
                      </span>
                      <span className={`text-[12px] font-bold ${isCur ? "text-amber-700" : "text-text-primary"}`}>{cnt}</span>
                      {cnt >= 5 && <span className="text-[7.5px] text-emerald-500 font-bold">✓</span>}
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
                  "3 CL (Org. + variante + extra) · 2 MT",
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

  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all ${isDone ? "opacity-90" : ""}`}
      style={{ backgroundColor: isDone ? bgSoft : "transparent", borderColor: isDone ? borderSoft : "var(--border)" }}>

      {/* Title row */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: bgSoft, border: `1px solid ${borderSoft}` }}>
          <Icon className="w-4 h-4" style={{ color: brandColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-text-primary truncate leading-tight">{title}</div>
          <div className="text-[11px] text-text-tertiary truncate leading-snug mt-0.5">{hint}</div>
        </div>
        {isDone && (
          <span className="h-5 px-2 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0"
            style={{ backgroundColor: bgSoft, color: brandColor, border: `1px solid ${borderSoft}` }}>
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
