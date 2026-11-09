"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Brain,
  Calendar,
  ChevronRight,
  GitBranch,
  Heart,
  IdCard,
  ListChecks,
  Mail,
  MapPin,
  Minus,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Sparkles,
  Star,
  Tag,
  Trash2,
  TrendingUp,
} from "lucide-react";

import { deleteTaskFromDb, getPeople, updateTaskStatusInDb } from "@/lib/supabase";
import { PHASE_COLORS, type Person, type Task } from "@/lib/types";
import { CreateTaskModal } from "@/components/modals/create-task-modal";
import { ConfirmDeleteModal } from "@/components/modals/confirm-delete-modal";
import { EditPersonModal } from "@/components/modals/edit-person-modal";

interface FullProfileViewProps {
  person: Person;
  onBack: () => void;
  onPersonUpdated: (updated: Person) => void;
}

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: "Pendiente", color: "var(--text-tertiary)", bg: "var(--surface-2)" },
  en_progreso: { label: "En progreso", color: "var(--accent-blue)", bg: "var(--accent-blue-soft)" },
  revision: { label: "Para revisar", color: "var(--accent-orange)", bg: "var(--accent-orange-soft)" },
  hecho: { label: "Hecho", color: "var(--accent-green)", bg: "var(--accent-green-soft)" },
};

export function FullProfileView({ person, onBack, onPersonUpdated }: FullProfileViewProps) {
  const [currentPerson, setCurrentPerson] = useState<Person>(person);
  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  useEffect(() => {
    setCurrentPerson(person);
    getPeople().then((res) => setAllPeople(res));
  }, [person]);

  const phase = PHASE_COLORS[currentPerson.phase];
  const subordinates = allPeople.filter((t) => t.reportsTo === currentPerson.id);
  const manager = currentPerson.reportsTo
    ? allPeople.find((p) => p.id === currentPerson.reportsTo) ?? null
    : null;
  const pendingCount = currentPerson.tasks.filter((t) => t.status !== "hecho").length;

  const handleToggleTask = async (task: Task) => {
    const newStatus: Task["status"] = task.status === "hecho" ? "pendiente" : "hecho";
    const updatedTasks = currentPerson.tasks.map((t) =>
      t.id === task.id ? { ...t, status: newStatus } : t
    );
    const updated = { ...currentPerson, tasks: updatedTasks };
    setCurrentPerson(updated);
    onPersonUpdated(updated);
    await updateTaskStatusInDb(task.id, newStatus);
  };

  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeletingTask(true);
    try {
      const updatedTasks = currentPerson.tasks.filter((t) => t.id !== taskToDelete.id);
      const updated = { ...currentPerson, tasks: updatedTasks };
      setCurrentPerson(updated);
      onPersonUpdated(updated);
      await deleteTaskFromDb(taskToDelete.id);
      setTaskToDelete(null);
    } catch (err) {
      console.error("Error al eliminar tarea:", err);
    } finally {
      setIsDeletingTask(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bg overflow-hidden">
      {/* Header superior */}
      <header className="h-[72px] shrink-0 bg-surface border-b border-[var(--border)] flex items-center px-7 gap-5">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-[10px] bg-surface-2 flex items-center justify-center text-text-primary hover:bg-[var(--border)] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="text-[13px] font-medium text-text-tertiary hover:text-text-primary transition"
          >
            Organigrama
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />
          <span className="text-[15px] font-semibold text-text-primary">
            {currentPerson.name}
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="h-9 rounded-[10px] bg-surface border border-[var(--border)] flex items-center gap-1.5 px-3.5 text-[13px] font-semibold text-text-primary hover:bg-surface-2 transition cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </button>
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="h-9 rounded-[10px] bg-text-primary flex items-center gap-1.5 px-3.5 text-[13px] font-semibold text-white hover:opacity-90 transition active:scale-95 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Asignar tarea
          </button>
        </div>
      </header>

      {/* Body del perfil exactamente como en la imagen 2 */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        <div className="flex gap-5 max-w-[1400px] mx-auto">
          {/* Columna Izquierda */}
          <aside className="w-[320px] shrink-0 flex flex-col gap-4">
            {/* Card Principal */}
            <div className="rounded-2xl bg-surface border border-[var(--border)] p-5 flex flex-col gap-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 rounded-lg bg-surface-2 flex items-center justify-center">
                  <Star className="w-3 h-3 text-[var(--accent-orange)]" />
                </div>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-6 h-6 rounded-lg bg-surface-2 flex items-center justify-center text-text-secondary hover:bg-[var(--border)] transition cursor-pointer"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>

              <div
                className="w-[120px] h-[120px] rounded-full mx-auto flex items-center justify-center overflow-hidden"
                style={{
                  background: phase.soft,
                  border: `3px solid ${phase.color}`,
                }}
              >
                {currentPerson.avatarUrl ? (
                  <img
                    src={currentPerson.avatarUrl}
                    alt={currentPerson.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-[36px]" style={{ color: phase.color }}>
                    {currentPerson.initials}
                  </span>
                )}
              </div>

              <div className="flex flex-col items-center gap-1 mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[20px] font-bold text-text-primary">
                    {currentPerson.name}
                  </span>
                  <BadgeCheck className="w-4 h-4 text-accent" />
                </div>
                <span className="text-[13px] font-medium text-text-tertiary">
                  {currentPerson.role} · {currentPerson.age} años
                </span>
              </div>

              <div className="flex justify-center gap-1.5">
                <span
                  className="h-6 rounded-md px-2.5 text-[11px] font-semibold flex items-center"
                  style={{ color: phase.color, background: phase.soft }}
                >
                  {phase.label}
                </span>
                <span className="h-6 rounded-md px-2.5 text-[11px] font-semibold flex items-center text-[var(--accent-green)] bg-[var(--accent-green-soft)]">
                  Activo
                </span>
              </div>

              <div className="flex gap-2 mt-2">
                <div className="flex-1 h-16 rounded-xl bg-surface-2 flex flex-col items-center justify-center gap-0.5">
                  <span className="text-[18px] font-bold text-[var(--accent-red)]">
                    {pendingCount}
                  </span>
                  <span className="text-[10px] font-semibold text-text-tertiary">Tareas</span>
                </div>
                <div className="flex-1 h-16 rounded-xl bg-surface-2 flex flex-col items-center justify-center gap-0.5">
                  <span className="text-[18px] font-bold text-accent">2</span>
                  <span className="text-[10px] font-semibold text-text-tertiary">Proyectos</span>
                </div>
                <div className="flex-1 h-16 rounded-xl bg-surface-2 flex flex-col items-center justify-center gap-0.5">
                  <span className="text-[18px] font-bold text-text-primary">138</span>
                  <span className="text-[10px] font-semibold text-text-tertiary">Días activo</span>
                </div>
              </div>
            </div>

            {/* Datos de contacto */}
            <div className="rounded-2xl bg-surface border border-[var(--border)] p-5 flex flex-col gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <IdCard className="w-3.5 h-3.5 text-accent" />
                <span className="text-[10px] font-bold text-text-tertiary tracking-widest">
                  DATOS DE CONTACTO
                </span>
              </div>
              {[
                { Icon: Mail, text: `${currentPerson.id.replace("p-", "")}@cart.co` },
                { Icon: Phone, text: "+57 310 555 8812" },
                { Icon: MapPin, text: "Medellín, Colombia" },
                { Icon: Calendar, text: "Ingresó: 23 jun 2026" },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 text-text-tertiary" />
                  <span className="text-[12px] font-medium text-text-primary truncate">
                    {text}
                  </span>
                </div>
              ))}
            </div>

            {/* Vínculos en la red */}
            <div className="rounded-2xl bg-surface border border-[var(--border)] p-5 flex flex-col gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-accent" />
                <span className="text-[10px] font-bold text-text-tertiary tracking-widest">
                  VÍNCULOS EN LA RED
                </span>
              </div>

              {manager && (
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-[12px] font-bold text-white">
                      {manager.initials}
                    </span>
                  </div>
                  <div className="flex-1 leading-tight">
                    <div className="text-[10px] font-semibold text-text-tertiary">Reporta a</div>
                    <div className="text-[13px] font-semibold text-text-primary">
                      {manager.name}
                    </div>
                  </div>
                </div>
              )}

              {subordinates.length > 0 && (
                <div className="flex flex-col gap-2 mt-1">
                  <div className="text-[11px] font-semibold text-text-tertiary">
                    Reportan a {currentPerson.name.split(" ")[0]} ({subordinates.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {subordinates.map((s) => {
                      const ph = PHASE_COLORS[s.phase];
                      return (
                        <div
                          key={s.id}
                          className="h-[30px] rounded-full bg-surface-2 border border-[var(--border)] flex items-center gap-1.5 px-2.5 pr-3"
                        >
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: ph.color }}
                          >
                            <span className="text-[9px] font-bold text-white">
                              {s.initials}
                            </span>
                          </span>
                          <span className="text-[11px] font-semibold text-text-primary">
                            {s.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Columna Derecha */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {/* Perfil personal + Potencial */}
            <div className="flex gap-4">
              <div className="flex-1 rounded-2xl bg-surface border border-[var(--border)] p-5 flex flex-col gap-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5 text-[var(--accent-pink)]" />
                  <span className="text-[10px] font-bold text-text-tertiary tracking-widest">
                    PERFIL PERSONAL
                  </span>
                </div>
                <div className="flex gap-2.5">
                  <div className="flex-1 h-[72px] rounded-xl bg-surface-2 p-3 flex flex-col gap-1 justify-center">
                    <span className="text-[10px] font-semibold text-text-tertiary">
                      Personalidad
                    </span>
                    <span className="text-[14px] font-bold text-text-primary">
                      {currentPerson.personality}
                    </span>
                  </div>
                  <div className="flex-1 h-[72px] rounded-xl bg-surface-2 p-3 flex flex-col gap-1 justify-center">
                    <span className="text-[10px] font-semibold text-text-tertiary">
                      Emocionalidad
                    </span>
                    <span className="text-[14px] font-bold text-text-primary">
                      {currentPerson.emotionality}
                    </span>
                  </div>
                  <div className="flex-1 h-[72px] rounded-xl bg-surface-2 p-3 flex flex-col gap-1 justify-center">
                    <span className="text-[10px] font-semibold text-text-tertiary">
                      Fase
                    </span>
                    <span className="text-[14px] font-bold" style={{ color: phase.color }}>
                      {phase.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-[260px] shrink-0 rounded-2xl bg-surface border border-[var(--border)] p-5 flex flex-col gap-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[10px] font-bold text-text-tertiary tracking-widest">
                    POTENCIAL
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-gray-100"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        strokeDasharray={`${currentPerson.potential.score}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke={phase.color}
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[22px] font-bold text-text-primary leading-none">
                      {currentPerson.potential.score}%
                    </span>
                    <span className="text-[11px] font-medium text-text-tertiary leading-tight">
                      {currentPerson.potential.note}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ventajas e Incomodidades */}
            <div className="flex gap-4">
              <div className="flex-1 rounded-2xl bg-surface border border-[var(--border)] p-5 flex flex-col gap-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                  <span className="text-[10px] font-bold text-text-tertiary tracking-widest">
                    VENTAJAS
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {currentPerson.advantages.map((adv, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[12px] text-text-primary">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] mt-1.5 shrink-0" />
                      <span>{adv}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 rounded-2xl bg-surface border border-[var(--border)] p-5 flex flex-col gap-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <Minus className="w-3.5 h-3.5 text-[var(--accent-pink)]" />
                  <span className="text-[10px] font-bold text-text-tertiary tracking-widest">
                    INCOMODIDADES
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {currentPerson.discomforts.map((disc, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[12px] text-text-primary">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-pink)] mt-1.5 shrink-0" />
                      <span>{disc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Funciones · Intereses */}
            <div className="rounded-2xl bg-surface border border-[var(--border)] p-5 flex flex-col gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-[var(--accent-orange)]" />
                <span className="text-[10px] font-bold text-text-tertiary tracking-widest">
                  FUNCIONES · INTERESES
                </span>
              </div>
              <div className="flex gap-6">
                <div className="flex-1 flex flex-col gap-2">
                  <span className="text-[11px] font-semibold text-text-secondary">Funciones</span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentPerson.functions.map((f) => (
                      <span
                        key={f}
                        className="h-[26px] rounded-md px-2.5 flex items-center text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-200"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <span className="text-[11px] font-semibold text-text-secondary">
                    Intereses personales
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentPerson.interests.map((i) => (
                      <span
                        key={i}
                        className="h-[26px] rounded-md px-2.5 flex items-center text-[11px] font-semibold bg-pink-50 text-pink-600 border border-pink-200"
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tareas que le asigné */}
            <div className="rounded-2xl bg-surface border border-[var(--border)] p-5 flex flex-col gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <ListChecks className="w-3.5 h-3.5 text-[var(--accent-red)]" />
                <span className="text-[10px] font-bold text-text-tertiary tracking-widest">
                  TAREAS QUE LE ASIGNÉ · PROYECTO CART
                </span>
                <span className="h-5 px-2 rounded-full bg-[var(--accent-red)] text-white text-[10px] font-bold flex items-center">
                  {pendingCount}
                </span>
                <div className="flex-1" />
                <button
                  onClick={() => setIsTaskModalOpen(true)}
                  className="h-[28px] px-3 rounded-lg bg-text-primary text-white text-[11px] font-semibold flex items-center gap-1.5 hover:opacity-90 transition active:scale-95 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3 h-3" />
                  Nueva tarea
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {currentPerson.tasks.length === 0 && (
                  <div className="text-[12px] text-text-tertiary py-6 text-center">
                    Sin tareas asignadas.
                  </div>
                )}
                {currentPerson.tasks.map((t) => {
                  const s = STATUS_STYLES[t.status];
                  const isDone = t.status === "hecho";
                  return (
                    <div
                      key={t.id}
                      className="group h-14 rounded-xl bg-surface-2 flex items-center px-4 gap-3 border border-transparent hover:border-[var(--border)] transition"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleTask(t)}
                        className={`w-[18px] h-[18px] rounded-[5px] border shrink-0 flex items-center justify-center transition cursor-pointer ${
                          isDone
                            ? "bg-[var(--accent-green)] border-[var(--accent-green)] text-white"
                            : "bg-surface border-[var(--border-strong)] hover:border-accent"
                        }`}
                      >
                        {isDone && <span className="text-[11px] font-bold leading-none">✓</span>}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-[13px] font-semibold text-text-primary truncate ${
                            isDone ? "line-through text-text-tertiary" : ""
                          }`}
                        >
                          {t.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-2.5 h-2.5 text-text-tertiary" />
                          <span className="text-[10px] font-medium text-text-tertiary">
                            {t.due ?? "Sin vencimiento"}
                          </span>
                        </div>
                      </div>

                      <span
                        className="h-6 rounded-md px-2.5 text-[11px] font-semibold flex items-center shrink-0"
                        style={{ color: s.color, background: s.bg }}
                      >
                        {s.label}
                      </span>

                      <button
                        type="button"
                        onClick={() => setTaskToDelete({ id: t.id, title: t.title })}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:text-[var(--accent-red)] hover:bg-surface transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <EditPersonModal
        isOpen={isEditModalOpen}
        person={currentPerson}
        onClose={() => setIsEditModalOpen(false)}
        onPersonUpdated={(updates) => {
          const updated = { ...currentPerson, ...updates };
          setCurrentPerson(updated);
          onPersonUpdated(updated);
        }}
      />

      <CreateTaskModal
        isOpen={isTaskModalOpen}
        personId={currentPerson.id}
        personName={currentPerson.name}
        onClose={() => setIsTaskModalOpen(false)}
        onTaskCreated={(newTask) => {
          const updated = { ...currentPerson, tasks: [newTask, ...currentPerson.tasks] };
          setCurrentPerson(updated);
          onPersonUpdated(updated);
        }}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(taskToDelete)}
        name={taskToDelete?.title ?? ""}
        type="task"
        isLoading={isDeletingTask}
        onConfirm={handleConfirmDeleteTask}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
}

