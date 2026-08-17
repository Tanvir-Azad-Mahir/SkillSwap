import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Coins,
  GraduationCap,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabase";

/* =========================================================
   CONFIG
========================================================= */

const ROLE_MENTOR = "mentor";
const ROLE_SWAP_MASTER = "swap_master";

const PRICE_OPTIONS = [
  {
    value: 50,
    label: "50 SS",
    title: "Standard",
    description:
      "Best for beginner, focused or shorter courses.",
  },
  {
    value: 100,
    label: "100 SS",
    title: "Advanced",
    description:
      "Best for larger, advanced or high-level courses.",
  },
];

/* =========================================================
   ROLE NORMALIZER
========================================================= */

function normalizeRole(value) {
  const role = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (role === "mentor") {
    return ROLE_MENTOR;
  }

  if (
    role === "swap_master" ||
    role === "swapmaster"
  ) {
    return ROLE_SWAP_MASTER;
  }

  if (role === "learner") {
    return "learner";
  }

  return role;
}

/* =========================================================
   COURSE CREATION
========================================================= */

export default function CourseCreation() {
  const navigate =
    useNavigate();

  /* =========================================================
     STATE
  ========================================================= */

  const [
    user,
    setUser,
  ] = useState(null);

  const [
    profile,
    setProfile,
  ] = useState(null);

  const [
    teachingSkills,
    setTeachingSkills,
  ] = useState([]);

  const [
    title,
    setTitle,
  ] = useState("");

  const [
    selectedSkillId,
    setSelectedSkillId,
  ] = useState("");

  const [
    priceCredits,
    setPriceCredits,
  ] = useState(50);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState(false);

  const [
    createdCourse,
    setCreatedCourse,
  ] = useState(null);

  /* =========================================================
     LOAD PAGE
  ========================================================= */

  useEffect(() => {
    let active = true;

    const load =
      async () => {
        try {
          setLoading(true);
          setError("");

          /* ===================================================
             AUTH USER
          =================================================== */

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

          setUser(
            authUser
          );

          /* ===================================================
             PROFILE
          =================================================== */

          const {
            data:
              profileData,

            error:
              profileError,
          } =
            await supabase
              .from("profiles")
              .select(
                `
                  id,
                  username,
                  full_name,
                  role,
                  is_active,
                  profile_completed
                `
              )
              .eq(
                "id",
                authUser.id
              )
              .maybeSingle();

          if (profileError) {
            throw profileError;
          }

          if (!profileData) {
            throw new Error(
              "PROFILE_NOT_FOUND"
            );
          }

          if (
            profileData.is_active ===
            false
          ) {
            await supabase.auth
              .signOut({
                scope: "local",
              });

            navigate(
              "/login",
              {
                replace: true,
              }
            );

            return;
          }

          if (
            profileData.profile_completed !==
            true
          ) {
            navigate(
              "/profile-setup",
              {
                replace: true,
              }
            );

            return;
          }

          const role =
            normalizeRole(
              profileData.role
            );

          const cleanProfile = {
            ...profileData,
            role,
          };

          setProfile(
            cleanProfile
          );

          /* ===================================================
             ROLE SECURITY CHECK

             Learners cannot create courses.
          =================================================== */

          if (
            role !==
              ROLE_MENTOR &&
            role !==
              ROLE_SWAP_MASTER
          ) {
            throw new Error(
              "COURSE_CREATION_NOT_ALLOWED"
            );
          }

          /* ===================================================
             LOAD USER'S TEACHING SKILL IDS
          =================================================== */

          const {
            data:
              userSkillRows,

            error:
              userSkillsError,
          } =
            await supabase
              .from(
                "user_skills"
              )
              .select(
                `
                  skill_id,
                  is_teaching
                `
              )
              .eq(
                "user_id",
                authUser.id
              )
              .eq(
                "is_teaching",
                true
              );

          if (
            userSkillsError
          ) {
            throw userSkillsError;
          }

          const skillIds =
            (
              userSkillRows ||
              []
            )
              .map(
                (row) =>
                  row.skill_id
              )
              .filter(Boolean);

          if (
            skillIds.length ===
            0
          ) {
            setTeachingSkills(
              []
            );

            return;
          }

          /* ===================================================
             LOAD SKILL DETAILS
          =================================================== */

          const {
            data:
              skillsData,

            error:
              skillsError,
          } =
            await supabase
              .from("skills")
              .select(
                `
                  id,
                  name,
                  category_id
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
                  ascending:
                    true,
                }
              );

          if (skillsError) {
            throw skillsError;
          }

          if (!active) {
            return;
          }

          const cleanSkills =
            (
              skillsData ||
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
              );

          setTeachingSkills(
            cleanSkills
          );

          /* Auto select when only one */

          if (
            cleanSkills.length ===
            1
          ) {
            setSelectedSkillId(
              cleanSkills[0].id
            );
          }
        } catch (err) {
          console.error(
            "COURSE CREATION LOAD ERROR:",
            err
          );

          if (!active) {
            return;
          }

          if (
            err?.message ===
            "COURSE_CREATION_NOT_ALLOWED"
          ) {
            setError(
              "Only Mentors and Swap Masters can create courses."
            );

            return;
          }

          if (
            err?.message ===
            "PROFILE_NOT_FOUND"
          ) {
            setError(
              "Your SkillSwap+ profile could not be found."
            );

            return;
          }

          setError(
            err?.message ||
              "We couldn't load course creation right now."
          );
        } finally {
          if (active) {
            setLoading(
              false
            );
          }
        }
      };

    load();

    return () => {
      active = false;
    };
  }, [navigate]);

  /* =========================================================
     SELECTED SKILL
  ========================================================= */

  const selectedSkill =
    useMemo(() => {
      return (
        teachingSkills.find(
          (skill) =>
            skill.id ===
            selectedSkillId
        ) || null
      );
    }, [
      teachingSkills,
      selectedSkillId,
    ]);

  /* =========================================================
     VALIDATE COURSE
  ========================================================= */

  const validate =
    () => {
      const cleanTitle =
        title.trim();

      if (
        cleanTitle.length <
        5
      ) {
        return "Course title must be at least 5 characters.";
      }

      if (
        cleanTitle.length >
        120
      ) {
        return "Course title must be 120 characters or less.";
      }

      if (
        !selectedSkillId
      ) {
        return "Choose the teaching skill this course belongs to.";
      }

      /* =====================================================
         IMPORTANT

         Verify selected skill is actually one of
         this user's teaching skills.
      ===================================================== */

      const allowedSkill =
        teachingSkills.some(
          (skill) =>
            skill.id ===
            selectedSkillId
        );

      if (
        !allowedSkill
      ) {
        return "You can only create courses for skills you teach.";
      }

      if (
        ![50, 100].includes(
          Number(
            priceCredits
          )
        )
      ) {
        return "Choose either 50 SS or 100 SS.";
      }

      return "";
    };

  /* =========================================================
     CREATE COURSE
  ========================================================= */

  const handleCreate =
    async () => {
      if (
        !user ||
        saving
      ) {
        return;
      }

      setError("");

      const validationError =
        validate();

      if (
        validationError
      ) {
        setError(
          validationError
        );

        return;
      }

      try {
        setSaving(true);

        /* =====================================================
           CHECK ROLE AGAIN
        ===================================================== */

        if (
          profile?.role !==
            ROLE_MENTOR &&
          profile?.role !==
            ROLE_SWAP_MASTER
        ) {
          throw new Error(
            "COURSE_CREATION_NOT_ALLOWED"
          );
        }

        /* =====================================================
           CHECK TEACHING SKILL AGAIN
        ===================================================== */

        const {
          data:
            teachingPermission,

          error:
            teachingPermissionError,
        } =
          await supabase
            .from(
              "user_skills"
            )
            .select(
              `
                skill_id,
                is_teaching
              `
            )
            .eq(
              "user_id",
              user.id
            )
            .eq(
              "skill_id",
              selectedSkillId
            )
            .eq(
              "is_teaching",
              true
            )
            .maybeSingle();

        if (
          teachingPermissionError
        ) {
          throw teachingPermissionError;
        }

        if (
          !teachingPermission
        ) {
          throw new Error(
            "INVALID_TEACHING_SKILL"
          );
        }

        /* =====================================================
           CREATE COURSE

           Do NOT send status.

           Database default:
           Pending
        ===================================================== */

        const {
          data:
            courseData,

          error:
            courseError,
        } =
          await supabase
            .from("courses")
            .insert({
              title:
                title.trim(),

              instructor_id:
                user.id,

              skill_id:
                selectedSkillId,

              price_credits:
                Number(
                  priceCredits
                ),
            })
            .select(
              `
                id,
                title,
                instructor_id,
                skill_id,
                price_credits,
                status,
                created_at
              `
            )
            .single();

        if (courseError) {
          throw courseError;
        }

        setCreatedCourse({
          ...courseData,

          skill:
            selectedSkill,
        });

        setSuccess(
          true
        );
      } catch (err) {
        console.error(
          "COURSE CREATION ERROR:",
          err
        );

        console.error(
          "COURSE CREATION DETAILS:",
          {
            message:
              err?.message,

            details:
              err?.details,

            hint:
              err?.hint,

            code:
              err?.code,
          }
        );

        if (
          err?.message ===
          "COURSE_CREATION_NOT_ALLOWED"
        ) {
          setError(
            "Only Mentors and Swap Masters can create courses."
          );

          return;
        }

        if (
          err?.message ===
          "INVALID_TEACHING_SKILL"
        ) {
          setError(
            "You can only create a course for a skill you currently teach."
          );

          return;
        }

        const message =
          String(
            err?.message ||
              ""
          ).toLowerCase();

        if (
          message.includes(
            "permission denied"
          ) ||
          message.includes(
            "row-level security"
          )
        ) {
          setError(
            err?.message ||
              "Your account does not currently have permission to create courses."
          );

          return;
        }

        setError(
          err?.message ||
            err?.details ||
            "We couldn't create your course right now."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* =========================================================
     CREATE ANOTHER
  ========================================================= */

  const createAnother =
    () => {
      setTitle("");

      setSelectedSkillId(
        teachingSkills.length ===
          1
          ? teachingSkills[0].id
          : ""
      );

      setPriceCredits(
        50
      );

      setCreatedCourse(
        null
      );

      setSuccess(
        false
      );

      setError("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#060807] text-[#f2f4ef]">
        <div className="noise pointer-events-none fixed inset-0" />

        <div className="relative z-10 text-center">
          <div className="mx-auto mb-5 h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-[#c7ff39]" />

          <p className="text-xs uppercase tracking-[0.18em] text-[#a1a1aa]">
            Loading course studio
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     SUCCESS
  ========================================================= */

  if (
    success &&
    createdCourse
  ) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#060807] text-[#f2f4ef]">
        <div className="noise pointer-events-none fixed inset-0 z-0" />

        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 70% 15%, rgba(199,255,57,.08), transparent 40%)",
          }}
        />

        <div className="relative z-10">
          {/* HEADER */}

          <header className="border-b border-white/10">
            <div className="mx-auto flex min-h-[76px] max-w-[1300px] items-center justify-between px-5 md:px-8 lg:px-10">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/dashboard"
                  )
                }
                className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] transition hover:text-[#f2f4ef]"
              >
                <ArrowLeft
                  size={16}
                />

                Dashboard
              </button>

              <p className="text-[10px] uppercase tracking-[0.18em] text-[#c7ff39]">
                Course Studio
              </p>
            </div>
          </header>

          {/* CONTENT */}

          <div className="mx-auto flex min-h-[calc(100vh-76px)] max-w-[900px] items-center px-5 py-16 md:px-8">
            <section className="w-full border border-[#c7ff39]/20 bg-[#0a0d0b]/85">
              <div className="p-7 md:p-10">
                <div className="grid h-14 w-14 place-items-center border border-[#c7ff39]/30 bg-[#c7ff39]/[0.06] text-[#c7ff39]">
                  <Check
                    size={24}
                    strokeWidth={2}
                  />
                </div>

                <p className="mt-7 text-[10px] uppercase tracking-[0.18em] text-[#c7ff39]">
                  Course created
                </p>

                <h1 className="mt-3 text-3xl font-medium tracking-[-0.05em] md:text-4xl">
                  Your course is in the studio.
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#a1a1aa]">
                  The course has been created successfully.
                  Its current status is{" "}
                  <span className="text-[#f2f4ef]">
                    {createdCourse.status ||
                      "Pending"}
                  </span>
                  .
                </p>
              </div>

              {/* COURSE */}

              <div className="grid border-t border-white/10 md:grid-cols-[1.4fr_.6fr]">
                <div className="border-b border-white/10 p-6 md:border-b-0 md:border-r md:p-7">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#a1a1aa]">
                    {
                      createdCourse.skill
                        ?.name
                    }
                  </p>

                  <h2 className="mt-2 text-xl font-medium tracking-[-0.035em]">
                    {
                      createdCourse.title
                    }
                  </h2>

                  <div className="mt-5 inline-flex border border-[#ffbf69]/25 bg-[#ffbf69]/[0.04] px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-[#ffca80]">
                    {createdCourse.status ||
                      "Pending"}
                  </div>
                </div>

                <div className="p-6 md:p-7">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#a1a1aa]">
                    Course value
                  </p>

                  <p className="mt-2 text-3xl font-medium tracking-[-0.05em] text-[#c7ff39]">
                    {
                      createdCourse.price_credits
                    }{" "}
                    SS
                  </p>
                </div>
              </div>

              {/* ACTIONS */}

              <div className="flex flex-col gap-3 border-t border-white/10 p-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    createAnother
                  }
                  className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/15 px-5 text-sm font-medium transition hover:border-white/30 hover:bg-white/[0.03]"
                >
                  <Plus
                    size={15}
                  />

                  Create another
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/dashboard"
                    )
                  }
                  className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008] transition hover:bg-[#d4ff66]"
                >
                  Back to dashboard

                  <ArrowRight
                    size={15}
                  />
                </button>
              </div>
            </section>
          </div>
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
            "radial-gradient(ellipse at 80% 10%, rgba(199,255,57,.07), transparent 38%)",
        }}
      />

      <div className="relative z-10">
        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#060807]/90 backdrop-blur-xl">
          <div className="mx-auto flex min-h-[76px] max-w-[1400px] items-center justify-between px-5 md:px-8 lg:px-10">
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/dashboard"
                )
              }
              className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] transition hover:text-[#f2f4ef]"
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
                Course Studio
              </p>
            </div>
          </div>
        </header>

        {/* ===================================================
            CONTENT
        =================================================== */}

        <div className="mx-auto max-w-[1250px] px-5 pb-20 pt-28 md:px-8 lg:px-10 lg:pt-32">
          {/* =================================================
              HERO
          ================================================= */}

          <div className="grid gap-8 border-b border-white/10 pb-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap
                  size={15}
                  className="text-[#c7ff39]"
                />

                <p className="text-[10px] uppercase tracking-[0.18em] text-[#c7ff39]">
                  Course creation
                </p>
              </div>

              <h1 className="mt-4 max-w-3xl text-4xl font-medium tracking-[-0.055em] md:text-5xl lg:text-6xl">
                Turn your skill into a course.
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#a1a1aa]">
                Create courses only from skills you have
                marked as teaching areas. Learners can later
                discover and request enrollment.
              </p>
            </div>

            <div className="lg:text-right">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/30">
                Instructor
              </p>

              <p className="mt-2 text-lg font-medium">
                {profile?.full_name ||
                  "Instructor"}
              </p>

              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#c7ff39]">
                {profile?.role ===
                ROLE_SWAP_MASTER
                  ? "Swap Master"
                  : "Mentor"}
              </p>
            </div>
          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div
              role="alert"
              className="mt-6 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm text-[#ff8b8b]"
            >
              {error}
            </div>
          )}

          {/* =================================================
              NO TEACHING SKILLS
          ================================================= */}

          {teachingSkills.length ===
          0 ? (
            <section className="mt-8 border border-white/10 bg-[#0a0d0b]/70 p-7 md:p-10">
              <div className="grid h-12 w-12 place-items-center border border-white/10 text-[#a1a1aa]">
                <BookOpen
                  size={20}
                />
              </div>

              <p className="mt-6 text-[10px] uppercase tracking-[0.17em] text-[#c7ff39]">
                Teaching area required
              </p>

              <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em]">
                Add a teaching skill first.
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-7 text-[#a1a1aa]">
                Courses can only be created from skills listed
                in your profile as teaching skills.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/profile/edit?tab=teaching"
                  )
                }
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008]"
              >
                Add teaching skill

                <ArrowRight
                  size={15}
                />
              </button>
            </section>
          ) : (
            /* =================================================
               MAIN GRID
            ================================================= */

            <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_.42fr]">
              {/* =============================================
                  FORM
              ============================================= */}

              <section className="border border-white/10 bg-[#0a0d0b]/75">
                <div className="border-b border-white/10 p-6 md:p-7">
                  <p className="text-[10px] uppercase tracking-[0.17em] text-[#c7ff39]">
                    Course details
                  </p>

                  <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em]">
                    Build your offering
                  </h2>
                </div>

                <div className="space-y-8 p-6 md:p-7">
                  {/* =========================================
                      TITLE
                  ========================================= */}

                  <div>
                    <div className="flex items-end justify-between gap-4">
                      <label
                        htmlFor="course-title"
                        className="text-xs font-medium uppercase tracking-[0.13em] text-[#f2f4ef]"
                      >
                        Course title
                      </label>

                      <span className="text-[10px] text-white/30">
                        {title.length}/120
                      </span>
                    </div>

                    <input
                      id="course-title"
                      type="text"
                      value={title}
                      maxLength={120}
                      placeholder="e.g. Advanced React Development"
                      onChange={(
                        event
                      ) => {
                        setTitle(
                          event.target
                            .value
                        );

                        setError("");
                      }}
                      className="
                        mt-3
                        min-h-[54px]
                        w-full
                        border
                        border-white/15
                        bg-[#060807]
                        px-4
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

                    <p className="mt-2 text-xs leading-5 text-[#737373]">
                      Give learners a clear idea of what the
                      course teaches.
                    </p>
                  </div>

                  {/* =========================================
                      TEACHING SKILL
                  ========================================= */}

                  <div>
                    <label
                      htmlFor="course-skill"
                      className="text-xs font-medium uppercase tracking-[0.13em] text-[#f2f4ef]"
                    >
                      Teaching area
                    </label>

                    <p className="mt-2 text-xs leading-5 text-[#737373]">
                      Only skills you currently teach are
                      available.
                    </p>

                    <select
                      id="course-skill"
                      value={
                        selectedSkillId
                      }
                      onChange={(
                        event
                      ) => {
                        setSelectedSkillId(
                          event.target
                            .value
                        );

                        setError("");
                      }}
                      className="
                        mt-3
                        min-h-[54px]
                        w-full
                        border
                        border-white/15
                        bg-[#060807]
                        px-4
                        text-sm
                        text-[#f2f4ef]
                        transition
                        hover:border-white/25
                        focus:border-[#c7ff39]/70
                        focus:outline-none
                        focus:ring-1
                        focus:ring-[#c7ff39]/30
                      "
                    >
                      <option
                        value=""
                      >
                        Select a teaching skill
                      </option>

                      {teachingSkills.map(
                        (
                          skill
                        ) => (
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

                    {/* SELECTED SKILL */}

                    {selectedSkill && (
                      <div className="mt-3 flex items-center gap-3 border border-[#c7ff39]/15 bg-[#c7ff39]/[0.025] px-4 py-3">
                        <ShieldCheck
                          size={16}
                          className="shrink-0 text-[#c7ff39]"
                        />

                        <div>
                          <p className="text-xs font-medium text-[#f2f4ef]">
                            {
                              selectedSkill.name
                            }
                          </p>

                          <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-[#a1a1aa]">
                            Verified from your teaching profile
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* =========================================
                      PRICE
                  ========================================= */}

                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.13em] text-[#f2f4ef]">
                      Course value
                    </p>

                    <p className="mt-2 text-xs leading-5 text-[#737373]">
                      Choose how many SS credits the course
                      enrollment will cost.
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {PRICE_OPTIONS.map(
                        (
                          option
                        ) => {
                          const selected =
                            priceCredits ===
                            option.value;

                          return (
                            <button
                              key={
                                option.value
                              }
                              type="button"
                              onClick={() => {
                                setPriceCredits(
                                  option.value
                                );

                                setError(
                                  ""
                                );
                              }}
                              className={`
                                relative
                                min-h-[140px]
                                border
                                p-5
                                text-left
                                transition

                                ${
                                  selected
                                    ? "border-[#c7ff39]/50 bg-[#c7ff39]/[0.05]"
                                    : "border-white/10 bg-[#060807] hover:border-white/20"
                                }
                              `}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <Coins
                                  size={18}
                                  className={
                                    selected
                                      ? "text-[#c7ff39]"
                                      : "text-[#737373]"
                                  }
                                />

                                {selected && (
                                  <div className="grid h-6 w-6 place-items-center bg-[#c7ff39] text-[#071008]">
                                    <Check
                                      size={13}
                                    />
                                  </div>
                                )}
                              </div>

                              <p className="mt-5 text-2xl font-medium tracking-[-0.04em]">
                                {
                                  option.label
                                }
                              </p>

                              <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#c7ff39]">
                                {
                                  option.title
                                }
                              </p>

                              <p className="mt-2 text-xs leading-5 text-[#a1a1aa]">
                                {
                                  option.description
                                }
                              </p>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>

                {/* ===========================================
                    SUBMIT
                =========================================== */}

                <div className="flex flex-col-reverse gap-3 border-t border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between md:p-7">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/dashboard"
                      )
                    }
                    disabled={
                      saving
                    }
                    className="min-h-11 border border-white/15 px-5 text-sm text-[#a1a1aa] transition hover:border-white/30 hover:text-[#f2f4ef] disabled:opacity-40"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleCreate
                    }
                    disabled={
                      saving
                    }
                    className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#c7ff39] px-6 text-sm font-semibold text-[#071008] transition hover:bg-[#d4ff66] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />

                        Creating course...
                      </>
                    ) : (
                      <>
                        <Plus
                          size={16}
                        />

                        Create course
                      </>
                    )}
                  </button>
                </div>
              </section>

              {/* =============================================
                  SIDEBAR
              ============================================= */}

              <aside className="space-y-6">
                {/* PREVIEW */}

                <section className="border border-white/10 bg-[#0a0d0b]/75">
                  <div className="border-b border-white/10 p-5">
                    <div className="flex items-center gap-2">
                      <Sparkles
                        size={14}
                        className="text-[#c7ff39]"
                      />

                      <p className="text-[10px] uppercase tracking-[0.17em] text-[#c7ff39]">
                        Live preview
                      </p>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="grid h-10 w-10 place-items-center border border-[#c7ff39]/20 bg-[#c7ff39]/[0.04] text-[#c7ff39]">
                      <GraduationCap
                        size={18}
                      />
                    </div>

                    <p className="mt-5 text-[10px] uppercase tracking-[0.15em] text-[#a1a1aa]">
                      {selectedSkill?.name ||
                        "Teaching skill"}
                    </p>

                    <h3 className="mt-2 text-xl font-medium tracking-[-0.035em]">
                      {title.trim() ||
                        "Your course title"}
                    </h3>

                    <div className="mt-6 border-t border-white/10 pt-5">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#a1a1aa]">
                        Enrollment
                      </p>

                      <p className="mt-1 text-3xl font-medium tracking-[-0.05em] text-[#c7ff39]">
                        {
                          priceCredits
                        }{" "}
                        SS
                      </p>
                    </div>

                    <div className="mt-5 border border-[#ffbf69]/20 bg-[#ffbf69]/[0.04] px-3 py-2">
                      <p className="text-[9px] uppercase tracking-[0.14em] text-[#ffca80]">
                        Initial status · Pending
                      </p>
                    </div>
                  </div>
                </section>

                {/* TEACHING AREAS */}

                <section className="border border-white/10 bg-[#0a0d0b]/75 p-5">
                  <p className="text-[10px] uppercase tracking-[0.17em] text-[#a1a1aa]">
                    Your teaching areas
                  </p>

                  <p className="mt-2 text-2xl font-medium">
                    {
                      teachingSkills.length
                    }
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {teachingSkills
                      .slice(
                        0,
                        8
                      )
                      .map(
                        (
                          skill
                        ) => (
                          <span
                            key={
                              skill.id
                            }
                            className="border border-white/10 bg-white/[0.02] px-2.5 py-1.5 text-[10px] text-[#a1a1aa]"
                          >
                            {
                              skill.name
                            }
                          </span>
                        )
                      )}

                    {teachingSkills.length >
                      8 && (
                      <span className="border border-white/10 px-2.5 py-1.5 text-[10px] text-[#737373]">
                        +
                        {teachingSkills.length -
                          8}{" "}
                        more
                      </span>
                    )}
                  </div>
                </section>

                {/* ECONOMY */}

                <section className="border border-[#c7ff39]/15 bg-[#c7ff39]/[0.025] p-5">
                  <Coins
                    size={18}
                    className="text-[#c7ff39]"
                  />

                  <p className="mt-5 text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">
                    SS Economy
                  </p>

                  <h3 className="mt-2 text-lg font-medium">
                    Earn when learners enroll.
                  </h3>

                  <p className="mt-2 text-xs leading-6 text-[#a1a1aa]">
                    When the enrollment system is connected,
                    approved enrollment payments will transfer
                    the selected course value from learner to
                    instructor.
                  </p>
                </section>
              </aside>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}