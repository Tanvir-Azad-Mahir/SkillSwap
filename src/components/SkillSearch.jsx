import { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";

export default function SkillSearch({
  skills = [],
  excludedIds = new Set(),
  onSelect,
  placeholder = "Search skills...",
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const matches = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    const availableSkills = skills.filter(
      (skill) => !excludedIds.has(skill.id)
    );

    // Show some available skills before typing
    if (!cleanQuery) {
      return availableSkills.slice(0, 8);
    }

    return availableSkills
      .filter((skill) => {
        const name = String(skill.name || "").toLowerCase();
        const description = String(
          skill.description || ""
        ).toLowerCase();

        return (
          name.includes(cleanQuery) ||
          description.includes(cleanQuery)
        );
      })
      .sort((a, b) => {
        const aName = String(a.name || "").toLowerCase();
        const bName = String(b.name || "").toLowerCase();

        // Exact match first
        if (aName === cleanQuery && bName !== cleanQuery) {
          return -1;
        }

        if (bName === cleanQuery && aName !== cleanQuery) {
          return 1;
        }

        // Starts with typed text
        const aStarts = aName.startsWith(cleanQuery);
        const bStarts = bName.startsWith(cleanQuery);

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        // Any word starts with typed text
        const aWordStarts = aName
          .split(/\s+/)
          .some((word) =>
            word.startsWith(cleanQuery)
          );

        const bWordStarts = bName
          .split(/\s+/)
          .some((word) =>
            word.startsWith(cleanQuery)
          );

        if (aWordStarts && !bWordStarts) return -1;
        if (!aWordStarts && bWordStarts) return 1;

        return aName.localeCompare(bName);
      })
      .slice(0, 10);
  }, [query, skills, excludedIds]);

  const handleSelect = (skill) => {
    if (!skill) return;

    onSelect(skill);

    setQuery("");
    setFocused(false);
  };

  return (
    <div className="relative z-50 w-full">
      {/* Search input */}
      <div className="relative">
        <Search
          size={18}
          strokeWidth={1.6}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a1a1aa]"
        />

        <input
          type="text"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={() => {
            setFocused(true);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setFocused(true);
          }}
          onBlur={() => {
            // Gives the suggestion button enough time
            // to receive the click.
            setTimeout(() => {
              setFocused(false);
            }, 200);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setFocused(false);
            }
          }}
          className="
            min-h-[54px]
            w-full
            border
            border-white/15
            bg-[#060807]
            pl-11
            pr-4
            text-sm
            text-[#f2f4ef]
            placeholder:text-white/25
            transition
            hover:border-white/25
            focus:border-[#c7ff39]/70
            focus:outline-none
            focus:ring-1
            focus:ring-[#c7ff39]/30
          "
        />
      </div>

      {/* Suggestions */}
      {focused && (
        <div
          className="
            absolute
            left-0
            right-0
            top-[calc(100%+8px)]
            z-[999]
            max-h-[340px]
            overflow-y-auto
            border
            border-white/15
            bg-[#0a0d0b]
            shadow-2xl
          "
        >
          {matches.length > 0 ? (
            matches.map((skill) => (
              <button
                key={skill.id}
                type="button"
                onMouseDown={(event) => {
                  // Prevent input losing focus before click
                  event.preventDefault();
                }}
                onClick={() =>
                  handleSelect(skill)
                }
                className="
                  group
                  flex
                  w-full
                  items-center
                  justify-between
                  gap-4
                  border-b
                  border-white/[0.07]
                  px-4
                  py-4
                  text-left
                  transition
                  last:border-b-0
                  hover:bg-[#c7ff39]/[0.06]
                  focus:bg-[#c7ff39]/[0.06]
                  focus:outline-none
                "
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#f2f4ef]">
                    {skill.name}
                  </p>

                  {skill.description && (
                    <p className="mt-1 truncate text-xs text-[#a1a1aa]">
                      {skill.description}
                    </p>
                  )}

                  {skill.difficulty_level && (
                    <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-white/30">
                      {skill.difficulty_level}
                    </p>
                  )}
                </div>

                <div
                  className="
                    grid
                    h-8
                    w-8
                    shrink-0
                    place-items-center
                    border
                    border-white/10
                    text-[#a1a1aa]
                    transition
                    group-hover:border-[#c7ff39]/40
                    group-hover:bg-[#c7ff39]/10
                    group-hover:text-[#c7ff39]
                  "
                >
                  <Plus
                    size={15}
                    strokeWidth={1.8}
                  />
                </div>
              </button>
            ))
          ) : (
            <div className="px-5 py-7 text-center">
              {skills.length === 0 ? (
                <>
                  <p className="text-sm text-[#a1a1aa]">
                    Skills are unavailable right now.
                  </p>

                  <p className="mt-1 text-xs text-white/30">
                    Please refresh and try again.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-[#a1a1aa]">
                    No matching skill found.
                  </p>

                  <p className="mt-1 text-xs text-white/30">
                    Try another keyword.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}