import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";

export const MainLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50 font-sans text-slate-900 antialiased">
      <Header onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden shrink-0 lg:block">
          <Sidebar />
        </div>

        {mobileSidebarOpen ? (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs" onClick={() => setMobileSidebarOpen(false)} />
            <div className="relative z-10 w-64 bg-white shadow-xl">
              <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        ) : null}

        <div className="flex flex-1 flex-col overflow-y-auto bg-slate-50/50">
          <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};
