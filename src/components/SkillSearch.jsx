import {
  useMemo,
  useState,
} from "react";

import {
  Plus,
  Search,
  X,
} from "lucide-react";

export default function SkillSearch({
  skills = [],
  excludedIds = [],
  onSelect,
  placeholder = "Search skills...",
}) {
  const [
    query,
    setQuery,
  ] = useState("");

  const [
    focused,
    setFocused,
  ] = useState(false);

  /* =========================================================
     NORMALIZE EXCLUDED IDS
  ========================================================= */

  const excludedSet =
    useMemo(() => {
      if (
        excludedIds instanceof Set
      ) {
        return excludedIds;
      }

      if (
        Array.isArray(
          excludedIds
        )
      ) {
        return new Set(
          excludedIds
        );
      }

      return new Set();
    }, [excludedIds]);

  /* =========================================================
     CLEAN SKILLS
  ========================================================= */

  const availableSkills =
    useMemo(() => {
      return (
        Array.isArray(skills)
          ? skills
          : []
      )
        .filter(
          (skill) =>
            skill?.id &&
            skill?.name &&
            !excludedSet.has(
              skill.id
            )
        )
        .map(
          (skill) => ({
            ...skill,
            name: String(
              skill.name
            ).trim(),
          })
        )
        .sort(
          (a, b) =>
            a.name.localeCompare(
              b.name,
              undefined,
              {
                sensitivity:
                  "base",
              }
            )
        );
    }, [
      skills,
      excludedSet,
    ]);

  /* =========================================================
     SEARCH
  ========================================================= */

  const matches =
    useMemo(() => {
      const cleanQuery =
        query
          .trim()
          .toLowerCase();

      if (!cleanQuery) {
        return availableSkills.slice(
          0,
          10
        );
      }

      return availableSkills
        .filter(
          (skill) =>
            skill.name
              .toLowerCase()
              .includes(
                cleanQuery
              )
        )
        .sort(
          (a, b) => {
            const aName =
              a.name.toLowerCase();

            const bName =
              b.name.toLowerCase();

            if (
              aName ===
                cleanQuery &&
              bName !==
                cleanQuery
            ) {
              return -1;
            }

            if (
              bName ===
                cleanQuery &&
              aName !==
                cleanQuery
            ) {
              return 1;
            }

            const aStarts =
              aName.startsWith(
                cleanQuery
              );

            const bStarts =
              bName.startsWith(
                cleanQuery
              );

            if (
              aStarts &&
              !bStarts
            ) {
              return -1;
            }

            if (
              !aStarts &&
              bStarts
            ) {
              return 1;
            }

            const aWordStarts =
              aName
                .split(/\s+/)
                .some(
                  (word) =>
                    word.startsWith(
                      cleanQuery
                    )
                );

            const bWordStarts =
              bName
                .split(/\s+/)
                .some(
                  (word) =>
                    word.startsWith(
                      cleanQuery
                    )
                );

            if (
              aWordStarts &&
              !bWordStarts
            ) {
              return -1;
            }

            if (
              !aWordStarts &&
              bWordStarts
            ) {
              return 1;
            }

            return aName.localeCompare(
              bName
            );
          }
        )
        .slice(
          0,
          15
        );
    }, [
      query,
      availableSkills,
    ]);

  /* =========================================================
     SELECT SKILL
  ========================================================= */

  const handleSelect =
    (skill) => {
      if (
        !skill ||
        typeof onSelect !==
          "function"
      ) {
        return;
      }

      onSelect(
        skill
      );

      setQuery("");
      setFocused(
        false
      );
    };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search
          size={18}
          strokeWidth={1.6}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a1a1aa]"
        />

        <input
          type="text"
          value={query}
          placeholder={
            placeholder
          }
          autoComplete="off"
          onFocus={() =>
            setFocused(
              true
            )
          }
          onChange={(
            event
          ) => {
            setQuery(
              event.target.value
            );

            setFocused(
              true
            );
          }}
          onKeyDown={(
            event
          ) => {
            if (
              event.key ===
              "Escape"
            ) {
              setFocused(
                false
              );
            }

            if (
              event.key ===
                "Enter" &&
              matches.length >
                0
            ) {
              event.preventDefault();

              handleSelect(
                matches[0]
              );
            }
          }}
          className="
            min-h-[54px]
            w-full
            border
            border-white/15
            bg-[#060807]
            pl-11
            pr-11
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

        {query && (
          <button
            type="button"
            onMouseDown={(
              event
            ) =>
              event.preventDefault()
            }
            onClick={() => {
              setQuery("");
              setFocused(
                true
              );
            }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-[#737373] transition hover:text-white"
          >
            <X
              size={15}
            />
          </button>
        )}
      </div>

      {focused && (
        <div className="relative z-[9999] mt-2 max-h-[340px] overflow-y-auto border border-white/15 bg-[#0a0d0b] shadow-2xl">
          {matches.length >
          0 ? (
            matches.map(
              (skill) => (
                <button
                  key={
                    skill.id
                  }
                  type="button"
                  onMouseDown={(
                    event
                  ) => {
                    event.preventDefault();
                  }}
                  onClick={() =>
                    handleSelect(
                      skill
                    )
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
                    py-3.5
                    text-left
                    transition
                    last:border-b-0
                    hover:bg-[#c7ff39]/[0.06]
                    focus:bg-[#c7ff39]/[0.06]
                    focus:outline-none
                  "
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#f2f4ef]">
                      {
                        skill.name
                      }
                    </p>
                  </div>

                  <div className="grid h-8 w-8 shrink-0 place-items-center border border-white/10 text-[#a1a1aa] transition group-hover:border-[#c7ff39]/40 group-hover:bg-[#c7ff39]/10 group-hover:text-[#c7ff39]">
                    <Plus
                      size={15}
                      strokeWidth={1.8}
                    />
                  </div>
                </button>
              )
            )
          ) : (
            <div className="px-5 py-7 text-center">
              {availableSkills.length ===
              0 ? (
                <>
                  <p className="text-sm text-[#a1a1aa]">
                    Skills are unavailable right now.
                  </p>

                  <p className="mt-1 text-xs text-white/30">
                    No available skills were received.
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
