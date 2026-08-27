import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  Clock3,
  Coins,
  GraduationCap,
  Loader2,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabase";

/* =========================================================
   HELPERS
========================================================= */

function normalizeRole(value) {
  const role =
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(
        /[\s-]+/g,
        "_"
      );

  if (role === "learner") {
    return "learner";
  }

  if (role === "mentor") {
    return "mentor";
  }

  if (
    role === "swap_master" ||
    role === "swapmaster"
  ) {
    return "swap_master";
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
   COURSE DETAILS
========================================================= */

export default function CourseDetails() {
  const {
    courseId,
  } = useParams();

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
    course,
    setCourse,
  ] = useState(null);

  const [
    skill,
    setSkill,
  ] = useState(null);

  const [
    instructor,
    setInstructor,
  ] = useState(null);

  const [
    enrollment,
    setEnrollment,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    requesting,
    setRequesting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");


  /* =========================================================
     LOAD
  ========================================================= */

  useEffect(() => {
    let active =
      true;

    const load =
      async () => {
        try {
          setLoading(true);

          setError("");

          /* =================================================
             AUTH
          ================================================= */

          const {
            data: {
              user:
                authUser,
            },

            error:
              authError,
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
                replace:
                  true,
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


          /* =================================================
             COURSE

             Only Active courses are visible here.
          ================================================= */

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
                "id",
                courseId
              )
              .eq(
                "status",
                "Active"
              )
              .maybeSingle();

          if (courseError) {
            throw courseError;
          }

          if (!courseData) {
            throw new Error(
              "COURSE_NOT_FOUND"
            );
          }

          if (!active) {
            return;
          }

          setCourse(
            courseData
          );


          /* =================================================
             RELATED DATA
          ================================================= */

          const [
            skillResult,
            instructorResult,
            profileResult,
            enrollmentResult,
          ] =
            await Promise.all([
              /* SKILL */

              supabase
                .from("skills")
                .select(
                  `
                    id,
                    name,
                    difficulty,
                    category_id
                  `
                )
                .eq(
                  "id",
                  courseData.skill_id
                )
                .maybeSingle(),


              /* INSTRUCTOR */

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
                    bio,
                    role,
                    location,
                    is_active
                  `
                )
                .eq(
                  "id",
                  courseData.instructor_id
                )
                .eq(
                  "is_active",
                  true
                )
                .maybeSingle(),


              /* CURRENT USER */

              supabase
                .from(
                  "profiles"
                )
                .select(
                  `
                    id,
                    full_name,
                    role,
                    credits,
                    is_active,
                    profile_completed
                  `
                )
                .eq(
                  "id",
                  authUser.id
                )
                .maybeSingle(),


              /* MOST RECENT ENROLLMENT */

              supabase
                .from(
                  "course_enrollments"
                )
                .select(
                  `
                    id,
                    course_id,
                    learner_id,
                    instructor_id,
                    price_credits,
                    status,
                    created_at,
                    approved_at,
                    completed_at
                  `
                )
                .eq(
                  "course_id",
                  courseData.id
                )
                .eq(
                  "learner_id",
                  authUser.id
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                )
                .limit(1)
                .maybeSingle(),
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


          if (
            profileResult.error
          ) {
            throw (
              profileResult.error
            );
          }


          if (
            enrollmentResult.error
          ) {
            throw (
              enrollmentResult.error
            );
          }


          if (!active) {
            return;
          }


          setSkill(
            skillResult.data
          );


          setInstructor(
            instructorResult.data
              ? {
                  ...instructorResult.data,

                  role:
                    normalizeRole(
                      instructorResult.data
                        .role
                    ),
                }
              : null
          );


          setProfile(
            profileResult.data
              ? {
                  ...profileResult.data,

                  role:
                    normalizeRole(
                      profileResult.data
                        .role
                    ),
                }
              : null
          );


          setEnrollment(
            enrollmentResult.data ||
              null
          );
        } catch (err) {
          console.error(
            "COURSE DETAILS ERROR:",
            err
          );

          if (
            !active
          ) {
            return;
          }

          if (
            err?.message ===
            "COURSE_NOT_FOUND"
          ) {
            setError(
              "This course is unavailable or no longer active."
            );

            return;
          }

          setError(
            err?.message ||
              "We couldn't load this course right now."
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
      active =
        false;
    };
  }, [
    courseId,
    navigate,
  ]);


  /* =========================================================
     REQUEST ENROLLMENT
  ========================================================= */

  const requestEnrollment =
    async () => {
      if (
        !course ||
        !user ||
        requesting
      ) {
        return;
      }

      try {
        setRequesting(
          true
        );

        setError("");

        setSuccess("");


        const {
          data:
            enrollmentId,

          error:
            requestError,
        } =
          await supabase.rpc(
            "request_course_enrollment",
            {
              p_course_id:
                course.id,
            }
          );


        if (
          requestError
        ) {
          throw requestError;
        }


        setEnrollment({
          id:
            enrollmentId,

          course_id:
            course.id,

          learner_id:
            user.id,

          instructor_id:
            course.instructor_id,

          price_credits:
            course.price_credits,

          status:
            "Pending",

          created_at:
            new Date()
              .toISOString(),
        });


        setSuccess(
          "Enrollment request sent. No SS has been deducted yet."
        );
      } catch (err) {
        console.error(
          "ENROLLMENT REQUEST ERROR:",
          err
        );

        const message =
          String(
            err?.message ||
              ""
          );


        if (
          message.includes(
            "ENROLLMENT_ALREADY_EXISTS"
          )
        ) {
          setError(
            "You already have an active enrollment request for this course."
          );

          return;
        }


        if (
          message.includes(
            "INSUFFICIENT_CREDITS"
          )
        ) {
          setError(
            "You don't currently have enough SS credits for this course."
          );

          return;
        }


        if (
          message.includes(
            "ROLE_CANNOT_ENROLL"
          )
        ) {
          setError(
            "Your current role cannot enroll in courses."
          );

          return;
        }


        if (
          message.includes(
            "CANNOT_ENROLL_OWN_COURSE"
          )
        ) {
          setError(
            "You cannot enroll in your own course."
          );

          return;
        }


        if (
          message.includes(
            "COURSE_NOT_AVAILABLE"
          )
        ) {
          setError(
            "This course is no longer available for enrollment."
          );

          return;
        }


        if (
          message.includes(
            "ACCOUNT_INACTIVE"
          )
        ) {
          setError(
            "Your account is currently inactive."
          );

          return;
        }


        if (
          message.includes(
            "PROFILE_INCOMPLETE"
          )
        ) {
          setError(
            "Complete your profile before requesting enrollment."
          );

          return;
        }


        setError(
          err?.message ||
            "We couldn't send your enrollment request."
        );
      } finally {
        setRequesting(
          false
        );
      }
    };


  /* =========================================================
     DERIVED STATE
  ========================================================= */

  const isInstructor =
    Boolean(
      user &&
        course &&
        user.id ===
          course.instructor_id
    );


  const canLearn =
    profile?.role ===
      "learner" ||
    profile?.role ===
      "swap_master";


  const credits =
    Number(
      profile?.credits ||
        0
    );


  const price =
    Number(
      course?.price_credits ||
        0
    );


  const hasEnoughCredits =
    credits >= price;


  const enrollmentStatus =
    enrollment?.status ||
    "";


  const enrollmentPending =
    enrollmentStatus ===
    "Pending";


  const enrollmentApproved =
    enrollmentStatus ===
    "Approved";


  const enrollmentCompleted =
    enrollmentStatus ===
    "Completed";


  const enrollmentRejected =
    enrollmentStatus ===
    "Rejected";


  const enrollmentCancelled =
    enrollmentStatus ===
    "Cancelled";


  const requestDisabled =
    requesting ||
    isInstructor ||
    !canLearn ||
    profile?.is_active !==
      true ||
    profile?.profile_completed !==
      true ||
    !hasEnoughCredits ||
    enrollmentPending ||
    enrollmentApproved ||
    enrollmentCompleted;


  /* =========================================================
     BUTTON TEXT
  ========================================================= */

  let buttonText =
    "Request enrollment";


  if (requesting) {
    buttonText =
      "Sending request...";
  } else if (
    isInstructor
  ) {
    buttonText =
      "You teach this course";
  } else if (
    !canLearn
  ) {
    buttonText =
      "Your role cannot enroll";
  } else if (
    enrollmentPending
  ) {
    buttonText =
      "Enrollment pending";
  } else if (
    enrollmentApproved
  ) {
    buttonText =
      "Enrollment approved";
  } else if (
    enrollmentCompleted
  ) {
    buttonText =
      "Course completed";
  } else if (
    !hasEnoughCredits
  ) {
    buttonText =
      `Need ${
        price - credits
      } more SS`;
  } else if (
    enrollmentRejected ||
    enrollmentCancelled
  ) {
    buttonText =
      "Request enrollment again";
  }


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
            Loading course
          </p>
        </div>
      </main>
    );
  }


  /* =========================================================
     ERROR PAGE
  ========================================================= */

  if (
    !course
  ) {
    return (
      <main className="relative grid min-h-screen place-items-center bg-[#060807] px-5 text-[#f2f4ef]">
        <div className="noise pointer-events-none fixed inset-0" />

        <div className="relative z-10 max-w-lg border border-white/10 bg-[#0a0d0b] p-8">
          <BookOpen
            size={26}
            className="text-[#737373]"
          />

          <h1 className="mt-5 text-3xl font-medium tracking-[-0.05em]">
            Course unavailable.
          </h1>

          <p className="mt-3 text-sm leading-7 text-[#a1a1aa]">
            {error ||
              "This course could not be found."}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/courses"
              )
            }
            className="mt-6 inline-flex min-h-11 items-center gap-2 bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008]"
          >
            <ArrowLeft
              size={15}
            />

            Back to courses
          </button>
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
            "radial-gradient(ellipse at 82% 4%, rgba(199,255,57,.065), transparent 35%)",
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
                  "/courses"
                )
              }
              className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] transition hover:text-white"
            >
              <ArrowLeft
                size={16}
              />

              Course discovery
            </button>


            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#c7ff39]">
                SkillSwap+
              </p>

              <p className="mt-1 text-xs text-[#a1a1aa]">
                Course details
              </p>
            </div>
          </div>
        </header>


        {/* ===================================================
            CONTENT
        =================================================== */}

        <div className="mx-auto max-w-[1400px] px-5 pb-20 pt-28 md:px-8 lg:px-10 lg:pt-32">
          {/* ERROR */}

          {error && (
            <div
              role="alert"
              className="mb-6 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm text-[#ff8b8b]"
            >
              {error}
            </div>
          )}


          {/* SUCCESS */}

          {success && (
            <div
              role="status"
              className="mb-6 border border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] px-4 py-3 text-sm text-[#c7ff39]"
            >
              {success}
            </div>
          )}


          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            {/* ===============================================
                MAIN COURSE
            =============================================== */}

            <section className="border border-white/10 bg-[#0a0d0b]/75">
              {/* HERO */}

              <div className="border-b border-white/10 p-7 md:p-9 lg:p-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="border border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] px-2.5 py-1 text-[9px] uppercase tracking-[0.15em] text-[#c7ff39]">
                    Active
                  </span>

                  <span className="border border-white/10 bg-white/[0.02] px-2.5 py-1 text-[9px] uppercase tracking-[0.15em] text-[#a1a1aa]">
                    {
                      course.course_level
                    }
                  </span>
                </div>


                <div className="mt-7 grid h-14 w-14 place-items-center border border-[#c7ff39]/20 bg-[#c7ff39]/[0.04] text-[#c7ff39]">
                  <GraduationCap
                    size={23}
                  />
                </div>


                <p className="mt-7 text-[10px] uppercase tracking-[0.18em] text-[#c7ff39]">
                  {
                    skill?.name ||
                    "Course"
                  }
                </p>


                <h1 className="mt-3 max-w-4xl text-4xl font-medium tracking-[-0.055em] md:text-5xl lg:text-6xl">
                  {
                    course.title
                  }
                </h1>


                <p className="mt-6 max-w-2xl text-sm leading-7 text-[#a1a1aa]">
                  Learn directly from a
                  SkillSwap+ instructor.
                  Enrollment begins with a
                  request and your SS credits
                  are only transferred after
                  instructor approval.
                </p>
              </div>


              {/* DETAILS */}

              <div className="grid md:grid-cols-3">
                <DetailItem
                  icon={
                    BookOpen
                  }
                  label="Skill"
                  value={
                    skill?.name ||
                    "—"
                  }
                />

                <DetailItem
                  icon={
                    GraduationCap
                  }
                  label="Level"
                  value={
                    course.course_level ||
                    "—"
                  }
                />

                <DetailItem
                  icon={
                    Coins
                  }
                  label="Price"
                  value={`${course.price_credits} SS`}
                  last
                />
              </div>


              {/* INSTRUCTOR */}

              <div className="border-t border-white/10 p-7 md:p-9 lg:p-10">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#a1a1aa]">
                  Instructor
                </p>


                <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
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
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-white/[0.03]">
                      <UserRound
                        size={22}
                        className="text-[#737373]"
                      />
                    </div>
                  )}


                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-medium tracking-[-0.035em]">
                        {
                          instructor?.full_name ||
                          "Instructor"
                        }
                      </h2>

                      <BadgeCheck
                        size={16}
                        className="text-[#c7ff39]"
                      />
                    </div>


                    <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-[#c7ff39]">
                      {getRoleLabel(
                        instructor?.role
                      )}
                    </p>


                    {instructor
                      ?.location && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-[#a1a1aa]">
                        <MapPin
                          size={13}
                        />

                        {
                          instructor.location
                        }
                      </div>
                    )}
                  </div>
                </div>


                {instructor
                  ?.bio && (
                  <p className="mt-6 max-w-3xl text-sm leading-7 text-[#a1a1aa]">
                    {
                      instructor.bio
                    }
                  </p>
                )}
              </div>
            </section>


            {/* ===============================================
                ENROLLMENT CARD
            =============================================== */}

            <aside className="h-fit border border-white/10 bg-[#0a0d0b] lg:sticky lg:top-28">
              <div className="border-b border-white/10 p-6">
                <p className="text-[10px] uppercase tracking-[0.17em] text-[#a1a1aa]">
                  Enrollment
                </p>


                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-4xl font-medium tracking-[-0.055em] text-[#c7ff39]">
                      {
                        course.price_credits
                      }
                    </p>

                    <p className="mt-1 text-xs text-[#a1a1aa]">
                      SS credits
                    </p>
                  </div>

                  <Coins
                    size={23}
                    className="text-[#c7ff39]"
                  />
                </div>
              </div>


              {/* BALANCE */}

              <div className="border-b border-white/10 p-6">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-[#a1a1aa]">
                    Your balance
                  </span>

                  <span className="text-sm font-medium">
                    {
                      credits
                    }{" "}
                    SS
                  </span>
                </div>


                <div className="mt-4 flex items-center gap-2 text-xs text-[#a1a1aa]">
                  <ShieldCheck
                    size={14}
                    className="text-[#c7ff39]"
                  />

                  No SS is deducted when
                  requesting enrollment.
                </div>
              </div>


              {/* CURRENT STATUS */}

              {enrollment && (
                <div className="border-b border-white/10 p-6">
                  <p className="text-[9px] uppercase tracking-[0.15em] text-[#a1a1aa]">
                    Current status
                  </p>


                  <div className="mt-3 flex items-center gap-2">
                    {enrollmentPending ? (
                      <Clock3
                        size={16}
                        className="text-[#c7ff39]"
                      />
                    ) : (
                      <CheckCircle2
                        size={16}
                        className="text-[#c7ff39]"
                      />
                    )}

                    <span className="text-sm font-medium">
                      {
                        enrollment.status
                      }
                    </span>
                  </div>
                </div>
              )}


              {/* ACTION */}

              <div className="p-6">
                <button
                  type="button"
                  onClick={
                    requestEnrollment
                  }
                  disabled={
                    requestDisabled
                  }
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008] transition hover:bg-[#d4ff66] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-[#737373]"
                >
                  {requesting && (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  )}

                  {
                    buttonText
                  }
                </button>


                <p className="mt-4 text-xs leading-6 text-[#737373]">
                  The instructor must approve
                  your enrollment before SS
                  credits are transferred.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}


/* =========================================================
   DETAIL ITEM
========================================================= */

function DetailItem({
  icon: Icon,
  label,
  value,
  last = false,
}) {
  return (
    <div
      className={`p-6 ${
        last
          ? ""
          : "border-b border-white/10 md:border-b-0 md:border-r"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon
          size={14}
          className="text-[#c7ff39]"
        />

        <p className="text-[9px] uppercase tracking-[0.15em] text-[#a1a1aa]">
          {label}
        </p>
      </div>

      <p className="mt-3 text-lg font-medium tracking-[-0.025em]">
        {value}
      </p>
    </div>
  );
}