"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Calendar,
  Check,
  ChevronDown,
  ListChecks,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { deleteTaskFromDb, getPeople, updateTaskStatusInDb } from "@/lib/supabase";
import type { Person, Task } from "@/lib/types";
import { CreateTaskModal } from "@/components/modals/create-task-modal";
import { ConfirmDeleteModal } from "@/components/modals/confirm-delete-modal";

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: "Pendiente", color: "var(--text-tertiary)", bg: "var(--surface-2)" },
  en_progreso: { label: "En progreso", color: "var(--accent-blue)", bg: "var(--accent-blue-soft)" },
  revision: { label: "Para revisar", color: "var(--accent-orange)", bg: "var(--accent-orange-soft)" },
  hecho: { label: "Hecho", color: "var(--accent-green)", bg: "var(--accent-green-soft)" },
};

export function AllTasksView({ onSelectPerson }: { onSelectPerson?: (person: Person) => void }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modales
  const [taskTargetPerson, setTaskTargetPerson] = useState<Person | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string; personId: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    const res = await getPeople();
    setPeople(res);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleTask = async (personId: string, task: Task) => {
    const newStatus: Task["status"] = task.status === "hecho" ? "pendiente" : "hecho";
    setPeople((prev) =>
      prev.map((p) => {
        if (p.id !== personId) return p;
        return {
          ...p,
          tasks: p.tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)),
        };
      })
    );
    await updateTaskStatusInDb(task.id, newStatus);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      setPeople((prev) =>
        prev.map((p) => {
          if (p.id !== taskToDelete.personId) return p;
          return {
            ...p,
            tasks: p.tasks.filter((t) => t.id !== taskToDelete.id),
          };
        })
      );
      await deleteTaskFromDb(taskToDelete.id);
      setTaskToDelete(null);
    } catch (err) {
      console.error("Error deleting task:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalTasks = people.reduce((acc, p) => acc + p.tasks.length, 0);
  const pendingTasksTotal = people.reduce(
    (acc, p) => acc + p.tasks.filter((t) => t.status !== "hecho").length,
    0
  );

  return (
    <div className="flex-1 h-full overflow-y-auto bg-bg p-8">
      <div className="max-w-[1080px] mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface border border-[var(--border)] flex items-center justify-center text-text-primary shadow-xs">
              <ListChecks className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-text-primary tracking-tight">
                Tareas Asignadas
              </h1>
              <p className="text-[12px] text-text-tertiary">
                {pendingTasksTotal} pendientes · {totalTasks} tareas en total organizadas por colaborador
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-[13px] text-text-tertiary">
            Cargando tareas desde Supabase...
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {people.map((person) => {
              const pendingCount = person.tasks.filter((t) => t.status !== "hecho").length;

              return (
                <div
                  key={person.id}
                  className="rounded-2xl bg-surface border border-[var(--border)] p-6 flex flex-col gap-4 shadow-xs"
                >
                  {/* Persona Header */}
                  <div className="flex items-center justify-between">
                    <div
                      onClick={() => onSelectPerson?.(person)}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="relative w-11 h-11 rounded-full bg-surface-2 border border-[var(--border-strong)] flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                        {person.avatarUrl ? (
                          <img
                            src={person.avatarUrl}
                            alt={person.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-bold text-[14px] text-text-primary">
                            {person.initials}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-bold text-text-primary group-hover:text-text-secondary transition">
                            {person.name}
                          </span>
                          <span className="text-[11px] font-semibold text-text-tertiary px-2 py-0.5 rounded-md bg-surface-2">
                            {person.role}
                          </span>
                        </div>
                        <span className="text-[12px] text-text-tertiary">
                          {pendingCount} pendientes de {person.tasks.length} asignadas
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setTaskTargetPerson(person)}
                      className="h-8 px-3 rounded-lg bg-surface border border-[var(--border)] text-[12px] font-semibold text-text-primary hover:bg-surface-2 transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Asignar tarea
                    </button>
                  </div>

                  {/* Tasks List */}
                  {person.tasks.length === 0 ? (
                    <div className="py-4 text-center rounded-xl bg-surface-2/50 text-[12px] text-text-tertiary">
                      Sin tareas asignadas actualmente.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {person.tasks.map((task) => {
                        const isDone = task.status === "hecho";
                        const s = STATUS_STYLES[task.status];

                        return (
                          <div
                            key={task.id}
                            className={`group h-14 rounded-xl flex items-center px-4 gap-3 border transition ${
                              isDone
                                ? "bg-surface-2/40 border-transparent opacity-75"
                                : "bg-surface-2 border-transparent hover:border-[var(--border)]"
                            }`}
                          >
                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={() => handleToggleTask(person.id, task)}
                              className={`w-[18px] h-[18px] rounded-[5px] border shrink-0 flex items-center justify-center transition cursor-pointer ${
                                isDone
                                  ? "bg-[var(--accent-green)] border-[var(--accent-green)] text-white"
                                  : "bg-surface border-[var(--border-strong)] hover:border-[var(--accent)]"
                              }`}
                            >
                              {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div
                                className={`text-[13px] font-semibold truncate ${
                                  isDone
                                    ? "line-through text-text-tertiary"
                                    : "text-text-primary"
                                }`}
                              >
                                {task.title}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Calendar className="w-2.5 h-2.5 text-text-tertiary" />
                                <span className="text-[10px] font-medium text-text-tertiary">
                                  {task.due ?? "Sin vencimiento"}
                                </span>
                              </div>
                            </div>

                            <span
                              className="h-6 rounded-md px-2.5 text-[11px] font-semibold flex items-center shrink-0"
                              style={{ color: s.color, background: s.bg }}
                            >
                              {s.label}
                            </span>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() =>
                                setTaskToDelete({
                                  id: task.id,
                                  title: task.title,
                                  personId: person.id,
                                })
                              }
                              title="Eliminar tarea"
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:text-[var(--accent-red)] hover:bg-surface transition opacity-0 group-hover:opacity-100 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para crear tarea a la persona elegida */}
      {taskTargetPerson && (
        <CreateTaskModal
          isOpen={Boolean(taskTargetPerson)}
          personId={taskTargetPerson.id}
          personName={taskTargetPerson.name}
          onClose={() => setTaskTargetPerson(null)}
          onTaskCreated={(newTask) => {
            setPeople((prev) =>
              prev.map((p) => {
                if (p.id !== taskTargetPerson.id) return p;
                return { ...p, tasks: [newTask, ...p.tasks] };
              })
            );
            setTaskTargetPerson(null);
          }}
        />
      )}

      {/* Modal de confirmación para eliminar */}
      <ConfirmDeleteModal
        isOpen={Boolean(taskToDelete)}
        name={taskToDelete?.title ?? ""}
        type="task"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
}

