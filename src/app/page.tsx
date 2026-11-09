"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { OrgCanvas } from "@/components/org-canvas";
import { Sidebar } from "@/components/sidebar";
import { PersonPanelProvider } from "@/components/profile/person-panel-context";
import { PersonSidePanel } from "@/components/profile/person-side-panel";
import { GridView } from "@/components/views/grid-view";
import { AddPersonView } from "@/components/views/add-person-view";
import { FullProfileView } from "@/components/views/full-profile-view";
import { AllTasksView } from "@/components/views/all-tasks-view";
import type { Person } from "@/lib/types";

export default function Home() {
  const [activeNav, setActiveNav] = useState<string>("organigrama");
  const [currentTab, setCurrentTab] = useState<"grafo" | "cuadricula">("grafo");
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [selectedProfilePerson, setSelectedProfilePerson] = useState<Person | null>(null);

  // Key para forzar recarga del canvas cuando se agrega o actualiza alguien
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectNav = (navId: string) => {
    setActiveNav(navId);
    setIsAddingPerson(false);
    setSelectedProfilePerson(null);
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
              />
              <AddPersonView
                onBack={() => setIsAddingPerson(false)}
                onPersonCreated={handlePersonCreated}
              />
            </div>
          ) : activeNav === "tareas" ? (
            /* Vista de todas las tareas asignadas agrupadas por persona */
            <AllTasksView onSelectPerson={handleSelectGridPerson} />
          ) : (
            /* Vista estándar de Organigrama: Grafo o Cuadrícula */
            <div className="flex-1 flex flex-col min-h-0">
              <Navbar
                currentTab={currentTab}
                onTabChange={handleTabChange}
                onAddPerson={handleOpenAddPerson}
              />
              <div className="flex-1 min-h-0 relative">
                {currentTab === "grafo" ? (
                  <OrgCanvas key={refreshKey} />
                ) : (
                  <GridView
                    key={refreshKey}
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
