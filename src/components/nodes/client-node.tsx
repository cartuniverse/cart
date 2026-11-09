"use client";

import { Handle, Position, useReactFlow } from "@xyflow/react";
import { Plus, Trash2 } from "lucide-react";
import type { Client } from "@/lib/types";

type ClientNodeData = Client & {
  onRequestDelete?: (node: { id: string; name: string; type: "person" | "client" }) => void;
};

export function ClientNode({ id, data }: { id: string; data: ClientNodeData }) {
  const { setNodes, setEdges } = useReactFlow();
  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onRequestDelete) {
      data.onRequestDelete({ id, name: data.name, type: "client" });
    } else {
      setNodes((ns) => ns.filter((n) => n.id !== id));
      setEdges((es) => es.filter((e) => e.source !== id && e.target !== id));
    }
  };
  return (
    <div
      className="group relative flex flex-col items-center cursor-grab active:cursor-grabbing"
      style={{ width: 120, height: 60 + 40 }}
    >
      {/* Rounded square */}
      <div className="relative" style={{ width: 60, height: 60 }}>
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl bg-surface"
          style={{
            border: "2px solid var(--accent-orange)",
            boxShadow: "0 3px 10px rgba(245,158,11,0.15)",
          }}
        >
          <div
            className="rounded-xl flex items-center justify-center pointer-events-none select-none"
            style={{
              width: 48,
              height: 48,
              background: "var(--accent-orange-soft)",
            }}
          >
            <span
              className="text-[12px] font-bold"
              style={{ color: "var(--accent-orange)" }}
            >
              {data.initials}
            </span>
          </div>
        </div>

        {/* Delete button — top-left, visible on hover */}
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

        {/* Invisible target handle */}
        <Handle
          type="target"
          position={Position.Left}
          id="in"
          style={{
            width: 1,
            height: 1,
            opacity: 0,
            border: "none",
            background: "transparent",
            top: 30,
            left: 30,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />

        {/* Small gray + handle — visible on hover */}
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
            style={{
              width: 8,
              height: 8,
              color: "var(--text-secondary)",
            }}
            strokeWidth={2.5}
          />
        </Handle>
      </div>

      {/* Name label */}
      <div
        className="mt-3 bg-surface border border-[var(--border)] rounded-lg flex flex-col items-center justify-center gap-0.5 px-2 pointer-events-none whitespace-nowrap"
        style={{ width: 120, height: 32 }}
      >
        <span className="text-[11px] font-bold text-text-primary leading-none">
          {data.name}
        </span>
        <span className="text-[9px] font-medium text-text-tertiary leading-none">
          {data.industry}
        </span>
      </div>
    </div>
  );
}
