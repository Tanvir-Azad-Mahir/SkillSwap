import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  MapPin,
  Target,
  UserRound,
} from "lucide-react";

import { supabase } from "../lib/supabase";

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
    <div className="border border-dashed border-white/10 bg-white/[0.015] px-5 py-8 text-sm leading-6 text-[#737373]">
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
    <article className="border border-white/10 bg-[#0a0d0b] p-5 transition hover:border-white/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-medium text-[#f2f4ef]">
            {skillData.name ||
              "Unnamed skill"}
          </h3>

          {skillData.description && (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#737373]">
              {skillData.description}
            </p>
          )}
        </div>

        {skill.is_verified && (
          <span className="shrink-0 border border-[#c7ff39]/20 bg-[#c7ff39]/[0.05] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-[#c7ff39]">
            Verified
          </span>
        )}
      </div>

      {type === "teaching" && (
        <div className="mt-5 flex flex-wrap gap-2">
          {skill.proficiency_level && (
            <span className="border border-white/10 px-2.5 py-1 text-[11px] text-[#a1a1aa]">
              {skill.proficiency_level}
            </span>
          )}

          {Number(
            skill.years_experience
          ) > 0 && (
            <span className="border border-white/10 px-2.5 py-1 text-[11px] text-[#a1a1aa]">
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
          <p className="mt-4 text-xs leading-5 text-[#a1a1aa]">
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
    teachingSkills,
    setTeachingSkills,
  ] = useState([]);

  const [
    learningSkills,
    setLearningSkills,
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
    requestNotice,
    setRequestNotice,
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

        setProfile(
          profileData
        );

        /* ===============================================
           TEACHING SKILLS

           ProfileSetup stores teaching skills in
           user_skills with type = "offering".
        =============================================== */

        const {
          data: teachingData,
          error:
            teachingError,
        } = await supabase
          .from("user_skills")
          .select(
            `
              id,
              skill_id,
              proficiency_level,
              years_experience,
              is_verified,
              skills (
                id,
                name,
                description,
                difficulty_level
              )
            `
          )
          .eq(
            "user_id",
            profileData.id
          )
          .eq(
            "type",
            "offering"
          );

        if (teachingError) {
          console.error(
            "Teaching skills error:",
            teachingError
          );
        }

        /* ===============================================
           LEARNING SKILLS

           Your ProfileSetup stores learning skills
           inside user_interests.
        =============================================== */

        const {
          data: learningData,
          error:
            learningError,
        } = await supabase
          .from(
            "user_interests"
          )
          .select(
            `
              id,
              skill_id,
              interest_text,
              weight,
              skills (
                id,
                name,
                description,
                difficulty_level
              )
            `
          )
          .eq(
            "user_id",
            profileData.id
          );

        if (learningError) {
          console.error(
            "Learning skills error:",
            learningError
          );
        }

        if (!active) {
          return;
        }

        setTeachingSkills(
          teachingData || []
        );

        setLearningSkills(
          learningData || []
        );
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

  /* =========================================================
     REQUEST MENTORSHIP

     Full mentorship request form/database flow
     will be connected in the next step.
  ========================================================= */

  const handleRequestMentorship =
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

      if (!canMentor) {
        setRequestNotice(
          "This member is not currently offering mentorship."
        );
        return;
      }

      if (
        teachingSkills.length === 0
      ) {
        setRequestNotice(
          "This mentor has not added any teaching skills yet."
        );
        return;
      }

      /*
        NEXT STEP:
        open mentorship request modal here.
      */

      setRequestNotice(
        "Mentorship request form will open here."
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
      <main className="relative grid min-h-screen place-items-center bg-[#060807] px-5 text-[#f2f4ef]">
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
    <main className="relative min-h-screen overflow-hidden bg-[#060807] text-[#f2f4ef]">
      {/* Background noise */}

      <div className="noise pointer-events-none fixed inset-0" />

      {/* Background glow */}

      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 15% 8%, rgba(199,255,57,.055), transparent 32%)",
        }}
      />

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="relative z-20 border-b border-white/10 bg-[#060807]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-5 md:px-8 lg:px-10">
          <Link
            to="/dashboard"
            className="text-lg font-semibold tracking-[-0.03em]"
          >
            SKILLSWAP
            <span className="text-[#c7ff39]">
              +
            </span>
          </Link>

          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#737373] transition hover:text-[#f2f4ef]"
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

      <div className="relative z-10 mx-auto max-w-[1200px] px-5 pb-20 pt-12 md:px-8 lg:px-10 lg:pt-16">
        {/* ===================================================
            PROFILE HERO
        =================================================== */}

        <section className="border border-white/10 bg-[#0a0d0b]/80 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {/* Avatar */}

              {profile.avatar_url ? (
                <img
                  src={
                    profile.avatar_url
                  }
                  alt={
                    profile.full_name ||
                    profile.username
                  }
                  className="h-28 w-28 shrink-0 border border-white/10 object-cover"
                />
              ) : (
                <div className="grid h-28 w-28 shrink-0 place-items-center border border-white/10 bg-[#0c120d] text-3xl font-medium text-[#c7ff39]">
                  {avatarInitials}
                </div>
              )}

              {/* Identity */}

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="border border-[#c7ff39]/20 bg-[#c7ff39]/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-[#c7ff39]">
                    {roleLabel(
                      profile.role
                    )}
                  </span>
                </div>

                <h1 className="mt-4 text-4xl font-medium tracking-[-0.045em] sm:text-5xl">
                  {profile.full_name ||
                    profile.username}
                </h1>

                <p className="mt-2 text-sm text-[#737373]">
                  @
                  {
                    profile.username
                  }
                </p>

                {profile.location && (
                  <div className="mt-5 flex items-center gap-2 text-sm text-[#a1a1aa]">
                    <MapPin
                      size={15}
                      strokeWidth={1.5}
                    />

                    {
                      profile.location
                    }
                  </div>
                )}
              </div>
            </div>

            {/* CTA */}

            <div className="w-full lg:w-auto lg:min-w-[230px]">
              {isOwnProfile ? (
                <Link
                  to="/profile/edit"
                  className="flex min-h-[50px] w-full items-center justify-center border border-white/15 px-5 text-sm font-medium transition hover:border-[#c7ff39]/40 hover:text-[#c7ff39]"
                >
                  Edit profile
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={
                    handleRequestMentorship
                  }
                  disabled={
                    !canMentor
                  }
                  className="flex min-h-[50px] w-full items-center justify-center bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008] transition hover:bg-[#d2ff64] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-[#737373]"
                >
                  Request Mentorship
                </button>
              )}

              {requestNotice && (
                <p className="mt-3 text-xs leading-5 text-[#a1a1aa]">
                  {requestNotice}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ===================================================
            ABOUT + GOAL
        =================================================== */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* About */}

          <section className="border border-white/10 bg-[#0a0d0b] p-6">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#737373]">
              About
            </p>

            <h2 className="mt-3 text-xl font-medium tracking-[-0.025em]">
              Bio
            </h2>

            <p className="mt-4 text-sm leading-7 text-[#a1a1aa]">
              {profile.bio ||
                "This member hasn't added a bio yet."}
            </p>
          </section>

          {/* Career goal */}

          <section className="border border-white/10 bg-[#0a0d0b] p-6">
            <div className="flex items-center gap-3">
              <Target
                size={17}
                strokeWidth={1.5}
                className="text-[#c7ff39]"
              />

              <p className="text-[10px] uppercase tracking-[0.16em] text-[#737373]">
                Direction
              </p>
            </div>

            <h2 className="mt-3 text-xl font-medium tracking-[-0.025em]">
              Career Goal
            </h2>

            <p className="mt-4 text-sm leading-7 text-[#a1a1aa]">
              {profile.career_goal ||
                "No career goal has been shared yet."}
            </p>
          </section>
        </div>

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
      </div>
    </main>
  );
}