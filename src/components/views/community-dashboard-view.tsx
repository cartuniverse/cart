"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Calendar,
  CheckCircle2,
  Eye,
  Film,
  Image as ImageIcon,
  Layers,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { getWeeklyCommunityLogs } from "@/lib/supabase";
import type { DailyCommunityLog } from "@/lib/types";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
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

function GalleryIcon({ className = "w-4 h-4" }: { className?: string }) {
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
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

interface CommunityDashboardViewProps {
  onGoToDailyView: () => void;
  cmName?: string;
}

function getWeekDays(referenceDate: Date): Date[] {
  const d = new Date(referenceDate);
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

function sumLog(log?: DailyCommunityLog): number {
  if (!log) return 0;
  return (
    (log.formatHistoriaOrganica ?? 0) +
    (log.formatHistoriaProducto ?? 0) +
    (log.formatHistoriaInteractiva ?? 0) +
    (log.formatFeedOrganico ?? 0) +
    (log.formatFeedCreativo ?? 0) +
    (log.formatVideoTestimonio ?? 0) +
    (log.formatCarrusel ?? 0) +
    (log.formatPost ?? 0)
  );
}

const MONTHS_ES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];
const DAYS_SHORT_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const FORMAT_META: {
  key: keyof Pick<
    DailyCommunityLog,
    | "formatHistoriaOrganica"
    | "formatHistoriaProducto"
    | "formatHistoriaInteractiva"
    | "formatFeedOrganico"
    | "formatFeedCreativo"
    | "formatVideoTestimonio"
    | "formatCarrusel"
    | "formatPost"
  >;
  label: string;
  shortLabel: string;
  color: string;
}[] = [
  { key: "formatHistoriaOrganica", label: "Historias · orgánicos", shortLabel: "Hist. orgánicas", color: "#ec4899" },
  { key: "formatHistoriaProducto", label: "Historias · producto", shortLabel: "Hist. producto", color: "#f59e0b" },
  { key: "formatHistoriaInteractiva", label: "Historias · interactivas", shortLabel: "Hist. interactivas", color: "#f97316" },
  { key: "formatFeedOrganico", label: "Feed · videos orgánicos", shortLabel: "Feed orgánicos", color: "#6366f1" },
  { key: "formatFeedCreativo", label: "Feed · videos creativos", shortLabel: "Feed creativos", color: "#8b5cf6" },
  { key: "formatVideoTestimonio", label: "Feed · videos testimonio", shortLabel: "Testimonios", color: "#14b8a6" },
  { key: "formatCarrusel", label: "Carruseles", shortLabel: "Carruseles", color: "#10b981" },
  { key: "formatPost", label: "Posts", shortLabel: "Posts", color: "#3b82f6" },
];

export function CommunityDashboardView({
  onGoToDailyView,
  cmName = "Lizz",
}: CommunityDashboardViewProps) {
  const referenceDate = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => toISODate(referenceDate), [referenceDate]);
  const weekDays = useMemo(() => getWeekDays(referenceDate), [referenceDate]);
  const weekISODates = useMemo(() => weekDays.map((d) => toISODate(d)), [weekDays]);

  const [weeklyLogsCL, setWeeklyLogsCL] = useState<Record<string, DailyCommunityLog>>({});
  const [weeklyLogsMT, setWeeklyLogsMT] = useState<Record<string, DailyCommunityLog>>({});
  const [storyCaptures, setStoryCaptures] = useState<{ cl: string | null; mt: string | null }>({
    cl: null,
    mt: null,
  });
  const [previewUrl, setPreviewUrl] = useState<{ url: string; brand: string } | null>(null);

  const loadData = useCallback(() => {
    getWeeklyCommunityLogs(weekISODates, "Casa Luifer").then((logs) => {
      setWeeklyLogsCL(logs);
    });
    getWeeklyCommunityLogs(weekISODates, "Montana").then((logs) => {
      setWeeklyLogsMT(logs);
    });
    if (typeof window !== "undefined") {
      setStoryCaptures({
        cl: localStorage.getItem(`community_story_capture_${todayIso}_Casa Luifer`),
        mt: localStorage.getItem(`community_story_capture_${todayIso}_Montana`),
      });
    }
  }, [weekISODates, todayIso]);

  useEffect(() => {
    loadData();
    if (typeof window !== "undefined") {
      window.addEventListener("daily_log_updated", loadData);
      return () => window.removeEventListener("daily_log_updated", loadData);
    }
  }, [loadData]);

  // Cálculos reales de Casa Luifer (Meta 56)
  const metaCL = 56;
  const semanaCL = useMemo(
    () => Object.values(weeklyLogsCL).reduce((acc, log) => acc + sumLog(log), 0),
    [weeklyLogsCL]
  );
  const avanceCLPct = Math.min(100, Math.round((semanaCL / metaCL) * 100));

  // Cálculos reales de Montana (Meta 39)
  const metaMT = 39;
  const semanaMT = useMemo(
    () => Object.values(weeklyLogsMT).reduce((acc, log) => acc + sumLog(log), 0),
    [weeklyLogsMT]
  );
  const avanceMTPct = Math.min(100, Math.round((semanaMT / metaMT) * 100));

  // Posts de hoy reales
  const todayLogCL = weeklyLogsCL[todayIso];
  const todayLogMT = weeklyLogsMT[todayIso];
  const hoyCL = sumLog(todayLogCL);
  const hoyMT = sumLog(todayLogMT);
  const postsHoy = hoyCL + hoyMT;

  // Tendencia diaria Lun-Vie para gráfica lineal
  const dailyTrend = useMemo(() => {
    return weekDays.map((d, idx) => {
      const iso = weekISODates[idx];
      return {
        label: DAYS_SHORT_ES[d.getDay()],
        iso,
        cl: sumLog(weeklyLogsCL[iso]),
        mt: sumLog(weeklyLogsMT[iso]),
      };
    });
  }, [weekDays, weekISODates, weeklyLogsCL, weeklyLogsMT]);

  // Desglose por formato esta semana (sumando ambas marcas)
  const formatBreakdown = useMemo(() => {
    const allWeekly = [...Object.values(weeklyLogsCL), ...Object.values(weeklyLogsMT)];
    return FORMAT_META.map((fm) => {
      const value = allWeekly.reduce((acc, l) => acc + (l[fm.key] ?? 0), 0);
      return { ...fm, value };
    });
  }, [weeklyLogsCL, weeklyLogsMT]);

  const maxFormatoVal = Math.max(...formatBreakdown.map((f) => f.value), 5);

  const dateStrNavbar = `${DAYS_SHORT_ES[referenceDate.getDay()]}, ${referenceDate.getDate()} ${
    MONTHS_ES[referenceDate.getMonth()]
  } ${referenceDate.getFullYear()}`;

  const radius = 46;
  const circumference = 2 * Math.PI * radius;

  // Helpers para gráfica lineal SVG
  const chartW = 500;
  const chartH = 190;
  const padX = 32;
  const padTop = 20;
  const padBot = 28;
  const innerW = chartW - padX * 2;
  const innerH = chartH - padTop - padBot;
  const maxDaily = Math.max(...dailyTrend.map((d) => Math.max(d.cl, d.mt)), 8);
  const getX = (i: number) => padX + (i / Math.max(1, dailyTrend.length - 1)) * innerW;
  const getY = (v: number) => padTop + innerH - (v / maxDaily) * innerH;
  const clPoints = dailyTrend.map((d, i) => `${getX(i)},${getY(d.cl)}`).join(" ");
  const mtPoints = dailyTrend.map((d, i) => `${getX(i)},${getY(d.mt)}`).join(" ");

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-bg overflow-y-auto pb-12">
      {/* Navbar superior */}
      <header className="h-[60px] bg-surface border-b border-[var(--border)] px-6 lg:px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-[12.5px] font-medium text-text-tertiary">
          <span>Mi espacio</span>
          <span>›</span>
          <span className="text-text-primary font-semibold">Dashboard</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 h-8 px-3 rounded-lg bg-surface-2 text-[12px] font-medium text-text-secondary">
            <Calendar className="w-3.5 h-3.5 text-pink-500" />
            <span>{dateStrNavbar}</span>
          </div>

          <button
            type="button"
            className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-text-secondary hover:text-text-primary transition cursor-pointer"
            title="Notificaciones"
          >
            <Bell className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onGoToDailyView}
            className="h-8 px-3.5 rounded-lg bg-pink-500 text-white text-[12px] font-semibold hover:bg-pink-600 transition shadow-xs cursor-pointer"
          >
            Registrar hoy
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
        {/* Saludo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-[24px] font-bold text-text-primary tracking-tight">
              Hola, {cmName}
            </h1>
            <p className="text-[13px] text-text-secondary">
              Aquí tienes el resumen real de tu producción semanal y lo publicado hoy en Instagram.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11.5px] font-semibold text-text-secondary bg-surface px-3.5 py-2 rounded-xl shadow-xs">
            <InstagramIcon className="w-4 h-4 text-pink-500" />
            <span>Total semana: {semanaCL + semanaMT} / {metaCL + metaMT} piezas</span>
          </div>
        </div>

        {/* 1. VISUAL RÁPIDA DE LO PUBLICADO HOY */}
        <div className="rounded-2xl bg-surface p-6 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-text-primary">
                  Publicado hoy · Registro rápido
                </h2>
                <p className="text-[11.5px] text-text-tertiary">
                  Desglose inmediato de piezas registradas hoy ({postsHoy} en total)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onGoToDailyView}
              className="text-[12px] font-semibold text-pink-500 hover:text-pink-600 transition cursor-pointer self-start sm:self-auto"
            >
              Editar registro de hoy →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: "Casa Luifer",
                initials: "CL",
                color: "#ec4899",
                log: todayLogCL,
                total: hoyCL,
                capture: storyCaptures.cl,
              },
              {
                name: "Montana",
                initials: "MT",
                color: "#3b82f6",
                log: todayLogMT,
                total: hoyMT,
                capture: storyCaptures.mt,
              },
            ].map((brand) => {
              const items = FORMAT_META.map((fm) => ({
                ...fm,
                count: brand.log ? brand.log[fm.key] ?? 0 : 0,
              })).filter((i) => i.count > 0);

              return (
                <div
                  key={brand.name}
                  className="rounded-xl bg-surface-2/60 p-4 flex flex-col gap-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-7 h-7 rounded-lg text-white text-[11px] font-bold flex items-center justify-center"
                        style={{ backgroundColor: brand.color }}
                      >
                        {brand.initials}
                      </span>
                      <span className="text-[13.5px] font-bold text-text-primary">
                        {brand.name}
                      </span>
                    </div>
                    <span className="text-[12px] font-bold text-text-primary bg-surface px-2.5 py-1 rounded-full shadow-2xs">
                      {brand.total} {brand.total === 1 ? "pieza" : "piezas"} hoy
                    </span>
                  </div>

                  {items.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((item) => (
                        <span
                          key={item.key}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface text-[11.5px] font-medium text-text-primary shadow-2xs"
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span>{item.shortLabel}</span>
                          <strong className="text-text-primary">×{item.count}</strong>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-text-tertiary italic">
                      Aún no hay piezas registradas hoy para {brand.name}.
                    </p>
                  )}

                  {/* Captura de Historia de hoy si existe */}
                  {brand.capture && (
                    <div className="mt-1 flex items-center gap-3 bg-surface rounded-xl p-2 shadow-2xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={brand.capture}
                        alt={`Historia ${brand.name}`}
                        className="w-12 h-12 rounded-lg object-cover shrink-0 cursor-pointer"
                        onClick={() => setPreviewUrl({ url: brand.capture!, brand: brand.name })}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11.5px] font-semibold text-text-primary flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-pink-500" />
                          Captura de Historia adjunta
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewUrl({ url: brand.capture!, brand: brand.name })}
                          className="text-[11px] text-pink-500 hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" /> Ver en grande
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. FILA DE 3 TARJETAS DE PROGRESO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tarjeta 1: Casa Luifer */}
          <div className="rounded-2xl bg-surface p-6 flex flex-col justify-between gap-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                  <span className="text-[14px] font-bold text-text-primary">Casa Luifer</span>
                </div>
                <span className="text-[11.5px] text-text-tertiary">Meta: {metaCL} piezas / sem</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500">
                <InstagramIcon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-center justify-center py-2">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 110 110">
                  <circle cx="55" cy="55" r={radius} stroke="currentColor" strokeWidth="10" fill="none" className="text-surface-2" />
                  <circle
                    cx="55" cy="55" r={radius}
                    stroke="#ec4899" strokeWidth="10" fill="none" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (avanceCLPct / 100) * circumference}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-[22px] font-bold text-text-primary leading-none">{avanceCLPct}%</span>
                  <span className="text-[11px] font-medium text-text-tertiary mt-1">{semanaCL}/{metaCL}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[12px] pt-3 border-t border-[var(--border)]">
              <span className="text-text-tertiary">Hoy: <strong className="text-text-primary">{hoyCL}</strong></span>
              <span className="font-semibold text-pink-500">Faltan {Math.max(0, metaCL - semanaCL)}</span>
            </div>
          </div>

          {/* Tarjeta 2: Montana */}
          <div className="rounded-2xl bg-surface p-6 flex flex-col justify-between gap-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-[14px] font-bold text-text-primary">Montana</span>
                </div>
                <span className="text-[11.5px] text-text-tertiary">Meta: {metaMT} piezas / sem</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                <GalleryIcon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-center justify-center py-2">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 110 110">
                  <circle cx="55" cy="55" r={radius} stroke="currentColor" strokeWidth="10" fill="none" className="text-surface-2" />
                  <circle
                    cx="55" cy="55" r={radius}
                    stroke="#3b82f6" strokeWidth="10" fill="none" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (avanceMTPct / 100) * circumference}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-[22px] font-bold text-text-primary leading-none">{avanceMTPct}%</span>
                  <span className="text-[11px] font-medium text-text-tertiary mt-1">{semanaMT}/{metaMT}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[12px] pt-3 border-t border-[var(--border)]">
              <span className="text-text-tertiary">Hoy: <strong className="text-text-primary">{hoyMT}</strong></span>
              <span className="font-semibold text-blue-500">Faltan {Math.max(0, metaMT - semanaMT)}</span>
            </div>
          </div>

          {/* Tarjeta 3: Posts hoy */}
          <div className="rounded-2xl bg-surface p-6 flex flex-col justify-between gap-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[14px] font-bold text-text-primary">Publicaciones hoy</span>
                <span className="text-[11.5px] text-text-tertiary">Ambas marcas · Instagram</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-4">
              <span className="text-[48px] font-bold text-text-primary leading-none tracking-tight">
                {postsHoy}
              </span>
              <span className="text-[12px] text-text-tertiary mt-2">
                {hoyCL} Casa Luifer · {hoyMT} Montana
              </span>
            </div>

            <button
              type="button"
              onClick={onGoToDailyView}
              className="w-full h-10 rounded-xl bg-surface-2 hover:bg-surface-2/80 text-text-primary text-[12.5px] font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Ir a seguimiento diario →</span>
            </button>
          </div>
        </div>

        {/* 3. GRÁFICAS: TENDENCIA DIARIA (L-V) + PRODUCCIÓN POR FORMATO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfica Lineal Diaria */}
          <div className="rounded-2xl bg-surface p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-pink-500" />
                <span className="text-[14px] font-bold text-text-primary">
                  Producción diaria (Lun – Vie)
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-medium text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500" /> Casa Luifer
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Montana
                </span>
              </div>
            </div>

            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto select-none overflow-visible">
              {[0, Math.round(maxDaily / 2), maxDaily].map((tick) => {
                const y = getY(tick);
                return (
                  <g key={tick}>
                    <line
                      x1={padX} y1={y} x2={chartW - padX} y2={y}
                      stroke="currentColor" className="text-text-tertiary/20" strokeWidth="0.8"
                    />
                    <text x={padX - 8} y={y + 3.5} textAnchor="end" className="text-[10px] fill-text-tertiary">
                      {tick}
                    </text>
                  </g>
                );
              })}

              <polyline fill="none" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={clPoints} />
              <polyline fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={mtPoints} />

              {dailyTrend.map((d, i) => {
                const x = getX(i);
                const yCL = getY(d.cl);
                const yMT = getY(d.mt);
                const isToday = d.iso === todayIso;
                return (
                  <g key={d.iso}>
                    <circle cx={x} cy={yCL} r={isToday ? 4.5 : 3.5} className="fill-pink-500 stroke-surface stroke-2" />
                    <text x={x} y={yCL - 7} textAnchor="middle" className="text-[10px] font-bold fill-pink-500">
                      {d.cl}
                    </text>
                    <circle cx={x} cy={yMT} r={isToday ? 4.5 : 3.5} className="fill-blue-500 stroke-surface stroke-2" />
                    <text x={x} y={yMT + 13} textAnchor="middle" className="text-[10px] font-bold fill-blue-500">
                      {d.mt}
                    </text>
                    <text x={x} y={chartH - 6} textAnchor="middle" className={`text-[11px] ${isToday ? "font-bold fill-text-primary" : "fill-text-tertiary"}`}>
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Gráfica de Barras por Formato */}
          <div className="rounded-2xl bg-surface p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span className="text-[14px] font-bold text-text-primary">
                  Piezas por formato (esta semana)
                </span>
              </div>
              <span className="text-[11px] text-text-tertiary font-medium">
                Casa Luifer + Montana
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {formatBreakdown.map((fmt) => {
                const widthPct = Math.round((fmt.value / maxFormatoVal) * 100);
                return (
                  <div key={fmt.key} className="grid grid-cols-12 items-center gap-3">
                    <div className="col-span-5 text-[12px] font-medium text-text-secondary truncate">
                      {fmt.label}
                    </div>
                    <div className="col-span-6 h-2.5 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${Math.max(fmt.value > 0 ? 4 : 0, widthPct)}%`,
                          backgroundColor: fmt.color,
                        }}
                      />
                    </div>
                    <div className="col-span-1 text-right text-[12px] font-bold text-text-primary">
                      {fmt.value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Lightbox para captura de historia */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative max-w-lg w-full bg-surface rounded-3xl p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-sm font-bold text-text-primary">
                Captura de Historia · {previewUrl.brand}
              </span>
              <button
                type="button"
                onClick={() => setPreviewUrl(null)}
                className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl.url}
              alt={previewUrl.brand}
              className="w-full max-h-[75vh] object-contain rounded-2xl bg-black/5"
            />
          </div>
        </div>
      )}
    </div>
  );
}
