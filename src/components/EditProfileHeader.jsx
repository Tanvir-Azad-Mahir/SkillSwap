import { ArrowLeft, BookOpen, GraduationCap, Save, Settings, UserRound } from "lucide-react";

const tabs = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "teaching", label: "Teaching", icon: GraduationCap },
  { id: "learning", label: "Learning", icon: BookOpen },
  { id: "preferences", label: "Preferences", icon: Settings },
];

export default function EditProfileHeader({
  profile,
  activeTab,
  setTab,
  onBack,
  onSave,
  saving,
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#060807]/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[72px] max-w-[1180px] items-center gap-3 px-5 md:px-8 lg:px-10">
        <button
          type="button"
          onClick={onBack}
          className="grid h-10 w-10 shrink-0 place-items-center border border-white/10 text-[#a1a1aa] transition hover:border-white/25 hover:text-white"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={17} strokeWidth={1.5} />
        </button>

        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-sm font-medium">
            {profile?.full_name || "Profile settings"}
          </p>
          <p className="truncate text-[10px] uppercase tracking-[0.13em] text-[#a1a1aa]">
            @{profile?.username || "member"}
          </p>
        </div>

        <nav className="mx-auto hidden items-center gap-1 lg:flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={`inline-flex min-h-10 items-center gap-2 px-3 text-xs transition ${
                  active
                    ? "bg-[#c7ff39]/[0.08] text-[#c7ff39]"
                    : "text-[#a1a1aa] hover:text-white"
                }`}
              >
                <Icon size={14} strokeWidth={1.5} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="ml-auto inline-flex min-h-10 shrink-0 items-center gap-2 bg-[#c7ff39] px-4 text-xs font-semibold text-[#071008] transition hover:bg-[#d4ff66] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={14} strokeWidth={1.7} />
          <span className="hidden sm:inline">
            {saving ? "Saving..." : "Save"}
          </span>
        </button>
      </div>

      <div className="border-t border-white/[0.06] lg:hidden">
        <div className="mx-auto flex max-w-[1180px] overflow-x-auto px-5 md:px-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 border-b px-3 text-xs transition ${
                  active
                    ? "border-[#c7ff39] text-[#c7ff39]"
                    : "border-transparent text-[#a1a1aa]"
                }`}
              >
                <Icon size={13} strokeWidth={1.5} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
