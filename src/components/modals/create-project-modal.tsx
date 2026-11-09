"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FolderKanban, Loader2, Sparkles, X } from "lucide-react";
import { createProjectInDb } from "@/lib/supabase";
import type { Project } from "@/lib/types";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
}

const COLOR_OPTIONS = [
  { name: "Índigo", value: "#6366f1" },
  { name: "Verde esmeralda", value: "#10b981" },
  { name: "Azul cielo", value: "#3b82f6" },
  { name: "Ámbar / Naranja", value: "#f59e0b" },
  { name: "Rosa / Magenta", value: "#ec4899" },
  { name: "Púrpura", value: "#8b5cf6" },
  { name: "Gris oscuro", value: "#27272a" },
];

const EMOJI_OPTIONS = ["🚀", "📱", "🌐", "🎨", "⚡", "🔥", "💡", "🛠️", "📊", "🎯", "🤖", "💼"];

export function CreateProjectModal({
  isOpen,
  onClose,
  onProjectCreated,
}: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].value);
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_OPTIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const created = await createProjectInDb({
        name: name.trim(),
        description: description.trim(),
        color: selectedColor,
        emoji: selectedEmoji,
      });

      if (created) {
        onProjectCreated(created);
        setName("");
        setDescription("");
        onClose();
      }
    } catch (err) {
      console.error("Error creating project:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
            className="relative w-full max-w-[500px] bg-surface rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden z-10 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-surface-2/40">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[16px] shadow-2xs"
                  style={{ background: `${selectedColor}18`, border: `1px solid ${selectedColor}40` }}
                >
                  {selectedEmoji}
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-text-primary">Crear nuevo proyecto</h3>
                  <p className="text-[11px] text-text-tertiary">Organiza equipos y tareas en este proyecto</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {/* Nombre */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-text-secondary">Nombre del proyecto *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Lanzamiento V2, Rediseño Web..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 px-3.5 text-[13px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>

              {/* Descripción */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-text-secondary">Descripción</label>
                <textarea
                  rows={2}
                  placeholder="Objetivos o alcance del proyecto..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="p-3 text-[13px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent resize-none"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>

              {/* Emoji selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-text-secondary">Icono / Emoji</label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-surface-2 border border-[var(--border)]">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-[15px] transition cursor-pointer ${
                        selectedEmoji === emoji ? "bg-surface shadow-xs scale-110 border border-border" : "hover:bg-surface/50"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-text-secondary">Color de etiqueta</label>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((col) => (
                    <button
                      type="button"
                      key={col.value}
                      onClick={() => setSelectedColor(col.value)}
                      title={col.name}
                      className="w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center"
                      style={{
                        background: col.value,
                        transform: selectedColor === col.value ? "scale(1.15)" : "scale(1)",
                        boxShadow: selectedColor === col.value ? `0 0 0 2px var(--surface), 0 0 0 4px ${col.value}` : "none",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 px-4 text-[13px] font-medium rounded-xl text-text-secondary hover:bg-surface-2 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="h-9 px-5 text-[13px] font-semibold rounded-xl bg-text-primary text-white flex items-center gap-2 hover:opacity-90 active:scale-95 disabled:opacity-50 transition shadow-sm cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creando...</span>
                    </>
                  ) : (
                    <span>Crear proyecto</span>
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

