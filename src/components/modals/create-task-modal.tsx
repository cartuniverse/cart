"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Calendar, CheckCircle2, Plus, X } from "lucide-react";
import { createTaskInDb } from "@/lib/supabase";
import type { Task } from "@/lib/types";

interface CreateTaskModalProps {
  isOpen: boolean;
  personId: string;
  personName: string;
  onClose: () => void;
  onTaskCreated: (task: Task) => void;
}

export function CreateTaskModal({
  isOpen,
  personId,
  personName,
  onClose,
  onTaskCreated,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [dateVal, setDateVal] = useState("");
  const [status, setStatus] = useState<Task["status"]>("pendiente");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDue = (dateStr: string) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) return null;
    const date = new Date(year, month - 1, day);
    const months = [
      "ene", "feb", "mar", "abr", "may", "jun",
      "jul", "ago", "sep", "oct", "nov", "dic"
    ];
    return `Vence ${day} ${months[date.getMonth()]}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const dueFormatted = formatDue(dateVal);

    try {
      const newTask = await createTaskInDb(personId, title.trim(), dueFormatted, status);

      const created: Task = newTask ?? {
        id: `t-${Date.now()}`,
        title: title.trim(),
        due: dueFormatted ?? undefined,
        status,
      };

      onTaskCreated(created);
      setTitle("");
      setDateVal("");
      setStatus("pendiente");
      onClose();
    } catch (err) {
      console.error("Error creating task in modal:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop con blur y animación fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal animado al centro con spring physics */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative w-full max-w-[440px] rounded-2xl bg-surface border border-[var(--border)] p-6 shadow-2xl z-10 flex flex-col gap-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-red)]/10 text-[var(--accent-red)] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-text-primary">Nueva Tarea</h3>
                  <p className="text-[12px] text-text-tertiary">
                    Asignada a <span className="font-semibold text-text-secondary">{personName}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-[var(--border)] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-text-secondary">
                  Título de la tarea
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Diseñar kit de redes sociales..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-10 px-3 text-[13px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent transition"
                  style={{ borderColor: "var(--border)" }}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-text-secondary flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
                    Fecha de vencimiento
                  </label>
                  <input
                    type="date"
                    value={dateVal}
                    onChange={(e) => setDateVal(e.target.value)}
                    className="h-10 px-3 text-[13px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent transition cursor-pointer"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-text-secondary">
                    Estado inicial
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Task["status"])}
                    className="h-10 px-3 text-[13px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent transition cursor-pointer"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_progreso">En progreso</option>
                    <option value="revision">Para revisar</option>
                    <option value="hecho">Hecho</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 px-4 text-[13px] font-medium rounded-xl text-text-secondary hover:bg-surface-2 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || isSubmitting}
                  className="h-9 px-4 text-[13px] font-semibold rounded-xl bg-accent text-white flex items-center gap-1.5 hover:opacity-90 active:scale-95 disabled:opacity-50 transition shadow-sm"
                >
                  {isSubmitting ? (
                    <span>Guardando...</span>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      Crear tarea
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

