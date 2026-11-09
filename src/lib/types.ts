export type Phase = "maduro" | "veterano" | "medio" | "capacitacion";

export type Person = {
  id: string;
  name: string;
  initials: string;
  role: string;
  age: number;
  phase: Phase;
  personality: string;
  emotionality: string;
  potential: { score: number; note: string };
  advantages: string[];
  discomforts: string[];
  functions: string[];
  interests: string[];
  tasks: Task[];
  projects?: string[];
  reportsTo?: string;
  isCeo?: boolean;
  avatarUrl?: string;
};

export type Task = {
  id: string;
  title: string;
  due?: string;
  status: "pendiente" | "en_progreso" | "revision" | "hecho";
};

export type Client = {
  id: string;
  name: string;
  initials: string;
  industry: string;
  status: "activo" | "pausado";
};

export type Project = {
  id: string;
  name: string;
  description: string;
  color: string;
  emoji: string;
  createdAt?: string;
};

export const PHASE_COLORS: Record<
  Phase,
  { color: string; soft: string; label: string }
> = {
  maduro: {
    color: "var(--accent-green)",
    soft: "var(--accent-green-soft)",
    label: "Maduro",
  },
  veterano: {
    color: "var(--accent-blue)",
    soft: "var(--accent-blue-soft)",
    label: "Veterano",
  },
  medio: {
    color: "var(--accent-orange)",
    soft: "var(--accent-orange-soft)",
    label: "Medio",
  },
  capacitacion: {
    color: "var(--accent-pink)",
    soft: "var(--accent-pink-soft)",
    label: "Capacitación",
  },
};
