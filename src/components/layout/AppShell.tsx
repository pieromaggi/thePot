import type { ReactNode } from "react";

import Sidebar from "../ui/Sidebar";
import Topbar from "../ui/Topbar";

type AppShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function AppShell({ title, subtitle, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#F7F8FA] text-gray-900 flex flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={title} subtitle={subtitle} />
        <main className="flex-1 px-4 py-4 md:px-8 md:py-6">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
