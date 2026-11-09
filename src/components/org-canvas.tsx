"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addEdge,
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  type Node,
  type OnNodeDrag,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { usePersonPanel } from "./profile/person-panel-context";

import {
  deleteClientFromDb,
  deletePersonFromDb,
  getClients,
  getNodePositions,
  getPeople,
  saveNodePositionToDb,
} from "@/lib/supabase";
import type { Client, Person } from "@/lib/types";
import { PersonNode } from "./nodes/person-node";
import { ClientNode } from "./nodes/client-node";
import { DeletableEdge } from "./edges/deletable-edge";
import { ConfirmDeleteModal } from "./modals/confirm-delete-modal";

const CENTER_X = 540;
const CENTER_Y = 420;

const TEAM_ANGLES = [-90, -30, 30, 90, 150, 210] as const;
const TEAM_RADIUS = 220;

function toXY(angle: number, radius: number, cx = CENTER_X, cy = CENTER_Y) {
  const a = (angle * Math.PI) / 180;
  return { x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius };
}

const nodeTypes = {
  person: PersonNode,
  client: ClientNode,
};

const edgeTypes = {
  deletable: DeletableEdge,
};

// Soft neutral gray — matches the Pencil reference: solid, light, continuous.
const SOFT_GRAY_EDGE = {
  stroke: "#D7D7DC",
  strokeWidth: 1.2,
  opacity: 1,
};

const USER_EDGE_STYLE = {
  stroke: "#D7D7DC",
  strokeWidth: 1.2,
  opacity: 1,
};

function buildGraphFromData(
  allPeople: Person[],
  allClients: Client[],
  onRequestDelete?: (node: { id: string; name: string; type: "person" | "client" }) => void,
  customPositions?: Record<string, { x: number; y: number }>,
  onOpenPanel?: (person: Person) => void,
) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const pendingFor = (tasks: { status: string }[]) =>
    tasks.filter((t) => t.status !== "hecho").length;

  const ceo = allPeople.find((p) => p.isCeo) ?? allPeople[0];
  if (!ceo) return { nodes, edges };
  const team = allPeople.filter((p) => p.id !== ceo.id);

  const ceoPos = customPositions?.[ceo.id] ?? { x: CENTER_X - 36, y: CENTER_Y - 36 };

  nodes.push({
    id: ceo.id,
    type: "person",
    position: ceoPos,
    data: {
      ...ceo,
      pendingTasks: pendingFor(ceo.tasks || []),
      onRequestDelete,
      onOpenPanel,
    },
  });

  team.forEach((member, i) => {
    const angle = TEAM_ANGLES[i % TEAM_ANGLES.length] + Math.floor(i / TEAM_ANGLES.length) * 15;
    const radius = TEAM_RADIUS + Math.floor(i / TEAM_ANGLES.length) * 50;
    const defaultPos = toXY(angle, radius);
    const memberPos = customPositions?.[member.id] ?? { x: defaultPos.x - 28, y: defaultPos.y - 28 };

    nodes.push({
      id: member.id,
      type: "person",
      position: memberPos,
      data: {
        ...member,
        pendingTasks: pendingFor(member.tasks || []),
        onRequestDelete,
        onOpenPanel,
      },
    });

    const managerId = member.reportsTo || ceo.id;
    edges.push({
      id: `e-${managerId}-${member.id}`,
      source: managerId,
      target: member.id,
      type: "deletable",
      style: SOFT_GRAY_EDGE,
    });
  });

  const CLIENT_X = CENTER_X + 500;
  const CLIENT_START_Y = 80;
  const CLIENT_GAP = 160;

  allClients.forEach((client, i) => {
    const defaultPos = { x: CLIENT_X - 30, y: CLIENT_START_Y + i * CLIENT_GAP };
    const clientPos = customPositions?.[client.id] ?? defaultPos;

    nodes.push({
      id: client.id,
      type: "client",
      position: clientPos,
      data: {
        ...client,
        onRequestDelete,
      },
    });

    edges.push({
      id: `e-${ceo.id}-${client.id}`,
      source: ceo.id,
      target: client.id,
      type: "deletable",
      style: SOFT_GRAY_EDGE,
    });
  });

  return { nodes, edges };
}

export function OrgCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const { open: openPanel } = usePersonPanel();

  const onOpenPanel = useCallback((person: Person) => {
    openPanel(person);
  }, [openPanel]);

  // Modal deletion state
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    type: "person" | "client";
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const onRequestDelete = useCallback(
    (target: { id: string; name: string; type: "person" | "client" }) => {
      setDeleteTarget(target);
    },
    [],
  );

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === "person") {
        await deletePersonFromDb(deleteTarget.id);
      } else {
        await deleteClientFromDb(deleteTarget.id);
      }

      // Remove from canvas visually
      setNodes((ns) => ns.filter((n) => n.id !== deleteTarget.id));
      setEdges((es) =>
        es.filter((e) => e.source !== deleteTarget.id && e.target !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch (err) {
      console.error("Error al eliminar nodo:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      // 1. Fetch cached positions from localStorage first (immediate)
      let localPositions: Record<string, { x: number; y: number }> = {};
      try {
        const stored = localStorage.getItem("cart_node_positions") || localStorage.getItem("orbit_node_positions");
        if (stored) localPositions = JSON.parse(stored);
      } catch (e) {
        // ignore
      }

      const [peopleData, clientsData, dbPositions] = await Promise.all([
        getPeople(),
        getClients(),
        getNodePositions(),
      ]);

      const mergedPositions = { ...localPositions, ...dbPositions };
      const graph = buildGraphFromData(peopleData, clientsData, onRequestDelete, mergedPositions, onOpenPanel);
      setNodes(graph.nodes);
      setEdges(graph.edges);
    }
    loadData();
  }, [setNodes, setEdges, onRequestDelete, onOpenPanel]);

  // Previous position of the node being dragged — used to compute per-tick deltas.
  const dragPrev = useRef<{ id: string; x: number; y: number } | null>(null);

  // Debounced save position timer
  const saveTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  const persistNodePosition = useCallback((id: string, x: number, y: number) => {
    // 1. Instantly persist to localStorage
    try {
      const stored = localStorage.getItem("cart_node_positions");
      const current = stored ? JSON.parse(stored) : {};
      current[id] = { x, y };
      localStorage.setItem("cart_node_positions", JSON.stringify(current));
    } catch (e) {
      // ignore
    }

    // 2. Debounce persist to Supabase
    if (saveTimeoutRef.current[id]) {
      clearTimeout(saveTimeoutRef.current[id]);
    }
    saveTimeoutRef.current[id] = setTimeout(() => {
      saveNodePositionToDb(id, x, y);
      delete saveTimeoutRef.current[id];
    }, 600);
  }, []);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "deletable",
            style: USER_EDGE_STYLE,
            animated: false,
          },
          eds,
        ),
      ),
    [setEdges],
  );

  // When a node moves, its direct neighbors follow with a pull proportional
  // to the dragged node's degree. A node with 1 connection barely pulls;
  // a well-connected one (CEO) drags the whole cluster.
  const onNodeDrag: OnNodeDrag = useCallback(
    (_event, node) => {
      const prev = dragPrev.current;
      if (!prev || prev.id !== node.id) {
        dragPrev.current = { id: node.id, x: node.position.x, y: node.position.y };
        return;
      }

      const dx = node.position.x - prev.x;
      const dy = node.position.y - prev.y;
      dragPrev.current = { id: node.id, x: node.position.x, y: node.position.y };
      if (dx === 0 && dy === 0) return;

      const neighbors = new Set<string>();
      let degree = 0;
      for (const e of edges) {
        if (e.source === node.id) {
          neighbors.add(e.target);
          degree++;
        } else if (e.target === node.id) {
          neighbors.add(e.source);
          degree++;
        }
      }
      if (degree === 0) return;

      // Degree → pull factor, saturating around 0.55.
      // 1 conn → 0.10, 3 → 0.27, 6 → 0.42, 10+ → 0.55
      const pull = Math.min(0.55, 1 - Math.exp(-degree / 6));

      setNodes((ns) =>
        ns.map((n) => {
          if (n.id === node.id || !neighbors.has(n.id)) return n;
          return {
            ...n,
            position: {
              x: n.position.x + dx * pull,
              y: n.position.y + dy * pull,
            },
          };
        }),
      );
    },
    [edges, setNodes],
  );

  const onNodeDragStop: OnNodeDrag = useCallback(
    (_event, node) => {
      dragPrev.current = null;
      // Persist node position when drag stops
      persistNodePosition(node.id, node.position.x, node.position.y);
    },
    [persistNodePosition],
  );

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        defaultEdgeOptions={{ type: "deletable" }}
        proOptions={{ hideAttribution: true }}
        connectionLineStyle={{
          stroke: "#D7D7DC",
          strokeWidth: 1.2,
        }}
        connectionRadius={40}
        minZoom={0.4}
        maxZoom={2}
        panOnDrag={[2]}
        panOnScroll
        zoomOnScroll={false}
        nodesDraggable
        nodesConnectable
        nodeDragThreshold={0}
        autoPanOnNodeDrag={false}
        autoPanOnConnect={false}
      >
        <Background
          id="cart-bg"
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1}
          color="var(--border-strong)"
        />
        <Controls
          position="top-left"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          }}
          showInteractive={false}
        />
      </ReactFlow>

      {/* Modal de confirmación para eliminar persona / cliente */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        name={deleteTarget?.name ?? ""}
        type={deleteTarget?.type ?? "person"}
        isLoading={isDeleting}
        onConfirm={onConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
