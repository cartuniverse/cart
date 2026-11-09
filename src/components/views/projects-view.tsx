"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  FolderKanban,
  ListChecks,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { deleteProjectFromDb, getPeople, getProjects } from "@/lib/supabase";
import type { Person, Project } from "@/lib/types";
import { CreateProjectModal } from "@/components/modals/create-project-modal";

interface ProjectsViewProps {
  onSelectProject: (project: Project) => void;
}

export function ProjectsView({ onSelectProject }: ProjectsViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const [pjs, ppl] = await Promise.all([getProjects(), getPeople()]);
    setProjects(pjs);
    setPeople(ppl);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProjectCreated = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!confirm("¿Deseas eliminar este proyecto?")) return;
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    await deleteProjectFromDb(projectId);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-bg p-8">
      <div className="max-w-[1240px] mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-[18px] font-bold text-text-primary">
                Proyectos ({projects.length})
              </h1>
              <p className="text-[12px] text-text-tertiary">
                Gestiona iniciativas, equipos vinculados y entregables
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-9 px-4 rounded-xl bg-text-primary text-white text-[13px] font-semibold flex items-center gap-2 hover:opacity-90 active:scale-95 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Crear proyecto
          </button>
        </div>

        {/* Tarjetas de Proyectos */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-[13px] text-text-tertiary">
            Cargando proyectos...
          </div>
        ) : projects.length === 0 ? (
          <div className="py-20 rounded-2xl bg-surface border border-[var(--border)] flex flex-col items-center justify-center text-center">
            <FolderKanban className="w-10 h-10 text-text-tertiary mb-3 opacity-40" />
            <h3 className="text-[15px] font-bold text-text-primary">No hay proyectos todavía</h3>
            <p className="text-[12px] text-text-tertiary mt-1 max-w-[320px]">
              Crea tu primer proyecto para organizar las tareas y los colaboradores de tu equipo.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 h-9 px-4 rounded-xl bg-text-primary text-white text-[12px] font-semibold flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Crear proyecto ahora
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {projects.map((project) => {
              // Personas en este proyecto (Cristian siempre incluido)
              const teamMembers = people.filter((p) => {
                if (p.isCeo || p.name.toLowerCase().includes("cristian")) return true;
                return p.projects && p.projects.includes(project.name);
              });

              // Tareas totales
              const allTasks = teamMembers.flatMap((p) => p.tasks);
              const pendingCount = allTasks.filter((t) => t.status !== "hecho").length;

              return (
                <motion.div
                  key={project.id}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  onClick={() => onSelectProject(project)}
                  className="rounded-2xl bg-surface border border-[var(--border)] p-6 flex flex-col justify-between gap-5 cursor-pointer shadow-2xs hover:shadow-md hover:border-accent/40 transition group relative"
                >
                  {/* Top: Icon + Name + Delete button */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-[22px] shrink-0 shadow-2xs transition-transform group-hover:scale-105"
                        style={{
                          background: `${project.color}15`,
                          border: `1.5px solid ${project.color}35`,
                        }}
                      >
                        {project.emoji || "📁"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[16px] font-bold text-text-primary group-hover:text-accent transition truncate">
                          {project.name}
                        </h3>
                        <span
                          className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{
                            background: `${project.color}15`,
                            color: project.color,
                          }}
                        >
                          En curso
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteProject(e, project.id)}
                      title="Eliminar proyecto"
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:text-accent-red hover:bg-surface-2 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Descripción */}
                  <p className="text-[12px] text-text-secondary line-clamp-2 leading-relaxed">
                    {project.description || "Iniciativa clave desarrollada por el equipo de Cart."}
                  </p>

                  {/* Bottom: Team Avatars + Task count */}
                  <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center -space-x-2">
                      {teamMembers.slice(0, 4).map((member) => (
                        <div
                          key={member.id}
                          title={member.name}
                          className="w-7 h-7 rounded-full border-2 border-surface bg-surface-2 overflow-hidden flex items-center justify-center text-[10px] font-bold text-text-secondary"
                        >
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            member.initials
                          )}
                        </div>
                      ))}
                      {teamMembers.length > 4 && (
                        <div className="w-7 h-7 rounded-full border-2 border-surface bg-surface-2 flex items-center justify-center text-[10px] font-bold text-text-tertiary">
                          +{teamMembers.length - 4}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-tertiary group-hover:text-text-primary transition">
                      <span>{pendingCount} tareas</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para crear nuevo proyecto */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}
