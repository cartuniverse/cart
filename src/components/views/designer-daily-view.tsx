"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { fadeInUp, popIn, staggerContainer } from "@/lib/motion-variants";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Flame,
  Info,
  LayoutGrid,
  Loader2,
  MessageSquare,
  Minus,
  Plus,
  Video,
} from "lucide-react";
import {
  getDailyDesignLog,
  getWeeklyDesignLogs,
  saveDailyDesignLog,
} from "@/lib/supabase";
import type { DailyDesignLog } from "@/lib/types";

type FormatKey =
  | "clHistorias"
  | "clMovimiento"
  | "mtHistorias"
  | "mtCarruseles";

type FormatDef = {
  key: FormatKey;
  brand: "Casa Luifer" | "Montana";
  title: string;
  hint: string;
  perDay: number;
  perWeek: number;
  themed?: boolean;
  icon: typeof Video;
  brandColor: string; // hex
  softBg: string; // tailwind bg class
  softBorder: string; // tailwind border class
  textOnSoft: string; // tailwind text class
  barBg: string; // tailwind fill bg for progress bar
};

const FORMATS: FormatDef[] = [
  {
    key: "clHistorias",
    brand: "Casa Luifer",
    title: "Historias · producto e interactivas",
    hint: "Flat lays, covers y encuestas",
    perDay: 2,
    perWeek: 10,
    icon: MessageSquare,
    brandColor: "#ec4899",
    softBg: "bg-pink-50/70",
    softBorder: "border-pink-100",
    textOnSoft: "text-pink-600",
    barBg: "bg-pink-500",
  },
  {
    key: "clMovimiento",
    brand: "Casa Luifer",
    title: "Videos movimiento",
    hint: "Prendas en movimiento",
    perDay: 2,
    perWeek: 10,
    themed: true,
    icon: Video,
    brandColor: "#ec4899",
    softBg: "bg-pink-50/70",
    softBorder: "border-pink-100",
    textOnSoft: "text-pink-600",
    barBg: "bg-pink-500",
  },
  {
    key: "mtHistorias",
    brand: "Montana",
    title: "Historias · producto e interactivas",
    hint: "Catálogo editorial y trivias",
    perDay: 2,
    perWeek: 10,
    icon: MessageSquare,
    brandColor: "#3b82f6",
    softBg: "bg-blue-50/70",
    softBorder: "border-blue-100",
    textOnSoft: "text-blue-600",
    barBg: "bg-blue-500",
  },
  {
    key: "mtCarruseles",
    brand: "Montana",
    title: "Carruseles",
    hint: "Posts de 5-7 slides",
    perDay: 1,
    perWeek: 5,
    icon: LayoutGrid,
    brandColor: "#3b82f6",
    softBg: "bg-blue-50/70",
    softBorder: "border-blue-100",
    textOnSoft: "text-blue-600",
    barBg: "bg-blue-500",
  },
];

const MOVIMIENTO_THEMES: Record<number, { theme: string; dayName: string }> = {
  1: { theme: "Trajes de hombre", dayName: "Lunes" },
  2: { theme: "Novias", dayName: "Martes" },
  3: { theme: "Quinces", dayName: "Miércoles" },
  4: { theme: "Primera comunión", dayName: "Jueves" },
  5: { theme: "Mix libre", dayName: "Viernes" },
};

const PLAN_DIA_TOTAL = FORMATS.reduce((a, f) => a + f.perDay, 0); // 7
const PLAN_SEMANA_TOTAL = FORMATS.reduce((a, f) => a + f.perWeek, 0); // 35
const CL_PLAN_WEEK =
  FORMATS.filter((f) => f.brand === "Casa Luifer").reduce((a, f) => a + f.perWeek, 0); // 20
const MT_PLAN_WEEK =
  FORMATS.filter((f) => f.brand === "Montana").reduce((a, f) => a + f.perWeek, 0); // 15

function formatDateToDisplay(d: Date): string {
  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function getWeekDays(currentDate: Date): Date[] {
  const d = new Date(currentDate);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  const days: Date[] = [];
  for (let i = 0; i < 5; i++) {
    const nd = new Date(monday);
    nd.setDate(monday.getDate() + i);
    days.push(nd);
  }
  return days;
}

type CountsState = Record<FormatKey, number>;
type NotesState = Record<FormatKey, string>;

const emptyCounts = (): CountsState => ({
  clHistorias: 0,
  clMovimiento: 0,
  mtHistorias: 0,
  mtCarruseles: 0,
});

const emptyNotes = (): NotesState => ({
  clHistorias: "",
  clMovimiento: "",
  mtHistorias: "",
  mtCarruseles: "",
});

export function DesignerDailyView({
  designerId = "daniela-s",
  designerName = "Daniela S.",
}: {
  designerId?: string;
  designerName?: string;
}) {
  // Fecha fija inicial determinista para SSR (Lunes, 10 nov 2026 como en el diseño)
  const [selectedDate, setSelectedDate] = useState<Date>(
    () => new Date("2026-11-10T12:00:00"),
  );

  const [counts, setCounts] = useState<CountsState>(() => emptyCounts());
  const [notes, setNotes] = useState<NotesState>(() => emptyNotes());

  const [isSaving, setIsSaving] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const weekISOStrings = useMemo(
    () => weekDays.map((d) => toISODate(d)),
    [weekDays],
  );

  const [weeklyLogs, setWeeklyLogs] = useState<Record<string, DailyDesignLog>>(
    {},
  );

  // Cargar datos del día y semana
  useEffect(() => {
    const iso = toISODate(selectedDate);
    getDailyDesignLog(iso, designerId).then((log) => {
      if (log) {
        setCounts({
          clHistorias: log.formatClHistorias,
          clMovimiento: log.formatClMovimiento,
          mtHistorias: log.formatMtHistorias,
          mtCarruseles: log.formatMtCarruseles,
        });
        setNotes({
          clHistorias: log.notesClHistorias,
          clMovimiento: log.notesClMovimiento,
          mtHistorias: log.notesMtHistorias,
          mtCarruseles: log.notesMtCarruseles,
        });
      } else {
        setCounts(emptyCounts());
        setNotes(emptyNotes());
      }
    });

    getWeeklyDesignLogs(weekISOStrings, designerId).then((res) => {
      setWeeklyLogs(res);
    });
  }, [selectedDate, designerId, weekISOStrings]);

  const handlePrevDay = () =>
    setSelectedDate((prev) => {
      const n = new Date(prev);
      n.setDate(prev.getDate() - 1);
      return n;
    });

  const handleNextDay = () =>
    setSelectedDate((prev) => {
      const n = new Date(prev);
      n.setDate(prev.getDate() + 1);
      return n;
    });

  const handleToday = () => setSelectedDate(new Date(2026, 10, 10));

  const updateCount = (key: FormatKey, delta: number) =>
    setCounts((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }));

  const handleSaveDay = async () => {
    setIsSaving(true);
    const iso = toISODate(selectedDate);
    try {
      const saved = await saveDailyDesignLog({
        date: iso,
        designerId,
        designerName,
        formatClHistorias: counts.clHistorias,
        formatClMovimiento: counts.clMovimiento,
        formatMtHistorias: counts.mtHistorias,
        formatMtCarruseles: counts.mtCarruseles,
        notesClHistorias: notes.clHistorias,
        notesClMovimiento: notes.clMovimiento,
        notesMtHistorias: notes.mtHistorias,
        notesMtCarruseles: notes.mtCarruseles,
      });

      setWeeklyLogs((prev) => ({ ...prev, [iso]: saved }));
      setShowSavedFeedback(true);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("daily_log_updated"));
      }
      setTimeout(() => setShowSavedFeedback(false), 2500);
    } catch (err) {
      console.error("Error guardando día:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const totalCreadasHoy =
    counts.clHistorias +
    counts.clMovimiento +
    counts.mtHistorias +
    counts.mtCarruseles;

  const currentIso = toISODate(selectedDate);
  const dayOfWeek = selectedDate.getDay();
  const movTheme =
    MOVIMIENTO_THEMES[dayOfWeek] ?? { theme: "Trajes de hombre", dayName: "Lunes" };

  // Agregados semanales (suma día actual en pantalla + resto desde storage)
  const weeklyAgg = useMemo(() => {
    const totals: CountsState = emptyCounts();
    weekISOStrings.forEach((d) => {
      if (d === currentIso) {
        totals.clHistorias += counts.clHistorias;
        totals.clMovimiento += counts.clMovimiento;
        totals.mtHistorias += counts.mtHistorias;
        totals.mtCarruseles += counts.mtCarruseles;
      } else {
        const log = weeklyLogs[d];
        if (log) {
          totals.clHistorias += log.formatClHistorias;
          totals.clMovimiento += log.formatClMovimiento;
          totals.mtHistorias += log.formatMtHistorias;
          totals.mtCarruseles += log.formatMtCarruseles;
        }
      }
    });
    const totalSemana =
      totals.clHistorias +
      totals.clMovimiento +
      totals.mtHistorias +
      totals.mtCarruseles;
    const clSemana = totals.clHistorias + totals.clMovimiento;
    const mtSemana = totals.mtHistorias + totals.mtCarruseles;
    return {
      totals,
      totalSemana,
      clSemana,
      mtSemana,
      clPct: Math.round((clSemana / CL_PLAN_WEEK) * 100),
      mtPct: Math.round((mtSemana / MT_PLAN_WEEK) * 100),
    };
  }, [weekISOStrings, currentIso, counts, weeklyLogs]);

  // Historial "Creado hoy" basado en lo que hay en pantalla
  const historyToday = FORMATS.flatMap((f) => {
    const n = counts[f.key];
    if (n <= 0) return [];
    return Array.from({ length: n }, (_, i) => ({
      key: `${f.key}-${i}`,
      brand: f.brand,
      title: f.title,
      brandColor: f.brandColor,
    }));
  });

  return (
    <div className="flex-1 h-full flex flex-col min-w-0 bg-bg overflow-hidden">
      {/* Navbar superior */}
      <header className="h-[70px] shrink-0 bg-surface border-b border-[var(--border)] px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-[17px] font-bold text-text-primary">
            Plan de desatraso
          </h1>
          <span className="text-[11px] font-medium text-text-tertiary">
            Casa Luifer & Montana · Lun–Vie · solo Instagram
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Navegador de fecha */}
          <div className="h-9 rounded-xl bg-surface border border-[var(--border)] px-2.5 flex items-center gap-2 shadow-2xs">
            <button
              onClick={handlePrevDay}
              title="Día anterior"
              className="w-6 h-6 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-1.5 text-[12.5px] font-semibold text-text-primary">
              <CalendarIcon className="w-3.5 h-3.5 text-text-tertiary" />
              <span>{formatDateToDisplay(selectedDate)}</span>
            </div>
            <button
              onClick={handleNextDay}
              title="Día siguiente"
              className="w-6 h-6 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="h-9 px-3.5 rounded-xl bg-amber-50 text-amber-700 text-[12.5px] font-semibold hover:bg-amber-100 transition cursor-pointer border border-amber-100"
          >
            Hoy
          </button>

          <motion.button
            onClick={handleSaveDay}
            disabled={isSaving}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            animate={showSavedFeedback ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="h-9 px-4 rounded-xl bg-[#111113] text-white dark:bg-white dark:text-[#111113] text-[12.5px] font-semibold flex items-center gap-1.5 hover:opacity-90 transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isSaving ? (
                <motion.span
                  key="saving"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-1.5"
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </motion.span>
              ) : showSavedFeedback ? (
                <motion.span
                  key="saved"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  className="flex items-center gap-1.5"
                >
                  <span className="text-emerald-400">✓</span>
                  <span>¡Guardado!</span>
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-1.5"
                >
                  <span>✓</span>
                  <span>Guardar día</span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </header>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-8">
        <motion.div
          key={currentIso}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="max-w-[1360px] mx-auto flex flex-col lg:flex-row gap-6 items-start"
        >
          {/* Columna izquierda */}
          <div className="flex-1 flex flex-col gap-6 w-full">
            {/* Hero: Lo que te toca crear hoy */}
            <motion.div
              variants={fadeInUp}
              className="rounded-2xl bg-surface border border-[var(--border)] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-[17px] font-bold text-text-primary">
                      Lo que te toca crear hoy
                    </h2>
                    <span className="h-6 px-2.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold flex items-center gap-1 border border-amber-100">
                      <Info className="w-3 h-3" />
                      Lun–Vie · solo Instagram · sin %
                    </span>
                  </div>
                  <p className="text-[12.5px] text-text-tertiary">
                    Ponte al día con Casa Luífer y Montana. No hay metas de
                    cierre: solo lo creado.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                <div className="w-[88px] h-[64px] rounded-xl bg-surface-2/70 border border-[var(--border)] flex flex-col items-center justify-center">
                  <span className="text-[20px] font-bold text-amber-600 leading-tight">
                    {totalCreadasHoy}
                  </span>
                  <span className="text-[10px] font-medium text-text-tertiary">
                    Creadas hoy
                  </span>
                </div>
                <div className="w-[88px] h-[64px] rounded-xl bg-surface-2/70 border border-[var(--border)] flex flex-col items-center justify-center">
                  <span className="text-[20px] font-bold text-text-primary leading-tight">
                    {PLAN_DIA_TOTAL}
                  </span>
                  <span className="text-[10px] font-medium text-text-tertiary">
                    Plan del día
                  </span>
                </div>
                <div className="w-[88px] h-[64px] rounded-xl bg-surface-2/70 border border-[var(--border)] flex flex-col items-center justify-center">
                  <span className="text-[20px] font-bold text-emerald-500 leading-tight">
                    {weeklyAgg.totalSemana}
                  </span>
                  <span className="text-[10px] font-medium text-text-tertiary">
                    Semana
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Dos columnas por marca */}
            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              {(["Casa Luifer", "Montana"] as const).map((brand) => {
                const brandFormats = FORMATS.filter((f) => f.brand === brand);
                const brandPlanDay = brandFormats.reduce(
                  (a, f) => a + f.perDay,
                  0,
                );
                const brandDone =
                  brand === "Casa Luifer"
                    ? counts.clHistorias + counts.clMovimiento
                    : counts.mtHistorias + counts.mtCarruseles;
                const isCL = brand === "Casa Luifer";
                const brandColor = isCL ? "#ec4899" : "#3b82f6";
                return (
                  <motion.div
                    key={brand}
                    variants={popIn}
                    className="rounded-2xl bg-surface border border-[var(--border)] p-5 flex flex-col gap-4 shadow-2xs"
                  >
                    {/* Brand header */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-[13px] shadow-2xs`}
                        style={{ backgroundColor: brandColor }}
                      >
                        {isCL ? "CL" : "MT"}
                      </div>
                      <div className="flex-1 leading-tight">
                        <div className="text-[14px] font-bold text-text-primary">
                          {brand === "Casa Luifer" ? "Casa Luífer" : brand}
                        </div>
                        <div className="text-[11px] font-medium text-text-tertiary">
                          {brandPlanDay} piezas por día ·{" "}
                          {isCL ? CL_PLAN_WEEK : MT_PLAN_WEEK} por semana
                        </div>
                      </div>
                      <span
                        className={`h-6 px-2.5 rounded-full text-[11px] font-bold flex items-center border`}
                        style={{
                          backgroundColor: isCL ? "#fdf2f8" : "#eff6ff",
                          color: brandColor,
                          borderColor: isCL ? "#fce7f3" : "#dbeafe",
                        }}
                      >
                        {brandDone} / {brandPlanDay}
                      </span>
                    </div>

                    {/* Format rows */}
                    <div className="flex flex-col gap-3">
                      {brandFormats.map((f) => {
                        const Icon = f.icon;
                        const count = counts[f.key];
                        const weekCount =
                          weeklyAgg.totals[f.key];
                        const isDone = count >= f.perDay;
                        return (
                          <div
                            key={f.key}
                            className={`rounded-xl ${f.softBg} border ${f.softBorder} p-3.5 flex flex-col gap-3`}
                          >
                            {/* Format header */}
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center shrink-0">
                                <Icon
                                  className="w-3.5 h-3.5"
                                  style={{ color: f.brandColor }}
                                />
                              </div>
                              <div className="flex-1 leading-tight min-w-0">
                                <div className="text-[12px] font-bold text-text-primary truncate">
                                  {f.title}
                                </div>
                                <div
                                  className={`text-[10px] font-medium ${
                                    f.themed
                                      ? "text-amber-600"
                                      : "text-text-tertiary"
                                  } truncate`}
                                >
                                  {f.themed
                                    ? `${movTheme.dayName} · ${movTheme.theme}`
                                    : f.hint}
                                </div>
                              </div>
                              <span
                                className={`text-[12px] font-bold ${
                                  isDone ? "text-emerald-500" : "text-text-primary"
                                }`}
                              >
                                {count}/{f.perDay}
                              </span>
                            </div>

                            {/* Stepper */}
                            <div className="h-9 rounded-lg bg-white border border-border px-1.5 flex items-center justify-between">
                              <motion.button
                                type="button"
                                onClick={() => updateCount(f.key, -1)}
                                disabled={count <= 0}
                                whileHover={count > 0 ? { scale: 1.08 } : {}}
                                whileTap={count > 0 ? { scale: 0.9 } : {}}
                                className="w-6 h-6 rounded-md bg-surface-2 flex items-center justify-center text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </motion.button>
                              <div className="flex items-baseline gap-1 justify-center">
                                <motion.span
                                  key={count}
                                  initial={{ scale: 1.3, opacity: 0.6 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 20,
                                  }}
                                  className="text-[13px] font-bold text-text-primary"
                                >
                                  {count}
                                </motion.span>
                                <span className="text-[10px] font-medium text-text-tertiary">
                                  hoy · {weekCount}/{f.perWeek} sem.
                                </span>
                              </div>
                              <motion.button
                                type="button"
                                onClick={() => updateCount(f.key, 1)}
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.9 }}
                                className="w-6 h-6 rounded-md bg-[#111113] text-white flex items-center justify-center hover:opacity-90 transition cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </motion.button>
                            </div>

                            {/* Notes */}
                            <textarea
                              rows={1}
                              placeholder="Link al archivo o comentario..."
                              value={notes[f.key]}
                              onChange={(e) =>
                                setNotes((prev) => ({
                                  ...prev,
                                  [f.key]: e.target.value,
                                }))
                              }
                              className="p-2 text-[11.5px] rounded-lg border bg-white text-text-primary placeholder:text-text-tertiary/70 focus:outline-none focus:border-accent resize-none leading-relaxed"
                              style={{ borderColor: "var(--border)" }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Columna derecha */}
          <motion.div
            variants={fadeInUp}
            className="w-full lg:w-[340px] shrink-0 flex flex-col gap-4"
          >
            {/* ESTA SEMANA · DESATRASO */}
            <div className="rounded-2xl bg-surface border border-[var(--border)] p-5 flex flex-col gap-5 shadow-2xs">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">
                  Esta semana · desatraso
                </span>
              </div>

              {/* Mini anillos por marca */}
              {[
                {
                  name: "Casa Luífer",
                  done: weeklyAgg.clSemana,
                  goal: CL_PLAN_WEEK,
                  pct: weeklyAgg.clPct,
                  color: "#ec4899",
                },
                {
                  name: "Montana",
                  done: weeklyAgg.mtSemana,
                  goal: MT_PLAN_WEEK,
                  pct: weeklyAgg.mtPct,
                  color: "#3b82f6",
                },
              ].map((b) => (
                <div
                  key={b.name}
                  className="flex items-center gap-3"
                >
                  <div className="relative w-[58px] h-[58px] shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full">
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke="#f1f1f4"
                        strokeWidth="3"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke={b.color}
                        strokeWidth="3"
                        strokeDasharray={`${Math.min(100, b.pct)} 100`}
                        strokeLinecap="round"
                        transform="rotate(-90 18 18)"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 leading-tight">
                    <div className="text-[11px] font-medium text-text-tertiary">
                      {b.name}
                    </div>
                    <div className="text-[17px] font-bold text-text-primary">
                      {b.done} / {b.goal}
                    </div>
                    <div
                      className="text-[10.5px] font-semibold"
                      style={{ color: b.color }}
                    >
                      {b.pct}% · piezas
                    </div>
                  </div>
                </div>
              ))}

              <div className="h-px bg-[var(--border)]" />

              {/* Días L..V */}
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { label: "L", dayOffset: 0 },
                  { label: "M", dayOffset: 1 },
                  { label: "M", dayOffset: 2 },
                  { label: "J", dayOffset: 3 },
                  { label: "V", dayOffset: 4 },
                ].map(({ label, dayOffset }) => {
                  const dayDate = weekDays[dayOffset];
                  const dayIso = toISODate(dayDate);
                  const isCurrent = dayIso === currentIso;
                  let dayCount = 0;
                  if (isCurrent) {
                    dayCount = totalCreadasHoy;
                  } else if (weeklyLogs[dayIso]) {
                    const l = weeklyLogs[dayIso];
                    dayCount =
                      l.formatClHistorias +
                      l.formatClMovimiento +
                      l.formatMtHistorias +
                      l.formatMtCarruseles;
                  }
                  return (
                    <motion.button
                      key={dayOffset}
                      type="button"
                      onClick={() => setSelectedDate(dayDate)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      animate={isCurrent ? { scale: [1, 1.06, 1] } : {}}
                      transition={{ duration: 0.3 }}
                      className={`h-[56px] rounded-xl flex flex-col items-center justify-center gap-1 transition cursor-pointer border ${
                        isCurrent
                          ? "bg-amber-50 border-amber-200 text-amber-700"
                          : "bg-surface-2/40 border-[var(--border)] text-text-secondary hover:bg-surface-2"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase text-text-tertiary">
                        {label}
                      </span>
                      <span
                        className={`text-[13px] font-bold ${
                          isCurrent ? "text-amber-700" : "text-text-primary"
                        }`}
                      >
                        {dayCount}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Por formato */}
              <div className="flex flex-col gap-3 pt-2 border-t border-[var(--border)]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                  Por formato
                </span>
                {FORMATS.map((f) => {
                  const done = weeklyAgg.totals[f.key];
                  const pct = Math.min(100, (done / f.perWeek) * 100);
                  return (
                    <div key={f.key} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11.5px]">
                        <span className="font-semibold text-text-primary truncate pr-2">
                          {f.brand === "Casa Luifer" ? "CL" : "MT"} · {f.title.replace(" · producto e interactivas", "")}
                        </span>
                        <span
                          className="text-[11px] font-bold"
                          style={{ color: f.brandColor }}
                        >
                          {done}/{f.perWeek}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: f.brandColor,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tema del día */}
            <div className="rounded-2xl bg-amber-50/70 border border-amber-100 p-5 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Tema del día · Movimiento
                </span>
              </div>
              <div className="text-[15px] font-bold text-text-primary">
                {movTheme.dayName} · {movTheme.theme}
              </div>
              <div className="text-[11px] text-text-secondary leading-relaxed">
                Mañana (martes): novias · miércoles: quinces · jueves: primera comunión.
              </div>
            </div>

            {/* Creado hoy */}
            <div className="rounded-2xl bg-surface border border-[var(--border)] p-5 flex flex-col gap-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-text-secondary" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                  Creado hoy
                </span>
              </div>
              {historyToday.length === 0 ? (
                <div className="text-[11.5px] text-text-tertiary italic">
                  Aún no has registrado nada hoy.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {historyToday.slice(0, 6).map((h) => (
                    <div
                      key={h.key}
                      className="flex items-center gap-2 text-[11.5px]"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: h.brandColor }}
                      />
                      <span className="font-semibold text-text-primary truncate">
                        {h.brand === "Casa Luifer" ? "CL" : "MT"} · {h.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
