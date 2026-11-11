"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { pageTransition } from "@/lib/motion-variants";
import { Navbar } from "@/components/navbar";
import { OrgCanvas } from "@/components/org-canvas";
import { Sidebar } from "@/components/sidebar";
import { PersonPanelProvider } from "@/components/profile/person-panel-context";
import { PersonSidePanel } from "@/components/profile/person-side-panel";
import { GridView } from "@/components/views/grid-view";
import { AddPersonView } from "@/components/views/add-person-view";
import { FullProfileView } from "@/components/views/full-profile-view";
import { AllTasksView } from "@/components/views/all-tasks-view";
import { ProjectsView } from "@/components/views/projects-view";
import { ProjectDetailView } from "@/components/views/project-detail-view";
import { AudiovisualDailyView } from "@/components/views/audiovisual-daily-view";
import { AudiovisualDashboardView } from "@/components/views/audiovisual-dashboard-view";
import { CommunityDailyView } from "@/components/views/community-daily-view";
import { getPeople, getProjects } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { getCurrentProfile, signOut } from "@/lib/auth";
import type { Person, Profile, Project } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeNav, setActiveNav] = useState<string>("dashboard");
  const [currentTab, setCurrentTab] = useState<"grafo" | "cuadricula">("grafo");
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [selectedProfilePerson, setSelectedProfilePerson] = useState<Person | null>(null);

  // Soporte de cambio de rol para probar vistas ("admin" | "audiovisual" | "community")
  const [roleViewOverride, setRoleViewOverride] = useState<
    "admin" | "audiovisual" | "community" | null
  >(null);

  const detectedRole: "admin" | "audiovisual" | "community" =
    profile?.role === "creador_audiovisual"
      ? "audiovisual"
      : profile?.role === "community_manager"
      ? "community"
      : "admin";

  const currentRoleView: "admin" | "audiovisual" | "community" =
    roleViewOverride ?? detectedRole;

  const [activeProjectName, setActiveProjectName] = useState<string>("Casa Luifer");

  useEffect(() => {
    let active = true;

    getCurrentProfile().then((p) => {
      if (!active) return;
      if (!p) {
        router.replace("/login");
        return;
      }
      setProfile(p);
      if (p.role === "creador_audiovisual") {
        setActiveNav("dashboard");
        if (p.projectName) setActiveProjectName(p.projectName);
      } else {
        setActiveNav("organigrama");
      }
      setAuthLoading(false);
    });

    const { data: listener } = supabase?.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace("/login");
    }) ?? { data: { subscription: null } };

    return () => {
      active = false;
      listener?.subscription?.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  // Proyecto seleccionado para ver en detalle
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<Project | null>(null);
  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [availableProjects, setAvailableProjects] = useState<string[]>(["Orbit", "Mobile App", "Branding", "Web Platform"]);

  // Status Emoji toggle (true = on, false = off)
  const [showStatusEmoji, setShowStatusEmoji] = useState(true);

  // Filtro de proyectos en el Navbar
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Key para forzar recarga del canvas cuando se agrega o actualiza alguien
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    getPeople().then((res) => setAllPeople(res));
    getProjects().then((projs) => {
      if (projs.length > 0) {
        setAvailableProjects(projs.map((p) => p.name));
      }
    });
  }, [refreshKey]);

  const handleToggleStatusEmoji = () => {
    setShowStatusEmoji((prev) => !prev);
  };

  const handleSelectNav = (navId: string) => {
    setActiveNav(navId);
    setIsAddingPerson(false);
    setSelectedProfilePerson(null);
    setSelectedProjectDetail(null);
  };

  const handleTabChange = (tab: "grafo" | "cuadricula") => {
    setCurrentTab(tab);
    setIsAddingPerson(false);
    setSelectedProfilePerson(null);
  };

  const handleOpenAddPerson = () => {
    setIsAddingPerson(true);
    setSelectedProfilePerson(null);
  };

  const handleSelectGridPerson = (person: Person) => {
    setSelectedProfilePerson(person);
    setIsAddingPerson(false);
  };

  const handlePersonCreated = (_newPerson: Person) => {
    setRefreshKey((k) => k + 1);
    setIsAddingPerson(false);
    setActiveNav("organigrama");
  };

  const handlePersonUpdated = (updatedPerson: Person) => {
    setSelectedProfilePerson(updatedPerson);
    setRefreshKey((k) => k + 1);
  };

  if (authLoading || !profile) {
    return <div className="h-screen w-screen flex items-center justify-center bg-bg text-text-secondary text-sm">Cargando...</div>;
  }

  return (
    <PersonPanelProvider>
      <div className="h-screen w-screen flex overflow-hidden relative">
        <Sidebar
          activeNav={activeNav}
          onSelectNav={handleSelectNav}
          currentRoleView={currentRoleView}
          onRoleViewChange={(view) => {
            setRoleViewOverride(view);
            if (view === "community" || view === "audiovisual") {
              setActiveNav("diario_hoy");
            } else {
              setActiveNav("organigrama");
            }
          }}
          profile={profile}
          onLogout={handleLogout}
          activeProjectName={activeProjectName}
          onSelectProjectName={(proj) => setActiveProjectName(proj)}
        />

        <main className="flex-1 flex flex-col min-w-0 bg-bg overflow-hidden">
          <AnimatePresence mode="wait">
          <motion.div
            key={`${currentRoleView}-${activeNav}-${selectedProfilePerson?.id ?? ""}-${isAddingPerson}-${selectedProjectDetail?.id ?? ""}`}
            {...pageTransition}
            className="flex-1 flex flex-col min-h-0 min-w-0"
          >
          {/* Si estamos en la vista de Community Manager */}
          {currentRoleView === "community" ? (
            <CommunityDailyView
              initialProjectName={activeProjectName}
              onProjectChange={(proj) => setActiveProjectName(proj)}
            />
          ) : currentRoleView === "audiovisual" ? (
            activeNav === "dashboard" ? (
              <AudiovisualDashboardView
                currentProjectName={activeProjectName}
                creatorName={profile.name}
                onGoToDailyView={() => setActiveNav("diario_hoy")}
              />
            ) : (
              <AudiovisualDailyView currentProjectName={activeProjectName} />
            )
          ) : selectedProfilePerson ? (
            <FullProfileView
              person={selectedProfilePerson}
              onBack={() => setSelectedProfilePerson(null)}
              onPersonUpdated={handlePersonUpdated}
            />
          ) : isAddingPerson ? (
            /* Si está en el formulario de agregar persona */
            <div className="flex-1 flex flex-col min-h-0">
              <Navbar
                currentTab={currentTab}
                onTabChange={handleTabChange}
                onAddPerson={handleOpenAddPerson}
                showStatusEmoji={showStatusEmoji}
                onToggleStatusEmoji={handleToggleStatusEmoji}
                selectedProject={selectedProject}
                onSelectProject={setSelectedProject}
                availableProjects={availableProjects}
              />
              <AddPersonView
                onBack={() => setIsAddingPerson(false)}
                onPersonCreated={handlePersonCreated}
              />
            </div>
          ) : activeNav === "tareas" ? (
            /* Vista de todas las tareas asignadas agrupadas por persona */
            <AllTasksView onSelectPerson={handleSelectGridPerson} />
          ) : activeNav === "proyectos" ? (
            /* Vista de proyectos o detalle de un proyecto */
            selectedProjectDetail ? (
              <ProjectDetailView
                project={selectedProjectDetail}
                allPeople={allPeople}
                onBack={() => setSelectedProjectDetail(null)}
                onSelectPerson={handleSelectGridPerson}
                onProjectDeleted={() => {
                  setSelectedProjectDetail(null);
                  setRefreshKey((k) => k + 1);
                }}
              />
            ) : (
              <ProjectsView
                onSelectProject={(proj) => setSelectedProjectDetail(proj)}
              />
            )
          ) : (
            /* Vista estándar de Organigrama: Grafo o Cuadrícula */
            <div className="flex-1 flex flex-col min-h-0">
              <Navbar
                currentTab={currentTab}
                onTabChange={handleTabChange}
                onAddPerson={handleOpenAddPerson}
                showStatusEmoji={showStatusEmoji}
                onToggleStatusEmoji={handleToggleStatusEmoji}
                selectedProject={selectedProject}
                onSelectProject={setSelectedProject}
                availableProjects={availableProjects}
              />
              <div className="flex-1 min-h-0 relative">
                {currentTab === "grafo" ? (
                  <OrgCanvas
                    key={`${refreshKey}-${selectedProject}-${showStatusEmoji}`}
                    selectedProject={selectedProject}
                    showStatusEmoji={showStatusEmoji}
                  />
                ) : (
                  <GridView
                    key={`${refreshKey}-${selectedProject}`}
                    onSelectPerson={handleSelectGridPerson}
                    onAddPerson={handleOpenAddPerson}
                  />
                )}
              </div>
            </div>
          )}
          </motion.div>
          </AnimatePresence>
        </main>

        {/* Panel lateral deslizable para el grafo */}
        <PersonSidePanel />
      </div>
    </PersonPanelProvider>
  );
}
