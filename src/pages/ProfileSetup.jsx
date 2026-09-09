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
   ROLE HELPERS
========================================================= */

function normalizeRoleForFrontend(value) {
  const role = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (role === "learner") {
    return ROLE_LEARNER;
  }

  if (role === "mentor") {
    return ROLE_MENTOR;
  }

  if (
    role === "swap_master" ||
    role === "swapmaster"
  ) {
    return ROLE_SWAP_MASTER;
  }

  return "";
}

function getDatabaseRoleCandidates(role) {
  if (role === ROLE_LEARNER) {
    return ["Learner", "learner"];
  }

  if (role === ROLE_MENTOR) {
    return ["Mentor", "mentor"];
  }

  if (role === ROLE_SWAP_MASTER) {
    return [
      "Swap Master",
      "Swap_Master",
      "swap_master",
      "Swap master",
    ];
  }

  return [];
}

function isRoleEnumError(error) {
  const message = String(
    error?.message || ""
  ).toLowerCase();

  return (
    message.includes("invalid input value for enum") ||
    message.includes("user_role")
  );
}

/* =========================================================
   PROFILE SETUP
========================================================= */

export default function ProfileSetup() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);

  const [user, setUser] = useState(null);

  const [identity, setIdentity] =
    useState(initialIdentity);

  const [profile, setProfile] =
    useState(initialProfile);

  const [avatarFile, setAvatarFile] =
    useState(null);

  const [skills, setSkills] =
    useState([]);

  const [
    skillsLoadError,
    setSkillsLoadError,
  ] = useState("");

  const [
    teachSkills,
    setTeachSkills,
  ] = useState([]);

  const [
    learnSkills,
    setLearnSkills,
  ] = useState([]);

  const [settings, setSettings] =
    useState({
      language: "English",

      timezone:
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone || "UTC",

      theme: "dark",
    });

  const [
    initialLoading,
    setInitialLoading,
  ] = useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const currentStep =
    STEPS[step];

  /* =========================================================
     LOAD PROFILE SETUP
  ========================================================= */

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setInitialLoading(true);

        setError("");

        setSkillsLoadError("");

        /* =====================================================
           AUTH USER
        ===================================================== */

        const {
          data: {
            user: authUser,
          },
          error: authError,
        } =
          await supabase.auth.getUser();

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

        setUser(authUser);

        /* =====================================================
           LOAD DATA
        ===================================================== */

        const [
          profileResult,
          skillsResult,
          userSkillsResult,
          interestsResult,
          settingsResult,
        ] =
          await Promise.all([
            /* PROFILE */

            supabase
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
                  profile_completed
                `
              )
              .eq(
                "id",
                authUser.id
              )
              .maybeSingle(),

            /* SKILLS */

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

            /* USER SKILLS

               LIVE TABLE:

               user_id
               skill_id
               is_learning
               is_teaching
            */

            supabase
              .from("user_skills")
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

            /* LEARNING INTEREST DETAILS */

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
              .eq(
                "user_id",
                authUser.id
              ),

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
              .eq(
                "user_id",
                authUser.id
              )
              .maybeSingle(),
          ]);

        if (!active) {
          return;
        }

        /* =====================================================
           PROFILE
        ===================================================== */

        if (profileResult.error) {
          console.error(
            "PROFILE LOAD ERROR:",
            profileResult.error
          );

          throw profileResult.error;
        }

        const existingProfile =
          profileResult.data;

        if (!existingProfile) {
          throw new Error(
            "PROFILE_ROW_NOT_FOUND"
          );
        }

        /* Already completed */

        if (
          existingProfile.profile_completed ===
          true
        ) {
          navigate(
            "/dashboard",
            {
              replace: true,
            }
          );

          return;
        }

        /* =====================================================
           IDENTITY
        ===================================================== */

        const metadata =
          authUser.user_metadata ||
          {};

        const username =
          existingProfile.username ??
          metadata.username ??
          "";

        const fullName =
          existingProfile.full_name ??
          metadata.full_name ??
          metadata.name ??
          "";

        if (!username) {
          throw new Error(
            "SIGNUP_USERNAME_MISSING"
          );
        }

        if (!fullName) {
          throw new Error(
            "SIGNUP_FULL_NAME_MISSING"
          );
        }

        setIdentity({
          username:
            String(username)
              .trim()
              .toLowerCase(),

          full_name:
            String(fullName)
              .trim(),
        });

        /* =====================================================
           PROFILE FORM
        ===================================================== */

        setProfile({
          avatar_url:
            existingProfile.avatar_url ??
            metadata.avatar_url ??
            metadata.picture ??
            "",

          bio:
            existingProfile.bio ??
            "",

          role:
            normalizeRoleForFrontend(
              existingProfile.role
            ),

          career_goal:
            existingProfile.career_goal ??
            "",

          location:
            existingProfile.location ??
            "",
        });

        /* =====================================================
           SKILL CATALOG
        ===================================================== */

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
              )
              .sort(
                (a, b) =>
                  a.name.localeCompare(
                    b.name,
                    undefined,
                    {
                      sensitivity:
                        "base",
                    }
                  )
              );

          console.log(
            "PROFILE SETUP SKILLS:",
            loadedSkills
          );

          console.log(
            "TOTAL ACTIVE SKILLS:",
            loadedSkills.length
          );

          setSkills(
            loadedSkills
          );

          if (
            loadedSkills.length ===
            0
          ) {
            setSkillsLoadError(
              "No skills are available right now."
            );
          }
        }

        /* =====================================================
           USER SKILLS
        ===================================================== */

        if (
          userSkillsResult.error
        ) {
          console.error(
            "USER SKILLS LOAD ERROR:",
            userSkillsResult.error
          );
        }

        const existingUserSkills =
          userSkillsResult.error
            ? []
            : userSkillsResult.data ||
              [];

        /* =====================================================
           TEACHING SKILLS

           We keep proficiency_level and years_experience
           in frontend state only so existing components
           can continue working.

           They are NOT stored in the current database.
        ===================================================== */

        const teachingRows =
          existingUserSkills
            .filter(
              (row) =>
                row.is_teaching ===
                true
            )
            .map(
              (row) => ({
                skill_id:
                  row.skill_id,

                proficiency_level:
                  "intermediate",

                years_experience:
                  0,
              })
            );

        setTeachSkills(
          teachingRows
        );

        /* =====================================================
           LEARNING SKILLS

           user_skills tells us WHICH skills are learning.
           user_interests stores the extra text + weight.
        ===================================================== */

        if (
          interestsResult.error
        ) {
          console.error(
            "LEARNING INTERESTS LOAD ERROR:",
            interestsResult.error
          );
        }

        const existingInterests =
          interestsResult.error
            ? []
            : interestsResult.data ||
              [];

        const interestMap =
          new Map(
            existingInterests.map(
              (row) => [
                row.skill_id,
                row,
              ]
            )
          );

        const learningIds =
          new Set();

        /* From user_skills */

        existingUserSkills
          .filter(
            (row) =>
              row.is_learning ===
              true
          )
          .forEach(
            (row) => {
              learningIds.add(
                row.skill_id
              );
            }
          );

        /* Also preserve old user_interests */

        existingInterests.forEach(
          (row) => {
            learningIds.add(
              row.skill_id
            );
          }
        );

        const learningRows =
          Array.from(
            learningIds
          ).map(
            (skillId) => {
              const interest =
                interestMap.get(
                  skillId
                );

              return {
                skill_id:
                  skillId,

                interest_text:
                  interest
                    ?.interest_text ||
                  "",

                weight:
                  interest?.weight ??
                  3,
              };
            }
          );

        setLearnSkills(
          learningRows
        );

        /* =====================================================
           SETTINGS
        ===================================================== */

        if (
          settingsResult.error
        ) {
          console.error(
            "SETTINGS LOAD ERROR:",
            settingsResult.error
          );
        } else if (
          settingsResult.data
        ) {
          setSettings({
            language:
              settingsResult.data
                .language ||
              "English",

            timezone:
              settingsResult.data
                .timezone ||
              Intl.DateTimeFormat()
                .resolvedOptions()
                .timeZone ||
              "UTC",

            theme:
              settingsResult.data
                .theme ||
              "dark",
          });
        }
      } catch (err) {
        console.error(
          "PROFILE SETUP LOAD ERROR:",
          err
        );

        if (!active) {
          return;
        }

        if (
          err?.message ===
          "PROFILE_ROW_NOT_FOUND"
        ) {
          setError(
            "Your profile record could not be found. Please sign in again."
          );

          return;
        }

        if (
          err?.message ===
          "SIGNUP_USERNAME_MISSING"
        ) {
          setError(
            "Your signup username could not be found."
          );

          return;
        }

        if (
          err?.message ===
          "SIGNUP_FULL_NAME_MISSING"
        ) {
          setError(
            "Your full name could not be found."
          );

          return;
        }

        setError(
          err?.message ||
            "We couldn't load your profile right now."
        );
      } finally {
        if (active) {
          setInitialLoading(
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
     ROLE REQUIREMENTS
  ========================================================= */

  const roleRequiresTeaching =
    profile.role ===
      ROLE_MENTOR ||
    profile.role ===
      ROLE_SWAP_MASTER;

  const roleRequiresLearning =
    profile.role ===
      ROLE_LEARNER ||
    profile.role ===
      ROLE_SWAP_MASTER;

  /* =========================================================
     VALIDATE STEP
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
        ].includes(
          profile.role
        )
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
      if (
        skills.length === 0
      ) {
        setError(
          "The skill catalog isn't available right now."
        );

        return false;
      }

      setError(
        profile.role ===
          ROLE_MENTOR
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
      if (
        skills.length === 0
      ) {
        setError(
          "The skill catalog isn't available right now."
        );

        return false;
      }

      setError(
        profile.role ===
          ROLE_LEARNER
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

    setStep(
      (current) =>
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

    setStep(
      (current) =>
        Math.max(
          current - 1,
          0
        )
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================================
     AVATAR
  ========================================================= */

  const uploadAvatar =
    async () => {
      if (
        !avatarFile ||
        !user
      ) {
        return (
          profile.avatar_url ||
          null
        );
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (
        avatarFile.type &&
        !allowedTypes.includes(
          avatarFile.type
        )
      ) {
        throw new Error(
          "INVALID_AVATAR_TYPE"
        );
      }

      const MAX_SIZE =
        5 * 1024 * 1024;

      if (
        avatarFile.size >
        MAX_SIZE
      ) {
        throw new Error(
          "AVATAR_TOO_LARGE"
        );
      }

      const extension =
        avatarFile.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "jpg";

      const filePath =
        `${user.id}/profile-${Date.now()}.${extension}`;

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from(
            AVATAR_BUCKET
          )
          .upload(
            filePath,
            avatarFile,
            {
              upsert: false,

              cacheControl:
                "3600",

              contentType:
                avatarFile.type ||
                undefined,
            }
          );

      if (uploadError) {
        throw uploadError;
      }

      const { data } =
        supabase.storage
          .from(
            AVATAR_BUCKET
          )
          .getPublicUrl(
            filePath
          );

      const publicUrl =
        data?.publicUrl ||
        "";

      if (!publicUrl) {
        throw new Error(
          "AVATAR_URL_FAILED"
        );
      }

      /* MEDIA HISTORY IS OPTIONAL */

      try {
        const {
          error: mediaError,
        } =
          await supabase
            .from("media")
            .insert({
              owner_id:
                user.id,

              url:
                publicUrl,

              public_id:
                filePath,

              media_type:
                "avatar",

              created_at:
                new Date()
                  .toISOString(),
            });

        if (mediaError) {
          console.warn(
            "MEDIA HISTORY ERROR:",
            mediaError
          );
        }
      } catch (
        mediaError
      ) {
        console.warn(
          "MEDIA HISTORY SKIPPED:",
          mediaError
        );
      }

      return publicUrl;
    };

  /* =========================================================
     SAVE PROFILE
  ========================================================= */

  const saveProfile =
    async (
      avatarUrl,
      completed = false
    ) => {
      const cleanUsername =
        identity.username
          .trim()
          .toLowerCase();

      const cleanFullName =
        identity.full_name
          .trim();

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

      const candidates =
        getDatabaseRoleCandidates(
          profile.role
        );

      if (
        candidates.length ===
        0
      ) {
        throw new Error(
          "INVALID_PROFILE_ROLE"
        );
      }

      let lastRoleError =
        null;

      for (
        const databaseRole of
        candidates
      ) {
        const {
          data,
          error:
            profileError,
        } =
          await supabase
            .from("profiles")
            .update({
              username:
                cleanUsername,

              full_name:
                cleanFullName,

              avatar_url:
                avatarUrl,

              bio:
                profile.bio
                  ?.trim() ||
                null,

              role:
                databaseRole,

              career_goal:
                profile
                  .career_goal
                  ?.trim() ||
                null,

              location:
                profile.location
                  ?.trim() ||
                null,

              is_active:
                true,

              profile_completed:
                completed,

              updated_at:
                new Date()
                  .toISOString(),

              last_active:
                new Date()
                  .toISOString(),
            })
            .eq(
              "id",
              user.id
            )
            .select("id")
            .maybeSingle();

        if (!profileError) {
          if (!data?.id) {
            throw new Error(
              "PROFILE_UPDATE_NOT_ALLOWED"
            );
          }

          return;
        }

        if (
          !isRoleEnumError(
            profileError
          )
        ) {
          throw profileError;
        }

        lastRoleError =
          profileError;
      }

      throw (
        lastRoleError ||
        new Error(
          "ROLE_ENUM_SAVE_FAILED"
        )
      );
    };

  /* =========================================================
     SAVE USER SKILLS

     IMPORTANT:

     Current table:

     user_id
     skill_id
     is_learning
     is_teaching

     We build ONE row per skill.

     Example:
     React teaching only:
       is_teaching = true
       is_learning = false

     Python learning only:
       is_teaching = false
       is_learning = true

     JavaScript both:
       is_teaching = true
       is_learning = true
  ========================================================= */

  const saveUserSkills =
    async () => {
      /* =====================================================
         BUILD TEACHING IDS
      ===================================================== */

      const teachingIds =
        new Set(
          teachSkills
            .map(
              (item) =>
                item.skill_id
            )
            .filter(Boolean)
        );

      /* =====================================================
         BUILD LEARNING IDS
      ===================================================== */

      const learningIds =
        new Set(
          learnSkills
            .map(
              (item) =>
                item.skill_id
            )
            .filter(Boolean)
        );

      /* =====================================================
         UNION OF ALL SKILLS
      ===================================================== */

      const allIds =
        new Set([
          ...teachingIds,
          ...learningIds,
        ]);

      /* =====================================================
         REMOVE OLD USER SKILLS
      ===================================================== */

      const {
        error: deleteError,
      } =
        await supabase
          .from("user_skills")
          .delete()
          .eq(
            "user_id",
            user.id
          );

      if (deleteError) {
        throw deleteError;
      }

      /* Nothing selected */

      if (
        allIds.size === 0
      ) {
        return;
      }

      /* =====================================================
         CREATE NEW ROWS
      ===================================================== */

      const rows =
        Array.from(
          allIds
        ).map(
          (skillId) => ({
            user_id:
              user.id,

            skill_id:
              skillId,

            is_teaching:
              teachingIds.has(
                skillId
              ),

            is_learning:
              learningIds.has(
                skillId
              ),
          })
        );

      console.log(
        "USER SKILL ROWS:",
        rows
      );

      const {
        error: insertError,
      } =
        await supabase
          .from("user_skills")
          .insert(rows);

      if (insertError) {
        throw insertError;
      }
    };

  /* =========================================================
     SAVE LEARNING INTEREST DETAILS
  ========================================================= */

  const saveLearningInterests =
    async () => {
      const {
        error: deleteError,
      } =
        await supabase
          .from(
            "user_interests"
          )
          .delete()
          .eq(
            "user_id",
            user.id
          );

      if (deleteError) {
        throw deleteError;
      }

      if (
        learnSkills.length ===
        0
      ) {
        return;
      }

      const rows =
        learnSkills
          .filter(
            (item) =>
              item.skill_id
          )
          .map(
            (item) => ({
              user_id:
                user.id,

              skill_id:
                item.skill_id,

              interest_text:
                item
                  .interest_text
                  ?.trim() ||
                null,

              weight:
                Number(
                  item.weight
                ) || 3,
            })
          );

      const {
        error: insertError,
      } =
        await supabase
          .from(
            "user_interests"
          )
          .insert(rows);

      if (insertError) {
        throw insertError;
      }
    };

  /* =========================================================
     SAVE SETTINGS
  ========================================================= */

  const saveSettings =
    async () => {
      const {
        data:
          existingSettings,

        error:
          existingError,
      } =
        await supabase
          .from(
            "user_settings"
          )
          .select("id")
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (
        existingSettings
      ) {
        const {
          error:
            updateError,
        } =
          await supabase
            .from(
              "user_settings"
            )
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

      const {
        error:
          insertError,
      } =
        await supabase
          .from(
            "user_settings"
          )
          .insert({
            user_id:
              user.id,

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
     FINISH PROFILE
  ========================================================= */

  const handleFinish =
    async () => {
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

        console.log(
          "Starting profile setup save..."
        );

        /* =====================================================
           1. AVATAR
        ===================================================== */

        const avatarUrl =
          await uploadAvatar();

        console.log(
          "1. Avatar ready"
        );

        /* =====================================================
           2. SAVE PROFILE BUT NOT COMPLETE YET
        ===================================================== */

        await saveProfile(
          avatarUrl,
          false
        );

        console.log(
          "2. Profile saved"
        );

        /* =====================================================
           3. SAVE TEACHING + LEARNING FLAGS
        ===================================================== */

        await saveUserSkills();

        console.log(
          "3. User skills saved"
        );

        /* =====================================================
           4. SAVE LEARNING DETAILS
        ===================================================== */

        await saveLearningInterests();

        console.log(
          "4. Learning interests saved"
        );

        /* =====================================================
           5. SETTINGS
        ===================================================== */

        await saveSettings();

        console.log(
          "5. Settings saved"
        );

        /* =====================================================
           6. PROFILE COMPLETE
        ===================================================== */

        await saveProfile(
          avatarUrl,
          true
        );

        console.log(
          "6. Profile completed"
        );

        /* =====================================================
           7. DASHBOARD
        ===================================================== */

        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );
      } catch (err) {
        console.error(
          "PROFILE SETUP SAVE ERROR:",
          err
        );

        console.error(
          "PROFILE SETUP ERROR DETAILS:",
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

        /* AVATAR TYPE */

        if (
          err?.message ===
          "INVALID_AVATAR_TYPE"
        ) {
          setError(
            "Use a JPG, PNG or WebP image for your profile photo."
          );

          return;
        }

        /* AVATAR SIZE */

        if (
          err?.message ===
          "AVATAR_TOO_LARGE"
        ) {
          setError(
            "Your profile photo must be smaller than 5 MB."
          );

          return;
        }

        /* INVALID ROLE */

        if (
          err?.message ===
          "INVALID_PROFILE_ROLE"
        ) {
          setError(
            "Choose a valid SkillSwap+ role."
          );

          return;
        }

        /* PROFILE RLS */

        if (
          err?.message ===
          "PROFILE_UPDATE_NOT_ALLOWED"
        ) {
          setError(
            "Your profile could not be updated. Check the profiles RLS policy."
          );

          return;
        }

        /* ROLE ENUM */

        if (
          isRoleEnumError(err)
        ) {
          setError(
            `Profile role could not be saved: ${
              err?.message ||
              "database role mismatch"
            }`
          );

          return;
        }

        /* STORAGE */

        if (
          err?.statusCode ===
            "404" ||
          String(
            err?.message || ""
          )
            .toLowerCase()
            .includes(
              "bucket not found"
            )
        ) {
          setError(
            "The avatar storage bucket could not be found."
          );

          return;
        }

        /* DUPLICATE */

        if (
          err?.code ===
          "23505"
        ) {
          setError(
            "A duplicate database record prevented your profile from being saved."
          );

          return;
        }

        /* PERMISSION */

        if (
          String(
            err?.message || ""
          )
            .toLowerCase()
            .includes(
              "permission denied"
            )
        ) {
          setError(
            err.message
          );

          return;
        }

        /* SHOW ACTUAL DEV ERROR */

        setError(
          err?.message ||
            err?.details ||
            "We couldn't save your profile right now."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =========================================================
     LOADING
  ========================================================= */

  if (initialLoading) {
    return (
      <main className="profile-setup-page relative grid min-h-screen place-items-center overflow-hidden bg-[#060807] text-[#f2f4ef]">
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
     PAGE
  ========================================================= */

  return (
    <main className="profile-setup-page relative min-h-screen overflow-hidden bg-[#060807] text-[#f2f4ef]">
      {/* BACKGROUND */}

      <div className="noise pointer-events-none fixed inset-0 z-0" />

      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 75% 24%, rgba(199,255,57,.07), transparent 42%)",
        }}
      />

      <div className="relative z-10">
        {/* HEADER */}

        <ProfileSetupHeader />

        <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-28 md:px-8 lg:grid-cols-[0.35fr_0.65fr] lg:gap-16 lg:px-10 lg:pt-32">
          {/* PROGRESS */}

          <ProfileSetupProgress
            steps={STEPS}
            currentStep={step}
            onStepClick={(
              index
            ) => {
              if (
                index <= step &&
                !saving
              ) {
                setError("");

                setStep(index);
              }
            }}
          />

          {/* CONTENT */}

          <section className="w-full">
            {/* STEP HEADER */}

            <div className="mb-7 flex items-end justify-between gap-5 border-b border-white/10 pb-5">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#a1a1aa]">
                  <span className="mr-2 text-[#c7ff39]">
                    ●
                  </span>

                  {
                    currentStep.number
                  }{" "}
                  / 04
                </p>

                <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em] md:text-4xl">
                  {
                    currentStep.label
                  }
                </h1>
              </div>

              <span className="hidden text-right text-xs uppercase tracking-[0.16em] text-[#a1a1aa] sm:block">
                Complete your account
              </span>
            </div>

            {/* ERROR */}

            {error && (
              <div
                role="alert"
                className="mb-6 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm text-[#ff8b8b]"
              >
                {error}
              </div>
            )}

            {/* SKILL ERROR */}

            {(step === 1 ||
              step === 2) &&
              skillsLoadError && (
                <div
                  role="alert"
                  className="mb-6 border border-[#ffb84d]/30 bg-[#ffb84d]/[0.04] px-4 py-3 text-sm text-[#ffc66d]"
                >
                  {
                    skillsLoadError
                  }
                </div>
              )}

            {/* PROFILE */}

            {step === 0 && (
              <BasicProfileStep
                profile={
                  profile
                }
                setProfile={
                  setProfile
                }
                avatarFile={
                  avatarFile
                }
                setAvatarFile={
                  setAvatarFile
                }
              />
            )}

            {/* TEACH */}

            {step === 1 && (
              <TeachSkillsStep
                skills={
                  skills
                }
                selected={
                  teachSkills
                }
                setSelected={
                  setTeachSkills
                }
                skillMap={
                  skillMap
                }
                role={
                  profile.role
                }
                required={
                  roleRequiresTeaching
                }
              />
            )}

            {/* LEARN */}

            {step === 2 && (
              <LearnSkillsStep
                skills={
                  skills
                }
                selected={
                  learnSkills
                }
                setSelected={
                  setLearnSkills
                }
                skillMap={
                  skillMap
                }
                role={
                  profile.role
                }
                required={
                  roleRequiresLearning
                }
              />
            )}

            {/* PREFERENCES */}

            {step === 3 && (
              <PreferencesStep
                settings={
                  settings
                }
                setSettings={
                  setSettings
                }
              />
            )}

            {/* NAVIGATION */}

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              {/* BACK */}

              <button
                type="button"
                onClick={() => {
                  if (saving) {
                    return;
                  }

                  if (
                    step === 0
                  ) {
                    navigate(
                      "/",
                      {
                        replace:
                          true,
                      }
                    );

                    return;
                  }

                  goBack();
                }}
                disabled={
                  saving
                }
                className="min-h-12 border border-white/15 px-5 text-sm font-medium text-[#f2f4ef] transition hover:border-white/30 hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
              >
                ← Back
              </button>

              {/* CONTINUE / FINISH */}

              {step <
              STEPS.length -
                1 ? (
                <button
                  type="button"
                  onClick={
                    goNext
                  }
                  disabled={
                    saving
                  }
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
                  disabled={
                    saving
                  }
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