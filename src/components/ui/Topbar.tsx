import Link from "next/link";

import Input from "./Input";

type TopbarProps = {
  title: string;
  subtitle?: string;
};

export default function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:h-16 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-gray-500">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="hidden md:block">
          <Input
            placeholder="Search..."
            type="search"
            className="w-56"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="h-9 w-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            aria-label="Notifications"
          >
            <span className="text-lg">•</span>
          </button>
          <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
            PT
          </div>
        </div>
      </div>
      <nav className="flex gap-2 md:hidden">
        <Link
          href="/"
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Dashboard
        </Link>
        <Link
          href="/expenses"
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Expenses
        </Link>
        <Link
          href="/expenses/new"
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          New
        </Link>
      </nav>
    </header>
  );
}
