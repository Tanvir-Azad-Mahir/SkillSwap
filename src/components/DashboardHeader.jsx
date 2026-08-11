import { useMemo, useState } from "react";
import {
  Bell,
  BookOpen,
  GraduationCap,
  LogOut,
  Pencil,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

const roleLabels = {
  mentor: "Mentor",
  swap_master: "Swap Master",
};

export default function DashboardHeader({
  profile,
  skills = [],
  mentors = [],
  learningSkills = [],
  teachingSkills = [],
  onLogout,
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const initials = String(profile?.full_name || profile?.username || "S")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const learningIds = useMemo(
    () => new Set(learningSkills.map((item) => item.skill_id)),
    [learningSkills]
  );

  const teachingIds = useMemo(
    () => new Set(teachingSkills.map((item) => item.skill_id)),
    [teachingSkills]
  );

  const cleanQuery = query.trim().toLowerCase();

  const skillResults = useMemo(() => {
    if (!cleanQuery) return [];

    return skills
      .filter((skill) => {
        const name = String(skill.name || "").toLowerCase();
        const description = String(skill.description || "").toLowerCase();

        return name.includes(cleanQuery) || description.includes(cleanQuery);
      })
      .sort((a, b) => {
        const aName = String(a.name || "").toLowerCase();
        const bName = String(b.name || "").toLowerCase();

        const aStarts = aName.startsWith(cleanQuery);
        const bStarts = bName.startsWith(cleanQuery);

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return aName.localeCompare(bName);
      })
      .slice(0, 5);
  }, [skills, cleanQuery]);

  const mentorResults = useMemo(() => {
    if (!cleanQuery) return [];

    return mentors
      .filter((mentor) => {
        const fullName = String(mentor.full_name || "").toLowerCase();
        const username = String(mentor.username || "").toLowerCase();
        const location = String(mentor.location || "").toLowerCase();

        const teachesMatchingSkill = (mentor.teachingSkills || []).some(
          (item) =>
            String(item.skill?.name || "")
              .toLowerCase()
              .includes(cleanQuery)
        );

        return (
          fullName.includes(cleanQuery) ||
          username.includes(cleanQuery) ||
          location.includes(cleanQuery) ||
          teachesMatchingSkill
        );
      })
      .sort((a, b) => {
        const aName = String(a.full_name || a.username || "").toLowerCase();
        const bName = String(b.full_name || b.username || "").toLowerCase();

        const aStarts = aName.startsWith(cleanQuery);
        const bStarts = bName.startsWith(cleanQuery);

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return aName.localeCompare(bName);
      })
      .slice(0, 5);
  }, [mentors, cleanQuery]);

  const hasResults =
    skillResults.length > 0 || mentorResults.length > 0;

  const handleSkillClick = (skill) => {
    setQuery(skill.name);
    setFocused(false);
  };

  const handleMentorClick = (mentor) => {
    setQuery(mentor.full_name || `@${mentor.username}`);
    setFocused(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#060807]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1500px] items-center gap-5 px-5 md:px-8 lg:px-10">
        <Link
          to="/dashboard"
          className="shrink-0 text-lg font-semibold tracking-[-0.035em]"
        >
          SKILLSWAP<span className="text-[#c7ff39]">+</span>
        </Link>

        <div className="hidden flex-1 md:block">
          <div className="relative z-[100] max-w-xl">
            <Search
              size={16}
              strokeWidth={1.5}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a1a1aa]"
            />

            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setFocused(true);
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setTimeout(() => setFocused(false), 180);
              }}
              placeholder="Search skills or mentors..."
              autoComplete="off"
              className="min-h-10 w-full border border-white/10 bg-white/[0.025] pl-10 pr-10 text-sm text-white placeholder:text-white/25 transition hover:border-white/20 focus:border-[#c7ff39]/50 focus:outline-none focus:ring-1 focus:ring-[#c7ff39]/20"
            />

            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFocused(false);
                }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center text-[#a1a1aa] transition hover:text-white"
              >
                <X size={14} />
              </button>
            )}

            {focused && cleanQuery && (
              <div className="absolute left-0 right-0 top-[calc(100%+10px)] max-h-[460px] overflow-y-auto border border-white/15 bg-[#0a0d0b] shadow-2xl">
                {!hasResults ? (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm text-[#a1a1aa]">
                      No skill or mentor found.
                    </p>
                    <p className="mt-1 text-xs text-white/30">
                      Try another name or skill.
                    </p>
                  </div>
                ) : (
                  <>
                    {skillResults.length > 0 && (
                      <div>
                        <div className="border-b border-white/[0.07] px-4 py-2.5">
                          <p className="text-[9px] uppercase tracking-[0.17em] text-white/30">
                            Skills
                          </p>
                        </div>

                        {skillResults.map((skill) => {
                          const learning = learningIds.has(skill.id);
                          const teaching = teachingIds.has(skill.id);

                          return (
                            <button
                              key={`skill-${skill.id}`}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => handleSkillClick(skill)}
                              className="group flex w-full items-center justify-between gap-4 border-b border-white/[0.06] px-4 py-3.5 text-left transition hover:bg-[#c7ff39]/[0.05]"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">
                                  {skill.name}
                                </p>

                                {skill.description && (
                                  <p className="mt-1 truncate text-xs text-[#a1a1aa]">
                                    {skill.description}
                                  </p>
                                )}

                                {(learning || teaching) && (
                                  <div className="mt-2 flex gap-2">
                                    {learning && (
                                      <span className="inline-flex items-center gap-1 border border-[#c7ff39]/20 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-[#c7ff39]">
                                        <BookOpen size={10} />
                                        Learning
                                      </span>
                                    )}

                                    {teaching && (
                                      <span className="inline-flex items-center gap-1 border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-[#a1a1aa]">
                                        <GraduationCap size={10} />
                                        Teaching
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <span className="text-[10px] uppercase tracking-[0.12em] text-white/20 transition group-hover:text-[#c7ff39]">
                                Skill
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {mentorResults.length > 0 && (
                      <div>
                        <div className="border-b border-white/[0.07] px-4 py-2.5">
                          <p className="text-[9px] uppercase tracking-[0.17em] text-white/30">
                            Mentors
                          </p>
                        </div>

                        {mentorResults.map((mentor) => {
                          const mentorInitials = String(
                            mentor.full_name || mentor.username || "M"
                          )
                            .split(/\s+/)
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((part) => part[0]?.toUpperCase())
                            .join("");

                          return (
                            <button
                              key={`mentor-${mentor.id}`}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => handleMentorClick(mentor)}
                              className="group flex w-full items-center gap-3 border-b border-white/[0.06] px-4 py-3.5 text-left transition last:border-b-0 hover:bg-[#c7ff39]/[0.05]"
                            >
                              {mentor.avatar_url ? (
                                <img
                                  src={mentor.avatar_url}
                                  alt=""
                                  className="h-10 w-10 shrink-0 object-cover"
                                />
                              ) : (
                                <div className="grid h-10 w-10 shrink-0 place-items-center border border-white/10 bg-[#060807] text-xs font-semibold text-[#c7ff39]">
                                  {mentorInitials || <UserRound size={16} />}
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate text-sm font-medium">
                                    {mentor.full_name || mentor.username}
                                  </p>

                                  <span className="text-[9px] uppercase tracking-[0.12em] text-[#c7ff39]">
                                    {roleLabels[mentor.role] || "Mentor"}
                                  </span>
                                </div>

                                <p className="mt-0.5 truncate text-xs text-[#a1a1aa]">
                                  @{mentor.username}
                                  {mentor.location
                                    ? ` · ${mentor.location}`
                                    : ""}
                                </p>

                                {mentor.teachingSkills?.length > 0 && (
                                  <p className="mt-1.5 truncate text-[10px] text-white/35">
                                    Teaches:{" "}
                                    {mentor.teachingSkills
                                      .map((item) => item.skill?.name)
                                      .filter(Boolean)
                                      .slice(0, 4)
                                      .join(" · ")}
                                  </p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="grid h-10 w-10 place-items-center border border-white/10 text-[#a1a1aa] transition hover:border-white/25 hover:text-white"
          >
            <Bell size={17} strokeWidth={1.5} />
          </button>

          <Link
            to="/profile/edit?tab=profile"
            className="inline-flex h-10 items-center gap-2 rounded border border-white/10 bg-[#0a0d0b] px-3 text-xs font-medium text-[#a1a1aa] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"
          >
            <Pencil size={14} strokeWidth={1.5} />
            Edit profile
          </Link>

          <div className="hidden items-center gap-3 border-l border-white/10 pl-3 sm:flex">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="h-9 w-9 object-cover"
              />
            ) : (
              <div className="grid h-9 w-9 place-items-center bg-[#c7ff39] text-xs font-semibold text-[#071008]">
                {initials || "SS"}
              </div>
            )}

            <div className="hidden max-w-[160px] lg:block">
              <p className="truncate text-sm font-medium">
                {profile?.full_name || "SkillSwap member"}
              </p>
              <p className="truncate text-[10px] uppercase tracking-[0.13em] text-[#a1a1aa]">
                @{profile?.username || "member"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            aria-label="Sign out"
            className="grid h-10 w-10 place-items-center text-[#a1a1aa] transition hover:text-[#ff8b8b]"
          >
            <LogOut size={17} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>
  );
}
