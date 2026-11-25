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
import { CommunityDashboardView } from "@/components/views/community-dashboard-view";
import { DesignerDailyView } from "@/components/views/designer-daily-view";
import { DirectorView } from "@/components/views/director-view";
import { AdminCommunityCalendarView } from "@/components/views/admin-community-calendar-view";
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

  // Vista derivada estrictamente del rol del usuario autenticado
  const isDirectorUser =
    profile?.role === "director_area" ||
    profile?.email?.toLowerCase().includes("david.sanchez") ||
    profile?.email?.toLowerCase().includes("david");

  const currentRoleView: "admin" | "audiovisual" | "community" | "designer" | "director" =
    isDirectorUser
      ? "director"
      : profile?.role === "creador_audiovisual"
      ? "audiovisual"
      : profile?.role === "community_manager"
      ? "community"
      : profile?.role === "disenador_ai"
      ? "designer"
      : "admin";

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
      const isDirector =
        p.role === "director_area" ||
        p.email?.toLowerCase().includes("david.sanchez") ||
        p.email?.toLowerCase().includes("david");

      if (isDirector) {
        setActiveNav("seguimiento");
      } else if (
        p.role === "creador_audiovisual" ||
        p.role === "community_manager"
      ) {
        setActiveNav("dashboard");
        if (p.projectName) setActiveProjectName(p.projectName);
      } else if (p.role === "disenador_ai") {
        setActiveNav("plan_continuo");
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
          profile={profile}
          onLogout={handleLogout}
          activeProjectName={activeProjectName}
          onSelectProjectName={(proj) => setActiveProjectName(proj)}
        />

        <main className="flex-1 flex flex-col min-w-0 bg-bg overflow-y-auto">
          <AnimatePresence mode="wait">
          <motion.div
            key={`${currentRoleView}-${activeNav}-${selectedProfilePerson?.id ?? ""}-${isAddingPerson}-${selectedProjectDetail?.id ?? ""}`}
            {...pageTransition}
            className="flex-1 flex flex-col min-h-0 min-w-0 overflow-y-auto"
          >
          {/* Si estamos en la vista de Community Manager */}
          {currentRoleView === "community" ? (
            activeNav === "dashboard" ? (
              <CommunityDashboardView
                cmName={profile.name ? profile.name.split(" ")[0] : "Lizz"}
                onGoToDailyView={() => setActiveNav("diario_hoy")}
              />
            ) : (
              <CommunityDailyView
                initialProjectName={activeProjectName}
                onProjectChange={(proj) => setActiveProjectName(proj)}
              />
            )
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
          ) : currentRoleView === "designer" ? (
            <DesignerDailyView
              designerName={profile.name || "Diseñador"}
              designerEmail={profile.email}
              designerId={profile.id || profile.name?.toLowerCase().replace(/\s+/g, "-") || "designer"}
            />
          ) : currentRoleView === "director" ? (
            <DirectorView
              directorName={profile.name || "David S."}
              directorEmail={profile.email}
            />
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
          ) : activeNav === "admin_calendar_lizz" ? (
            /* Vista Exclusiva Administrador: Calendario Semanal de Lizz con KPIs y evidencias */
            <AdminCommunityCalendarView />
          ) : activeNav === "admin_view_lizz" ? (
            /* Vista de Lizz (Community Manager) para Administrador */
            <CommunityDailyView
              initialProjectName={activeProjectName}
              onProjectChange={(proj) => setActiveProjectName(proj)}
            />
          ) : activeNav === "admin_view_samu" ? (
            /* Vista de Samuel (Diseñador AI) para Administrador */
            <DesignerDailyView
              designerName="Samuel Marín"
              designerEmail="samuel.gaviria@cartuniverse.online"
              designerId="25e540fa-8e36-4dad-a547-4184c305578d"
            />
          ) : activeNav === "admin_view_miguel" ? (
            /* Vista de Miguel (Diseñador AI) para Administrador */
            <DesignerDailyView
              designerName="Miguel Bolívar"
              designerEmail="miguel.bolivar@cartuniverse.online"
              designerId="7ac48bdf-277f-4324-b9e0-934756830dff"
            />
          ) : activeNav === "admin_view_david" ? (
            /* Vista de David (Director Operativo) para Administrador */
            <DirectorView
              directorName="David Sánchez"
              directorEmail="david.sanchez@cartuniverse.online"
            />
          ) : activeNav === "admin_view_andres" ? (
            /* Vista de Andrés (Creador Audiovisual) para Administrador */
            <AudiovisualDailyView currentProjectName={activeProjectName} />
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
