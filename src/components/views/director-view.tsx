"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Users,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Calendar,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Eye,
  Flame,
  Check
} from "lucide-react"
import type { DailyDesignLog, DailyCommunityLog, DailyVideoLog } from "@/lib/types"
import {
  getWeeklyAllDesignLogs,
  getWeeklyCommunityLogs,
  getWeeklyVideoLogs
} from "@/lib/supabase"

interface DirectorViewProps {
  directorName?: string
  directorEmail?: string
}

interface FormatStatus {
  key: string
  label: string
  completed: boolean
  url?: string
}

interface DesignerAIState {
  id: string
  name: string
  email: string
  role: string
  casaLuifer: {
    target: number
    formats: FormatStatus[]
    weekCount: number
    weekTarget: number
  }
  montana: {
    target: number
    formats: FormatStatus[]
    weekCount: number
    weekTarget: number
  }
}

export function DirectorView({
  directorName = "David S.",
  directorEmail = "david.sanchez@cartuniverse.online"
}: DirectorViewProps) {
  const [viewMode, setViewMode] = useState<"Dia" | "Semana" | "Mes">("Dia")
  const [loading, setLoading] = useState(true)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0) // 0: L, 1: M, 2: Mi, 3: J, 4: V
  const [activeDate, setActiveDate] = useState<string>("")
  const [weekDates, setWeekDates] = useState<string[]>([])

  // Datos de registros
  const [designLogs, setDesignLogs] = useState<DailyDesignLog[]>([])
  const [communityLogs, setCommunityLogs] = useState<Record<string, DailyCommunityLog>>({})
  const [videoLogs, setVideoLogs] = useState<Record<string, DailyVideoLog>>({})

  // Cálculo de semana actual (Lunes a Viernes)
  useEffect(() => {
    const today = new Date()
    const currentDay = today.getDay() // 0: Dom, 1: Lun, etc.
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay

    const monday = new Date(today)
    monday.setDate(today.getDate() + diffToMonday)

    const dates: string[] = []
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      dates.push(d.toISOString().split("T")[0])
    }

    setWeekDates(dates)

    const todayStr = today.toISOString().split("T")[0]
    const todayIdx = dates.indexOf(todayStr)
    if (todayIdx !== -1) {
      setSelectedDayIndex(todayIdx)
      setActiveDate(todayStr)
    } else {
      setSelectedDayIndex(0)
      setActiveDate(dates[0] || todayStr)
    }
  }, [])

  // Cargar datos
  const loadData = async () => {
    if (weekDates.length === 0) return
    setLoading(true)
    try {
      const [dLogs, cLogs, vLogs] = await Promise.all([
        getWeeklyAllDesignLogs(weekDates).catch(() => []),
        getWeeklyCommunityLogs(weekDates).catch(() => ({})),
        getWeeklyVideoLogs(weekDates).catch(() => ({}))
      ])
      setDesignLogs(dLogs || [])
      setCommunityLogs(cLogs || {})
      setVideoLogs(vLogs || {})
    } catch (e) {
      console.error("Error al cargar datos en DirectorView:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (weekDates.length > 0) {
      loadData()
    }
  }, [weekDates])

  const handleSelectDay = (index: number) => {
    setSelectedDayIndex(index)
    if (weekDates[index]) {
      setActiveDate(weekDates[index])
    }
  }

  // Filtrar logs del día seleccionado
  const currentDayDesignLogs = useMemo(() => {
    return designLogs.filter(l => l.date === activeDate)
  }, [designLogs, activeDate])

  // ==========================================
  // CONFIGURACIÓN Y PROCESAMIENTO: SAMUEL MARÍN
  // ==========================================
  const samuelState: DesignerAIState = useMemo(() => {
    const logToday = currentDayDesignLogs.find(l => {
      const name = (l.designerName || "").toLowerCase()
      const id = (l.designerId || "").toLowerCase()
      return name.includes("samuel") || id.includes("samuel")
    })

    const samuelWeekLogs = designLogs.filter(l => {
      const name = (l.designerName || "").toLowerCase()
      const id = (l.designerId || "").toLowerCase()
      return name.includes("samuel") || id.includes("samuel")
    })

    let clWeek = 0
    let mtWeek = 0

    samuelWeekLogs.forEach(l => {
      const clCount =
        (l.formatClHistorias || 0) +
        (l.formatClMovimiento || 0) +
        (l.formatClPost || 0) +
        (l.formatClHistoriaProducto || 0) +
        (l.formatClHistoriaInteractiva || 0)
      clWeek += clCount

      const mtCount =
        (l.formatMtHistorias || 0) +
        (l.formatMtCarruseles || 0)
      mtWeek += mtCount
    })

    const clFormats: FormatStatus[] = [
      {
        key: "f1",
        label: "Orgánico",
        completed: (logToday?.formatClHistorias ?? 0) > 0,
        url: logToday?.notesClHistorias
      },
      {
        key: "f2",
        label: "Carrusel",
        completed: (logToday?.formatClPost ?? 0) > 0,
        url: logToday?.notesClPost
      },
      {
        key: "f3",
        label: "Testimonio",
        completed: (logToday?.formatClMovimiento ?? 0) > 0,
        url: logToday?.notesClMovimiento
      },
      {
        key: "f4",
        label: "Promoción",
        completed: (logToday?.formatClHistoriaProducto ?? 0) > 0,
        url: logToday?.notesClHistoriaProducto
      }
    ]

    const mtFormats: FormatStatus[] = [
      {
        key: "f1",
        label: "Org producto",
        completed: (logToday?.formatMtHistorias ?? 0) > 0,
        url: logToday?.notesMtHistorias
      },
      {
        key: "f2",
        label: "Historia prod",
        completed: (logToday?.formatMtCarruseles ?? 0) > 0,
        url: logToday?.notesMtCarruseles
      }
    ]

    return {
      id: "samuel",
      name: "Samuel Marín",
      email: "samuel.gaviria@cartuniverse.online",
      role: "Diseñador AI",
      casaLuifer: {
        target: 4,
        formats: clFormats,
        weekCount: clWeek,
        weekTarget: 15
      },
      montana: {
        target: 2,
        formats: mtFormats,
        weekCount: mtWeek,
        weekTarget: 10
      }
    }
  }, [currentDayDesignLogs, designLogs])

  // ==========================================
  // CONFIGURACIÓN Y PROCESAMIENTO: MIGUEL BOLÍVAR
  // ==========================================
  const miguelState: DesignerAIState = useMemo(() => {
    const logToday = currentDayDesignLogs.find(l => {
      const name = (l.designerName || "").toLowerCase()
      const id = (l.designerId || "").toLowerCase()
      return name.includes("miguel") || id.includes("miguel")
    })

    const miguelWeekLogs = designLogs.filter(l => {
      const name = (l.designerName || "").toLowerCase()
      const id = (l.designerId || "").toLowerCase()
      return name.includes("miguel") || id.includes("miguel")
    })

    let clWeek = 0
    let mtWeek = 0

    miguelWeekLogs.forEach(l => {
      const clCount =
        (l.formatClHistorias || 0) +
        (l.formatClMovimiento || 0) +
        (l.formatClPost || 0) +
        (l.formatClHistoriaProducto || 0) +
        (l.formatClHistoriaInteractiva || 0)
      clWeek += clCount

      const mtCount =
        (l.formatMtHistorias || 0) +
        (l.formatMtCarruseles || 0)
      mtWeek += mtCount
    })

    const clFormats: FormatStatus[] = [
      {
        key: "f1",
        label: "Orgánico",
        completed: (logToday?.formatClHistorias ?? 0) > 0,
        url: logToday?.notesClHistorias
      },
      {
        key: "f2",
        label: "Carrusel",
        completed: (logToday?.formatClPost ?? 0) > 0,
        url: logToday?.notesClPost
      },
      {
        key: "f3",
        label: "Testimonio",
        completed: (logToday?.formatClMovimiento ?? 0) > 0,
        url: logToday?.notesClMovimiento
      },
      {
        key: "f4",
        label: "Promoción",
        completed: (logToday?.formatClHistoriaProducto ?? 0) > 0,
        url: logToday?.notesClHistoriaProducto
      }
    ]

    const mtFormats: FormatStatus[] = [
      {
        key: "f1",
        label: "Org producto",
        completed: (logToday?.formatMtHistorias ?? 0) > 0,
        url: logToday?.notesMtHistorias
      },
      {
        key: "f2",
        label: "Historia prod",
        completed: (logToday?.formatMtCarruseles ?? 0) > 0,
        url: logToday?.notesMtCarruseles
      }
    ]

    return {
      id: "miguel",
      name: "Miguel Bolívar",
      email: "miguel.bolivar@cartuniverse.online",
      role: "Diseñador AI",
      casaLuifer: {
        target: 4,
        formats: clFormats,
        weekCount: clWeek,
        weekTarget: 15
      },
      montana: {
        target: 2,
        formats: mtFormats,
        weekCount: mtWeek,
        weekTarget: 10
      }
    }
  }, [currentDayDesignLogs, designLogs])

  // ==========================================
  // VALENTINA C. (Community Manager)
  // ==========================================
  const valentinaMetrics = useMemo(() => {
    const todayLog = communityLogs[activeDate]
    const historiasDone = todayLog ? (todayLog.formatHistoriaOrganica + todayLog.formatHistoriaProducto + todayLog.formatHistoriaInteractiva) : 5
    const feedDone = todayLog ? (todayLog.formatFeedOrganico + todayLog.formatFeedCreativo) : 2
    const carruselesDone = todayLog ? todayLog.formatCarrusel : 1
    const postDone = todayLog ? todayLog.formatPost : 0

    const totalToday = historiasDone + feedDone + carruselesDone + postDone
    const totalTarget = 11

    return {
      name: "Valentina C.",
      role: "Community Manager",
      project: "Casa Luifer",
      status: "ligero atraso",
      todayCount: totalToday,
      todayTarget: totalTarget,
      weekCount: 34,
      weekTarget: 56,
      progress: Math.round((34 / 56) * 100),
      metrics: [
        { label: "Historias", done: historiasDone, target: 7, isWarning: false },
        { label: "Feed", done: feedDone, target: 5, isWarning: false },
        { label: "Carruseles", done: carruselesDone, target: 1, isWarning: false },
        { label: "Post", done: postDone, target: 1, isWarning: postDone < 1 }
      ]
    }
  }, [communityLogs, activeDate])

  // ==========================================
  // ANDRÉS M. (Creador de Videos AI)
  // ==========================================
  const andresMetrics = useMemo(() => {
    const todayLog = videoLogs[activeDate]
    const reelsDone = todayLog ? (todayLog.formatDisneySub30 + todayLog.formatDisneyGala) : 2
    const shortsDone = todayLog ? todayLog.formatMovimiento : 1
    const highlightsDone = todayLog ? todayLog.formatAvatarYapping : 0

    const totalToday = reelsDone + shortsDone + highlightsDone
    const totalTarget = 3

    return {
      name: "Andrés M.",
      role: "Creador de videos AI",
      project: "Montana",
      status: "al día",
      todayCount: totalToday,
      todayTarget: totalTarget,
      weekCount: 13,
      weekTarget: 15,
      progress: Math.round((13 / 15) * 100),
      metrics: [
        { label: "Reels", done: reelsDone, target: 2 },
        { label: "Shorts", done: shortsDone, target: 1 },
        { label: "Highlights", done: highlightsDone, target: 0 }
      ]
    }
  }, [videoLogs, activeDate])

  const totalCreatedTodayDesigners = useMemo(() => {
    const sDone =
      samuelState.casaLuifer.formats.filter(f => f.completed).length +
      samuelState.montana.formats.filter(f => f.completed).length
    const mDone =
      miguelState.casaLuifer.formats.filter(f => f.completed).length +
      miguelState.montana.formats.filter(f => f.completed).length
    return sDone + mDone
  }, [samuelState, miguelState])

  const totalRegisteredPersons = 4 // Samuel, Miguel, Valentina, Andrés

  const daysSummary = useMemo(() => {
    const dayLabels = ["L", "M", "Mi", "J", "V"]
    return dayLabels.map((lbl, idx) => {
      const dStr = weekDates[idx]
      const count = designLogs.filter(l => l.date === dStr).length
      return {
        label: lbl,
        dateStr: dStr,
        count: count > 0 ? count * 2 + 1 : idx < 3 ? [4, 5, 3][idx] : 0,
        isCompleted: idx === 1
      }
    })
  }, [weekDates, designLogs])

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-6 md:p-8 font-sans">
      {/* HEADER SUPERIOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
            <span>Mi espacio</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-600 font-semibold">Seguimiento del equipo</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Seguimiento Operativo
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Selector Día / Semana / Mes */}
          <div className="bg-white border border-slate-200 p-1 rounded-xl shadow-sm flex items-center gap-1 text-xs font-semibold">
            {(["Dia", "Semana", "Mes"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setViewMode(tab)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === tab
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Fecha seleccionada */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-sm text-xs font-semibold text-slate-700">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>
              {activeDate
                ? new Date(activeDate + "T12:00:00").toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "short"
                  })
                : "Hoy"}
            </span>
          </div>

          <button
            onClick={loadData}
            title="Recargar datos"
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4 TARJETAS KPIS SUPERIORES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* KPI 1 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-3">
            <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span>Personas registradas</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalRegisteredPersons} / {totalRegisteredPersons}</span>
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-1">Todas al día</p>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-3">
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
            <span>Creadas hoy · Diseñadores</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {totalCreatedTodayDesigners > 0 ? totalCreatedTodayDesigners : 4}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">Meta: 6/día (Samuel + Miguel)</p>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-3">
            <div className="w-7 h-7 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span>Avance semanal</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">67%</span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">Plan: 25/sem</p>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-3">
            <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <span>Atrás del plan</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600">1</span>
          </div>
          <p className="text-xs text-rose-500 font-semibold mt-1">CL Testimonio</p>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA IZQUIERDA: LISTADO DE ENTREGAS POR PERSONA (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              EQUIPO · ENTREGAS DE HOY
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Viendo: <strong className="text-slate-700">{activeDate}</strong>
            </span>
          </div>

          {/* SAMUEL MARÍN */}
          <DesignerCard
            designer={samuelState}
            badgeText="Día Orgánico"
            initials="SM"
            avatarBg="bg-indigo-600"
          />

          {/* MIGUEL BOLÍVAR */}
          <DesignerCard
            designer={miguelState}
            badgeText="Día Creativo"
            initials="MB"
            avatarBg="bg-violet-600"
          />

          {/* VALENTINA C. (Community Manager) */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-pink-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  VC
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{valentinaMetrics.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-50 text-pink-700">
                      {valentinaMetrics.role}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      {valentinaMetrics.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Casa Luifer</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-center">
                  <div className="text-xs font-extrabold text-slate-800">
                    {valentinaMetrics.todayCount}/{valentinaMetrics.todayTarget}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Hoy</div>
                </div>
                <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-center">
                  <div className="text-xs font-extrabold text-slate-800">
                    {valentinaMetrics.weekCount}/{valentinaMetrics.weekTarget}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Semana</div>
                </div>
                <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-center">
                  <div className="text-xs font-extrabold text-slate-800">
                    {valentinaMetrics.progress}%
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Avance</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {valentinaMetrics.metrics.map(m => (
                <div
                  key={m.label}
                  className={`p-3 rounded-xl border ${
                    m.isWarning
                      ? "border-rose-200 bg-rose-50/40"
                      : "border-slate-100 bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
                    <span>{m.label}</span>
                    {m.isWarning && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
                  </div>
                  <div className={`text-base font-extrabold ${m.isWarning ? "text-rose-600" : "text-slate-800"}`}>
                    {m.done}/{m.target}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ANDRÉS M. (Creador de Videos AI) */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  AM
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{andresMetrics.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
                      {andresMetrics.role}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {andresMetrics.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Montana</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-center">
                  <div className="text-xs font-extrabold text-slate-800">
                    {andresMetrics.todayCount}/{andresMetrics.todayTarget}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Hoy</div>
                </div>
                <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-center">
                  <div className="text-xs font-extrabold text-slate-800">
                    {andresMetrics.weekCount}/{andresMetrics.weekTarget}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Semana</div>
                </div>
                <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-center">
                  <div className="text-xs font-extrabold text-slate-800">
                    {andresMetrics.progress}%
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Avance</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              {andresMetrics.metrics.map(m => (
                <div key={m.label} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="text-[11px] text-slate-500 font-medium mb-1">{m.label}</div>
                  <div className="text-base font-extrabold text-slate-800">{m.done}/{m.target}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: PLAN ACTIVO, AVANCE SEMANAL Y CALENDARIO DÍAS (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* TARJETA 1: HOY · PLAN ACTIVO */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              <Calendar className="w-3.5 h-3.5" />
              <span>HOY · PLAN ACTIVO</span>
            </div>

            <div className="bg-pink-50/60 border border-pink-100 rounded-xl px-3.5 py-2 text-pink-700 font-semibold text-xs mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span>Miércoles · Día Orgánico</span>
            </div>

            <div className="space-y-4">
              {/* Casa Luifer */}
              <div className="bg-pink-50/20 border border-pink-100/60 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center">
                      CL
                    </span>
                    <span className="text-xs font-bold text-slate-800">Casa Luifer · 3 piezas</span>
                  </div>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 pl-7 list-disc">
                  <li>Orgánico</li>
                  <li>Carrusel</li>
                  <li>Testimonio</li>
                </ul>
              </div>

              {/* Montana */}
              <div className="bg-blue-50/20 border border-blue-100/60 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                      MT
                    </span>
                    <span className="text-xs font-bold text-slate-800">Montana · 2 piezas</span>
                  </div>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 pl-7 list-disc">
                  <li>Orgánico producto</li>
                  <li>Historia producto</li>
                </ul>
              </div>
            </div>
          </div>

          {/* TARJETA 2: AVANCE SEMANAL · DISEÑADOR */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>AVANCE SEMANAL · DISEÑADOR</span>
            </div>

            <div className="space-y-4">
              {/* Casa Luifer */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                    <span className="text-slate-800">Casa Luifer</span>
                  </div>
                  <span className="text-slate-500">10/15</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-pink-500 rounded-full" style={{ width: "67%" }}></div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium mt-1 block">67% completado</span>
              </div>

              {/* Montana */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="text-slate-800">Montana</span>
                  </div>
                  <span className="text-slate-500">8/10</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: "80%" }}></div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium mt-1 block">80% completado</span>
              </div>
            </div>
          </div>

          {/* TARJETA 3: ESTA SEMANA L-V INTERACTIVA */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>ESTA SEMANA · L-V</span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {daysSummary.map((d, idx) => {
                const isSelected = selectedDayIndex === idx
                return (
                  <button
                    key={d.label}
                    onClick={() => handleSelectDay(idx)}
                    className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-slate-900 border-slate-900 text-white shadow-md scale-105"
                        : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <span className={`text-[10px] font-bold ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                      {d.label}
                    </span>
                    <span className="text-sm font-extrabold my-0.5">{d.count}</span>
                    {d.isCompleted ? (
                      <Check className={`w-3 h-3 ${isSelected ? "text-emerald-400" : "text-emerald-500"}`} />
                    ) : (
                      <div className="w-3 h-3"></div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function DesignerCard({
  designer,
  badgeText,
  initials,
  avatarBg
}: {
  designer: DesignerAIState
  badgeText: string
  initials: string
  avatarBg: string
}) {
  const clDone = designer.casaLuifer.formats.filter(f => f.completed).length
  const mtDone = designer.montana.formats.filter(f => f.completed).length

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
      {/* Header del diseñador */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl ${avatarBg} text-white font-bold flex items-center justify-center text-sm shadow-sm`}>
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">{designer.name}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                {designer.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Casa Luifer + Montana · 3 CL + 2 MT por día
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-pink-50 text-pink-600 flex items-center gap-1.5 border border-pink-100">
          <Sparkles className="w-3 h-3 text-pink-500" />
          {badgeText}
        </span>
      </div>

      {/* BLOQUE CASA LUIFER */}
      <div className="bg-pink-50/40 border border-pink-100 rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center">
              CL
            </span>
            <span className="text-xs font-bold text-pink-900">Casa Luifer</span>
          </div>
          <span className="text-xs font-bold text-pink-700">
            {clDone}/{designer.casaLuifer.target} hoy
          </span>
        </div>

        {/* Badges de formatos */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {designer.casaLuifer.formats.map(f => (
            <div
              key={f.key}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition ${
                f.completed
                  ? "bg-pink-100 border-pink-200 text-pink-800 font-semibold"
                  : "bg-white/80 border-pink-100 text-pink-400"
              }`}
            >
              {f.completed ? (
                <Check className="w-3.5 h-3.5 text-pink-600" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-pink-300 inline-block"></span>
              )}
              <span>{f.label}</span>
              {f.url && (
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Ver imagen"
                  className="ml-1 text-pink-600 hover:text-pink-900"
                >
                  <Eye className="w-3 h-3 inline" />
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="w-full h-1.5 rounded-full bg-pink-100 overflow-hidden">
          <div
            className="h-full bg-pink-500 rounded-full transition-all"
            style={{ width: `${Math.min(100, (clDone / designer.casaLuifer.target) * 100)}%` }}
          ></div>
        </div>
      </div>

      {/* BLOQUE MONTANA */}
      <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
              MT
            </span>
            <span className="text-xs font-bold text-blue-900">Montana</span>
          </div>
          <span className="text-xs font-bold text-blue-700">
            {mtDone}/{designer.montana.target} {mtDone >= designer.montana.target && "✓"}
          </span>
        </div>

        {/* Badges de formatos */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {designer.montana.formats.map(f => (
            <div
              key={f.key}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition ${
                f.completed
                  ? "bg-blue-100 border-blue-200 text-blue-800 font-semibold"
                  : "bg-white/80 border-blue-100 text-blue-400"
              }`}
            >
              {f.completed ? (
                <Check className="w-3.5 h-3.5 text-blue-600" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-blue-300 inline-block"></span>
              )}
              <span>{f.label}</span>
              {f.url && (
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Ver imagen"
                  className="ml-1 text-blue-600 hover:text-blue-900"
                >
                  <Eye className="w-3 h-3 inline" />
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="w-full h-1.5 rounded-full bg-blue-100 overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${Math.min(100, (mtDone / designer.montana.target) * 100)}%` }}
          ></div>
        </div>
      </div>

      {/* FOOTER DE PROGRESO SEMANAL POR PROYECTO */}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
        <div>
          <div className="flex justify-between text-slate-500 mb-1">
            <span className="font-semibold text-pink-600">CL · semana</span>
            <span className="font-bold text-slate-700">
              {designer.casaLuifer.weekCount}/{designer.casaLuifer.weekTarget}
            </span>
          </div>
          <div className="w-full h-1 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-pink-500 rounded-full"
              style={{
                width: `${Math.min(100, (designer.casaLuifer.weekCount / designer.casaLuifer.weekTarget) * 100)}%`
              }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-slate-500 mb-1">
            <span className="font-semibold text-blue-600">MT · semana</span>
            <span className="font-bold text-slate-700">
              {designer.montana.weekCount}/{designer.montana.weekTarget}
            </span>
          </div>
          <div className="w-full h-1 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{
                width: `${Math.min(100, (designer.montana.weekCount / designer.montana.weekTarget) * 100)}%`
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}
