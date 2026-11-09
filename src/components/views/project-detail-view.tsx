"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FolderKanban,
  ListChecks,
  Plus,
  Trash2,
  User,
  Users,
} from "lucide-react";
import type { Person, Project, Task } from "@/lib/types";
import { PHASE_COLORS } from "@/lib/types";
import { CreateTaskModal } from "@/components/modals/create-task-modal";
import { ConfirmDeleteModal } from "@/components/modals/confirm-delete-modal";
import { updateTaskStatusInDb, deleteTaskFromDb, deleteProjectFromDb } from "@/lib/supabase";

interface ProjectDetailViewProps {
  project: Project;
  allPeople: Person[];
  onBack: () => void;
  onSelectPerson: (person: Person) => void;
  onProjectDeleted?: (projectId: string) => void;
}

export function ProjectDetailView({
  project,
  allPeople,
  onBack,
  onSelectPerson,
  onProjectDeleted,
}: ProjectDetailViewProps) {
  // Cristian (CEO) SIEMPRE ESTÁ EN TODOS LOS PROYECTOS
  const associatedPeople = allPeople.filter((p) => {
    if (p.isCeo || p.name.toLowerCase().includes("cristian")) return true;
    return p.projects && p.projects.includes(project.name);
  });

  // Tareas de las personas en este proyecto
  const [peopleState, setPeopleState] = useState<Person[]>(allPeople);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<Person | null>(null);

  // Estados para confirmación de eliminación con animación suave
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string; personId: string } | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [isConfirmingDeleteProject, setIsConfirmingDeleteProject] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  useEffect(() => {
    setPeopleState(allPeople);
  }, [allPeople]);

  const currentAssociated = peopleState.filter((p) => {
    if (p.isCeo || p.name.toLowerCase().includes("cristian")) return true;
    return p.projects && p.projects.includes(project.name);
  });

  // Todas las tareas de las personas de este proyecto
  const allProjectTasks = currentAssociated.flatMap((p) =>
    p.tasks.map((t) => ({ ...t, personName: p.name, personAvatar: p.avatarUrl, personId: p.id }))
  );

  const completedTasks = allProjectTasks.filter((t) => t.status === "hecho").length;
  const pendingTasks = allProjectTasks.length - completedTasks;
  const progressPct = allProjectTasks.length > 0 ? Math.round((completedTasks / allProjectTasks.length) * 100) : 0;

  const handleToggleTask = async (personId: string, task: Task) => {
    const newStatus: Task["status"] = task.status === "hecho" ? "pendiente" : "hecho";
    setPeopleState((prev) =>
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

  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeletingTask(true);
    try {
      setPeopleState((prev) =>
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
      setIsDeletingTask(false);
    }
  };

  const handleConfirmDeleteProject = async () => {
    setIsDeletingProject(true);
    try {
      await deleteProjectFromDb(project.id);
      setIsConfirmingDeleteProject(false);
      onProjectDeleted?.(project.id);
      onBack();
    } catch (err) {
      console.error("Error deleting project:", err);
    } finally {
      setIsDeletingProject(false);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-bg p-8">
      <div className="max-w-[1100px] mx-auto flex flex-col gap-6">
        {/* Barra superior de volver */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[13px] font-medium text-text-tertiary hover:text-text-primary transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a proyectos</span>
          </button>

          <button
            onClick={() => setIsConfirmingDeleteProject(true)}
            className="h-8 px-3 rounded-lg border border-[var(--border)] text-[12px] font-semibold text-[var(--accent-red,#ef4444)] hover:bg-red-50 hover:border-red-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar proyecto</span>
          </button>
        </div>

        {/* Hero Card del Proyecto */}
        <div className="rounded-2xl bg-surface border border-[var(--border)] p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-[30px] shrink-0 shadow-xs"
              style={{
                background: `${project.color}15`,
                border: `1.5px solid ${project.color}35`,
              }}
            >
              {project.emoji || "📁"}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-[22px] font-bold text-text-primary">{project.name}</h1>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{
                    background: `${project.color}15`,
                    color: project.color,
                  }}
                >
                  Activo
                </span>
              </div>
              <p className="text-[13px] text-text-secondary max-w-[550px] leading-relaxed">
                {project.description || "Proyecto estratégico en curso dentro de Cart."}
              </p>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="flex items-center gap-5 border-t md:border-t-0 md:border-l border-[var(--border)] pt-4 md:pt-0 md:pl-6">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-text-tertiary">Equipo</span>
              <span className="text-[20px] font-bold text-text-primary">{currentAssociated.length}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-text-tertiary">Progreso</span>
              <span className="text-[20px] font-bold text-text-primary">{progressPct}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-text-tertiary">Tareas</span>
              <span className="text-[20px] font-bold text-text-primary">{allProjectTasks.length}</span>
            </div>
          </div>
        </div>

        {/* Sección: Personas asignadas */}
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-text-secondary" />
              <h2 className="text-[15px] font-bold text-text-primary">
                Personas en este proyecto ({currentAssociated.length})
              </h2>
            </div>
            <span className="text-[12px] text-text-tertiary">Cristian siempre lidera todos los proyectos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentAssociated.map((person) => {
              const phase = PHASE_COLORS[person.phase];
              const pTasks = person.tasks.filter((t) => t.status !== "hecho").length;

              return (
                <motion.div
                  key={person.id}
                  whileHover={{ y: -3 }}
                  onClick={() => onSelectPerson(person)}
                  className="rounded-xl bg-surface border border-[var(--border)] p-4 flex items-center gap-3.5 cursor-pointer shadow-2xs hover:shadow-sm hover:border-accent/40 transition group"
                >
                  <div
                    className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-bold text-[14px] shrink-0"
                    style={{
                      background: phase?.soft || "var(--accent-soft)",
                      border: `2px solid ${phase?.color || "var(--accent)"}`,
                      color: phase?.color || "var(--accent)",
                    }}
                  >
                    {person.avatarUrl ? (
                      <img src={person.avatarUrl} alt={person.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{person.initials}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-[13px] font-bold text-text-primary truncate">{person.name}</h4>
                      {person.isCeo && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent-soft text-accent">
                          CEO
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-tertiary truncate">{person.role}</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-text-tertiary">
                      <span>{pTasks} tareas pend.</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Sección: Tareas del proyecto */}
        <div className="flex flex-col gap-3.5 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-text-secondary" />
              <h2 className="text-[15px] font-bold text-text-primary">
                Tareas vinculadas ({allProjectTasks.length})
              </h2>
            </div>
            {currentAssociated.length > 0 && (
              <button
                onClick={() => {
                  setSelectedAssignee(currentAssociated[0]);
                  setIsTaskModalOpen(true);
                }}
                className="h-8 px-3 rounded-lg bg-surface border border-border text-[12px] font-semibold text-text-primary flex items-center gap-1.5 hover:bg-surface-2 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Asignar tarea en este proyecto
              </button>
            )}
          </div>

          {allProjectTasks.length === 0 ? (
            <div className="py-12 rounded-xl bg-surface border border-[var(--border)] flex flex-col items-center justify-center text-center">
              <p className="text-[13px] text-text-secondary">No hay tareas pendientes en este proyecto.</p>
              <p className="text-[11px] text-text-tertiary mt-1">
                Asigna tareas a los miembros del equipo para verlas aquí.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {allProjectTasks.map((t) => {
                const isDone = t.status === "hecho";
                return (
                  <div
                    key={t.id}
                    className="rounded-xl bg-surface border border-[var(--border)] px-4 py-3 flex items-center justify-between gap-4 shadow-2xs hover:bg-surface-2/40 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleTask(t.personId, t as any)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition cursor-pointer ${isDone
                            ? "bg-accent-green text-white border-accent-green"
                            : "border-[var(--border-strong)] bg-surface hover:border-accent"
                          }`}
                      >
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <span
                        className={`text-[13px] ${isDone ? "line-through text-text-tertiary" : "text-text-primary font-medium"
                          }`}
                      >
                        {t.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-2 text-[11px] text-text-secondary">
                        <User className="w-3 h-3 text-text-tertiary" />
                        <span>{t.personName}</span>
                      </div>
                      {t.due && (
                        <div className="flex items-center gap-1 text-[11px] text-text-tertiary">
                          <Clock className="w-3 h-3" />
                          <span>{t.due}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setTaskToDelete({ id: t.id, title: t.title, personId: t.personId })}
                        title="Eliminar tarea"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:text-[var(--accent-red,#ef4444)] hover:bg-surface-2 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear tarea si se abre desde aquí */}
      {selectedAssignee && (
        <CreateTaskModal
          isOpen={isTaskModalOpen}
          personId={selectedAssignee.id}
          personName={selectedAssignee.name}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedAssignee(null);
          }}
          onTaskCreated={(newTask) => {
            setPeopleState((prev) =>
              prev.map((p) => (p.id === selectedAssignee.id ? { ...p, tasks: [...p.tasks, newTask] } : p))
            );
            setIsTaskModalOpen(false);
            setSelectedAssignee(null);
          }}
        />
      )}

      {/* Modal de confirmación para eliminar tarea con animación suave */}
      <ConfirmDeleteModal
        isOpen={Boolean(taskToDelete)}
        name={taskToDelete?.title || ""}
        type="task"
        isLoading={isDeletingTask}
        onConfirm={handleConfirmDeleteTask}
        onCancel={() => setTaskToDelete(null)}
      />

      {/* Modal de confirmación para eliminar proyecto con animación suave */}
      <ConfirmDeleteModal
        isOpen={isConfirmingDeleteProject}
        name={project.name}
        type="project"
        isLoading={isDeletingProject}
        onConfirm={handleConfirmDeleteProject}
        onCancel={() => setIsConfirmingDeleteProject(false)}
      />
    </div>
  );
}
