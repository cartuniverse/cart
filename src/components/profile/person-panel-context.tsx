"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { Person, Task } from "@/lib/types";

type PanelCtx = {
  person: Person | null;
  open: (person: Person) => void;
  close: () => void;
  updatePerson: (updates: Partial<Person>) => void;
  addTask: (task: Task) => void;
  updateTaskStatus: (taskId: string, status: Task["status"]) => void;
  deleteTask: (taskId: string) => void;
};

const PersonPanelContext = createContext<PanelCtx>({
  person: null,
  open: () => {},
  close: () => {},
  updatePerson: () => {},
  addTask: () => {},
  updateTaskStatus: () => {},
  deleteTask: () => {},
});

export function usePersonPanel() {
  return useContext(PersonPanelContext);
}

export function PersonPanelProvider({ children }: { children: React.ReactNode }) {
  const [person, setPerson] = useState<Person | null>(null);

  const open = useCallback((p: Person) => setPerson(p), []);
  const close = useCallback(() => setPerson(null), []);

  const updatePerson = useCallback((updates: Partial<Person>) => {
    setPerson((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const addTask = useCallback((task: Task) => {
    setPerson((prev) => {
      if (!prev) return prev;
      return { ...prev, tasks: [task, ...prev.tasks] };
    });
  }, []);

  const updateTaskStatus = useCallback((taskId: string, status: Task["status"]) => {
    setPerson((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
      };
    });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setPerson((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== taskId),
      };
    });
  }, []);

  return (
    <PersonPanelContext.Provider
      value={{ person, open, close, updatePerson, addTask, updateTaskStatus, deleteTask }}
    >
      {children}
    </PersonPanelContext.Provider>
  );
}
