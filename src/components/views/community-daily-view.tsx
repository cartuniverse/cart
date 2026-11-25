"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Film,
  Image as ImageIcon,
  LayoutGrid,
  Loader2,
  MessageSquare,
  Mic,
  Minus,
  Plus,
  Share2,
  Sparkles,
  Trash2,
  Tv,
  Upload,
  Video,
  X,
} from "lucide-react";
import {
  getDailyCommunityLog,
  getWeeklyCommunityLogs,
  saveDailyCommunityLog,
  uploadDesignCapture,
} from "@/lib/supabase";
import type { DailyCommunityLog } from "@/lib/types";

interface CommunityDailyViewProps {
  initialProjectName?: string;
  onProjectChange?: (project: string) => void;
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
  tiktok: number;
};

interface FormatItemConfig {
  key: keyof CommunityDailyCounts;
  label: string;
  category: "historias" | "feed" | "tiktok";
  icon: any;
  color: string;
  bgSoft: string;
  weeklyTargets: Record<string, number>;
}

const ALL_FORMATS: FormatItemConfig[] = [
  // Historias
  {
    key: "historiaOrganica",
    label: "Orgánicos (Video)",
    category: "historias",
    icon: Film,
    color: "#ec4899",
    bgSoft: "bg-pink-500/10 text-pink-500",
    weeklyTargets: { "Casa Luifer": 7, Montana: 5 },
  },
  {
    key: "historiaProducto",
    label: "Producto (Foto)",
    category: "historias",
    icon: ImageIcon,
    color: "#f59e0b",
    bgSoft: "bg-amber-500/10 text-amber-500",
    weeklyTargets: { "Casa Luifer": 7, Montana: 5 },
  },
  {
    key: "historiaInteractiva",
    label: "Interactivas",
    category: "historias",
    icon: MessageSquare,
    color: "#f97316",
    bgSoft: "bg-orange-500/10 text-orange-500",
    weeklyTargets: { "Casa Luifer": 7, Montana: 5 },
  },
  // Feed
  {
    key: "feedOrganico",
    label: "Video Orgánico",
    category: "feed",
    icon: Tv,
    color: "#6366f1",
    bgSoft: "bg-indigo-500/10 text-indigo-500",
    weeklyTargets: { "Casa Luifer": 12, Montana: 8 },
  },
  {
    key: "feedCreativo",
    label: "Video Creativo",
    category: "feed",
    icon: Sparkles,
    color: "#8b5cf6",
    bgSoft: "bg-purple-500/10 text-purple-500",
    weeklyTargets: { "Casa Luifer": 9, Montana: 6 },
  },
  {
    key: "videoTestimonio",
    label: "Testimonios",
    category: "feed",
    icon: Mic,
    color: "#14b8a6",
    bgSoft: "bg-teal-500/10 text-teal-500",
    weeklyTargets: { "Casa Luifer": 7, Montana: 5 },
  },
  {
    key: "carrusel",
    label: "Carruseles",
    category: "feed",
    icon: LayoutGrid,
    color: "#10b981",
    bgSoft: "bg-emerald-500/10 text-emerald-500",
    weeklyTargets: { "Casa Luifer": 4, Montana: 3 },
  },
  {
    key: "post",
    label: "Post imagen",
    category: "feed",
    icon: Share2,
    color: "#3b82f6",
    bgSoft: "bg-blue-500/10 text-blue-500",
    weeklyTargets: { "Casa Luifer": 3, Montana: 2 },
  },
  // TikToks específicos por proyecto
  {
    key: "tiktok",
    label: "Videos TikTok",
    category: "tiktok",
    icon: Video,
    color: "#06b6d4",
    bgSoft: "bg-cyan-500/10 text-cyan-500",
    weeklyTargets: { "Casa Luifer": 5, Montana: 5 },
  },
];

const PROJECT_TARGETS: Record<string, number> = {
  "Casa Luifer": 61, // 56 instagram + 5 tiktok
  Montana: 44, // 39 instagram + 5 tiktok
};

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

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DAY_LETTERS = ["L", "M", "M", "J", "V"];

export function CommunityDailyView({
  initialProjectName = "Casa Luifer",
  onProjectChange,
}: CommunityDailyViewProps) {
  const [currentProjectName, setCurrentProjectName] = useState(initialProjectName);

  useEffect(() => {
    if (initialProjectName && initialProjectName !== currentProjectName) {
      setCurrentProjectName(initialProjectName);
    }
  }, [initialProjectName]);

  const handleSelectProject = (proj: string) => {
    setCurrentProjectName(proj);
    onProjectChange?.(proj);
  };

  // Fecha seleccionada y Calendario
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [showCalendarPopover, setShowCalendarPopover] = useState(false);

  // Tab activo: "diario" o "resumen_semanal"
  const [activeTab, setActiveTab] = useState<"diario" | "resumen">("diario");

  // Contadores diarios
  const [counts, setCounts] = useState<CommunityDailyCounts>({
    historiaOrganica: 0,
    historiaProducto: 0,
    historiaInteractiva: 0,
    feedOrganico: 0,
    feedCreativo: 0,
    videoTestimonio: 0,
    carrusel: 0,
    post: 0,
    tiktok: 0,
  });

  // Logs semanales
  const [weeklyLogs, setWeeklyLogs] = useState<Record<string, DailyCommunityLog>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Estado adicional para TikTok del otro proyecto
  const [otherProjectTiktok, setOtherProjectTiktok] = useState<number>(0);
  const [otherWeeklyTiktok, setOtherWeeklyTiktok] = useState<number>(0);
  const otherProjectName = currentProjectName === "Casa Luifer" ? "Montana" : "Casa Luifer";

  // Capturas de pantalla para cada una de las 3 historias
  const [storyCaptures, setStoryCaptures] = useState<{
    video: string;
    producto: string;
    interactiva: string;
  }>({
    video: "",
    producto: "",
    interactiva: "",
  });
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [previewModal, setPreviewModal] = useState<{ url: string; title: string } | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const productoInputRef = useRef<HTMLInputElement>(null);
  const interactivaInputRef = useRef<HTMLInputElement>(null);

  const weekDays = useMemo(() => getMondayToFriday(selectedDate), [selectedDate]);
  const weekISOStrings = useMemo(() => weekDays.map((d) => toISODate(d)), [weekDays]);
  const currentIso = useMemo(() => toISODate(selectedDate), [selectedDate]);

  // Cargar registro de hoy y semana
  useEffect(() => {
    let active = true;

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
          tiktok: log.formatTiktok ?? 0,
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
          tiktok: 0,
        });
      }
    });

    getWeeklyCommunityLogs(weekISOStrings, currentProjectName).then((res) => {
      if (!active) return;
      setWeeklyLogs(res);
    });

    // Cargar también TikTok del otro proyecto
    getDailyCommunityLog(currentIso, otherProjectName).then((log) => {
      if (!active) return;
      setOtherProjectTiktok(log?.formatTiktok ?? 0);
    });
    getWeeklyCommunityLogs(weekISOStrings, otherProjectName).then((res) => {
      if (!active) return;
      let sum = 0;
      Object.values(res).forEach((l) => {
        sum += l.formatTiktok ?? 0;
      });
      setOtherWeeklyTiktok(sum);
    });

    // Cargar capturas de historias guardadas (video, producto, interactiva)
    if (typeof window !== "undefined") {
      const v = localStorage.getItem(`community_story_capture_${currentIso}_${currentProjectName}_video`) ||
        localStorage.getItem(`community_story_capture_${currentIso}_${currentProjectName}`) || "";
      const p = localStorage.getItem(`community_story_capture_${currentIso}_${currentProjectName}_producto`) || "";
      const i = localStorage.getItem(`community_story_capture_${currentIso}_${currentProjectName}_interactiva`) || "";
      setStoryCaptures({ video: v, producto: p, interactiva: i });
    }

    return () => {
      active = false;
    };
  }, [currentIso, currentProjectName, otherProjectName, weekISOStrings]);

  const handleOtherTiktokChange = async (delta: number) => {
    const newVal = Math.max(0, otherProjectTiktok + delta);
    setOtherProjectTiktok(newVal);
    try {
      await saveDailyCommunityLog({
        date: currentIso,
        cmId: "valentina-c",
        cmName: "Lizz",
        projectName: otherProjectName,
        formatHistoriaOrganica: 0,
        formatHistoriaProducto: 0,
        formatHistoriaInteractiva: 0,
        formatFeedOrganico: 0,
        formatFeedCreativo: 0,
        formatVideoTestimonio: 0,
        formatCarrusel: 0,
        formatPost: 0,
        formatTiktok: newVal,
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("daily_log_updated"));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleIncrement = (key: keyof CommunityDailyCounts) => {
    setCounts((prev) => ({ ...prev, [key]: prev[key] + 1 }));
  };

  const handleDecrement = (key: keyof CommunityDailyCounts) => {
    setCounts((prev) => ({ ...prev, [key]: Math.max(0, prev[key] - 1) }));
  };

  const handleSaveDay = async () => {
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const saved = await saveDailyCommunityLog({
        date: currentIso,
        cmId: "valentina-c",
        cmName: "Lizz",
        projectName: currentProjectName,
        formatHistoriaOrganica: counts.historiaOrganica,
        formatHistoriaProducto: counts.historiaProducto,
        formatHistoriaInteractiva: counts.historiaInteractiva,
        formatFeedOrganico: counts.feedOrganico,
        formatFeedCreativo: counts.feedCreativo,
        formatVideoTestimonio: counts.videoTestimonio,
        formatCarrusel: counts.carrusel,
        formatPost: counts.post,
        formatTiktok: counts.tiktok,
      });

      setWeeklyLogs((prev) => ({
        ...prev,
        [currentIso]: saved,
      }));

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

  const handleStoryUpload = async (file: File, type: "video" | "producto" | "interactiva") => {
    setUploadingCategory(type);
    const url = await uploadDesignCapture(file, "lizz", currentIso, `${currentProjectName}_historia_${type}`);
    const saveUrl = (finalUrl: string) => {
      setStoryCaptures((prev) => ({ ...prev, [type]: finalUrl }));
      if (typeof window !== "undefined") {
        localStorage.setItem(`community_story_capture_${currentIso}_${currentProjectName}_${type}`, finalUrl);
        // Guardar también en fallback para compatibilidad con el dashboard
        if (type === "video") {
          localStorage.setItem(`community_story_capture_${currentIso}_${currentProjectName}`, finalUrl);
        }
        window.dispatchEvent(new Event("daily_log_updated"));
      }
    };

    if (url) {
      saveUrl(url);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) saveUrl(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    }
    setUploadingCategory(null);
  };

  const handleRemoveStoryCapture = (type: "video" | "producto" | "interactiva") => {
    setStoryCaptures((prev) => ({ ...prev, [type]: "" }));
    if (typeof window !== "undefined") {
      localStorage.removeItem(`community_story_capture_${currentIso}_${currentProjectName}_${type}`);
      if (type === "video") {
        localStorage.removeItem(`community_story_capture_${currentIso}_${currentProjectName}`);
      }
      window.dispatchEvent(new Event("daily_log_updated"));
    }
  };

  // Totales acumulados de la semana por formato
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
      tiktok: 0,
    };

    weekISOStrings.forEach((dateKey) => {
      if (dateKey === currentIso) {
        totals.historiaOrganica += counts.historiaOrganica;
        totals.historiaProducto += counts.historiaProducto;
        totals.historiaInteractiva += counts.historiaInteractiva;
        totals.feedOrganico += counts.feedOrganico;
        totals.feedCreativo += counts.feedCreativo;
        totals.videoTestimonio += counts.videoTestimonio;
        totals.carrusel += counts.carrusel;
        totals.post += counts.post;
        totals.tiktok += counts.tiktok;
      } else {
        const log = weeklyLogs[dateKey];
        if (log) {
          totals.historiaOrganica += log.formatHistoriaOrganica ?? 0;
          totals.historiaProducto += log.formatHistoriaProducto ?? 0;
          totals.historiaInteractiva += log.formatHistoriaInteractiva ?? 0;
          totals.feedOrganico += log.formatFeedOrganico ?? 0;
          totals.feedCreativo += log.formatFeedCreativo ?? 0;
          totals.videoTestimonio += log.formatVideoTestimonio ?? 0;
          totals.carrusel += log.formatCarrusel ?? 0;
          totals.post += log.formatPost ?? 0;
          totals.tiktok += log.formatTiktok ?? 0;
        }
      }
    });

    return totals;
  }, [weekISOStrings, currentIso, counts, weeklyLogs]);

  const totalHoy = useMemo(() => {
    return Object.values(counts).reduce((acc, v) => acc + v, 0);
  }, [counts]);

  const totalSemana = useMemo(() => {
    return Object.values(weeklyTotalsByFormat).reduce((acc, v) => acc + v, 0);
  }, [weeklyTotalsByFormat]);

  const metaSemanalTotal = PROJECT_TARGETS[currentProjectName] ?? 56;
  const avanceSemanalPct = Math.min(100, Math.round((totalSemana / metaSemanalTotal) * 100));

  // Título dinámico para el formato TikTok según la marca
  const tiktokLabel =
    currentProjectName === "Casa Luifer" ? "Videos TikTok Casa Luifer" : "Videos TikTok Montana";

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-bg overflow-y-auto pb-12">
      {/* ── HEADER SUPERIOR ── */}
      <header className="h-[60px] bg-surface border-b border-[var(--border)] px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[12.5px] font-medium text-text-tertiary">
            <span>Mi espacio</span>
            <span>›</span>
            <span className="text-text-primary font-semibold">Diario de hoy</span>
          </div>

          {/* Toggle de vistas: Diario vs Resumen Semanal */}
          <div className="hidden sm:flex items-center p-0.5 rounded-xl bg-surface-2 ml-4">
            <button
              type="button"
              onClick={() => setActiveTab("diario")}
              className={`px-3 py-1 rounded-lg text-[12px] font-semibold transition cursor-pointer ${
                activeTab === "diario" ? "bg-surface text-text-primary shadow-xs" : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              Registro diario
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("resumen")}
              className={`px-3 py-1 rounded-lg text-[12px] font-semibold transition cursor-pointer ${
                activeTab === "resumen" ? "bg-surface text-text-primary shadow-xs" : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              Resumen semanal
            </button>
          </div>
        </div>

        {/* Controles de marca, fecha y guardado */}
        <div className="flex items-center gap-3">
          {/* Selector de Proyecto */}
          <div className="flex items-center bg-surface-2 p-0.5 rounded-xl">
            {["Casa Luifer", "Montana"].map((proj) => {
              const isActive = proj === currentProjectName;
              return (
                <button
                  key={proj}
                  type="button"
                  onClick={() => handleSelectProject(proj)}
                  className={`h-7 px-3 rounded-lg text-[12px] font-semibold transition cursor-pointer ${
                    isActive ? "bg-surface text-text-primary shadow-xs" : "text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  {proj}
                </button>
              );
            })}
          </div>

          {/* CALENDARIO Y NAVEGADOR DE FECHA */}
          <div className="relative">
            <div className="flex items-center bg-surface border border-[var(--border)] rounded-xl h-9 px-1.5 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  const prev = new Date(selectedDate);
                  prev.setDate(prev.getDate() - 1);
                  setSelectedDate(prev);
                }}
                className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition cursor-pointer"
                title="Día anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowCalendarPopover(!showCalendarPopover)}
                className="flex items-center gap-2 px-2 text-[12px] font-semibold text-text-primary hover:text-pink-500 transition cursor-pointer"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-pink-500" />
                <span className="capitalize">
                  {selectedDate.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = new Date(selectedDate);
                  next.setDate(next.getDate() + 1);
                  setSelectedDate(next);
                }}
                className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition cursor-pointer"
                title="Día siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* POPOVER CALENDARIO */}
            {showCalendarPopover && (
              <div className="absolute right-0 mt-2 z-50 bg-surface rounded-2xl p-4 shadow-xl border border-[var(--border)] w-64">
                <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
                  Seleccionar día
                </div>
                <input
                  type="date"
                  value={currentIso}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(new Date(e.target.value + "T12:00:00"));
                      setShowCalendarPopover(false);
                    }
                  }}
                  className="w-full text-xs p-2.5 bg-surface-2 rounded-xl mb-3 text-text-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(new Date());
                    setShowCalendarPopover(false);
                  }}
                  className="w-full text-center text-xs font-semibold bg-pink-500 text-white hover:bg-pink-600 py-2 rounded-xl transition shadow-xs cursor-pointer"
                >
                  Ir a Hoy
                </button>
              </div>
            )}
          </div>

          {/* Botón Guardar */}
          <button
            type="button"
            onClick={handleSaveDay}
            disabled={isSaving}
            className={`h-9 px-4 rounded-xl text-[12px] font-semibold flex items-center gap-2 transition shadow-xs cursor-pointer ${
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

      {/* ── CONTENIDO PRINCIPAL ── */}
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
        {/* Banner Hero */}
        <div className="rounded-2xl bg-surface p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center font-bold text-base shrink-0">
              {currentProjectName === "Casa Luifer" ? "CL" : "MT"}
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-text-primary tracking-tight">
                {activeTab === "diario" ? "Registro diario de publicaciones" : "Resumen Semanal de Publicaciones"}
              </h1>
              <p className="text-[13px] text-text-secondary">
                {currentProjectName} · Meta semanal: {metaSemanalTotal} piezas ({metaSemanalTotal - 5} Instagram + 5 TikTok)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="w-24 h-16 rounded-xl bg-surface-2 p-2 flex flex-col items-center justify-center">
              <span className="text-[22px] font-bold text-pink-500 leading-none">{totalHoy}</span>
              <span className="text-[11px] font-medium text-text-tertiary mt-1">Hoy</span>
            </div>
            <div className="w-24 h-16 rounded-xl bg-surface-2 p-2 flex flex-col items-center justify-center">
              <span className="text-[22px] font-bold text-text-primary leading-none">{totalSemana}</span>
              <span className="text-[11px] font-medium text-text-tertiary mt-1">Semana</span>
            </div>
            <div className="w-24 h-16 rounded-xl bg-surface-2 p-2 flex flex-col items-center justify-center">
              <span className="text-[22px] font-bold text-emerald-500 leading-none">{avanceSemanalPct}%</span>
              <span className="text-[11px] font-medium text-text-tertiary mt-1">Meta</span>
            </div>
          </div>
        </div>

        {/* SELECTOR DE DÍAS L-V */}
        <div className="grid grid-cols-5 gap-2.5">
          {weekDays.map((d, idx) => {
            const iso = weekISOStrings[idx];
            const isSelected = iso === currentIso;
            const count = iso === currentIso
              ? counts.historiaOrganica +
                counts.historiaProducto +
                counts.historiaInteractiva +
                counts.feedOrganico +
                counts.feedCreativo +
                counts.videoTestimonio +
                counts.carrusel +
                counts.post +
                counts.tiktok
              : (() => {
                  const l = weeklyLogs[iso];
                  return l
                    ? (l.formatHistoriaOrganica ?? 0) +
                      (l.formatHistoriaProducto ?? 0) +
                      (l.formatHistoriaInteractiva ?? 0) +
                      (l.formatFeedOrganico ?? 0) +
                      (l.formatFeedCreativo ?? 0) +
                      (l.formatVideoTestimonio ?? 0) +
                      (l.formatCarrusel ?? 0) +
                      (l.formatPost ?? 0) +
                      (l.formatTiktok ?? 0)
                    : 0;
                })();

            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelectedDate(new Date(iso + "T12:00:00"))}
                className={`rounded-xl p-3 flex flex-col items-center gap-1 transition cursor-pointer shadow-2xs ${
                  isSelected
                    ? "bg-pink-500 text-white font-bold"
                    : "bg-surface hover:bg-surface-2 text-text-secondary"
                }`}
              >
                <span className="text-[11px] uppercase tracking-wider">{DAY_LETTERS[idx]}</span>
                <span className={`text-[17px] font-bold ${isSelected ? "text-white" : "text-text-primary"}`}>
                  {count}
                </span>
                <span className={`text-[10px] ${isSelected ? "text-white/80" : "text-text-tertiary"}`}>
                  {d.getDate()} {MONTH_NAMES[d.getMonth()].slice(0, 3)}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── VISTA 1: REGISTRO DIARIO ── */}
        {activeTab === "diario" && (
          <div className="flex flex-col gap-6">
            {/* SECCIÓN 1: HISTORIAS (CON CAPTURA DE PANTALLA) */}
            <div className="rounded-2xl bg-surface p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold text-text-primary">
                      1. Historias Instagram · {currentProjectName}
                    </h2>
                    <p className="text-[11px] text-text-tertiary">
                      Registra los formatos y adjunta la captura de historias de hoy
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-pink-500/10 text-pink-500">
                  {counts.historiaOrganica + counts.historiaProducto + counts.historiaInteractiva} historias hoy
                </span>
              </div>

              {/* Cards de formatos de historias */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ALL_FORMATS.filter((f) => f.category === "historias").map((fmt) => {
                  const Icon = fmt.icon;
                  const target = fmt.weeklyTargets[currentProjectName] ?? 5;
                  const hoyVal = counts[fmt.key];
                  const semanaVal = weeklyTotalsByFormat[fmt.key];

                  return (
                    <div
                      key={fmt.key}
                      className={`rounded-xl p-3.5 flex flex-col justify-between gap-3 transition shadow-2xs ${
                        hoyVal > 0 ? "bg-pink-500/10" : "bg-surface-2/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center shrink-0 shadow-2xs">
                            <Icon className="w-3.5 h-3.5" style={{ color: fmt.color }} />
                          </div>
                          <span className="text-[12.5px] font-bold text-text-primary leading-tight">
                            {fmt.label}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-text-tertiary shrink-0">
                          {semanaVal}/{target}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-surface rounded-xl p-1 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleDecrement(fmt.key)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-surface-2 transition cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[17px] font-bold text-text-primary select-none">
                          {hoyVal}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleIncrement(fmt.key)}
                          className="w-8 h-8 rounded-lg bg-[#111113] dark:bg-white text-white dark:text-[#111113] flex items-center justify-center hover:opacity-90 active:scale-95 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 3 CAPTURAS DE PANTALLA DE HISTORIAS: VIDEO, PRODUCTO E INTERACTIVA */}
              <div className="pt-3 border-t border-[var(--border)] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-text-primary flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-pink-500" />
                    Capturas de pantalla de Historias (3 capturas)
                  </span>
                  <span className="text-[10.5px] text-text-tertiary">
                    {[storyCaptures.video, storyCaptures.producto, storyCaptures.interactiva].filter(Boolean).length}/3 adjuntas
                  </span>
                </div>

                <input
                  ref={videoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleStoryUpload(file, "video");
                    e.target.value = "";
                  }}
                />
                <input
                  ref={productoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleStoryUpload(file, "producto");
                    e.target.value = "";
                  }}
                />
                <input
                  ref={interactivaInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleStoryUpload(file, "interactiva");
                    e.target.value = "";
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: "video" as const,
                      title: "Historia de video",
                      hint: "Orgánico",
                      color: "#ec4899",
                      inputRef: videoInputRef,
                      capture: storyCaptures.video,
                    },
                    {
                      id: "producto" as const,
                      title: "Historia de producto",
                      hint: "Foto producto",
                      color: "#f59e0b",
                      inputRef: productoInputRef,
                      capture: storyCaptures.producto,
                    },
                    {
                      id: "interactiva" as const,
                      title: "Historia interactiva",
                      hint: "Encuesta o sticker",
                      color: "#f97316",
                      inputRef: interactivaInputRef,
                      capture: storyCaptures.interactiva,
                    },
                  ].map((slot) => (
                    <div
                      key={slot.id}
                      className="rounded-xl bg-surface-2/60 p-3 flex flex-col justify-between gap-2.5 shadow-2xs border border-[var(--border)]"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[12px] font-bold text-text-primary leading-tight">
                            {slot.title}
                          </div>
                          <div className="text-[10px] text-text-tertiary">
                            {slot.hint}
                          </div>
                        </div>
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: slot.color }}
                        />
                      </div>

                      {slot.capture ? (
                        <div className="relative group rounded-lg overflow-hidden bg-surface p-1.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={slot.capture}
                              alt={slot.title}
                              className="w-10 h-10 rounded-md object-cover cursor-pointer border border-border shrink-0"
                              onClick={() => setPreviewModal({ url: slot.capture, title: slot.title })}
                            />
                            <div className="min-w-0">
                              <span className="text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 block truncate">
                                ✓ Adjunta
                              </span>
                              <button
                                type="button"
                                onClick={() => setPreviewModal({ url: slot.capture, title: slot.title })}
                                className="text-[10px] text-pink-500 hover:underline cursor-pointer"
                              >
                                Ver imagen
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveStoryCapture(slot.id)}
                            title="Cambiar imagen"
                            className="w-7 h-7 rounded-md bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => slot.inputRef.current?.click()}
                          disabled={uploadingCategory === slot.id}
                          className="w-full h-11 rounded-lg bg-surface hover:bg-surface-2 text-text-secondary hover:text-text-primary flex items-center justify-center gap-2 text-[11px] font-semibold transition cursor-pointer border border-dashed border-border"
                        >
                          {uploadingCategory === slot.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-500" />
                              <span>Subiendo...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5 text-pink-500" />
                              <span>Adjuntar captura</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: FEED INSTAGRAM */}
            <div className="rounded-2xl bg-surface p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold text-text-primary">
                      2. Feed Instagram · {currentProjectName}
                    </h2>
                    <p className="text-[11px] text-text-tertiary">
                      Videos orgánicos, creativos, testimonios, carruseles y posts
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500">
                  {counts.feedOrganico + counts.feedCreativo + counts.videoTestimonio + counts.carrusel + counts.post} piezas hoy
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {ALL_FORMATS.filter((f) => f.category === "feed").map((fmt) => {
                  const Icon = fmt.icon;
                  const target = fmt.weeklyTargets[currentProjectName] ?? 5;
                  const hoyVal = counts[fmt.key];
                  const semanaVal = weeklyTotalsByFormat[fmt.key];

                  return (
                    <div
                      key={fmt.key}
                      className={`rounded-xl p-3 flex flex-col justify-between gap-3 transition shadow-2xs ${
                        hoyVal > 0 ? "bg-indigo-500/10" : "bg-surface-2/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-surface flex items-center justify-center shrink-0 shadow-2xs">
                            <Icon className="w-3.5 h-3.5" style={{ color: fmt.color }} />
                          </div>
                          <span className="text-[12px] font-bold text-text-primary leading-tight truncate">
                            {fmt.label}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-text-tertiary shrink-0">
                          {semanaVal}/{target}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-surface rounded-xl p-1 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleDecrement(fmt.key)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:bg-surface-2 transition cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-[16px] font-bold text-text-primary select-none">
                          {hoyVal}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleIncrement(fmt.key)}
                          className="w-7 h-7 rounded-lg bg-[#111113] dark:bg-white text-white dark:text-[#111113] flex items-center justify-center hover:opacity-90 active:scale-95 transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN 3: TIKTOKS (CASA LUIFER Y MONTANA LADO A LADO) */}
            <div className="rounded-2xl bg-surface p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold text-text-primary">
                      3. TikToks de marcas
                    </h2>
                    <p className="text-[11px] text-text-tertiary">
                      Registro de videos publicados en las cuentas de TikTok (Casa Luifer y Montana)
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-500">
                  {counts.tiktok + otherProjectTiktok} tiktoks hoy
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tarjeta TikTok Casa Luifer */}
                <div
                  className={`rounded-xl p-4 flex items-center justify-between gap-4 transition shadow-2xs ${
                    (currentProjectName === "Casa Luifer" ? counts.tiktok : otherProjectTiktok) > 0
                      ? "bg-pink-500/10 border border-pink-500/20"
                      : "bg-surface-2/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center shrink-0 shadow-2xs text-pink-500 font-bold text-xs">
                      CL
                    </div>
                    <div>
                      <div className="text-[13.5px] font-bold text-text-primary">
                        Videos TikTok Casa Luifer
                      </div>
                      <div className="text-[11px] text-text-tertiary">
                        Semana:{" "}
                        <strong className="text-text-primary">
                          {currentProjectName === "Casa Luifer"
                            ? weeklyTotalsByFormat.tiktok
                            : otherWeeklyTiktok + otherProjectTiktok}
                        </strong>{" "}
                        / 5 videos
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center bg-surface rounded-xl p-1 shadow-2xs shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (currentProjectName === "Casa Luifer") {
                          handleDecrement("tiktok");
                        } else {
                          handleOtherTiktokChange(-1);
                        }
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-surface-2 transition cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-9 text-center text-[17px] font-bold text-text-primary select-none">
                      {currentProjectName === "Casa Luifer" ? counts.tiktok : otherProjectTiktok}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (currentProjectName === "Casa Luifer") {
                          handleIncrement("tiktok");
                        } else {
                          handleOtherTiktokChange(1);
                        }
                      }}
                      className="w-8 h-8 rounded-lg bg-[#111113] dark:bg-white text-white dark:text-[#111113] flex items-center justify-center hover:opacity-90 active:scale-95 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Tarjeta TikTok Montana */}
                <div
                  className={`rounded-xl p-4 flex items-center justify-between gap-4 transition shadow-2xs ${
                    (currentProjectName === "Montana" ? counts.tiktok : otherProjectTiktok) > 0
                      ? "bg-blue-500/10 border border-blue-500/20"
                      : "bg-surface-2/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center shrink-0 shadow-2xs text-blue-500 font-bold text-xs">
                      MT
                    </div>
                    <div>
                      <div className="text-[13.5px] font-bold text-text-primary">
                        Videos TikTok Montana
                      </div>
                      <div className="text-[11px] text-text-tertiary">
                        Semana:{" "}
                        <strong className="text-text-primary">
                          {currentProjectName === "Montana"
                            ? weeklyTotalsByFormat.tiktok
                            : otherWeeklyTiktok + otherProjectTiktok}
                        </strong>{" "}
                        / 5 videos
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center bg-surface rounded-xl p-1 shadow-2xs shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (currentProjectName === "Montana") {
                          handleDecrement("tiktok");
                        } else {
                          handleOtherTiktokChange(-1);
                        }
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-surface-2 transition cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-9 text-center text-[17px] font-bold text-text-primary select-none">
                      {currentProjectName === "Montana" ? counts.tiktok : otherProjectTiktok}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (currentProjectName === "Montana") {
                          handleIncrement("tiktok");
                        } else {
                          handleOtherTiktokChange(1);
                        }
                      }}
                      className="w-8 h-8 rounded-lg bg-[#111113] dark:bg-white text-white dark:text-[#111113] flex items-center justify-center hover:opacity-90 active:scale-95 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── VISTA 2: RESUMEN SEMANAL CLARO Y CON NÚMEROS PUNTUALES ── */}
        {activeTab === "resumen" && (
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl bg-surface p-6 shadow-sm flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--border)]">
                <div>
                  <h2 className="text-[16px] font-bold text-text-primary">
                    Resumen Semanal Consolidado · {currentProjectName}
                  </h2>
                  <p className="text-[12px] text-text-tertiary">
                    Auditoría puntual de cada formato y día de la semana
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-xl bg-pink-500/10 text-pink-500 font-bold text-[12px]">
                    Total: {totalSemana} de {metaSemanalTotal} piezas ({avanceSemanalPct}%)
                  </div>
                </div>
              </div>

              {/* TABLA RESUMEN CON NÚMEROS PUNTUALES */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-text-tertiary uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3">Formato creativo</th>
                      {weekDays.map((d, i) => (
                        <th key={d.toISOString()} className="py-3 px-2 text-center">
                          {DAY_LETTERS[i]} ({d.getDate()})
                        </th>
                      ))}
                      <th className="py-3 px-3 text-center font-bold text-text-primary">Semana</th>
                      <th className="py-3 px-3 text-center">Meta</th>
                      <th className="py-3 px-3 text-right">Cumplimiento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {ALL_FORMATS.map((fmt) => {
                      const target = fmt.weeklyTargets[currentProjectName] ?? 5;
                      const totalFormat = weeklyTotalsByFormat[fmt.key];
                      const pct = target > 0 ? Math.min(100, Math.round((totalFormat / target) * 100)) : 0;
                      const label = fmt.key === "tiktok" ? tiktokLabel : fmt.label;

                      return (
                        <tr key={fmt.key} className="hover:bg-surface-2/40 transition">
                          <td className="py-3 px-3 font-semibold text-text-primary flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fmt.color }} />
                            <span>{label}</span>
                          </td>
                          {weekISOStrings.map((iso) => {
                            const isSelected = iso === currentIso;
                            const count = isSelected
                              ? counts[fmt.key]
                              : (weeklyLogs[iso] as any)?.[`format${fmt.key.charAt(0).toUpperCase() + fmt.key.slice(1)}`] ??
                                (weeklyLogs[iso] as any)?.[fmt.key] ??
                                0;

                            return (
                              <td key={iso} className="py-3 px-2 text-center">
                                <span
                                  className={`inline-block w-7 py-0.5 rounded-md text-[11.5px] font-bold ${
                                    count > 0 ? "bg-surface-2 text-text-primary" : "text-text-tertiary"
                                  }`}
                                >
                                  {count}
                                </span>
                              </td>
                            );
                          })}
                          <td className="py-3 px-3 text-center font-bold text-text-primary">
                            {totalFormat}
                          </td>
                          <td className="py-3 px-3 text-center font-medium text-text-secondary">
                            {target}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-pink-500">
                            {pct}%
                          </td>
                        </tr>
                      );
                    })}

                    {/* Fila Total General */}
                    <tr className="bg-surface-2/60 font-bold text-text-primary text-[13px]">
                      <td className="py-3.5 px-3">TOTAL GENERAL</td>
                      {weekDays.map((_, i) => {
                        const iso = weekISOStrings[i];
                        const count = iso === currentIso
                          ? counts.historiaOrganica +
                            counts.historiaProducto +
                            counts.historiaInteractiva +
                            counts.feedOrganico +
                            counts.feedCreativo +
                            counts.videoTestimonio +
                            counts.carrusel +
                            counts.post +
                            counts.tiktok
                          : (() => {
                              const l = weeklyLogs[iso];
                              return l
                                ? (l.formatHistoriaOrganica ?? 0) +
                                  (l.formatHistoriaProducto ?? 0) +
                                  (l.formatHistoriaInteractiva ?? 0) +
                                  (l.formatFeedOrganico ?? 0) +
                                  (l.formatFeedCreativo ?? 0) +
                                  (l.formatVideoTestimonio ?? 0) +
                                  (l.formatCarrusel ?? 0) +
                                  (l.formatPost ?? 0) +
                                  (l.formatTiktok ?? 0)
                                : 0;
                            })();
                        return (
                          <td key={iso} className="py-3.5 px-2 text-center text-pink-500 font-bold">
                            {count}
                          </td>
                        );
                      })}
                      <td className="py-3.5 px-3 text-center text-[15px] text-pink-500 font-bold">
                        {totalSemana}
                      </td>
                      <td className="py-3.5 px-3 text-center text-[14px]">
                        {metaSemanalTotal}
                      </td>
                      <td className="py-3.5 px-3 text-right text-[14px] text-emerald-500 font-bold">
                        {avanceSemanalPct}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para ver captura de Historias en pantalla completa */}
      {previewModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewModal(null)}
        >
          <div
            className="relative max-w-lg w-full bg-surface rounded-3xl p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-sm font-bold text-text-primary">
                {previewModal.title} · {currentProjectName}
              </span>
              <button
                type="button"
                onClick={() => setPreviewModal(null)}
                className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewModal.url}
              alt={previewModal.title}
              className="w-full max-h-[75vh] object-contain rounded-2xl bg-black/5"
            />
          </div>
        </div>
      )}
    </div>
  );
}
