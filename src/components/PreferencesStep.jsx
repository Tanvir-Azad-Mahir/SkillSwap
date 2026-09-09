import { useTheme } from "../lib/ThemeContext";

const selectClass =
  "min-h-[52px] w-full rounded-md border border-white/15 bg-[#060807] px-4 text-[#f2f4ef] transition hover:border-white/25 focus:border-[#c7ff39]/70 focus:outline-none focus:ring-1 focus:ring-[#c7ff39]/30";

export default function PreferencesStep({
  settings,
  setSettings,
}) {
  const { setTheme } = useTheme();

  const update = (field) => (event) => {
    if (field === "theme") {
      setTheme(event.target.value);
    }

    setSettings((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  return (
    <div>
      {/* Heading */}
      <div className="mb-7">
        <p className="text-xs uppercase tracking-[0.18em] text-[#c7ff39]">
          Final step
        </p>

        <h2 className="mt-3 text-2xl font-medium tracking-[-0.035em] md:text-3xl">
          Personalize your experience.
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a1a1aa]">
          Choose your language, timezone and appearance preferences.
          You can change all of these later from your account settings.
        </p>
      </div>

      {/* Preferences */}
      <div className="space-y-6 border border-white/10 bg-[#0a0d0b]/70 p-5 md:p-7">
        {/* Language */}
        <label className="block text-sm font-medium">
          Language

          <select
            value={settings.language}
            onChange={update("language")}
            className={`${selectClass} mt-2`}
          >
            <option value="English">English</option>
            <option value="Bangla">Bangla</option>
          </select>

          <span className="mt-2 block text-xs font-normal leading-5 text-[#a1a1aa]">
            Choose the language you prefer to use across SkillSwap+.
          </span>
        </label>

        {/* Timezone */}
        <label className="block text-sm font-medium">
          Timezone

          <input
            type="text"
            value={settings.timezone}
            onChange={update("timezone")}
            placeholder="Asia/Dhaka"
            className={`${selectClass} mt-2`}
          />

          <span className="mt-2 block text-xs font-normal leading-5 text-[#a1a1aa]">
            Your timezone helps us display mentoring sessions and skill
            exchanges at the correct local time.
          </span>
        </label>

        {/* Theme */}
        <label className="block text-sm font-medium">
          Appearance

          <select
            value={settings.theme}
            onChange={update("theme")}
            className={`${selectClass} mt-2`}
          >
            <option value="dark">Dark</option>
            <option value="system">Use system setting</option>
            <option value="light">Light</option>
          </select>

          <span className="mt-2 block text-xs font-normal leading-5 text-[#a1a1aa]">
            Choose how SkillSwap+ should look on this device.
          </span>
        </label>
      </div>

      {/* Completion message */}
      <div className="mt-6 border border-[#c7ff39]/15 bg-[#c7ff39]/[0.025] p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-[#c7ff39]">
          Almost there
        </p>

        <h3 className="mt-2 text-lg font-medium">
          Your SkillSwap+ profile is ready.
        </h3>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a1a1aa]">
          Finish your profile to save your role, skills and preferences.
          You can update any of this information later.
        </p>
      </div>

      {/* Welcome bonus */}
      <div className="mt-4 flex items-center justify-between gap-5 border border-white/10 bg-[#0a0d0b]/70 p-5">
        <div>
          <p className="text-sm font-medium">
            New member bonus
          </p>

          <p className="mt-1 text-xs leading-5 text-[#a1a1aa]">
            Start exploring SkillSwap+ with your welcome credits.
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-2xl font-medium tracking-[-0.04em] text-[#c7ff39]">
            +100
          </p>

          <p className="text-[10px] uppercase tracking-[0.15em] text-[#a1a1aa]">
            SS Credits
          </p>
        </div>
      </div>
    </div>
  );
}