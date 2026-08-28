import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  BookOpen,
  Check,
  Clock3,
  Coins,
  GraduationCap,
  Loader2,
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
   HELPERS
========================================================= */

function normalizeRole(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}


function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(
    new Date(value)
  );
}


/* =========================================================
   PAGE
========================================================= */

export default function EnrollmentRequests() {
  const navigate =
    useNavigate();


  const [
    user,
    setUser,
  ] = useState(null);


  const [
    profile,
    setProfile,
  ] = useState(null);


  const [
    enrollments,
    setEnrollments,
  ] = useState([]);


  const [
    courses,
    setCourses,
  ] = useState([]);


  const [
    learners,
    setLearners,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    actionId,
    setActionId,
  ] = useState(null);


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
    let active = true;


    const load =
      async () => {
        try {
          setLoading(true);
          setError("");


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


          /* PROFILE */

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
                  full_name,
                  role,
                  is_active,
                  profile_completed,
                  credits
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


          const normalizedProfile =
            {
              ...profileData,

              role:
                normalizeRole(
                  profileData.role
                ),
            };


          if (
            ![
              "mentor",
              "swap_master",
            ].includes(
              normalizedProfile.role
            )
          ) {
            navigate(
              "/dashboard",
              {
                replace: true,
              }
            );

            return;
          }


          if (!active) {
            return;
          }


          setProfile(
            normalizedProfile
          );


          /* ===============================================
             PENDING REQUESTS
          =============================================== */

          const {
            data:
              enrollmentData,

            error:
              enrollmentError,
          } =
            await supabase
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
                  created_at
                `
              )
              .eq(
                "instructor_id",
                authUser.id
              )
              .eq(
                "status",
                "Pending"
              )
              .order(
                "created_at",
                {
                  ascending: false,
                }
              );


          if (
            enrollmentError
          ) {
            throw enrollmentError;
          }


          const rows =
            enrollmentData ||
            [];


          if (!active) {
            return;
          }


          setEnrollments(
            rows
          );


          const courseIds = [
            ...new Set(
              rows
                .map(
                  (row) =>
                    row.course_id
                )
                .filter(Boolean)
            ),
          ];


          const learnerIds = [
            ...new Set(
              rows
                .map(
                  (row) =>
                    row.learner_id
                )
                .filter(Boolean)
            ),
          ];


          const [
            courseResult,
            learnerResult,
          ] =
            await Promise.all([
              courseIds.length
                ? supabase
                    .from(
                      "courses"
                    )
                    .select(
                      `
                        id,
                        title,
                        skill_id,
                        course_level,
                        price_credits,
                        status
                      `
                    )
                    .in(
                      "id",
                      courseIds
                    )

                : Promise.resolve({
                    data: [],
                    error: null,
                  }),


              learnerIds.length
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
                        location,
                        credits,
                        is_active
                      `
                    )
                    .in(
                      "id",
                      learnerIds
                    )

                : Promise.resolve({
                    data: [],
                    error: null,
                  }),
            ]);


          if (
            courseResult.error
          ) {
            throw (
              courseResult.error
            );
          }


          if (
            learnerResult.error
          ) {
            throw (
              learnerResult.error
            );
          }


          if (!active) {
            return;
          }


          setCourses(
            courseResult.data ||
              []
          );


          setLearners(
            learnerResult.data ||
              []
          );
        } catch (err) {
          console.error(
            "ENROLLMENT REQUEST LOAD ERROR:",
            err
          );


          if (active) {
            setError(
              err?.message ||
                "We couldn't load enrollment requests."
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

  const courseMap =
    useMemo(
      () =>
        new Map(
          courses.map(
            (course) => [
              course.id,
              course,
            ]
          )
        ),
      [courses]
    );


  const learnerMap =
    useMemo(
      () =>
        new Map(
          learners.map(
            (learner) => [
              learner.id,
              learner,
            ]
          )
        ),
      [learners]
    );


  /* =========================================================
     APPROVE
  ========================================================= */

  const approve =
    async (
      enrollment
    ) => {
      if (
        actionId ||
        !enrollment
      ) {
        return;
      }


      try {
        setActionId(
          enrollment.id
        );

        setError("");
        setSuccess("");


        const {
          data,
          error:
            approveError,
        } =
          await supabase.rpc(
            "approve_course_enrollment",
            {
              p_enrollment_id:
                enrollment.id,
            }
          );


        if (approveError) {
          throw approveError;
        }


        setEnrollments(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                enrollment.id
            )
        );


        if (
          data?.instructor_balance !=
          null
        ) {
          setProfile(
            (current) => ({
              ...current,

              credits:
                data.instructor_balance,
            })
          );
        }


        setSuccess(
          `Enrollment approved. ${enrollment.price_credits} SS was transferred successfully.`
        );
      } catch (err) {
        console.error(
          "APPROVE ENROLLMENT ERROR:",
          err
        );


        const message =
          String(
            err?.message ||
              ""
          );


        if (
          message.includes(
            "INSUFFICIENT_CREDITS"
          )
        ) {
          setError(
            "The learner no longer has enough SS credits. The enrollment was not approved."
          );

          return;
        }


        if (
          message.includes(
            "ENROLLMENT_NOT_PENDING"
          )
        ) {
          setError(
            "This enrollment request has already been processed."
          );

          return;
        }


        if (
          message.includes(
            "COURSE_NOT_ACTIVE"
          )
        ) {
          setError(
            "This course is no longer active."
          );

          return;
        }


        if (
          message.includes(
            "NOT_ENROLLMENT_INSTRUCTOR"
          )
        ) {
          setError(
            "You are not authorized to approve this enrollment."
          );

          return;
        }


        setError(
          err?.message ||
            "The enrollment could not be approved."
        );
      } finally {
        setActionId(null);
      }
    };


  /* =========================================================
     REJECT
  ========================================================= */

  const reject =
    async (
      enrollment
    ) => {
      if (
        actionId ||
        !enrollment
      ) {
        return;
      }


      try {
        setActionId(
          enrollment.id
        );

        setError("");
        setSuccess("");


        const {
          error:
            rejectError,
        } =
          await supabase.rpc(
            "reject_course_enrollment",
            {
              p_enrollment_id:
                enrollment.id,
            }
          );


        if (rejectError) {
          throw rejectError;
        }


        setEnrollments(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                enrollment.id
            )
        );


        setSuccess(
          "Enrollment request rejected. No SS credits were transferred."
        );
      } catch (err) {
        console.error(
          "REJECT ENROLLMENT ERROR:",
          err
        );


        setError(
          err?.message ||
            "The enrollment request could not be rejected."
        );
      } finally {
        setActionId(null);
      }
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
            Loading requests
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
      <div className="noise pointer-events-none fixed inset-0 z-0" />


      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 85% 0%, rgba(199,255,57,.055), transparent 34%)",
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
                Enrollment requests
              </p>
            </div>
          </div>
        </header>


        {/* CONTENT */}

        <div className="mx-auto max-w-[1400px] px-5 pb-20 pt-28 md:px-8 lg:px-10 lg:pt-32">
          <section className="border-b border-white/10 pb-8">
            <div className="flex items-center gap-2 text-[#c7ff39]">
              <GraduationCap
                size={16}
              />

              <p className="text-[10px] uppercase tracking-[0.18em]">
                Instructor workspace
              </p>
            </div>


            <div className="mt-4 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <h1 className="text-4xl font-medium tracking-[-0.055em] md:text-5xl">
                  Enrollment requests.
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#a1a1aa]">
                  Review learners who want to
                  join your courses. SS credits
                  move only when you approve a
                  request.
                </p>
              </div>


              <div className="border border-white/10 bg-[#0a0d0b] px-5 py-4">
                <p className="text-[9px] uppercase tracking-[0.15em] text-[#a1a1aa]">
                  Your SS balance
                </p>

                <p className="mt-1 text-2xl font-medium text-[#c7ff39]">
                  {
                    profile?.credits ||
                    0
                  }{" "}
                  SS
                </p>
              </div>
            </div>
          </section>


          {error && (
            <div className="mt-6 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm text-[#ff8b8b]">
              {error}
            </div>
          )}


          {success && (
            <div className="mt-6 border border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] px-4 py-3 text-sm text-[#c7ff39]">
              {success}
            </div>
          )}


          {/* EMPTY */}

          {enrollments.length ===
          0 ? (
            <section className="mt-6 border border-white/10 bg-[#0a0d0b]/70 p-9 md:p-12">
              <Clock3
                size={24}
                className="text-[#737373]"
              />


              <h2 className="mt-5 text-2xl font-medium tracking-[-0.04em]">
                No pending requests.
              </h2>


              <p className="mt-2 max-w-xl text-sm leading-7 text-[#a1a1aa]">
                New enrollment requests for
                your courses will appear here.
              </p>
            </section>
          ) : (
            /* REQUESTS */

            <section className="mt-6 grid gap-4">
              {enrollments.map(
                (
                  enrollment
                ) => {
                  const course =
                    courseMap.get(
                      enrollment.course_id
                    );


                  const learner =
                    learnerMap.get(
                      enrollment.learner_id
                    );


                  const processing =
                    actionId ===
                    enrollment.id;


                  return (
                    <article
                      key={
                        enrollment.id
                      }
                      className="border border-white/10 bg-[#0a0d0b]/80 p-6"
                    >
                      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="border border-[#c7ff39]/20 bg-[#c7ff39]/[0.04] px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-[#c7ff39]">
                              Pending
                            </span>


                            {course?.course_level && (
                              <span className="border border-white/10 px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-[#a1a1aa]">
                                {
                                  course.course_level
                                }
                              </span>
                            )}
                          </div>


                          <div className="mt-5 flex items-center gap-4">
                            {learner
                              ?.avatar_url ? (
                              <img
                                src={
                                  learner.avatar_url
                                }
                                alt={
                                  learner.full_name ||
                                  "Learner"
                                }
                                className="h-12 w-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="grid h-12 w-12 place-items-center rounded-full border border-white/10">
                                <UserRound
                                  size={18}
                                  className="text-[#737373]"
                                />
                              </div>
                            )}


                            <div className="min-w-0">
                              <h2 className="truncate text-lg font-medium">
                                {
                                  learner?.full_name ||
                                  "Learner"
                                }
                              </h2>

                              <p className="mt-1 text-xs text-[#a1a1aa]">
                                @
                                {
                                  learner?.username ||
                                  "member"
                                }
                              </p>
                            </div>
                          </div>


                          <div className="mt-6 grid gap-4 sm:grid-cols-3">
                            <Info
                              icon={
                                BookOpen
                              }
                              label="Course"
                              value={
                                course?.title ||
                                "Course"
                              }
                            />

                            <Info
                              icon={
                                Coins
                              }
                              label="Price"
                              value={`${enrollment.price_credits} SS`}
                            />

                            <Info
                              icon={
                                Clock3
                              }
                              label="Requested"
                              value={formatDate(
                                enrollment.created_at
                              )}
                            />
                          </div>
                        </div>


                        {/* ACTIONS */}

                        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                          <button
                            type="button"
                            disabled={
                              processing
                            }
                            onClick={() =>
                              approve(
                                enrollment
                              )
                            }
                            className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008] transition hover:bg-[#d4ff66] disabled:opacity-50"
                          >
                            {processing ? (
                              <Loader2
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Check
                                size={15}
                              />
                            )}

                            Approve
                          </button>


                          <button
                            type="button"
                            disabled={
                              processing
                            }
                            onClick={() =>
                              reject(
                                enrollment
                              )
                            }
                            className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/15 px-5 text-sm text-[#a1a1aa] transition hover:border-[#ff6b6b]/40 hover:text-[#ff8b8b] disabled:opacity-50"
                          >
                            <X
                              size={15}
                            />

                            Reject
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}


/* =========================================================
   INFO
========================================================= */

function Info({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon
          size={13}
          className="text-[#c7ff39]"
        />

        <p className="text-[9px] uppercase tracking-[0.14em] text-[#737373]">
          {label}
        </p>
      </div>

      <p className="mt-2 text-sm text-[#f2f4ef]">
        {value}
      </p>
    </div>
  );
}