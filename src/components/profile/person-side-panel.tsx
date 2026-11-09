"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import {
  ArrowRight,
  BadgeCheck,
  Brain,
  Briefcase,
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
  Phone,
  Plus,
  Sparkles,
  Star,
  Tag,
  Trash2,
  TrendingUp,
  X,
  Check,
  ChevronDown,
} from "lucide-react";

import { deleteTaskFromDb, getPeople, updateTaskStatusInDb } from "@/lib/supabase";
import { PHASE_COLORS, type Person, type Task } from "@/lib/types";
import { usePersonPanel } from "./person-panel-context";
import { CreateTaskModal } from "@/components/modals/create-task-modal";
import { ConfirmDeleteModal } from "@/components/modals/confirm-delete-modal";
import { EditPersonModal } from "@/components/modals/edit-person-modal";

/* ------------------------------------------------------------------ */
/*  Status style map                                                    */
/* ------------------------------------------------------------------ */
const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  pendiente:  { label: "Pendiente",    color: "var(--text-tertiary)",    bg: "var(--surface-2)" },
  en_progreso:{ label: "En progreso",  color: "var(--accent-blue)",      bg: "var(--accent-blue-soft)" },
  revision:   { label: "Para revisar", color: "var(--accent-orange)",    bg: "var(--accent-orange-soft)" },
  hecho:      { label: "Hecho",        color: "var(--accent-green)",     bg: "var(--accent-green-soft)" },
};

/* ------------------------------------------------------------------ */
/*  Stagger children helper                                             */
/* ------------------------------------------------------------------ */
const STAGGER_CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055 } },
};

const CARD_ITEM: Variants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { type: "spring", stiffness: 340, damping: 28 } },
};

/* ------------------------------------------------------------------ */
/*  Main panel                                                          */
/* ------------------------------------------------------------------ */
export function PersonSidePanel() {
  const { person, close } = usePersonPanel();

  return (
    <AnimatePresence>
      {person && <PanelContent person={person} onClose={close} />}
    </AnimatePresence>
  );
}

function PanelContent({ person, onClose }: { person: Person; onClose: () => void }) {
  const { updatePerson } = usePersonPanel();
  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    getPeople().then((res) => setAllPeople(res));
  }, []);

  const phase = PHASE_COLORS[person.phase];
  const subordinates = allPeople.filter((t) => t.reportsTo === person.id);
  const manager = person.reportsTo
    ? allPeople.find((p) => p.id === person.reportsTo) ?? null
    : null;
  const pendingCount = person.tasks.filter((t) => t.status !== "hecho").length;

  return (
    <>
      {/* ─── Backdrop ─────────────────────────────────────────── */}
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0)" }}
        initial={{ background: "rgba(0,0,0,0)" }}
        animate={{ background: "rgba(0,0,0,0.22)" }}
        exit={{ background: "rgba(0,0,0,0)" }}
        transition={{ duration: 0.28, ease: "easeInOut" }}
        onClick={onClose}
      />

      {/* ─── Slide-in panel ───────────────────────────────────── */}
      <motion.aside
        key="panel"
        className="fixed top-0 right-0 z-50 h-full flex flex-col overflow-hidden"
        style={{
          width: 620,
          background: "var(--bg)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.08)",
        }}
        initial={{ x: "100%", opacity: 0.6 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0.6 }}
        transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.9 }}
      >
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.22, ease: "easeOut" }}
          className="h-[64px] shrink-0 flex items-center justify-between px-6 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2 text-[13px] text-text-tertiary font-medium">
            <span>Organigrama</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-text-primary font-semibold text-[14px]">{person.name}</span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[10px] flex items-center justify-center transition-colors"
            style={{ background: "var(--surface-2)" }}
            aria-label="Cerrar panel"
          >
            <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </motion.div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <motion.div
            className="flex flex-col gap-4 p-6"
            variants={STAGGER_CONTAINER}
            initial="hidden"
            animate="show"
          >
            {/* Profile hero card */}
            <motion.div variants={CARD_ITEM}>
              <PanelCard>
                <div className="flex items-center justify-between mb-1">
                  <IconBtn><Star className="w-3 h-3" style={{ color: "var(--accent-orange)" }} /></IconBtn>
                  <IconBtn onClick={() => setIsEditModalOpen(true)} title="Modificar información">
                    <MoreHorizontal className="w-3.5 h-3.5 text-text-secondary" />
                  </IconBtn>
                </div>

                <div className="flex flex-col items-center gap-3">
                  {/* Avatar */}
                  <div
                    className="w-[100px] h-[100px] rounded-full flex items-center justify-center overflow-hidden"
                    style={{ background: phase.soft, border: `3px solid ${phase.color}` }}
                  >
                    {person.avatarUrl ? (
                      <img
                        src={person.avatarUrl}
                        alt={person.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-bold text-[32px]" style={{ color: phase.color }}>
                        {person.initials}
                      </span>
                    )}
                  </div>

                  {/* Name + badge */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[20px] font-bold text-text-primary">{person.name}</span>
                      <BadgeCheck className="w-4 h-4 text-accent" />
                    </div>
                    <span className="text-[13px] font-medium text-text-tertiary">
                      {person.role} · {person.age} años
                    </span>
                  </div>

                  {/* Chips */}
                  <div className="flex gap-1.5">
                    <Chip label={phase.label} color={phase.color} bg={phase.soft} />
                    <Chip label="Activo" color="var(--accent-green)" bg="var(--accent-green-soft)" />
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-2 w-full mt-1">
                    <Stat value={String(pendingCount)} label="Tareas" color="var(--accent-red)" />
                    <Stat value="2" label="Proyectos" color="var(--accent)" />
                    <Stat value="138" label="Días activo" />
                  </div>
                </div>
              </PanelCard>
            </motion.div>

            {/* Row: Personal profile + potential */}
            <motion.div variants={CARD_ITEM} className="flex gap-4">
              <PanelCard className="flex-1">
                <SectionHeader icon={<Brain className="w-3.5 h-3.5" style={{ color: "var(--accent-pink)" }} />}>
                  PERFIL PERSONAL
                </SectionHeader>
                <div className="flex gap-2.5">
                  <MiniStat
                    icon={<Sparkles className="w-3 h-3" style={{ color: "var(--accent)" }} />}
                    label="Personalidad"
                    value={person.personality}
                  />
                  <MiniStat
                    icon={<Heart className="w-3 h-3" style={{ color: "var(--accent-pink)" }} />}
                    label="Emocionalidad"
                    value={person.emotionality}
                  />
                  <MiniStat
                    icon={<Sparkles className="w-3 h-3" style={{ color: phase.color }} />}
                    label="Fase"
                    value={phase.label}
                  />
                </div>
              </PanelCard>

              <PanelCard className="w-[200px] shrink-0">
                <SectionHeader icon={<TrendingUp className="w-3.5 h-3.5 text-accent" />}>
                  POTENCIAL
                </SectionHeader>
                <div className="flex items-center gap-3">
                  <PotentialRing value={person.potential.score} color={phase.color} bg={phase.soft} />
                  <div className="flex flex-col gap-1">
                    <span className="text-[22px] font-bold text-text-primary leading-none">
                      {person.potential.score}%
                    </span>
                    <span className="text-[11px] font-medium text-text-tertiary leading-tight">
                      {person.potential.note}
                    </span>
                  </div>
                </div>
              </PanelCard>
            </motion.div>

            {/* Row: Advantages + discomforts */}
            <motion.div variants={CARD_ITEM} className="flex gap-4">
              <PanelCard className="flex-1">
                <SectionHeader icon={<Plus className="w-3.5 h-3.5" style={{ color: "var(--accent-green)" }} />}>
                  VENTAJAS
                </SectionHeader>
                <BulletList items={person.advantages} color="var(--accent-green)" />
              </PanelCard>
              <PanelCard className="flex-1">
                <SectionHeader icon={<Minus className="w-3.5 h-3.5" style={{ color: "var(--accent-pink)" }} />}>
                  INCOMODIDADES
                </SectionHeader>
                <BulletList items={person.discomforts} color="var(--accent-pink)" />
              </PanelCard>
            </motion.div>

            {/* Tasks */}
            <motion.div variants={CARD_ITEM}>
              <TasksSection person={person} pendingCount={pendingCount} />
            </motion.div>

            {/* Contact */}
            <motion.div variants={CARD_ITEM}>
              <PanelCard>
                <SectionHeader icon={<IdCard className="w-3.5 h-3.5 text-accent" />}>
                  DATOS DE CONTACTO
                </SectionHeader>
                <div className="flex flex-col gap-2">
                  {[
                    { Icon: Mail,     text: `${person.id.replace("p-", "")}@cart.co` },
                    { Icon: Phone,    text: "+57 310 555 8812" },
                    { Icon: MapPin,   text: "Medellín, Colombia" },
                    { Icon: Calendar, text: "Ingresó: 23 jun 2026" },
                  ].map(({ Icon, text }) => (
                    <div key={text} className="flex items-center gap-2.5">
                      <Icon className="w-3.5 h-3.5 text-text-tertiary" />
                      <span className="text-[12px] font-medium text-text-primary truncate">{text}</span>
                    </div>
                  ))}
                </div>
              </PanelCard>
            </motion.div>

            {/* Network links */}
            {(manager || subordinates.length > 0) && (
              <motion.div variants={CARD_ITEM}>
                <PanelCard>
                  <SectionHeader icon={<GitBranch className="w-3.5 h-3.5 text-accent" />}>
                    VÍNCULOS EN LA RED
                  </SectionHeader>

                  {manager && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-bold text-white">{manager.initials}</span>
                      </div>
                      <div className="flex-1 leading-tight">
                        <div className="text-[10px] font-semibold text-text-tertiary">Reporta a</div>
                        <span className="text-[13px] font-semibold text-text-primary">{manager.name}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-text-tertiary" />
                    </div>
                  )}

                  {subordinates.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="text-[11px] font-semibold text-text-tertiary">
                        Reportan a {person.name.split(" ")[0]} ({subordinates.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {subordinates.map((s) => {
                          const ph = PHASE_COLORS[s.phase];
                          return (
                            <span
                              key={s.id}
                              className="h-[30px] rounded-full bg-surface-2 border border-[var(--border)] flex items-center gap-1.5 px-2.5 pr-3"
                            >
                              <span
                                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                style={{ background: ph.color }}
                              >
                                <span className="text-[9px] font-bold text-white">{s.initials}</span>
                              </span>
                              <span className="text-[11px] font-semibold text-text-primary">{s.name}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </PanelCard>
              </motion.div>
            )}

            {/* Functions + interests */}
            <motion.div variants={CARD_ITEM}>
              <PanelCard>
                <SectionHeader icon={<Tag className="w-3.5 h-3.5" style={{ color: "var(--accent-orange)" }} />}>
                  FUNCIONES · INTERESES
                </SectionHeader>
                <div className="flex gap-6">
                  <div className="flex-1 flex flex-col gap-2">
                    <span className="text-[11px] font-semibold text-text-secondary">Funciones</span>
                    <div className="flex flex-wrap gap-1.5">
                      {person.functions.map((f) => (
                        <Tagish key={f} label={f} />
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <span className="text-[11px] font-semibold text-text-secondary">Intereses personales</span>
                    <div className="flex flex-wrap gap-1.5">
                      {person.interests.map((i) => (
                        <span
                          key={i}
                          className="h-[26px] rounded-md px-2.5 flex items-center text-[11px] font-semibold"
                          style={{ color: "var(--accent-pink)", background: "var(--accent-pink-soft)" }}
                        >
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </PanelCard>
            </motion.div>

            {/* Bottom spacer */}
            <div className="h-6" />
          </motion.div>
        </div>
      </motion.aside>

      {/* Modal para modificar toda la información de la persona */}
      <EditPersonModal
        isOpen={isEditModalOpen}
        person={person}
        onClose={() => setIsEditModalOpen(false)}
        onPersonUpdated={(updates) => {
          updatePerson(updates);
          getPeople().then((res) => setAllPeople(res));
        }}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Tasks Section with Functional Creation Modal & Actions            */
/* ------------------------------------------------------------------ */
function TasksSection({
  person,
  pendingCount,
}: {
  person: Person;
  pendingCount: number;
}) {
  const { addTask, updateTaskStatus, deleteTask } = usePersonPanel();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDone, setShowDone] = useState(false);

  // Estado para el modal de validación / confirmación de eliminación
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dividir tareas en activas y completadas
  const activeTasks = person.tasks.filter((t) => t.status !== "hecho");
  const doneTasks = person.tasks.filter((t) => t.status === "hecho");

  const handleToggleCheck = async (task: Task) => {
    const newStatus: Task["status"] = task.status === "hecho" ? "pendiente" : "hecho";
    updateTaskStatus(task.id, newStatus);
    await updateTaskStatusInDb(task.id, newStatus);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      deleteTask(taskToDelete.id);
      await deleteTaskFromDb(taskToDelete.id);
      setTaskToDelete(null);
    } catch (err) {
      console.error("Error al eliminar la tarea:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PanelCard>
        <div className="flex items-center gap-2.5">
          <ListChecks className="w-3.5 h-3.5" style={{ color: "var(--accent-red)" }} />
          <span className="text-[10px] font-bold text-text-tertiary tracking-widest">
            TAREAS · PROYECTO CART
          </span>
          <span className="h-5 px-2 rounded-full bg-[var(--accent-red)] text-white text-[10px] font-bold flex items-center">
            {pendingCount}
          </span>
          <div className="flex-1" />
          <button
            onClick={() => setIsModalOpen(true)}
            className="h-[28px] px-3 rounded-lg bg-text-primary text-white text-[11px] font-semibold flex items-center gap-1.5 hover:opacity-90 transition active:scale-95 shadow-sm"
          >
            <Plus className="w-3 h-3" />
            Nueva
          </button>
        </div>

        {/* Lista de tareas activas */}
        <div className="flex flex-col gap-2">
          {activeTasks.length === 0 && doneTasks.length === 0 && (
            <div className="text-[12px] text-text-tertiary py-6 text-center">
              Sin tareas asignadas.
            </div>
          )}

          {activeTasks.length === 0 && doneTasks.length > 0 && (
            <div className="text-[12px] text-text-tertiary py-3 text-center">
              ¡Todas las tareas están completadas! 🎉
            </div>
          )}

          {activeTasks.map((t) => {
            const s = STATUS_STYLES[t.status];
            return (
              <div
                key={t.id}
                className="group h-14 rounded-xl bg-surface-2 flex items-center px-4 gap-3 border border-transparent hover:border-[var(--border)] transition"
              >
                {/* Checkbox para completar */}
                <button
                  type="button"
                  onClick={() => handleToggleCheck(t)}
                  aria-label="Marcar como hecha"
                  className="w-[18px] h-[18px] rounded-[5px] bg-surface border border-[var(--border-strong)] shrink-0 flex items-center justify-center hover:border-accent hover:bg-accent-soft transition"
                />

                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-text-primary truncate">
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

                {/* Botón de basurero para eliminar tarea */}
                <button
                  type="button"
                  onClick={() => setTaskToDelete({ id: t.id, title: t.title })}
                  title="Eliminar tarea"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:text-[var(--accent-red)] hover:bg-surface transition opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Sección desplegable: Tareas hechas */}
        {doneTasks.length > 0 && (
          <div className="mt-2 pt-3 border-t border-[var(--border)] flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowDone((prev) => !prev)}
              className="flex items-center justify-between text-[11px] font-bold text-text-tertiary hover:text-text-secondary transition tracking-wider"
            >
              <div className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-[var(--accent-green)]" />
                <span>TAREAS HECHAS ({doneTasks.length})</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showDone ? "rotate-180" : ""
                }`}
              />
            </button>

            {showDone && (
              <div className="flex flex-col gap-2 mt-1">
                {doneTasks.map((t) => (
                  <div
                    key={t.id}
                    className="group h-12 rounded-xl bg-surface-2/60 flex items-center px-4 gap-3 border border-transparent hover:border-[var(--border)] transition opacity-80 hover:opacity-100"
                  >
                    {/* Checkbox marcado */}
                    <button
                      type="button"
                      onClick={() => handleToggleCheck(t)}
                      aria-label="Desmarcar tarea"
                      className="w-[18px] h-[18px] rounded-[5px] bg-[var(--accent-green)] text-white shrink-0 flex items-center justify-center transition hover:opacity-80"
                    >
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-text-secondary line-through truncate">
                        {t.title}
                      </div>
                    </div>

                    <span
                      className="h-5 rounded-md px-2 text-[10px] font-semibold flex items-center shrink-0"
                      style={{
                        color: "var(--accent-green)",
                        background: "var(--accent-green-soft)",
                      }}
                    >
                      Hecho
                    </span>

                    {/* Botón eliminar */}
                    <button
                      type="button"
                      onClick={() => setTaskToDelete({ id: t.id, title: t.title })}
                      title="Eliminar tarea"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:text-[var(--accent-red)] hover:bg-surface transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </PanelCard>

      {/* Modal centrado en la mitad de la pantalla para crear tarea */}
      <CreateTaskModal
        isOpen={isModalOpen}
        personId={person.id}
        personName={person.name}
        onClose={() => setIsModalOpen(false)}
        onTaskCreated={(newTask) => addTask(newTask)}
      />

      {/* Modal de confirmación para eliminar tarea con DELETE en Supabase */}
      <ConfirmDeleteModal
        isOpen={Boolean(taskToDelete)}
        name={taskToDelete?.title ?? ""}
        type="task"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTaskToDelete(null)}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Small building blocks                                               */
/* ------------------------------------------------------------------ */

function PanelCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-5 flex flex-col gap-3 ${className}`}
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {children}
    </div>
  );
}

function SectionHeader({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-[10px] font-bold text-text-tertiary tracking-widest">{children}</span>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-[var(--border)] transition active:scale-95 cursor-pointer"
      style={{ background: "var(--surface-2)" }}
    >
      {children}
    </button>
  );
}

function Chip({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="h-6 rounded-md px-2.5 text-[11px] font-semibold flex items-center" style={{ color, background: bg }}>
      {label}
    </span>
  );
}

function Stat({ value, label, color = "var(--text-primary)" }: { value: string; label: string; color?: string }) {
  return (
    <div className="flex-1 h-16 rounded-xl bg-surface-2 flex flex-col items-center justify-center gap-0.5">
      <span className="text-[18px] font-bold" style={{ color }}>{value}</span>
      <span className="text-[10px] font-semibold text-text-tertiary">{label}</span>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex-1 h-[72px] rounded-xl bg-surface-2 p-3 flex flex-col gap-1 justify-center">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] font-semibold text-text-tertiary tracking-wide">{label}</span>
      </div>
      <span className="text-[14px] font-bold text-text-primary">{value}</span>
    </div>
  );
}

function BulletList({ items, color }: { items: string[]; color: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((t) => (
        <div key={t} className="flex items-start gap-2.5 pt-1">
          <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
          <span className="text-[12px] font-medium text-text-primary leading-snug">{t}</span>
        </div>
      ))}
    </div>
  );
}

const FUNCTION_COLORS: Record<string, { color: string; bg: string }> = {
  "Contenido":    { color: "#3B82F6", bg: "#EFF6FF" },
  "Social media": { color: "#3B82F6", bg: "#EFF6FF" },
  "Branding":     { color: "#10B981", bg: "#ECFDF5" },
  "Campañas":     { color: "#F59E0B", bg: "#FFFBEB" },
};

function Tagish({ label }: { label: string }) {
  const style = FUNCTION_COLORS[label];
  if (style) {
    return (
      <span
        className="h-[26px] rounded-md px-2.5 flex items-center text-[11px] font-semibold"
        style={{ color: style.color, background: style.bg }}
      >
        {label}
      </span>
    );
  }
  return (
    <span
      className="h-[26px] rounded-md bg-surface-2 border border-[var(--border)] px-2.5 flex items-center text-[11px] font-semibold text-text-primary"
    >
      {label}
    </span>
  );
}

function PotentialRing({ value, color, bg }: { value: number; color: string; bg: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const filled = (c * value) / 100;
  return (
    <svg width={64} height={64} viewBox="0 0 64 64">
      <circle cx={32} cy={32} r={r} fill="none" stroke={bg} strokeWidth={6} />
      <circle
        cx={32} cy={32} r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={`${filled} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 32 32)"
      />
    </svg>
  );
}
