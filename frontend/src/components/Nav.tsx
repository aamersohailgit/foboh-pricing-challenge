export type View = "build" | "check" | "profiles";

const TABS: { id: View; label: string }[] = [
  { id: "build", label: "Build Profile" },
  { id: "check", label: "Price Checker" },
  { id: "profiles", label: "Profiles" },
];

export function Nav({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-emerald-600 px-2 py-1 text-sm font-bold tracking-tight text-white">
            FOBOH
          </span>
          <span className="text-sm font-medium text-slate-500">Pricing</span>
        </div>
        <nav className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={[
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                view === tab.id ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-100",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
