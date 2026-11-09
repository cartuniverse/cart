import { Suspense } from "react";
import { notFound } from "next/navigation";

import { Sidebar } from "@/components/sidebar";
import { ProfileView } from "@/components/profile/profile-view";
import { getPersonById } from "@/lib/supabase";

async function PersonProfileContent({ idPromise }: { idPromise: Promise<string> }) {
  const id = await idPromise;
  const person = await getPersonById(id);
  if (!person) notFound();
  return <ProfileView person={person} />;
}

export default function PersonPage({ params }: PageProps<"/person/[id]">) {
  const idPromise = params.then((p) => p.id);

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      <Sidebar />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center bg-bg text-text-tertiary text-sm">
            Cargando perfil...
          </div>
        }
      >
        <PersonProfileContent idPromise={idPromise} />
      </Suspense>
    </div>
  );
}
