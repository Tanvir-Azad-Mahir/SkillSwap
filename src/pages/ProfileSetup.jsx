import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

import ProfileSetupHeader from "../components/ProfileSetupHeader";
import ProfileSetupProgress from "../components/ProfileSetupProgress";
import BasicProfileStep from "../components/BasicProfileStep";
import TeachSkillsStep from "../components/TeachSkillsStep";
import LearnSkillsStep from "../components/LearnSkillsStep";
import PreferencesStep from "../components/PreferencesStep";
import ProfileSetupFooter from "../components/ProfileSetupFooter";

/* =========================================================
   CONFIG
========================================================= */

const AVATAR_BUCKET = "avatars";

const TEACH_SKILL_TYPE = "offering";

const ROLE_LEARNER = "learner";
const ROLE_MENTOR = "mentor";
const ROLE_SWAP_MASTER = "swap_master";

const STEPS = [
  { number: "01", label: "Profile" },
  { number: "02", label: "Teach" },
  { number: "03", label: "Learn" },
  { number: "04", label: "Preferences" },
];

const initialProfile = {
  avatar_url: "",
  bio: "",
  role: "",
  career_goal: "",
  location: "",
};

const initialIdentity = {
  username: "",
  full_name: "",
};

/* =========================================================
   PROFILE SETUP PAGE
========================================================= */

export default function ProfileSetup() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [user, setUser] = useState(null);

  const [identity, setIdentity] = useState(initialIdentity);

  const [profile, setProfile] = useState(initialProfile);

  const [avatarFile, setAvatarFile] = useState(null);

  const [skills, setSkills] = useState([]);

  const [skillsLoadError, setSkillsLoadError] = useState("");

  const [teachSkills, setTeachSkills] = useState([]);

  const [learnSkills, setLearnSkills] = useState([]);

  const [settings, setSettings] = useState({
    language: "English",
    timezone:
      Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    theme: "dark",
  });

  const [initialLoading, setInitialLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState(false);

  const currentStep = STEPS[step];

  /* =========================================================
     LOAD PROFILE SETUP DATA
  ========================================================= */

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setInitialLoading(true);
        setError("");
        setSkillsLoadError("");

        /* ---------------------------------------------------
           GET AUTHENTICATED USER
        --------------------------------------------------- */

        const {
          data: { user: authUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!authUser) {
          navigate("/login", {
            replace: true,
          });

          return;
        }

        if (!active) return;

        setUser(authUser);

        /* ---------------------------------------------------
           LOAD DATA

           Important:
           Skills query is EXACTLY the same as Dashboard.
        --------------------------------------------------- */

        const [
          profileResult,
          skillsResult,
          userSkillsResult,
          interestsResult,
          settingsResult,
        ] = await Promise.all([
          /* PROFILE */

          supabase
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
                is_active,
                profile_completed
              `
            )
            .eq("id", authUser.id)
            .maybeSingle(),

          /* SKILLS */

          supabase
            .from("skills")
            .select(
              "id, name, description, difficulty_level"
            )
            .eq("is_active", true)
            .order("name"),

          /* TEACHING SKILLS */

          supabase
            .from("user_skills")
            .select(
              `
                id,
                skill_id,
                type,
                proficiency_level,
                years_experience,
                is_verified
              `
            )
            .eq("user_id", authUser.id),

          /* LEARNING INTERESTS */

          supabase
            .from("user_interests")
            .select(
              `
                id,
                skill_id,
                interest_text,
                weight
              `
            )
            .eq("user_id", authUser.id),

          /* SETTINGS */

          supabase
            .from("user_settings")
            .select(
              `
                id,
                language,
                timezone,
                theme
              `
            )
            .eq("user_id", authUser.id)
            .maybeSingle(),
        ]);

        if (!active) return;

        /* ===================================================
           PROFILE RESULT
        =================================================== */

        if (profileResult.error) {
          console.error(
            "Profile load error:",
            profileResult.error
          );
        }

        const existingProfile = profileResult.error
          ? null
          : profileResult.data;

        /*
          ProfileSetup is only for onboarding.

          If user has already completed their profile,
          send them to Dashboard.
        */

        if (existingProfile?.profile_completed === true) {
          navigate("/dashboard", {
            replace: true,
          });

          return;
        }

        /* ===================================================
           SKILLS RESULT
        =================================================== */

        if (skillsResult.error) {
          console.error(
            "PROFILE SETUP SKILLS ERROR:",
            skillsResult.error
          );

          setSkills([]);

          setSkillsLoadError(
            "We couldn't load the skill catalog. Please refresh and try again."
          );
        } else {
          const loadedSkills = skillsResult.data || [];

          console.log(
            "PROFILE SETUP SKILLS LOADED:",
            loadedSkills
          );

          console.log(
            "TOTAL ACTIVE SKILLS:",
            loadedSkills.length
          );

          setSkills(loadedSkills);

          if (loadedSkills.length === 0) {
            console.warn(
              "Profile Setup received 0 active skills."
            );

            setSkillsLoadError(
              "No skills are available right now. Please refresh and try again."
            );
          } else {
            setSkillsLoadError("");
          }
        }

        /* ===================================================
           OPTIONAL TABLE ERRORS

           Do not stop skill catalog from loading.
        =================================================== */

        if (userSkillsResult.error) {
          console.error(
            "Teaching skills load error:",
            userSkillsResult.error
          );
        }

        if (interestsResult.error) {
          console.error(
            "Learning interests load error:",
            interestsResult.error
          );
        }

        if (settingsResult.error) {
          console.error(
            "Settings load error:",
            settingsResult.error
          );
        }

        /* ===================================================
           USER IDENTITY

           Username and full name were already collected
           during signup. Do not ask for them again.
        =================================================== */

        const metadata = authUser.user_metadata || {};

        const username =
          existingProfile?.username ??
          metadata.username ??
          "";

        const fullName =
          existingProfile?.full_name ??
          metadata.full_name ??
          metadata.name ??
          "";

        if (!username) {
          throw new Error("SIGNUP_USERNAME_MISSING");
        }

        if (!fullName) {
          throw new Error("SIGNUP_FULL_NAME_MISSING");
        }

        setIdentity({
          username: username.trim().toLowerCase(),
          full_name: fullName.trim(),
        });

        /* ===================================================
           PROFILE FORM
        =================================================== */

        setProfile({
          avatar_url:
            existingProfile?.avatar_url ??
            metadata.avatar_url ??
            metadata.picture ??
            "",

          bio:
            existingProfile?.bio ?? "",

          role:
            existingProfile?.role ?? "",

          career_goal:
            existingProfile?.career_goal ?? "",

          location:
            existingProfile?.location ?? "",
        });

        /* ===================================================
           EXISTING TEACHING SKILLS
        =================================================== */

        const existingTeachingSkills = userSkillsResult.error
          ? []
          : userSkillsResult.data || [];

        setTeachSkills(
          existingTeachingSkills
            .filter(
              (row) =>
                row.type === TEACH_SKILL_TYPE
            )
            .map((row) => ({
              skill_id: row.skill_id,

              proficiency_level:
                row.proficiency_level ||
                "intermediate",

              years_experience:
                row.years_experience ?? 0,
            }))
        );

        /* ===================================================
           EXISTING LEARNING SKILLS
        =================================================== */

        const existingInterests = interestsResult.error
          ? []
          : interestsResult.data || [];

        setLearnSkills(
          existingInterests.map((row) => ({
            skill_id: row.skill_id,

            interest_text:
              row.interest_text || "",

            weight:
              row.weight ?? 3,
          }))
        );

        /* ===================================================
           SETTINGS
        =================================================== */

        if (
          !settingsResult.error &&
          settingsResult.data
        ) {
          setSettings({
            language:
              settingsResult.data.language ||
              "English",

            timezone:
              settingsResult.data.timezone ||
              Intl.DateTimeFormat().resolvedOptions()
                .timeZone ||
              "UTC",

            theme:
              settingsResult.data.theme ||
              "dark",
          });
        }
      } catch (err) {
        console.error(
          "Profile setup load error:",
          err
        );

        if (!active) return;

        if (
          err?.message ===
          "SIGNUP_USERNAME_MISSING"
        ) {
          setError(
            "Your signup username could not be found. Please sign in again."
          );

          return;
        }

        if (
          err?.message ===
          "SIGNUP_FULL_NAME_MISSING"
        ) {
          setError(
            "Your account name could not be found. Please sign in again."
          );

          return;
        }

        setError(
          "We couldn't load your profile right now. Please refresh and try again."
        );
      } finally {
        if (active) {
          setInitialLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [navigate]);

  /* =========================================================
     SKILL MAP
  ========================================================= */

  const skillMap = useMemo(() => {
    return new Map(
      skills.map((skill) => [
        skill.id,
        skill,
      ])
    );
  }, [skills]);

  /* =========================================================
     ROLE REQUIREMENTS
  ========================================================= */

  /*
    Learner
    - Teaching optional
    - Learning required

    Mentor
    - Teaching required
    - Learning optional

    Swap Master
    - Teaching required
    - Learning required
  */

  const roleRequiresTeaching =
    profile.role === ROLE_MENTOR ||
    profile.role === ROLE_SWAP_MASTER;

  const roleRequiresLearning =
    profile.role === ROLE_LEARNER ||
    profile.role === ROLE_SWAP_MASTER;

  /* =========================================================
     VALIDATE CURRENT STEP
  ========================================================= */

  const validateStep = () => {
    setError("");

    /* PROFILE */

    if (step === 0) {
      if (
        ![
          ROLE_LEARNER,
          ROLE_MENTOR,
          ROLE_SWAP_MASTER,
        ].includes(profile.role)
      ) {
        setError(
          "Choose how you want to use SkillSwap+."
        );

        return false;
      }
    }

    /* TEACH */

    if (
      step === 1 &&
      roleRequiresTeaching &&
      teachSkills.length === 0
    ) {
      if (skills.length === 0) {
        setError(
          "The skill catalog isn't available right now. Please refresh and try again."
        );

        return false;
      }

      setError(
        profile.role === ROLE_MENTOR
          ? "Mentors need at least one skill they can teach."
          : "Swap Masters need at least one skill they can teach."
      );

      return false;
    }

    /* LEARN */

    if (
      step === 2 &&
      roleRequiresLearning &&
      learnSkills.length === 0
    ) {
      if (skills.length === 0) {
        setError(
          "The skill catalog isn't available right now. Please refresh and try again."
        );

        return false;
      }

      setError(
        profile.role === ROLE_LEARNER
          ? "Learners need at least one skill they want to learn."
          : "Swap Masters need at least one skill they want to learn."
      );

      return false;
    }

    return true;
  };

  /* =========================================================
     NEXT
  ========================================================= */

  const goNext = () => {
    if (!validateStep()) {
      return;
    }

    setStep((current) =>
      Math.min(
        current + 1,
        STEPS.length - 1
      )
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================================
     BACK
  ========================================================= */

  const goBack = () => {
    setError("");

    setStep((current) =>
      Math.max(current - 1, 0)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================================
     AVATAR UPLOAD
  ========================================================= */

  const uploadAvatar = async () => {
    if (!avatarFile || !user) {
      return profile.avatar_url || null;
    }

    /* -------------------------------------------------------
       FILE TYPE
    ------------------------------------------------------- */

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      avatarFile.type &&
      !allowedTypes.includes(avatarFile.type)
    ) {
      throw new Error("INVALID_AVATAR_TYPE");
    }

    /* -------------------------------------------------------
       MAX 5 MB
    ------------------------------------------------------- */

    const MAX_AVATAR_SIZE =
      5 * 1024 * 1024;

    if (
      avatarFile.size > MAX_AVATAR_SIZE
    ) {
      throw new Error("AVATAR_TOO_LARGE");
    }

    /* -------------------------------------------------------
       FILE PATH
    ------------------------------------------------------- */

    const extension =
      avatarFile.name
        .split(".")
        .pop()
        ?.toLowerCase() || "jpg";

    const filePath =
      `${user.id}/profile-${Date.now()}.${extension}`;

    /* -------------------------------------------------------
       UPLOAD

       Unique timestamp path, so upsert is not needed.
    ------------------------------------------------------- */

    const {
      error: uploadError,
    } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(
        filePath,
        avatarFile,
        {
          upsert: false,
          cacheControl: "3600",
          contentType:
            avatarFile.type || undefined,
        }
      );

    if (uploadError) {
      console.error(
        "Avatar upload error:",
        uploadError
      );

      throw uploadError;
    }

    /* -------------------------------------------------------
       GET PUBLIC URL
    ------------------------------------------------------- */

    const { data } =
      supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(filePath);

    const publicUrl =
      data?.publicUrl || "";

    if (!publicUrl) {
      throw new Error(
        "AVATAR_URL_FAILED"
      );
    }

    /* -------------------------------------------------------
       OPTIONAL MEDIA HISTORY

       Never stop onboarding if media history fails.
    ------------------------------------------------------- */

    try {
      const {
        error: mediaError,
      } = await supabase
        .from("media")
        .insert({
          owner_id: user.id,
          url: publicUrl,
          public_id: filePath,
          media_type: "avatar",
          created_at:
            new Date().toISOString(),
        });

      if (mediaError) {
        console.warn(
          "Avatar uploaded, but media history was not saved:",
          mediaError
        );
      }
    } catch (mediaError) {
      console.warn(
        "Avatar media history skipped:",
        mediaError
      );
    }

    return publicUrl;
  };

  /* =========================================================
     SAVE SETTINGS
  ========================================================= */

  const saveSettings = async () => {
    const {
      data: existingSettings,
      error: existingError,
    } = await supabase
      .from("user_settings")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    /* UPDATE EXISTING */

    if (existingSettings) {
      const {
        error: updateError,
      } = await supabase
        .from("user_settings")
        .update({
          language:
            settings.language,

          timezone:
            settings.timezone,

          theme:
            settings.theme,
        })
        .eq(
          "id",
          existingSettings.id
        );

      if (updateError) {
        throw updateError;
      }

      return;
    }

    /* INSERT NEW */

    const {
      error: insertError,
    } = await supabase
      .from("user_settings")
      .insert({
        user_id: user.id,

        language:
          settings.language,

        timezone:
          settings.timezone,

        theme:
          settings.theme,
      });

    if (insertError) {
      throw insertError;
    }
  };

  /* =========================================================
     FINISH PROFILE SETUP
  ========================================================= */

  const handleFinish = async () => {
    if (
      !validateStep() ||
      !user ||
      saving
    ) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const cleanUsername =
        identity.username
          .trim()
          .toLowerCase();

      const cleanFullName =
        identity.full_name.trim();

      if (!cleanUsername) {
        throw new Error(
          "SIGNUP_USERNAME_MISSING"
        );
      }

      if (!cleanFullName) {
        throw new Error(
          "SIGNUP_FULL_NAME_MISSING"
        );
      }

      /* =====================================================
         AVATAR
      ===================================================== */

      const avatarUrl =
        await uploadAvatar();

      /* =====================================================
         PROFILE
      ===================================================== */

      const {
        error: profileError,
      } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,

            username:
              cleanUsername,

            full_name:
              cleanFullName,

            avatar_url:
              avatarUrl,

            bio:
              profile.bio.trim() ||
              null,

            role:
              profile.role,

            career_goal:
              profile.career_goal.trim() ||
              null,

            location:
              profile.location.trim() ||
              null,

            is_active:
              true,

            profile_completed:
              true,

            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict: "id",
          }
        );

      if (profileError) {
        throw profileError;
      }

      /* =====================================================
         DELETE OLD TEACHING SKILLS
      ===================================================== */

      const {
        error: deleteTeachingError,
      } = await supabase
        .from("user_skills")
        .delete()
        .eq("user_id", user.id)
        .eq(
          "type",
          TEACH_SKILL_TYPE
        );

      if (deleteTeachingError) {
        throw deleteTeachingError;
      }

      /* =====================================================
         INSERT TEACHING SKILLS
      ===================================================== */

      if (teachSkills.length > 0) {
        const teachingRows =
          teachSkills.map((item) => ({
            user_id:
              user.id,

            skill_id:
              item.skill_id,

            type:
              TEACH_SKILL_TYPE,

            proficiency_level:
              item.proficiency_level ||
              "intermediate",

            years_experience:
              Number(
                item.years_experience
              ) || 0,

            is_verified:
              false,
          }));

        const {
          error: teachingError,
        } = await supabase
          .from("user_skills")
          .insert(teachingRows);

        if (teachingError) {
          throw teachingError;
        }
      }

      /* =====================================================
         DELETE OLD LEARNING INTERESTS
      ===================================================== */

      const {
        error: deleteLearningError,
      } = await supabase
        .from("user_interests")
        .delete()
        .eq(
          "user_id",
          user.id
        );

      if (deleteLearningError) {
        throw deleteLearningError;
      }

      /* =====================================================
         INSERT LEARNING INTERESTS
      ===================================================== */

      if (learnSkills.length > 0) {
        const learningRows =
          learnSkills.map((item) => ({
            user_id:
              user.id,

            skill_id:
              item.skill_id,

            interest_text:
              item.interest_text
                ?.trim() ||
              null,

            weight:
              Number(
                item.weight
              ) || 3,
          }));

        const {
          error: learningError,
        } = await supabase
          .from("user_interests")
          .insert(learningRows);

        if (learningError) {
          throw learningError;
        }
      }

      /* =====================================================
         SETTINGS
      ===================================================== */

      await saveSettings();

      /* =====================================================
         SUCCESS
      ===================================================== */

      setProfile((current) => ({
        ...current,

        avatar_url:
          avatarUrl || "",
      }));

      setSuccess(true);
    } catch (err) {
      console.error(
        "Profile setup save error:",
        err
      );

      /* -----------------------------------------------------
         AVATAR TYPE
      ----------------------------------------------------- */

      if (
        err?.message ===
        "INVALID_AVATAR_TYPE"
      ) {
        setError(
          "Use a JPG, PNG or WebP image for your profile photo."
        );

        return;
      }

      /* -----------------------------------------------------
         AVATAR SIZE
      ----------------------------------------------------- */

      if (
        err?.message ===
        "AVATAR_TOO_LARGE"
      ) {
        setError(
          "Your profile photo must be smaller than 5 MB."
        );

        return;
      }

      /* -----------------------------------------------------
         STORAGE BUCKET
      ----------------------------------------------------- */

      if (
        err?.statusCode === "404" ||
        err?.message
          ?.toLowerCase()
          .includes(
            "bucket not found"
          )
      ) {
        setError(
          "Your profile photo couldn't be uploaded. Please try again."
        );

        return;
      }

      /* -----------------------------------------------------
         DUPLICATE DATABASE VALUE
      ----------------------------------------------------- */

      if (
        err?.code === "23505"
      ) {
        setError(
          "That account information is already in use. Please try again."
        );

        return;
      }

      /* -----------------------------------------------------
         GENERIC
      ----------------------------------------------------- */

      setError(
        "We couldn't save your profile right now. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     LOADING SCREEN
  ========================================================= */

  if (initialLoading) {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#060807] text-[#f2f4ef]">
        <div className="noise pointer-events-none fixed inset-0" />

        <div className="relative z-10 text-center">
          <div className="mx-auto mb-5 h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-[#c7ff39]" />

          <p className="text-xs uppercase tracking-[0.18em] text-[#a1a1aa]">
            Loading profile setup
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     SUCCESS SCREEN
  ========================================================= */

  if (success) {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#060807] px-5 text-[#f2f4ef]">
        <div className="noise pointer-events-none fixed inset-0" />

        <div
          className="pointer-events-none fixed inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 70%, rgba(199,255,57,.11), transparent 45%)",
          }}
        />

        <div className="relative z-10 w-full max-w-2xl border border-white/10 bg-[#0a0d0b]/90 p-8 md:p-12">
          <p className="mb-5 text-xs uppercase tracking-[0.18em] text-[#c7ff39]">
            Profile complete
          </p>

          <h1 className="text-4xl font-medium tracking-[-0.045em] md:text-6xl">
            You’re ready to swap.
          </h1>

          <p className="mt-5 max-w-lg leading-7 text-[#a1a1aa]">
            Your SkillSwap+ profile and preferences have been saved.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/dashboard",
                {
                  replace: true,
                }
              )
            }
            className="mt-8 min-h-12 bg-[#c7ff39] px-6 font-semibold text-[#071008] transition hover:bg-[#d2ff64] focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
          >
            Enter SkillSwap+ →
          </button>
        </div>
      </main>
    );
  }

  /* =========================================================
     PROFILE SETUP UI
  ========================================================= */

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060807] text-[#f2f4ef]">
      {/* Background */}

      <div className="noise pointer-events-none fixed inset-0 z-0" />

      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 75% 24%, rgba(199,255,57,.07), transparent 42%)",
        }}
      />

      <div className="relative z-10">
        {/* Header */}

        <ProfileSetupHeader />

        <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-28 md:px-8 lg:grid-cols-[0.35fr_0.65fr] lg:gap-16 lg:px-10 lg:pt-32">
          {/* Progress */}

          <ProfileSetupProgress
            steps={STEPS}
            currentStep={step}
            onStepClick={(index) => {
              if (
                index <= step &&
                !saving
              ) {
                setError("");
                setStep(index);
              }
            }}
          />

          {/* Content */}

          <section className="w-full">
            {/* Step header */}

            <div className="mb-7 flex items-end justify-between gap-5 border-b border-white/10 pb-5">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#a1a1aa]">
                  <span className="mr-2 text-[#c7ff39]">
                    ●
                  </span>

                  {currentStep.number} / 04
                </p>

                <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em] md:text-4xl">
                  {currentStep.label}
                </h1>
              </div>

              <span className="hidden text-right text-xs uppercase tracking-[0.16em] text-[#a1a1aa] sm:block">
                Complete your account
              </span>
            </div>

            {/* General error */}

            {error && (
              <div
                role="alert"
                className="mb-6 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm text-[#ff8b8b]"
              >
                {error}
              </div>
            )}

            {/* Skill loading warning */}

            {(step === 1 ||
              step === 2) &&
              skillsLoadError && (
                <div
                  role="alert"
                  className="mb-6 border border-[#ffb84d]/30 bg-[#ffb84d]/[0.04] px-4 py-3 text-sm text-[#ffc66d]"
                >
                  {skillsLoadError}
                </div>
              )}

            {/* =================================================
                STEP 1 — PROFILE
            ================================================= */}

            {step === 0 && (
              <BasicProfileStep
                profile={profile}
                setProfile={setProfile}
                avatarFile={avatarFile}
                setAvatarFile={
                  setAvatarFile
                }
              />
            )}

            {/* =================================================
                STEP 2 — TEACH
            ================================================= */}

            {step === 1 && (
              <TeachSkillsStep
                skills={skills}
                selected={teachSkills}
                setSelected={
                  setTeachSkills
                }
                skillMap={skillMap}
                role={profile.role}
                required={
                  roleRequiresTeaching
                }
              />
            )}

            {/* =================================================
                STEP 3 — LEARN
            ================================================= */}

            {step === 2 && (
              <LearnSkillsStep
                skills={skills}
                selected={learnSkills}
                setSelected={
                  setLearnSkills
                }
                skillMap={skillMap}
                role={profile.role}
                required={
                  roleRequiresLearning
                }
              />
            )}

            {/* =================================================
                STEP 4 — PREFERENCES
            ================================================= */}

            {step === 3 && (
              <PreferencesStep
                settings={settings}
                setSettings={setSettings}
              />
            )}

            {/* =================================================
                NAVIGATION
            ================================================= */}

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              {/* BACK */}

              <button
                type="button"
                onClick={() => {
                  if (saving) return;

                  if (step === 0) {
                    navigate("/", {
                      replace: true,
                    });
                  } else {
                    goBack();
                  }
                }}
                disabled={saving}
                className="min-h-12 border border-white/15 px-5 text-sm font-medium text-[#f2f4ef] transition hover:border-white/30 hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
              >
                ← Back
              </button>

              {/* CONTINUE / FINISH */}

              {step <
              STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={saving}
                  className="min-h-12 bg-[#c7ff39] px-6 text-sm font-semibold text-[#071008] transition hover:bg-[#d2ff64] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={
                    handleFinish
                  }
                  disabled={saving}
                  className="flex min-h-12 items-center justify-center gap-3 bg-[#c7ff39] px-6 text-sm font-semibold text-[#071008] transition hover:bg-[#d2ff64] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#071008]/25 border-t-[#071008]" />

                      Saving profile...
                    </>
                  ) : (
                    "Finish profile →"
                  )}
                </button>
              )}
            </div>
          </section>
        </div>

        <ProfileSetupFooter />
      </div>
    </main>
  );
}