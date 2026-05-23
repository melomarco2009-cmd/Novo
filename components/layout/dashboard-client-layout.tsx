"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { GlobalSearch } from "@/components/search/global-search";
import { TooltipProvider } from "@/components/ui/tooltip";

type DashboardClientLayoutProps = {
  children: React.ReactNode;
  userName: string | null | undefined;
  userEmail: string | null | undefined;
  userImage: string | null | undefined;
};

export function DashboardClientLayout({
  children,
  userName,
  userEmail,
  userImage,
}: DashboardClientLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        {/* Desktop Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
        />

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            userName={userName}
            userEmail={userEmail}
            userImage={userImage}
            onSearchOpen={() => setSearchOpen(true)}
            onDesktopToggle={() => setSidebarCollapsed((v) => !v)}
          />
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>

        {/* Global Search */}
        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
    </TooltipProvider>
  );
}
