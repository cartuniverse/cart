export type UserRole =
  | "admin"
  | "director_area"
  | "disenador_ai"
  | "community_manager"
  | "creador_audiovisual";

export type Profile = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  projectName?: string | null;
};

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

export type DailyVideoLog = {
  id: string;
  date: string; // YYYY-MM-DD
  creatorId: string;
  creatorName: string;
  projectName: string;
  formatDisneySub30: number;
  formatDisneyGala: number;
  formatMovimiento: number;
  formatAvatarYapping: number;
  notesDisneySub30: string;
  notesDisneyGala: string;
  notesMovimiento: string;
  notesAvatarYapping: string;
  updatedAt?: string;
};

export type CommunityFormatKey =
  | "historiaOrganica"
  | "historiaProducto"
  | "historiaInteractiva"
  | "feedOrganico"
  | "feedCreativo"
  | "videoTestimonio"
  | "carrusel"
  | "post";

export type DailyCommunityLog = {
  id: string;
  date: string; // YYYY-MM-DD
  cmId: string;
  cmName: string;
  projectName: string;
  formatHistoriaOrganica: number;
  formatHistoriaProducto: number;
  formatHistoriaInteractiva: number;
  formatFeedOrganico: number;
  formatFeedCreativo: number;
  formatVideoTestimonio: number;
  formatCarrusel: number;
  formatPost: number;
  updatedAt?: string;
};

export type DesignerFormatKey =
  | "clHistorias"
  | "clMovimiento"
  | "mtHistorias"
  | "mtCarruseles";

export type DailyDesignLog = {
  id: string;
  date: string; // YYYY-MM-DD
  designerId: string;
  designerName: string;
  formatClHistorias: number;
  formatClMovimiento: number;
  formatMtHistorias: number;
  formatMtCarruseles: number;
  notesClHistorias: string;
  notesClMovimiento: string;
  notesMtHistorias: string;
  notesMtCarruseles: string;
  updatedAt?: string;
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
