"use client";

import { useEffect, useState } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { Plus, Trash2 } from "lucide-react";
import type { Person } from "@/lib/types";
import { PHASE_COLORS } from "@/lib/types";

export type PersonNodeData = Person & {
  pendingTasks: number;
  showStatusEmoji?: boolean;
  onRequestDelete?: (node: { id: string; name: string; type: "person" | "client" }) => void;
  onOpenPanel?: (person: Person) => void;
};

export function PersonNode({
  id,
  data,
}: {
  id: string;
  data: PersonNodeData;
}) {
  const { setNodes, setEdges } = useReactFlow();

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onRequestDelete) {
      data.onRequestDelete({ id, name: data.name, type: "person" });
    } else {
      setNodes((ns) => ns.filter((n) => n.id !== id));
      setEdges((es) => es.filter((e) => e.source !== id && e.target !== id));
    }
  };

  const onNodeClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest(".react-flow__handle")) return;

    if (data.onOpenPanel) {
      // Extract the pure Person object (omit node-specific fields)
      const { pendingTasks: _pt, onRequestDelete: _rd, onOpenPanel: _op, ...person } = data;
      data.onOpenPanel(person as Person);
    }
  };

  const phase = PHASE_COLORS[data.phase];
  const isCeo = data.isCeo;

  const outerSize = isCeo ? 72 : 56;
  const innerSize = isCeo ? 56 : 44;
  const borderColor = isCeo ? "var(--accent)" : phase.color;
  const innerFill = isCeo ? "var(--accent)" : phase.soft;
  const innerText = isCeo ? "#ffffff" : phase.color;

  const wrapperHeight = outerSize + (isCeo ? 60 : 54);
  const minLabelWidth = isCeo ? 130 : 110;

  // Working hours status: 8:00 AM to 8:00 PM (8:00 - 20:00)
  const [isWorkingHours, setIsWorkingHours] = useState(true);

  useEffect(() => {
    const checkHours = () => {
      const now = new Date();
      const currentHour = now.getHours();
      // Active between 8:00 (8) and 19:59 (< 20)
      setIsWorkingHours(currentHour >= 8 && currentHour < 20);
    };

    checkHours();
    const interval = setInterval(checkHours, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      onClick={onNodeClick}
      className="group relative flex flex-col items-center cursor-pointer active:cursor-grabbing"
      style={{ minWidth: outerSize, height: wrapperHeight }}
    >
      {/* Soft glow for CEO */}
      {isCeo && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            background: "var(--accent-soft)",
            opacity: 0.5,
            width: outerSize + 40,
            height: outerSize + 40,
            top: -20,
          }}
        />
      )}

      {/* Circle */}
      <div className="relative" style={{ width: outerSize, height: outerSize }}>
        <div
          className="absolute inset-0 rounded-full bg-surface flex items-center justify-center"
          style={{
            border: `${isCeo ? 2.5 : 2}px solid ${borderColor}`,
            boxShadow: isCeo
              ? "0 6px 18px rgba(99,102,241,0.13)"
              : "0 3px 10px rgba(0,0,0,0.06)",
          }}
        >
          <div
            className="rounded-full flex items-center justify-center pointer-events-none select-none overflow-hidden"
            style={{ width: innerSize, height: innerSize, background: innerFill }}
          >
            {data.avatarUrl ? (
              <img
                src={data.avatarUrl}
                alt={data.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span
                className="font-bold"
                style={{ color: innerText, fontSize: isCeo ? 18 : 12 }}
              >
                {data.initials}
              </span>
            )}
          </div>
        </div>

        {/* Delete button */}
        <button
          type="button"
          aria-label="Eliminar"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onDelete}
          className="nodrag absolute opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-surface border rounded-full hover:border-[var(--text-tertiary)]"
          style={{
            width: 18,
            height: 18,
            top: -6,
            left: -6,
            borderColor: "var(--border-strong)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <Trash2
            className="w-2.5 h-2.5 pointer-events-none"
            style={{ color: "var(--text-tertiary)" }}
            strokeWidth={2}
          />
        </button>

        {/* Task badge */}
        {data.pendingTasks > 0 && (
          <div
            className="absolute flex items-center justify-center font-bold text-white pointer-events-none"
            style={{
              width: isCeo ? 18 : 14,
              height: isCeo ? 18 : 14,
              borderRadius: 999,
              background: "var(--accent-red)",
              border: "1.5px solid var(--surface)",
              fontSize: isCeo ? 9 : 8,
              top: isCeo ? -4 : -3,
              right: isCeo ? -4 : -3,
            }}
          >
            {data.pendingTasks}
          </div>
        )}

        {/* Target handle */}
        <Handle
          type="target"
          position={Position.Top}
          id="in"
          style={{
            width: 1,
            height: 1,
            opacity: 0,
            border: "none",
            background: "transparent",
            top: outerSize / 2,
            left: outerSize / 2,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />

        {/* Status badge on top of avatar (8am - 8pm: 🧑🏻‍💻, outside: 💤) */}
        {data.showStatusEmoji !== false && (
          <div
            title={isWorkingHours ? "En horario laboral (8:00 AM - 8:00 PM)" : "Fuera de horario (Descanso)"}
            className="absolute select-none pointer-events-none flex items-center justify-center rounded-full bg-surface border shadow-xs transition-transform group-hover:scale-110"
            style={{
              width: isCeo ? 22 : 18,
              height: isCeo ? 22 : 18,
              top: isCeo ? -6 : -5,
              right: isCeo ? (data.pendingTasks > 0 ? 14 : -4) : (data.pendingTasks > 0 ? 12 : -3),
              borderColor: "var(--border)",
              fontSize: isCeo ? 11 : 9,
              lineHeight: 1,
              zIndex: 10,
            }}
          >
            <span>{isWorkingHours ? "🧑🏻‍💻" : "💤"}</span>
          </div>
        )}

        {/* Source handle (+ icon) */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="plus"
          className="nodrag !opacity-0 group-hover:!opacity-100 transition-opacity"
          style={{
            width: 14,
            height: 14,
            background: "var(--surface)",
            border: "1px solid var(--border-strong)",
            borderRadius: 999,
            bottom: -7,
            left: "50%",
            transform: "translateX(-50%)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            cursor: "crosshair",
          }}
        >
          <Plus
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ width: 8, height: 8, color: "var(--text-secondary)" }}
            strokeWidth={2.5}
          />
        </Handle>
      </div>

      {/* Name label */}
      <div
        className="mt-2.5 bg-surface border border-[var(--border)] rounded-xl flex flex-col items-center justify-center gap-1 px-3 py-1.5 pointer-events-none shadow-xs whitespace-nowrap"
        style={{ minWidth: minLabelWidth, maxWidth: 220 }}
      >
        <span className="text-[11px] font-bold text-text-primary leading-tight text-center">
          {data.name}
        </span>
        <span className="text-[10px] font-medium text-text-tertiary leading-tight text-center">
          {data.role}
        </span>
      </div>
    </div>
  );
}
