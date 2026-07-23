import React, { useState } from "react";
import Sidebar from "./Sidebar";
import HeaderNav from "./HeaderNav";
import Footer from "./Footer";

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg flex">

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-[240px]">

        {/* Top navigation bar */}
        <HeaderNav onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 px-6 py-6 max-w-[1280px] mx-auto w-full">
          {children}
        </main>

        {/* Footer */}
        <Footer />

      </div>
    </div>
  );
}
