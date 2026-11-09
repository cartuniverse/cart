"use client";

import { useEffect, useState } from "react";
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
import { getPeople, getProjects } from "@/lib/supabase";
import type { Person, Project } from "@/lib/types";

export default function Home() {
  const [activeNav, setActiveNav] = useState<string>("organigrama");
  const [currentTab, setCurrentTab] = useState<"grafo" | "cuadricula">("grafo");
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [selectedProfilePerson, setSelectedProfilePerson] = useState<Person | null>(null);

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

  return (
    <PersonPanelProvider>
      <div className="h-screen w-screen flex overflow-hidden relative">
        <Sidebar activeNav={activeNav} onSelectNav={handleSelectNav} />

        <main className="flex-1 flex flex-col min-w-0 bg-bg">
          {/* Si está en la vista detallada de una persona */}
          {selectedProfilePerson ? (
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
        </main>

        {/* Panel lateral deslizable para el grafo */}
        <PersonSidePanel />
      </div>
    </PersonPanelProvider>
  );
}
