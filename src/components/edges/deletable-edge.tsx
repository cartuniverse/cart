"use client";

import { useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  type EdgeProps,
  useReactFlow,
} from "@xyflow/react";
import { X } from "lucide-react";

export function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const [isHovered, setIsHovered] = useState(false);

  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const onEdgeDelete = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    setEdges((edges) => edges.filter((e) => e.id !== id));
  };

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer"
    >
      {/* Invisible wider stroke for easier hovering */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
      />

      {/* Visible connecting line */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: isHovered ? "var(--accent-red, #ef4444)" : (style.stroke || "#D7D7DC"),
          strokeWidth: isHovered ? 1.8 : (style.strokeWidth || 1.2),
          transition: "stroke 0.2s, stroke-width 0.2s",
        }}
        markerEnd={markerEnd}
      />

      {/* Floating delete button in the middle when hovering */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: isHovered ? "all" : "none",
            opacity: isHovered ? 1 : 0,
            transition: "opacity 0.15s ease-in-out, transform 0.15s ease-in-out",
            zIndex: 1000,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <button
            type="button"
            aria-label="Eliminar conexión"
            onClick={onEdgeDelete}
            className="w-5 h-5 rounded-full bg-white border border-[var(--border-strong, #d7d7dc)] shadow-sm hover:bg-[var(--accent-red,#ef4444)] hover:border-[var(--accent-red,#ef4444)] hover:text-white text-text-secondary flex items-center justify-center transition-all cursor-pointer hover:scale-110"
          >
            <X className="w-2.5 h-2.5" strokeWidth={2.5} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </g>
  );
}

