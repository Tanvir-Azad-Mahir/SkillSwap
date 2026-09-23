import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Coins,
  GraduationCap,
  Layers3,
  Loader2,
  Search,
  UserRound,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabase";

function normalizeRole(value) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /[\s-]+/g,
      "_"
    );
}

function getProfileName(profile) {
  return (
    profile?.full_name ||
    profile?.username ||
    "SkillSwap member"
  );
}

function getCourseLevel(course) {
  return (
    course?.course_level ||
    "All levels"
  );
}

export default function SkillMatch() {
  const navigate =
    useNavigate();

  const {
    skillId,
  } =
    useParams();

  const [
    skill,
    setSkill,
  ] =
    useState(null);

  const [
    courses,
    setCourses,
  ] =
    useState([]);

  const [
    instructors,
    setInstructors,
  ] =
    useState([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  /* =========================================================
     LOAD SKILL + RELATED COURSES
  ========================================================= */

  const loadData =
    useCallback(
      async (
        showPageLoader =
          false
      ) => {
        try {
          if (
            showPageLoader
          ) {
            setLoading(
              true
            );
          } else {
            setRefreshing(
              true
            );
          }

          setError("");

          if (!skillId) {
            throw new Error(
              "Skill ID is missing."
            );
          }

          const {
            data:
              skillData,
            error:
              skillError,
          } =
            await supabase
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
              .eq(
                "id",
                skillId
              )
              .maybeSingle();

          if (
            skillError
          ) {
            throw skillError;
          }

          if (
            !skillData
          ) {
            throw new Error(
              "SKILL_NOT_FOUND"
            );
          }

          const {
            data:
              courseData,
            error:
              courseError,
          } =
            await supabase
              .from(
                "courses"
              )
              .select(
                `
                  id,
                  title,
                  instructor_id,
                  skill_id,
                  price_credits,
                  course_level,
                  status,
                  created_at
                `
              )
              .eq(
                "skill_id",
                skillId
              )
              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              );

          if (
            courseError
          ) {
            throw courseError;
          }

          const courseRows =
            courseData ||
            [];

          const instructorIds =
            [
              ...new Set(
                courseRows
                  .map(
                    (course) =>
                      course.instructor_id
                  )
                  .filter(
                    Boolean
                  )
              ),
            ];

          let profileRows =
            [];

          if (
            instructorIds.length >
            0
          ) {
            const {
              data:
                profileData,
              error:
                profileError,
            } =
              await supabase
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
                .in(
                  "id",
                  instructorIds
                );

            if (
              profileError
            ) {
              throw profileError;
            }

            profileRows =
              profileData ||
              [];
          }

          setSkill(
            skillData
          );

          setCourses(
            courseRows
          );

          setInstructors(
            profileRows
          );
        } catch (err) {
          console.error(
            "SKILL MATCH ERROR:",
            err
          );

          setError(
            err?.message ===
              "SKILL_NOT_FOUND"
              ? "This skill could not be found."
              : err?.message ||
                  "Skill matches could not be loaded."
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      [skillId]
    );

  useEffect(() => {
    loadData(
      true
    );
  }, [loadData]);

  /* =========================================================
     MAPS + STATS
  ========================================================= */

  const instructorMap =
    useMemo(
      () =>
        new Map(
          instructors.map(
            (profile) => [
              profile.id,
              {
                ...profile,
                role:
                  normalizeRole(
                    profile.role
                  ),
              },
            ]
          )
        ),
      [instructors]
    );

  const levelCount =
    useMemo(
      () =>
        new Set(
          courses
            .map(
              (course) =>
                course.course_level
            )
            .filter(
              Boolean
            )
        ).size,
      [courses]
    );

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#060807] text-[#f2f4ef]">
        <div className="text-center">
          <Loader2
            size={28}
            className="mx-auto animate-spin text-[#c7ff39]"
          />

          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[#a1a1aa]">
            Finding skill matches
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
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 82% 0%, rgba(199,255,57,.06), transparent 36%)",
        }}
      />

      <div className="relative z-10">
        <header className="border-b border-white/10 bg-[#060807]/90 backdrop-blur-xl">
          <div className="mx-auto flex min-h-[72px] max-w-[1400px] items-center justify-between gap-4 px-5 md:px-8">
            <button
              type="button"
              onClick={() =>
                navigate(
                  -1
                )
              }
              className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] transition hover:text-white"
            >
              <ArrowLeft
                size={16}
              />
              Back
            </button>

            <button
              type="button"
              disabled={
                refreshing
              }
              onClick={() =>
                loadData(
                  false
                )
              }
              className="inline-flex min-h-10 items-center gap-2 border border-white/10 px-4 text-xs text-[#a1a1aa] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39] disabled:opacity-50"
            >
              {refreshing ? (
                <Loader2
                  size={13}
                  className="animate-spin"
                />
              ) : (
                <Search
                  size={13}
                />
              )}

              Refresh
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1400px] px-5 pb-20 pt-8 md:px-8">
          {error && (
            <div className="mb-6 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm text-[#ff8b8b]">
              {
                error
              }
            </div>
          )}

          {skill && (
            <>
              {/* HERO */}

              <section className="overflow-hidden border border-white/10 bg-[#0a0d0b]/80">
                <div className="grid lg:grid-cols-[1fr_.7fr]">
                  <div className="p-6 md:p-8">
                    <div className="inline-flex items-center gap-2 border border-[#c7ff39]/20 bg-[#c7ff39]/[0.04] px-3 py-1.5 text-[9px] uppercase tracking-[0.16em] text-[#c7ff39]">
                      <Layers3
                        size={11}
                      />
                      Skill match
                    </div>

                    <h1 className="mt-5 text-3xl font-medium tracking-[-0.05em] md:text-5xl">
                      {
                        skill.name
                      }
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-7 text-[#a1a1aa]">
                      Explore courses currently connected to this skill in SkillSwap.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 border-t border-white/10 lg:border-l lg:border-t-0">
                    <Metric
                      value={
                        courses.length
                      }
                      label="Related courses"
                    />

                    <Metric
                      value={
                        levelCount
                      }
                      label="Course levels"
                      bordered
                    />
                  </div>
                </div>
              </section>

              {/* RELATED COURSES */}

              <section className="mt-7">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[#c7ff39]">
                      <BookOpen
                        size={15}
                      />

                      <p className="text-[10px] uppercase tracking-[0.17em]">
                        Courses
                      </p>
                    </div>

                    <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em]">
                      Related to{" "}
                      {
                        skill.name
                      }
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/courses"
                      )
                    }
                    className="inline-flex min-h-10 items-center gap-2 border border-white/10 px-4 text-xs text-[#a1a1aa] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"
                  >
                    Browse all courses
                    <ArrowRight
                      size={13}
                    />
                  </button>
                </div>

                {courses.length >
                0 ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {courses.map(
                      (course) => {
                        const instructor =
                          instructorMap.get(
                            course.instructor_id
                          );

                        return (
                          <article
                            key={
                              course.id
                            }
                            className="group flex min-h-[250px] flex-col border border-white/10 bg-[#0a0d0b]/80 p-5 transition hover:border-[#c7ff39]/25"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <span className="border border-white/10 bg-white/[0.025] px-2 py-1 text-[8px] uppercase tracking-[0.13em] text-[#a1a1aa]">
                                {
                                  getCourseLevel(
                                    course
                                  )
                                }
                              </span>

                              {course.status && (
                                <span className="text-[9px] uppercase tracking-[0.12em] text-white/30">
                                  {
                                    course.status
                                  }
                                </span>
                              )}
                            </div>

                            <h3 className="mt-5 text-lg font-medium tracking-[-0.03em]">
                              {
                                course.title ||
                                "Untitled course"
                              }
                            </h3>

                            <div className="mt-4 flex items-center gap-2 text-xs text-[#a1a1aa]">
                              <UserRound
                                size={12}
                              />

                              <span className="truncate">
                                {getProfileName(
                                  instructor
                                )}
                              </span>
                            </div>

                            <div className="mt-3 flex items-center gap-2 text-xs text-[#c7ff39]">
                              <Coins
                                size={12}
                              />

                              <span>
                                {Number(
                                  course.price_credits ||
                                    0
                                )}{" "}
                                SS
                              </span>
                            </div>

                            <div className="mt-auto pt-6">
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/courses/${course.id}`
                                  )
                                }
                                className="inline-flex min-h-10 w-full items-center justify-between border border-white/10 px-4 text-xs text-[#f2f4ef] transition group-hover:border-[#c7ff39]/30 group-hover:text-[#c7ff39]"
                              >
                                View course
                                <ArrowRight
                                  size={13}
                                />
                              </button>
                            </div>
                          </article>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <div className="mt-5 border border-white/10 bg-[#0a0d0b]/70 p-8 md:p-10">
                    <GraduationCap
                      size={23}
                      className="text-white/25"
                    />

                    <h3 className="mt-5 text-xl font-medium">
                      No related courses yet.
                    </h3>

                    <p className="mt-2 max-w-xl text-sm leading-7 text-[#a1a1aa]">
                      There are currently no courses connected to{" "}
                      {
                        skill.name
                      }.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          "/courses"
                        )
                      }
                      className="mt-5 inline-flex min-h-10 items-center gap-2 border border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] px-4 text-xs text-[#c7ff39] transition hover:bg-[#c7ff39]/[0.08]"
                    >
                      Browse courses
                      <ArrowRight
                        size={13}
                      />
                    </button>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function Metric({
  value,
  label,
  bordered = false,
}) {
  return (
    <div
      className={`p-6 ${
        bordered
          ? "border-l border-white/10"
          : ""
      }`}
    >
      <p className="text-3xl font-medium tracking-[-0.05em] text-[#f2f4ef]">
        {
          value
        }
      </p>

      <p className="mt-2 text-[9px] uppercase tracking-[0.15em] text-[#a1a1aa]">
        {
          label
        }
      </p>
    </div>
  );
}
