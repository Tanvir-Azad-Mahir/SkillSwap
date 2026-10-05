import {

  useEffect,

  useMemo,

  useState,

} from "react";



import {

  ArrowLeft,

  Award,

  BookOpen,

  ChevronRight,

  GraduationCap,

  Layers3,

  Loader2,

  Plus,

  Star,

  Trash2,

  X,

} from "lucide-react";



import {

  useNavigate,

} from "react-router-dom";



import {

  supabase,

} from "../lib/supabase";



/* =========================================================

   ROLE NORMALIZER

\========================================================= */



function normalizeRole(value) {

  const role = String(value || "")

    .trim()

    .toLowerCase()

    .replace(/[\s-]+/g, "_");



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



/* =========================================================

   STATUS STYLES

\========================================================= */



function getCourseStatusClasses(status) {

  const clean = String(status || "")

    .trim()

    .toLowerCase();



  if (clean === "active") {

    return "border-[#c7ff39]/30 bg-[#c7ff39]/[0.06] text-[#c7ff39]";

  }



  if (clean === "pending") {

    return "border-[#ffbf69]/30 bg-[#ffbf69]/[0.06] text-[#ffca80]";

  }



  if (clean === "suspended") {

    return "border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.06] text-[#ff8b8b]";

  }



  if (clean === "approved") {

    return "border-[#c7ff39]/30 bg-[#c7ff39]/[0.06] text-[#c7ff39]";

  }



  if (clean === "completed") {

    return "border-[#7dd3fc]/30 bg-[#7dd3fc]/[0.06] text-[#9bdcff]";

  }



  return "border-white/10 bg-white/[0.03] text-[#a1a1aa]";

}



/* =========================================================

   MY COURSES

\========================================================= */



export default function MyCourses() {

  const navigate =

    useNavigate();



  const [

    profile,

    setProfile,

  ] = useState(null);



  const [

    skills,

    setSkills,

  ] = useState([]);



  const [

    teachingCourses,

    setTeachingCourses,

  ] = useState([]);



  const [

    learningCourses,

    setLearningCourses,

  ] = useState([]);



  const [

    reviewCourse,

    setReviewCourse,

  ] = useState(null);



  const [

    reviewRating,

    setReviewRating,

  ] = useState(5);



  const [

    reviewComment,

    setReviewComment,

  ] = useState("");



  const [

    reviewAction,

    setReviewAction,

  ] = useState("");



  const [

    loading,

    setLoading,

  ] = useState(true);



  const [

    error,

    setError,

  ] = useState("");



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



          /* ===============================================

             AUTH

          =============================================== */



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



          /* ===============================================

             PROFILE

          =============================================== */



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

                  avatar_url,

                  role,

                  is_active,

                  profile_completed

                `

              )

              .eq(

                "id",

                user.id

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



          const normalizedProfile =

            {

              ...profileData,



              role:

                normalizeRole(

                  profileData.role

                ),

            };



          if (!active) {

            return;

          }



          setProfile(

            normalizedProfile

          );



          /* ===============================================

             LOAD SKILLS + OWN COURSES + OWN ENROLLMENTS

          =============================================== */



          const [

            skillsResult,

            coursesResult,

            enrollmentsResult,

          ] =

            await Promise.all([

              supabase

                .from("skills")

                .select(

                  `

                    id,

                    name

                  `

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

                ),



              supabase

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

                  "instructor_id",

                  user.id

                )

                .order(

                  "created_at",

                  {

                    ascending: false,

                  }

                ),



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

                  "learner_id",

                  user.id

                )

                .in(

                  "status",

                  [

                    "Approved",

                    "Completed",

                  ]

                )

                .order(

                  "created_at",

                  {

                    ascending: false,

                  }

                ),

            ]);



          if (!active) {

            return;

          }



          /* ===============================================

             SKILLS

          =============================================== */



          if (skillsResult.error) {

            console.warn(

              "MY COURSES SKILLS ERROR:",

              skillsResult.error

            );



            setSkills([]);

          } else {

            setSkills(

              skillsResult.data ||

                []

            );

          }



          /* ===============================================

             TEACHING COURSES

          =============================================== */



          if (coursesResult.error) {

            console.warn(

              "MY COURSES TEACHING ERROR:",

              coursesResult.error

            );



            setTeachingCourses(

              []

            );

          } else {

            setTeachingCourses(

              coursesResult.data ||

                []

            );

          }



          /* ===============================================

             LEARNING COURSES

          =============================================== */



          if (

            enrollmentsResult.error

          ) {

            console.warn(

              "MY COURSES ENROLLMENT ERROR:",

              enrollmentsResult.error

            );



            setLearningCourses(

              []

            );



            return;

          }



          const enrollmentRows =

            enrollmentsResult.data ||

            [];



          if (

            enrollmentRows.length ===

            0

          ) {

            setLearningCourses(

              []

            );



            return;

          }



          const courseIds =

            [

              ...new Set(

                enrollmentRows

                  .map(

                    (row) =>

                      row.course_id

                  )

                  .filter(

                    Boolean

                  )

              ),

            ];



          const instructorIds =

            [

              ...new Set(

                enrollmentRows

                  .map(

                    (row) =>

                      row.instructor_id

                  )

                  .filter(

                    Boolean

                  )

              ),

            ];



          const [

            enrolledCoursesResult,

            instructorsResult,

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

                        instructor_id,

                        skill_id,

                        price_credits,

                        course_level,

                        status,

                        created_at

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



              instructorIds.length

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

                        role

                      `

                    )

                    .in(

                      "id",

                      instructorIds

                    )

                : Promise.resolve({

                    data: [],

                    error: null,

                  }),

            ]);



          if (

            enrolledCoursesResult.error

          ) {

            console.warn(

              "MY COURSES ENROLLED COURSE ERROR:",

              enrolledCoursesResult.error

            );

          }



          if (

            instructorsResult.error

          ) {

            console.warn(

              "MY COURSES INSTRUCTOR ERROR:",

              instructorsResult.error

            );

          }



          const courseMap =

            new Map(

              (

                enrolledCoursesResult.data ||

                []

              ).map(

                (course) => [

                  course.id,

                  course,

                ]

              )

            );



          const instructorMap =

            new Map(

              (

                instructorsResult.data ||

                []

              ).map(

                (

                  instructor

                ) => [

                  instructor.id,

                  instructor,

                ]

              )

            );



          const joined =

            enrollmentRows

              .map(

                (

                  enrollment

                ) => {

                  const course =

                    courseMap.get(

                      enrollment.course_id

                    );



                  if (!course) {

                    return null;

                  }



                  return {

                    ...course,



                    enrollment_id:

                      enrollment.id,



                    enrollment_status:

                      enrollment.status,



                    approved_at:

                      enrollment.approved_at,



                    completed_at:

                      enrollment.completed_at,



                    enrolled_at:

                      enrollment.created_at,



                    paid_credits:

                      enrollment.price_credits,



                    instructor:

                      instructorMap.get(

                        enrollment.instructor_id

                      ) ||

                      null,

                  };

                }

              )

              .filter(

                Boolean

              );



          /* ===============================================

             CERTIFICATES FOR FINISHED COURSES

          =============================================== */



          const completedEnrollmentIds =

            enrollmentRows

              .filter(

                (row) =>

                  row.status ===

                  "Completed"

              )

              .map(

                (row) =>

                  row.id

              );



          let certificateMap =

            new Map();



          if (

            completedEnrollmentIds.length >

            0

          ) {

            const {

              data:

                certificateRows,

              error:

                certificateError,

            } =

              await supabase

                .from(

                  "certificates"

                )

                .select(

                  `

                    id,

                    enrollment_id,

                    certificate_number,

                    verification_code,

                    final_score,

                    issued_at

                  `

                )

                .in(

                  "enrollment_id",

                  completedEnrollmentIds

                );



            if (

              certificateError

            ) {

              console.warn(

                "MY COURSES CERTIFICATE ERROR:",

                certificateError

              );

            } else {

              certificateMap =

                new Map(

                  (

                    certificateRows ||

                    []

                  ).map(

                    (

                      certificate

                    ) => [

                      certificate.enrollment_id,

                      certificate,

                    ]

                  )

                );

            }

          }



          let reviewMap = new Map();



          if (courseIds.length > 0) {

            const { data: reviewRows, error: reviewError } = await supabase

              .from("course_reviews")

              .select(`id, course_id, reviewer_id, rating, comment, created_at, updated_at`)

              .eq("reviewer_id", user.id)

              .in("course_id", courseIds);



            if (reviewError) {

              console.warn("MY COURSES REVIEW ERROR:", reviewError);

            } else {

              reviewMap = new Map((reviewRows || []).map((review) => [review.course_id, review]));

            }

          }



          const joinedWithCertificates = joined.map((course) => ({

            ...course,

            certificate: certificateMap.get(course.enrollment_id) || null,

            review: reviewMap.get(course.id) || null,

          }));



          setLearningCourses(joinedWithCertificates);

        } catch (err) {

          console.error(

            "MY COURSES LOAD ERROR:",

            err

          );



          if (!active) {

            return;

          }



          setError(

            err?.message ||

              "We couldn't load your courses."

          );

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

     COURSE REVIEW ACTIONS

  ========================================================= */



  const openReviewModal = (course) => {

    if (!course || course.enrollment_status !== "Completed" || !course.completed_at || course.review) return;

    setReviewCourse(course);

    setReviewRating(5);

    setReviewComment("");

    setError("");

  };



  const closeReviewModal = () => {

    if (reviewAction) return;

    setReviewCourse(null);

    setReviewRating(5);

    setReviewComment("");

  };



  const submitCourseReview = async () => {

    if (!reviewCourse || reviewCourse.enrollment_status !== "Completed" || !reviewCourse.completed_at || reviewCourse.review || reviewAction) return;

    try {

      setReviewAction(`submit-${reviewCourse.id}`);

      setError("");

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) { navigate("/login"); return; }

      const { data: insertedReview, error: reviewError } = await supabase

        .from("course_reviews")

        .insert({ course_id: reviewCourse.id, reviewer_id: user.id, rating: Number(reviewRating), comment: reviewComment.trim() || null })

        .select(`id, course_id, reviewer_id, rating, comment, created_at, updated_at`)

        .single();

      if (reviewError) throw reviewError;

      setLearningCourses((current) => current.map((course) => course.id === reviewCourse.id ? { ...course, review: insertedReview } : course));

      setReviewCourse(null);

      setReviewRating(5);

      setReviewComment("");

    } catch (err) {

      console.error("COURSE REVIEW SUBMIT ERROR:", err);

      const message = String(err?.message || "");

      setError(message.includes("duplicate key") || message.includes("course_reviews_course_reviewer_unique") ? "You have already reviewed this course." : err?.message || "Your course review could not be submitted.");

    } finally {

      setReviewAction("");

    }

  };



  const deleteCourseReview = async (course) => {

    if (!course?.review?.id || reviewAction) return;

    const confirmed = window.confirm(`Delete your review for "${course.title}"?`);

    if (!confirmed) return;

    try {

      setReviewAction(`delete-${course.review.id}`);

      setError("");

      const { error: deleteError } = await supabase.from("course_reviews").delete().eq("id", course.review.id);

      if (deleteError) throw deleteError;

      setLearningCourses((current) => current.map((item) => item.id === course.id ? { ...item, review: null } : item));

    } catch (err) {

      console.error("COURSE REVIEW DELETE ERROR:", err);

      setError(err?.message || "Your course review could not be deleted.");

    } finally {

      setReviewAction("");

    }

  };



  /* =========================================================

     DERIVED DATA

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



  const teachingItems =

    useMemo(() => {

      return teachingCourses.map(

        (course) => ({

          ...course,



          skill:

            skillMap.get(

              course.skill_id

            ) ||

            null,

        })

      );

    }, [

      teachingCourses,

      skillMap,

    ]);



  const learningItems =

    useMemo(() => {

      return learningCourses.map(

        (course) => ({

          ...course,



          skill:

            skillMap.get(

              course.skill_id

            ) ||

            null,

        })

      );

    }, [

      learningCourses,

      skillMap,

    ]);



  const activeLearning =

    learningItems.filter(

      (course) =>

        course.enrollment_status ===

        "Approved"

    );



  const completedLearning =

    learningItems.filter(

      (course) =>

        course.enrollment_status ===

        "Completed"

    );



  const canTeach =

    profile?.role ===

      "mentor" ||

    profile?.role ===

      "swap_master";



  const canLearn =

    profile?.role ===

      "learner" ||

    profile?.role ===

      "swap_master";



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

            Loading courses

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

            "radial-gradient(ellipse at 80% 0%, rgba(199,255,57,.06), transparent 38%)",

        }}

      />



      <div className="relative z-10">

        {/* =================================================

            SIMPLE HEADER

        ================================================= */}



        <header className="border-b border-white/10 bg-[#060807]/90 backdrop-blur-xl">

          <div className="mx-auto flex min-h-[72px] max-w-[1500px] items-center justify-between gap-4 px-5 md:px-8 lg:px-10">

            <button

              type="button"

              onClick={() =>

                navigate(

                  "/dashboard"

                )

              }

              className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] transition hover:text-[#c7ff39]"

            >

              <ArrowLeft

                size={16}

              />



              Dashboard

            </button>



            <button

              type="button"

              onClick={() =>

                navigate(

                  "/courses"

                )

              }

              className="inline-flex min-h-10 items-center justify-center gap-2 border border-white/10 px-4 text-xs font-medium text-[#f2f4ef] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"

            >

              <BookOpen

                size={14}

              />



              Explore courses

            </button>

          </div>

        </header>



        {/* =================================================

            CONTENT

        ================================================= */}



        <div className="mx-auto max-w-[1500px] px-5 pb-20 pt-10 md:px-8 lg:px-10">

          {/* PAGE TITLE */}



          <section className="border-b border-white/10 pb-8">

            <p className="text-[10px] uppercase tracking-[0.18em] text-[#c7ff39]">

              Course workspace

            </p>



            <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">

              <div>

                <h1 className="text-3xl font-medium tracking-[-0.05em] md:text-4xl">

                  My Courses

                </h1>



                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#a1a1aa]">

                  Manage the courses you teach and continue the courses you are learning.

                </p>

              </div>



              {canTeach && (

                <button

                  type="button"

                  onClick={() =>

                    navigate(

                      "/courses/create"

                    )

                  }

                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008] transition hover:bg-[#d4ff66]"

                >

                  <Plus

                    size={16}

                  />



                  Create new course

                </button>

              )}

            </div>

          </section>



          {error && (

            <div className="mt-6 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm text-[#ff8b8b]">

              {error}

            </div>

          )}



          {/* =================================================

              TEACHING

          ================================================= */}



          {canTeach && (

            <section className="mt-8 border border-white/10 bg-[#0a0d0b]/70">

              <div className="flex items-center justify-between gap-4 border-b border-white/10 p-6">

                <div>

                  <div className="flex items-center gap-2">

                    <GraduationCap

                      size={15}

                      className="text-[#c7ff39]"

                    />



                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">

                      Teaching

                    </p>

                  </div>



                  <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em]">

                    Courses you created

                  </h2>

                </div>



                <span className="text-sm text-[#a1a1aa]">

                  {

                    teachingItems.length

                  }

                </span>

              </div>



              {teachingItems.length >

              0 ? (

                <div className="grid md:grid-cols-2 xl:grid-cols-3">

                  {teachingItems.map(

                    (

                      course

                    ) => (

                      <article

                        key={

                          course.id

                        }

                        className="group border-b border-white/10 p-6 transition hover:bg-white/[0.02] md:border-r"

                      >

                        <div className="flex items-start justify-between gap-4">

                          <div className="grid h-10 w-10 place-items-center border border-[#c7ff39]/20 bg-[#c7ff39]/[0.04] text-[#c7ff39]">

                            <Layers3

                              size={17}

                            />

                          </div>



                          <span

                            className={`border px-2 py-1 text-[9px] uppercase tracking-[0.13em] ${getCourseStatusClasses(

                              course.status

                            )}`}

                          >

                            {course.status}

                          </span>

                        </div>



                        <p className="mt-5 text-[10px] uppercase tracking-[0.16em] text-[#a1a1aa]">

                          {course

                            .skill

                            ?.name ||

                            "Course"}

                        </p>



                        <h3 className="mt-2 line-clamp-2 text-lg font-medium tracking-[-0.025em]">

                          {

                            course.title

                          }

                        </h3>



                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/40">

                          <span>

                            {course.course_level ||

                              "Level"}

                          </span>



                          <span>

                            ·

                          </span>



                          <span>

                            {course.price_credits ??

                              0}{" "}

                            SS

                          </span>

                        </div>



                        <button

                          type="button"

                          onClick={() =>

                            navigate(

                              `/my-courses/${course.id}/manage`

                            )

                          }

                          className="mt-6 flex min-h-11 w-full items-center justify-between border border-white/10 px-4 text-sm font-medium text-[#f2f4ef] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"

                        >

                          Manage course



                          <ChevronRight

                            size={16}

                            className="transition group-hover:translate-x-1"

                          />

                        </button>

                      </article>

                    )

                  )}

                </div>

              ) : (

                <div className="p-7">

                  <GraduationCap

                    size={20}

                    className="text-white/25"

                  />



                  <h3 className="mt-4 text-lg font-medium">

                    No courses created yet.

                  </h3>



                  <p className="mt-2 text-sm text-[#a1a1aa]">

                    Create a course from one of your teaching skills.

                  </p>



                  <button

                    type="button"

                    onClick={() =>

                      navigate(

                        "/courses/create"

                      )

                    }

                    className="mt-5 inline-flex min-h-10 items-center gap-2 bg-[#c7ff39] px-4 text-xs font-semibold text-[#071008]"

                  >

                    <Plus

                      size={14}

                    />



                    Create course

                  </button>

                </div>

              )}

            </section>

          )}



          {/* =================================================

              LEARNING

          ================================================= */}



          {canLearn && (

            <section className="mt-8 border border-white/10 bg-[#0a0d0b]/70">

              <div className="border-b border-white/10 p-6">

                <div className="flex items-center gap-2">

                  <BookOpen

                    size={15}

                    className="text-[#c7ff39]"

                  />



                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">

                    Learning

                  </p>

                </div>



                <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em]">

                  Courses you are taking

                </h2>

              </div>



              {/* ACTIVE LEARNING */}



              <div className="border-b border-white/10">

                <div className="flex items-center justify-between gap-4 px-6 py-4">

                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#a1a1aa]">

                    In progress

                  </p>



                  <span className="text-xs text-white/35">

                    {

                      activeLearning.length

                    }

                  </span>

                </div>



                {activeLearning.length >

                0 ? (

                  <div className="grid md:grid-cols-2 xl:grid-cols-3">

                    {activeLearning.map(

                      (

                        course

                      ) => (

                        <article

                          key={

                            course.enrollment_id

                          }

                          className="group border-t border-r border-white/10 p-6 transition hover:bg-white/[0.02]"

                        >

                          <div className="flex items-start justify-between gap-4">

                            <div>

                              <p className="text-[10px] uppercase tracking-[0.15em] text-[#a1a1aa]">

                                {course

                                  .skill

                                  ?.name ||

                                  "Course"}

                              </p>



                              <h3 className="mt-2 text-lg font-medium">

                                {

                                  course.title

                                }

                              </h3>

                            </div>



                            <span

                              className={`border px-2 py-1 text-[9px] uppercase tracking-[0.13em] ${getCourseStatusClasses(

                                course.enrollment_status

                              )}`}

                            >

                              In progress

                            </span>

                          </div>



                          <p className="mt-4 text-xs text-[#a1a1aa]">

                            Instructor:{" "}

                            {course

                              .instructor

                              ?.full_name ||

                              course

                                .instructor

                                ?.username ||

                              "Instructor"}

                          </p>



                          <button

                            type="button"

                            onClick={() =>

                              navigate(

                                `/my-courses/${course.id}/learn`

                              )

                            }

                            className="mt-6 flex min-h-11 w-full items-center justify-between bg-[#c7ff39] px-4 text-sm font-semibold text-[#071008] transition hover:bg-[#d4ff66]"

                          >

                            Continue learning



                            <ChevronRight

                              size={16}

                            />

                          </button>

                        </article>

                      )

                    )}

                  </div>

                ) : (

                  <div className="border-t border-white/10 px-6 py-7 text-sm text-[#a1a1aa]">

                    You do not have an approved course in progress.

                  </div>

                )}

              </div>



              {/* FINISHED LEARNING */}



              <div>

                <div className="flex items-center justify-between gap-4 px-6 py-4">

                  <div className="flex items-center gap-2">

                    <Award

                      size={14}

                      className="text-[#c7ff39]"

                    />



                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#a1a1aa]">

                      Finished courses

                    </p>

                  </div>



                  <span className="text-xs text-white/35">

                    {

                      completedLearning.length

                    }

                  </span>

                </div>



                {completedLearning.length >

                0 ? (

                  <div className="grid md:grid-cols-2 xl:grid-cols-3">

                    {completedLearning.map(

                      (

                        course

                      ) => (

                        <article

                          key={

                            course.enrollment_id

                          }

                          className="group border-t border-r border-white/10 p-6 transition hover:bg-white/[0.02]"

                        >

                          <div className="flex items-start justify-between gap-4">

                            <div>

                              <p className="text-[10px] uppercase tracking-[0.15em] text-[#a1a1aa]">

                                {course

                                  .skill

                                  ?.name ||

                                  "Course"}

                              </p>



                              <h3 className="mt-2 text-lg font-medium">

                                {

                                  course.title

                                }

                              </h3>

                            </div>



                            <span

                              className={`border px-2 py-1 text-[9px] uppercase tracking-[0.13em] ${getCourseStatusClasses(

                                "Completed"

                              )}`}

                            >

                              Completed

                            </span>

                          </div>



                          <p className="mt-4 text-xs text-[#a1a1aa]">

                            Instructor:{" "}

                            {course

                              .instructor

                              ?.full_name ||

                              course

                                .instructor

                                ?.username ||

                              "Instructor"}

                          </p>



                          {course.completed_at && (

                            <p className="mt-2 text-xs text-white/35">

                              Completed{" "}

                              {new Intl.DateTimeFormat(

                                undefined,

                                {

                                  year: "numeric",

                                  month: "short",

                                  day: "numeric",

                                }

                              ).format(

                                new Date(

                                  course.completed_at

                                )

                              )}

                            </p>

                          )}



                          <div className="mt-5 border-t border-white/10 pt-5">

                            {course.review ? (

                              <div className="border border-[#c7ff39]/20 bg-[#c7ff39]/[0.035] p-4">

                                <div className="flex items-start justify-between gap-4">

                                  <div>

                                    <p className="text-[9px] uppercase tracking-[0.13em] text-[#c7ff39]">Your review</p>

                                    <div className="mt-2 flex items-center gap-1">

                                      {Array.from({ length: 5 }).map((_, index) => (

                                        <Star key={index} size={14} className={index < Number(course.review.rating) ? "text-[#c7ff39]" : "text-white/15"} />

                                      ))}

                                    </div>

                                  </div>

                                  <button type="button" onClick={() => deleteCourseReview(course)} disabled={Boolean(reviewAction)} className="inline-flex min-h-9 items-center gap-2 border border-[#ff6b6b]/20 px-3 text-[10px] uppercase tracking-[0.1em] text-[#ff8b8b] transition hover:bg-[#ff6b6b]/[0.05] disabled:opacity-50">

                                    {reviewAction === `delete-${course.review.id}` ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Delete

                                  </button>

                                </div>

                                {course.review.comment && <p className="mt-3 text-xs leading-6 text-[#a1a1aa]">{course.review.comment}</p>}

                              </div>

                            ) : (

                              <button type="button" onClick={() => openReviewModal(course)} disabled={Boolean(reviewAction)} className="flex min-h-11 w-full items-center justify-between border border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] px-4 text-sm font-medium text-[#c7ff39] transition hover:bg-[#c7ff39]/[0.08] disabled:opacity-50">

                                <span className="inline-flex items-center gap-2"><Star size={15} />Write review</span>

                                <ChevronRight size={16} />

                              </button>

                            )}

                          </div>



                          {course.certificate ? (

                            <>

                              <div className="mt-5 border border-[#c7ff39]/20 bg-[#c7ff39]/[0.04] p-4">

                                <p className="text-[9px] uppercase tracking-[0.13em] text-[#a1a1aa]">

                                  Certificate

                                </p>



                                <p className="mt-2 font-mono text-xs text-[#c7ff39]">

                                  {

                                    course

                                      .certificate

                                      .certificate_number

                                  }

                                </p>



                                {course

                                  .certificate

                                  .final_score !==

                                  null &&

                                  course

                                    .certificate

                                    .final_score !==

                                    undefined && (

                                    <p className="mt-2 text-xs text-[#a1a1aa]">

                                      Final score:{" "}

                                      {

                                        course

                                          .certificate

                                          .final_score

                                      }

                                      /100

                                    </p>

                                  )}

                              </div>



                              <button

                                type="button"

                                onClick={() =>

                                  navigate(

                                    `/certificates/${course.certificate.id}`

                                  )

                                }

                                className="mt-4 flex min-h-11 w-full items-center justify-between bg-[#c7ff39] px-4 text-sm font-semibold text-[#071008] transition hover:bg-[#d4ff66]"

                              >

                                <span className="inline-flex items-center gap-2">

                                  <Award

                                    size={15}

                                  />



                                  View certificate

                                </span>



                                <ChevronRight

                                  size={16}

                                />

                              </button>

                            </>

                          ) : (

                            <div className="mt-5 border border-white/10 px-4 py-3 text-xs text-[#a1a1aa]">

                              Certificate is not available yet.

                            </div>

                          )}

                        </article>

                      )

                    )}

                  </div>

                ) : (

                  <div className="border-t border-white/10 px-6 py-7 text-sm text-[#a1a1aa]">

                    Finished courses will appear here after instructor-approved completion.

                  </div>

                )}

              </div>

            </section>

          )}

        </div>

      </div>



      {reviewCourse && (

        <div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">

          <div className="my-8 w-full max-w-lg border border-white/10 bg-[#0a0d0b]">

            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">

              <div>

                <p className="text-[9px] uppercase tracking-[0.16em] text-[#c7ff39]">Course review</p>

                <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em]">Rate your completed course</h2>

                <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">{reviewCourse.title}</p>

              </div>

              <button type="button" onClick={closeReviewModal} disabled={Boolean(reviewAction)} className="grid h-9 w-9 shrink-0 place-items-center border border-white/10 text-[#a1a1aa] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39] disabled:opacity-50"><X size={15} /></button>

            </div>

            <div className="p-5">

              <p className="text-[10px] uppercase tracking-[0.14em] text-[#a1a1aa]">Rating</p>

              <div className="mt-3 flex items-center gap-2">

                {Array.from({ length: 5 }).map((_, index) => { const value = index + 1; return (

                  <button key={value} type="button" onClick={() => setReviewRating(value)} disabled={Boolean(reviewAction)} className="grid h-10 w-10 place-items-center border border-white/10 transition hover:border-[#c7ff39]/30 disabled:opacity-50" aria-label={`${value} star rating`}>

                    <Star size={18} className={value <= reviewRating ? "text-[#c7ff39]" : "text-white/15"} />

                  </button>

                ); })}

              </div>

              <label className="mt-6 block">

                <span className="text-[10px] uppercase tracking-[0.14em] text-[#a1a1aa]">Comment</span>

                <textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} rows={5} maxLength={1500} placeholder="Share what you thought about the course..." disabled={Boolean(reviewAction)} className="mt-2 w-full resize-none border border-white/10 bg-[#060807] px-4 py-3 text-sm leading-6 text-[#f2f4ef] outline-none transition placeholder:text-white/20 focus:border-[#c7ff39]/40 disabled:opacity-60" />

              </label>

              <p className="mt-3 text-xs leading-5 text-white/35">You can submit one active review for this course. If you delete it later, you can submit a new review.</p>

              <div className="mt-6 flex flex-col-reverse gap-2 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">

                <button type="button" onClick={closeReviewModal} disabled={Boolean(reviewAction)} className="min-h-11 border border-white/10 px-5 text-sm text-[#a1a1aa] transition hover:text-white disabled:opacity-50">Cancel</button>

                <button type="button" onClick={submitCourseReview} disabled={Boolean(reviewAction)} className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008] transition hover:bg-[#d4ff66] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-[#737373]">

                  {reviewAction === `submit-${reviewCourse.id}` ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />} Submit review

                </button>

              </div>

            </div>

          </div>

        </div>

      )}



    </main>

  );

}
