"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
} from "motion/react";
import {
  ArrowLeft,
  Camera,
  ChevronDown,
  GitBranch,
  Loader2,
  Plus,
  Sparkles,
  Upload,
  User,
  X,
} from "lucide-react";
import { createPersonInDb, getPeople, getProjects, uploadAvatarToStorage } from "@/lib/supabase";
import { PHASE_COLORS, type Person, type Phase } from "@/lib/types";

interface AddPersonViewProps {
  onBack: () => void;
  onPersonCreated: (person: Person) => void;
}

const COLOR_OPTIONS = [
  { name: "Morado", color: "#6366f1" },
  { name: "Rosa", color: "#ec4899" },
  { name: "Verde", color: "#10b981" },
  { name: "Azul", color: "#3b82f6" },
  { name: "Naranja", color: "#f59e0b" },
  { name: "Oscuro", color: "#18181b" },
];

const PHASE_LIST: { phase: Phase; label: string; color: string }[] = [
  { phase: "maduro", label: "Maduro", color: "var(--accent-green)" },
  { phase: "veterano", label: "Veterano", color: "var(--accent-blue)" },
  { phase: "medio", label: "Medio", color: "var(--accent-orange)" },
  { phase: "capacitacion", label: "Capacitación", color: "var(--accent-pink)" },
];

export function AddPersonView({ onBack, onPersonCreated }: AddPersonViewProps) {
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [role, setRole] = useState("");
  const [entryDate, setEntryDate] = useState("08/11/2026");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[1].color);
  const [phase, setPhase] = useState<Phase>("medio");
  const [personality, setPersonality] = useState("");
  const [emotionality, setEmotionality] = useState("");
  const [potentialScore, setPotentialScore] = useState(75);
  const [potentialNote, setPotentialNote] = useState("Alto · pensamiento estratégico");
  const [advantages, setAdvantages] = useState("");
  const [discomforts, setDiscomforts] = useState("");
  const [reportsTo, setReportsTo] = useState<string>("");

  // Tags interactivos
  const [functionsList, setFunctionsList] = useState<string[]>(["Diseño UI", "Prototipos"]);
  const [functionInput, setFunctionInput] = useState("");
  const [interestsList, setInterestsList] = useState<string[]>(["Fotografía", "Running"]);
  const [interestInput, setInterestInput] = useState("");

  // Proyectos asignados
  const [allProjects, setAllProjects] = useState<string[]>(["Orbit", "Mobile App", "Branding", "Web Platform"]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>(["Orbit"]);

  // Foto / Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    getPeople().then((res) => {
      setPeople(res);
      if (res.length > 0 && !reportsTo) {
        const ceoOrFirst = res.find((p) => p.isCeo) || res[0];
        setReportsTo(ceoOrFirst.id);
      }
    });

    getProjects().then((projs) => {
      if (projs.length > 0) {
        setAllProjects(projs.map((p) => p.name));
      }
    });
  }, []);

  const initials = name.trim()
    ? name
        .trim()
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "CA";

  const handleAddFunction = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && functionInput.trim()) {
      e.preventDefault();
      if (!functionsList.includes(functionInput.trim())) {
        setFunctionsList([...functionsList, functionInput.trim()]);
      }
      setFunctionInput("");
    }
  };

  const handleAddInterest = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && interestInput.trim()) {
      e.preventDefault();
      if (!interestsList.includes(interestInput.trim())) {
        setInterestsList([...interestsList, interestInput.trim()]);
      }
      setInterestInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const id = `p-${Date.now().toString(36)}`;

    let avatarUrl: string | undefined = undefined;
    if (avatarFile) {
      const uploaded = await uploadAvatarToStorage(avatarFile, id);
      if (uploaded) {
        avatarUrl = uploaded;
      }
    }

    const newPersonData: Omit<Person, "tasks"> = {
      id,
      name: name.trim(),
      initials,
      role: role.trim() || "Colaborador",
      age: Number(age) || 28,
      phase,
      personality: personality.trim() || "Analítico, metódico",
      emotionality: emotionality.trim() || "Equilibrada, calma",
      potential: {
        score: Number(potentialScore) || 75,
        note: potentialNote.trim() || "Pensamiento estratégico",
      },
      advantages: advantages
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      discomforts: discomforts
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      functions: functionsList,
      interests: interestsList,
      projects: selectedProjects,
      reportsTo: reportsTo || undefined,
      isCeo: false,
      avatarUrl,
    };

    try {
      const created = await createPersonInDb(newPersonData);
      if (created) {
        onPersonCreated(created);
        onBack();
      }
    } catch (err) {
      console.error("Error al crear persona:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedManager = people.find((p) => p.id === reportsTo);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-bg p-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="max-w-[1020px] mx-auto bg-surface border border-[var(--border)] rounded-2xl p-8 shadow-sm flex flex-col gap-8"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex flex-col gap-1">
            <h1 className="text-[22px] font-bold text-text-primary tracking-tight">
              Agregar una nueva persona
            </h1>
            <p className="text-[13px] text-text-tertiary">
              Vincula esta persona a tu red del equipo
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="h-10 px-5 rounded-xl border border-[var(--border)] text-[13px] font-semibold text-text-secondary hover:bg-surface-2 transition active:scale-95 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSubmitting || !name.trim()}
              onClick={handleSubmit}
              className="h-10 px-6 rounded-xl bg-text-primary text-white text-[13px] font-semibold flex items-center gap-2 hover:opacity-90 active:scale-95 disabled:opacity-50 transition shadow-sm cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando persona...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>Guardar persona</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2 Column Layout exactamente como en la imagen */}
        <div className="grid grid-cols-12 gap-8">
          {/* Columna Izquierda: Avatar, Colores, Fase, Vinculación */}
          <div className="col-span-4 flex flex-col gap-6">
            {/* Avatar Placeholder con opción de subir foto a S3 */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-2 border border-dashed border-[var(--border-strong)] gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-full flex flex-col items-center justify-center border-2 transition cursor-pointer overflow-hidden group relative"
                style={{
                  borderColor: selectedColor,
                  background: `${selectedColor}15`,
                }}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <span
                      className="text-[26px] font-bold"
                      style={{ color: selectedColor }}
                    >
                      {initials}
                    </span>
                    <span className="text-[9px] font-medium text-text-tertiary mt-0.5">
                      Añadir foto
                    </span>
                  </>
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                  <Camera className="w-5 h-5" />
                </div>
              </div>

              {/* Selector de colores */}
              <div className="flex flex-col items-center gap-1.5 mt-2">
                <span className="text-[11px] text-text-tertiary">O elige iniciales y color</span>
                <div className="flex items-center gap-2 mt-1">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setSelectedColor(c.color);
                        setAvatarPreview(null);
                        setAvatarFile(null);
                      }}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                        selectedColor === c.color && !avatarPreview ? "scale-125 ring-2 ring-offset-2 ring-accent" : "hover:scale-110"
                      }`}
                      style={{ background: c.color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Selector de Fase actual */}
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-bold text-text-secondary tracking-wide">
                Fase actual
              </label>
              <div className="flex flex-col gap-2">
                {PHASE_LIST.map((p) => {
                  const isSelected = phase === p.phase;
                  return (
                    <button
                      key={p.phase}
                      type="button"
                      onClick={() => setPhase(p.phase)}
                      className={`h-11 px-4 rounded-xl border flex items-center justify-between text-left transition cursor-pointer ${
                        isSelected
                          ? "bg-accent-soft/30 border-accent text-text-primary font-bold shadow-xs"
                          : "bg-surface border-[var(--border)] text-text-secondary hover:bg-surface-2"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: p.color }}
                        />
                        <span className="text-[13px]">{p.label}</span>
                      </div>
                      {isSelected && <span className="text-accent text-[14px]">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vincular en la red */}
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-bold text-text-secondary tracking-wide flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-accent" />
                Vincular en la red
              </label>
              <div className="relative">
                <select
                  value={reportsTo}
                  onChange={(e) => setReportsTo(e.target.value)}
                  className="w-full h-11 px-3 text-[13px] rounded-xl border bg-surface text-text-primary focus:outline-none focus:border-accent appearance-none cursor-pointer"
                  style={{ borderColor: "var(--border)" }}
                >
                  <option value="">(Sin supervisor directo - Nodo raíz)</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-text-tertiary absolute right-3 top-3.5 pointer-events-none" />
              </div>
              <span className="text-[11px] text-text-tertiary leading-tight">
                ⓘ Esta persona aparecerá conectada a{" "}
                <strong className="text-text-secondary font-medium">
                  {selectedManager?.name ?? "la raíz"}
                </strong>
                .
              </span>
            </div>
          </div>

          {/* Columna Derecha: Formulario detallado */}
          <div className="col-span-8 flex flex-col gap-6">
            {/* Sección: Datos básicos */}
            <div className="flex flex-col gap-3">
              <h2 className="text-[13px] font-bold text-text-secondary tracking-wide flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-accent" />
                Datos básicos
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-text-tertiary">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. María Fernández"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 px-3.5 text-[13px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-text-tertiary">
                    Edad
                  </label>
                  <input
                    type="number"
                    placeholder="Ej. 28"
                    value={age}
                    onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                    className="h-10 px-3.5 text-[13px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-text-tertiary">
                    Rol / Posición
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Diseñadora Senior"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="h-10 px-3.5 text-[13px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-text-tertiary">
                    Fecha de ingreso
                  </label>
                  <input
                    type="text"
                    placeholder="08/11/2026"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="h-10 px-3.5 text-[13px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>
              </div>
            </div>

            {/* Sección: Perfil personal */}
            <div className="flex flex-col gap-3">
              <h2 className="text-[13px] font-bold text-text-secondary tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-pink)]" />
                Perfil personal
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-text-tertiary">
                    Personalidad
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Analítica, metódica"
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    className="h-10 px-3.5 text-[13px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-text-tertiary">
                    Emocionalidad
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Equilibrada, calma"
                    value={emotionality}
                    onChange={(e) => setEmotionality(e.target.value)}
                    className="h-10 px-3.5 text-[13px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-[12px] font-medium text-text-tertiary">
                    Potencial
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={potentialScore}
                      onChange={(e) => setPotentialScore(Number(e.target.value))}
                      className="h-10 px-3 text-[13px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent"
                      style={{ borderColor: "var(--border)" }}
                    />
                    <input
                      type="text"
                      value={potentialNote}
                      onChange={(e) => setPotentialNote(e.target.value)}
                      className="col-span-3 h-10 px-3.5 text-[13px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent"
                      style={{ borderColor: "var(--border)" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sección: Fortalezas e incomodidades */}
            <div className="flex flex-col gap-3">
              <h2 className="text-[13px] font-bold text-text-secondary tracking-wide">
                ⚖ Fortalezas e incomodidades
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-text-tertiary">
                    Ventajas
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Una línea por ventaja..."
                    value={advantages}
                    onChange={(e) => setAdvantages(e.target.value)}
                    className="p-3 text-[12px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent resize-none leading-relaxed"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-text-tertiary">
                    Incomodidades / lo que no le gusta
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Una línea por incomodidad..."
                    value={discomforts}
                    onChange={(e) => setDiscomforts(e.target.value)}
                    className="p-3 text-[12px] rounded-xl border bg-surface-2 text-text-primary focus:outline-none focus:border-accent resize-none leading-relaxed"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>
              </div>
            </div>

            {/* Sección: Funciones e intereses */}
            <div className="flex flex-col gap-3">
              <h2 className="text-[13px] font-bold text-text-secondary tracking-wide">
                🗂 Funciones e intereses
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {/* Funciones */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-text-tertiary">
                    Funciones (añade con enter)
                  </label>
                  <div
                    className="min-h-[44px] p-1.5 rounded-xl border bg-surface-2 flex flex-wrap items-center gap-1.5"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {functionsList.map((f) => (
                      <span
                        key={f}
                        className="h-7 px-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 text-[11px] font-semibold flex items-center gap-1"
                      >
                        {f}
                        <button
                          type="button"
                          onClick={() => setFunctionsList(functionsList.filter((item) => item !== f))}
                          className="hover:opacity-75"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="Escribe y pulsa enter..."
                      value={functionInput}
                      onChange={(e) => setFunctionInput(e.target.value)}
                      onKeyDown={handleAddFunction}
                      className="flex-1 min-w-[120px] h-7 px-2 text-[12px] bg-transparent text-text-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Intereses */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-text-tertiary">
                    Intereses personales
                  </label>
                  <div
                    className="min-h-[44px] p-1.5 rounded-xl border bg-surface-2 flex flex-wrap items-center gap-1.5"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {interestsList.map((i) => (
                      <span
                        key={i}
                        className="h-7 px-2.5 rounded-lg bg-pink-50 border border-pink-200 text-pink-600 text-[11px] font-semibold flex items-center gap-1"
                      >
                        {i}
                        <button
                          type="button"
                          onClick={() => setInterestsList(interestsList.filter((item) => item !== i))}
                          className="hover:opacity-75"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="Añadir interés..."
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyDown={handleAddInterest}
                      className="flex-1 min-w-[100px] h-7 px-2 text-[12px] bg-transparent text-text-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sección: Proyectos asignados */}
            <div className="flex flex-col gap-3">
              <h2 className="text-[13px] font-bold text-text-secondary tracking-wide">
                📁 Proyectos asignados
              </h2>
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
          </div>
        </div>
      </motion.div>
    </div>
  );
}

