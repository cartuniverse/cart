"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Film,
  Image as ImageIcon,
  MessageSquare,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { getWeeklyCommunityLogs } from "@/lib/supabase";
import type { DailyCommunityLog } from "@/lib/types";

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

const DAY_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

const FORMAT_LIST: {
  key: keyof DailyCommunityLog;
  label: string;
  color: string;
  targetCL: number;
  targetMT: number;
}[] = [
  { key: "formatHistoriaOrganica", label: "Hist. Orgánica", color: "#ec4899", targetCL: 7, targetMT: 5 },
  { key: "formatHistoriaProducto", label: "Hist. Producto", color: "#f59e0b", targetCL: 7, targetMT: 5 },
  { key: "formatHistoriaInteractiva", label: "Hist. Interactiva", color: "#f97316", targetCL: 7, targetMT: 5 },
  { key: "formatFeedOrganico", label: "Feed Orgánico", color: "#6366f1", targetCL: 12, targetMT: 8 },
  { key: "formatFeedCreativo", label: "Feed Creativo", color: "#8b5cf6", targetCL: 9, targetMT: 6 },
  { key: "formatVideoTestimonio", label: "Testimonios", color: "#14b8a6", targetCL: 7, targetMT: 5 },
  { key: "formatCarrusel", label: "Carruseles", color: "#10b981", targetCL: 4, targetMT: 3 },
  { key: "formatPost", label: "Posts", color: "#3b82f6", targetCL: 3, targetMT: 2 },
  { key: "formatTiktok", label: "TikTok", color: "#06b6d4", targetCL: 5, targetMT: 5 },
];

export function AdminCommunityCalendarView() {
  const [selectedBrand, setSelectedBrand] = useState<"Casa Luifer" | "Montana">("Casa Luifer");
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [showCalendarPopover, setShowCalendarPopover] = useState(false);

  const weekDays = useMemo(() => getMondayToFriday(selectedDate), [selectedDate]);
  const weekISODates = useMemo(() => weekDays.map((d) => toISODate(d)), [weekDays]);

  const [weeklyLogs, setWeeklyLogs] = useState<Record<string, DailyCommunityLog>>({});
  const [capturesByDay, setCapturesByDay] = useState<
    Record<string, { video: string[]; producto: string[]; interactiva: string[] }>
  >({});
  const [previewModal, setPreviewModal] = useState<{ url: string; title: string } | null>(null);

  const loadData = useCallback(() => {
    getWeeklyCommunityLogs(weekISODates, selectedBrand).then((logs) => {
      setWeeklyLogs(logs);
    });

    if (typeof window !== "undefined") {
      const caps: Record<string, { video: string[]; producto: string[]; interactiva: string[] }> = {};
      weekISODates.forEach((iso) => {
        const parseList = (key: string, fallbackKey?: string): string[] => {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) return parsed;
              if (typeof parsed === "string" && parsed) return [parsed];
            } catch {
              if (raw) return [raw];
            }
          }
          if (fallbackKey) {
            const fallbackRaw = localStorage.getItem(fallbackKey);
            if (fallbackRaw) {
              try {
                const p = JSON.parse(fallbackRaw);
                if (Array.isArray(p)) return p;
                if (typeof p === "string" && p) return [p];
              } catch {
                return [fallbackRaw];
              }
            }
          }
          return [];
        };

        caps[iso] = {
          video: parseList(
            `community_story_captures_${iso}_${selectedBrand}_video`,
            `community_story_capture_${iso}_${selectedBrand}_video`
          ),
          producto: parseList(
            `community_story_captures_${iso}_${selectedBrand}_producto`,
            `community_story_capture_${iso}_${selectedBrand}_producto`
          ),
          interactiva: parseList(
            `community_story_captures_${iso}_${selectedBrand}_interactiva`,
            `community_story_capture_${iso}_${selectedBrand}_interactiva`
          ),
        };
      });
      setCapturesByDay(caps);
    }
  }, [weekISODates, selectedBrand]);

  useEffect(() => {
    loadData();
    if (typeof window !== "undefined") {
      window.addEventListener("daily_log_updated", loadData);
      return () => window.removeEventListener("daily_log_updated", loadData);
    }
  }, [loadData]);

  // Metas del proyecto
  const weeklyTarget = selectedBrand === "Casa Luifer" ? 61 : 44;

  // Total publicado en la semana
  const weeklyTotals = useMemo(() => {
    let totalPublished = 0;
    const byFormat: Record<string, number> = {};

    FORMAT_LIST.forEach((f) => {
      byFormat[f.key] = 0;
    });

    Object.values(weeklyLogs).forEach((log) => {
      FORMAT_LIST.forEach((f) => {
        const val = (log[f.key] as number) ?? 0;
        byFormat[f.key] += val;
        totalPublished += val;
      });
    });

    const pending = Math.max(0, weeklyTarget - totalPublished);
    const complianceRate = Math.min(100, Math.round((totalPublished / weeklyTarget) * 100));

    // Total de capturas subidas
    let totalCaptures = 0;
    Object.values(capturesByDay).forEach((day) => {
      totalCaptures += day.video.length + day.producto.length + day.interactiva.length;
    });

    return {
      totalPublished,
      pending,
      complianceRate,
      byFormat,
      totalCaptures,
    };
  }, [weeklyLogs, weeklyTarget, capturesByDay]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-bg overflow-y-auto pb-16">
      {/* ── HEADER SUPERIOR ── */}
      <header className="h-[64px] bg-surface border-b border-[var(--border)] px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[12.5px] font-medium text-text-tertiary">
            <span>Administración</span>
            <span>›</span>
            <span className="text-text-primary font-semibold">Calendario Semanal Lizz</span>
          </div>

          <div className="flex items-center p-0.5 rounded-xl bg-surface-2 ml-4">
            {(["Casa Luifer", "Montana"] as const).map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => setSelectedBrand(brand)}
                className={`px-3 py-1 rounded-lg text-[12px] font-bold transition cursor-pointer ${
                  selectedBrand === brand
                    ? "bg-surface text-text-primary shadow-xs"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        {/* NAVEGADOR DE SEMANA Y CALENDARIO */}
        <div className="flex items-center gap-2 relative">
          <div className="flex items-center bg-surface border border-[var(--border)] rounded-xl h-9 px-1.5 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                const prev = new Date(selectedDate);
                prev.setDate(prev.getDate() - 7);
                setSelectedDate(prev);
              }}
              className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition cursor-pointer"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowCalendarPopover(!showCalendarPopover)}
              className="flex items-center gap-2 px-2 text-[12px] font-semibold text-text-primary hover:text-pink-500 transition cursor-pointer"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-pink-500" />
              <span>
                Semana {weekDays[0].getDate()} {MONTH_NAMES[weekDays[0].getMonth()].slice(0, 3)} -{" "}
                {weekDays[4].getDate()} {MONTH_NAMES[weekDays[4].getMonth()].slice(0, 3)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                const next = new Date(selectedDate);
                next.setDate(next.getDate() + 7);
                setSelectedDate(next);
              }}
              className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition cursor-pointer"
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {showCalendarPopover && (
            <div className="absolute right-0 top-full mt-2 z-50 bg-surface rounded-2xl p-4 shadow-xl border border-[var(--border)] w-64">
              <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
                Ir a fecha
              </div>
              <input
                type="date"
                value={toISODate(selectedDate)}
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
                Ir a Semana Actual
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── CUERPO PRINCIPAL ── */}
      <div className="p-6 lg:p-8 max-w-[1500px] mx-auto w-full flex flex-col gap-6">
        {/* 1. KPIS SUPERIORES (TOTAL PUBLICADO, FALTA, CUMPLIMIENTO, CAPTURAS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-surface p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[12px] font-medium text-text-tertiary block">
                Total publicado esta semana
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-[28px] font-bold text-text-primary leading-none">
                  {weeklyTotals.totalPublished}
                </span>
                <span className="text-[12px] text-text-tertiary">/ {weeklyTarget} piezas</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl bg-surface p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[12px] font-medium text-text-tertiary block">
                Contenido faltante
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-[28px] font-bold text-amber-500 leading-none">
                  {weeklyTotals.pending}
                </span>
                <span className="text-[12px] text-text-tertiary">piezas restantes</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl bg-surface p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[12px] font-medium text-text-tertiary block">
                Tasa de cumplimiento
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-[28px] font-bold text-emerald-500 leading-none">
                  {weeklyTotals.complianceRate}%
                </span>
                <span className="text-[12px] text-text-tertiary">de la meta</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl bg-surface p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[12px] font-medium text-text-tertiary block">
                Capturas de historias adjuntadas
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-[28px] font-bold text-cyan-500 leading-none">
                  {weeklyTotals.totalCaptures}
                </span>
                <span className="text-[12px] text-text-tertiary">evidencias subidas</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold">
              <ImageIcon className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 2. CALENDARIO SEMANAL: 5 COLUMNAS (LUNES A VIERNES) */}
        <div className="rounded-3xl bg-surface p-6 shadow-sm flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border)]">
            <div>
              <h2 className="text-[16px] font-bold text-text-primary">
                Calendario Semanal de Publicaciones · {selectedBrand}
              </h2>
              <p className="text-[12px] text-text-tertiary">
                Supervisión de historias adjuntadas por Lizz y desglose total por tipo de creativo cada día.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-surface-2 text-text-secondary">
              Community Manager: Lizz
            </span>
          </div>

          {/* Grilla 5 Columnas (Lun a Vie) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {weekDays.map((d, idx) => {
              const iso = weekISODates[idx];
              const log = weeklyLogs[iso];
              const dayCaptures = capturesByDay[iso] || { video: [], producto: [], interactiva: [] };
              const allDayCaptures = [
                ...dayCaptures.video.map((u) => ({ type: "Video", url: u })),
                ...dayCaptures.producto.map((u) => ({ type: "Producto", url: u })),
                ...dayCaptures.interactiva.map((u) => ({ type: "Interactiva", url: u })),
              ];

              const dayTotal = FORMAT_LIST.reduce((acc, f) => acc + ((log?.[f.key] as number) ?? 0), 0);

              return (
                <div
                  key={iso}
                  className="rounded-2xl bg-surface-2/50 border border-[var(--border)] p-4 flex flex-col justify-between gap-4 shadow-2xs"
                >
                  {/* Encabezado del Día */}
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                    <div>
                      <span className="text-[13px] font-bold text-text-primary block">
                        {DAY_LABELS[idx]}
                      </span>
                      <span className="text-[11px] text-text-tertiary">
                        {d.getDate()} de {MONTH_NAMES[d.getMonth()]}
                      </span>
                    </div>
                    <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-surface text-pink-500 shadow-2xs">
                      {dayTotal} piezas
                    </span>
                  </div>

                  {/* Capturas de Historias de este día */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-pink-500" />
                      Capturas Historias ({allDayCaptures.length})
                    </span>

                    {allDayCaptures.length > 0 ? (
                      <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1 rounded-xl bg-surface">
                        {allDayCaptures.map((cap, cIdx) => (
                          <div
                            key={cIdx}
                            className="relative group cursor-pointer"
                            onClick={() =>
                              setPreviewModal({
                                url: cap.url,
                                title: `${DAY_LABELS[idx]} - Historia ${cap.type}`,
                              })
                            }
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={cap.url}
                              alt={`Historia ${cap.type}`}
                              className="w-full h-14 object-cover rounded-lg border border-border group-hover:opacity-90 transition"
                            />
                            <span className="absolute bottom-0.5 inset-x-0.5 text-[8px] font-bold bg-black/60 text-white text-center rounded truncate px-0.5">
                              {cap.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-16 rounded-xl bg-surface/50 border border-dashed border-border flex items-center justify-center text-center p-2">
                        <span className="text-[10.5px] text-text-tertiary italic leading-snug">
                          Sin capturas adjuntadas
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Cantidad Total por cada tipo de creativo registrado */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-[var(--border)]">
                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                      Creativos registrados
                    </span>
                    <div className="flex flex-col gap-1 text-[11px]">
                      {FORMAT_LIST.map((f) => {
                        const count = (log?.[f.key] as number) ?? 0;
                        if (count === 0) return null;
                        return (
                          <div
                            key={f.key}
                            className="flex items-center justify-between px-2 py-1 rounded-lg bg-surface shadow-2xs"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: f.color }}
                              />
                              <span className="font-medium text-text-primary truncate">
                                {f.label}
                              </span>
                            </div>
                            <span className="font-bold text-text-primary ml-1 shrink-0">
                              ×{count}
                            </span>
                          </div>
                        );
                      })}
                      {dayTotal === 0 && (
                        <span className="text-[11px] text-text-tertiary italic py-1">
                          0 creativos este día
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Lightbox para ampliar captura */}
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
                {previewModal.title} · {selectedBrand}
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
              alt="Preview"
              className="w-full max-h-[75vh] object-contain rounded-2xl bg-black/5"
            />
          </div>
        </div>
      )}
    </div>
  );
}
