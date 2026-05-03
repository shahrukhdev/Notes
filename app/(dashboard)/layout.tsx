import React from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import "@yaireo/tagify/dist/tagify.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex-1 flex flex-col">

        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

      </div>

    </div>
  );
}