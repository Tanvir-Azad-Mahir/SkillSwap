import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  Plus,
  BookOpen,
  GraduationCap,
  Repeat2,
  Sparkles,
  WalletCards,
  Layers3,
  ChevronRight,
  Search,
  CircleDot,
  Zap,
  History as HistoryIcon,
  Inbox,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabase";

import DashboardHeader from "../components/DashboardHeader";
import WelcomePanel from "../components/WelcomePanel";
import QuickActions from "../components/QuickActions";
import SkillSection from "../components/SkillSection";
import UpcomingSessions from "../components/UpcomingSessions";
import CreditActivity from "../components/CreditActivity";
import DashboardStats from "../components/DashboardStats";
import DashboardCourses from "../components/DashboardCourses";
import RecommendedMentors from "../components/RecommendedMentors";

/* =========================================================
   ROLE NORMALIZER
========================================================= */

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
   ROLE LABEL
========================================================= */

function getRoleLabel(role) {
  if (role === "learner") {
    return "Learner";
  }

  if (role === "mentor") {
    return "Mentor";
  }

  if (role === "swap_master") {
    return "Swap Master";
  }

  return "Member";
}

/* =========================================================
   COURSE STATUS
========================================================= */

function getCourseStatusClasses(status) {
  const clean =
    String(status || "")
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

  return "border-white/10 bg-white/[0.03] text-[#a1a1aa]";
}

/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard() {
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
    skills,
    setSkills,
  ] = useState([]);

  const [
    teaching,
    setTeaching,
  ] = useState([]);

  const [
    learning,
    setLearning,
  ] = useState([]);

  const [
    searchProfiles,
    setSearchProfiles,
  ] = useState([]);

  const [
    mentorOfferings,
    setMentorOfferings,
  ] = useState([]);

  const [
    sessions,
    setSessions,
  ] = useState([]);

  const [
    wallet,
    setWallet,
  ] = useState(null);

  const [
    transactions,
    setTransactions,
  ] = useState([]);

  /* =========================================================
     CURRENT USER COURSES
  ========================================================= */

  const [
    myCourses,
    setMyCourses,
  ] = useState([]);

  /* =========================================================
     LEARNER COURSE ENROLLMENTS
  ========================================================= */

  const [
    takenCourses,
    setTakenCourses,
  ] = useState([]);

  const [
    finishedCourses,
    setFinishedCourses,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /* =========================================================
     LOAD DASHBOARD
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
             CURRENT PROFILE
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
                  email,
                  avatar_url,
                  bio,
                  role,
                  career_goal,
                  location,
                  is_active,
                  credits,
                  profile_completed
                `
              )
              .eq(
                "id",
                authUser.id
              )
              .maybeSingle();

          if (
            profileError
          ) {
            console.error(
              "CURRENT PROFILE ERROR:",
              profileError
            );

            throw profileError;
          }

          if (
            !profileData
          ) {
            throw new Error(
              "PROFILE_NOT_FOUND"
            );
          }

          /* ===================================================
             ACTIVE ACCOUNT
          =================================================== */

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

          /* ===================================================
             PROFILE SETUP
          =================================================== */

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

          if (!active) {
            return;
          }

          /* ===================================================
             NORMALIZE ROLE
          =================================================== */

          const normalizedProfile =
            {
              ...profileData,

              role:
                normalizeRole(
                  profileData.role
                ),
            };

          setProfile(
            normalizedProfile
          );

          /* ===================================================
             WALLET

             profiles.credits remains source
             of truth for current balance.
          =================================================== */

          setWallet({
            balance:
              Number(
                profileData.credits
              ) || 0,

            total_earned: 0,

            total_spent: 0,
          });

          /* ===================================================
             LOAD DASHBOARD DATA
          =================================================== */

          const results =
            await Promise.all([
              /* =============================================
                 1. ACTIVE SKILLS
              ============================================= */

              supabase
                .from("skills")
                .select(
                  `
                    id,
                    name,
                    category_id
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

              /* =============================================
                 2. CURRENT USER SKILLS
              ============================================= */

              supabase
                .from(
                  "user_skills"
                )
                .select(
                  `
                    user_id,
                    skill_id,
                    is_learning,
                    is_teaching
                  `
                )
                .eq(
                  "user_id",
                  authUser.id
                ),

              /* =============================================
                 3. LEARNING INTERESTS
              ============================================= */

              supabase
                .from(
                  "user_interests"
                )
                .select(
                  `
                    id,
                    user_id,
                    skill_id,
                    interest_text,
                    weight
                  `
                )
                .eq(
                  "user_id",
                  authUser.id
                ),

              /* =============================================
                 4. SESSIONS

                 meeting_url removed because it is not
                 present in the current live schema.
              ============================================= */

              supabase
                .from(
                  "sessions"
                )
                .select(
                  `
                    id,
                    learner_id,
                    mentor_id,
                    skill_id,
                    scheduled_at,
                    duration_minutes,
                    status
                  `
                )
                .or(
                  `learner_id.eq.${authUser.id},mentor_id.eq.${authUser.id}`
                )
                .order(
                  "scheduled_at",
                  {
                    ascending:
                      true,
                  }
                )
                .limit(10),

              /* =============================================
                 5. CREDIT TRANSACTIONS
              ============================================= */

              supabase
                .from(
                  "credit_transactions"
                )
                .select(
                  `
                    id,
                    amount,
                    transaction_type,
                    description,
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
                    ascending:
                      false,
                  }
                )
                .limit(8),

              /* =============================================
                 6. ACTIVE MEMBERS
              ============================================= */

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
                    bio,
                    location,
                    is_active
                  `
                )
                .eq(
                  "is_active",
                  true
                )
                .not(
                  "username",
                  "is",
                  null
                )
                .order(
                  "full_name",
                  {
                    ascending:
                      true,
                  }
                )
                .limit(300),

              /* =============================================
                 7. ALL TEACHING SKILLS
              ============================================= */

              supabase
                .from(
                  "user_skills"
                )
                .select(
                  `
                    user_id,
                    skill_id,
                    is_learning,
                    is_teaching
                  `
                )
                .eq(
                  "is_teaching",
                  true
                ),

              /* =============================================
                 8. CURRENT USER COURSES
              ============================================= */

              supabase
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
                  "instructor_id",
                  authUser.id
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                )
                .limit(8),

              /* =============================================
                 9. LEARNER COURSE ENROLLMENTS

                 Approved = currently taking
                 Completed = finished
              ============================================= */

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
                  authUser.id
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
                    ascending:
                      false,
                  }
                )
                .limit(50),
            ]);

          if (!active) {
            return;
          }

          const [
            skillsResult,
            userSkillsResult,
            learningResult,
            sessionsResult,
            transactionsResult,
            profilesResult,
            mentorOfferingsResult,
            coursesResult,
            enrollmentsResult,
          ] = results;

          /* ===================================================
             SKILLS
          =================================================== */

          if (
            skillsResult.error
          ) {
            console.error(
              "DASHBOARD SKILLS ERROR:",
              skillsResult.error
            );

            setSkills([]);

            setError(
              `Skill catalog error: ${skillsResult.error.message}`
            );
          } else {
            const loadedSkills =
              (
                skillsResult.data ||
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

            setSkills(
              loadedSkills
            );
          }

          /* ===================================================
             CURRENT USER SKILLS
          =================================================== */

          if (
            userSkillsResult.error
          ) {
            console.error(
              "USER SKILLS ERROR:",
              userSkillsResult.error
            );

            setTeaching(
              []
            );
          } else {
            const rows =
              userSkillsResult.data ||
              [];

            const teachingRows =
              rows.filter(
                (row) =>
                  row.is_teaching ===
                  true
              );

            setTeaching(
              teachingRows
            );
          }

          /* ===================================================
             LEARNING
          =================================================== */

          if (
            learningResult.error
          ) {
            console.error(
              "LEARNING ERROR:",
              learningResult.error
            );

            setLearning(
              []
            );
          } else {
            setLearning(
              learningResult.data ||
                []
            );
          }

          /* ===================================================
             SESSIONS
          =================================================== */

          if (
            sessionsResult.error
          ) {
            console.warn(
              "SESSIONS ERROR:",
              sessionsResult.error
            );

            setSessions(
              []
            );
          } else {
            const now =
              Date.now();

            const upcoming =
              (
                sessionsResult.data ||
                []
              ).filter(
                (item) => {
                  if (
                    !item.scheduled_at
                  ) {
                    return false;
                  }

                  const status =
                    String(
                      item.status ||
                        ""
                    ).toLowerCase();

                  const time =
                    new Date(
                      item.scheduled_at
                    ).getTime();

                  return (
                    time >=
                      now &&
                    ![
                      "completed",
                      "cancelled",
                      "canceled",
                    ].includes(
                      status
                    )
                  );
                }
              );

            setSessions(
              upcoming
            );
          }

          /* ===================================================
             TRANSACTIONS
          =================================================== */

          if (
            transactionsResult.error
          ) {
            console.warn(
              "CREDIT TRANSACTIONS:",
              transactionsResult.error
            );

            setTransactions(
              []
            );
          } else {
            setTransactions(
              transactionsResult.data ||
                []
            );
          }

          /* ===================================================
             MEMBERS
          =================================================== */

          if (
            profilesResult.error
          ) {
            console.error(
              "SEARCH PROFILES ERROR:",
              profilesResult.error
            );

            setSearchProfiles(
              []
            );
          } else {
            const members =
              (
                profilesResult.data ||
                []
              ).map(
                (member) => ({
                  ...member,

                  role:
                    normalizeRole(
                      member.role
                    ),
                })
              );

            setSearchProfiles(
              members
            );
          }

          /* ===================================================
             TEACHER OFFERINGS
          =================================================== */

          if (
            mentorOfferingsResult.error
          ) {
            console.warn(
              "MENTOR OFFERINGS ERROR:",
              mentorOfferingsResult.error
            );

            setMentorOfferings(
              []
            );
          } else {
            setMentorOfferings(
              mentorOfferingsResult.data ||
                []
            );
          }

          /* ===================================================
             MY COURSES
          =================================================== */

          if (
            coursesResult.error
          ) {
            console.warn(
              "MY COURSES ERROR:",
              coursesResult.error
            );

            setMyCourses(
              []
            );
          } else {
            setMyCourses(
              coursesResult.data ||
                []
            );
          }

          /* ===================================================
             LEARNER TAKEN / FINISHED COURSES
          =================================================== */

          if (
            enrollmentsResult.error
          ) {
            console.warn(
              "COURSE ENROLLMENTS ERROR:",
              enrollmentsResult.error
            );

            setTakenCourses(
              []
            );

            setFinishedCourses(
              []
            );
          } else {
            const enrollmentRows =
              enrollmentsResult.data ||
              [];

            if (
              enrollmentRows.length ===
              0
            ) {
              setTakenCourses(
                []
              );

              setFinishedCourses(
                []
              );
            } else {
              const enrolledCourseIds =
                [
                  ...new Set(
                    enrollmentRows
                      .map(
                        (
                          enrollment
                        ) =>
                          enrollment.course_id
                      )
                      .filter(
                        Boolean
                      )
                  ),
                ];

              const enrollmentInstructorIds =
                [
                  ...new Set(
                    enrollmentRows
                      .map(
                        (
                          enrollment
                        ) =>
                          enrollment.instructor_id
                      )
                      .filter(
                        Boolean
                      )
                  ),
                ];

              const [
                enrolledCoursesResult,
                enrollmentInstructorsResult,
              ] =
                await Promise.all([
                  enrolledCourseIds.length
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
                          enrolledCourseIds
                        )
                    : Promise.resolve({
                        data:
                          [],
                        error:
                          null,
                      }),

                  enrollmentInstructorIds.length
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
                          enrollmentInstructorIds
                        )
                    : Promise.resolve({
                        data:
                          [],
                        error:
                          null,
                      }),
                ]);

              if (
                enrolledCoursesResult.error
              ) {
                console.warn(
                  "ENROLLED COURSES ERROR:",
                  enrolledCoursesResult.error
                );
              }

              if (
                enrollmentInstructorsResult.error
              ) {
                console.warn(
                  "ENROLLMENT INSTRUCTORS ERROR:",
                  enrollmentInstructorsResult.error
                );
              }

              const enrolledCourseMap =
                new Map(
                  (
                    enrolledCoursesResult.data ||
                    []
                  ).map(
                    (
                      course
                    ) => [
                      course.id,
                      course,
                    ]
                  )
                );

              const enrollmentInstructorMap =
                new Map(
                  (
                    enrollmentInstructorsResult.data ||
                    []
                  ).map(
                    (
                      instructor
                    ) => [
                      instructor.id,
                      {
                        ...instructor,

                        role:
                          normalizeRole(
                            instructor.role
                          ),
                      },
                    ]
                  )
                );

              const enrollmentSkillMap =
                new Map(
                  (
                    skillsResult.data ||
                    []
                  ).map(
                    (
                      skill
                    ) => [
                      skill.id,
                      skill,
                    ]
                  )
                );

              const joinedEnrollments =
                enrollmentRows
                  .map(
                    (
                      enrollment
                    ) => {
                      const course =
                        enrolledCourseMap.get(
                          enrollment.course_id
                        );

                      if (
                        !course
                      ) {
                        return null;
                      }

                      const instructor =
                        enrollmentInstructorMap.get(
                          enrollment.instructor_id
                        ) ||
                        null;

                      const skill =
                        enrollmentSkillMap.get(
                          course.skill_id
                        ) ||
                        null;

                      return {
                        ...course,

                        /* Course id remains the card/navigation id. */

                        id:
                          course.id,

                        enrollment_id:
                          enrollment.id,

                        enrollment_status:
                          enrollment.status,

                        status:
                          enrollment.status,

                        enrolled_at:
                          enrollment.created_at,

                        approved_at:
                          enrollment.approved_at,

                        completed_at:
                          enrollment.completed_at,

                        price_credits:
                          Number(
                            enrollment.price_credits
                          ) ||
                          Number(
                            course.price_credits
                          ) ||
                          0,

                        skill,

                        instructor,

                        /* Compatibility alias for older card UI. */

                        mentor:
                          instructor,

                        progress:
                          enrollment.status ===
                          "Completed"
                            ? 100
                            : 0,
                      };
                    }
                  )
                  .filter(
                    Boolean
                  );

              const currentCourses =
                joinedEnrollments
                  .filter(
                    (
                      course
                    ) =>
                      course.enrollment_status ===
                      "Approved"
                  )
                  .sort(
                    (
                      a,
                      b
                    ) =>
                      new Date(
                        b.approved_at ||
                          b.enrolled_at ||
                          0
                      ).getTime() -
                      new Date(
                        a.approved_at ||
                          a.enrolled_at ||
                          0
                      ).getTime()
                  );

              const completedCourses =
                joinedEnrollments
                  .filter(
                    (
                      course
                    ) =>
                      course.enrollment_status ===
                      "Completed"
                  )
                  .sort(
                    (
                      a,
                      b
                    ) =>
                      new Date(
                        b.completed_at ||
                          b.enrolled_at ||
                          0
                      ).getTime() -
                      new Date(
                        a.completed_at ||
                          a.enrolled_at ||
                          0
                      ).getTime()
                  );

              setTakenCourses(
                currentCourses
              );

              setFinishedCourses(
                completedCourses
              );
            }
          }
        } catch (err) {
          console.error(
            "DASHBOARD LOAD ERROR:",
            err
          );

          if (!active) {
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
              "We couldn't load your dashboard right now."
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
     ROLE FLAGS
  ========================================================= */

  const isLearner =
    profile?.role ===
    "learner";

  const isMentor =
    profile?.role ===
    "mentor";

  const isSwapMaster =
    profile?.role ===
    "swap_master";

  const canCreateCourse =
    isMentor ||
    isSwapMaster;

  const roleLabel =
    getRoleLabel(
      profile?.role
    );

  /* =========================================================
     SKILL MAP
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

  /* =========================================================
     LEARNING ITEMS
  ========================================================= */

  const learningItems =
    useMemo(() => {
      return learning
        .map(
          (item) => ({
            ...item,

            skill:
              skillMap.get(
                item.skill_id
              ),
          })
        )
        .filter(
          (item) =>
            item.skill
        )
        .sort(
          (a, b) =>
            Number(
              b.weight || 0
            ) -
            Number(
              a.weight || 0
            )
        );
    }, [
      learning,
      skillMap,
    ]);

  /* =========================================================
     TEACHING ITEMS
  ========================================================= */

  const teachingItems =
    useMemo(() => {
      return teaching
        .map(
          (item) => ({
            ...item,

            skill:
              skillMap.get(
                item.skill_id
              ),
          })
        )
        .filter(
          (item) =>
            item.skill
        );
    }, [
      teaching,
      skillMap,
    ]);

  /* =========================================================
     SESSION ITEMS
  ========================================================= */
  

  const sessionItems =
    useMemo(() => {
      return sessions.map(
        (item) => ({
          ...item,

          skill:
            skillMap.get(
              item.skill_id
            ),

          viewerRole:
            item.mentor_id ===
            user?.id
              ? "Mentor"
              : "Learner",
        })
      );
    }, [
      sessions,
      skillMap,
      user,
    ]);

  /* =========================================================
     OFFERINGS BY USER
  ========================================================= */

  const offeringsByUser =
    useMemo(() => {
      const map =
        new Map();

      mentorOfferings.forEach(
        (offering) => {
          const list =
            map.get(
              offering.user_id
            ) || [];

          const skill =
            skillMap.get(
              offering.skill_id
            );

          if (skill) {
            list.push({
              ...offering,
              skill,
            });
          }

          map.set(
            offering.user_id,
            list
          );
        }
      );

      return map;
    }, [
      mentorOfferings,
      skillMap,
    ]);

  /* =========================================================
     GLOBAL SEARCH MEMBERS
  ========================================================= */

  const searchMembers =
    useMemo(() => {
      return searchProfiles.map(
        (member) => ({
          ...member,

          teachingSkills:
            offeringsByUser.get(
              member.id
            ) || [],
        })
      );
    }, [
      searchProfiles,
      offeringsByUser,
    ]);

  /* =========================================================
     RECOMMENDED MENTORS
  ========================================================= */

  const mentors =
    useMemo(() => {
      return searchMembers.filter(
        (member) =>
          member.id !==
            user?.id &&
          (
            member.role ===
              "mentor" ||
            member.role ===
              "swap_master"
          )
      );
    }, [
      searchMembers,
      user,
    ]);

  /* =========================================================
     COURSE ITEMS
  ========================================================= */

  const courseItems =
    useMemo(() => {
      return myCourses.map(
        (course) => ({
          ...course,

          skill:
            skillMap.get(
              course.skill_id
            ),
        })
      );
    }, [
      myCourses,
      skillMap,
    ]);

  const activeCourses =
    courseItems.filter(
      (course) =>
        String(
          course.status || ""
        )
          .toLowerCase() ===
        "active"
    );

  const pendingCourses =
    courseItems.filter(
      (course) =>
        String(
          course.status || ""
        )
          .toLowerCase() ===
        "pending"
    );

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout =
    async () => {
      const {
        error:
          logoutError,
      } =
        await supabase.auth
          .signOut();

      if (
        logoutError
      ) {
        console.error(
          "LOGOUT ERROR:",
          logoutError
        );

        return;
      }

      navigate(
        "/login",
        {
          replace: true,
        }
      );
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
            Loading dashboard
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

        <DashboardHeader
          profile={
            profile
          }
          skills={
            skills
          }
          mentors={
            searchMembers
          }
          learningSkills={
            learning
          }
          teachingSkills={
            teaching
          }
          onLogout={
            handleLogout
          }
        />

        {/* ===================================================
            CONTENT
        =================================================== */}

        <div className="mx-auto max-w-[1500px] px-5 pb-20 pt-24 md:px-8 lg:px-10 lg:pt-28">
          {/* ERROR */}

          {error && (
            <div className="mb-6 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm text-[#ff8b8b]">
              {error}
            </div>
          )}

          {/* =================================================
              WELCOME
          ================================================= */}

          <WelcomePanel
            profile={
              profile
            }
            wallet={
              wallet
            }
          />

          {/* =================================================
              ROLE COMMAND CENTER
          ================================================= */}

          <section className="mt-6 overflow-hidden border border-white/10 bg-[#0a0d0b]/80">
            <div className="grid lg:grid-cols-[1.15fr_.85fr]">
              {/* LEFT */}

              <div className="relative p-6 md:p-8">
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at 10% 0%, rgba(199,255,57,.07), transparent 38%)",
                  }}
                />

                <div className="relative">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 border border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">
                      <CircleDot
                        size={10}
                        className="fill-[#c7ff39]"
                      />

                      {roleLabel} mode
                    </span>

                    <span className="text-[10px] uppercase tracking-[0.16em] text-white/30">
                      SkillSwap+ command center
                    </span>
                  </div>

                  <h2 className="mt-5 max-w-2xl text-2xl font-medium tracking-[-0.04em] md:text-3xl">
                    {isLearner &&
                      "Build your next skill."}

                    {isMentor &&
                      "Turn your expertise into impact."}

                    {isSwapMaster &&
                      "Teach. Learn. Swap. Earn."}
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[#a1a1aa]">
                    {isLearner &&
                      "Search the SkillSwap+ network, discover mentors and use your SS credits to request courses."}

                    {isMentor &&
                      "Keep your teaching skills updated, publish courses and earn SS credits when learners enroll."}

                    {isSwapMaster &&
                      "Create courses from your teaching skills, learn from mentors and build reciprocal skill swaps with other Swap Masters."}
                  </p>

                  {/* ACTIONS */}

                  <div className="mt-6 flex flex-wrap gap-3">
                    {/* MY COURSES - AVAILABLE TO EVERY USER */}

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          "/my-courses"
                        )
                      }
                      className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#c7ff39]/30 bg-[#c7ff39]/[0.04] px-5 text-sm font-medium text-[#c7ff39] transition hover:bg-[#c7ff39]/[0.08]"
                    >
                      <BookOpen
                        size={16}
                      />

                      My Courses
                    </button>
                    {canCreateCourse && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            "/courses/create"
                          )
                        }
                        className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008] transition hover:bg-[#d4ff66]"
                      >
                        <Plus
                          size={16}
                        />

                        Create new course
                      </button>
                    )}

                    {isLearner && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            "/profile/edit?tab=learning"
                          )
                        }
                        className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008] transition hover:bg-[#d4ff66]"
                      >
                        <BookOpen
                          size={16}
                        />

                        Update learning skills
                      </button>
                    )}

                    {canCreateCourse && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            "/profile/edit?tab=teaching"
                          )
                        }
                        className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/15 px-5 text-sm font-medium text-[#f2f4ef] transition hover:border-white/30 hover:bg-white/[0.03]"
                      >
                        <GraduationCap
                          size={16}
                        />

                        Teaching skills
                      </button>
                    )}

                    {/* ENROLLMENT REQUESTS - BESIDE TEACHING SKILLS */}

                    {canCreateCourse && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            "/enrollment-requests"
                          )
                        }
                        className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/15 px-5 text-sm font-medium text-[#f2f4ef] transition hover:border-[#c7ff39]/30 hover:bg-[#c7ff39]/[0.03] hover:text-[#c7ff39]"
                      >
                        <Inbox
                          size={16}
                        />

                        Enrollment requests
                      </button>
                    )}

                    {isSwapMaster && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            "/swaps"
                          )
                        }
                        className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/15 px-5 text-sm font-medium text-[#f2f4ef] transition hover:border-[#c7ff39]/30 hover:bg-[#c7ff39]/[0.03] hover:text-[#c7ff39]"
                      >
                        <Repeat2
                          size={16}
                        />

                        Find skill swaps
                      </button>
                    )}

                    

                    {/* HISTORY - AVAILABLE TO EVERY USER */}

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          "/history"
                        )
                      }
                      className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/15 px-5 text-sm font-medium text-[#f2f4ef] transition hover:border-[#c7ff39]/30 hover:bg-[#c7ff39]/[0.03] hover:text-[#c7ff39]"
                    >
                      <HistoryIcon
                        size={16}
                      />

                      History
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT */}

              <div className="grid grid-cols-2 border-t border-white/10 lg:border-l lg:border-t-0">
                <div className="border-b border-r border-white/10 p-5">
                  <BookOpen
                    size={18}
                    className="text-[#c7ff39]"
                  />

                  <p className="mt-5 text-3xl font-medium tracking-[-0.05em]">
                    {
                      learningItems.length
                    }
                  </p>

                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#a1a1aa]">
                    Learning skills
                  </p>
                </div>

                <div className="border-b border-white/10 p-5">
                  <GraduationCap
                    size={18}
                    className="text-[#c7ff39]"
                  />

                  <p className="mt-5 text-3xl font-medium tracking-[-0.05em]">
                    {
                      teachingItems.length
                    }
                  </p>

                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#a1a1aa]">
                    Teaching skills
                  </p>
                </div>

                <div className="border-r border-white/10 p-5">
                  <WalletCards
                    size={18}
                    className="text-[#c7ff39]"
                  />

                  <p className="mt-5 text-3xl font-medium tracking-[-0.05em]">
                    {wallet?.balance ??
                      0}
                  </p>

                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#a1a1aa]">
                    SS Credits
                  </p>
                </div>

                <div className="p-5">
                  <Layers3
                    size={18}
                    className="text-[#c7ff39]"
                  />

                  <p className="mt-5 text-3xl font-medium tracking-[-0.05em]">
                    {isLearner
                      ? takenCourses.length
                      : myCourses.length}
                  </p>

                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#a1a1aa]">
                    {isLearner
                      ? "Courses learning"
                      : "Courses created"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <QuickActions
            role={
              profile?.role
            }
            navigate={
              navigate
            }
          />

          {/* =================================================
              STATS
          ================================================= */}

          <DashboardStats
            takenCourses={
              takenCourses.length
            }
            finishedCourses={
              finishedCourses.length
            }
            upcomingSessions={
              sessionItems.length
            }
            credits={
              wallet?.balance ??
              0
            }
          />

          {/* =================================================
              COURSE STUDIO
          ================================================= */}

          {canCreateCourse && (
            <section className="mt-8 border border-white/10 bg-[#0a0d0b]/70">
              <div className="flex flex-col justify-between gap-5 border-b border-white/10 p-6 md:flex-row md:items-center md:px-7">
                <div>
                  <div className="flex items-center gap-2">
                    <Zap
                      size={14}
                      className="text-[#c7ff39]"
                    />

                    <p className="text-[10px] uppercase tracking-[0.17em] text-[#c7ff39]">
                      Course Studio
                    </p>
                  </div>

                  <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em]">
                    Your teaching offers
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a1a1aa]">
                    Courses can only be created from skills you have marked as teaching skills.
                  </p>
                </div>

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

                  Create course
                </button>
              </div>

              {/* COURSE SUMMARY */}

              <div className="grid border-b border-white/10 sm:grid-cols-3">
                <div className="border-b border-white/10 p-5 sm:border-b-0 sm:border-r">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#a1a1aa]">
                    Total courses
                  </p>

                  <p className="mt-2 text-2xl font-medium">
                    {
                      courseItems.length
                    }
                  </p>
                </div>

                <div className="border-b border-white/10 p-5 sm:border-b-0 sm:border-r">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#a1a1aa]">
                    Active
                  </p>

                  <p className="mt-2 text-2xl font-medium text-[#c7ff39]">
                    {
                      activeCourses.length
                    }
                  </p>
                </div>

                <div className="p-5">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#a1a1aa]">
                    Pending
                  </p>

                  <p className="mt-2 text-2xl font-medium">
                    {
                      pendingCourses.length
                    }
                  </p>
                </div>
              </div>

              {/* COURSES */}

              {courseItems.length >
              0 ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3">
                  {courseItems
                    .slice(
                      0,
                      6
                    )
                    .map(
                      (
                        course,
                        index
                      ) => (
                        <article
                          key={
                            course.id
                          }
                          className={`
                            group
                            p-6
                            transition
                            hover:bg-white/[0.02]

                            ${
                              index <
                              courseItems
                                .slice(
                                  0,
                                  6
                                )
                                .length -
                                1
                                ? "border-b border-white/10"
                                : ""
                            }

                            md:border-r
                            md:border-white/10
                          `}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="grid h-10 w-10 place-items-center border border-[#c7ff39]/20 bg-[#c7ff39]/[0.04] text-[#c7ff39]">
                              <GraduationCap
                                size={18}
                              />
                            </div>

                            <span
                              className={`border px-2 py-1 text-[9px] uppercase tracking-[0.14em] ${getCourseStatusClasses(
                                course.status
                              )}`}
                            >
                              {course.status ||
                                "Unknown"}
                            </span>
                          </div>

                          <p className="mt-5 text-[10px] uppercase tracking-[0.16em] text-[#a1a1aa]">
                            {course
                              .skill
                              ?.name ||
                              "Teaching skill"}
                          </p>

                          <h3 className="mt-2 line-clamp-2 text-lg font-medium tracking-[-0.025em]">
                            {
                              course.title
                            }
                          </h3>

                          {course.course_level && (
                            <p className="mt-2 text-xs text-white/40">
                              {
                                course.course_level
                              }
                            </p>
                          )}

                          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                            <div>
                              <p className="text-lg font-medium text-[#c7ff39]">
                                {course.price_credits ??
                                  0}{" "}
                                SS
                              </p>

                              <p className="mt-0.5 text-[9px] uppercase tracking-[0.13em] text-white/30">
                                Enrollment
                                value
                              </p>
                            </div>

                            <ChevronRight
                              size={17}
                              className="text-white/30 transition group-hover:translate-x-1 group-hover:text-[#c7ff39]"
                            />
                          </div>
                        </article>
                      )
                    )}
                </div>
              ) : (
                <div className="p-7 md:p-9">
                  <div className="max-w-xl">
                    <div className="grid h-11 w-11 place-items-center border border-white/10 text-[#a1a1aa]">
                      <GraduationCap
                        size={19}
                      />
                    </div>

                    <h3 className="mt-5 text-xl font-medium tracking-[-0.03em]">
                      No courses yet.
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
                      Turn one of your teaching skills into a 50 SS or 100 SS course.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          "/courses/create"
                        )
                      }
                      className="mt-5 inline-flex min-h-11 items-center gap-2 bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008]"
                    >
                      <Plus
                        size={15}
                      />

                      Create your first course
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* =================================================
              SWAP MASTER LAB
          ================================================= */}

          {isSwapMaster && (
            <section className="mt-8 overflow-hidden border border-[#c7ff39]/15 bg-[#0a0d0b]/70">
              <div className="grid lg:grid-cols-[.8fr_1.2fr]">
                <div className="border-b border-white/10 p-6 md:p-7 lg:border-b-0 lg:border-r">
                  <Repeat2
                    size={22}
                    className="text-[#c7ff39]"
                  />

                  <p className="mt-5 text-[10px] uppercase tracking-[0.17em] text-[#c7ff39]">
                    Swap Master Lab
                  </p>

                  <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em]">
                    Reciprocal skill matching
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-[#a1a1aa]">
                    Your teaching and learning skills form the basis for finding another Swap Master with the opposite skill combination.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2">
                  <div className="border-b border-white/10 p-6 sm:border-b-0 sm:border-r">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#a1a1aa]">
                      You can teach
                    </p>

                    <p className="mt-3 text-3xl font-medium tracking-[-0.05em]">
                      {
                        teachingItems.length
                      }
                    </p>

                    <p className="mt-2 text-xs leading-5 text-white/35">
                      skills available for reciprocal swaps
                    </p>
                  </div>

                  <div className="p-6">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#a1a1aa]">
                      You want to learn
                    </p>

                    <p className="mt-3 text-3xl font-medium tracking-[-0.05em]">
                      {
                        learningItems.length
                      }
                    </p>

                    <p className="mt-2 text-xs leading-5 text-white/35">
                      skills that can be matched against another Swap Master
                    </p>
                  </div>

                  <div className="border-t border-white/10 p-6 sm:col-span-2">
                    {teachingItems.length >
                      0 &&
                    learningItems.length >
                      0 ? (
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                          <p className="flex items-center gap-2 text-sm font-medium text-[#f2f4ef]">
                            <Sparkles
                              size={14}
                              className="text-[#c7ff39]"
                            />

                            Your profile is swap-ready
                          </p>

                          <p className="mt-1 text-xs leading-5 text-[#a1a1aa]">
                            Reciprocal matching can use your current teaching and learning skills.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              "/profile/edit?tab=learning"
                            )
                          }
                          className="inline-flex min-h-10 items-center justify-center gap-2 border border-white/15 px-4 text-xs font-medium transition hover:border-[#c7ff39]/30"
                        >
                          Refine skills

                          <ArrowRight
                            size={13}
                          />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm leading-6 text-[#a1a1aa]">
                        Add at least one teaching skill and one learning skill to become eligible for reciprocal matching.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =================================================
              LEARNING / TEACHING / SESSION / CREDIT
          ================================================= */}

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_.75fr]">
            <div className="grid gap-6 lg:grid-cols-2">
              <SkillSection
                type="learning"
                title="Learning"
                eyebrow="Your focus"
                items={
                  learningItems
                }
                onAdd={() =>
                  navigate(
                    "/profile/edit?tab=learning"
                  )
                }
              />

              <SkillSection
                type="teaching"
                title="Teaching"
                eyebrow="What you share"
                items={
                  teachingItems
                }
                onAdd={() =>
                  navigate(
                    "/profile/edit?tab=teaching"
                  )
                }
              />
            </div>

            <div className="space-y-6">
              <UpcomingSessions
                sessions={
                  sessionItems
                }
              />

              <CreditActivity
                wallet={
                  wallet
                }
                transactions={
                  transactions
                }
              />
            </div>
          </div>

          {/* =================================================
              DISCOVERY STRIP
          ================================================= */}

          <section className="mt-8 grid border border-white/10 bg-[#0a0d0b]/70 md:grid-cols-3">
            <div className="group border-b border-white/10 p-6 transition hover:bg-white/[0.02] md:border-b-0 md:border-r">
              <Search
                size={18}
                className="text-[#c7ff39]"
              />

              <p className="mt-5 text-[10px] uppercase tracking-[0.16em] text-[#a1a1aa]">
                Discover
              </p>

              <h3 className="mt-2 text-lg font-medium">
                {
                  skills.length
                }{" "}
                skills available
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
                Use Dashboard search to explore skills and the people connected to them.
              </p>
            </div>

            <div className="group border-b border-white/10 p-6 transition hover:bg-white/[0.02] md:border-b-0 md:border-r">
              <GraduationCap
                size={18}
                className="text-[#c7ff39]"
              />

              <p className="mt-5 text-[10px] uppercase tracking-[0.16em] text-[#a1a1aa]">
                Network
              </p>

              <h3 className="mt-2 text-lg font-medium">
                {
                  mentors.length
                }{" "}
                teaching members
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
                Mentors and Swap Masters can become course instructors for their teaching skills.
              </p>
            </div>

            <div className="group p-6 transition hover:bg-white/[0.02]">
              <WalletCards
                size={18}
                className="text-[#c7ff39]"
              />

              <p className="mt-5 text-[10px] uppercase tracking-[0.16em] text-[#a1a1aa]">
                Economy
              </p>

              <h3 className="mt-2 text-lg font-medium">
                {wallet?.balance ??
                  0}{" "}
                SS available
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
                Spend credits when learning. Earn credits when teaching or completing successful skill swaps.
              </p>
            </div>
          </section>

          {/* =================================================
              TAKEN COURSES
          ================================================= */}

       <DashboardCourses
            title="Taken courses"
            eyebrow="Continue learning"
            type="taken"
            courses={takenCourses}
            emptyTitle="You haven't taken a course yet."
            emptyText="Approved course enrollments will appear here with course and instructor details."
            actionLabel="Explore courses"
            onAction={() =>
            navigate("/courses")
                }
            />

          {/* =================================================
              FINISHED COURSES
          ================================================= */}

          <DashboardCourses
            title="Finished courses"
            eyebrow="Your achievements"
            type="finished"
            courses={
              finishedCourses
            }
            emptyTitle="No finished courses yet."
            emptyText="Completed courses will appear here with completion information and achievements."
            actionLabel="View learning skills"
            onAction={() =>
              navigate(
                "/profile/edit?tab=learning"
              )
            }
          />

          {/* =================================================
              RECOMMENDED MENTORS
          ================================================= */}

          <RecommendedMentors
            mentors={
              mentors
            }
            onEditLearning={() =>
              navigate(
                "/profile/edit?tab=learning"
              )
            }
          />

          {/* =================================================
              PROFILE CTA
          ================================================= */}

          <section className="mt-8 border border-white/10 bg-[#0a0d0b]/70 p-6 md:p-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div>
                <p className="text-[10px] uppercase tracking-[0.17em] text-[#a1a1aa]">
                  Keep your profile accurate
                </p>

                <h2 className="mt-2 text-2xl font-medium tracking-[-0.035em]">
                  Better profile.
                  Better matches.
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a1a1aa]">
                  Update your teaching skills,
                  learning interests, bio and
                  preferences whenever your goals
                  change.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/profile/edit?tab=profile"
                  )
                }
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008] transition hover:bg-[#d4ff66]"
              >
                Edit profile

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