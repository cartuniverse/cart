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
  BarChart3,
  PieChart,
  ArrowUpRight,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
  FileText
} from "lucide-react"
import type { DailyDesignLog } from "@/lib/types"
import {
  getWeeklyAllDesignLogs,
  getMonthlyDesignLogs
} from "@/lib/supabase"

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

// Planes semanales exactos de Samuel y Miguel según su cronograma
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
  // Estado de navegación temporal
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date())
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => formatDate(new Date()))
  const [showCalendarPopover, setShowCalendarPopover] = useState(false)
  const [loading, setLoading] = useState(true)

  // Logs cargados
  const [weekLogs, setWeekLogs] = useState<DailyDesignLog[]>([])

  // Fechas de la semana de trabajo actual (Lunes a Viernes)
  const currentWeekMonday = useMemo(() => getMonday(currentDate), [currentDate])

  const weekDays = useMemo(() => {
    return [0, 1, 2, 3, 4].map(offset => {
      const d = new Date(currentWeekMonday)
      d.setDate(currentWeekMonday.getDate() + offset)
      return {
        date: d,
        iso: formatDate(d),
        dayNum: offset + 1, // 1..5
        label: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"][offset],
        shortLabel: ["L", "M", "Mi", "J", "V"][offset]
      }
    })
  }, [currentWeekMonday])

  // Cargar datos de la semana activa
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

  // Día activo seleccionado (1..5)
  const selectedDayNum = useMemo(() => {
    const found = weekDays.find(w => w.iso === selectedDateStr)
    return found ? found.dayNum : 1
  }, [weekDays, selectedDateStr])

  // Logs del día seleccionado
  const dayLogs = useMemo(() => {
    return weekLogs.filter(l => l.date === selectedDateStr)
  }, [weekLogs, selectedDateStr])

  // Log de Samuel para el día seleccionado
  const samuelDayLog = useMemo(() => {
    return dayLogs.find(l => {
      const name = (l.designerName || "").toLowerCase()
      const id = (l.designerId || "").toLowerCase()
      return name.includes("samuel") || id.includes("samuel")
    })
  }, [dayLogs])

  // Log de Miguel para el día seleccionado
  const miguelDayLog = useMemo(() => {
    return dayLogs.find(l => {
      const name = (l.designerName || "").toLowerCase()
      const id = (l.designerId || "").toLowerCase()
      return name.includes("miguel") || id.includes("miguel")
    })
  }, [dayLogs])

  // Formatos evaluados de Samuel para el día
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

  // Formatos evaluados de Miguel para el día
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
  const samuelDayTarget = samuelClFormats.length + samuelMtFormats.length // generalmente 6
  const miguelDayCompleted = miguelClFormats.filter(f => f.completed).length + miguelMtFormats.filter(f => f.completed).length
  const miguelDayTarget = miguelClFormats.length + miguelMtFormats.length // generalmente 6

  // Conteos de toda la semana para cada uno
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

  // Desglose diario de la semana para gráficas comparativas (L a V)
  const comparisonByDay = useMemo(() => {
    return weekDays.map((w, index) => {
      const dNum = index + 1
      const sPlan = SAMUEL_PLAN[dNum] || SAMUEL_PLAN[1]
      const mPlan = MIGUEL_PLAN[dNum] || MIGUEL_PLAN[1]
      const target = sPlan.cl.length + sPlan.mt.length // 6 piezas

      const sLog = weekLogs.find(l => {
        const matchDate = l.date === w.iso
        const isS = (l.designerName || "").toLowerCase().includes("samuel") || (l.designerId || "").toLowerCase().includes("samuel")
        return matchDate && isS
      })
      const mLog = weekLogs.find(l => {
        const matchDate = l.date === w.iso
        const isM = (l.designerName || "").toLowerCase().includes("miguel") || (l.designerId || "").toLowerCase().includes("miguel")
        return matchDate && isM
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

      return {
        label: w.shortLabel,
        fullLabel: w.label,
        date: w.iso,
        samuel: sCount,
        miguel: mCount,
        target: target
      }
    })
  }, [weekDays, weekLogs])

  // Desglose por Proyecto para Samuel vs Miguel (Gráfica 2)
  const comparisonByBrand = useMemo(() => {
    let samuelCL = 0, samuelMT = 0
    let miguelCL = 0, miguelMT = 0

    weekLogs.forEach(l => {
      const isS = (l.designerName || "").toLowerCase().includes("samuel") || (l.designerId || "").toLowerCase().includes("samuel")
      const isM = (l.designerName || "").toLowerCase().includes("miguel") || (l.designerId || "").toLowerCase().includes("miguel")

      const cl = (l.formatClHistorias || 0) + (l.formatClMovimiento || 0) + (l.formatClPost || 0) +
                 (l.formatClHistoriaProducto || 0) + (l.formatClHistoriaInteractiva || 0)
      const mt = (l.formatMtHistorias || 0) + (l.formatMtCarruseles || 0)

      if (isS) {
        samuelCL += cl
        samuelMT += mt
      }
      if (isM) {
        miguelCL += cl
        miguelMT += mt
      }
    })

    return {
      samuel: { cl: samuelCL, mt: samuelMT, total: samuelCL + samuelMT },
      miguel: { cl: miguelCL, mt: miguelMT, total: miguelCL + miguelMT }
    }
  }, [weekLogs])

  // Handlers de cambio de fecha
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

  const weekTargetTotal = 30 // 6 piezas x 5 días = 30 piezas semanales por diseñador
  const samuelWeekPct = Math.min(100, Math.round((samuelWeekTotal / weekTargetTotal) * 100))
  const miguelWeekPct = Math.min(100, Math.round((miguelWeekTotal / weekTargetTotal) * 100))

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-6 md:p-8 font-sans">
      
      {/* ======================================================== */}
      {/* 1. HEADER: TITULO, FILTRO DE CALENDARIO Y RECARGA        */}
      {/* ======================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
            <span>Dirección Operativa</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700 font-semibold">Seguimiento Diseñadores IA</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Control de Producción Creativa
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">
              Samuel & Miguel
            </span>
          </h1>
        </div>

        {/* CONTROLES DE FECHA Y CALENDARIO */}
        <div className="flex items-center gap-2 relative flex-wrap">
          {/* Navegación de semana */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm p-1">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2 text-slate-700">
              Semana {weekDays[0]?.date.getDate()} - {weekDays[4]?.date.getDate()}{" "}
              {weekDays[0]?.date.toLocaleDateString("es-ES", { month: "short" })}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition"
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Selector de Fecha específico (Input Calendario) */}
          <div className="relative">
            <button
              onClick={() => setShowCalendarPopover(!showCalendarPopover)}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 px-3.5 py-2 rounded-xl shadow-sm text-xs font-semibold text-slate-700 transition"
            >
              <CalendarIcon className="w-4 h-4 text-indigo-600" />
              <span>
                {new Date(selectedDateStr + "T12:00:00").toLocaleDateString("es-ES", {
                  weekday: "short",
                  day: "numeric",
                  month: "short"
                })}
              </span>
            </button>

            {showCalendarPopover && (
              <div className="absolute right-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl w-64">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Seleccionar día
                </div>
                <input
                  type="date"
                  value={selectedDateStr}
                  onChange={(e) => {
                    if (e.target.value) handleDateSelect(e.target.value)
                  }}
                  className="w-full text-xs p-2 border border-slate-200 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => {
                    const todayStr = formatDate(new Date())
                    handleDateSelect(todayStr)
                  }}
                  className="w-full text-center text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-1.5 rounded-lg transition"
                >
                  Ir a Hoy
                </button>
              </div>
            )}
          </div>

          <button
            onClick={loadWeekData}
            title="Recargar datos"
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SELECTOR INTERACTIVO DE DÍAS (L - V)                  */}
      {/* ======================================================== */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Días de la semana · Producción
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Selecciona un día para inspeccionar el avance de Samuel y Miguel
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

            return (
              <button
                key={w.iso}
                onClick={() => setSelectedDateStr(w.iso)}
                className={`flex flex-col items-center justify-between p-3 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-slate-900 border-slate-900 text-white shadow-md scale-[1.02]"
                    : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between w-full text-[11px] font-semibold">
                  <span className={isSelected ? "text-slate-300" : "text-slate-500"}>{w.label}</span>
                  <span className={`text-[10px] ${isSelected ? "text-slate-400" : "text-slate-400"}`}>
                    {w.date.getDate()} {w.date.toLocaleDateString("es-ES", { month: "short" })}
                  </span>
                </div>

                <div className="my-2 text-center">
                  <span className="text-xl font-black">{totalDayDone}</span>
                  <span className={`text-[10px] ml-0.5 ${isSelected ? "text-slate-400" : "text-slate-400"}`}>/12</span>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-medium">
                  <span className={`px-1.5 py-0.5 rounded ${isSelected ? "bg-indigo-950 text-indigo-300" : "bg-indigo-50 text-indigo-700"}`}>
                    S: {sDone}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded ${isSelected ? "bg-violet-950 text-violet-300" : "bg-violet-50 text-violet-700"}`}>
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
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            {/* Header Diseñador */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-base shadow-sm">
                  SM
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">Samuel Marín</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      Diseñador AI
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">samuel.gaviria@cartuniverse.online</p>
                </div>
              </div>

              {/* Cumplimiento hoy */}
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-2xl font-black text-indigo-600">{samuelDayCompleted}</span>
                  <span className="text-xs text-slate-400 font-bold">/ {samuelDayTarget} hoy</span>
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  {Math.round((samuelDayCompleted / samuelDayTarget) * 100)}% Completado
                </div>
              </div>
            </div>

            {/* Barra de progreso hoy */}
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-5">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (samuelDayCompleted / samuelDayTarget) * 100)}%` }}
              ></div>
            </div>

            {/* PROYECTO CASA LUIFER */}
            <div className="bg-pink-50/40 border border-pink-100 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-pink-500 text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                    CL
                  </span>
                  <div>
                    <span className="text-xs font-bold text-pink-900 block">Casa Luifer</span>
                    <span className="text-[10px] text-pink-600 font-medium">Tema: {samuelPlan.clTheme}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-pink-700 bg-white/80 px-2 py-0.5 rounded-md border border-pink-100">
                  {samuelClFormats.filter(f => f.completed).length} / {samuelClFormats.length}
                </span>
              </div>

              {/* Formatos de Casa Luifer */}
              <div className="grid grid-cols-2 gap-2">
                {samuelClFormats.map(f => (
                  <div
                    key={f.key}
                    className={`p-2.5 rounded-xl border transition flex items-start justify-between gap-1.5 ${
                      f.completed
                        ? "bg-white border-pink-200 shadow-xs"
                        : "bg-white/40 border-pink-100/70 text-slate-400"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        {f.completed ? (
                          <CheckCircle className="w-4 h-4 text-pink-600 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-pink-300 shrink-0"></div>
                        )}
                        <span className={`text-xs font-bold ${f.completed ? "text-slate-800" : "text-slate-400"}`}>
                          {f.title}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 pl-5.5 mt-0.5 truncate">{f.hint}</p>
                    </div>

                    {f.url && (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:text-pink-800 p-1 hover:bg-pink-50 rounded-lg transition"
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
            <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-500 text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                    MT
                  </span>
                  <div>
                    <span className="text-xs font-bold text-blue-900 block">Montana</span>
                    <span className="text-[10px] text-blue-600 font-medium">Catálogo & Historias</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-white/80 px-2 py-0.5 rounded-md border border-blue-100">
                  {samuelMtFormats.filter(f => f.completed).length} / {samuelMtFormats.length}
                </span>
              </div>

              {/* Formatos de Montana */}
              <div className="grid grid-cols-2 gap-2">
                {samuelMtFormats.map(f => (
                  <div
                    key={f.key}
                    className={`p-2.5 rounded-xl border transition flex items-start justify-between gap-1.5 ${
                      f.completed
                        ? "bg-white border-blue-200 shadow-xs"
                        : "bg-white/40 border-blue-100/70 text-slate-400"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        {f.completed ? (
                          <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-blue-300 shrink-0"></div>
                        )}
                        <span className={`text-xs font-bold ${f.completed ? "text-slate-800" : "text-slate-400"}`}>
                          {f.title}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 pl-5.5 mt-0.5 truncate">{f.hint}</p>
                    </div>

                    {f.url && (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded-lg transition"
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
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Avance de la semana:</span>
              <strong className="text-slate-900">{samuelWeekTotal} / {weekTargetTotal} piezas</strong>
            </div>
            <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              {samuelWeekPct}% meta semanal
            </span>
          </div>
        </div>

        {/* ==================================================== */}
        {/* TARJETA 2: MIGUEL BOLÍVAR                            */}
        {/* ==================================================== */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            {/* Header Diseñador */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white font-black flex items-center justify-center text-base shadow-sm">
                  MB
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">Miguel Bolívar</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-50 text-violet-700 border border-violet-100">
                      Diseñador AI
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">miguel.bolivar@cartuniverse.online</p>
                </div>
              </div>

              {/* Cumplimiento hoy */}
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-2xl font-black text-violet-600">{miguelDayCompleted}</span>
                  <span className="text-xs text-slate-400 font-bold">/ {miguelDayTarget} hoy</span>
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  {Math.round((miguelDayCompleted / miguelDayTarget) * 100)}% Completado
                </div>
              </div>
            </div>

            {/* Barra de progreso hoy */}
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-5">
              <div
                className="h-full bg-violet-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (miguelDayCompleted / miguelDayTarget) * 100)}%` }}
              ></div>
            </div>

            {/* PROYECTO CASA LUIFER */}
            <div className="bg-pink-50/40 border border-pink-100 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-pink-500 text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                    CL
                  </span>
                  <div>
                    <span className="text-xs font-bold text-pink-900 block">Casa Luifer</span>
                    <span className="text-[10px] text-pink-600 font-medium">Tema: {miguelPlan.clTheme}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-pink-700 bg-white/80 px-2 py-0.5 rounded-md border border-pink-100">
                  {miguelClFormats.filter(f => f.completed).length} / {miguelClFormats.length}
                </span>
              </div>

              {/* Formatos de Casa Luifer */}
              <div className="grid grid-cols-2 gap-2">
                {miguelClFormats.map(f => (
                  <div
                    key={f.key}
                    className={`p-2.5 rounded-xl border transition flex items-start justify-between gap-1.5 ${
                      f.completed
                        ? "bg-white border-pink-200 shadow-xs"
                        : "bg-white/40 border-pink-100/70 text-slate-400"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        {f.completed ? (
                          <CheckCircle className="w-4 h-4 text-pink-600 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-pink-300 shrink-0"></div>
                        )}
                        <span className={`text-xs font-bold ${f.completed ? "text-slate-800" : "text-slate-400"}`}>
                          {f.title}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 pl-5.5 mt-0.5 truncate">{f.hint}</p>
                    </div>

                    {f.url && (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:text-pink-800 p-1 hover:bg-pink-50 rounded-lg transition"
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
            <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-500 text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                    MT
                  </span>
                  <div>
                    <span className="text-xs font-bold text-blue-900 block">Montana</span>
                    <span className="text-[10px] text-blue-600 font-medium">Creativos & Carrusel</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-white/80 px-2 py-0.5 rounded-md border border-blue-100">
                  {miguelMtFormats.filter(f => f.completed).length} / {miguelMtFormats.length}
                </span>
              </div>

              {/* Formatos de Montana */}
              <div className="grid grid-cols-2 gap-2">
                {miguelMtFormats.map(f => (
                  <div
                    key={f.key}
                    className={`p-2.5 rounded-xl border transition flex items-start justify-between gap-1.5 ${
                      f.completed
                        ? "bg-white border-blue-200 shadow-xs"
                        : "bg-white/40 border-blue-100/70 text-slate-400"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        {f.completed ? (
                          <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-blue-300 shrink-0"></div>
                        )}
                        <span className={`text-xs font-bold ${f.completed ? "text-slate-800" : "text-slate-400"}`}>
                          {f.title}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 pl-5.5 mt-0.5 truncate">{f.hint}</p>
                    </div>

                    {f.url && (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded-lg transition"
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
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Avance de la semana:</span>
              <strong className="text-slate-900">{miguelWeekTotal} / {weekTargetTotal} piezas</strong>
            </div>
            <span className="font-bold text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-100">
              {miguelWeekPct}% meta semanal
            </span>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 4. DOS GRÁFICAS COMPARATIVAS DE DESEMPEÑO SAMUEL VS MIGUEL */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GRÁFICA 1: PRODUCCIÓN DIARIA COMPARADA (L A V) */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>Comparativa Diaria · Piezas Creadas</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Rendimiento Lunes a Viernes
              </h3>
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span>
                <span className="text-slate-600">Samuel</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-violet-600 inline-block"></span>
                <span className="text-slate-600">Miguel</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded bg-slate-300 inline-block"></span>
                <span className="text-slate-400">Meta (6)</span>
              </div>
            </div>
          </div>

          {/* Gráfico de barras visual */}
          <div className="space-y-4 pt-3">
            {comparisonByDay.map(day => {
              const maxScale = 8
              const sWidth = Math.min(100, (day.samuel / maxScale) * 100)
              const mWidth = Math.min(100, (day.miguel / maxScale) * 100)
              const isSelectedDay = day.date === selectedDateStr

              return (
                <div
                  key={day.date}
                  className={`p-3 rounded-2xl transition border ${
                    isSelectedDay
                      ? "bg-slate-50 border-slate-200"
                      : "bg-white border-transparent hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold mb-2">
                    <span className="text-slate-700">{day.fullLabel}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-indigo-600 font-bold">Samuel: {day.samuel}</span>
                      <span className="text-violet-600 font-bold">Miguel: {day.miguel}</span>
                    </div>
                  </div>

                  {/* Doble barra comparativa */}
                  <div className="space-y-1.5">
                    {/* Barra Samuel */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 w-4">S</span>
                      <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden relative">
                        {/* Marca de meta (6 piezas = 75%) */}
                        <div className="absolute top-0 bottom-0 left-[75%] w-0.5 bg-slate-300 z-10" title="Meta: 6"></div>
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${sWidth}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Barra Miguel */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 w-4">M</span>
                      <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden relative">
                        <div className="absolute top-0 bottom-0 left-[75%] w-0.5 bg-slate-300 z-10" title="Meta: 6"></div>
                        <div
                          className="h-full bg-violet-600 rounded-full transition-all duration-500"
                          style={{ width: `${mWidth}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* GRÁFICA 2: DISTRIBUCIÓN POR MARCA Y CUMPLIMIENTO TOTAL */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  <span>Distribución por Marcas · Casa Luifer vs Montana</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Balance y Carga de Trabajo Semanal
                </h3>
              </div>
            </div>

            {/* Comparativa por Diseñador */}
            <div className="space-y-5 pt-2">
              {/* Samuel */}
              <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                      SM
                    </div>
                    <span className="text-xs font-bold text-slate-800">Samuel Marín</span>
                  </div>
                  <span className="text-xs font-extrabold text-indigo-600">
                    {comparisonByBrand.samuel.total} piezas totales
                  </span>
                </div>

                {/* Barra segmentada: Casa Luifer vs Montana */}
                <div className="w-full h-4 rounded-full bg-slate-200 overflow-hidden flex mb-2">
                  <div
                    className="h-full bg-pink-500 transition-all duration-500"
                    style={{
                      width: comparisonByBrand.samuel.total > 0
                        ? `${(comparisonByBrand.samuel.cl / comparisonByBrand.samuel.total) * 100}%`
                        : "60%"
                    }}
                    title={`Casa Luifer: ${comparisonByBrand.samuel.cl}`}
                  ></div>
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{
                      width: comparisonByBrand.samuel.total > 0
                        ? `${(comparisonByBrand.samuel.mt / comparisonByBrand.samuel.total) * 100}%`
                        : "40%"
                    }}
                    title={`Montana: ${comparisonByBrand.samuel.mt}`}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                    Casa Luifer: <strong>{comparisonByBrand.samuel.cl} piezas</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    Montana: <strong>{comparisonByBrand.samuel.mt} piezas</strong>
                  </span>
                </div>
              </div>

              {/* Miguel */}
              <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-violet-600 text-white font-bold text-xs flex items-center justify-center">
                      MB
                    </div>
                    <span className="text-xs font-bold text-slate-800">Miguel Bolívar</span>
                  </div>
                  <span className="text-xs font-extrabold text-violet-600">
                    {comparisonByBrand.miguel.total} piezas totales
                  </span>
                </div>

                {/* Barra segmentada: Casa Luifer vs Montana */}
                <div className="w-full h-4 rounded-full bg-slate-200 overflow-hidden flex mb-2">
                  <div
                    className="h-full bg-pink-500 transition-all duration-500"
                    style={{
                      width: comparisonByBrand.miguel.total > 0
                        ? `${(comparisonByBrand.miguel.cl / comparisonByBrand.miguel.total) * 100}%`
                        : "60%"
                    }}
                    title={`Casa Luifer: ${comparisonByBrand.miguel.cl}`}
                  ></div>
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{
                      width: comparisonByBrand.miguel.total > 0
                        ? `${(comparisonByBrand.miguel.mt / comparisonByBrand.miguel.total) * 100}%`
                        : "40%"
                    }}
                    title={`Montana: ${comparisonByBrand.miguel.mt}`}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                    Casa Luifer: <strong>{comparisonByBrand.miguel.cl} piezas</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    Montana: <strong>{comparisonByBrand.miguel.mt} piezas</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Resumen de productividad */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Meta semanal esperada: <strong>30 piezas c/u (60 total)</strong></span>
            <span className="font-bold text-slate-800">
              Total equipo: {samuelWeekTotal + miguelWeekTotal} piezas
            </span>
          </div>
        </div>

      </div>

    </div>
  )
}
