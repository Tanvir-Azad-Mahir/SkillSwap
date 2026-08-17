import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Coins,
  Filter,
  GraduationCap,
  Search,
  UserRound,
  X,
} from "lucide-react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabase";

/* =========================================================
   ROLE HELPERS
========================================================= */

function normalizeRole(value) {
  const role =
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");

  if (role === "mentor") {
    return "mentor";
  }

  if (
    role === "swap_master" ||
    role === "swapmaster"
  ) {
    return "swap_master";
  }

  if (role === "learner") {
    return "learner";
  }

  return role;
}

function getRoleLabel(role) {
  if (role === "mentor") {
    return "Mentor";
  }

  if (role === "swap_master") {
    return "Swap Master";
  }

  if (role === "learner") {
    return "Learner";
  }

  return "Member";
}

/* =========================================================
   COURSE DISCOVERY
========================================================= */

export default function Courses() {
  const navigate =
    useNavigate();

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  /* =========================================================
     STATE
  ========================================================= */

  const [
    courses,
    setCourses,
  ] = useState([]);

  const [
    skills,
    setSkills,
  ] = useState([]);

  const [
    instructors,
    setInstructors,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    query,
    setQuery,
  ] = useState(
    searchParams.get("q") ||
      ""
  );

  const [
    selectedSkill,
    setSelectedSkill,
  ] = useState(
    searchParams.get("skill") ||
      ""
  );

  const [
    selectedInstructor,
    setSelectedInstructor,
  ] = useState(
    searchParams.get(
      "instructor"
    ) || ""
  );

  const [
    selectedPrice,
    setSelectedPrice,
  ] = useState(
    searchParams.get("price") ||
      ""
  );

  const [
    selectedLevel,
    setSelectedLevel,
  ] = useState(
    searchParams.get("level") ||
      ""
  );

  /* =========================================================
     LOAD ACTIVE COURSES
  ========================================================= */

  useEffect(() => {
    let active = true;

    const load =
      async () => {
        try {
          setLoading(true);
          setError("");

          /* ===================================================
             AUTH
          =================================================== */

          const {
            data: {
              user,
            },

            error:
              authError,
          } =
            await supabase.auth
              .getUser();

          if (authError) {
            throw authError;
          }

          if (!user) {
            navigate(
              "/login",
              {
                replace: true,
              }
            );

            return;
          }

          /* ===================================================
             COURSES

             COURSE STATUS ENUM:
             Active
             Pending
             Suspended

             Discovery only shows Active.
          =================================================== */

          const {
            data:
              courseData,

            error:
              courseError,
          } =
            await supabase
              .from("courses")
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
                "status",
                "Active"
              )
              .order(
                "created_at",
                {
                  ascending: false,
                }
              );

          if (courseError) {
            throw courseError;
          }

          if (!active) {
            return;
          }

          const loadedCourses =
            courseData || [];

          setCourses(
            loadedCourses
          );

          /* ===================================================
             RELATED IDS
          =================================================== */

          const skillIds = [
            ...new Set(
              loadedCourses
                .map(
                  (course) =>
                    course.skill_id
                )
                .filter(Boolean)
            ),
          ];

          const instructorIds = [
            ...new Set(
              loadedCourses
                .map(
                  (course) =>
                    course.instructor_id
                )
                .filter(Boolean)
            ),
          ];

          /* ===================================================
             SKILLS + INSTRUCTORS
          =================================================== */

          const [
            skillResult,
            instructorResult,
          ] =
            await Promise.all([
              skillIds.length > 0
                ? supabase
                    .from("skills")
                    .select(
                      `
                        id,
                        name,
                        category_id,
                        difficulty,
                        is_active
                      `
                    )
                    .in(
                      "id",
                      skillIds
                    )
                    .eq(
                      "is_active",
                      true
                    )
                    .order(
                      "name",
                      {
                        ascending: true,
                      }
                    )
                : Promise.resolve({
                    data: [],
                    error: null,
                  }),

              instructorIds.length > 0
                ? supabase
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
                        bio,
                        location,
                        is_active
                      `
                    )
                    .in(
                      "id",
                      instructorIds
                    )
                    .eq(
                      "is_active",
                      true
                    )
                    .order(
                      "full_name",
                      {
                        ascending: true,
                      }
                    )
                : Promise.resolve({
                    data: [],
                    error: null,
                  }),
            ]);

          if (
            skillResult.error
          ) {
            throw (
              skillResult.error
            );
          }

          if (
            instructorResult.error
          ) {
            throw (
              instructorResult.error
            );
          }

          if (!active) {
            return;
          }

          /* ===================================================
             SKILLS
          =================================================== */

          setSkills(
            (
              skillResult.data ||
              []
            )
              .filter(
                (skill) =>
                  skill?.id &&
                  skill?.name
              )
              .map(
                (skill) => ({
                  ...skill,

                  name:
                    String(
                      skill.name
                    ).trim(),
                })
              )
          );

          /* ===================================================
             INSTRUCTORS

             Only Mentor and Swap Master are valid
             course instructors.
          =================================================== */

          setInstructors(
            (
              instructorResult.data ||
              []
            )
              .map(
                (item) => ({
                  ...item,

                  role:
                    normalizeRole(
                      item.role
                    ),
                })
              )
              .filter(
                (item) =>
                  item.role ===
                    "mentor" ||
                  item.role ===
                    "swap_master"
              )
          );
        } catch (err) {
          console.error(
            "COURSE DISCOVERY ERROR:",
            err
          );

          if (active) {
            setError(
              err?.message ||
                "We couldn't load courses right now."
            );
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

    load();

    return () => {
      active = false;
    };
  }, [navigate]);

  /* =========================================================
     MAPS
  ========================================================= */

  const skillMap =
    useMemo(() => {
      return new Map(
        skills.map(
          (skill) => [
            skill.id,
            skill,
          ]
        )
      );
    }, [skills]);

  const instructorMap =
    useMemo(() => {
      return new Map(
        instructors.map(
          (instructor) => [
            instructor.id,
            instructor,
          ]
        )
      );
    }, [instructors]);

  /* =========================================================
     JOIN COURSES
  ========================================================= */

  const courseItems =
    useMemo(() => {
      return courses
        .map(
          (course) => ({
            ...course,

            skill:
              skillMap.get(
                course.skill_id
              ) || null,

            instructor:
              instructorMap.get(
                course.instructor_id
              ) || null,
          })
        )
        .filter(
          (course) =>
            course.skill &&
            course.instructor
        );
    }, [
      courses,
      skillMap,
      instructorMap,
    ]);

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredCourses =
    useMemo(() => {
      const cleanQuery =
        query
          .trim()
          .toLowerCase();

      return courseItems.filter(
        (course) => {
          /* SEARCH */

          if (cleanQuery) {
            const haystack = [
              course.title,
              course.skill?.name,
              course.instructor
                ?.full_name,
              course.instructor
                ?.username,
              course.course_level,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            if (
              !haystack.includes(
                cleanQuery
              )
            ) {
              return false;
            }
          }

          /* SKILL */

          if (
            selectedSkill &&
            course.skill_id !==
              selectedSkill
          ) {
            return false;
          }

          /* INSTRUCTOR */

          if (
            selectedInstructor &&
            course.instructor_id !==
              selectedInstructor
          ) {
            return false;
          }

          /* PRICE */

          if (
            selectedPrice &&
            Number(
              course.price_credits
            ) !==
              Number(
                selectedPrice
              )
          ) {
            return false;
          }

          /* LEVEL */

          if (
            selectedLevel &&
            course.course_level !==
              selectedLevel
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      courseItems,
      query,
      selectedSkill,
      selectedInstructor,
      selectedPrice,
      selectedLevel,
    ]);

  /* =========================================================
     URL FILTERS
  ========================================================= */

  useEffect(() => {
    const params =
      new URLSearchParams();

    if (
      query.trim()
    ) {
      params.set(
        "q",
        query.trim()
      );
    }

    if (
      selectedSkill
    ) {
      params.set(
        "skill",
        selectedSkill
      );
    }

    if (
      selectedInstructor
    ) {
      params.set(
        "instructor",
        selectedInstructor
      );
    }

    if (
      selectedPrice
    ) {
      params.set(
        "price",
        selectedPrice
      );
    }

    if (
      selectedLevel
    ) {
      params.set(
        "level",
        selectedLevel
      );
    }

    setSearchParams(
      params,
      {
        replace: true,
      }
    );
  }, [
    query,
    selectedSkill,
    selectedInstructor,
    selectedPrice,
    selectedLevel,
    setSearchParams,
  ]);

  /* =========================================================
     FILTER STATE
  ========================================================= */

  const hasFilters =
    Boolean(
      query.trim() ||
        selectedSkill ||
        selectedInstructor ||
        selectedPrice ||
        selectedLevel
    );

  const clearFilters =
    () => {
      setQuery("");

      setSelectedSkill("");

      setSelectedInstructor("");

      setSelectedPrice("");

      setSelectedLevel("");
    };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="relative grid min-h-screen place-items-center bg-[#060807] text-[#f2f4ef]">
        <div className="noise pointer-events-none fixed inset-0" />

        <div className="relative z-10 text-center">
          <div className="mx-auto mb-5 h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-[#c7ff39]" />

          <p className="text-xs uppercase tracking-[0.18em] text-[#a1a1aa]">
            Discovering courses
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
      {/* BACKGROUND */}

      <div className="noise pointer-events-none fixed inset-0 z-0" />

      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 78% 5%, rgba(199,255,57,.06), transparent 36%)",
        }}
      />

      <div className="relative z-10">
        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#060807]/90 backdrop-blur-xl">
          <div className="mx-auto flex min-h-[76px] max-w-[1500px] items-center justify-between px-5 md:px-8 lg:px-10">
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
                Course Discovery
              </p>
            </div>
          </div>
        </header>

        {/* ===================================================
            CONTENT
        =================================================== */}

        <div className="mx-auto max-w-[1500px] px-5 pb-20 pt-28 md:px-8 lg:px-10 lg:pt-32">
          {/* HERO */}

          <section className="grid gap-8 border-b border-white/10 pb-8 lg:grid-cols-[1fr_.45fr] lg:items-end">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen
                  size={15}
                  className="text-[#c7ff39]"
                />

                <p className="text-[10px] uppercase tracking-[0.18em] text-[#c7ff39]">
                  Learn from the network
                </p>
              </div>

              <h1 className="mt-4 text-4xl font-medium tracking-[-0.055em] md:text-5xl lg:text-6xl">
                Discover courses.
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#a1a1aa]">
                Browse active courses
                published by SkillSwap+
                Mentors and Swap Masters.
                Search by skill, instructor,
                level or SS price.
              </p>
            </div>

            {/* STATS */}

            <div className="grid grid-cols-2 border border-white/10 bg-[#0a0d0b]/70">
              <div className="border-r border-white/10 p-5">
                <p className="text-3xl font-medium tracking-[-0.05em]">
                  {
                    courseItems.length
                  }
                </p>

                <p className="mt-1 text-[9px] uppercase tracking-[0.15em] text-[#a1a1aa]">
                  Active courses
                </p>
              </div>

              <div className="p-5">
                <p className="text-3xl font-medium tracking-[-0.05em]">
                  {
                    instructors.length
                  }
                </p>

                <p className="mt-1 text-[9px] uppercase tracking-[0.15em] text-[#a1a1aa]">
                  Instructors
                </p>
              </div>
            </div>
          </section>

          {/* ERROR */}

          {error && (
            <div className="mt-6 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm text-[#ff8b8b]">
              {error}
            </div>
          )}

          {/* =================================================
              SEARCH + FILTERS
          ================================================= */}

          <section className="mt-7 overflow-hidden border border-white/10 bg-[#0a0d0b]/75">
            {/* SEARCH */}

            <div className="border-b border-white/10 p-5 md:p-6">
              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#737373]"
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
                  placeholder="Search course, skill or instructor..."
                  className="min-h-[56px] w-full border border-white/10 bg-[#060807] pl-11 pr-11 text-sm text-[#f2f4ef] outline-none placeholder:text-white/25 focus:border-[#c7ff39]/50"
                />

                {query && (
                  <button
                    type="button"
                    onClick={() =>
                      setQuery("")
                    }
                    className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-[#737373] transition hover:text-white"
                  >
                    <X
                      size={14}
                    />
                  </button>
                )}
              </div>
            </div>

            {/* FILTERS */}

            <div className="grid sm:grid-cols-2 xl:grid-cols-4">
              {/* SKILL */}

              <FilterBox
                label="Skill"
              >
                <select
                  value={
                    selectedSkill
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedSkill(
                      event.target
                        .value
                    )
                  }
                  className="mt-3 min-h-11 w-full border border-white/10 bg-[#060807] px-3 text-sm text-[#f2f4ef] outline-none focus:border-[#c7ff39]/50"
                >
                  <option value="">
                    All skills
                  </option>

                  {skills.map(
                    (skill) => (
                      <option
                        key={
                          skill.id
                        }
                        value={
                          skill.id
                        }
                      >
                        {
                          skill.name
                        }
                      </option>
                    )
                  )}
                </select>
              </FilterBox>

              {/* INSTRUCTOR */}

              <FilterBox
                label="Instructor"
              >
                <select
                  value={
                    selectedInstructor
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedInstructor(
                      event.target
                        .value
                    )
                  }
                  className="mt-3 min-h-11 w-full border border-white/10 bg-[#060807] px-3 text-sm text-[#f2f4ef] outline-none focus:border-[#c7ff39]/50"
                >
                  <option value="">
                    All instructors
                  </option>

                  {instructors.map(
                    (
                      instructor
                    ) => (
                      <option
                        key={
                          instructor.id
                        }
                        value={
                          instructor.id
                        }
                      >
                        {
                          instructor.full_name
                        }
                      </option>
                    )
                  )}
                </select>
              </FilterBox>

              {/* PRICE */}

              <FilterBox
                label="Price"
              >
                <select
                  value={
                    selectedPrice
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedPrice(
                      event.target
                        .value
                    )
                  }
                  className="mt-3 min-h-11 w-full border border-white/10 bg-[#060807] px-3 text-sm text-[#f2f4ef] outline-none focus:border-[#c7ff39]/50"
                >
                  <option value="">
                    All prices
                  </option>

                  <option value="50">
                    50 SS
                  </option>

                  <option value="100">
                    100 SS
                  </option>
                </select>
              </FilterBox>

              {/* LEVEL */}

              <FilterBox
                label="Level"
                last
              >
                <select
                  value={
                    selectedLevel
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedLevel(
                      event.target
                        .value
                    )
                  }
                  className="mt-3 min-h-11 w-full border border-white/10 bg-[#060807] px-3 text-sm text-[#f2f4ef] outline-none focus:border-[#c7ff39]/50"
                >
                  <option value="">
                    All levels
                  </option>

                  <option value="Beginner">
                    Beginner
                  </option>

                  <option value="Intermediate">
                    Intermediate
                  </option>

                  <option value="Advanced">
                    Advanced
                  </option>
                </select>
              </FilterBox>
            </div>
          </section>

          {/* =================================================
              RESULT BAR
          ================================================= */}

          <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-xs uppercase tracking-[0.15em] text-[#a1a1aa]">
              {
                filteredCourses.length
              }{" "}
              course
              {filteredCourses.length ===
              1
                ? ""
                : "s"}{" "}
              found
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="inline-flex items-center gap-2 text-xs text-[#a1a1aa] transition hover:text-[#c7ff39]"
              >
                <X
                  size={13}
                />

                Clear filters
              </button>
            )}
          </div>

          {/* =================================================
              COURSE GRID
          ================================================= */}

          {filteredCourses.length >
          0 ? (
            <section className="mt-5 grid gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map(
                (course) => {
                  const instructor =
                    course.instructor;

                  return (
                    <article
                      key={
                        course.id
                      }
                      className="group flex min-h-[360px] flex-col bg-[#0a0d0b] p-6 transition hover:bg-[#0c120d]"
                    >
                      {/* TOP */}

                      <div className="flex items-start justify-between gap-4">
                        <div className="grid h-11 w-11 place-items-center border border-[#c7ff39]/20 bg-[#c7ff39]/[0.04] text-[#c7ff39]">
                          <GraduationCap
                            size={19}
                          />
                        </div>

                        <span className="border border-[#c7ff39]/20 bg-[#c7ff39]/[0.04] px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-[#c7ff39]">
                          Active
                        </span>
                      </div>

                      {/* SKILL */}

                      <p className="mt-6 text-[10px] uppercase tracking-[0.17em] text-[#c7ff39]">
                        {
                          course.skill
                            ?.name
                        }
                      </p>

                      {/* TITLE */}

                      <h2 className="mt-2 line-clamp-2 text-xl font-medium tracking-[-0.035em]">
                        {
                          course.title
                        }
                      </h2>

                      {/* LEVEL */}

                      <div className="mt-3">
                        <span className="border border-white/10 bg-white/[0.02] px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-[#a1a1aa]">
                          {
                            course.course_level
                          }
                        </span>
                      </div>

                      {/* INSTRUCTOR */}

                      <div className="mt-6 flex items-center gap-3">
                        {instructor
                          ?.avatar_url ? (
                          <img
                            src={
                              instructor.avatar_url
                            }
                            alt={
                              instructor.full_name ||
                              "Instructor"
                            }
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.03]">
                            <UserRound
                              size={16}
                              className="text-[#737373]"
                            />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {
                              instructor
                                ?.full_name
                            }
                          </p>

                          <p className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-[#a1a1aa]">
                            {getRoleLabel(
                              instructor
                                ?.role
                            )}
                          </p>
                        </div>
                      </div>

                      {/* BOTTOM */}

                      <div className="mt-auto flex items-end justify-between gap-4 border-t border-white/10 pt-5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Coins
                              size={13}
                              className="text-[#c7ff39]"
                            />

                            <p className="text-[9px] uppercase tracking-[0.14em] text-[#a1a1aa]">
                              Enrollment
                            </p>
                          </div>

                          <p className="mt-1 text-2xl font-medium tracking-[-0.04em] text-[#c7ff39]">
                            {
                              course.price_credits
                            }{" "}
                            SS
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/courses/${course.id}`
                            )
                          }
                          className="inline-flex min-h-10 items-center justify-center gap-2 border border-white/15 px-4 text-xs font-medium transition group-hover:border-[#c7ff39]/30 group-hover:text-[#c7ff39]"
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
            </section>
          ) : (
            /* =================================================
               EMPTY
            ================================================= */

            <section className="mt-5 border border-white/10 bg-[#0a0d0b]/70 p-9 md:p-12">
              <Filter
                size={22}
                className="text-[#737373]"
              />

              <h2 className="mt-5 text-2xl font-medium tracking-[-0.04em]">
                No active courses found.
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-7 text-[#a1a1aa]">
                Try another skill,
                instructor, price,
                course level or search
                keyword.
              </p>

              {hasFilters && (
                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="mt-5 min-h-11 bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008]"
                >
                  Clear filters
                </button>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   FILTER BOX
========================================================= */

function FilterBox({
  label,
  children,
  last = false,
}) {
  return (
    <div
      className={`p-5 ${
        last
          ? ""
          : "border-b border-white/10 sm:border-r xl:border-b-0"
      }`}
    >
      <p className="text-[10px] uppercase tracking-[0.16em] text-[#a1a1aa]">
        {label}
      </p>

      {children}
    </div>
  );
}