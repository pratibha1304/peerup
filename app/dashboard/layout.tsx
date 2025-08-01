import { Sidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6 overflow-y-auto w-full">
        <div className="flex justify-end mb-6">
          <ThemeToggle />
        </div>
        {children}
      </main>
    </div>
  );
}