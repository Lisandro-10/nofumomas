import { validateSession } from "@/lib/firebase/session.server";
import { adminDb } from "@/lib/firebase/admin";
import WelcomeModal from "./_components/WelcomeModal";

export default async function DashboardPage() {
  const uid = await validateSession();

  const userDoc = await adminDb.collection("users").doc(uid).get();
  const hasSeenWelcome = userDoc.data()?.hasSeenWelcome ?? false;

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="flex items-center justify-between px-10 py-5 border-b border-slate-200 bg-white">
        <h2 className="text-navy text-xl font-bold">No Fumo Más</h2>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-8">
        {/* Contenido del curso — próximamente */}
      </main>

      <WelcomeModal show={!hasSeenWelcome} />
    </div>
  );
}
