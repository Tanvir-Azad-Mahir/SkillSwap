import { Search } from "lucide-react";
import { useMemo, useState } from "react";

export default function EditProfileSkillSearch({
  skills = [],
  excludedIds = new Set(),
  onSelect,
  placeholder = "Search skills...",
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    const available = skills.filter((skill) => !excludedIds.has(skill.id));
    const clean = query.trim().toLowerCase();

    if (!clean) return available.slice(0, 8);

    return available
      .filter((skill) => {
        const name = String(skill.name || "").toLowerCase();
        const description = String(skill.description || "").toLowerCase();

        return name.includes(clean) || description.includes(clean);
      })
      .sort((a, b) => {
        const aName = String(a.name || "").toLowerCase();
        const bName = String(b.name || "").toLowerCase();

        const aStarts = aName.startsWith(clean);
        const bStarts = bName.startsWith(clean);

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return aName.localeCompare(bName);
      })
      .slice(0, 10);
  }, [skills, excludedIds, query]);

  const choose = (skill) => {
    onSelect(skill);
    setQuery("");
    setFocused(false);
  };

  return (
    <div className="relative z-30">
      <Search
        size={16}
        strokeWidth={1.5}
        className="pointer-events-none absolute left-3.5 top-3.5 text-[#a1a1aa]"
      />

      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setFocused(true);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setTimeout(() => setFocused(false), 160);
        }}
        placeholder={placeholder}
        autoComplete="off"
        className="min-h-11 w-full border border-white/10 bg-[#060807] pl-10 pr-4 text-sm text-white placeholder:text-white/25 transition focus:border-[#c7ff39]/45 focus:outline-none"
      />

      {focused && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] max-h-72 overflow-y-auto border border-white/15 bg-[#0a0d0b] shadow-2xl">
          {skills.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-[#a1a1aa]">
              Skills are unavailable right now.
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-[#a1a1aa]">
              No matching skill found.
            </div>
          ) : (
            results.map((skill) => (
              <button
                key={skill.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(skill)}
                className="block w-full border-b border-white/[0.06] px-4 py-3 text-left last:border-b-0 hover:bg-[#c7ff39]/[0.05]"
              >
                <p className="text-sm font-medium">{skill.name}</p>

                {skill.description && (
                  <p className="mt-1 truncate text-xs text-[#a1a1aa]">
                    {skill.description}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
