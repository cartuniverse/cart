"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Gem,
  Info,
  Loader2,
  Mic,
  Minus,
  Plus,
  Save,
  Sparkles,
  Video,
} from "lucide-react";
import { getDailyVideoLog, getWeeklyVideoLogs, saveDailyVideoLog } from "@/lib/supabase";
import type { DailyVideoLog } from "@/lib/types";

interface AudiovisualDailyViewProps {
  currentProjectName?: string;
}

// Configuración de los 4 formatos de vídeo
const FORMATS_CONFIG = [
  {
    key: "disneySub30" as const,
    title: "Disney <30sg",
    target: "1 pieza",
    tagline: "Clip rápido · gancho visual",
    icon: Sparkles,
    iconBg: "bg-pink-50 text-pink-500 border border-pink-100",
    color: "#ec4899",
    activeToday: true,
  },
  {
    key: "disneyGala" as const,
    title: "Disney 30sg · desfile gala",
    target: "0 piezas",
    tagline: "Hoy no es día de desfile",
    icon: Gem,
    iconBg: "bg-violet-50 text-violet-500 border border-violet-100",
    color: "#8b5cf6",
    activeToday: false,
  },
  {
    key: "movimiento" as const,
    title: "Movimiento",
    target: "1 pieza",
    tagline: "Lunes · Trajes de hombre",
    tagBadge: true,
    icon: Video,
    iconBg: "bg-blue-50 text-blue-500 border border-blue-100",
    color: "#3b82f6",
    activeToday: true,
  },
  {
    key: "avatarYapping" as const,
    title: "Avatar yapping",
    target: "1 pieza",
    tagline: "Avatar explicando producto",
    icon: Mic,
    iconBg: "bg-emerald-50 text-emerald-500 border border-emerald-100",
    color: "#10b981",
    activeToday: true,
  },
];

// Metas semanales por formato
const WEEKLY_GOALS = {
  disneySub30: 4,
  disneyGala: 3,
  movimiento: 4,
  avatarYapping: 4,
};

// Formato de fecha en español tipo: "Lunes, 10 nov 2026"
function formatDateToDisplay(d: Date): string {
  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const dayName = days[d.getDay()];
  const dayNum = d.getDate();
  const monthName = months[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${dayNum} ${monthName} ${year}`;
}

function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Obtener las fechas de Lunes a Viernes de la semana de una fecha dada
function getWeekDays(currentDate: Date): Date[] {
  const d = new Date(currentDate);
  const day = d.getDay(); // 0 es domingo
  const diffToMonday = day === 0 ? -6 : 1 - day; // ajustar a lunes
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const days: Date[] = [];
  for (let i = 0; i < 5; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    days.push(nextDay);
  }
  return days;
}

export function AudiovisualDailyView({
  currentProjectName = "Casa Luifer",
}: AudiovisualDailyViewProps) {
  // Fecha fija inicial determinista para SSR (Lunes, 10 nov 2026 como en la imagen)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date("2026-11-10T12:00:00"));

  // Estado del formulario del día
  const [counts, setCounts] = useState<{
    disneySub30: number;
    disneyGala: number;
    movimiento: number;
    avatarYapping: number;
  }>({
    disneySub30: 1,
    disneyGala: 0,
    movimiento: 1,
    avatarYapping: 0,
  });

  const [notes, setNotes] = useState<{
    disneySub30: string;
    disneyGala: string;
    movimiento: string;
    avatarYapping: string;
  }>({
    disneySub30: "",
    disneyGala: "",
    movimiento: "",
    avatarYapping: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  // Registro de la semana para el panel derecho "ESTA SEMANA"
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const weekISOStrings = useMemo(() => weekDays.map((d) => toISODate(d)), [weekDays]);

  const [weeklyLogs, setWeeklyLogs] = useState<Record<string, DailyVideoLog>>({});

  // Cargar datos del día seleccionado y de la semana
  useEffect(() => {
    const iso = toISODate(selectedDate);
    getDailyVideoLog(iso, currentProjectName).then((log) => {
      if (log) {
        setCounts({
          disneySub30: log.formatDisneySub30,
          disneyGala: log.formatDisneyGala,
          movimiento: log.formatMovimiento,
          avatarYapping: log.formatAvatarYapping,
        });
        setNotes({
          disneySub30: log.notesDisneySub30,
          disneyGala: log.notesDisneyGala,
          movimiento: log.notesMovimiento,
          avatarYapping: log.notesAvatarYapping,
        });
      } else {
        // Valores por defecto como en la captura
        setCounts({
          disneySub30: 1,
          disneyGala: 0,
          movimiento: 1,
          avatarYapping: 0,
        });
        setNotes({
          disneySub30: "",
          disneyGala: "",
          movimiento: "",
          avatarYapping: "",
        });
      }
    });

    // Cargar semana
    getWeeklyVideoLogs(weekISOStrings, currentProjectName).then((res) => {
      setWeeklyLogs(res);
    });
  }, [selectedDate, currentProjectName, weekISOStrings]);

  // Navegación de días
  const handlePrevDay = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 1);
      return next;
    });
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 1);
      return next;
    });
  };

  const handleToday = () => {
    setSelectedDate(new Date(2026, 10, 10)); // Mantener coherencia con fecha de diseño
  };

  // Manejo de contadores
  const updateCount = (key: keyof typeof counts, delta: number) => {
    setCounts((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }));
  };

  // Guardar día
  const handleSaveDay = async () => {
    setIsSaving(true);
    const iso = toISODate(selectedDate);

    try {
      const saved = await saveDailyVideoLog({
        date: iso,
        creatorId: "andres-m",
        creatorName: "Andrés M.",
        projectName: currentProjectName,
        formatDisneySub30: counts.disneySub30,
        formatDisneyGala: counts.disneyGala,
        formatMovimiento: counts.movimiento,
        formatAvatarYapping: counts.avatarYapping,
        notesDisneySub30: notes.disneySub30,
        notesDisneyGala: notes.disneyGala,
        notesMovimiento: notes.movimiento,
        notesAvatarYapping: notes.avatarYapping,
      });

      // Actualizar inmediatamente el estado semanal reactivo
      setWeeklyLogs((prev) => ({
        ...prev,
        [iso]: saved,
      }));

      setShowSavedFeedback(true);
      setTimeout(() => setShowSavedFeedback(false), 2500);
    } catch (err) {
      console.error("Error guardando día:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Métricas del día actual
  const totalCreadasHoy =
    counts.disneySub30 + counts.disneyGala + counts.movimiento + counts.avatarYapping;
  const planDelDia = 3; // Plan meta del día

  // Cálculos acumulados de la semana (reactivos al día actual y a los guardados)
  const currentIso = toISODate(selectedDate);

  // Mezclamos lo que está en pantalla con lo guardado en los otros días de la semana
  const weeklyAggregates = useMemo(() => {
    let sub30 = 0;
    let gala = 0;
    let mov = 0;
    let yap = 0;

    weekISOStrings.forEach((d) => {
      if (d === currentIso) {
        // Tomar en tiempo real los contadores que tiene en pantalla
        sub30 += counts.disneySub30;
        gala += counts.disneyGala;
        mov += counts.movimiento;
        yap += counts.avatarYapping;
      } else {
        const log = weeklyLogs[d];
        if (log) {
          sub30 += log.formatDisneySub30;
          gala += log.formatDisneyGala;
          mov += log.formatMovimiento;
          yap += log.formatAvatarYapping;
        } else {
          // Si no hay log guardado, simular datos de muestra para días anteriores de la semana
          // Ejemplo: si es martes (11 nov) o lunes anterior
          if (d < currentIso) {
            sub30 += 1;
            mov += 1;
            yap += 1;
          }
        }
      }
    });

    const totalSemana = sub30 + gala + mov + yap;
    const planSemana = 15;
    const avancePct = Math.round((totalSemana / planSemana) * 100);

    return {
      sub30,
      gala,
      mov,
      yap,
      totalSemana,
      planSemana,
      avancePct,
    };
  }, [weekISOStrings, currentIso, counts, weeklyLogs]);

  return (
    <div className="flex-1 h-full flex flex-col min-w-0 bg-[#f8f9fa] overflow-hidden">
      {/* Top Navbar del Diario de Hoy */}
      <header className="h-[70px] shrink-0 bg-white border-b border-[var(--border)] px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-[17px] font-bold text-text-primary">Diario de hoy</h1>
        </div>

        {/* Selector de Fecha y botón de Guardar Día */}
        <div className="flex items-center gap-3">
          {/* Navegador de Fecha */}
          <div className="h-9 rounded-xl bg-white border border-[var(--border)] px-2.5 flex items-center gap-2 shadow-2xs">
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
            className="h-9 px-3.5 rounded-xl bg-[#eef2ff] text-[#4f46e5] text-[12.5px] font-semibold hover:bg-[#e0e7ff] transition cursor-pointer"
          >
            Hoy
          </button>

          {/* Botón Guardar Día */}
          <button
            onClick={handleSaveDay}
            disabled={isSaving}
            className="h-9 px-4 rounded-xl bg-[#111113] text-white text-[12.5px] font-semibold flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : showSavedFeedback ? (
              <>
                <span className="text-emerald-400">✓</span>
                <span>¡Guardado!</span>
              </>
            ) : (
              <>
                <span>✓</span>
                <span>Guardar día</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Contenido principal con 2 columnas (Cards de vídeos + Sidebar 'Esta semana') */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[1360px] mx-auto flex flex-col lg:flex-row gap-6 items-start">
          {/* Columna Izquierda: Banner superior + 4 Cards de formatos */}
          <div className="flex-1 flex flex-col gap-6 w-full">
            {/* Banner: Videos que te tocan hoy */}
            <div className="rounded-2xl bg-white border border-[var(--border)] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-[17px] font-bold text-text-primary">
                    Videos que te tocan hoy
                  </h2>
                  <span className="h-6 px-2.5 rounded-full bg-[#f5f3ff] text-[#7c3aed] text-[11px] font-semibold flex items-center gap-1 border border-[#ede9fe]">
                    <Sparkles className="w-3 h-3" />
                    3 piezas · plan del lunes
                  </span>
                </div>
                <p className="text-[12.5px] text-text-tertiary">
                  Registra los vídeos que grabaste y publicaste hoy. Solo lo real, sin % ni pendiente.
                </p>
              </div>

              {/* 3 Widgets métricas */}
              <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                <div className="w-[88px] h-[64px] rounded-xl bg-surface-2/70 border border-[var(--border)] flex flex-col items-center justify-center">
                  <span className="text-[20px] font-bold text-text-primary leading-tight">
                    {totalCreadasHoy}
                  </span>
                  <span className="text-[10px] font-medium text-text-tertiary">
                    Creadas hoy
                  </span>
                </div>

                <div className="w-[88px] h-[64px] rounded-xl bg-surface-2/70 border border-[var(--border)] flex flex-col items-center justify-center">
                  <span className="text-[20px] font-bold text-text-primary leading-tight">
                    {planDelDia}
                  </span>
                  <span className="text-[10px] font-medium text-text-tertiary">
                    Plan del día
                  </span>
                </div>

                <div className="w-[88px] h-[64px] rounded-xl bg-surface-2/70 border border-[var(--border)] flex flex-col items-center justify-center">
                  <span className="text-[20px] font-bold text-[#10b981] leading-tight">
                    {weeklyAggregates.totalSemana}
                  </span>
                  <span className="text-[10px] font-medium text-text-tertiary">
                    Semana
                  </span>
                </div>
              </div>
            </div>

            {/* Grid 2x2 con las 4 tarjetas de creación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {FORMATS_CONFIG.map((fmt) => {
                const Icon = fmt.icon;
                const count = counts[fmt.key];
                const note = notes[fmt.key];

                return (
                  <div
                    key={fmt.key}
                    className="rounded-2xl bg-white border border-[var(--border)] p-6 flex flex-col gap-5 shadow-2xs hover:shadow-xs transition"
                  >
                    {/* Header de la tarjeta */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${fmt.iconBg}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-[14.5px] font-bold text-text-primary">
                              {fmt.title}
                            </h3>
                          </div>
                          <span className="text-[11px] font-semibold text-text-tertiary">
                            {fmt.target}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tagline / Subtítulo */}
                    {fmt.tagBadge ? (
                      <div>
                        <span className="h-6 px-2.5 rounded-lg bg-surface-2 text-text-secondary text-[11px] font-medium inline-flex items-center gap-1.5 border border-border">
                          <CalendarIcon className="w-3 h-3 text-text-tertiary" />
                          {fmt.tagline}
                        </span>
                      </div>
                    ) : (
                      <p className="text-[11.5px] text-text-tertiary">
                        {fmt.tagline}
                      </p>
                    )}

                    {/* Contador "Cuántas creaste" */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold text-text-tertiary">
                        Cuántas creaste
                      </span>
                      <div className="h-12 rounded-xl bg-surface-2/60 border border-[var(--border)] px-2.5 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => updateCount(fmt.key, -1)}
                          disabled={count <= 0}
                          className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center text-text-secondary hover:bg-surface-2 disabled:opacity-30 transition cursor-pointer active:scale-95 shadow-2xs"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[20px] font-bold text-text-primary">
                            {count}
                          </span>
                          <span className="text-[11px] font-medium text-text-tertiary">
                            creadas
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => updateCount(fmt.key, 1)}
                          className="w-8 h-8 rounded-lg bg-[#111113] text-white flex items-center justify-center hover:opacity-90 transition cursor-pointer active:scale-95 shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Input Enlaces o notas rápidas */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold text-text-tertiary">
                        Enlaces o notas rápidas
                      </span>
                      <textarea
                        rows={2}
                        placeholder={
                          fmt.activeToday
                            ? "Link al archivo o comentario..."
                            : "Añade un link o nota"
                        }
                        value={note}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [fmt.key]: e.target.value }))
                        }
                        className="p-3 text-[12px] rounded-xl border bg-white text-text-primary placeholder:text-text-tertiary/70 focus:outline-none focus:border-accent resize-none leading-relaxed"
                        style={{ borderColor: "var(--border)" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha: Tarjeta reactiva 'ESTA SEMANA' */}
          <div className="w-full lg:w-[350px] shrink-0 flex flex-col gap-4">
            {/* Widget principal: ESTA SEMANA */}
            <div className="rounded-2xl bg-white border border-[var(--border)] p-6 flex flex-col gap-6 shadow-2xs">
              {/* Header */}
              <div className="flex items-center gap-2 text-text-tertiary">
                <CalendarIcon className="w-4 h-4 text-[#7c3aed]" />
                <span className="text-[11px] font-bold tracking-wider text-text-secondary uppercase">
                  Esta semana · Galaxia 02
                </span>
              </div>

              {/* 3 Métricas Superiores */}
              <div className="grid grid-cols-3 gap-2">
                <div className="h-[68px] rounded-xl bg-surface-2/60 border border-[var(--border)] flex flex-col items-center justify-center">
                  <span className="text-[20px] font-bold text-text-primary leading-tight">
                    {weeklyAggregates.totalSemana}
                  </span>
                  <span className="text-[10px] font-medium text-text-tertiary">
                    Creadas
                  </span>
                </div>

                <div className="h-[68px] rounded-xl bg-surface-2/60 border border-[var(--border)] flex flex-col items-center justify-center">
                  <span className="text-[20px] font-bold text-text-primary leading-tight">
                    {weeklyAggregates.planSemana}
                  </span>
                  <span className="text-[10px] font-medium text-text-tertiary">
                    Plan
                  </span>
                </div>

                <div className="h-[68px] rounded-xl bg-surface-2/60 border border-[var(--border)] flex flex-col items-center justify-center">
                  <span className="text-[20px] font-bold text-[#4f46e5] leading-tight">
                    {weeklyAggregates.avancePct}%
                  </span>
                  <span className="text-[10px] font-medium text-text-tertiary">
                    Avance
                  </span>
                </div>
              </div>

              {/* Días de la semana (L, M, M, J, V) con contadores */}
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { label: "L", dayOffset: 0, target: 3 },
                  { label: "M", dayOffset: 1, target: 3 },
                  { label: "M", dayOffset: 2, target: 3 },
                  { label: "J", dayOffset: 3, target: 3 },
                  { label: "V", dayOffset: 4, target: 3 },
                ].map(({ label, dayOffset, target }) => {
                  const dayDate = weekDays[dayOffset];
                  const dayIso = toISODate(dayDate);
                  const isCurrentSelected = dayIso === currentIso;

                  // Si es el día seleccionado, mostrar el número actual reactivo
                  let dayCount = 0;
                  if (dayIso === currentIso) {
                    dayCount = totalCreadasHoy;
                  } else if (weeklyLogs[dayIso]) {
                    const l = weeklyLogs[dayIso];
                    dayCount =
                      l.formatDisneySub30 +
                      l.formatDisneyGala +
                      l.formatMovimiento +
                      l.formatAvatarYapping;
                  } else if (dayIso < currentIso) {
                    dayCount = 3; // muestra para días pasados
                  }

                  return (
                    <button
                      key={dayOffset}
                      type="button"
                      onClick={() => setSelectedDate(dayDate)}
                      className={`h-[68px] rounded-xl flex flex-col items-center justify-center gap-1 transition cursor-pointer border ${
                        isCurrentSelected
                          ? "bg-[#eef2ff] border-[#c7d2fe] text-[#4f46e5]"
                          : "bg-surface-2/40 border-[var(--border)] text-text-secondary hover:bg-surface-2"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase text-text-tertiary">
                        {label}
                      </span>
                      <span
                        className={`text-[13px] font-bold ${
                          isCurrentSelected ? "text-[#4f46e5]" : "text-text-primary"
                        }`}
                      >
                        {dayCount}/{target}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Sección: Por Formato con barras de progreso */}
              <div className="flex flex-col gap-3.5 pt-2 border-t border-[var(--border)]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                  Por formato
                </span>

                {/* Disney <30sg */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="font-semibold text-text-primary">
                      Disney &lt;30sg
                    </span>
                    <span className="text-[11px] font-bold text-pink-500">
                      {weeklyAggregates.sub30}/{WEEKLY_GOALS.disneySub30}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-pink-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          (weeklyAggregates.sub30 / WEEKLY_GOALS.disneySub30) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Disney 30sg · gala */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="font-semibold text-text-primary">
                      Disney 30sg · gala
                    </span>
                    <span className="text-[11px] font-bold text-violet-500">
                      {weeklyAggregates.gala}/{WEEKLY_GOALS.disneyGala}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          (weeklyAggregates.gala / WEEKLY_GOALS.disneyGala) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Movimiento */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="font-semibold text-text-primary">
                      Movimiento
                    </span>
                    <span className="text-[11px] font-bold text-blue-500">
                      {weeklyAggregates.mov}/{WEEKLY_GOALS.movimiento}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          (weeklyAggregates.mov / WEEKLY_GOALS.movimiento) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Avatar yapping */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="font-semibold text-text-primary">
                      Avatar yapping
                    </span>
                    <span className="text-[11px] font-bold text-emerald-500">
                      {weeklyAggregates.yap}/{WEEKLY_GOALS.avatarYapping}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          (weeklyAggregates.yap / WEEKLY_GOALS.avatarYapping) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Banner inferior: Recuerda */}
            <div className="rounded-2xl bg-[#f5f7ff] border border-[#e0e7ff] p-5 flex items-start gap-3">
              <Info className="w-4 h-4 text-[#4f46e5] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#4f46e5]">
                  Recuerda
                </span>
                <p className="text-[11.5px] text-text-secondary leading-relaxed">
                  El plan es 'lo mínimo del día'. Registra todo lo que creaste, aunque sea extra — después lo veo en el resumen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

