import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  Loader2,
  Search,
  UserRound,
  X,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabase";

function getProfileName(profile) {
  return (
    profile?.full_name ||
    profile?.username ||
    "SkillSwap member"
  );
}

function normalizeRole(value) {
  return String(
    value || "member"
  )
    .trim()
    .replace(
      /[_-]+/g,
      " "
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

export default function SearchSkillsProfiles({
  placeholder = "Search skills or people...",
  maxSkillResults = 8,
  maxProfileResults = 8,
}) {
  const navigate =
    useNavigate();

  const [
    query,
    setQuery,
  ] =
    useState("");

  const [
    focused,
    setFocused,
  ] =
    useState(false);

  const [
    skills,
    setSkills,
  ] =
    useState([]);

  const [
    profiles,
    setProfiles,
  ] =
    useState([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  /* =========================================================
     LOAD SKILLS + PROFILES
  ========================================================= */

  useEffect(() => {
    let cancelled =
      false;

    const loadSearchData =
      async () => {
        try {
          setLoading(
            true
          );

          setError("");

          const [
            skillsResult,
            profilesResult,
          ] =
            await Promise.all([
              supabase
                .from(
                  "skills"
                )
                .select(
                  `
                    id,
                    name,
                    category_id
                  `
                )
                .order(
                  "name",
                  {
                    ascending:
                      true,
                  }
                ),

              supabase
                .from(
                  "profiles"
                )
                .select(
                  `
                    id,
                    username,
                    full_name,
                    avatar_url,
                    role,
                    is_active
                  `
                )
                .eq(
                  "is_active",
                  true
                ),
            ]);

          if (
            skillsResult.error
          ) {
            throw skillsResult.error;
          }

          if (
            profilesResult.error
          ) {
            throw profilesResult.error;
          }

          if (cancelled) {
            return;
          }

          setSkills(
            skillsResult.data ||
              []
          );

          setProfiles(
            (
              profilesResult.data ||
              []
            ).filter(
              (profile) =>
                profile?.username
            )
          );
        } catch (err) {
          console.error(
            "DASHBOARD SEARCH LOAD ERROR:",
            err
          );

          if (!cancelled) {
            setError(
              err?.message ||
                "Search data could not be loaded."
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(
              false
            );
          }
        }
      };

    loadSearchData();

    return () => {
      cancelled =
        true;
    };
  }, []);

  /* =========================================================
     SEARCH
  ========================================================= */

  const cleanQuery =
    query
      .trim()
      .toLowerCase();

  const skillMatches =
    useMemo(() => {
      if (
        !cleanQuery
      ) {
        return [];
      }

      return skills
        .filter(
          (skill) =>
            skill?.id &&
            skill?.name
        )
        .map(
          (skill) => ({
            ...skill,
            name: String(
              skill.name
            ).trim(),
          })
        )
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

            return aName.localeCompare(
              bName
            );
          }
        )
        .slice(
          0,
          maxSkillResults
        );
    }, [
      cleanQuery,
      maxSkillResults,
      skills,
    ]);

  const profileMatches =
    useMemo(() => {
      if (
        !cleanQuery
      ) {
        return [];
      }

      return profiles
        .filter(
          (profile) => {
            const fullName =
              String(
                profile?.full_name ||
                  ""
              ).toLowerCase();

            const username =
              String(
                profile?.username ||
                  ""
              ).toLowerCase();

            return (
              fullName.includes(
                cleanQuery
              ) ||
              username.includes(
                cleanQuery
              )
            );
          }
        )
        .sort(
          (a, b) => {
            const aUsername =
              String(
                a?.username ||
                  ""
              ).toLowerCase();

            const bUsername =
              String(
                b?.username ||
                  ""
              ).toLowerCase();

            const aFullName =
              String(
                a?.full_name ||
                  ""
              ).toLowerCase();

            const bFullName =
              String(
                b?.full_name ||
                  ""
              ).toLowerCase();

            const aExact =
              aUsername ===
                cleanQuery ||
              aFullName ===
                cleanQuery;

            const bExact =
              bUsername ===
                cleanQuery ||
              bFullName ===
                cleanQuery;

            if (
              aExact &&
              !bExact
            ) {
              return -1;
            }

            if (
              !aExact &&
              bExact
            ) {
              return 1;
            }

            const aStarts =
              aUsername.startsWith(
                cleanQuery
              ) ||
              aFullName.startsWith(
                cleanQuery
              );

            const bStarts =
              bUsername.startsWith(
                cleanQuery
              ) ||
              bFullName.startsWith(
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

            return getProfileName(
              a
            ).localeCompare(
              getProfileName(
                b
              )
            );
          }
        )
        .slice(
          0,
          maxProfileResults
        );
    }, [
      cleanQuery,
      maxProfileResults,
      profiles,
    ]);

  const hasResults =
    skillMatches.length >
      0 ||
    profileMatches.length >
      0;

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const openSkill =
    (skill) => {
      if (!skill?.id) {
        return;
      }

      setFocused(
        false
      );

      navigate(
        `/skill-match/${skill.id}`
      );
    };

  const openProfile =
    (profile) => {
      if (
        !profile?.username
      ) {
        return;
      }

      setFocused(
        false
      );

      navigate(
        `/profile/${encodeURIComponent(
          profile.username
        )}`
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
              cleanQuery
            ) {
              event.preventDefault();

              if (
                skillMatches.length >
                0
              ) {
                openSkill(
                  skillMatches[0]
                );
                return;
              }

              if (
                profileMatches.length >
                0
              ) {
                openProfile(
                  profileMatches[0]
                );
              }
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

        {loading ? (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2
              size={15}
              className="animate-spin text-[#c7ff39]"
            />
          </div>
        ) : query ? (
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
        ) : null}
      </div>

      {focused &&
        cleanQuery && (
          <div className="absolute left-0 right-0 z-[9999] mt-2 max-h-[520px] overflow-y-auto border border-white/15 bg-[#0a0d0b] shadow-2xl">
            {error ? (
              <div className="px-5 py-6">
                <p className="text-sm text-[#ff8b8b]">
                  {
                    error
                  }
                </p>
              </div>
            ) : hasResults ? (
              <>
                {skillMatches.length >
                  0 && (
                  <section>
                    <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
                      <p className="text-[9px] uppercase tracking-[0.16em] text-[#c7ff39]">
                        Skills
                      </p>

                      <span className="text-[9px] text-white/30">
                        {
                          skillMatches.length
                        }{" "}
                        found
                      </span>
                    </div>

                    {skillMatches.map(
                      (skill) => (
                        <button
                          key={
                            skill.id
                          }
                          type="button"
                          onMouseDown={(
                            event
                          ) =>
                            event.preventDefault()
                          }
                          onClick={() =>
                            openSkill(
                              skill
                            )
                          }
                          className="group flex w-full items-center justify-between gap-4 border-b border-white/[0.06] px-4 py-3.5 text-left transition hover:bg-[#c7ff39]/[0.05]"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[#f2f4ef]">
                              {
                                skill.name
                              }
                            </p>

                            <p className="mt-1 text-[10px] text-white/30">
                              View related courses
                            </p>
                          </div>

                          <ArrowRight
                            size={14}
                            className="shrink-0 text-[#737373] transition group-hover:text-[#c7ff39]"
                          />
                        </button>
                      )
                    )}
                  </section>
                )}

                {profileMatches.length >
                  0 && (
                  <section
                    className={
                      skillMatches.length >
                      0
                        ? "border-t border-white/10"
                        : ""
                    }
                  >
                    <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
                      <p className="text-[9px] uppercase tracking-[0.16em] text-[#c7ff39]">
                        People
                      </p>

                      <span className="text-[9px] text-white/30">
                        {
                          profileMatches.length
                        }{" "}
                        found
                      </span>
                    </div>

                    {profileMatches.map(
                      (profile) => (
                        <button
                          key={
                            profile.id
                          }
                          type="button"
                          onMouseDown={(
                            event
                          ) =>
                            event.preventDefault()
                          }
                          onClick={() =>
                            openProfile(
                              profile
                            )
                          }
                          className="group flex w-full items-center justify-between gap-4 border-b border-white/[0.06] px-4 py-3.5 text-left transition last:border-b-0 hover:bg-white/[0.025]"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {profile.avatar_url ? (
                              <img
                                src={
                                  profile.avatar_url
                                }
                                alt=""
                                className="h-10 w-10 shrink-0 rounded-full border border-white/10 object-cover"
                              />
                            ) : (
                              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.025]">
                                <UserRound
                                  size={16}
                                  className="text-[#a1a1aa]"
                                />
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[#f2f4ef]">
                                {getProfileName(
                                  profile
                                )}
                              </p>

                              <div className="mt-1 flex min-w-0 items-center gap-2 text-[10px] text-white/35">
                                <span className="truncate">
                                  @
                                  {
                                    profile.username
                                  }
                                </span>

                                {profile.role && (
                                  <>
                                    <span>
                                      ·
                                    </span>

                                    <span className="shrink-0">
                                      {normalizeRole(
                                        profile.role
                                      )}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <ArrowRight
                            size={14}
                            className="shrink-0 text-[#737373] transition group-hover:text-[#c7ff39]"
                          />
                        </button>
                      )
                    )}
                  </section>
                )}
              </>
            ) : (
              <div className="px-5 py-8 text-center">
                <Search
                  size={20}
                  className="mx-auto text-white/20"
                />

                <p className="mt-4 text-sm text-[#a1a1aa]">
                  No skills or people found.
                </p>

                <p className="mt-1 text-xs text-white/30">
                  Try another name or skill.
                </p>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
