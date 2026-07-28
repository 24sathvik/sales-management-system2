import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { HelpWidget } from "@/components/help/HelpWidget";
import { TourController } from "@/components/onboarding/TourController";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TourController />
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="hidden md:flex shrink-0">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden">
          <Header />
          <main className="flex-1 p-6 pb-6 w-full max-w-none">
            {children}
          </main>
        </div>
        <HelpWidget />
      </div>
    </>
  );
}
