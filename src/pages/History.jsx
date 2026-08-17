import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  GraduationCap,
  History as HistoryIcon,
  Repeat2,
  Search,
  Settings2,
  UserRound,
  X,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabase";

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE = 25;

/* =========================================================
   ACTION DISPLAY
========================================================= */

const ACTION_CONFIG = {
  profile_updated: {
    title: "Profile updated",
    category: "Profile",
    icon: UserRound,
  },

  avatar_updated: {
    title: "Profile photo updated",
    category: "Profile",
    icon: UserRound,
  },

  teaching_skill_added: {
    title: "Teaching skill added",
    category: "Skills",
    icon: GraduationCap,
  },

  teaching_skill_removed: {
    title: "Teaching skill removed",
    category: "Skills",
    icon: GraduationCap,
  },

  learning_skill_added: {
    title: "Learning skill added",
    category: "Skills",
    icon: BookOpen,
  },

  learning_skill_removed: {
    title: "Learning skill removed",
    category: "Skills",
    icon: BookOpen,
  },

  course_created: {
    title: "Course created",
    category: "Courses",
    icon: GraduationCap,
  },

  course_updated: {
    title: "Course updated",
    category: "Courses",
    icon: GraduationCap,
  },

  enrollment_requested: {
    title: "Enrollment requested",
    category: "Enrollment",
    icon: BookOpen,
  },

  enrollment_approved: {
    title: "Enrollment approved",
    category: "Enrollment",
    icon: BookOpen,
  },

  enrollment_rejected: {
    title: "Enrollment rejected",
    category: "Enrollment",
    icon: BookOpen,
  },

  enrollment_cancelled: {
    title: "Enrollment cancelled",
    category: "Enrollment",
    icon: BookOpen,
  },

  course_completed: {
    title: "Course completed",
    category: "Enrollment",
    icon: GraduationCap,
  },

  swap_requested: {
    title: "Skill swap requested",
    category: "Swaps",
    icon: Repeat2,
  },

  swap_accepted: {
    title: "Skill swap accepted",
    category: "Swaps",
    icon: Repeat2,
  },

  swap_rejected: {
    title: "Skill swap rejected",
    category: "Swaps",
    icon: Repeat2,
  },

  swap_cancelled: {
    title: "Skill swap cancelled",
    category: "Swaps",
    icon: Repeat2,
  },

  swap_completed: {
    title: "Skill swap completed",
    category: "Swaps",
    icon: Repeat2,
  },

  session_scheduled: {
    title: "Session scheduled",
    category: "Sessions",
    icon: CalendarDays,
  },

  session_completed: {
    title: "Session completed",
    category: "Sessions",
    icon: CalendarDays,
  },

  review_submitted: {
    title: "Review submitted",
    category: "Other",
    icon: Settings2,
  },
};

/* =========================================================
   HELPERS
========================================================= */

function getActionConfig(
  action
) {
  return (
    ACTION_CONFIG[action] || {
      title: formatAction(
        action
      ),
      category: "Other",
      icon: HistoryIcon,
    }
  );
}

function formatAction(
  action
) {
  if (!action) {
    return "Activity";
  }

  return String(action)
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function formatDate(
  value
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

function getMainDetail(
  log
) {
  const metadata =
    log.metadata || {};

  return (
    metadata.title ||
    metadata.course_title ||
    metadata.skill_name ||
    metadata.name ||
    metadata.partner_name ||
    metadata.instructor_name ||
    metadata.message ||
    null
  );
}

function getSecondaryDetail(
  log
) {
  const metadata =
    log.metadata || {};

  const pieces = [];

  if (
    metadata.course_level
  ) {
    pieces.push(
      metadata.course_level
    );
  }

  if (
    metadata.price_credits
  ) {
    pieces.push(
      `${metadata.price_credits} SS`
    );
  }

  if (
    metadata.reward_credits
  ) {
    pieces.push(
      `+${metadata.reward_credits} SS`
    );
  }

  return pieces.join(" · ");
}

/* =========================================================
   PAGE
========================================================= */

export default function History() {
  const navigate =
    useNavigate();

  const [
    user,
    setUser,
  ] = useState(null);

  const [
    logs,
    setLogs,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadingMore,
    setLoadingMore,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    hasMore,
    setHasMore,
  ] = useState(false);

  const [
    query,
    setQuery,
  ] = useState("");

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("All");

  /* =========================================================
     AUTH + INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    let active = true;

    const initialize =
      async () => {
        try {
          setLoading(true);
          setError("");

          const {
            data: {
              user: authUser,
            },
            error: authError,
          } =
            await supabase.auth
              .getUser();

          if (authError) {
            throw authError;
          }

          if (!authUser) {
            navigate(
              "/login",
              {
                replace: true,
              }
            );

            return;
          }

          if (!active) {
            return;
          }

          setUser(authUser);

          const {
            data,
            error:
              historyError,
          } =
            await supabase
              .from(
                "activity_logs"
              )
              .select(
                `
                  id,
                  user_id,
                  action,
                  entity_type,
                  entity_id,
                  metadata,
                  created_at
                `
              )
              .eq(
                "user_id",
                authUser.id
              )
              .order(
                "created_at",
                {
                  ascending: false,
                }
              )
              .range(
                0,
                PAGE_SIZE - 1
              );

          if (
            historyError
          ) {
            throw historyError;
          }

          if (!active) {
            return;
          }

          const rows =
            data || [];

          setLogs(rows);

          setHasMore(
            rows.length ===
              PAGE_SIZE
          );
        } catch (err) {
          console.error(
            "HISTORY ERROR:",
            err
          );

          if (active) {
            setError(
              err?.message ||
                "Unable to load your history."
            );
          }
        } finally {
          if (active) {
            setLoading(
              false
            );
          }
        }
      };

    initialize();

    return () => {
      active = false;
    };
  }, [navigate]);

  /* =========================================================
     LOAD MORE
  ========================================================= */

  const loadMore =
    async () => {
      if (
        !user ||
        loadingMore ||
        !hasMore
      ) {
        return;
      }

      try {
        setLoadingMore(true);

        const start =
          logs.length;

        const end =
          start +
          PAGE_SIZE -
          1;

        const {
          data,
          error:
            loadError,
        } =
          await supabase
            .from(
              "activity_logs"
            )
            .select(
              `
                id,
                user_id,
                action,
                entity_type,
                entity_id,
                metadata,
                created_at
              `
            )
            .eq(
              "user_id",
              user.id
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            )
            .range(
              start,
              end
            );

        if (loadError) {
          throw loadError;
        }

        const rows =
          data || [];

        setLogs(
          (current) => [
            ...current,
            ...rows,
          ]
        );

        setHasMore(
          rows.length ===
            PAGE_SIZE
        );
      } catch (err) {
        console.error(
          "LOAD MORE HISTORY ERROR:",
          err
        );

        setError(
          err?.message ||
            "Unable to load more history."
        );
      } finally {
        setLoadingMore(false);
      }
    };

  /* =========================================================
     CATEGORIES
  ========================================================= */

  const categories =
    useMemo(() => {
      const values =
        new Set(
          logs.map(
            (log) =>
              getActionConfig(
                log.action
              ).category
          )
        );

      return [
        "All",
        ...Array.from(
          values
        ).sort(),
      ];
    }, [logs]);

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredLogs =
    useMemo(() => {
      const cleanQuery =
        query
          .trim()
          .toLowerCase();

      return logs.filter(
        (log) => {
          const config =
            getActionConfig(
              log.action
            );

          if (
            selectedCategory !==
              "All" &&
            config.category !==
              selectedCategory
          ) {
            return false;
          }

          if (!cleanQuery) {
            return true;
          }

          const metadata =
            log.metadata || {};

          const haystack = [
            config.title,
            config.category,
            log.action,
            log.entity_type,
            metadata.title,
            metadata.course_title,
            metadata.skill_name,
            metadata.name,
            metadata.partner_name,
            metadata.instructor_name,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return haystack.includes(
            cleanQuery
          );
        }
      );
    }, [
      logs,
      query,
      selectedCategory,
    ]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#060807] text-[#f2f4ef]">
        <div className="text-center">
          <div className="mx-auto mb-5 h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-[#c7ff39]" />

          <p className="text-xs uppercase tracking-[0.18em] text-[#a1a1aa]">
            Loading history
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060807] text-[#f2f4ef]">
      <div className="noise pointer-events-none fixed inset-0" />

      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 80% 5%, rgba(199,255,57,.055), transparent 38%)",
        }}
      />

      <div className="relative z-10">
        {/* HEADER */}

        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#060807]/90 backdrop-blur-xl">
          <div className="mx-auto flex min-h-[76px] max-w-[1400px] items-center justify-between px-5 md:px-8 lg:px-10">
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/dashboard"
                )
              }
              className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] transition hover:text-white"
            >
              <ArrowLeft
                size={16}
              />

              Dashboard
            </button>

            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#c7ff39]">
                SkillSwap+
              </p>

              <p className="mt-1 text-xs text-[#a1a1aa]">
                Activity History
              </p>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1400px] px-5 pb-20 pt-28 md:px-8 lg:px-10 lg:pt-32">
          {/* HERO */}

          <section className="border-b border-white/10 pb-8">
            <div className="flex items-center gap-2">
              <HistoryIcon
                size={15}
                className="text-[#c7ff39]"
              />

              <p className="text-[10px] uppercase tracking-[0.18em] text-[#c7ff39]">
                Your activity
              </p>
            </div>

            <h1 className="mt-4 text-4xl font-medium tracking-[-0.055em] md:text-5xl">
              History.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#a1a1aa]">
              Review your SkillSwap+
              activity, including
              courses, enrollments,
              skills, sessions and
              swaps.
            </p>
          </section>

          {/* ERROR */}

          {error && (
            <div className="mt-6 border border-red-500/30 bg-red-500/[0.04] px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* CONTROLS */}

          <section className="mt-7 border border-white/10 bg-[#0a0d0b]/75">
            <div className="border-b border-white/10 p-5">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#737373]"
                />

                <input
                  type="text"
                  value={query}
                  onChange={(
                    event
                  ) =>
                    setQuery(
                      event.target
                        .value
                    )
                  }
                  placeholder="Search your history..."
                  className="min-h-[52px] w-full border border-white/10 bg-[#060807] pl-11 pr-11 text-sm outline-none placeholder:text-white/25 focus:border-[#c7ff39]/50"
                />

                {query && (
                  <button
                    type="button"
                    onClick={() =>
                      setQuery("")
                    }
                    className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-[#737373] hover:text-white"
                  >
                    <X
                      size={14}
                    />
                  </button>
                )}
              </div>
            </div>

            {/* CATEGORY FILTER */}

            <div className="flex flex-wrap gap-2 p-5">
              {categories.map(
                (category) => {
                  const selected =
                    selectedCategory ===
                    category;

                  return (
                    <button
                      key={
                        category
                      }
                      type="button"
                      onClick={() =>
                        setSelectedCategory(
                          category
                        )
                      }
                      className={`border px-3 py-2 text-[10px] uppercase tracking-[0.13em] transition ${
                        selected
                          ? "border-[#c7ff39]/40 bg-[#c7ff39]/10 text-[#c7ff39]"
                          : "border-white/10 text-[#a1a1aa] hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {
                        category
                      }
                    </button>
                  );
                }
              )}
            </div>
          </section>

          {/* COUNT */}

          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.15em] text-[#a1a1aa]">
              {
                filteredLogs.length
              }{" "}
              activit
              {filteredLogs.length ===
              1
                ? "y"
                : "ies"}
            </p>

            <p className="text-xs text-[#737373]">
              Private to you
            </p>
          </div>

          {/* HISTORY */}

          {filteredLogs.length >
          0 ? (
            <section className="mt-4 border border-white/10 bg-[#0a0d0b]/70">
              {filteredLogs.map(
                (log) => {
                  const config =
                    getActionConfig(
                      log.action
                    );

                  const Icon =
                    config.icon;

                  const mainDetail =
                    getMainDetail(
                      log
                    );

                  const secondaryDetail =
                    getSecondaryDetail(
                      log
                    );

                  return (
                    <article
                      key={
                        log.id
                      }
                      className="grid gap-4 border-b border-white/10 p-5 last:border-b-0 md:grid-cols-[44px_1fr_auto] md:items-center md:p-6"
                    >
                      <div className="grid h-11 w-11 place-items-center border border-[#c7ff39]/15 bg-[#c7ff39]/[0.04] text-[#c7ff39]">
                        <Icon
                          size={17}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm font-medium">
                            {
                              config.title
                            }
                          </h2>

                          <span className="border border-white/10 px-2 py-0.5 text-[8px] uppercase tracking-[0.13em] text-[#737373]">
                            {
                              config.category
                            }
                          </span>
                        </div>

                        {mainDetail && (
                          <p className="mt-2 truncate text-sm text-[#a1a1aa]">
                            {
                              mainDetail
                            }
                          </p>
                        )}

                        {secondaryDetail && (
                          <p className="mt-1 text-xs text-[#737373]">
                            {
                              secondaryDetail
                            }
                          </p>
                        )}
                      </div>

                      <time className="text-xs text-[#737373] md:text-right">
                        {formatDate(
                          log.created_at
                        )}
                      </time>
                    </article>
                  );
                }
              )}
            </section>
          ) : (
            <section className="mt-4 border border-white/10 bg-[#0a0d0b]/70 p-10">
              <HistoryIcon
                size={22}
                className="text-[#737373]"
              />

              <h2 className="mt-5 text-xl font-medium">
                No activity found.
              </h2>

              <p className="mt-2 text-sm leading-7 text-[#a1a1aa]">
                Your SkillSwap+
                activity will appear
                here as you use the
                platform.
              </p>
            </section>
          )}

          {/* LOAD MORE */}

          {hasMore &&
            selectedCategory ===
              "All" &&
            !query && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  disabled={
                    loadingMore
                  }
                  onClick={
                    loadMore
                  }
                  className="min-h-11 border border-white/15 px-6 text-xs font-medium transition hover:border-[#c7ff39]/40 hover:text-[#c7ff39] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingMore
                    ? "Loading..."
                    : "Load more"}
                </button>
              </div>
            )}
        </div>
      </div>
    </main>
  );
}