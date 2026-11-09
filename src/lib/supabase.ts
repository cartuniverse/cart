import { createClient } from "@supabase/supabase-js";
import type { Client, Person, Task } from "./types";

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


