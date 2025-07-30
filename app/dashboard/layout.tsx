import { Sidebar } from "@/components/ui/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#D3E9D3]">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6 overflow-y-auto w-full">
        {children}
      </main>
    </div>
  );
}