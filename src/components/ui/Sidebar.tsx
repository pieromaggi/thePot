"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/expenses", label: "Expenses" },
  { href: "/expenses/new", label: "New Expense" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 bg-white border-r border-gray-200 h-screen sticky top-0 flex-col">
      <div className="h-16 px-6 flex items-center border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-semibold">
            PT
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Pot Tracker</p>
            <p className="text-xs text-gray-500">Shared finance</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : item.href === "/expenses/new"
                ? pathname?.startsWith("/expenses/new")
                : pathname?.startsWith(item.href) &&
                  !pathname?.startsWith("/expenses/new");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isActive ? "bg-white" : "bg-blue-500"
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-4 border-t border-gray-200 text-xs text-gray-500">
        Pot Tracker v0.1
      </div>
    </aside>
  );
}
