"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  name: string;
  type: "person" | "client" | "task" | "project";
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({
  isOpen,
  name,
  type,
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          {/* Backdrop con blur y animación de fade suave */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Tarjeta del modal con spring physics elegante */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 26, stiffness: 340 }}
            className="relative w-full max-w-[390px] rounded-2xl bg-surface border border-[var(--border)] p-6 shadow-2xl flex flex-col gap-4 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-full bg-[var(--accent-red-soft,#fee2e2)] text-[var(--accent-red,#ef4444)] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-[17px] font-bold text-text-primary">
                ¿Eliminar {type === "person" ? "persona" : type === "client" ? "cliente" : type === "project" ? "proyecto" : "tarea"}?
              </h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                {type === "task" ? (
                  <>
                    ¿Estás seguro de que deseas eliminar la tarea{" "}
                    <strong className="text-text-primary font-semibold">"{name}"</strong>?{" "}
                    Esta acción se sincronizará con la base de datos de Supabase y no se podrá recuperar.
                  </>
                ) : type === "project" ? (
                  <>
                    ¿Estás seguro de que deseas eliminar el proyecto{" "}
                    <strong className="text-text-primary font-semibold">"{name}"</strong>?{" "}
                    Esta acción se sincronizará con la base de datos de Supabase y removerá la vinculación de este proyecto en el equipo.
                  </>
                ) : (
                  <>
                    ¿Estás seguro de que deseas eliminar a{" "}
                    <strong className="text-text-primary font-semibold">"{name}"</strong>?{" "}
                    Esta acción se sincronizará con la base de datos de Supabase y eliminará también sus vínculos y tareas asociadas.
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={onCancel}
                className="h-9 px-4 rounded-xl text-[13px] font-semibold text-text-secondary bg-surface-2 hover:bg-[var(--border)] transition disabled:opacity-50 cursor-pointer active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={onConfirm}
                className="h-9 px-4 rounded-xl text-[13px] font-semibold text-white bg-[var(--accent-red,#ef4444)] hover:opacity-90 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer active:scale-95 shadow-sm"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isLoading ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
