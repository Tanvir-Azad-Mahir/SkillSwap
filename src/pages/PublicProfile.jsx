import { useEffect, useMemo, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import {

  ArrowLeft,

  BookOpen,

  GraduationCap,

  Layers3,

  Loader2,

  MapPin,

  MessageSquare,

  Star,

  Sparkles,

  Target,

  UserRound,

} from "lucide-react";



import { supabase } from "../lib/supabase";



function normalizeRole(role) {

  return String(role || "")

    .trim()

    .toLowerCase()

    .replace(/[\s-]+/g, "_");

}



function roleLabel(role) {

  if (role === "swap_master") {

    return "Swap Master";

  }



  if (role === "mentor") {

    return "Mentor";

  }



  return "Learner";

}



function initials(name, username) {

  const source =

    name?.trim() ||

    username?.trim() ||

    "SkillSwap";



  const words = source

    .split(/\s+/)

    .filter(Boolean);



  if (words.length === 1) {

    return words[0]

      .slice(0, 2)

      .toUpperCase();

  }



  return `${words[0][0]}${

    words[1][0]

  }`.toUpperCase();

}



function EmptyState({ children }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.025] px-5 py-8 text-sm leading-6 text-[#8c938c]">
      {children}
    </div>
  );

}



function SkillCard({

  skill,

  type,

}) {

  const skillData =

    skill.skills || {};



  return (

    <article className="public-profile-surface group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#111713] to-[#0a0d0b] p-5 shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-[#c7ff39]/30 hover:shadow-xl hover:shadow-black/20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c7ff39]/0 to-transparent transition group-hover:via-[#c7ff39]/70" />
      <div className="flex items-start justify-between gap-4">

        <div>

          <h3 className="text-base font-medium text-[#f2f4ef]">

            {skillData.name ||

              "Unnamed skill"}

          </h3>



          {skillData.description && (

            <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#929a92]">

              {skillData.description}

            </p>

          )}

        </div>



        {skill.is_verified && (

          <span className="shrink-0 rounded-full border border-[#c7ff39]/20 bg-[#c7ff39]/[0.07] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-[#c7ff39]">

            Verified

          </span>

        )}

      </div>



      {type === "teaching" && (

        <div className="mt-5 flex flex-wrap gap-2">

          {skill.proficiency_level && (

            <span className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1 text-[11px] text-[#b2b8b2]">

              {skill.proficiency_level}

            </span>

          )}



          {Number(

            skill.years_experience

          ) > 0 && (

            <span className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1 text-[11px] text-[#b2b8b2]">

              {skill.years_experience}{" "}

              {Number(

                skill.years_experience

              ) === 1

                ? "year"

                : "years"}{" "}

              experience

            </span>

          )}

        </div>

      )}



      {type === "learning" &&

        skill.interest_text && (

          <p className="mt-4 rounded-xl bg-white/[0.025] px-3.5 py-3 text-xs leading-5 text-[#aeb5ae]">

            {skill.interest_text}

          </p>

        )}

    </article>

  );

}



export default function PublicProfile() {

  const { username } = useParams();



  const navigate =

    useNavigate();



  const [

    profile,

    setProfile,

  ] = useState(null);



  const [

    currentUser,

    setCurrentUser,

  ] = useState(null);



  const [

    currentProfile,

    setCurrentProfile,

  ] = useState(null);



  const [

    teachingSkills,

    setTeachingSkills,

  ] = useState([]);



  const [

    learningSkills,

    setLearningSkills,

  ] = useState([]);



  const [
    reviews,
    setReviews,
  ] = useState([]);

  const [
    publicCourses,
    setPublicCourses,
  ] = useState([]);

  const [
    publicCoursesError,
    setPublicCoursesError,
  ] = useState("");



  const [

    loading,

    setLoading,

  ] = useState(true);



  const [

    error,

    setError,

  ] = useState("");



  const [

    requestNotice,

    setRequestNotice,

  ] = useState("");



  const [

    actionLoading,

    setActionLoading,

  ] = useState("");



  const [

    mentorshipModalOpen,

    setMentorshipModalOpen,

  ] = useState(false);



  const [

    selectedMentorshipSkillId,

    setSelectedMentorshipSkillId,

  ] = useState("");



  /* =========================================================

     LOAD PUBLIC PROFILE

  ========================================================= */



  useEffect(() => {

    let active = true;



    const loadProfile = async () => {

      try {

        setLoading(true);

        setError("");
        setPublicCourses([]);
        setPublicCoursesError("");



        /* ===============================================

           CURRENT LOGGED-IN USER

        =============================================== */



        const {

          data: authData,

        } =

          await supabase.auth.getUser();



        if (active) {

          setCurrentUser(

            authData?.user || null

          );

        }



        if (

          authData?.user?.id

        ) {

          const {

            data:

              currentProfileData,

            error:

              currentProfileError,

          } =

            await supabase

              .from("profiles")

              .select(

                `

                  id,

                  role,

                  credits,

                  is_active

                `

              )

              .eq(

                "id",

                authData.user.id

              )

              .maybeSingle();



          if (

            currentProfileError

          ) {

            console.error(

              "Current profile load error:",

              currentProfileError

            );

          } else if (

            active

          ) {

            setCurrentProfile(

              currentProfileData

                ? {

                    ...currentProfileData,

                    role:

                      normalizeRole(

                        currentProfileData.role

                      ),

                    credits:

                      Number(

                        currentProfileData.credits

                      ) || 0,

                  }

                : null

            );

          }

        } else if (active) {

          setCurrentProfile(

            null

          );

        }



        /* ===============================================

           PROFILE

        =============================================== */



        const cleanUsername =

          decodeURIComponent(

            username || ""

          )

            .trim()

            .toLowerCase();



        if (!cleanUsername) {

          throw new Error(

            "PROFILE_NOT_FOUND"

          );

        }



        const {

          data: profileData,

          error: profileError,

        } = await supabase

          .from("profiles")

          .select(

            `

              id,

              username,

              full_name,

              avatar_url,

              bio,

              role,

              career_goal,

              location,

              is_active

            `

          )

          .ilike(

            "username",

            cleanUsername

          )

          .eq(

            "is_active",

            true

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



        if (!active) {

          return;

        }



        setProfile({

          ...profileData,

          role: normalizeRole(profileData.role),

        });



        /* ===============================================

           PUBLIC TEACHING + LEARNING SKILLS



           Use one security-definer RPC instead of

           reading user_skills / user_interests directly.

        =============================================== */



        const {

          data: publicSkillsData,

          error: publicSkillsError,

        } = await supabase.rpc(

          "get_public_profile_skills",

          {

            p_profile_id:

              profileData.id,

          }

        );



        if (publicSkillsError) {

          console.error(

            "Public profile skills error:",

            publicSkillsError

          );



          throw publicSkillsError;

        }



        if (!active) {

          return;

        }



        setTeachingSkills(

          publicSkillsData?.teaching_skills ||

            []

        );



        setLearningSkills(

          publicSkillsData?.learning_skills ||

            []

        );

        /* ===============================================

           PUBLIC COURSES

           Only published courses are listed on profiles.

        =============================================== */

        if (
          ["mentor", "swap_master"].includes(
            normalizeRole(profileData.role)
          )
        ) {
          const {
            data: courseData,
            error: courseError,
          } = await supabase
            .from("courses")
            .select(
              `
                id,
                title,
                instructor_id,
                skill_id,
                price_credits,
                course_level,
                created_at
              `
            )
            .eq("instructor_id", profileData.id)
            .eq("status", "Active")
            .order("created_at", { ascending: false });

          if (courseError) {
            console.error("Public profile courses load error:", courseError);
            if (active) {
              setPublicCoursesError("Courses couldn't be loaded right now.");
            }
          } else if (active) {
            const loadedCourses = courseData || [];
            const skillIds = [
              ...new Set(
                loadedCourses
                  .map((course) => course.skill_id)
                  .filter(Boolean)
              ),
            ];

            let skillsById = {};

            if (skillIds.length > 0) {
              const {
                data: skillData,
                error: skillError,
              } = await supabase
                .from("skills")
                .select("id, name")
                .in("id", skillIds)
                .eq("is_active", true);

              if (skillError) {
                console.error(
                  "Public profile course skills load error:",
                  skillError
                );
                setPublicCoursesError(
                  "Some course details couldn't be loaded."
                );
              } else {
                skillsById = Object.fromEntries(
                  (skillData || []).map((skill) => [
                    skill.id,
                    skill.name,
                  ])
                );
              }
            }

            if (!active) {
              return;
            }

            setPublicCourses(
              loadedCourses.map((course) => ({
                ...course,
                skillName: skillsById[course.skill_id] || "",
              }))
            );
          }
        } else if (active) {
          setPublicCourses([]);
        }


        /* ===============================================

           PUBLIC MENTOR REVIEWS

           Uses a security-definer RPC so visitors can read

           only the review fields intentionally exposed.

        =============================================== */



        if (

          ["mentor", "swap_master"].includes(

            normalizeRole(profileData.role)

          )

        ) {

          const {

            data: reviewData,

            error: reviewError,

          } = await supabase.rpc(

            "get_public_mentor_reviews",

            {

              p_profile_id:

                profileData.id,

            }

          );



          if (reviewError) {

            console.error(

              "Public mentor reviews load error:",

              reviewError

            );

          } else if (active) {

            setReviews(reviewData || []);

          }

        } else if (active) {

          setReviews([]);

        }

      } catch (err) {

        console.error(

          "Public profile load error:",

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

            "This SkillSwap+ profile could not be found."

          );

        } else {

          setError(

            "We couldn't load this profile right now."

          );

        }

      } finally {

        if (active) {

          setLoading(false);

        }

      }

    };



    loadProfile();



    return () => {

      active = false;

    };

  }, [username]);



  /* =========================================================

     PROFILE STATE

  ========================================================= */



  const isOwnProfile =

    Boolean(

      currentUser?.id &&

        profile?.id &&

        currentUser.id ===

          profile.id

    );



  const canMentor =

    profile?.role ===

      "mentor" ||

    profile?.role ===

      "swap_master";



  const canSendMentorshipRequest =

    !currentUser ||

    currentProfile?.role ===

      "learner" ||

    currentProfile?.role ===

      "swap_master";



  const mentorshipBalance =

    Number(

      currentProfile?.credits

    ) || 0;



  const hasMentorshipCredits =

    !currentUser ||

    mentorshipBalance >= 50;



  const avatarInitials =

    useMemo(

      () =>

        initials(

          profile?.full_name,

          profile?.username

        ),

      [

        profile?.full_name,

        profile?.username,

      ]

    );



  const averageRating = useMemo(() => {

    if (!reviews.length) {

      return 0;

    }



    const total = reviews.reduce(

      (sum, review) =>

        sum + Number(review.rating || 0),

      0

    );



    return total / reviews.length;

  }, [reviews]);



  const profileStats = [

    {

      label: "Teaching",

      value: teachingSkills.length,

    },

    {

      label: "Learning",

      value: learningSkills.length,

    },

    {

      label: "Rating",

      value:

        reviews.length > 0

          ? averageRating.toFixed(1)

          : "—",

    },

  ];



  /* =========================================================

     PROFILE ACTIONS

  ========================================================= */



  const openMentorshipModal =

    () => {

      setRequestNotice("");



      if (!currentUser) {

        navigate("/login");

        return;

      }



      if (isOwnProfile) {

        setRequestNotice(

          "You cannot request mentorship from your own profile."

        );

        return;

      }



      if (

        !canSendMentorshipRequest

      ) {

        setRequestNotice(

          "Mentors cannot send mentorship requests."

        );

        return;

      }



      if (

        !hasMentorshipCredits

      ) {

        setRequestNotice(

          `You need at least 50 SS to request mentorship. Your balance is ${mentorshipBalance} SS.`

        );

        return;

      }



      if (!canMentor) {

        setRequestNotice(

          "This member is not currently offering mentorship."

        );

        return;

      }



      if (

        teachingSkills.length ===

        0

      ) {

        setRequestNotice(

          "This mentor has not added any teaching skills yet."

        );

        return;

      }



      setSelectedMentorshipSkillId(

        teachingSkills[0]

          ?.skill_id ||

          ""

      );



      setMentorshipModalOpen(

        true

      );

    };



  const closeMentorshipModal =

    () => {

      if (

        actionLoading ===

        "mentorship"

      ) {

        return;

      }



      setMentorshipModalOpen(

        false

      );



      setSelectedMentorshipSkillId(

        ""

      );

    };



  const handleRequestMentorship =

    async () => {

      setRequestNotice("");



      if (!currentUser) {

        navigate("/login");

        return;

      }



      if (isOwnProfile) {

        setRequestNotice(

          "You cannot request mentorship from your own profile."

        );

        return;

      }



      if (

        !canSendMentorshipRequest

      ) {

        setRequestNotice(

          "Mentors cannot send mentorship requests."

        );

        return;

      }



      if (

        !hasMentorshipCredits

      ) {

        setRequestNotice(

          `You need at least 50 SS to request mentorship. Your balance is ${mentorshipBalance} SS.`

        );

        return;

      }



      if (!canMentor) {

        setRequestNotice(

          "This member is not currently offering mentorship."

        );

        return;

      }



      if (

        !selectedMentorshipSkillId

      ) {

        setRequestNotice(

          "Choose a teaching skill first."

        );

        return;

      }



      try {

        setActionLoading(

          "mentorship"

        );



        const {

          error:

            requestError,

        } =

          await supabase.rpc(

            "request_mentorship",

            {

              p_mentor_id:

                profile.id,

              p_skill_id:

                selectedMentorshipSkillId,

            }

          );



        if (

          requestError

        ) {

          throw requestError;

        }



        setMentorshipModalOpen(

          false

        );



        setSelectedMentorshipSkillId(

          ""

        );



        setRequestNotice(

          "Mentorship request sent successfully."

        );

      } catch (err) {

        console.error(

          "MENTORSHIP REQUEST ERROR:",

          err

        );



        const message =

          String(

            err?.message ||

              ""

          );



        if (

          message.includes(

            "MENTORSHIP_REQUEST_EXISTS"

          )

        ) {

          setRequestNotice(

            "You already have a pending mentorship request for this skill."

          );

        } else if (

          message.includes(

            "INSUFFICIENT_CREDITS"

          )

        ) {

          setRequestNotice(

            "You need at least 50 SS to request mentorship."

          );

        } else if (

          message.includes(

            "MENTORSHIP_REQUEST_NOT_ALLOWED"

          )

        ) {

          setRequestNotice(

            "Mentors cannot send mentorship requests."

          );

        } else if (

          message.includes(

            "MENTOR_NOT_AVAILABLE"

          )

        ) {

          setRequestNotice(

            "This member is not currently available for mentorship."

          );

        } else if (

          message.includes(

            "SKILL_NOT_OFFERED"

          )

        ) {

          setRequestNotice(

            "This skill is no longer offered by the mentor."

          );

        } else {

          setRequestNotice(

            err?.message ||

              "Your mentorship request could not be sent."

          );

        }

      } finally {

        setActionLoading("");

      }

    };



  const handleMessage = async () => {

    setRequestNotice("");



    if (!currentUser) {

      navigate("/login");

      return;

    }



    if (isOwnProfile) {

      setRequestNotice(

        "You cannot message your own profile."

      );

      return;

    }



    try {

      setActionLoading("message");



      const { data, error: conversationError } = await supabase.rpc(

        "get_or_create_conversation",

        {

          p_other_user_id: profile.id,

        }

      );



      if (conversationError) {

        throw conversationError;

      }



      if (!data) {

        throw new Error("CONVERSATION_NOT_CREATED");

      }



      navigate(`/messages/${data}`);

    } catch (err) {

      console.error(

        "START PROFILE MESSAGE ERROR:",

        err

      );



      setRequestNotice(

        err?.message ||

          "The conversation could not be started."

      );

    } finally {

      setActionLoading("");

    }

  };



  /* =========================================================

     LOADING

  ========================================================= */



  if (loading) {

    return (

      <main className="public-profile-page relative grid min-h-screen place-items-center overflow-hidden bg-[#060807] text-[#f2f4ef]">

        <div className="noise pointer-events-none fixed inset-0" />



        <div className="relative z-10 text-center">

          <div className="mx-auto mb-5 h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-[#c7ff39]" />



          <p className="text-xs uppercase tracking-[0.18em] text-[#737373]">

            Loading profile

          </p>

        </div>

      </main>

    );

  }



  /* =========================================================

     ERROR

  ========================================================= */



  if (

    error ||

    !profile

  ) {

    return (

      <main className="public-profile-page relative grid min-h-screen place-items-center bg-[#060807] px-5 text-[#f2f4ef]">

        <div className="noise pointer-events-none fixed inset-0" />



        <div className="relative z-10 max-w-md text-center">

          <div className="mx-auto grid h-14 w-14 place-items-center border border-white/10 bg-[#0a0d0b]">

            <UserRound

              size={22}

              strokeWidth={1.5}

              className="text-[#737373]"

            />

          </div>



          <h1 className="mt-6 text-3xl font-medium tracking-[-0.04em]">

            Profile not found.

          </h1>



          <p className="mt-3 text-sm leading-6 text-[#737373]">

            {error}

          </p>



          <Link

            to="/dashboard"

            className="mt-7 inline-flex min-h-[48px] items-center justify-center bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008] transition hover:bg-[#d2ff64]"

          >

            Back to dashboard

          </Link>

        </div>

      </main>

    );

  }



  /* =========================================================

     PAGE

  ========================================================= */



  return (

    <main className="public-profile-page relative min-h-screen overflow-hidden bg-[#060807] text-[#f2f4ef]">

      {/* Background noise */}



      <div className="noise pointer-events-none fixed inset-0" />



      {/* Background glow */}

      <div
        className="public-profile-glow pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 12% 5%, rgba(199,255,57,.075), transparent 32%), radial-gradient(ellipse at 88% 42%, rgba(73,145,114,.08), transparent 34%)",
        }}
      />



      {/* =====================================================

          HEADER

      ===================================================== */}



      <header className="relative z-20 border-b border-white/[0.07] bg-[#060807]/75 backdrop-blur-2xl">

        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-5 md:px-8 lg:px-10">

          <Link

            to="/dashboard"

            className="text-lg font-semibold tracking-[-0.03em] transition hover:text-white"

          >

            SKILLSWAP

            <span className="text-[#c7ff39]">

              +

            </span>

          </Link>



          <Link

            to="/dashboard"

            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-4 py-2.5 text-[10px] uppercase tracking-[0.14em] text-[#a0a69f] transition hover:border-[#c7ff39]/30 hover:text-[#f2f4ef]"

          >

            <ArrowLeft

              size={14}

              strokeWidth={1.5}

            />

            Dashboard

          </Link>

        </div>

      </header>



      {/* =====================================================

          CONTENT

      ===================================================== */}



      <div className="relative z-10 mx-auto max-w-[1200px] px-5 pb-20 pt-8 md:px-8 md:pt-10 lg:px-10 lg:pt-12">

        {/* ===================================================

            PROFILE HERO

        =================================================== */}



        <section className="public-profile-hero relative overflow-hidden rounded-[28px] border border-white/[0.09] bg-[#0b100d]/95 shadow-2xl shadow-black/30">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 12% 12%, rgba(199,255,57,.13), transparent 32%), radial-gradient(circle at 88% 0%, rgba(255,255,255,.055), transparent 28%), linear-gradient(135deg, rgba(255,255,255,.025), transparent 55%)",
            }}
          />

          <div className="public-profile-banner relative h-24 overflow-hidden border-b border-white/[0.06] bg-gradient-to-r from-[#18251a] via-[#101a14] to-[#15221a] sm:h-28">
            <div className="absolute -right-12 -top-28 h-64 w-64 rounded-full border border-[#c7ff39]/10" />
            <div className="absolute -right-2 -top-20 h-48 w-48 rounded-full border border-[#c7ff39]/10" />
            <div className="absolute right-12 top-5 h-20 w-20 rounded-full bg-[#c7ff39]/10 blur-3xl" />
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:32px_32px]" />
          </div>

          <div className="relative grid lg:grid-cols-[1fr_320px]">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-7 sm:flex-row sm:items-start">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || profile.username}
                    className="-mt-16 h-24 w-24 shrink-0 rounded-3xl border-4 border-[#0b100d] object-cover shadow-2xl shadow-black/40 sm:h-28 sm:w-28"
                  />
                ) : (
                  <div className="public-profile-avatar-placeholder -mt-16 grid h-24 w-24 shrink-0 place-items-center rounded-3xl border-4 border-[#0b100d] bg-gradient-to-br from-[#263823] to-[#111a13] text-3xl font-medium text-[#c7ff39] shadow-2xl shadow-black/40 sm:h-28 sm:w-28">
                    {avatarInitials}
                  </div>
                )}



                <div className="min-w-0 flex-1">

                  <div className="flex flex-wrap items-center gap-2">

                    <span className="public-profile-role-badge rounded-full border border-[#c7ff39]/25 bg-[#c7ff39]/[0.08] px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-[#d0ff67]">

                      {roleLabel(profile.role)}

                    </span>



                    {canMentor && reviews.length > 0 && (

                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-[#b5bcb5]">

                        <Star

                          size={11}

                          className="text-[#c7ff39]"

                        />

                        {averageRating.toFixed(1)} rating

                      </span>

                    )}

                  </div>



                  <h1 className="mt-5 break-words text-4xl font-semibold tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">

                    {profile.full_name || profile.username}

                  </h1>



                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#929a92]">

                    <span>@{profile.username}</span>



                    {profile.location && (

                      <span className="inline-flex items-center gap-1.5">

                        <MapPin

                          size={14}

                          strokeWidth={1.5}

                        />

                        {profile.location}

                      </span>

                    )}

                  </div>



                  <p className="mt-6 max-w-2xl text-sm leading-7 text-[#b3bbb3]">

                    {profile.bio ||

                      "This member hasn't added a bio yet."}

                  </p>

                </div>

              </div>

            </div>



            <aside className="public-profile-snapshot border-t border-white/[0.07] bg-black/15 p-6 lg:border-l lg:border-t-0 lg:p-8">

              <div className="flex items-center gap-2">

                <Sparkles

                  size={15}

                  className="text-[#c7ff39]"

                />

                <p className="text-[10px] uppercase tracking-[0.16em] text-[#737373]">

                  Profile snapshot

                </p>

              </div>



              <div className="mt-5 grid grid-cols-3 gap-2">
                {profileStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3 sm:p-4"
                  >
                    <p className="text-xl font-semibold tracking-tight text-white">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-[#8c958c]">

                      {stat.label}

                    </p>

                  </div>

                ))}

              </div>



              <div className="mt-5">

                {isOwnProfile ? (

                  <Link

                    to="/profile/edit"

                    className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.025] px-5 text-sm font-medium transition hover:border-[#c7ff39]/40 hover:bg-[#c7ff39]/[0.05] hover:text-[#c7ff39]"

                  >

                    Edit profile

                  </Link>

                ) : (

                  <div className="grid gap-2">

                    {canMentor &&

                      canSendMentorshipRequest && (

                        <button

                          type="button"

                          onClick={openMentorshipModal}

                          disabled={

                            actionLoading !== "" ||

                            !hasMentorshipCredits

                          }

                          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c7ff39] to-[#d7ff70] px-5 text-sm font-semibold text-[#071008] shadow-lg shadow-[#c7ff39]/10 transition hover:-translate-y-0.5 hover:shadow-[#c7ff39]/20 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-[#737373]"

                        >

                          {actionLoading ===

                            "mentorship" && (

                            <Loader2

                              size={16}

                              className="animate-spin"

                            />

                          )}



                          {currentUser &&

                          !hasMentorshipCredits

                            ? `Need 50 SS · ${mentorshipBalance} SS`

                            : "Request Mentorship"}

                        </button>

                      )}



                    <button

                      type="button"

                      onClick={handleMessage}

                      disabled={actionLoading !== ""}

                      className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.025] px-5 text-sm font-medium transition hover:border-[#c7ff39]/40 hover:bg-white/[0.05] hover:text-[#c7ff39] disabled:cursor-not-allowed disabled:opacity-60"

                    >

                      {actionLoading === "message" ? (

                        <Loader2

                          size={16}

                          className="animate-spin"

                        />

                      ) : (

                        <MessageSquare size={16} />

                      )}

                      Message

                    </button>

                  </div>

                )}



                {requestNotice && (

                  <p className="mt-3 text-xs leading-5 text-[#a1a1aa]">

                    {requestNotice}

                  </p>

                )}

              </div>

            </aside>

          </div>

        </section>



        {/* ===================================================

            PROFILE DETAILS

        =================================================== */}



        <section className="mt-8">

          <div className="mb-5 flex items-center gap-3">

            <div>

              <p className="text-[9px] uppercase tracking-[0.16em] text-[#737373]">

                Profile story

              </p>

              <h2 className="mt-1 text-xl font-medium tracking-[-0.03em]">

                About & direction

              </h2>

            </div>

          </div>



          <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">

            <article className="public-profile-surface rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#101612] to-[#0a0d0b] p-6 shadow-lg shadow-black/10">

              <p className="text-[10px] uppercase tracking-[0.16em] text-[#737373]">

                About

              </p>

              <p className="mt-4 text-sm leading-7 text-[#b1b8b1]">

                {profile.bio ||

                  "This member hasn't added a bio yet."}

              </p>

            </article>



            <article className="public-profile-surface rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#101612] to-[#0a0d0b] p-6 shadow-lg shadow-black/10">

              <div className="flex items-center gap-2">

                <Target

                  size={16}

                  className="text-[#c7ff39]"

                />

                <p className="text-[10px] uppercase tracking-[0.16em] text-[#737373]">

                  Career goal

                </p>

              </div>

              <p className="mt-4 text-sm leading-7 text-[#b1b8b1]">

                {profile.career_goal ||

                  "No career goal has been shared yet."}

              </p>

            </article>

          </div>

        </section>



        {/* ===================================================

            TEACHING SKILLS

        =================================================== */}



        <section className="mt-12">

          <div className="mb-6 flex items-end justify-between gap-5">

            <div>

              <div className="flex items-center gap-3">

                <GraduationCap

                  size={18}

                  strokeWidth={1.5}

                  className="text-[#c7ff39]"

                />



                <p className="text-[10px] uppercase tracking-[0.16em] text-[#737373]">

                  Offering

                </p>

              </div>



              <h2 className="mt-3 text-2xl font-medium tracking-[-0.035em]">

                Teaching Skills

              </h2>

            </div>



            <span className="text-xs text-[#737373]">

              {

                teachingSkills.length

              }{" "}

              skills

            </span>

          </div>



          {teachingSkills.length >

          0 ? (

            <div className="grid gap-4 md:grid-cols-2">

              {teachingSkills.map(

                (skill) => (

                  <SkillCard

                    key={

                      skill.id

                    }

                    skill={

                      skill

                    }

                    type="teaching"

                  />

                )

              )}

            </div>

          ) : (

            <EmptyState>

              This member has not

              added any teaching

              skills yet.

            </EmptyState>

          )}

        </section>



        {/* ===================================================

            LEARNING SKILLS

        =================================================== */}



        <section className="mt-12">

          <div className="mb-6 flex items-end justify-between gap-5">

            <div>

              <div className="flex items-center gap-3">

                <BookOpen

                  size={18}

                  strokeWidth={1.5}

                  className="text-[#c7ff39]"

                />



                <p className="text-[10px] uppercase tracking-[0.16em] text-[#737373]">

                  Learning

                </p>

              </div>



              <h2 className="mt-3 text-2xl font-medium tracking-[-0.035em]">

                Learning Skills

              </h2>

            </div>



            <span className="text-xs text-[#737373]">

              {

                learningSkills.length

              }{" "}

              skills

            </span>

          </div>



          {learningSkills.length >

          0 ? (

            <div className="grid gap-4 md:grid-cols-2">

              {learningSkills.map(

                (skill) => (

                  <SkillCard

                    key={

                      skill.id

                    }

                    skill={

                      skill

                    }

                    type="learning"

                  />

                )

              )}

            </div>

          ) : (

            <EmptyState>

              This member has not

              added any learning

              interests yet.

            </EmptyState>

          )}

        </section>



        {/* ===================================================

            COURSES CREATED

        =================================================== */}



        {canMentor && (

          <section className="mt-12">

            <div className="mb-6 flex flex-wrap items-end justify-between gap-5">

              <div>

                <div className="flex items-center gap-3">

                  <Layers3

                    size={18}

                    strokeWidth={1.5}

                    className="text-[#c7ff39]"

                  />



                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#737373]">

                    Courses by {profile.full_name || profile.username}

                  </p>

                </div>



                <h2 className="mt-3 text-2xl font-medium tracking-[-0.035em]">

                  Courses

                </h2>

              </div>



              <span className="text-xs text-[#737373]">

                {publicCourses.length} published

              </span>

            </div>



            {publicCoursesError && (

              <p className="mb-4 rounded-xl border border-[#ffca80]/20 bg-[#ffca80]/[0.04] px-4 py-3 text-sm text-[#ffca80]">

                {publicCoursesError}

              </p>

            )}



            {publicCourses.length > 0 ? (

              <div className="grid gap-4 md:grid-cols-2">

                {publicCourses.map((course) => (

                  <article

                    key={course.id}

                    className="public-profile-surface flex flex-col rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#111713] to-[#0a0d0b] p-5 shadow-lg shadow-black/10 transition"

                  >

                    <div className="flex items-start justify-between gap-4">

                      <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#c7ff39]/20 bg-[#c7ff39]/[0.06] text-[#c7ff39]">

                        <GraduationCap size={18} />

                      </div>



                      {course.course_level && (

                        <span className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-[#a1a1aa]">

                          {course.course_level}

                        </span>

                      )}

                    </div>



                    <p className="mt-5 text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">

                      {course.skillName || "Course"}

                    </p>



                    <h3 className="mt-2 text-lg font-medium leading-6 text-[#f2f4ef]">

                      {course.title}

                    </h3>



                    <div className="mt-auto flex items-center justify-between gap-4 pt-6">

                      <p className="text-sm font-medium text-[#a1a1aa]">

                        {Number(course.price_credits) || 0} SS

                      </p>



                      <Link

                        to={`/courses/${course.id}`}

                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/15 px-4 text-xs font-medium text-[#f2f4ef] transition hover:border-[#c7ff39]/40 hover:text-[#c7ff39]"

                      >

                        View course

                      </Link>

                    </div>

                  </article>

                ))}

              </div>

            ) : publicCoursesError ? null : (

              <EmptyState>

                No courses published yet.

              </EmptyState>

            )}

          </section>

        )}



        {/* ===================================================

            REVIEWS RECEIVED

        =================================================== */}



        {canMentor && (

          <section className="mt-12">

            <div className="mb-6 flex flex-wrap items-end justify-between gap-5">

              <div>

                <div className="flex items-center gap-3">

                  <Star

                    size={18}

                    strokeWidth={1.5}

                    className="text-[#c7ff39]"

                  />



                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#737373]">

                    Mentorship feedback

                  </p>

                </div>



                <h2 className="mt-3 text-2xl font-medium tracking-[-0.035em]">

                  Reviews Received

                </h2>

              </div>



              {reviews.length > 0 && (

                <div className="text-right">

                  <p className="text-2xl font-medium text-[#c7ff39]">

                    {averageRating.toFixed(1)}

                    <span className="ml-1 text-sm text-[#737373]">

                      / 5

                    </span>

                  </p>



                  <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#737373]">

                    {reviews.length}{" "}

                    {reviews.length === 1

                      ? "review"

                      : "reviews"}

                  </p>

                </div>

              )}

            </div>



            {reviews.length > 0 ? (

              <div className="grid gap-4">

                {reviews.map((review) => (

                  <article

                    key={review.id}

                    className="public-profile-surface rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#111713] to-[#0a0d0b] p-5 shadow-lg shadow-black/10 transition hover:border-white/[0.14]"

                  >

                    <div className="flex flex-wrap items-center justify-between gap-3">

                      <div className="flex items-center gap-1">

                        {Array.from({

                          length: 5,

                        }).map((_, index) => (

                          <Star

                            key={index}

                            size={15}

                            strokeWidth={1.5}

                            className={

                              index <

                              Number(

                                review.rating || 0

                              )

                                ? "text-[#c7ff39]"

                                : "text-white/15"

                            }

                          />

                        ))}

                      </div>



                      <span className="text-xs text-[#737373]">

                        {review.created_at

                          ? new Intl.DateTimeFormat(

                              undefined,

                              {

                                dateStyle:

                                  "medium",

                              }

                            ).format(

                              new Date(

                                review.created_at

                              )

                            )

                          : ""}

                      </span>

                    </div>



                    <p className="mt-4 text-sm font-medium text-[#f2f4ef]">

                      {Number(review.rating)} / 5

                    </p>



                    {review.comment ? (

                      <p className="mt-3 text-sm leading-7 text-[#a1a1aa]">

                        {review.comment}

                      </p>

                    ) : (

                      <p className="mt-3 text-sm text-[#525252]">

                        No written comment.

                      </p>

                    )}

                  </article>

                ))}

              </div>

            ) : (

              <EmptyState>

                No reviews yet.

              </EmptyState>

            )}

          </section>

        )}



        {/* ===================================================

            PRIVACY NOTE

        =================================================== */}



        <div className="mt-12 border-t border-white/10 pt-6">

          <p className="text-xs leading-5 text-[#525252]">

            Only public SkillSwap+

            profile information is

            shown here. SS Credit

            balances and transaction

            history are private.

          </p>

        </div>



        {mentorshipModalOpen && (

          <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">

            <div className="public-profile-modal my-8 w-full max-w-xl border border-white/10 bg-[#0a0d0b]">

              <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">

                <div>

                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">

                    Mentorship request

                  </p>



                  <h2 className="mt-2 text-2xl font-medium tracking-[-0.035em]">

                    Choose what you want to learn.

                  </h2>



                  <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">

                    Select one of {profile.full_name || profile.username}&apos;s teaching skills.

                  </p>



                  <div className="mt-4 border border-[#c7ff39]/20 bg-[#c7ff39]/[0.035] px-4 py-3">

                    <p className="text-[9px] uppercase tracking-[0.14em] text-[#c7ff39]">

                      Mentorship fee · 50 SS

                    </p>



                    <p className="mt-1 text-xs leading-5 text-[#a1a1aa]">

                      The 50 SS fee is charged only after the mentorship is successfully completed.

                    </p>

                  </div>

                </div>



                <button

                  type="button"

                  onClick={

                    closeMentorshipModal

                  }

                  disabled={

                    actionLoading ===

                    "mentorship"

                  }

                  className="grid h-9 w-9 shrink-0 place-items-center border border-white/10 text-[#a1a1aa] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39] disabled:opacity-50"

                >

                  ×

                </button>

              </div>



              <div className="p-5">

                <div className="space-y-2">

                  {teachingSkills.map(

                    (skill) => {

                      const skillName =

                        skill.skills

                          ?.name ||

                        "Unnamed skill";



                      const selected =

                        selectedMentorshipSkillId ===

                        skill.skill_id;



                      return (

                        <button

                          key={

                            skill.skill_id

                          }

                          type="button"

                          onClick={() =>

                            setSelectedMentorshipSkillId(

                              skill.skill_id

                            )

                          }

                          className={`flex w-full items-center justify-between gap-4 border p-4 text-left transition ${

                            selected

                              ? "border-[#c7ff39]/40 bg-[#c7ff39]/[0.055]"

                              : "border-white/10 bg-[#060807] hover:border-white/20"

                          }`}

                        >

                          <div>

                            <p className="text-sm font-medium text-[#f2f4ef]">

                              {

                                skillName

                              }

                            </p>



                            {skill.skills

                              ?.difficulty && (

                              <p className="mt-1 text-xs text-[#737373]">

                                {

                                  skill

                                    .skills

                                    .difficulty

                                }

                              </p>

                            )}

                          </div>



                          <span

                            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${

                              selected

                                ? "border-[#c7ff39] bg-[#c7ff39] text-[#071008]"

                                : "border-white/20"

                            }`}

                          >

                            {selected

                              ? "✓"

                              : ""}

                          </span>

                        </button>

                      );

                    }

                  )}

                </div>



                {requestNotice && (

                  <p className="mt-4 text-xs leading-5 text-[#ffca80]">

                    {

                      requestNotice

                    }

                  </p>

                )}



                <div className="mt-6 flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">

                  <button

                    type="button"

                    onClick={

                      closeMentorshipModal

                    }

                    disabled={

                      actionLoading ===

                      "mentorship"

                    }

                    className="min-h-11 border border-white/15 px-5 text-sm text-[#a1a1aa] transition hover:text-white disabled:opacity-50"

                  >

                    Cancel

                  </button>



                  <button

                    type="button"

                    onClick={

                      handleRequestMentorship

                    }

                    disabled={

                      actionLoading ===

                        "mentorship" ||

                      !selectedMentorshipSkillId

                    }

                    className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008] transition hover:bg-[#d2ff64] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-[#737373]"

                  >

                    {actionLoading ===

                    "mentorship" ? (

                      <Loader2

                        size={16}

                        className="animate-spin"

                      />

                    ) : null}



                    Send request

                  </button>

                </div>

              </div>

            </div>

          </div>

        )}

      </div>

    </main>

  );

}