"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { BadgeCheck, Plus, Sparkles, Users } from "lucide-react";
import { getPeople } from "@/lib/supabase";
import { PHASE_COLORS, type Person } from "@/lib/types";

interface GridViewProps {
  onSelectPerson: (person: Person) => void;
  onAddPerson: () => void;
}

export function GridView({ onSelectPerson, onAddPerson }: GridViewProps) {
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getPeople().then((res) => {
      setPeople(res);
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-bg p-8">
      <div className="max-w-[1240px] mx-auto flex flex-col gap-6">
        {/* Header de la cuadrícula */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-[18px] font-bold text-text-primary">
                Equipo ({people.length})
              </h1>
              <p className="text-[12px] text-text-tertiary">
                Directorio en cuadrícula de colaboradores y directores
              </p>
            </div>
          </div>

          <button
            onClick={onAddPerson}
            className="h-9 px-4 rounded-xl bg-text-primary text-white text-[13px] font-semibold flex items-center gap-2 hover:opacity-90 active:scale-95 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar persona
          </button>
        </div>

        {/* Tarjetas en Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-[13px] text-text-tertiary">
            Cargando personas desde Supabase...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {people.map((p) => {
              const phase = PHASE_COLORS[p.phase];
              const pendingCount = p.tasks.filter((t) => t.status !== "hecho").length;

              return (
                <motion.div
                  key={p.id}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  onClick={() => onSelectPerson(p)}
                  className="rounded-2xl bg-surface border border-[var(--border)] p-5 flex flex-col items-center gap-3.5 cursor-pointer shadow-xs hover:shadow-md hover:border-accent/40 transition group"
                >
                  {/* Avatar con borde de color de fase */}
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-[20px] transition-transform group-hover:scale-105 overflow-hidden"
                    style={{
                      background: phase.soft,
                      color: phase.color,
                      border: `2.5px solid ${phase.color}`,
                    }}
                  >
                    {p.avatarUrl ? (
                      <img
                        src={p.avatarUrl}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      p.initials
                    )}
                  </div>

                  {/* Nombre y Cargo */}
                  <div className="flex flex-col items-center gap-1 text-center w-full">
                    <div className="flex items-center gap-1">
                      <span className="text-[15px] font-bold text-text-primary truncate">
                        {p.name}
                      </span>
                      {p.isCeo && <BadgeCheck className="w-4 h-4 text-accent shrink-0" />}
                    </div>
                    <span className="text-[12px] font-medium text-text-tertiary truncate max-w-full">
                      {p.role} · {p.age} años
                    </span>
                  </div>

                  {/* Chips: Fase y Tareas */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    <span
                      className="h-5 px-2 rounded-md text-[10px] font-semibold flex items-center"
                      style={{ color: phase.color, background: phase.soft }}
                    >
                      {phase.label}
                    </span>
                    {pendingCount > 0 ? (
                      <span className="h-5 px-2 rounded-md bg-[var(--accent-red-soft,#fee2e2)] text-[var(--accent-red,#ef4444)] text-[10px] font-semibold flex items-center">
                        {pendingCount} tareas
                      </span>
                    ) : (
                      <span className="h-5 px-2 rounded-md bg-green-50 text-green-600 text-[10px] font-semibold flex items-center">
                        Al día
                      </span>
                    )}
                  </div>

                  {/* Mini barra de funciones */}
                  {p.functions.length > 0 && (
                    <div className="w-full pt-2 border-t border-[var(--border)] flex items-center justify-center gap-1 flex-wrap">
                      {p.functions.slice(0, 2).map((f) => (
                        <span
                          key={f}
                          className="text-[10px] font-medium text-text-secondary bg-surface-2 px-2 py-0.5 rounded-md truncate max-w-[100px]"
                        >
                          {f}
                        </span>
                      ))}
                      {p.functions.length > 2 && (
                        <span className="text-[9px] font-bold text-text-tertiary">
                          +{p.functions.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

