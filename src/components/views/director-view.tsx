"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Users,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Calendar as CalendarIcon,
  Sparkles,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Eye,
  Flame,
  Check,
  Award,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
  FileText
} from "lucide-react"
import type { DailyDesignLog } from "@/lib/types"
import { getWeeklyAllDesignLogs } from "@/lib/supabase"

interface DirectorViewProps {
  directorName?: string
  directorEmail?: string
}

type FormatKey =
  | "clHistorias"
  | "clMovimiento"
  | "clPost"
  | "clHistoriaProducto"
  | "clHistoriaInteractiva"
  | "mtHistorias"
  | "mtCarruseles"

interface FormatItem {
  key: FormatKey
  title: string
  hint: string
  completed: boolean
  url?: string
}

// Cronograma de Samuel
const SAMUEL_PLAN: Record<number, { clTheme: string; isCreativo: boolean; cl: { key: FormatKey; title: string; hint: string }[]; mt: { key: FormatKey; title: string; hint: string }[] }> = {
  1: {
    clTheme: "Traje hombre",
    isCreativo: false,
    cl: [
      { key: "clHistorias", title: "Orgánico traje", hint: "Traje hombre · story" },
      { key: "clMovimiento", title: "Carrusel", hint: "5–7 slides producto" },
      { key: "clPost", title: "Testimonio", hint: "Review cliente feed" },
      { key: "clHistoriaProducto", title: "Historia producto", hint: "Historia producto CL" },
    ],
    mt: [
      { key: "mtHistorias", title: "Orgánico producto", hint: "Catálogo editorial MT" },
      { key: "mtCarruseles", title: "Imagen producto", hint: "Imagen producto story MT" },
    ],
  },
  2: {
    clTheme: "Novias",
    isCreativo: true,
    cl: [
      { key: "clHistorias", title: "Orgánico novias", hint: "Novias · story editorial" },
      { key: "clMovimiento", title: "Creativo (Disney)", hint: "Video creativo Disney CL" },
      { key: "clPost", title: "Post", hint: "Publicación feed" },
      { key: "clHistoriaInteractiva", title: "Historia interactiva", hint: "Encuesta o trivia CL" },
    ],
    mt: [
      { key: "mtHistorias", title: "Imagen interactiva", hint: "Trivia o encuesta MT" },
      { key: "mtCarruseles", title: "Carrusel", hint: "5–7 slides editorial MT" },
    ],
  },
  3: {
    clTheme: "Quinces",
    isCreativo: false,
    cl: [
      { key: "clHistorias", title: "Orgánico quince", hint: "Quinces · story flat lay" },
      { key: "clMovimiento", title: "Carrusel", hint: "5–7 slides de producto" },
      { key: "clPost", title: "Testimonio", hint: "Review cliente feed" },
      { key: "clHistoriaProducto", title: "Historia producto", hint: "Historia producto CL" },
    ],
    mt: [
      { key: "mtHistorias", title: "Orgánico producto", hint: "Catálogo editorial MT" },
      { key: "mtCarruseles", title: "Imagen producto", hint: "Imagen producto story MT" },
    ],
  },
  4: {
    clTheme: "Primera comunión",
    isCreativo: true,
    cl: [
      { key: "clHistorias", title: "Orgánico comunión", hint: "Primera comunión · story" },
      { key: "clMovimiento", title: "Creativo (Disney)", hint: "Video creativo Disney CL" },
      { key: "clPost", title: "Post", hint: "Publicación feed" },
      { key: "clHistoriaInteractiva", title: "Historia interactiva", hint: "Encuesta o trivia CL" },
    ],
    mt: [
      { key: "mtHistorias", title: "Imagen interactiva", hint: "Trivia o encuesta MT" },
      { key: "mtCarruseles", title: "Carrusel", hint: "5–7 slides editorial MT" },
    ],
  },
  5: {
    clTheme: "Creativo libre",
    isCreativo: false,
    cl: [
      { key: "clHistorias", title: "Orgánico libre", hint: "Creativo story CL" },
      { key: "clMovimiento", title: "Carrusel", hint: "5–7 slides de producto" },
      { key: "clPost", title: "Testimonio", hint: "Review cliente feed" },
      { key: "clHistoriaProducto", title: "Historia producto", hint: "Historia producto CL" },
    ],
    mt: [
      { key: "mtHistorias", title: "Orgánico producto", hint: "Catálogo editorial MT" },
      { key: "mtCarruseles", title: "Imagen producto", hint: "Imagen producto story MT" },
    ],
  },
}

// Cronograma de Miguel
const MIGUEL_PLAN: Record<number, { clTheme: string; isCreativo: boolean; cl: { key: FormatKey; title: string; hint: string }[]; mt: { key: FormatKey; title: string; hint: string }[] }> = {
  1: {
    clTheme: "Traje hombre",
    isCreativo: true,
    cl: [
      { key: "clHistorias", title: "Orgánico traje", hint: "Traje hombre · story flat lay" },
      { key: "clMovimiento", title: "Creativo (yapping)", hint: "Video creativo Yapping CL" },
      { key: "clPost", title: "Post", hint: "Publicación en feed" },
      { key: "clHistoriaProducto", title: "Historia producto", hint: "Historia producto CL" },
    ],
    mt: [
      { key: "mtHistorias", title: "Imagen interactiva", hint: "Trivia o encuesta MT" },
      { key: "mtCarruseles", title: "Carrusel", hint: "5–7 slides editorial MT" },
    ],
  },
  2: {
    clTheme: "Novias",
    isCreativo: false,
    cl: [
      { key: "clHistorias", title: "Orgánico novias", hint: "Novias · story editorial" },
      { key: "clMovimiento", title: "Carrusel", hint: "5–7 slides de novias" },
      { key: "clPost", title: "Testimonio", hint: "Review cliente feed" },
      { key: "clHistoriaInteractiva", title: "Historia interactiva", hint: "Encuesta o trivia CL" },
    ],
    mt: [
      { key: "mtHistorias", title: "Orgánico producto", hint: "Catálogo editorial MT" },
      { key: "mtCarruseles", title: "Imagen producto", hint: "Imagen de producto story MT" },
    ],
  },
  3: {
    clTheme: "Quinces",
    isCreativo: true,
    cl: [
      { key: "clHistorias", title: "Orgánico quince", hint: "Quinces · story flat lay" },
      { key: "clMovimiento", title: "Creativo (yapping)", hint: "Video creativo Yapping CL" },
      { key: "clPost", title: "Post", hint: "Publicación en feed" },
      { key: "clHistoriaProducto", title: "Historia producto", hint: "Historia producto CL" },
    ],
    mt: [
      { key: "mtHistorias", title: "Creativo (yapping)", hint: "Video creativo Yapping MT" },
      { key: "mtCarruseles", title: "Imagen interactiva", hint: "Trivia o encuesta MT" },
    ],
  },
  4: {
    clTheme: "Primera comunión",
    isCreativo: false,
    cl: [
      { key: "clHistorias", title: "Orgánico comunión", hint: "Primera comunión · story" },
      { key: "clMovimiento", title: "Carrusel", hint: "5–7 slides de comunión" },
      { key: "clPost", title: "Testimonio", hint: "Review cliente feed" },
      { key: "clHistoriaInteractiva", title: "Historia interactiva", hint: "Encuesta o trivia CL" },
    ],
    mt: [
      { key: "mtHistorias", title: "Orgánico producto", hint: "Catálogo editorial MT" },
      { key: "mtCarruseles", title: "Imagen producto", hint: "Imagen producto story MT" },
    ],
  },
  5: {
    clTheme: "Creativo (Disney)",
    isCreativo: true,
    cl: [
      { key: "clHistorias", title: "Orgánico gala", hint: "Vestido gala · story CL" },
      { key: "clMovimiento", title: "Creativo (Disney)", hint: "Video creativo Disney CL" },
      { key: "clPost", title: "Post", hint: "Publicación feed" },
      { key: "clHistoriaProducto", title: "Historia producto", hint: "Historia producto CL" },
    ],
    mt: [
      { key: "mtHistorias", title: "Creativo (yapping)", hint: "Video creativo Yapping MT" },
      { key: "mtCarruseles", title: "Carrusel", hint: "5–7 slides editorial MT" },
    ],
  },
}

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function getCount(log: DailyDesignLog | undefined, key: FormatKey): number {
  if (!log) return 0
  switch (key) {
    case "clHistorias": return log.formatClHistorias || 0
    case "clMovimiento": return log.formatClMovimiento || 0
    case "clPost": return log.formatClPost || 0
    case "clHistoriaProducto": return log.formatClHistoriaProducto || 0
    case "clHistoriaInteractiva": return log.formatClHistoriaInteractiva || 0
    case "mtHistorias": return log.formatMtHistorias || 0
    case "mtCarruseles": return log.formatMtCarruseles || 0
    default: return 0
  }
}

function getNote(log: DailyDesignLog | undefined, key: FormatKey): string {
  if (!log) return ""
  switch (key) {
    case "clHistorias": return log.notesClHistorias || ""
    case "clMovimiento": return log.notesClMovimiento || ""
    case "clPost": return log.notesClPost || ""
    case "clHistoriaProducto": return log.notesClHistoriaProducto || ""
    case "clHistoriaInteractiva": return log.notesClHistoriaInteractiva || ""
    case "mtHistorias": return log.notesMtHistorias || ""
    case "mtCarruseles": return log.notesMtCarruseles || ""
    default: return ""
  }
}

export function DirectorView({
  directorName = "David S.",
  directorEmail = "david.sanchez@cartuniverse.online"
}: DirectorViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date())
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => formatDate(new Date()))
  const [showCalendarPopover, setShowCalendarPopover] = useState(false)
  const [loading, setLoading] = useState(true)

  const [weekLogs, setWeekLogs] = useState<DailyDesignLog[]>([])

  const currentWeekMonday = useMemo(() => getMonday(currentDate), [currentDate])

  const weekDays = useMemo(() => {
    return [0, 1, 2, 3, 4].map(offset => {
      const d = new Date(currentWeekMonday)
      d.setDate(currentWeekMonday.getDate() + offset)
      return {
        date: d,
        iso: formatDate(d),
        dayNum: offset + 1,
        label: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"][offset],
        shortLabel: ["L", "M", "Mi", "J", "V"][offset]
      }
    })
  }, [currentWeekMonday])

  const loadWeekData = async () => {
    setLoading(true)
    try {
      const datesToQuery = weekDays.map(w => w.iso)
      const logs = await getWeeklyAllDesignLogs(datesToQuery)
      setWeekLogs(logs || [])
    } catch (err) {
      console.error("Error cargando logs semanales de diseñadores:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWeekData()
  }, [currentWeekMonday])

  const selectedDayNum = useMemo(() => {
    const found = weekDays.find(w => w.iso === selectedDateStr)
    return found ? found.dayNum : 1
  }, [weekDays, selectedDateStr])

  const dayLogs = useMemo(() => {
    return weekLogs.filter(l => l.date === selectedDateStr)
  }, [weekLogs, selectedDateStr])

  // Log de Samuel y Miguel para el día seleccionado
  const samuelDayLog = useMemo(() => {
    return dayLogs.find(l => {
      const name = (l.designerName || "").toLowerCase()
      const id = (l.designerId || "").toLowerCase()
      return name.includes("samuel") || id.includes("samuel")
    })
  }, [dayLogs])

  const miguelDayLog = useMemo(() => {
    return dayLogs.find(l => {
      const name = (l.designerName || "").toLowerCase()
      const id = (l.designerId || "").toLowerCase()
      return name.includes("miguel") || id.includes("miguel")
    })
  }, [dayLogs])

  // Formatos Samuel
  const samuelPlan = SAMUEL_PLAN[selectedDayNum] || SAMUEL_PLAN[1]
  const samuelClFormats: FormatItem[] = useMemo(() => {
    return samuelPlan.cl.map(f => {
      const count = getCount(samuelDayLog, f.key)
      const note = getNote(samuelDayLog, f.key)
      return {
        ...f,
        completed: count > 0 || !!note,
        url: note.startsWith("http") ? note : undefined
      }
    })
  }, [samuelPlan, samuelDayLog])

  const samuelMtFormats: FormatItem[] = useMemo(() => {
    return samuelPlan.mt.map(f => {
      const count = getCount(samuelDayLog, f.key)
      const note = getNote(samuelDayLog, f.key)
      return {
        ...f,
        completed: count > 0 || !!note,
        url: note.startsWith("http") ? note : undefined
      }
    })
  }, [samuelPlan, samuelDayLog])

  // Formatos Miguel
  const miguelPlan = MIGUEL_PLAN[selectedDayNum] || MIGUEL_PLAN[1]
  const miguelClFormats: FormatItem[] = useMemo(() => {
    return miguelPlan.cl.map(f => {
      const count = getCount(miguelDayLog, f.key)
      const note = getNote(miguelDayLog, f.key)
      return {
        ...f,
        completed: count > 0 || !!note,
        url: note.startsWith("http") ? note : undefined
      }
    })
  }, [miguelPlan, miguelDayLog])

  const miguelMtFormats: FormatItem[] = useMemo(() => {
    return miguelPlan.mt.map(f => {
      const count = getCount(miguelDayLog, f.key)
      const note = getNote(miguelDayLog, f.key)
      return {
        ...f,
        completed: count > 0 || !!note,
        url: note.startsWith("http") ? note : undefined
      }
    })
  }, [miguelPlan, miguelDayLog])

  // Conteos del día
  const samuelDayCompleted = samuelClFormats.filter(f => f.completed).length + samuelMtFormats.filter(f => f.completed).length
  const samuelDayTarget = samuelClFormats.length + samuelMtFormats.length // 6
  const miguelDayCompleted = miguelClFormats.filter(f => f.completed).length + miguelMtFormats.filter(f => f.completed).length
  const miguelDayTarget = miguelClFormats.length + miguelMtFormats.length // 6

  // Totales acumulados de la semana
  const samuelWeekTotal = useMemo(() => {
    const sLogs = weekLogs.filter(l => {
      const name = (l.designerName || "").toLowerCase()
      const id = (l.designerId || "").toLowerCase()
      return name.includes("samuel") || id.includes("samuel")
    })
    let total = 0
    sLogs.forEach(l => {
      total += (l.formatClHistorias || 0) + (l.formatClMovimiento || 0) + (l.formatClPost || 0) +
               (l.formatClHistoriaProducto || 0) + (l.formatClHistoriaInteractiva || 0) +
               (l.formatMtHistorias || 0) + (l.formatMtCarruseles || 0)
    })
    return total
  }, [weekLogs])

  const miguelWeekTotal = useMemo(() => {
    const mLogs = weekLogs.filter(l => {
      const name = (l.designerName || "").toLowerCase()
      const id = (l.designerId || "").toLowerCase()
      return name.includes("miguel") || id.includes("miguel")
    })
    let total = 0
    mLogs.forEach(l => {
      total += (l.formatClHistorias || 0) + (l.formatClMovimiento || 0) + (l.formatClPost || 0) +
               (l.formatClHistoriaProducto || 0) + (l.formatClHistoriaInteractiva || 0) +
               (l.formatMtHistorias || 0) + (l.formatMtCarruseles || 0)
    })
    return total
  }, [weekLogs])

  // Desglose diario (L a V) para Gráficas Lineales
  const dailyTrends = useMemo(() => {
    let samuelAccum = 0
    let miguelAccum = 0

    return weekDays.map((w, index) => {
      const sLog = weekLogs.find(l => {
        const match = l.date === w.iso
        const isS = (l.designerName || "").toLowerCase().includes("samuel") || (l.designerId || "").toLowerCase().includes("samuel")
        return match && isS
      })
      const mLog = weekLogs.find(l => {
        const match = l.date === w.iso
        const isM = (l.designerName || "").toLowerCase().includes("miguel") || (l.designerId || "").toLowerCase().includes("miguel")
        return match && isM
      })

      const sCount = sLog
        ? (sLog.formatClHistorias || 0) + (sLog.formatClMovimiento || 0) + (sLog.formatClPost || 0) +
          (sLog.formatClHistoriaProducto || 0) + (sLog.formatClHistoriaInteractiva || 0) +
          (sLog.formatMtHistorias || 0) + (sLog.formatMtCarruseles || 0)
        : 0

      const mCount = mLog
        ? (mLog.formatClHistorias || 0) + (mLog.formatClMovimiento || 0) + (mLog.formatClPost || 0) +
          (mLog.formatClHistoriaProducto || 0) + (mLog.formatClHistoriaInteractiva || 0) +
          (mLog.formatMtHistorias || 0) + (mLog.formatMtCarruseles || 0)
        : 0

      samuelAccum += sCount
      miguelAccum += mCount

      return {
        label: w.shortLabel,
        fullLabel: w.label,
        date: w.iso,
        samuel: sCount,
        miguel: mCount,
        samuelAccum,
        miguelAccum,
        target: 6,
        targetAccum: (index + 1) * 6
      }
    })
  }, [weekDays, weekLogs])

  // Semáforo de estado de un diseñador:
  // Verde: cumplió todo (completed == target)
  // Amarillo: hizo parte pero le falta (completed > 0 && completed < target)
  // Rojo: no hizo nada (completed === 0)
  const getDesignerStatus = (completed: number, target: number) => {
    if (completed >= target && target > 0) {
      return {
        type: "green" as const,
        label: "Día Completado",
        colorText: "text-emerald-700 dark:text-emerald-300",
        badgeBg: "bg-emerald-100/80 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300",
        barColor: "bg-emerald-500 dark:bg-emerald-400",
        bannerBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
        dotColor: "bg-emerald-500",
        cardBorder: "border-emerald-300 dark:border-emerald-700/60 shadow-emerald-500/5"
      }
    }
    if (completed > 0) {
      return {
        type: "yellow" as const,
        label: `En progreso (${target - completed} faltantes)`,
        colorText: "text-amber-700 dark:text-amber-300",
        badgeBg: "bg-amber-100/80 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300",
        barColor: "bg-amber-500 dark:bg-amber-400",
        bannerBg: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300",
        dotColor: "bg-amber-500",
        cardBorder: "border-amber-300 dark:border-amber-700/60 shadow-amber-500/5"
      }
    }
    return {
      type: "red" as const,
      label: "Sin entregas hoy",
      colorText: "text-rose-700 dark:text-rose-300",
      badgeBg: "bg-rose-100/80 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300",
      barColor: "bg-rose-500 dark:bg-rose-400",
      bannerBg: "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300",
      dotColor: "bg-rose-500",
      cardBorder: "border-rose-300 dark:border-rose-700/60 shadow-rose-500/5"
    }
  }

  const samuelStatus = getDesignerStatus(samuelDayCompleted, samuelDayTarget)
  const miguelStatus = getDesignerStatus(miguelDayCompleted, miguelDayTarget)

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekMonday)
    prev.setDate(prev.getDate() - 7)
    setCurrentDate(prev)
    setSelectedDateStr(formatDate(prev))
  }

  const handleNextWeek = () => {
    const next = new Date(currentWeekMonday)
    next.setDate(next.getDate() + 7)
    setCurrentDate(next)
    setSelectedDateStr(formatDate(next))
  }

  const handleDateSelect = (isoStr: string) => {
    const d = new Date(isoStr + "T12:00:00")
    setCurrentDate(d)
    setSelectedDateStr(isoStr)
    setShowCalendarPopover(false)
  }

  const weekTargetTotal = 30
  const samuelWeekPct = Math.min(100, Math.round((samuelWeekTotal / weekTargetTotal) * 100))
  const miguelWeekPct = Math.min(100, Math.round((miguelWeekTotal / weekTargetTotal) * 100))

  return (
    <div className="min-h-screen bg-bg text-text-primary p-5 md:p-8 font-sans transition-colors duration-200">
      
      {/* ======================================================== */}
      {/* 1. HEADER: TITULO, FILTRO DE CALENDARIO Y RECARGA        */}
      {/* ======================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-text-tertiary font-medium mb-1">
            <span>Dirección Operativa</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-text-primary font-semibold">Seguimiento Diseñadores IA</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            Control de Producción Creativa
            <span className="text-xs bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              Samuel & Miguel
            </span>
          </h1>
        </div>

        {/* CONTROLES DE FECHA Y CALENDARIO */}
        <div className="flex items-center gap-2 relative flex-wrap">
          {/* Navegación de semana */}
          <div className="flex items-center bg-surface border border-border rounded-xl shadow-xs p-1">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 hover:bg-surface-2 rounded-lg text-text-secondary transition"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2 text-text-primary">
              Semana {weekDays[0]?.date.getDate()} - {weekDays[4]?.date.getDate()}{" "}
              {weekDays[0]?.date.toLocaleDateString("es-ES", { month: "short" })}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-1.5 hover:bg-surface-2 rounded-lg text-text-secondary transition"
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Selector de Fecha específico (Input Calendario) */}
          <div className="relative">
            <button
              onClick={() => setShowCalendarPopover(!showCalendarPopover)}
              className="flex items-center gap-2 bg-surface border border-border hover:border-border-strong px-3.5 py-2 rounded-xl shadow-xs text-xs font-semibold text-text-primary transition"
            >
              <CalendarIcon className="w-4 h-4 text-indigo-500" />
              <span>
                {new Date(selectedDateStr + "T12:00:00").toLocaleDateString("es-ES", {
                  weekday: "short",
                  day: "numeric",
                  month: "short"
                })}
              </span>
            </button>

            {showCalendarPopover && (
              <div className="absolute right-0 mt-2 z-50 bg-surface border border-border rounded-2xl p-4 shadow-xl w-64 backdrop-blur-md">
                <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">
                  Seleccionar día
                </div>
                <input
                  type="date"
                  value={selectedDateStr}
                  onChange={(e) => {
                    if (e.target.value) handleDateSelect(e.target.value)
                  }}
                  className="w-full text-xs p-2 bg-surface-2 border border-border rounded-xl mb-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => {
                    const todayStr = formatDate(new Date())
                    handleDateSelect(todayStr)
                  }}
                  className="w-full text-center text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 py-1.5 rounded-lg transition"
                >
                  Ir a Hoy
                </button>
              </div>
            )}
          </div>

          <button
            onClick={loadWeekData}
            title="Recargar datos"
            className="p-2 bg-surface border border-border rounded-xl hover:bg-surface-2 text-text-secondary transition shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SELECTOR INTERACTIVO DE DÍAS (L - V)                  */}
      {/* ======================================================== */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
            Días de la semana · Producción
          </span>
          <span className="text-xs text-text-secondary font-medium">
            Selecciona un día para auditar la producción de Samuel y Miguel
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2.5">
          {weekDays.map(w => {
            const isSelected = w.iso === selectedDateStr
            const sLog = weekLogs.find(l => l.date === w.iso && ((l.designerName || "").toLowerCase().includes("samuel") || (l.designerId || "").toLowerCase().includes("samuel")))
            const mLog = weekLogs.find(l => l.date === w.iso && ((l.designerName || "").toLowerCase().includes("miguel") || (l.designerId || "").toLowerCase().includes("miguel")))

            const sDone = sLog ? ((sLog.formatClHistorias || 0) + (sLog.formatClMovimiento || 0) + (sLog.formatClPost || 0) + (sLog.formatClHistoriaProducto || 0) + (sLog.formatClHistoriaInteractiva || 0) + (sLog.formatMtHistorias || 0) + (sLog.formatMtCarruseles || 0)) : 0
            const mDone = mLog ? ((mLog.formatClHistorias || 0) + (mLog.formatClMovimiento || 0) + (mLog.formatClPost || 0) + (mLog.formatClHistoriaProducto || 0) + (mLog.formatClHistoriaInteractiva || 0) + (mLog.formatMtHistorias || 0) + (mLog.formatMtCarruseles || 0)) : 0
            const totalDayDone = sDone + mDone

            // Color del status del día combinado
            const dayStatusColor =
              totalDayDone >= 12
                ? "text-emerald-600 dark:text-emerald-400"
                : totalDayDone > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-rose-500 dark:text-rose-400"

            return (
              <button
                key={w.iso}
                onClick={() => setSelectedDateStr(w.iso)}
                className={`flex flex-col items-center justify-between p-3 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900 shadow-md scale-[1.02]"
                    : "bg-surface-2 border-border hover:bg-surface text-text-primary"
                }`}
              >
                <div className="flex items-center justify-between w-full text-[11px] font-semibold">
                  <span className={isSelected ? "text-slate-300 dark:text-slate-700" : "text-text-secondary"}>
                    {w.label}
                  </span>
                  <span className={`text-[10px] ${isSelected ? "text-slate-400 dark:text-slate-600" : "text-text-tertiary"}`}>
                    {w.date.getDate()} {w.date.toLocaleDateString("es-ES", { month: "short" })}
                  </span>
                </div>

                <div className="my-2 text-center">
                  <span className={`text-xl font-black ${isSelected ? "text-white dark:text-slate-900" : dayStatusColor}`}>
                    {totalDayDone}
                  </span>
                  <span className={`text-[10px] ml-0.5 ${isSelected ? "text-slate-400 dark:text-slate-600" : "text-text-tertiary"}`}>
                    /12
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-medium">
                  <span className={`px-1.5 py-0.5 rounded ${isSelected ? "bg-indigo-950 dark:bg-indigo-100 text-indigo-300 dark:text-indigo-800" : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"}`}>
                    S: {sDone}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded ${isSelected ? "bg-violet-950 dark:bg-violet-100 text-violet-300 dark:text-violet-800" : "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300"}`}>
                    M: {mDone}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. SEGUIMIENTO INDIVIDUAL: SAMUEL & MIGUEL (2 COLUMNAS)  */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* ==================================================== */}
        {/* TARJETA 1: SAMUEL MARÍN                              */}
        {/* ==================================================== */}
        <div className={`bg-surface border rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-colors ${samuelStatus.cardBorder}`}>
          <div>
            {/* Header Diseñador */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-base shadow-sm">
                  SM
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-text-primary">Samuel Marín</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      Diseñador AI
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary">samuel.gaviria@cartuniverse.online</p>
                </div>
              </div>

              {/* Cumplimiento hoy con Semáforo */}
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className={`text-2xl font-black ${samuelStatus.colorText}`}>
                    {samuelDayCompleted}
                  </span>
                  <span className="text-xs text-text-tertiary font-bold">/ {samuelDayTarget} hoy</span>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${samuelStatus.badgeBg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${samuelStatus.dotColor}`}></span>
                  {samuelStatus.label}
                </span>
              </div>
            </div>

            {/* Barra de progreso hoy con color del semáforo */}
            <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden mb-5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${samuelStatus.barColor}`}
                style={{ width: `${Math.min(100, (samuelDayCompleted / samuelDayTarget) * 100)}%` }}
              ></div>
            </div>

            {/* PROYECTO CASA LUIFER */}
            <div className="bg-pink-50/40 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/40 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-pink-500 text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                    CL
                  </span>
                  <div>
                    <span className="text-xs font-bold text-pink-900 dark:text-pink-300 block">Casa Luifer</span>
                    <span className="text-[10px] text-pink-600 dark:text-pink-400 font-medium">Tema: {samuelPlan.clTheme}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-pink-700 dark:text-pink-300 bg-white/80 dark:bg-pink-900/40 px-2 py-0.5 rounded-md border border-pink-200 dark:border-pink-800">
                  {samuelClFormats.filter(f => f.completed).length} / {samuelClFormats.length}
                </span>
              </div>

              {/* Formatos de Casa Luifer con Semáforo Individual */}
              <div className="grid grid-cols-2 gap-2">
                {samuelClFormats.map(f => (
                  <div
                    key={f.key}
                    className={`p-2.5 rounded-xl border transition flex items-start justify-between gap-1.5 ${
                      f.completed
                        ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200"
                        : "bg-surface border-border text-text-tertiary"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        {f.completed ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-border-strong shrink-0"></div>
                        )}
                        <span className={`text-xs font-bold ${f.completed ? "text-emerald-900 dark:text-emerald-200" : "text-text-secondary"}`}>
                          {f.title}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-tertiary pl-5.5 mt-0.5 truncate">{f.hint}</p>
                    </div>

                    {f.url && (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 dark:text-pink-400 hover:text-pink-800 p-1 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-lg transition"
                        title="Ver imagen / pieza"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* PROYECTO MONTANA */}
            <div className="bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-500 text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                    MT
                  </span>
                  <div>
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-300 block">Montana</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Catálogo & Historias</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-white/80 dark:bg-blue-900/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                  {samuelMtFormats.filter(f => f.completed).length} / {samuelMtFormats.length}
                </span>
              </div>

              {/* Formatos de Montana con Semáforo Individual */}
              <div className="grid grid-cols-2 gap-2">
                {samuelMtFormats.map(f => (
                  <div
                    key={f.key}
                    className={`p-2.5 rounded-xl border transition flex items-start justify-between gap-1.5 ${
                      f.completed
                        ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200"
                        : "bg-surface border-border text-text-tertiary"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        {f.completed ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-border-strong shrink-0"></div>
                        )}
                        <span className={`text-xs font-bold ${f.completed ? "text-emerald-900 dark:text-emerald-200" : "text-text-secondary"}`}>
                          {f.title}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-tertiary pl-5.5 mt-0.5 truncate">{f.hint}</p>
                    </div>

                    {f.url && (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 p-1 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                        title="Ver imagen / pieza"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resumen Semanal Samuel */}
          <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-text-secondary">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Avance de la semana:</span>
              <strong className="text-text-primary">{samuelWeekTotal} / {weekTargetTotal} piezas</strong>
            </div>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              {samuelWeekPct}% meta semanal
            </span>
          </div>
        </div>

        {/* ==================================================== */}
        {/* TARJETA 2: MIGUEL BOLÍVAR                            */}
        {/* ==================================================== */}
        <div className={`bg-surface border rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-colors ${miguelStatus.cardBorder}`}>
          <div>
            {/* Header Diseñador */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white font-black flex items-center justify-center text-base shadow-sm">
                  MB
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-text-primary">Miguel Bolívar</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                      Diseñador AI
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary">miguel.bolivar@cartuniverse.online</p>
                </div>
              </div>

              {/* Cumplimiento hoy con Semáforo */}
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className={`text-2xl font-black ${miguelStatus.colorText}`}>
                    {miguelDayCompleted}
                  </span>
                  <span className="text-xs text-text-tertiary font-bold">/ {miguelDayTarget} hoy</span>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${miguelStatus.badgeBg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${miguelStatus.dotColor}`}></span>
                  {miguelStatus.label}
                </span>
              </div>
            </div>

            {/* Barra de progreso hoy con color del semáforo */}
            <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden mb-5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${miguelStatus.barColor}`}
                style={{ width: `${Math.min(100, (miguelDayCompleted / miguelDayTarget) * 100)}%` }}
              ></div>
            </div>

            {/* PROYECTO CASA LUIFER */}
            <div className="bg-pink-50/40 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/40 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-pink-500 text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                    CL
                  </span>
                  <div>
                    <span className="text-xs font-bold text-pink-900 dark:text-pink-300 block">Casa Luifer</span>
                    <span className="text-[10px] text-pink-600 dark:text-pink-400 font-medium">Tema: {miguelPlan.clTheme}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-pink-700 dark:text-pink-300 bg-white/80 dark:bg-pink-900/40 px-2 py-0.5 rounded-md border border-pink-200 dark:border-pink-800">
                  {miguelClFormats.filter(f => f.completed).length} / {miguelClFormats.length}
                </span>
              </div>

              {/* Formatos de Casa Luifer con Semáforo Individual */}
              <div className="grid grid-cols-2 gap-2">
                {miguelClFormats.map(f => (
                  <div
                    key={f.key}
                    className={`p-2.5 rounded-xl border transition flex items-start justify-between gap-1.5 ${
                      f.completed
                        ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200"
                        : "bg-surface border-border text-text-tertiary"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        {f.completed ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-border-strong shrink-0"></div>
                        )}
                        <span className={`text-xs font-bold ${f.completed ? "text-emerald-900 dark:text-emerald-200" : "text-text-secondary"}`}>
                          {f.title}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-tertiary pl-5.5 mt-0.5 truncate">{f.hint}</p>
                    </div>

                    {f.url && (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 dark:text-pink-400 hover:text-pink-800 p-1 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-lg transition"
                        title="Ver imagen / pieza"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* PROYECTO MONTANA */}
            <div className="bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-500 text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                    MT
                  </span>
                  <div>
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-300 block">Montana</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Creativos & Carrusel</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-white/80 dark:bg-blue-900/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                  {miguelMtFormats.filter(f => f.completed).length} / {miguelMtFormats.length}
                </span>
              </div>

              {/* Formatos de Montana con Semáforo Individual */}
              <div className="grid grid-cols-2 gap-2">
                {miguelMtFormats.map(f => (
                  <div
                    key={f.key}
                    className={`p-2.5 rounded-xl border transition flex items-start justify-between gap-1.5 ${
                      f.completed
                        ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200"
                        : "bg-surface border-border text-text-tertiary"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        {f.completed ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-border-strong shrink-0"></div>
                        )}
                        <span className={`text-xs font-bold ${f.completed ? "text-emerald-900 dark:text-emerald-200" : "text-text-secondary"}`}>
                          {f.title}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-tertiary pl-5.5 mt-0.5 truncate">{f.hint}</p>
                    </div>

                    {f.url && (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 p-1 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                        title="Ver imagen / pieza"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resumen Semanal Miguel */}
          <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-text-secondary">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Avance de la semana:</span>
              <strong className="text-text-primary">{miguelWeekTotal} / {weekTargetTotal} piezas</strong>
            </div>
            <span className="font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-2.5 py-0.5 rounded-full border border-violet-200 dark:border-violet-800">
              {miguelWeekPct}% meta semanal
            </span>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 4. DOS GRÁFICAS LINEALES INTERACTIVAS (SAMUEL VS MIGUEL) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GRÁFICA LINEAL 1: PRODUCCIÓN DIARIA (L a V) */}
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-text-tertiary uppercase tracking-wider">
                <Activity className="w-4 h-4 text-indigo-500" />
                <span>Gráfica Lineal · Producción Diaria</span>
              </div>
              <h3 className="text-base font-bold text-text-primary mt-1">
                Curva de Entregas por Día (Lunes a Viernes)
              </h3>
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-600 dark:bg-indigo-400 inline-block"></span>
                <span className="text-text-secondary">Samuel</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-violet-600 dark:bg-violet-400 inline-block"></span>
                <span className="text-text-secondary">Miguel</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-dashed border-t-2 border-dashed border-emerald-500 inline-block"></span>
                <span className="text-emerald-600 dark:text-emerald-400">Meta (6)</span>
              </div>
            </div>
          </div>

          {/* SVG Line Chart: Producción Diaria */}
          <DailyLineChart data={dailyTrends} selectedDate={selectedDateStr} onSelectDate={setSelectedDateStr} />
        </div>

        {/* GRÁFICA LINEAL 2: PRODUCCIÓN ACUMULADA SEMANAL */}
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-text-tertiary uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-violet-500" />
                <span>Gráfica Lineal · Tendencia Acumulada</span>
              </div>
              <h3 className="text-base font-bold text-text-primary mt-1">
                Velocidad hacia la Meta Semanal (30 piezas)
              </h3>
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-600 dark:bg-indigo-400 inline-block"></span>
                <span className="text-text-secondary">Samuel</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-violet-600 dark:bg-violet-400 inline-block"></span>
                <span className="text-text-secondary">Miguel</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400 inline-block"></span>
                <span className="text-text-tertiary">Ideal (acum)</span>
              </div>
            </div>
          </div>

          {/* SVG Line Chart: Tendencia Acumulada */}
          <AccumulatedLineChart data={dailyTrends} />
        </div>

      </div>

    </div>
  )
}

// ========================================================
// COMPONENTES DE GRÁFICAS LINEALES SVG ADAPTABLES AL TEMA
// ========================================================

interface DayTrendPoint {
  label: string
  fullLabel: string
  date: string
  samuel: number
  miguel: number
  samuelAccum: number
  miguelAccum: number
  target: number
  targetAccum: number
}

// 1. Gráfica Lineal de Producción Diaria
function DailyLineChart({
  data,
  selectedDate,
  onSelectDate
}: {
  data: DayTrendPoint[]
  selectedDate: string
  onSelectDate: (d: string) => void
}) {
  const width = 500
  const height = 220
  const paddingX = 40
  const paddingTop = 25
  const paddingBottom = 35

  const chartWidth = width - paddingX * 2
  const chartHeight = height - paddingTop - paddingBottom

  const maxVal = 8 // Escala máxima eje Y (0 a 8 piezas)

  const getX = (idx: number) => paddingX + (idx / (data.length - 1)) * chartWidth
  const getY = (val: number) => paddingTop + chartHeight - (Math.min(maxVal, Math.max(0, val)) / maxVal) * chartHeight

  // Coordenadas de líneas
  const samuelPoints = data.map((d, i) => `${getX(i)},${getY(d.samuel)}`).join(" ")
  const miguelPoints = data.map((d, i) => `${getX(i)},${getY(d.miguel)}`).join(" ")
  const targetY = getY(6) // Línea de meta en 6

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none overflow-visible">
        <defs>
          {/* Gradientes sutiles para áreas debajo de las líneas */}
          <linearGradient id="samuelGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="miguelGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Líneas horizontales de fondo del eje Y */}
        {[0, 2, 4, 6, 8].map(tick => {
          const y = getY(tick)
          return (
            <g key={tick}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="currentColor"
                className={tick === 6 ? "text-emerald-500/50 stroke-dasharray-[4,4]" : "text-border stroke-[1] opacity-40 dark:opacity-20"}
                strokeDasharray={tick === 6 ? "4 4" : undefined}
              />
              <text
                x={paddingX - 10}
                y={y + 4}
                textAnchor="end"
                className={`text-[10px] font-semibold fill-text-tertiary ${tick === 6 ? "fill-emerald-500" : ""}`}
              >
                {tick}
              </text>
            </g>
          )
        })}

        {/* Área rellena Samuel */}
        <polygon
          points={`${getX(0)},${getY(0)} ${samuelPoints} ${getX(data.length - 1)},${getY(0)}`}
          fill="url(#samuelGrad)"
        />

        {/* Línea Samuel (Indigo) */}
        <polyline
          fill="none"
          stroke="#4f46e5"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={samuelPoints}
        />

        {/* Línea Miguel (Violet) */}
        <polyline
          fill="none"
          stroke="#7c3aed"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={miguelPoints}
        />

        {/* Puntos y etiquetas interactivas */}
        {data.map((d, i) => {
          const x = getX(i)
          const yS = getY(d.samuel)
          const yM = getY(d.miguel)
          const isSelected = d.date === selectedDate

          return (
            <g
              key={d.date}
              className="cursor-pointer group"
              onClick={() => onSelectDate(d.date)}
            >
              {/* Barra vertical de selección */}
              {isSelected && (
                <line
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={paddingTop + chartHeight}
                  stroke="currentColor"
                  className="text-text-primary stroke-1 stroke-dasharray-[3,3] opacity-60"
                  strokeDasharray="3 3"
                />
              )}

              {/* Punto Samuel */}
              <circle
                cx={x}
                cy={yS}
                r={isSelected ? 6 : 4}
                className="fill-indigo-600 stroke-surface stroke-2 transition-transform duration-200"
              />
              <text
                x={x}
                y={yS - 8}
                textAnchor="middle"
                className="text-[10px] font-extrabold fill-indigo-600 dark:fill-indigo-400"
              >
                {d.samuel}
              </text>

              {/* Punto Miguel */}
              <circle
                cx={x}
                cy={yM}
                r={isSelected ? 6 : 4}
                className="fill-violet-600 stroke-surface stroke-2 transition-transform duration-200"
              />
              <text
                x={x}
                y={yM + 14}
                textAnchor="middle"
                className="text-[10px] font-extrabold fill-violet-600 dark:fill-violet-400"
              >
                {d.miguel}
              </text>

              {/* Etiqueta Eje X (Día) */}
              <text
                x={x}
                y={height - 10}
                textAnchor="middle"
                className={`text-[11px] font-bold ${
                  isSelected
                    ? "fill-text-primary"
                    : "fill-text-tertiary group-hover:fill-text-secondary"
                }`}
              >
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// 2. Gráfica Lineal de Producción Acumulada Semanal
function AccumulatedLineChart({
  data
}: {
  data: DayTrendPoint[]
}) {
  const width = 500
  const height = 220
  const paddingX = 40
  const paddingTop = 25
  const paddingBottom = 35

  const chartWidth = width - paddingX * 2
  const chartHeight = height - paddingTop - paddingBottom

  const maxVal = 35 // Escala hasta 35 piezas acumuladas

  const getX = (idx: number) => paddingX + (idx / (data.length - 1)) * chartWidth
  const getY = (val: number) => paddingTop + chartHeight - (Math.min(maxVal, Math.max(0, val)) / maxVal) * chartHeight

  const samuelPoints = data.map((d, i) => `${getX(i)},${getY(d.samuelAccum)}`).join(" ")
  const miguelPoints = data.map((d, i) => `${getX(i)},${getY(d.miguelAccum)}`).join(" ")
  const targetPoints = data.map((d, i) => `${getX(i)},${getY(d.targetAccum)}`).join(" ")

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none overflow-visible">
        {/* Líneas horizontales de guía */}
        {[0, 10, 20, 30].map(tick => {
          const y = getY(tick)
          return (
            <g key={tick}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="currentColor"
                className={tick === 30 ? "text-amber-500/50 stroke-dasharray-[4,4]" : "text-border stroke-[1] opacity-40 dark:opacity-20"}
                strokeDasharray={tick === 30 ? "4 4" : undefined}
              />
              <text
                x={paddingX - 10}
                y={y + 4}
                textAnchor="end"
                className={`text-[10px] font-semibold fill-text-tertiary ${tick === 30 ? "fill-amber-500" : ""}`}
              >
                {tick}
              </text>
            </g>
          )
        })}

        {/* Línea de meta teórica proyectada (Dashed) */}
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          className="text-text-tertiary opacity-50"
          points={targetPoints}
        />

        {/* Línea Samuel (Indigo) */}
        <polyline
          fill="none"
          stroke="#4f46e5"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={samuelPoints}
        />

        {/* Línea Miguel (Violet) */}
        <polyline
          fill="none"
          stroke="#7c3aed"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={miguelPoints}
        />

        {/* Puntos de Samuel y Miguel */}
        {data.map((d, i) => {
          const x = getX(i)
          const yS = getY(d.samuelAccum)
          const yM = getY(d.miguelAccum)

          return (
            <g key={d.date}>
              {/* Punto Samuel */}
              <circle
                cx={x}
                cy={yS}
                r={4.5}
                className="fill-indigo-600 stroke-surface stroke-2"
              />
              <text
                x={x}
                y={yS - 8}
                textAnchor="middle"
                className="text-[10px] font-extrabold fill-indigo-600 dark:fill-indigo-400"
              >
                {d.samuelAccum}
              </text>

              {/* Punto Miguel */}
              <circle
                cx={x}
                cy={yM}
                r={4.5}
                className="fill-violet-600 stroke-surface stroke-2"
              />
              <text
                x={x}
                y={yM + 14}
                textAnchor="middle"
                className="text-[10px] font-extrabold fill-violet-600 dark:fill-violet-400"
              >
                {d.miguelAccum}
              </text>

              {/* Etiqueta Eje X (Día) */}
              <text
                x={x}
                y={height - 10}
                textAnchor="middle"
                className="text-[11px] font-bold fill-text-tertiary"
              >
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
