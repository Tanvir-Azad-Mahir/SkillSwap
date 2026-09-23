import { Globe2, Moon, SunMedium } from "lucide-react";

const languages = ["English", "Bangla", "Hindi", "Spanish", "French"];

const timezones = [
  "Asia/Dhaka",
  "Asia/Kolkata",
  "Asia/Karachi",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
];

export default function PreferencesEditTab({
  preferences,
  setPreferences,
}) {
  const update = (field, value) => {
    setPreferences((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div className="p-5 md:p-8">
      <div className="border-b border-white/10 pb-6">
        <p className="text-[10px] uppercase tracking-[0.17em] text-[#a1a1aa]">
          Preferences
        </p>

        <h2 className="mt-2 text-2xl font-medium tracking-[-0.035em]">
          Personalize your experience
        </h2>
      </div>

      <div className="mt-7 grid gap-6">
        <label>
          <span className="mb-2 flex items-center gap-2 text-xs text-[#a1a1aa]">
            <Globe2 size={14} />
            Language
          </span>

          <select
            value={preferences.language}
            onChange={(event) =>
              update("language", event.target.value)
            }
            className="min-h-11 w-full border border-white/10 bg-[#060807] px-4 text-sm text-white focus:border-[#c7ff39]/45 focus:outline-none"
          >
            {languages.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-2 block text-xs text-[#a1a1aa]">
            Timezone
          </span>

          <select
            value={preferences.timezone}
            onChange={(event) =>
              update("timezone", event.target.value)
            }
            className="min-h-11 w-full border border-white/10 bg-[#060807] px-4 text-sm text-white focus:border-[#c7ff39]/45 focus:outline-none"
          >
            {timezones.map((timezone) => (
              <option key={timezone} value={timezone}>
                {timezone}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="mb-2 block text-xs text-[#a1a1aa]">
            Appearance
          </span>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                value: "dark",
                label: "Dark",
                icon: Moon,
              },
              {
                value: "light",
                label: "Light",
                icon: SunMedium,
              },
              {
                value: "system",
                label: "System",
                icon: Globe2,
              },
            ].map((option) => {
              const Icon = option.icon;
              const active = preferences.theme === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => update("theme", option.value)}
                  className={`flex min-h-20 items-center gap-3 border p-4 text-left transition ${
                    active
                      ? "border-[#c7ff39]/45 bg-[#c7ff39]/[0.05] text-[#c7ff39]"
                      : "border-white/10 bg-[#060807] text-[#a1a1aa] hover:border-white/20 hover:text-white"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.4} />
                  <span className="text-sm font-medium">
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border border-white/[0.08] bg-[#060807] p-4 text-xs leading-6 text-white/40">
          Editing preferences does not restart Profile Setup and does not
          change your <code className="text-white/60">profile_completed</code>{" "}
          status.
        </div>
      </div>
    </div>
  );
}
