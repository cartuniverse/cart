"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Activity,
  HelpCircle,
  Video,
} from "lucide-react";
import { getAllVideoLogs, getWeeklyVideoLogs } from "@/lib/supabase";
import { fadeInUp, popIn, staggerContainer } from "@/lib/motion-variants";
import type { DailyVideoLog } from "@/lib/types";

interface AudiovisualDashboardViewProps {
  onGoToDailyView: () => void;
  currentProjectName?: string;
  creatorName?: string;
}

const GREETINGS = (name: string) => [
  { emoji: "🎬", text: `¡Qué tal, ${name}! Listo para crear magia hoy` },
  { emoji: "🔥", text: `${name}, hoy es un gran día para grabar algo increíble` },
  { emoji: "✨", text: `¡Bienvenido de vuelta, ${name}! Tus videos no se graban solos` },
  { emoji: "🚀", text: `${name}, la cámara te extrañó. ¡A darle!` },
  { emoji: "🎥", text: `¡Hola, ${name}! El set de grabación ya te está esperando` },
  { emoji: "⚡️", text: `${name}, tu creatividad hoy va a romperla` },
  { emoji: "🍿", text: `¡Arriba ese ánimo, ${name}! Hoy toca crear contenido top` },
  { emoji: "🌟", text: `${name}, cada video que grabas suma. ¡Vamos con todo!` },
];

function pickGreeting(name: string) {
  const list = GREETINGS(name);
  return list[Math.floor(Math.random() * list.length)];
}

// Fechas de la semana de referencia (Lunes a Domingo)
function getWeekDays(referenceDate: Date): Date[] {
  const d = new Date(referenceDate);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
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

export function AudiovisualDashboardView({
  onGoToDailyView,
  currentProjectName = "Casa Luifer",
  creatorName = "creador",
}: AudiovisualDashboardViewProps) {
  const [allLogs, setAllLogs] = useState<DailyVideoLog[]>([]);
  const [weeklyLogs, setWeeklyLogs] = useState<Record<string, DailyVideoLog>>({});
  const firstName = creatorName.trim().split(" ")[0] || creatorName;
  const [greeting] = useState(() => pickGreeting(firstName));

  // Fecha fija de referencia para concordar con la imagen (10 nov 2026 - Martes)
  const referenceDate = useMemo(() => new Date("2026-11-10T12:00:00"), []);
  const weekDays = useMemo(() => getWeekDays(referenceDate), [referenceDate]);
  const weekISODates = useMemo(() => weekDays.map((d) => toISODate(d)), [weekDays]);

  useEffect(() => {
    getAllVideoLogs(currentProjectName).then((logs) => {
      setAllLogs(logs);
    });

    getWeeklyVideoLogs(weekISODates.slice(0, 5), currentProjectName).then((wLogs) => {
      setWeeklyLogs(wLogs);
    });
  }, [currentProjectName, weekISODates]);

  // Fecha de hoy fija (concordar con la vista diaria)
  const todayIso = useMemo(() => toISODate(referenceDate), [referenceDate]);

  // Videos hoy — datos reales únicamente
  const videosHoy = useMemo(() => {
    const log = weeklyLogs[todayIso] || allLogs.find((l) => l.date === todayIso);
    if (!log) return 0;
    return (
      log.formatDisneySub30 +
      log.formatDisneyGala +
      log.formatMovimiento +
      log.formatAvatarYapping
    );
  }, [weeklyLogs, allLogs, todayIso]);

  // Acumulado de la semana (L a V) — datos reales únicamente
  const estaSemana = useMemo(() => {
    let sum = 0;
    weekISODates.slice(0, 5).forEach((d) => {
      const l = weeklyLogs[d];
      if (l) {
        sum +=
          l.formatDisneySub30 +
          l.formatDisneyGala +
          l.formatMovimiento +
          l.formatAvatarYapping;
      }
    });
    return sum;
  }, [weekISODates, weeklyLogs]);

  const metaSemanal = 15;
  const avancePct = metaSemanal > 0 ? Math.round((estaSemana / metaSemanal) * 100) : 0;

  // Acumulado de los últimos 30 días por formato — datos reales únicamente
  const formatTotals = useMemo(() => {
    let sub30 = 0;
    let gala = 0;
    let mov = 0;
    let yap = 0;

    allLogs.forEach((l) => {
      sub30 += l.formatDisneySub30;
      gala += l.formatDisneyGala;
      mov += l.formatMovimiento;
      yap += l.formatAvatarYapping;
    });

    return {
      sub30,
      gala,
      mov,
      yap,
      total: sub30 + gala + mov + yap,
    };
  }, [allLogs]);

  // Datos por día para la gráfica de barras "Progreso semanal" (L–V)
  const DAY_LABELS = ["L", "M", "M", "J", "V"];
  const weekBarData = useMemo(() => {
    return weekISODates.slice(0, 5).map((d, i) => {
      const log = weeklyLogs[d];
      const total = log
        ? log.formatDisneySub30 +
          log.formatDisneyGala +
          log.formatMovimiento +
          log.formatAvatarYapping
        : 0;
      return { day: DAY_LABELS[i], value: total, iso: d };
    });
  }, [weekISODates, weeklyLogs]);

  return (
    <div className="flex-1 h-full flex flex-col min-w-0 bg-[#f8f9fa] overflow-y-auto">
      {/* Top Navbar */}
      <header className="h-[70px] shrink-0 bg-white border-b border-[var(--border)] px-8 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-text-tertiary">Mi espacio</span>
          <span className="text-text-tertiary">›</span>
          <span className="font-bold text-text-primary">Dashboard</span>
        </div>
      </header>

      {/* Contenido Principal del Dashboard */}
      <motion.div
        className="p-8 max-w-[1360px] mx-auto w-full flex flex-col gap-6"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {/* Banner Hero Superior (Fondo Gris Neutro Muy Suave, No Azul) */}
        <motion.div
          variants={fadeInUp}
          className="rounded-2xl bg-surface-2/70 border border-[var(--border)] p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xs"
        >
          <div className="flex flex-col gap-2.5 max-w-[560px]">
            <motion.div
              className="flex items-center gap-2.5"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <motion.span
                className="text-[22px]"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 260 }}
              >
                {greeting.emoji}
              </motion.span>
              <h1 className="text-[24px] font-bold text-text-primary tracking-tight">
                {greeting.text}
              </h1>
            </motion.div>
            <p className="text-[13.5px] text-text-secondary leading-relaxed">
              Tus avatares de la semana pasada se vieron increíbles. Hoy toca grabar 2 videos más — ya casi completas la meta.
            </p>
            <div className="pt-1">
              <button
                onClick={onGoToDailyView}
                className="h-10 px-4 rounded-xl bg-[#111113] text-white text-[13px] font-semibold flex items-center gap-2 hover:opacity-90 active:scale-95 transition shadow-sm cursor-pointer"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Ver diario de hoy</span>
              </button>
            </div>
          </div>

          {/* 3 Tarjetas de Resumen en Hero (Fondo blanco limpio) */}
          <motion.div
            className="flex items-center gap-3 shrink-0 self-stretch md:self-auto justify-end"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <motion.div
              variants={popIn}
              whileHover={{ y: -3, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-[100px] h-[80px] rounded-2xl bg-white border border-[var(--border)] flex flex-col items-center justify-center shadow-2xs"
            >
              <span className="text-[26px] font-bold text-text-primary leading-tight">
                {videosHoy}
              </span>
              <span className="text-[11px] font-medium text-text-tertiary">
                Videos hoy
              </span>
            </motion.div>

            <motion.div
              variants={popIn}
              whileHover={{ y: -3, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-[100px] h-[80px] rounded-2xl bg-white border border-[var(--border)] flex flex-col items-center justify-center shadow-2xs"
            >
              <span className="text-[26px] font-bold text-[#4f46e5] leading-tight">
                {estaSemana}
              </span>
              <span className="text-[11px] font-medium text-text-tertiary">
                Esta semana
              </span>
            </motion.div>

            <motion.div
              variants={popIn}
              whileHover={{ y: -3, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-[100px] h-[80px] rounded-2xl bg-white border border-[var(--border)] flex flex-col items-center justify-center shadow-2xs"
            >
              <span className="text-[26px] font-bold text-[#10b981] leading-tight">
                {avancePct}%
              </span>
              <span className="text-[11px] font-medium text-text-tertiary">
                Avance
              </span>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Sección de 2 Columnas de Gráficas: "Videos por formato" (Izquierda) + "Progreso semanal" (Derecha) */}
        <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card Izquierda: Videos por formato (ocupa 7 u 8 cols) */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="lg:col-span-8 rounded-2xl bg-white border border-[var(--border)] p-7 flex flex-col justify-between gap-6 shadow-2xs"
          >
            <div>
              {/* Header de la card */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-text-tertiary" />
                  <h3 className="text-[14px] font-bold text-text-primary">
                    Videos por formato
                  </h3>
                </div>
                <span className="h-6 px-2.5 rounded-full bg-surface-2 text-text-secondary text-[10.5px] font-semibold flex items-center border border-border">
                  Últ. 30 días
                </span>
              </div>

              {/* Conteo total */}
              <div className="flex flex-col gap-0.5 mb-6">
                <span className="text-[34px] font-bold text-text-primary leading-none tracking-tight">
                  {formatTotals.total}
                </span>
                <span className="text-[12px] text-text-tertiary font-medium">
                  videos entregados
                </span>
              </div>

              {/* 4 Barras de formato */}
              <div className="flex flex-col gap-5">
                {/* Disney <30sg */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-text-primary">Disney &lt;30sg</span>
                    <span className="font-bold text-pink-500">{formatTotals.sub30}</span>
                  </div>
                  <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#ec4899] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (formatTotals.sub30 / 30) * 100)}%` }}
                      transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
                    />
                  </div>
                </div>

                {/* Disney gala */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-text-primary">Disney gala</span>
                    <span className="font-bold text-violet-500">{formatTotals.gala}</span>
                  </div>
                  <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#6366f1] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (formatTotals.gala / 30) * 100)}%` }}
                      transition={{ duration: 0.7, ease: "easeOut", delay: 0.18 }}
                    />
                  </div>
                </div>

                {/* Movimiento */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-text-primary">Movimiento</span>
                    <span className="font-bold text-blue-500">{formatTotals.mov}</span>
                  </div>
                  <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#3b82f6] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (formatTotals.mov / 30) * 100)}%` }}
                      transition={{ duration: 0.7, ease: "easeOut", delay: 0.26 }}
                    />
                  </div>
                </div>

                {/* Avatar yapping */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-text-primary">Avatar yapping</span>
                    <span className="font-bold text-emerald-500">{formatTotals.yap}</span>
                  </div>
                  <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#10b981] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (formatTotals.yap / 30) * 100)}%` }}
                      transition={{ duration: 0.7, ease: "easeOut", delay: 0.34 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card Derecha: Progreso semanal con gráfica de línea (ocupa 4 o 5 cols) */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="lg:col-span-4 rounded-2xl bg-white border border-[var(--border)] p-7 flex flex-col justify-between gap-5 shadow-2xs"
          >
            <div>
              {/* Header */}
              <div className="flex items-center gap-2 mb-2 text-text-tertiary">
                <Activity className="w-4 h-4 text-[#6366f1]" />
                <h3 className="text-[13.5px] font-bold text-text-primary">
                  Progreso semanal
                </h3>
              </div>

              {/* Metas */}
              <div className="flex flex-col gap-0.5 mb-6">
                <span className="text-[26px] font-bold text-text-primary leading-tight tracking-tight">
                  {estaSemana} / {metaSemanal}
                </span>
                <span className="text-[11.5px] text-text-tertiary font-medium">
                  meta semanal · falta poco
                </span>
              </div>

              {/* Gráfica de barras alimentada de weeklyLogs */}
              <div className="rounded-xl bg-surface-2/60 border border-[var(--border)] p-4 flex flex-col justify-between h-[170px]">
                <div className="flex-1 flex items-end gap-2 pb-1">
                  {weekBarData.map((bar, idx) => {
                    const isToday = bar.iso === todayIso;
                    const maxVal = Math.max(...weekBarData.map((b) => b.value), 1);
                    const heightPct = Math.max((bar.value / maxVal) * 100, 4);
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center justify-end gap-1"
                      >
                        {bar.value > 0 && (
                          <span className="text-[9px] font-bold text-text-tertiary">
                            {bar.value}
                          </span>
                        )}
                        <motion.div
                          className="w-full rounded-t-md"
                          initial={{ height: 0 }}
                          animate={{
                            height: `${heightPct}%`,
                            backgroundColor: isToday ? "#6366f1" : "#e5e7eb",
                          }}
                          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 + idx * 0.06 }}
                          style={{ minHeight: bar.value > 0 ? "8px" : "3px" }}
                        />
                      </div>
                    );
                  })}
                </div>
                {/* Eje X (L, M, M, J, V) */}
                <div className="flex justify-between pt-2 text-[10px] font-bold text-text-tertiary">
                  {weekBarData.map((bar, idx) => (
                    <span
                      key={idx}
                      className={`flex-1 text-center ${bar.iso === todayIso ? "text-[#6366f1]" : ""}`}
                    >
                      {bar.day}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

