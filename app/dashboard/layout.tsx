"use client";
import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { IncomingCallModal } from "@/components/IncomingCallModal";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Mobile Sidebar - Shown when menu is open */}
      <aside className={`fixed left-0 top-0 h-screen w-64 z-50 transition-transform duration-300 md:hidden bg-card shadow-xl border-r border-border ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <Sidebar />
      </aside>

      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-6 overflow-y-auto w-full min-w-0 max-w-full">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
          <div className="md:ml-auto">
            <ThemeToggle />
          </div>
        </div>
        {children}
      </main>
      <IncomingCallModal />
    </div>
  );
}