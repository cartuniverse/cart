"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Camera, Loader2, UserCheck, X } from "lucide-react";
import { getProjects, updatePersonInDb, uploadAvatarToStorage } from "@/lib/supabase";
import type { Person, Phase } from "@/lib/types";

interface EditPersonModalProps {
  isOpen: boolean;
  person: Person;
  onClose: () => void;
  onPersonUpdated: (updates: Partial<Person>) => void;
}

export function EditPersonModal({
  isOpen,
  person,
  onClose,
  onPersonUpdated,
}: EditPersonModalProps) {
  const [name, setName] = useState(person.name);
  const [initials, setInitials] = useState(person.initials);
  const [role, setRole] = useState(person.role);
  const [age, setAge] = useState(person.age);
  const [phase, setPhase] = useState<Phase>(person.phase);
  const [personality, setPersonality] = useState(person.personality);
  const [emotionality, setEmotionality] = useState(person.emotionality);
  const [potentialScore, setPotentialScore] = useState(person.potential.score);
  const [potentialNote, setPotentialNote] = useState(person.potential.note);
  const [advantages, setAdvantages] = useState(person.advantages.join("\n"));
  const [discomforts, setDiscomforts] = useState(person.discomforts.join("\n"));
  const [functions, setFunctions] = useState(person.functions.join(", "));
  const [interests, setInterests] = useState(person.interests.join(", "));
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(person.avatarUrl);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Proyectos
  const [allProjects, setAllProjects] = useState<string[]>(["Orbit", "Mobile App", "Branding", "Web Platform"]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>(person.projects ?? []);

  useEffect(() => {
    getProjects().then((projs) => {
      if (projs.length > 0) {
        setAllProjects(projs.map((p) => p.name));
      }
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);

    let finalAvatarUrl = avatarUrl;
    if (imageFile) {
      const uploadedUrl = await uploadAvatarToStorage(imageFile, person.id);
      if (uploadedUrl) {
        finalAvatarUrl = uploadedUrl;
      }
    }

    const parsedAdvantages = advantages
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedDiscomforts = discomforts
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedFunctions = functions
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedInterests = interests
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const updates: Partial<Person> = {
      name: name.trim(),
      initials: initials.trim() || name.slice(0, 2).toUpperCase(),
      role: role.trim(),
      age: Number(age) || person.age,
      phase,
      personality: personality.trim(),
      emotionality: emotionality.trim(),
      potential: {
        score: Number(potentialScore) || person.potential.score,
        note: potentialNote.trim(),
      },
      advantages: parsedAdvantages,
      discomforts: parsedDiscomforts,
      functions: parsedFunctions,
      interests: parsedInterests,
      projects: selectedProjects,
      avatarUrl: finalAvatarUrl,
    };

    try {
      const ok = await updatePersonInDb(person.id, updates);
      if (ok) {
        onPersonUpdated(updates);
        onClose();
      }
    } catch (err) {
      console.error("Error al actualizar persona:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          {/* Backdrop con blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal animado al centro */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 320 }}
            className="relative w-full max-w-[560px] max-h-[85vh] rounded-2xl bg-surface border border-[var(--border)] shadow-2xl z-10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-surface">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-text-primary">
                    Modificar Información
                  </h3>
                  <p className="text-[12px] text-text-tertiary">
                    Actualizar los datos de {person.name} en Supabase
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-text-tertiary hover:text-text-primary transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulario con scroll */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {/* Selector de Foto / Avatar */}
              <div className="flex items-center gap-4 p-3.5 rounded-xl bg-surface-2 border border-[var(--border)]">
                <div className="relative w-14 h-14 rounded-full bg-surface border border-[var(--border-strong)] overflow-hidden flex items-center justify-center shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[18px] font-bold text-text-primary">
                      {initials || "CA"}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-[12px] font-semibold text-text-primary">Foto de perfil</span>
                  <span className="text-[11px] text-text-tertiary">
                    Sube una imagen para almacenarla en el Storage de Supabase (S3)
                  </span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 px-3 rounded-lg bg-surface border border-[var(--border)] text-[12px] font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-2 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Cambiar foto
                </button>
              </div>

              {/* Bloque 1: Datos principales */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-text-secondary">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 px-3 text-[13px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-text-secondary">
                      Iniciales
                    </label>
                    <input
                      type="text"
                      maxLength={3}
                      value={initials}
                      onChange={(e) => setInitials(e.target.value.toUpperCase())}
                      className="h-9 px-3 text-[13px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent uppercase"
                      style={{ borderColor: "var(--border)" }}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-text-secondary">
                      Edad
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="h-9 px-3 text-[13px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent"
                      style={{ borderColor: "var(--border)" }}
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 2: Rol y Fase */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-text-secondary">
                    Cargo / Rol
                  </label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="h-9 px-3 text-[13px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-text-secondary">
                    Fase
                  </label>
                  <select
                    value={phase}
                    onChange={(e) => setPhase(e.target.value as Phase)}
                    className="h-9 px-3 text-[13px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent cursor-pointer"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <option value="maduro">Maduro</option>
                    <option value="veterano">Veterano</option>
                    <option value="medio">Medio</option>
                    <option value="capacitacion">Capacitación</option>
                  </select>
                </div>
              </div>

              {/* Bloque 3: Personalidad y Emocionalidad */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-text-secondary">
                    Personalidad
                  </label>
                  <input
                    type="text"
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    className="h-9 px-3 text-[13px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-text-secondary">
                    Emocionalidad
                  </label>
                  <input
                    type="text"
                    value={emotionality}
                    onChange={(e) => setEmotionality(e.target.value)}
                    className="h-9 px-3 text-[13px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>
              </div>

              {/* Bloque 4: Potencial */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5 col-span-1">
                  <label className="text-[12px] font-semibold text-text-secondary">
                    Potencial (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={potentialScore}
                    onChange={(e) => setPotentialScore(Number(e.target.value))}
                    className="h-9 px-3 text-[13px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-[12px] font-semibold text-text-secondary">
                    Nota de potencial
                  </label>
                  <input
                    type="text"
                    value={potentialNote}
                    onChange={(e) => setPotentialNote(e.target.value)}
                    className="h-9 px-3 text-[13px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>
              </div>

              {/* Bloque 5: Ventajas e Incomodidades (1 por línea) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-text-secondary">
                    Ventajas (una por línea)
                  </label>
                  <textarea
                    rows={3}
                    value={advantages}
                    onChange={(e) => setAdvantages(e.target.value)}
                    className="p-2.5 text-[12px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent resize-none leading-relaxed"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-text-secondary">
                    Incomodidades (una por línea)
                  </label>
                  <textarea
                    rows={3}
                    value={discomforts}
                    onChange={(e) => setDiscomforts(e.target.value)}
                    className="p-2.5 text-[12px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent resize-none leading-relaxed"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>
              </div>

              {/* Bloque 6: Funciones e Intereses (separados por coma) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-text-secondary">
                  Funciones (separadas por coma)
                </label>
                <input
                  type="text"
                  placeholder="ej. UI, Design System, Research"
                  value={functions}
                  onChange={(e) => setFunctions(e.target.value)}
                  className="h-9 px-3 text-[13px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-text-secondary">
                  Intereses (separados por coma)
                </label>
                <input
                  type="text"
                  placeholder="ej. Ajedrez, Correr, Lectura"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  className="h-9 px-3 text-[13px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>

              {/* Proyectos asignados */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-text-secondary">
                  📁 Proyectos asignados
                </label>
                <div className="flex flex-wrap gap-2">
                  {allProjects.map((proj) => {
                    const isSelected = selectedProjects.includes(proj);
                    return (
                      <button
                        type="button"
                        key={proj}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedProjects(selectedProjects.filter((p) => p !== proj));
                          } else {
                            setSelectedProjects([...selectedProjects, proj]);
                          }
                        }}
                        className={`h-8 px-3 rounded-lg text-[12px] font-medium border flex items-center gap-1.5 transition cursor-pointer ${
                          isSelected
                            ? "bg-text-primary text-white border-text-primary shadow-xs"
                            : "bg-surface-2 text-text-secondary border-border hover:border-text-tertiary"
                        }`}
                      >
                        <span>{proj}</span>
                        {isSelected ? <span>✓</span> : <span>+</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>

            {/* Footer con acciones */}
            <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-2.5 bg-surface shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 text-[13px] font-medium rounded-xl text-text-secondary hover:bg-surface-2 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting || !name.trim()}
                onClick={handleSubmit}
                className="h-9 px-5 text-[13px] font-semibold rounded-xl bg-accent text-white flex items-center gap-2 hover:opacity-90 active:scale-95 disabled:opacity-50 transition shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando cambios...</span>
                  </>
                ) : (
                  <span>Guardar cambios</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

