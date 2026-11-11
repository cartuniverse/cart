import { createClient } from "@supabase/supabase-js";
import type { Client, DailyCommunityLog, DailyDesignLog, DailyVideoLog, Person, Project, Task } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = url && anon ? createClient(url, anon) : null;

export async function getPeople(): Promise<Person[]> {
  if (!supabase) return [];

  try {
    const { data: peopleData, error: peopleError } = await supabase
      .from("people")
      .select("*");

    if (peopleError || !peopleData) {
      console.error("Error fetching people from Supabase:", peopleError);
      return [];
    }

    const { data: tasksData } = await supabase.from("tasks").select("*");

    const tasksByPerson: Record<string, Task[]> = {};
    (tasksData ?? []).forEach((t: any) => {
      if (!tasksByPerson[t.person_id]) tasksByPerson[t.person_id] = [];
      tasksByPerson[t.person_id].push({
        id: t.id,
        title: t.title,
        due: t.due,
        status: t.status,
      });
    });

    const mappedPeople: Person[] = peopleData.map((p: any) => ({
      id: p.id,
      name: p.name,
      initials: p.initials,
      role: p.role,
      age: p.age,
      phase: p.phase,
      personality: p.personality,
      emotionality: p.emotionality,
      potential: {
        score: p.potential_score,
        note: p.potential_note,
      },
      advantages: Array.isArray(p.advantages) ? p.advantages : [],
      discomforts: Array.isArray(p.discomforts) ? p.discomforts : [],
      functions: Array.isArray(p.functions) ? p.functions : [],
      interests: Array.isArray(p.interests) ? p.interests : [],
      tasks: tasksByPerson[p.id] ?? [],
      projects: Array.isArray(p.projects) ? p.projects : (p.projects ? JSON.parse(p.projects) : []),
      reportsTo: p.reports_to ?? undefined,
      isCeo: p.is_ceo ?? false,
      avatarUrl: p.avatar_url ?? undefined,
    }));

    // Cristian (o CEO) siempre debe aparecer de primero
    return mappedPeople.sort((a, b) => {
      const isA = a.isCeo || a.name.toLowerCase().includes("cristian");
      const isB = b.isCeo || b.name.toLowerCase().includes("cristian");
      if (isA && !isB) return -1;
      if (!isA && isB) return 1;
      return 0;
    });
  } catch (err) {
    console.error("Error fetching people from Supabase:", err);
    return [];
  }
}

export async function getPersonById(id: string): Promise<Person | null> {
  const all = await getPeople();
  return all.find((p) => p.id === id) ?? null;
}

export async function getClients(): Promise<Client[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.from("clients").select("*");
    if (error || !data) {
      console.error("Error fetching clients from Supabase:", error);
      return [];
    }

    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      initials: c.initials,
      industry: c.industry,
      status: c.status,
    }));
  } catch (err) {
    console.error("Error fetching clients from Supabase:", err);
    return [];
  }
}

export async function uploadAvatarToStorage(
  file: File,
  personId: string
): Promise<string | null> {
  if (!supabase) return null;
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${personId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading avatar to Supabase Storage:", uploadError.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("Error in uploadAvatarToStorage:", err);
    return null;
  }
}

export async function createPersonInDb(
  person: Omit<Person, "tasks">
): Promise<Person | null> {
  if (!supabase) return null;
  try {
    const dbPayload = {
      id: person.id,
      name: person.name,
      initials: person.initials,
      role: person.role,
      age: person.age,
      phase: person.phase,
      personality: person.personality,
      emotionality: person.emotionality,
      potential_score: person.potential.score,
      potential_note: person.potential.note,
      advantages: person.advantages,
      discomforts: person.discomforts,
      functions: person.functions,
      interests: person.interests,
      projects: person.projects ?? [],
      reports_to: person.reportsTo || null,
      is_ceo: person.isCeo || false,
      avatar_url: person.avatarUrl || null,
    };

    const { data, error } = await supabase
      .from("people")
      .insert(dbPayload)
      .select()
      .single();

    if (error) {
      console.error("Error creating person in Supabase:", error.message);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      initials: data.initials,
      role: data.role,
      age: data.age,
      phase: data.phase,
      personality: data.personality,
      emotionality: data.emotionality,
      potential: {
        score: data.potential_score,
        note: data.potential_note,
      },
      advantages: data.advantages ?? [],
      discomforts: data.discomforts ?? [],
      functions: data.functions ?? [],
      interests: data.interests ?? [],
      projects: Array.isArray(data.projects) ? data.projects : [],
      tasks: [],
      reportsTo: data.reports_to ?? undefined,
      isCeo: data.is_ceo ?? false,
    };
  } catch (err) {
    console.error("Error creating person:", err);
    return null;
  }
}

export async function updatePersonInDb(
  id: string,
  updates: Partial<Omit<Person, "id" | "tasks">>
): Promise<boolean> {
  if (!supabase) return true;
  try {
    const dbPayload: any = {};
    if (updates.name !== undefined) dbPayload.name = updates.name;
    if (updates.initials !== undefined) dbPayload.initials = updates.initials;
    if (updates.role !== undefined) dbPayload.role = updates.role;
    if (updates.age !== undefined) dbPayload.age = updates.age;
    if (updates.phase !== undefined) dbPayload.phase = updates.phase;
    if (updates.personality !== undefined) dbPayload.personality = updates.personality;
    if (updates.emotionality !== undefined) dbPayload.emotionality = updates.emotionality;
    if (updates.potential !== undefined) {
      dbPayload.potential_score = updates.potential.score;
      dbPayload.potential_note = updates.potential.note;
    }
    if (updates.advantages !== undefined) dbPayload.advantages = updates.advantages;
    if (updates.discomforts !== undefined) dbPayload.discomforts = updates.discomforts;
    if (updates.functions !== undefined) dbPayload.functions = updates.functions;
    if (updates.interests !== undefined) dbPayload.interests = updates.interests;
    if (updates.projects !== undefined) dbPayload.projects = updates.projects;
    if (updates.reportsTo !== undefined) dbPayload.reports_to = updates.reportsTo || null;
    if (updates.isCeo !== undefined) dbPayload.is_ceo = updates.isCeo;
    if (updates.avatarUrl !== undefined) dbPayload.avatar_url = updates.avatarUrl || null;

    const { error } = await supabase
      .from("people")
      .update(dbPayload)
      .eq("id", id);

    if (error) {
      console.error("Error updating person in Supabase:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error updating person:", err);
    return false;
  }
}

export async function deletePersonFromDb(id: string): Promise<boolean> {
  if (!supabase) return true;
  try {
    const { error } = await supabase.from("people").delete().eq("id", id);
    if (error) {
      console.error("Error deleting person from Supabase:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error deleting person:", err);
    return false;
  }
}

export async function deleteClientFromDb(id: string): Promise<boolean> {
  if (!supabase) return true;
  try {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) {
      console.error("Error deleting client from Supabase:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error deleting client:", err);
    return false;
  }
}

export async function getNodePositions(): Promise<Record<string, { x: number; y: number }>> {
  if (!supabase) return {};
  try {
    const { data, error } = await supabase.from("node_positions").select("id, x, y");
    if (error || !data) return {};
    const map: Record<string, { x: number; y: number }> = {};
    data.forEach((row: { id: string; x: number; y: number }) => {
      map[row.id] = { x: row.x, y: row.y };
    });
    return map;
  } catch (err) {
    return {};
  }
}

export async function createTaskInDb(
  personId: string,
  title: string,
  due: string | null,
  status: "pendiente" | "en_progreso" | "revision" | "hecho" = "pendiente",
): Promise<Task | null> {
  if (!supabase) return null;
  try {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const { data, error } = await supabase
      .from("tasks")
      .insert({ id, person_id: personId, title, due, status })
      .select()
      .single();

    if (error) {
      console.error("Error creating task:", error.message);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      due: data.due ?? undefined,
      status: data.status,
    };
  } catch (err) {
    console.error("Error creating task:", err);
    return null;
  }
}

export async function updateTaskStatusInDb(
  taskId: string,
  status: "pendiente" | "en_progreso" | "revision" | "hecho",
): Promise<boolean> {
  if (!supabase) return true;
  try {
    const { error } = await supabase
      .from("tasks")
      .update({ status })
      .eq("id", taskId);
    if (error) {
      console.error("Error updating task status:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error updating task status:", err);
    return false;
  }
}

export async function deleteTaskFromDb(taskId: string): Promise<boolean> {
  if (!supabase) return true;
  try {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId);
    if (error) {
      console.error("Error deleting task:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error deleting task:", err);
    return false;
  }
}

export async function saveNodePositionToDb(id: string, x: number, y: number): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from("node_positions").upsert(
      { id, x, y, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );
  } catch (err) {
    console.error("Error saving node position:", err);
  }
}

const DEFAULT_PROJECTS: Project[] = [
  { id: "proj-orbit", name: "Orbit", description: "Plataforma central y arquitectura base", color: "#6366f1", emoji: "🚀" },
  { id: "proj-mobile", name: "Mobile App", description: "Aplicación móvil iOS y Android", color: "#10b981", emoji: "📱" },
  { id: "proj-branding", name: "Branding", description: "Identidad visual, marca y diseño de productos", color: "#f59e0b", emoji: "🎨" },
  { id: "proj-web", name: "Web Platform", description: "Sitio web y suite de herramientas web", color: "#3b82f6", emoji: "🌐" },
];

export async function getProjects(): Promise<Project[]> {
  if (!supabase) {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("cart_projects");
      if (cached) return JSON.parse(cached);
    }
    return DEFAULT_PROJECTS;
  }
  try {
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (error || !data || data.length === 0) {
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("cart_projects");
        if (cached) return JSON.parse(cached);
      }
      return DEFAULT_PROJECTS;
    }
    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      description: d.description || "",
      color: d.color || "#6366f1",
      emoji: d.emoji || "📁",
      createdAt: d.created_at,
    }));
  } catch (err) {
    console.error("Error fetching projects:", err);
    return DEFAULT_PROJECTS;
  }
}

export async function createProjectInDb(project: Omit<Project, "id"> & { id?: string }): Promise<Project | null> {
  const newProj: Project = {
    id: project.id || `proj-${Date.now().toString(36)}`,
    name: project.name,
    description: project.description || "",
    color: project.color || "#6366f1",
    emoji: project.emoji || "📁",
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("cart_projects");
    const list: Project[] = cached ? JSON.parse(cached) : [...DEFAULT_PROJECTS];
    list.unshift(newProj);
    localStorage.setItem("cart_projects", JSON.stringify(list));
  }

  if (supabase) {
    try {
      await supabase.from("projects").insert({
        id: newProj.id,
        name: newProj.name,
        description: newProj.description,
        color: newProj.color,
        emoji: newProj.emoji,
      });
    } catch (e) {
      console.error("Error inserting project in supabase:", e);
    }
  }

  return newProj;
}

export async function deleteProjectFromDb(id: string): Promise<boolean> {
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("cart_projects");
    if (cached) {
      const list: Project[] = JSON.parse(cached);
      localStorage.setItem("cart_projects", JSON.stringify(list.filter((p) => p.id !== id)));
    }
  }

  if (supabase) {
    try {
      await supabase.from("projects").delete().eq("id", id);
    } catch (e) {
      console.error("Error deleting project in supabase:", e);
    }
  }

  return true;
}

// -------------------------------------------------------------
// Funciones para el Módulo Creador Audiovisual AI (Diario de hoy)
// -------------------------------------------------------------

export async function getDailyVideoLog(
  date: string,
  projectName = "Casa Luifer",
  creatorId = "andres-m"
): Promise<DailyVideoLog | null> {
  const localKey = `cart_videolog_${date}_${projectName}_${creatorId}`;

  if (!supabase) {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(localKey);
      if (stored) return JSON.parse(stored);
    }
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("daily_video_logs")
      .select("*")
      .eq("date", date)
      .eq("project_name", projectName)
      .eq("creator_id", creatorId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching daily video log:", error);
    }

    if (data) {
      const log: DailyVideoLog = {
        id: data.id,
        date: data.date,
        creatorId: data.creator_id,
        creatorName: data.creator_name,
        projectName: data.project_name,
        formatDisneySub30: data.format_disney_sub30,
        formatDisneyGala: data.format_disney_gala,
        formatMovimiento: data.format_movimiento,
        formatAvatarYapping: data.format_avatar_yapping,
        notesDisneySub30: data.notes_disney_sub30 || "",
        notesDisneyGala: data.notes_disney_gala || "",
        notesMovimiento: data.notes_movimiento || "",
        notesAvatarYapping: data.notes_avatar_yapping || "",
        updatedAt: data.updated_at,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(localKey, JSON.stringify(log));
      }
      return log;
    }
  } catch (err) {
    console.error("Error in getDailyVideoLog:", err);
  }

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(localKey);
    if (stored) return JSON.parse(stored);
  }

  return null;
}

export async function saveDailyVideoLog(
  log: Omit<DailyVideoLog, "id" | "updatedAt"> & { id?: string }
): Promise<DailyVideoLog> {
  const finalId = log.id || `vlog-${log.date}-${log.creatorId}-${log.projectName}`;
  const now = new Date().toISOString();

  const finalLog: DailyVideoLog = {
    id: finalId,
    date: log.date,
    creatorId: log.creatorId,
    creatorName: log.creatorName,
    projectName: log.projectName,
    formatDisneySub30: log.formatDisneySub30,
    formatDisneyGala: log.formatDisneyGala,
    formatMovimiento: log.formatMovimiento,
    formatAvatarYapping: log.formatAvatarYapping,
    notesDisneySub30: log.notesDisneySub30 || "",
    notesDisneyGala: log.notesDisneyGala || "",
    notesMovimiento: log.notesMovimiento || "",
    notesAvatarYapping: log.notesAvatarYapping || "",
    updatedAt: now,
  };

  const localKey = `cart_videolog_${log.date}_${log.projectName}_${log.creatorId}`;
  if (typeof window !== "undefined") {
    localStorage.setItem(localKey, JSON.stringify(finalLog));

    // Guardar en índice de logs
    const indexKey = "cart_videolog_index";
    const existingIndex: string[] = JSON.parse(localStorage.getItem(indexKey) || "[]");
    if (!existingIndex.includes(localKey)) {
      existingIndex.push(localKey);
      localStorage.setItem(indexKey, JSON.stringify(existingIndex));
    }
  }

  if (supabase) {
    try {
      await supabase.from("daily_video_logs").upsert(
        {
          id: finalId,
          date: log.date,
          creator_id: log.creatorId,
          creator_name: log.creatorName,
          project_name: log.projectName,
          format_disney_sub30: log.formatDisneySub30,
          format_disney_gala: log.formatDisneyGala,
          format_movimiento: log.formatMovimiento,
          format_avatar_yapping: log.formatAvatarYapping,
          notes_disney_sub30: log.notesDisneySub30 || "",
          notes_disney_gala: log.notesDisneyGala || "",
          notes_movimiento: log.notesMovimiento || "",
          notes_avatar_yapping: log.notesAvatarYapping || "",
          updated_at: now,
        },
        { onConflict: "date,creator_id,project_name" }
      );
    } catch (err) {
      console.error("Error upserting daily video log in supabase:", err);
    }
  }

  return finalLog;
}

export async function getWeeklyVideoLogs(
  weekDates: string[], // Array de 5 fechas [lunes..viernes] YYYY-MM-DD
  projectName = "Casa Luifer",
  creatorId = "andres-m"
): Promise<Record<string, DailyVideoLog>> {
  const result: Record<string, DailyVideoLog> = {};

  if (!supabase) {
    if (typeof window !== "undefined") {
      weekDates.forEach((d) => {
        const localKey = `cart_videolog_${d}_${projectName}_${creatorId}`;
        const stored = localStorage.getItem(localKey);
        if (stored) {
          result[d] = JSON.parse(stored);
        }
      });
    }
    return result;
  }

  try {
    const { data, error } = await supabase
      .from("daily_video_logs")
      .select("*")
      .in("date", weekDates)
      .eq("project_name", projectName)
      .eq("creator_id", creatorId);

    if (error) {
      console.error("Error fetching weekly logs:", error);
    } else if (data) {
      data.forEach((d: any) => {
        result[d.date] = {
          id: d.id,
          date: d.date,
          creatorId: d.creator_id,
          creatorName: d.creator_name,
          projectName: d.project_name,
          formatDisneySub30: d.format_disney_sub30,
          formatDisneyGala: d.format_disney_gala,
          formatMovimiento: d.format_movimiento,
          formatAvatarYapping: d.format_avatar_yapping,
          notesDisneySub30: d.notes_disney_sub30 || "",
          notesDisneyGala: d.notes_disney_gala || "",
          notesMovimiento: d.notes_movimiento || "",
          notesAvatarYapping: d.notes_avatar_yapping || "",
          updatedAt: d.updated_at,
        };
      });
    }
  } catch (err) {
    console.error("Error in getWeeklyVideoLogs:", err);
  }

  // Rellenar desde localStorage si falló o falta alguno
  if (typeof window !== "undefined") {
    weekDates.forEach((d) => {
      if (!result[d]) {
        const localKey = `cart_videolog_${d}_${projectName}_${creatorId}`;
        const stored = localStorage.getItem(localKey);
        if (stored) {
          result[d] = JSON.parse(stored);
        }
      }
    });
  }

  return result;
}

export async function getAllVideoLogs(
  projectName = "Casa Luifer",
  creatorId = "andres-m"
): Promise<DailyVideoLog[]> {
  const localList: DailyVideoLog[] = [];
  if (typeof window !== "undefined") {
    const indexKey = "cart_videolog_index";
    const keys: string[] = JSON.parse(localStorage.getItem(indexKey) || "[]");
    keys.forEach((k) => {
      const stored = localStorage.getItem(k);
      if (stored) {
        try {
          localList.push(JSON.parse(stored));
        } catch (e) {}
      }
    });
  }

  if (!supabase) return localList;

  try {
    const { data, error } = await supabase
      .from("daily_video_logs")
      .select("*")
      .eq("project_name", projectName)
      .eq("creator_id", creatorId)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching all video logs:", error);
      return localList;
    }

    if (data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        date: d.date,
        creatorId: d.creator_id,
        creatorName: d.creator_name,
        projectName: d.project_name,
        formatDisneySub30: d.format_disney_sub30,
        formatDisneyGala: d.format_disney_gala,
        formatMovimiento: d.format_movimiento,
        formatAvatarYapping: d.format_avatar_yapping,
        notesDisneySub30: d.notes_disney_sub30 || "",
        notesDisneyGala: d.notes_disney_gala || "",
        notesMovimiento: d.notes_movimiento || "",
        notesAvatarYapping: d.notes_avatar_yapping || "",
        updatedAt: d.updated_at,
      }));
    }
  } catch (err) {
    console.error("Error in getAllVideoLogs:", err);
  }

  return localList;
}

// ==========================================
// REGISTROS DIARIOS DE COMMUNITY MANAGER
// ==========================================

export async function getDailyCommunityLog(
  date: string,
  projectName = "Casa Luifer",
  cmId = "valentina-c"
): Promise<DailyCommunityLog | null> {
  const localKey = `daily_community_log_${date}_${projectName}_${cmId}`;

  // Intentar cargar de localStorage primero como fallback rápido
  let fallbackLog: DailyCommunityLog | null = null;
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(localKey);
    if (stored) {
      try {
        fallbackLog = JSON.parse(stored);
      } catch (e) {}
    }
  }

  if (!supabase) return fallbackLog;

  try {
    const { data, error } = await supabase
      .from("daily_community_logs")
      .select("*")
      .eq("date", date)
      .eq("project_name", projectName)
      .eq("cm_id", cmId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching daily community log:", error);
      return fallbackLog;
    }

    if (data) {
      const log: DailyCommunityLog = {
        id: data.id,
        date: data.date,
        cmId: data.cm_id,
        cmName: data.cm_name,
        projectName: data.project_name,
        formatHistoriaOrganica: data.format_historia_organica ?? 0,
        formatHistoriaProducto: data.format_historia_producto ?? 0,
        formatHistoriaInteractiva: data.format_historia_interactiva ?? 0,
        formatFeedOrganico: data.format_feed_organico ?? 0,
        formatFeedCreativo: data.format_feed_creativo ?? 0,
        formatVideoTestimonio: data.format_video_testimonio ?? 0,
        formatCarrusel: data.format_carrusel ?? 0,
        formatPost: data.format_post ?? 0,
        updatedAt: data.updated_at,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem(localKey, JSON.stringify(log));
      }
      return log;
    }
  } catch (err) {
    console.error("Error in getDailyCommunityLog:", err);
  }

  return fallbackLog;
}

export async function saveDailyCommunityLog(
  log: Omit<DailyCommunityLog, "id" | "updatedAt"> & { id?: string }
): Promise<DailyCommunityLog> {
  const id =
    log.id || `cm_log_${log.date}_${log.projectName}_${log.cmId}`.toLowerCase().replace(/[^a-z0-9_]/g, "_");

  const finalLog: DailyCommunityLog = {
    ...log,
    id,
    updatedAt: new Date().toISOString(),
  };

  const localKey = `daily_community_log_${log.date}_${log.projectName}_${log.cmId}`;

  // Guardar en localStorage inmediatamente
  if (typeof window !== "undefined") {
    localStorage.setItem(localKey, JSON.stringify(finalLog));
    // Guardar en un índice de logs para recuperación
    const indexKey = `daily_community_logs_index_${log.projectName}_${log.cmId}`;
    const keys: string[] = JSON.parse(localStorage.getItem(indexKey) || "[]");
    if (!keys.includes(localKey)) {
      keys.push(localKey);
      localStorage.setItem(indexKey, JSON.stringify(keys));
    }
  }

  if (!supabase) return finalLog;

  try {
    const { data, error } = await supabase
      .from("daily_community_logs")
      .upsert(
        {
          id,
          date: log.date,
          cm_id: log.cmId,
          cm_name: log.cmName,
          project_name: log.projectName,
          format_historia_organica: log.formatHistoriaOrganica,
          format_historia_producto: log.formatHistoriaProducto,
          format_historia_interactiva: log.formatHistoriaInteractiva,
          format_feed_organico: log.formatFeedOrganico,
          format_feed_creativo: log.formatFeedCreativo,
          format_video_testimonio: log.formatVideoTestimonio,
          format_carrusel: log.formatCarrusel,
          format_post: log.formatPost,
          updated_at: finalLog.updatedAt,
        },
        { onConflict: "date,cm_id,project_name" }
      )
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error saving daily community log to Supabase:", error);
      return finalLog;
    }

    if (data) {
      return {
        id: data.id,
        date: data.date,
        cmId: data.cm_id,
        cmName: data.cm_name,
        projectName: data.project_name,
        formatHistoriaOrganica: data.format_historia_organica ?? 0,
        formatHistoriaProducto: data.format_historia_producto ?? 0,
        formatHistoriaInteractiva: data.format_historia_interactiva ?? 0,
        formatFeedOrganico: data.format_feed_organico ?? 0,
        formatFeedCreativo: data.format_feed_creativo ?? 0,
        formatVideoTestimonio: data.format_video_testimonio ?? 0,
        formatCarrusel: data.format_carrusel ?? 0,
        formatPost: data.format_post ?? 0,
        updatedAt: data.updated_at,
      };
    }
  } catch (err) {
    console.error("Error in saveDailyCommunityLog:", err);
  }

  return finalLog;
}

export async function getWeeklyCommunityLogs(
  weekDates: string[],
  projectName = "Casa Luifer",
  cmId = "valentina-c"
): Promise<Record<string, DailyCommunityLog>> {
  const result: Record<string, DailyCommunityLog> = {};

  // Primero poblar desde localStorage
  if (typeof window !== "undefined") {
    weekDates.forEach((d) => {
      const localKey = `daily_community_log_${d}_${projectName}_${cmId}`;
      const stored = localStorage.getItem(localKey);
      if (stored) {
        try {
          result[d] = JSON.parse(stored);
        } catch (e) {}
      }
    });
  }

  if (!supabase || weekDates.length === 0) return result;

  try {
    const { data, error } = await supabase
      .from("daily_community_logs")
      .select("*")
      .in("date", weekDates)
      .eq("project_name", projectName)
      .eq("cm_id", cmId);

    if (error) {
      console.error("Error fetching weekly community logs:", error);
      return result;
    }

    if (data) {
      data.forEach((d: any) => {
        const item: DailyCommunityLog = {
          id: d.id,
          date: d.date,
          cmId: d.cm_id,
          cmName: d.cm_name,
          projectName: d.project_name,
          formatHistoriaOrganica: d.format_historia_organica ?? 0,
          formatHistoriaProducto: d.format_historia_producto ?? 0,
          formatHistoriaInteractiva: d.format_historia_interactiva ?? 0,
          formatFeedOrganico: d.format_feed_organico ?? 0,
          formatFeedCreativo: d.format_feed_creativo ?? 0,
          formatVideoTestimonio: d.format_video_testimonio ?? 0,
          formatCarrusel: d.format_carrusel ?? 0,
          formatPost: d.format_post ?? 0,
          updatedAt: d.updated_at,
        };
        result[d.date] = item;

        if (typeof window !== "undefined") {
          localStorage.setItem(
            `daily_community_log_${d.date}_${projectName}_${cmId}`,
            JSON.stringify(item)
          );
        }
      });
    }
  } catch (err) {
    console.error("Error in getWeeklyCommunityLogs:", err);
  }

  return result;
}

export async function getAllCommunityLogs(
  projectName = "Casa Luifer",
  cmId = "valentina-c"
): Promise<DailyCommunityLog[]> {
  const localList: DailyCommunityLog[] = [];

  if (typeof window !== "undefined") {
    const indexKey = `daily_community_logs_index_${projectName}_${cmId}`;
    const keys: string[] = JSON.parse(localStorage.getItem(indexKey) || "[]");
    keys.forEach((k) => {
      const stored = localStorage.getItem(k);
      if (stored) {
        try {
          localList.push(JSON.parse(stored));
        } catch (e) {}
      }
    });
  }

  if (!supabase) return localList;

  try {
    const { data, error } = await supabase
      .from("daily_community_logs")
      .select("*")
      .eq("project_name", projectName)
      .eq("cm_id", cmId)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching all community logs:", error);
      return localList;
    }

    if (data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        date: d.date,
        cmId: d.cm_id,
        cmName: d.cm_name,
        projectName: d.project_name,
        formatHistoriaOrganica: d.format_historia_organica ?? 0,
        formatHistoriaProducto: d.format_historia_producto ?? 0,
        formatHistoriaInteractiva: d.format_historia_interactiva ?? 0,
        formatFeedOrganico: d.format_feed_organico ?? 0,
        formatFeedCreativo: d.format_feed_creativo ?? 0,
        formatVideoTestimonio: d.format_video_testimonio ?? 0,
        formatCarrusel: d.format_carrusel ?? 0,
        formatPost: d.format_post ?? 0,
        updatedAt: d.updated_at,
      }));
    }
  } catch (err) {
    console.error("Error in getAllCommunityLogs:", err);
  }

  return localList;
}

// ==========================================
// REGISTROS DIARIOS DEL DISEÑADOR AI · PLAN DE DESATRASO
// Alcance: Casa Luifer + Montana (una sola tabla por día/diseñador)
// Tabla Supabase: daily_design_logs
// Clave de conflicto: (date, designer_id)
// ==========================================

export async function getDailyDesignLog(
  date: string,
  designerId = "daniela-s"
): Promise<DailyDesignLog | null> {
  const localKey = `cart_designlog_${date}_${designerId}`;

  if (!supabase) {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(localKey);
      if (stored) return JSON.parse(stored);
    }
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("daily_design_logs")
      .select("*")
      .eq("date", date)
      .eq("designer_id", designerId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching daily design log:", error);
    }

    if (data) {
      const log: DailyDesignLog = {
        id: data.id,
        date: data.date,
        designerId: data.designer_id,
        designerName: data.designer_name,
        formatClHistorias: data.format_cl_historias ?? 0,
        formatClMovimiento: data.format_cl_movimiento ?? 0,
        formatMtHistorias: data.format_mt_historias ?? 0,
        formatMtCarruseles: data.format_mt_carruseles ?? 0,
        notesClHistorias: data.notes_cl_historias || "",
        notesClMovimiento: data.notes_cl_movimiento || "",
        notesMtHistorias: data.notes_mt_historias || "",
        notesMtCarruseles: data.notes_mt_carruseles || "",
        updatedAt: data.updated_at,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(localKey, JSON.stringify(log));
      }
      return log;
    }
  } catch (err) {
    console.error("Error in getDailyDesignLog:", err);
  }

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(localKey);
    if (stored) return JSON.parse(stored);
  }

  return null;
}

export async function saveDailyDesignLog(
  log: Omit<DailyDesignLog, "id" | "updatedAt"> & { id?: string }
): Promise<DailyDesignLog> {
  const finalId = log.id || `dlog-${log.date}-${log.designerId}`;
  const now = new Date().toISOString();

  const finalLog: DailyDesignLog = {
    id: finalId,
    date: log.date,
    designerId: log.designerId,
    designerName: log.designerName,
    formatClHistorias: log.formatClHistorias,
    formatClMovimiento: log.formatClMovimiento,
    formatMtHistorias: log.formatMtHistorias,
    formatMtCarruseles: log.formatMtCarruseles,
    notesClHistorias: log.notesClHistorias || "",
    notesClMovimiento: log.notesClMovimiento || "",
    notesMtHistorias: log.notesMtHistorias || "",
    notesMtCarruseles: log.notesMtCarruseles || "",
    updatedAt: now,
  };

  const localKey = `cart_designlog_${log.date}_${log.designerId}`;
  if (typeof window !== "undefined") {
    localStorage.setItem(localKey, JSON.stringify(finalLog));

    const indexKey = "cart_designlog_index";
    const existingIndex: string[] = JSON.parse(localStorage.getItem(indexKey) || "[]");
    if (!existingIndex.includes(localKey)) {
      existingIndex.push(localKey);
      localStorage.setItem(indexKey, JSON.stringify(existingIndex));
    }
  }

  if (supabase) {
    try {
      await supabase.from("daily_design_logs").upsert(
        {
          id: finalId,
          date: log.date,
          designer_id: log.designerId,
          designer_name: log.designerName,
          format_cl_historias: log.formatClHistorias,
          format_cl_movimiento: log.formatClMovimiento,
          format_mt_historias: log.formatMtHistorias,
          format_mt_carruseles: log.formatMtCarruseles,
          notes_cl_historias: log.notesClHistorias || "",
          notes_cl_movimiento: log.notesClMovimiento || "",
          notes_mt_historias: log.notesMtHistorias || "",
          notes_mt_carruseles: log.notesMtCarruseles || "",
          updated_at: now,
        },
        { onConflict: "date,designer_id" }
      );
    } catch (err) {
      console.error("Error upserting daily design log in supabase:", err);
    }
  }

  return finalLog;
}

export async function getWeeklyDesignLogs(
  weekDates: string[], // L..V (YYYY-MM-DD)
  designerId = "daniela-s"
): Promise<Record<string, DailyDesignLog>> {
  const result: Record<string, DailyDesignLog> = {};

  if (!supabase) {
    if (typeof window !== "undefined") {
      weekDates.forEach((d) => {
        const localKey = `cart_designlog_${d}_${designerId}`;
        const stored = localStorage.getItem(localKey);
        if (stored) result[d] = JSON.parse(stored);
      });
    }
    return result;
  }

  try {
    const { data, error } = await supabase
      .from("daily_design_logs")
      .select("*")
      .in("date", weekDates)
      .eq("designer_id", designerId);

    if (error) {
      console.error("Error fetching weekly design logs:", error);
    } else if (data) {
      data.forEach((d: any) => {
        result[d.date] = {
          id: d.id,
          date: d.date,
          designerId: d.designer_id,
          designerName: d.designer_name,
          formatClHistorias: d.format_cl_historias ?? 0,
          formatClMovimiento: d.format_cl_movimiento ?? 0,
          formatMtHistorias: d.format_mt_historias ?? 0,
          formatMtCarruseles: d.format_mt_carruseles ?? 0,
          notesClHistorias: d.notes_cl_historias || "",
          notesClMovimiento: d.notes_cl_movimiento || "",
          notesMtHistorias: d.notes_mt_historias || "",
          notesMtCarruseles: d.notes_mt_carruseles || "",
          updatedAt: d.updated_at,
        };
      });
    }
  } catch (err) {
    console.error("Error in getWeeklyDesignLogs:", err);
  }

  if (typeof window !== "undefined") {
    weekDates.forEach((d) => {
      if (!result[d]) {
        const localKey = `cart_designlog_${d}_${designerId}`;
        const stored = localStorage.getItem(localKey);
        if (stored) result[d] = JSON.parse(stored);
      }
    });
  }

  return result;
}


