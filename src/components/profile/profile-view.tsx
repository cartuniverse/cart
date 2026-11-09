"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  Brain,
  Briefcase,
  Calendar,
  ChevronRight,
  GitBranch,
  Heart,
  IdCard,
  ListChecks,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Settings,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  Minus,
} from "lucide-react";

import { getPeople } from "@/lib/supabase";
import { PHASE_COLORS, type Person } from "@/lib/types";

type Props = { person: Person };

const STATUS_STYLES: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pendiente: {
    label: "Pendiente",
    color: "var(--text-tertiary)",
    bg: "var(--surface-2)",
  },
  en_progreso: {
    label: "En progreso",
    color: "var(--accent-blue)",
    bg: "var(--accent-blue-soft)",
  },
  revision: {
    label: "Para revisar",
    color: "var(--accent-orange)",
    bg: "var(--accent-orange-soft)",
  },
  hecho: {
    label: "Hecho",
    color: "var(--accent-green)",
    bg: "var(--accent-green-soft)",
  },
};

export function ProfileView({ person }: Props) {
  const [allPeople, setAllPeople] = useState<Person[]>([]);

  useEffect(() => {
    getPeople().then((res) => setAllPeople(res));
  }, []);

  const phase = PHASE_COLORS[person.phase];
  const subordinates = allPeople.filter((t) => t.reportsTo === person.id);
  const manager = person.reportsTo
    ? allPeople.find((p) => p.id === person.reportsTo) ?? null
    : null;
  const pendingCount = person.tasks.filter((t) => t.status !== "hecho").length;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bg">
      {/* Navbar */}
      <header className="h-[72px] shrink-0 bg-surface border-b border-[var(--border)] flex items-center px-7 gap-5">
        <Link
          href="/"
          className="w-9 h-9 rounded-[10px] bg-surface-2 flex items-center justify-center text-text-primary hover:bg-[var(--border)] transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] font-medium text-text-tertiary">
            Mi espacio
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />
          <span className="text-[13px] font-medium text-text-tertiary">
            Organigrama
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />
          <span className="text-[15px] font-semibold text-text-primary">
            {person.name}
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2.5">
          {[Bell, Settings].map((Icon, i) => (
            <button
              key={i}
              className="w-9 h-9 rounded-[10px] bg-surface-2 flex items-center justify-center text-text-secondary hover:bg-[var(--border)]"
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
          <button className="h-9 rounded-[10px] bg-surface border border-[var(--border)] flex items-center gap-1.5 px-3.5 text-[13px] font-semibold text-text-primary">
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </button>
          <button className="h-9 rounded-[10px] bg-text-primary flex items-center gap-1.5 px-3.5 text-[13px] font-semibold text-white">
            <Plus className="w-3.5 h-3.5" />
            Asignar tarea
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex gap-5 p-6">
          {/* LEFT COLUMN */}
          <aside className="w-[320px] shrink-0 flex flex-col gap-4">
            {/* Profile card */}
            <Card>
              <div className="flex items-center justify-between">
                <IconButton>
                  <Star
                    className="w-3 h-3"
                    style={{ color: "var(--accent-orange)" }}
                  />
                </IconButton>
                <IconButton>
                  <MoreHorizontal className="w-3.5 h-3.5 text-text-secondary" />
                </IconButton>
              </div>

              <div
                className="w-[120px] h-[120px] rounded-full mx-auto flex items-center justify-center"
                style={{
                  background: phase.soft,
                  border: `3px solid ${phase.color}`,
                }}
              >
                <span
                  className="font-bold text-[36px]"
                  style={{ color: phase.color }}
                >
                  {person.initials}
                </span>
              </div>

              <div className="flex flex-col items-center gap-1 mt-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[20px] font-bold text-text-primary">
                    {person.name}
                  </span>
                  <BadgeCheck className="w-4 h-4 text-accent" />
                </div>
                <span className="text-[13px] font-medium text-text-tertiary">
                  {person.role} · {person.age} años
                </span>
              </div>

              <div className="flex justify-center gap-1.5">
                <Chip label={phase.label} color={phase.color} bg={phase.soft} />
                <Chip
                  label="Activo"
                  color="var(--accent-green)"
                  bg="var(--accent-green-soft)"
                />
              </div>

              <div className="flex gap-2">
                <Stat
                  value={String(pendingCount)}
                  label="Tareas"
                  color="var(--accent-red)"
                />
                <Stat value="2" label="Proyectos" color="var(--accent)" />
                <Stat value="138" label="Días activo" />
              </div>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader icon={<IdCard className="w-3.5 h-3.5 text-accent" />}>
                DATOS DE CONTACTO
              </CardHeader>
              {[
                { Icon: Mail, text: `${person.id.replace("p-", "")}@cart.co` },
                { Icon: Phone, text: "+57 310 555 8812" },
                { Icon: MapPin, text: "Medellín, Colombia" },
                { Icon: Calendar, text: "Ingresó: 23 jun 2026" },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 text-text-tertiary" />
                  <span className="text-[12px] font-medium text-text-primary truncate">
                    {text}
                  </span>
                </div>
              ))}
            </Card>

            {/* Links */}
            <Card>
              <CardHeader
                icon={<GitBranch className="w-3.5 h-3.5 text-accent" />}
              >
                VÍNCULOS EN LA RED
              </CardHeader>
              {manager && (
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-[12px] font-bold text-white">
                      {manager.initials}
                    </span>
                  </div>
                  <div className="flex-1 leading-tight">
                    <div className="text-[10px] font-semibold text-text-tertiary">
                      Reporta a
                    </div>
                    <Link
                      href={`/person/${manager.id}`}
                      className="text-[13px] font-semibold text-text-primary hover:text-accent"
                    >
                      {manager.name}
                    </Link>
                  </div>
                </div>
              )}

              {subordinates.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-[11px] font-semibold text-text-tertiary">
                    Reportan a {person.name.split(" ")[0]} ({subordinates.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {subordinates.map((s) => {
                      const ph = PHASE_COLORS[s.phase];
                      return (
                        <Link
                          key={s.id}
                          href={`/person/${s.id}`}
                          className="h-[30px] rounded-full bg-surface-2 border border-[var(--border)] flex items-center gap-1.5 px-2.5 pr-3"
                        >
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: ph.color }}
                          >
                            <span className="text-[9px] font-bold text-white">
                              {s.initials}
                            </span>
                          </span>
                          <span className="text-[11px] font-semibold text-text-primary">
                            {s.name}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          </aside>

          {/* RIGHT COLUMN */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {/* Row 1: personality + potential */}
            <div className="flex gap-4">
              <Card className="flex-1">
                <CardHeader
                  icon={
                    <Brain
                      className="w-3.5 h-3.5"
                      style={{ color: "var(--accent-pink)" }}
                    />
                  }
                >
                  PERFIL PERSONAL
                </CardHeader>
                <div className="flex gap-2.5">
                  <MiniStat
                    icon={
                      <Sparkles
                        className="w-3 h-3"
                        style={{ color: "var(--accent)" }}
                      />
                    }
                    label="Personalidad"
                    value={person.personality}
                  />
                  <MiniStat
                    icon={
                      <Heart
                        className="w-3 h-3"
                        style={{ color: "var(--accent-pink)" }}
                      />
                    }
                    label="Emocionalidad"
                    value={person.emotionality}
                  />
                  <MiniStat
                    icon={
                      <Sparkles
                        className="w-3 h-3"
                        style={{ color: phase.color }}
                      />
                    }
                    label="Fase"
                    value={phase.label}
                  />
                </div>
              </Card>

              <Card className="w-[260px]">
                <CardHeader
                  icon={<TrendingUp className="w-3.5 h-3.5 text-accent" />}
                >
                  POTENCIAL
                </CardHeader>
                <div className="flex items-center gap-3">
                  <PotentialRing value={person.potential.score} color={phase.color} bg={phase.soft} />
                  <div className="flex flex-col gap-1">
                    <span className="text-[22px] font-bold text-text-primary leading-none">
                      {person.potential.score}%
                    </span>
                    <span className="text-[11px] font-medium text-text-tertiary leading-tight">
                      {person.potential.note}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Row 2: pros + cons */}
            <div className="flex gap-4">
              <Card className="flex-1">
                <CardHeader
                  icon={
                    <Plus
                      className="w-3.5 h-3.5"
                      style={{ color: "var(--accent-green)" }}
                    />
                  }
                >
                  VENTAJAS
                </CardHeader>
                <BulletList items={person.advantages} color="var(--accent-green)" />
              </Card>
              <Card className="flex-1">
                <CardHeader
                  icon={
                    <Minus
                      className="w-3.5 h-3.5"
                      style={{ color: "var(--accent-pink)" }}
                    />
                  }
                >
                  INCOMODIDADES
                </CardHeader>
                <BulletList items={person.discomforts} color="var(--accent-pink)" />
              </Card>
            </div>

            {/* Functions + Interests */}
            <Card>
              <CardHeader
                icon={
                  <Tag
                    className="w-3.5 h-3.5"
                    style={{ color: "var(--accent-orange)" }}
                  />
                }
              >
                FUNCIONES · INTERESES
              </CardHeader>
              <div className="flex gap-6">
                <div className="flex-1 flex flex-col gap-2">
                  <span className="text-[11px] font-semibold text-text-secondary">
                    Funciones
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {person.functions.map((f) => (
                      <Tagish key={f} label={f} />
                    ))}
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <span className="text-[11px] font-semibold text-text-secondary">
                    Intereses personales
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {person.interests.map((i) => (
                      <span
                        key={i}
                        className="h-[26px] rounded-md px-2.5 flex items-center text-[11px] font-semibold"
                        style={{
                          color: "var(--accent-pink)",
                          background: "var(--accent-pink-soft)",
                        }}
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Tasks */}
            <Card>
              <div className="flex items-center gap-2.5">
                <ListChecks
                  className="w-3.5 h-3.5"
                  style={{ color: "var(--accent-red)" }}
                />
                <span className="text-[10px] font-bold text-text-tertiary tracking-widest">
                  TAREAS QUE LE ASIGNÉ · PROYECTO CART
                </span>
                <span className="h-5 px-2 rounded-full bg-[var(--accent-red)] text-white text-[10px] font-bold flex items-center">
                  {pendingCount}
                </span>
                <div className="flex-1" />
                <button className="h-[30px] px-3 rounded-lg bg-text-primary text-white text-[11px] font-semibold flex items-center gap-1.5">
                  <Plus className="w-3 h-3" />
                  Nueva tarea
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {person.tasks.length === 0 && (
                  <div className="text-[12px] text-text-tertiary py-6 text-center">
                    Sin tareas asignadas.
                  </div>
                )}
                {person.tasks.map((t) => {
                  const s = STATUS_STYLES[t.status];
                  return (
                    <div
                      key={t.id}
                      className="h-14 rounded-xl bg-surface-2 flex items-center px-4 gap-3"
                    >
                      <div className="w-[18px] h-[18px] rounded-[5px] bg-surface border border-[var(--border-strong)]" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-text-primary truncate">
                          {t.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-2.5 h-2.5 text-text-tertiary" />
                          <span className="text-[10px] font-medium text-text-tertiary">
                            {t.due ?? "Sin vencimiento"}
                          </span>
                        </div>
                      </div>
                      <span
                        className="h-6 rounded-md px-2.5 text-[11px] font-semibold flex items-center"
                        style={{ color: s.color, background: s.bg }}
                      >
                        {s.label}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- small building blocks ---------- */

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-surface border border-[var(--border)] p-5 flex flex-col gap-3 ${className}`}
    >
      {children}
    </div>
  );
}

function CardHeader({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-[10px] font-bold text-text-tertiary tracking-widest">
        {children}
      </span>
    </div>
  );
}

function IconButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="w-6 h-6 rounded-lg bg-surface-2 flex items-center justify-center">
      {children}
    </button>
  );
}

function Chip({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span
      className="h-6 rounded-md px-2.5 text-[11px] font-semibold flex items-center"
      style={{ color, background: bg }}
    >
      {label}
    </span>
  );
}

function Stat({
  value,
  label,
  color = "var(--text-primary)",
}: {
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <div className="flex-1 h-16 rounded-xl bg-surface-2 flex flex-col items-center justify-center gap-0.5">
      <span className="text-[18px] font-bold" style={{ color }}>
        {value}
      </span>
      <span className="text-[10px] font-semibold text-text-tertiary">
        {label}
      </span>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex-1 h-[72px] rounded-xl bg-surface-2 p-3 flex flex-col gap-1 justify-center">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] font-semibold text-text-tertiary tracking-wide">
          {label}
        </span>
      </div>
      <span className="text-[14px] font-bold text-text-primary">{value}</span>
    </div>
  );
}

function BulletList({ items, color }: { items: string[]; color: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((t) => (
        <div key={t} className="flex items-start gap-2.5 pt-1">
          <span
            className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
            style={{ background: color }}
          />
          <span className="text-[12px] font-medium text-text-primary leading-snug">
            {t}
          </span>
        </div>
      ))}
    </div>
  );
}

const FUNCTION_COLORS: Record<string, { color: string; bg: string }> = {
  "Contenido": { color: "#3B82F6", bg: "#EFF6FF" },
  "Social media": { color: "#3B82F6", bg: "#EFF6FF" },
  "Branding": { color: "#10B981", bg: "#ECFDF5" },
  "Campañas": { color: "#F59E0B", bg: "#FFFBEB" },
};

function Tagish({ label }: { label: string }) {
  const style = FUNCTION_COLORS[label];
  if (style) {
    return (
      <span
        className="h-[26px] rounded-md px-2.5 flex items-center text-[11px] font-semibold"
        style={{ color: style.color, background: style.bg }}
      >
        {label}
      </span>
    );
  }
  return (
    <span className="h-[26px] rounded-md bg-surface-2 border border-[var(--border)] px-2.5 flex items-center text-[11px] font-semibold text-text-primary">
      {label}
    </span>
  );
}

function PotentialRing({
  value,
  color,
  bg,
}: {
  value: number;
  color: string;
  bg: string;
}) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const filled = (c * value) / 100;
  return (
    <svg width={70} height={70} viewBox="0 0 70 70">
      <circle cx={35} cy={35} r={r} fill="none" stroke={bg} strokeWidth={6} />
      <circle
        cx={35}
        cy={35}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={`${filled} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 35 35)"
      />
    </svg>
  );
}
