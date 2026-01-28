import Input from "./Input";

type TopbarProps = {
  title: string;
  subtitle?: string;
};

export default function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-gray-500">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:block">
          <Input
            placeholder="Search..."
            type="search"
            className="w-56"
          />
        </div>
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
    </header>
  );
}
