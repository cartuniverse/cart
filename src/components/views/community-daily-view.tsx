"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Film,
  FolderKanban,
  HelpCircle,
  Image as ImageIcon,
  LayoutGrid,
  Loader2,
  MessageSquare,
  Mic,
  Minus,
  Plus,
  Radio,
  Share2,
  Sparkles,
  Tv,
} from "lucide-react";

// Icono SVG de Instagram
function InstagramIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
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
import {
  getDailyCommunityLog,
  getWeeklyCommunityLogs,
  saveDailyCommunityLog,
} from "@/lib/supabase";
import type { DailyCommunityLog } from "@/lib/types";

interface CommunityDailyViewProps {
  initialProjectName?: string;
  onProjectChange?: (project: string) => void;
}

// Configuración de los 8 formatos
interface FormatConfig {
  key: keyof CommunityDailyCounts;
  label: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  barColor: string;
  // Metas semanales por proyecto
  weeklyTargets: Record<string, number>;
}

export type CommunityDailyCounts = {
  historiaOrganica: number;
  historiaProducto: number;
  historiaInteractiva: number;
  feedOrganico: number;
  feedCreativo: number;
  videoTestimonio: number;
  carrusel: number;
  post: number;
};

const FORMATS: FormatConfig[] = [
  {
    key: "historiaOrganica",
    label: "Historias · videos orgánicos",
    icon: Film,
    iconBg: "bg-pink-50",
    iconColor: "text-pink-500",
    barColor: "#ec4899", // Rosa
    weeklyTargets: { "Casa Luifer": 7, Montana: 5 },
  },
  {
    key: "historiaProducto",
    label: "Historias · producto",
    icon: ImageIcon,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    barColor: "#f59e0b", // Naranja
    weeklyTargets: { "Casa Luifer": 7, Montana: 5 },
  },
  {
    key: "historiaInteractiva",
    label: "Historias · interactivas",
    icon: MessageSquare,
    iconBg: "bg-pink-50",
    iconColor: "text-pink-400",
    barColor: "#f59e0b", // Naranja/Ámbar
    weeklyTargets: { "Casa Luifer": 7, Montana: 5 },
  },
  {
    key: "feedOrganico",
    label: "Feed · videos orgánicos",
    icon: Tv,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-500",
    barColor: "#6366f1", // Azul/Índigo
    weeklyTargets: { "Casa Luifer": 12, Montana: 8 },
  },
  {
    key: "feedCreativo",
    label: "Feed · videos creativos",
    icon: Sparkles,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
    barColor: "#8b5cf6", // Violeta
    weeklyTargets: { "Casa Luifer": 9, Montana: 6 },
  },
  {
    key: "videoTestimonio",
    label: "Videos testimonios",
    icon: Mic,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    barColor: "#f59e0b", // Naranja
    weeklyTargets: { "Casa Luifer": 7, Montana: 5 },
  },
  {
    key: "carrusel",
    label: "Carruseles",
    icon: LayoutGrid,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    barColor: "#10b981", // Verde esmeralda
    weeklyTargets: { "Casa Luifer": 4, Montana: 3 },
  },
  {
    key: "post",
    label: "Post",
    icon: Share2,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    barColor: "#f59e0b", // Naranja/Mostaza
    weeklyTargets: { "Casa Luifer": 3, Montana: 2 },
  },
];

// Metas semanales totales por marca
const PROJECT_TARGETS: Record<string, number> = {
  "Casa Luifer": 56,
  Montana: 39,
};

// Generar días de Lunes a Viernes para una fecha dada
function getMondayToFriday(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
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

function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const MONTHS_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const DAYS_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const DAY_INITIALS = ["L", "M", "M", "J", "V"];

export function CommunityDailyView({
  initialProjectName = "Casa Luifer",
  onProjectChange,
}: CommunityDailyViewProps) {
  const [currentProjectName, setCurrentProjectName] = useState(initialProjectName);

  // Sincronizar si la prop cambia desde el exterior
  useEffect(() => {
    if (initialProjectName && initialProjectName !== currentProjectName) {
      setCurrentProjectName(initialProjectName);
      // Resetear a 0 de inmediato para no mezclar datos de marcas
      setCounts({
        historiaOrganica: 0,
        historiaProducto: 0,
        historiaInteractiva: 0,
        feedOrganico: 0,
        feedCreativo: 0,
        videoTestimonio: 0,
        carrusel: 0,
        post: 0,
      });
      setWeeklyLogs({});
    }
  }, [initialProjectName]);

  // Fecha seleccionada (Default fijo inicial: 2026-11-10 Lunes/Martes)
  const [selectedDate, setSelectedDate] = useState<Date>(
    () => new Date("2026-11-10T12:00:00")
  );

  // Contadores diarios de los 8 formatos
  const [counts, setCounts] = useState<CommunityDailyCounts>({
    historiaOrganica: 0,
    historiaProducto: 0,
    historiaInteractiva: 0,
    feedOrganico: 0,
    feedCreativo: 0,
    videoTestimonio: 0,
    carrusel: 0,
    post: 0,
  });

  // Logs guardados de la semana (Lunes a Viernes)
  const [weeklyLogs, setWeeklyLogs] = useState<Record<string, DailyCommunityLog>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Fechas de Lunes a Viernes
  const weekDays = useMemo(() => getMondayToFriday(selectedDate), [selectedDate]);
  const weekISOStrings = useMemo(() => weekDays.map((d) => toISODate(d)), [weekDays]);
  const currentIso = useMemo(() => toISODate(selectedDate), [selectedDate]);

  // Cargar registro del día y registros de la semana
  useEffect(() => {
    let active = true;

    // 1. Cargar el log de hoy
    getDailyCommunityLog(currentIso, currentProjectName).then((log) => {
      if (!active) return;
      if (log) {
        setCounts({
          historiaOrganica: log.formatHistoriaOrganica ?? 0,
          historiaProducto: log.formatHistoriaProducto ?? 0,
          historiaInteractiva: log.formatHistoriaInteractiva ?? 0,
          feedOrganico: log.formatFeedOrganico ?? 0,
          feedCreativo: log.formatFeedCreativo ?? 0,
          videoTestimonio: log.formatVideoTestimonio ?? 0,
          carrusel: log.formatCarrusel ?? 0,
          post: log.formatPost ?? 0,
        });
      } else {
        setCounts({
          historiaOrganica: 0,
          historiaProducto: 0,
          historiaInteractiva: 0,
          feedOrganico: 0,
          feedCreativo: 0,
          videoTestimonio: 0,
          carrusel: 0,
          post: 0,
        });
      }
    });

    // 2. Cargar semana (Lunes a Viernes)
    getWeeklyCommunityLogs(weekISOStrings, currentProjectName).then((res) => {
      if (!active) return;
      setWeeklyLogs(res);
    });

    return () => {
      active = false;
    };
  }, [currentIso, currentProjectName, weekISOStrings]);

  // Manejo de conteos
  const handleIncrement = (key: keyof CommunityDailyCounts) => {
    setCounts((prev) => ({ ...prev, [key]: prev[key] + 1 }));
  };

  const handleDecrement = (key: keyof CommunityDailyCounts) => {
    setCounts((prev) => ({ ...prev, [key]: Math.max(0, prev[key] - 1) }));
  };

  // Guardar día en Supabase y sincronizar estado
  const handleSaveDay = async () => {
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const saved = await saveDailyCommunityLog({
        date: currentIso,
        cmId: "valentina-c",
        cmName: "Valentina C.",
        projectName: currentProjectName,
        formatHistoriaOrganica: counts.historiaOrganica,
        formatHistoriaProducto: counts.historiaProducto,
        formatHistoriaInteractiva: counts.historiaInteractiva,
        formatFeedOrganico: counts.feedOrganico,
        formatFeedCreativo: counts.feedCreativo,
        formatVideoTestimonio: counts.videoTestimonio,
        formatCarrusel: counts.carrusel,
        formatPost: counts.post,
      });

      // Actualizar mapa semanal de inmediato
      setWeeklyLogs((prev) => ({
        ...prev,
        [currentIso]: saved,
      }));

      // Notificar al sidebar para actualizar el badge de hoy
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("daily_log_updated"));
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error("Error al guardar día:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Navegación de fechas
  const handlePrevDay = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 1);
      return next;
    });
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 1);
      return next;
    });
  };

  // Cambio de proyecto
  const handleSelectProject = (proj: string) => {
    if (proj === currentProjectName) return;
    // Resetear inmediatamente los datos de la pantalla a 0
    setCounts({
      historiaOrganica: 0,
      historiaProducto: 0,
      historiaInteractiva: 0,
      feedOrganico: 0,
      feedCreativo: 0,
      videoTestimonio: 0,
      carrusel: 0,
      post: 0,
    });
    setWeeklyLogs({});
    setCurrentProjectName(proj);
    onProjectChange?.(proj);
  };

  // Cálculos acumulados de la semana (Lunes a Viernes)
  const weeklyTotalsByFormat = useMemo(() => {
    const totals: Record<keyof CommunityDailyCounts, number> = {
      historiaOrganica: 0,
      historiaProducto: 0,
      historiaInteractiva: 0,
      feedOrganico: 0,
      feedCreativo: 0,
      videoTestimonio: 0,
      carrusel: 0,
      post: 0,
    };

    weekISOStrings.forEach((d) => {
      if (d === currentIso) {
        // Usar los valores actuales en pantalla
        totals.historiaOrganica += counts.historiaOrganica;
        totals.historiaProducto += counts.historiaProducto;
        totals.historiaInteractiva += counts.historiaInteractiva;
        totals.feedOrganico += counts.feedOrganico;
        totals.feedCreativo += counts.feedCreativo;
        totals.videoTestimonio += counts.videoTestimonio;
        totals.carrusel += counts.carrusel;
        totals.post += counts.post;
      } else {
        const log = weeklyLogs[d];
        if (log) {
          totals.historiaOrganica += log.formatHistoriaOrganica ?? 0;
          totals.historiaProducto += log.formatHistoriaProducto ?? 0;
          totals.historiaInteractiva += log.formatHistoriaInteractiva ?? 0;
          totals.feedOrganico += log.formatFeedOrganico ?? 0;
          totals.feedCreativo += log.formatFeedCreativo ?? 0;
          totals.videoTestimonio += log.formatVideoTestimonio ?? 0;
          totals.carrusel += log.formatCarrusel ?? 0;
          totals.post += log.formatPost ?? 0;
        }
      }
    });

    return totals;
  }, [weekISOStrings, currentIso, counts, weeklyLogs]);

  // Total de publicaciones hoy
  const totalHoy = useMemo(() => {
    return Object.values(counts).reduce((a, b) => a + b, 0);
  }, [counts]);

  // Total de publicaciones en la semana
  const totalSemana = useMemo(() => {
    return Object.values(weeklyTotalsByFormat).reduce((a, b) => a + b, 0);
  }, [weeklyTotalsByFormat]);

  const metaSemanalTotal = PROJECT_TARGETS[currentProjectName] ?? 56;
  const piezasRestantes = Math.max(0, metaSemanalTotal - totalSemana);
  const avanceSemanalPct = Math.round((totalSemana / metaSemanalTotal) * 100);

  // Formatos que se publicaron hoy (conteo > 0) para la card "Publicado hoy"
  const publicadosHoy = useMemo(() => {
    return FORMATS.filter((f) => counts[f.key] > 0);
  }, [counts]);

  // Rango de texto de la semana (ej: NOV 10-14)
  const weekLabelRange = useMemo(() => {
    if (weekDays.length < 5) return "";
    const first = weekDays[0];
    const last = weekDays[4];
    const month = MONTHS_ES[first.getMonth()].toUpperCase();
    return `${month} ${first.getDate()}-${last.getDate()}`;
  }, [weekDays]);

  // Formato de fecha legible para el navbar (ej: "Lunes, 10 nov")
  const dateFormattedNavbar = useMemo(() => {
    const dayName = DAYS_ES[selectedDate.getDay()];
    const dayNum = selectedDate.getDate();
    const monthName = MONTHS_ES[selectedDate.getMonth()];
    return `${dayName}, ${dayNum} ${monthName}`;
  }, [selectedDate]);

  // Donut SVG circumference calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, avanceSemanalPct) / 100) * circumference;

  return (
    <div className="flex-1 h-full flex flex-col min-w-0 bg-bg overflow-y-auto">
      {/* Top Navbar */}
      <header className="h-[70px] shrink-0 bg-surface border-b border-[var(--border)] px-8 flex items-center justify-between gap-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-text-tertiary">Mi espacio</span>
          <span className="text-text-tertiary">›</span>
          <span className="text-text-secondary">{currentProjectName}</span>
          <span className="text-text-tertiary">›</span>
          <span className="font-bold text-text-primary">Diario de hoy</span>
        </div>

        {/* Acciones del Navbar */}
        <div className="flex items-center gap-3">
          {/* Switch de Marcas (Pill Toggle) */}
          <div className="h-9 p-1 rounded-full bg-surface-2 border border-[var(--border)] flex items-center gap-1">
            {["Casa Luifer", "Montana"].map((proj) => {
              const isActive = currentProjectName === proj;
              return (
                <button
                  key={proj}
                  type="button"
                  onClick={() => handleSelectProject(proj)}
                  className={`h-7 px-3.5 rounded-full text-[12px] font-semibold transition cursor-pointer ${
                    isActive
                      ? "bg-surface text-text-primary shadow-xs"
                      : "text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  {proj}
                </button>
              );
            })}
          </div>

          {/* Navegador de Fecha */}
          <div className="flex items-center bg-surface border border-[var(--border)] rounded-xl h-9 px-2 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition cursor-pointer"
              title="Día anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-2 text-[12.5px] font-semibold text-text-primary select-none">
              <Calendar className="w-3.5 h-3.5 text-pink-500" />
              <span>{dateFormattedNavbar}</span>
            </div>

            <button
              type="button"
              onClick={handleNextDay}
              className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition cursor-pointer"
              title="Día siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Botón Guardar Día */}
          <button
            type="button"
            onClick={handleSaveDay}
            disabled={isSaving}
            className={`h-9 px-4 rounded-xl text-[12.5px] font-semibold flex items-center gap-2 transition shadow-sm cursor-pointer ${
              savedSuccess
                ? "bg-emerald-600 text-white"
                : "bg-[#111113] text-white dark:bg-white dark:text-[#111113] hover:opacity-90 active:scale-95"
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>¡Guardado!</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Guardar día</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="p-8 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
        {/* Banner Hero */}
        <div className="rounded-2xl bg-surface border border-[var(--border)] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xs">
          <div className="flex items-center gap-4">
            {/* Avatar Círculo Rosa Iniciales */}
            <div className="w-12 h-12 rounded-full bg-pink-100/70 border border-pink-200 flex items-center justify-center shrink-0">
              <span className="text-[15px] font-bold text-pink-600">
                {currentProjectName === "Casa Luifer" ? "CL" : "MO"}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <h1 className="text-[20px] font-bold text-text-primary tracking-tight">
                Lo que publicaste en Instagram hoy
              </h1>
              <p className="text-[13px] text-text-secondary">
                {currentProjectName} · solo Instagram · meta semanal: {metaSemanalTotal} piezas
              </p>
            </div>
          </div>

          {/* 3 Pills de resumen en Hero */}
          <div className="flex items-center gap-3 shrink-0 self-stretch md:self-auto justify-end">
            <div className="w-[88px] h-[64px] rounded-xl bg-surface-2/60 border border-[var(--border)] flex flex-col items-center justify-center">
              <span className="text-[20px] font-bold text-pink-500 leading-tight">
                {totalHoy}
              </span>
              <span className="text-[10.5px] font-medium text-text-tertiary">
                Hoy
              </span>
            </div>

            <div className="w-[88px] h-[64px] rounded-xl bg-surface-2/60 border border-[var(--border)] flex flex-col items-center justify-center">
              <span className="text-[20px] font-bold text-text-primary leading-tight">
                {totalSemana}
              </span>
              <span className="text-[10.5px] font-medium text-text-tertiary">
                Semana
              </span>
            </div>

            <div className="w-[88px] h-[64px] rounded-xl bg-surface-2/60 border border-[var(--border)] flex flex-col items-center justify-center">
              <span className="text-[20px] font-bold text-emerald-500 leading-tight">
                {avanceSemanalPct}%
              </span>
              <span className="text-[10.5px] font-medium text-text-tertiary">
                Meta
              </span>
            </div>
          </div>
        </div>

        {/* Sección de 2 Columnas: Tabla de Formatos (Izquierda) + Widgets (Derecha) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Tabla de Formatos (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            {/* Título de la tabla */}
            <div className="text-[11px] font-bold tracking-wider text-text-tertiary uppercase">
              Formatos de {currentProjectName} · Metas semanales
            </div>

            {/* Contenedor tipo tabla redondeado */}
            <div className="rounded-2xl bg-surface border border-[var(--border)] overflow-hidden shadow-2xs">
              {/* Encabezado de la tabla */}
              <div className="grid grid-cols-12 px-6 py-3.5 bg-surface-2/30 border-b border-[var(--border)] text-[10.5px] font-bold text-text-tertiary uppercase tracking-wider">
                <div className="col-span-4">Formato</div>
                <div className="col-span-2 text-center">Meta Sem.</div>
                <div className="col-span-2 text-center">Hoy</div>
                <div className="col-span-2 text-center">Semana</div>
                <div className="col-span-2 text-right">Progreso</div>
              </div>

              {/* Filas de Formatos */}
              <div className="divide-y divide-[var(--border)]">
                {FORMATS.map((fmt) => {
                  const Icon = fmt.icon;
                  const target = fmt.weeklyTargets[currentProjectName] ?? 5;
                  const hoyVal = counts[fmt.key];
                  const semanaVal = weeklyTotalsByFormat[fmt.key];
                  const pct = target > 0 ? Math.round((semanaVal / target) * 100) : 0;

                  return (
                    <div
                      key={fmt.key}
                      className="grid grid-cols-12 px-6 py-3.5 items-center hover:bg-surface-2/20 transition"
                    >
                      {/* Columna Formato con Icono */}
                      <div className="col-span-4 flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg ${fmt.iconBg} flex items-center justify-center shrink-0`}
                        >
                          <Icon className={`w-4 h-4 ${fmt.iconColor}`} />
                        </div>
                        <span className="text-[13px] font-medium text-text-primary">
                          {fmt.label}
                        </span>
                      </div>

                      {/* Meta Semanal */}
                      <div className="col-span-2 text-center text-[13px] font-medium text-text-secondary">
                        {target}
                      </div>

                      {/* Selector Hoy: [-] [valor] [+] */}
                      <div className="col-span-2 flex items-center justify-center">
                        <div className="inline-flex items-center rounded-lg bg-surface-2/60 border border-[var(--border)] p-0.5">
                          <button
                            type="button"
                            onClick={() => handleDecrement(fmt.key)}
                            className="w-6 h-6 rounded flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface transition cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-[13px] font-bold text-text-primary select-none">
                            {hoyVal}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleIncrement(fmt.key)}
                            className="w-6 h-6 rounded bg-[#111113] flex items-center justify-center text-white hover:opacity-90 active:scale-95 transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Semana Acumulada */}
                      <div className="col-span-2 text-center text-[13px] font-bold text-text-primary">
                        {semanaVal} / {target}
                      </div>

                      {/* Progreso: Barra + % */}
                      <div className="col-span-2 flex items-center justify-end gap-3">
                        <div className="w-20 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, pct)}%`,
                              backgroundColor: fmt.barColor,
                            }}
                          />
                        </div>
                        <span className="text-[11.5px] font-medium text-text-tertiary w-8 text-right">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Fila Total Semanal */}
                <div className="grid grid-cols-12 px-6 py-4 items-center bg-surface-2/30 font-semibold">
                  <div className="col-span-4 flex items-center gap-2.5">
                    <span className="text-[14px]">🚩</span>
                    <span className="text-[13px] font-bold text-text-primary">
                      Total semanal
                    </span>
                  </div>

                  {/* Meta Total en Rosa */}
                  <div className="col-span-2 text-center text-[13.5px] font-bold text-pink-500">
                    {metaSemanalTotal}
                  </div>

                  {/* Hoy Total */}
                  <div className="col-span-2 text-center text-[13px] font-bold text-text-primary">
                    {totalHoy} hoy
                  </div>

                  {/* Semana Total en Rosa */}
                  <div className="col-span-2 text-center text-[13.5px] font-bold text-pink-500">
                    {totalSemana} / {metaSemanalTotal}
                  </div>

                  {/* Progreso Total */}
                  <div className="col-span-2 flex items-center justify-end gap-3">
                    <div className="w-20 h-2 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-pink-500 transition-all duration-300"
                        style={{
                          width: `${Math.min(100, avanceSemanalPct)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[12px] font-bold text-pink-500 w-8 text-right">
                      {avanceSemanalPct}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Widgets (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Card 1: ESTA SEMANA (Lunes a Viernes) */}
            <div className="rounded-2xl bg-surface border border-[var(--border)] p-6 flex flex-col gap-5 shadow-2xs">
              {/* Header */}
              <div className="flex items-center gap-2 text-[11px] font-bold text-text-tertiary tracking-wider uppercase">
                <Calendar className="w-3.5 h-3.5 text-pink-500" />
                <span>Esta semana · {weekLabelRange}</span>
              </div>

              {/* Donut Chart de Progreso Semanal */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Círculo de fondo tenue */}
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      stroke="currentColor"
                      className="text-pink-100 dark:text-pink-950/40"
                      strokeWidth="8"
                    />
                    {/* Círculo de progreso en rosa */}
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      stroke="#ec4899"
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-out"
                    />
                  </svg>

                  {/* Texto dentro del Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                    <span className="text-[20px] font-bold text-text-primary leading-tight">
                      {totalSemana} / {metaSemanalTotal}
                    </span>
                    <span className="text-[10px] text-text-tertiary font-medium">
                      piezas publicadas
                    </span>
                    <span className="text-[10.5px] font-semibold text-amber-500 mt-0.5">
                      {piezasRestantes} piezas restantes
                    </span>
                  </div>
                </div>
              </div>

              {/* Fila de Días: Lunes a Viernes exclusivamente */}
              <div className="grid grid-cols-5 gap-2">
                {weekDays.map((dayDate, idx) => {
                  const dayIso = toISODate(dayDate);
                  const isCurrentSelected = dayIso === currentIso;

                  // Calcular publicaciones de este día
                  let dayPublications = 0;
                  if (dayIso === currentIso) {
                    dayPublications = totalHoy;
                  } else if (weeklyLogs[dayIso]) {
                    const l = weeklyLogs[dayIso];
                    dayPublications =
                      (l.formatHistoriaOrganica ?? 0) +
                      (l.formatHistoriaProducto ?? 0) +
                      (l.formatHistoriaInteractiva ?? 0) +
                      (l.formatFeedOrganico ?? 0) +
                      (l.formatFeedCreativo ?? 0) +
                      (l.formatVideoTestimonio ?? 0) +
                      (l.formatCarrusel ?? 0) +
                      (l.formatPost ?? 0);
                  }

                  return (
                    <button
                      key={dayIso}
                      type="button"
                      onClick={() => setSelectedDate(dayDate)}
                      className={`h-[64px] rounded-xl flex flex-col items-center justify-center gap-1 transition cursor-pointer border ${
                        isCurrentSelected
                          ? "bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800 text-pink-600 dark:text-pink-400"
                          : "bg-surface-2/40 border-[var(--border)] text-text-secondary hover:bg-surface-2"
                      }`}
                    >
                      <span className="text-[11px] font-bold text-text-tertiary">
                        {DAY_INITIALS[idx]}
                      </span>
                      <span
                        className={`text-[15px] font-bold ${
                          isCurrentSelected ? "text-pink-600 dark:text-pink-400" : "text-text-primary"
                        }`}
                      >
                        {dayPublications}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card 2: ALCANCE */}
            <div className="rounded-2xl bg-pink-50/50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/40 p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[11px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">
                <Eye className="w-3.5 h-3.5 text-pink-500" />
                <span>Alcance</span>
              </div>
              <p className="text-[12.5px] text-pink-950 dark:text-pink-200 font-medium leading-relaxed">
                Solo Instagram/facebook. No incluye TikTok por el momento
              </p>
            </div>

            {/* Card 3: PUBLICADO HOY */}
            <div className="rounded-2xl bg-surface border border-[var(--border)] p-6 flex flex-col gap-3.5 shadow-2xs">
              <div className="flex items-center gap-2 text-[11px] font-bold text-text-tertiary tracking-wider uppercase">
                <InstagramIcon className="w-3.5 h-3.5 text-pink-500" />
                <span>Publicado hoy</span>
              </div>

              {publicadosHoy.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {publicadosHoy.map((fmt) => (
                    <div
                      key={fmt.key}
                      className="flex items-center gap-2 text-[13px] text-text-secondary"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: fmt.barColor }}
                      />
                      <span className="font-medium text-text-primary">
                        {fmt.label}
                      </span>
                      <span className="text-[11px] text-text-tertiary ml-auto font-semibold">
                        {counts[fmt.key]}x
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-text-tertiary font-medium">
                  Aún no has registrado publicaciones hoy. Usa los controles [+] de la tabla para registrar.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

