import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabase";

import {
  logActivity,
} from "../lib/activityLog";

import EditProfileHeader from "../components/EditProfileHeader";
import ProfileEditTab from "../components/ProfileEditTab";
import TeachingEditTab from "../components/TeachingEditTab";
import LearningEditTab from "../components/LearningEditTab";
import PreferencesEditTab from "../components/PreferencesEditTab";

/* =========================================================
   CONFIG
========================================================= */

const AVATAR_BUCKET =
  "avatars";

const TABS = [
  "profile",
  "teaching",
  "learning",
  "preferences",
];

const ROLE_LEARNER =
  "learner";

const ROLE_MENTOR =
  "mentor";

const ROLE_SWAP_MASTER =
  "swap_master";

const initialProfile = {
  username: "",
  full_name: "",
  avatar_url: "",
  bio: "",
  role: "",
  career_goal: "",
  location: "",
};

const initialPreferences = {
  language: "English",
  timezone: "Asia/Dhaka",
  theme: "dark",
};

/* =========================================================
   HELPERS
========================================================= */

function getTabFromSearch(
  search
) {
  const params =
    new URLSearchParams(
      search
    );

  const tab =
    params.get("tab");

  return TABS.includes(
    tab
  )
    ? tab
    : "profile";
}

/* =========================================================
   ROLE NORMALIZER
========================================================= */

function normalizeRoleForFrontend(
  value
) {
  const role =
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(
        /[\s-]+/g,
        "_"
      );

  if (
    role === "learner"
  ) {
    return ROLE_LEARNER;
  }

  if (
    role === "mentor"
  ) {
    return ROLE_MENTOR;
  }

  if (
    role ===
      "swap_master" ||
    role ===
      "swapmaster"
  ) {
    return ROLE_SWAP_MASTER;
  }

  return "";
}

function getDatabaseRoleCandidates(
  role
) {
  if (
    role ===
    ROLE_LEARNER
  ) {
    return [
      "Learner",
      "learner",
    ];
  }

  if (
    role ===
    ROLE_MENTOR
  ) {
    return [
      "Mentor",
      "mentor",
    ];
  }

  if (
    role ===
    ROLE_SWAP_MASTER
  ) {
    return [
      "Swap Master",
      "Swap_Master",
      "swap_master",
      "Swap master",
    ];
  }

  return [];
}

function isRoleEnumError(
  error
) {
  const message =
    String(
      error?.message ||
        ""
    ).toLowerCase();

  return (
    message.includes(
      "invalid input value for enum"
    ) ||
    message.includes(
      "user_role"
    )
  );
}

/* =========================================================
   VALUE HELPERS
========================================================= */

function normalizeText(
  value
) {
  return String(
    value || ""
  ).trim();
}

function normalizeUsername(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
}

function setsEqual(
  setA,
  setB
) {
  if (
    setA.size !==
    setB.size
  ) {
    return false;
  }

  for (
    const value of setA
  ) {
    if (
      !setB.has(value)
    ) {
      return false;
    }
  }

  return true;
}

/* =========================================================
   EDIT PROFILE
========================================================= */

export default function EditProfile() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  /* =========================================================
     STATE
  ========================================================= */

  const [
    activeTab,
    setActiveTab,
  ] = useState(() =>
    getTabFromSearch(
      location.search
    )
  );

  const [
    user,
    setUser,
  ] = useState(null);

  const [
    profile,
    setProfile,
  ] = useState(
    initialProfile
  );

  const [
    preferences,
    setPreferences,
  ] = useState(
    initialPreferences
  );

  const [
    skills,
    setSkills,
  ] = useState([]);

  const [
    teachingSkills,
    setTeachingSkills,
  ] = useState([]);

  const [
    learningSkills,
    setLearningSkills,
  ] = useState([]);

  const [
    avatarFile,
    setAvatarFile,
  ] = useState(null);

  const [
    settingsExists,
    setSettingsExists,
  ] = useState(false);

  const [
    previousAvatars,
    setPreviousAvatars,
  ] = useState([]);

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
  ] = useState("");

  const successRef =
    useRef(null);

  /* =========================================================
     ORIGINAL DATA FOR ACTIVITY COMPARISON
  ========================================================= */

  const originalProfileRef =
    useRef(null);

  const originalPreferencesRef =
    useRef(null);

  const originalTeachingIdsRef =
    useRef(
      new Set()
    );

  const originalLearningIdsRef =
    useRef(
      new Set()
    );

  /* =========================================================
     TAB FROM URL
  ========================================================= */

  useEffect(() => {
    const nextTab =
      getTabFromSearch(
        location.search
      );

    setActiveTab(
      nextTab
    );
  }, [
    location.search,
  ]);

  /* =========================================================
     SUCCESS MESSAGE SCROLL
  ========================================================= */

  useEffect(() => {
    if (!success) {
      return;
    }

    successRef.current
      ?.scrollIntoView({
        behavior:
          "smooth",

        block:
          "start",
      });
  }, [success]);

  /* =========================================================
     AUTO HIDE SUCCESS
  ========================================================= */

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setSuccess("");
        },
        5000
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [success]);

  /* =========================================================
     LOAD PREVIOUS AVATARS

     CURRENT MEDIA SCHEMA:
     id
     file_name
     file_type
     size_bytes
     uploaded_by
     url
     created_at
  ========================================================= */

  const loadPreviousAvatars =
    async (
      userId
    ) => {
      try {
        const {
          data,
          error:
            mediaError,
        } =
          await supabase
            .from(
              "media"
            )
            .select(
              `
                id,
                file_name,
                file_type,
                size_bytes,
                uploaded_by,
                url,
                created_at
              `
            )
            .eq(
              "uploaded_by",
              userId
            )
            .like(
              "file_name",
              "avatar-%"
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            );

        if (
          mediaError
        ) {
          console.warn(
            "Previous avatar load error:",
            mediaError
          );

          setPreviousAvatars(
            []
          );

          return;
        }

        setPreviousAvatars(
          data || []
        );
      } catch (
        err
      ) {
        console.warn(
          "Previous avatar load exception:",
          err
        );

        setPreviousAvatars(
          []
        );
      }
    };

  /* =========================================================
     LOAD PROFILE
  ========================================================= */

  useEffect(() => {
    let active =
      true;

    const load =
      async () => {
        try {
          setLoading(
            true
          );

          setError("");

          /* ===================================================
             AUTH
          =================================================== */

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

          if (
            authError
          ) {
            throw authError;
          }

          if (
            !authUser
          ) {
            navigate(
              "/login",
              {
                replace:
                  true,
              }
            );

            return;
          }

          if (
            !active
          ) {
            return;
          }

          setUser(
            authUser
          );

          await loadPreviousAvatars(
            authUser.id
          );

          /* ===================================================
             LOAD DATABASE DATA
          =================================================== */

          const [
            profileResult,
            skillsResult,
            userSkillsResult,
            learningResult,
            settingsResult,
          ] =
            await Promise.all(
              [
                /* PROFILE */

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
                      career_goal,
                      location,
                      profile_completed,
                      is_active
                    `
                  )
                  .eq(
                    "id",
                    authUser.id
                  )
                  .maybeSingle(),

                /* SKILLS */

                supabase
                  .from(
                    "skills"
                  )
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
                      ascending:
                        true,
                    }
                  ),

                /* USER SKILLS */

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

                /* LEARNING INTERESTS */

                supabase
                  .from(
                    "user_interests"
                  )
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
                  .from(
                    "user_settings"
                  )
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
              ]
            );

          if (
            !active
          ) {
            return;
          }

          /* ===================================================
             PROFILE
          =================================================== */

          if (
            profileResult.error
          ) {
            throw (
              profileResult.error
            );
          }

          if (
            !profileResult.data
          ) {
            navigate(
              "/profile-setup",
              {
                replace:
                  true,
              }
            );

            return;
          }

          if (
            profileResult.data
              .profile_completed !==
            true
          ) {
            navigate(
              "/profile-setup",
              {
                replace:
                  true,
              }
            );

            return;
          }

          const loadedProfile =
            {
              username:
                profileResult.data
                  .username ||
                "",

              full_name:
                profileResult.data
                  .full_name ||
                "",

              avatar_url:
                profileResult.data
                  .avatar_url ||
                "",

              bio:
                profileResult.data
                  .bio ||
                "",

              role:
                normalizeRoleForFrontend(
                  profileResult.data
                    .role
                ),

              career_goal:
                profileResult.data
                  .career_goal ||
                "",

              location:
                profileResult.data
                  .location ||
                "",
            };

          setProfile(
            loadedProfile
          );

          originalProfileRef.current =
            {
              ...loadedProfile,
            };

          /* ===================================================
             SKILLS
          =================================================== */

          if (
            skillsResult.error
          ) {
            console.error(
              "EDIT PROFILE SKILLS ERROR:",
              skillsResult.error
            );

            setSkills(
              []
            );
          } else {
            const loadedSkills =
              (
                skillsResult.data ||
                []
              )
                .filter(
                  (
                    skill
                  ) =>
                    skill?.id &&
                    skill?.name
                )
                .map(
                  (
                    skill
                  ) => ({
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
             USER SKILLS
          =================================================== */

          if (
            userSkillsResult.error
          ) {
            console.error(
              "EDIT PROFILE USER SKILLS ERROR:",
              userSkillsResult.error
            );
          }

          const userSkillRows =
            userSkillsResult.error
              ? []
              : userSkillsResult.data ||
                [];

          /* ===================================================
             TEACHING
          =================================================== */

          const teaching =
            userSkillRows
              .filter(
                (
                  row
                ) =>
                  row.is_teaching ===
                  true
              )
              .map(
                (
                  row
                ) => ({
                  skill_id:
                    row.skill_id,

                  proficiency_level:
                    "intermediate",

                  years_experience:
                    0,

                  is_verified:
                    false,
                })
              );

          setTeachingSkills(
            teaching
          );

          originalTeachingIdsRef.current =
            new Set(
              teaching.map(
                (
                  item
                ) =>
                  item.skill_id
              )
            );

          /* ===================================================
             LEARNING
          =================================================== */

          if (
            learningResult.error
          ) {
            console.error(
              "EDIT PROFILE LEARNING ERROR:",
              learningResult.error
            );
          }

          const interestRows =
            learningResult.error
              ? []
              : learningResult.data ||
                [];

          const interestMap =
            new Map(
              interestRows.map(
                (
                  item
                ) => [
                  item.skill_id,
                  item,
                ]
              )
            );

          const learningIds =
            new Set();

          userSkillRows
            .filter(
              (
                row
              ) =>
                row.is_learning ===
                true
            )
            .forEach(
              (
                row
              ) => {
                learningIds.add(
                  row.skill_id
                );
              }
            );

          interestRows.forEach(
            (
              row
            ) => {
              if (
                row.skill_id
              ) {
                learningIds.add(
                  row.skill_id
                );
              }
            }
          );

          const loadedLearning =
            Array.from(
              learningIds
            ).map(
              (
                skillId
              ) => {
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
                    interest
                      ?.weight ??
                    3,
                };
              }
            );

          setLearningSkills(
            loadedLearning
          );

          originalLearningIdsRef.current =
            new Set(
              loadedLearning.map(
                (
                  item
                ) =>
                  item.skill_id
              )
            );

          /* ===================================================
             SETTINGS
          =================================================== */

          if (
            settingsResult.error
          ) {
            console.error(
              "EDIT PROFILE SETTINGS ERROR:",
              settingsResult.error
            );

            originalPreferencesRef.current =
              {
                ...initialPreferences,
              };
          } else if (
            settingsResult.data
          ) {
            setSettingsExists(
              true
            );

            const loadedPreferences =
              {
                language:
                  settingsResult.data
                    .language ||
                  "English",

                timezone:
                  settingsResult.data
                    .timezone ||
                  "Asia/Dhaka",

                theme:
                  settingsResult.data
                    .theme ||
                  "dark",
              };

            setPreferences(
              loadedPreferences
            );

            originalPreferencesRef.current =
              {
                ...loadedPreferences,
              };
          } else {
            originalPreferencesRef.current =
              {
                ...initialPreferences,
              };
          }
        } catch (
          err
        ) {
          console.error(
            "EDIT PROFILE LOAD ERROR:",
            err
          );

          if (
            active
          ) {
            setError(
              err?.message ||
                "We couldn't load your profile right now."
            );
          }
        } finally {
          if (
            active
          ) {
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
  }, [navigate]);

  /* =========================================================
     SKILL MAP
  ========================================================= */

  const skillMap =
    useMemo(() => {
      return new Map(
        skills.map(
          (
            skill
          ) => [
            skill.id,
            skill,
          ]
        )
      );
    }, [skills]);

  /* =========================================================
     CHANGE TAB
  ========================================================= */

  const setTab =
    (tab) => {
      if (
        !TABS.includes(
          tab
        )
      ) {
        return;
      }

      setActiveTab(
        tab
      );

      navigate(
        `/profile/edit?tab=${tab}`,
        {
          replace:
            true,
        }
      );

      setError("");

      setSuccess("");
    };

  /* =========================================================
     VALIDATE
  ========================================================= */

  const validate =
    () => {
      const cleanUsername =
        normalizeUsername(
          profile.username
        );

      if (
        !/^[a-z0-9._]{3,20}$/.test(
          cleanUsername
        )
      ) {
        setTab(
          "profile"
        );

        return "Username must be 3–20 characters and use lowercase letters, numbers, dots or underscores.";
      }

      if (
        !normalizeText(
          profile.full_name
        )
      ) {
        setTab(
          "profile"
        );

        return "Full name is required.";
      }

      if (
        ![
          ROLE_LEARNER,
          ROLE_MENTOR,
          ROLE_SWAP_MASTER,
        ].includes(
          profile.role
        )
      ) {
        setTab(
          "profile"
        );

        return "Please select your role.";
      }

      const needsTeaching =
        profile.role ===
          ROLE_MENTOR ||
        profile.role ===
          ROLE_SWAP_MASTER;

      const needsLearning =
        profile.role ===
          ROLE_LEARNER ||
        profile.role ===
          ROLE_SWAP_MASTER;

      if (
        needsTeaching &&
        teachingSkills.length ===
          0
      ) {
        setTab(
          "teaching"
        );

        return "Your current role requires at least one teaching skill.";
      }

      if (
        needsLearning &&
        learningSkills.length ===
          0
      ) {
        setTab(
          "learning"
        );

        return "Your current role requires at least one learning skill.";
      }

      return "";
    };

  /* =========================================================
     AVATAR VALIDATION
  ========================================================= */

  const validateAvatar =
    (file) => {
      if (
        !file
      ) {
        return;
      }

      const allowedTypes =
        [
          "image/jpeg",
          "image/png",
          "image/webp",
        ];

      if (
        !allowedTypes.includes(
          file.type
        )
      ) {
        throw new Error(
          "Please upload a JPG, PNG or WebP image."
        );
      }

      const maxSize =
        5 *
        1024 *
        1024;

      if (
        file.size >
        maxSize
      ) {
        throw new Error(
          "Profile image must be smaller than 5 MB."
        );
      }
    };

  /* =========================================================
     UPLOAD AVATAR
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

      validateAvatar(
        avatarFile
      );

      const extension =
        avatarFile.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "jpg";

      const timestamp =
        Date.now();

      const storageFileName =
        `profile-${timestamp}.${extension}`;

      const filePath =
        `${user.id}/${storageFileName}`;

      const {
        error:
          uploadError,
      } =
        await supabase.storage
          .from(
            AVATAR_BUCKET
          )
          .upload(
            filePath,
            avatarFile,
            {
              upsert:
                false,

              contentType:
                avatarFile.type ||
                undefined,

              cacheControl:
                "3600",
            }
          );

      if (
        uploadError
      ) {
        console.error(
          "AVATAR UPLOAD ERROR:",
          uploadError
        );

        throw uploadError;
      }

      const {
        data:
          publicData,
      } =
        supabase.storage
          .from(
            AVATAR_BUCKET
          )
          .getPublicUrl(
            filePath
          );

      const publicUrl =
        publicData
          ?.publicUrl;

      if (
        !publicUrl
      ) {
        throw new Error(
          "Avatar uploaded, but the public URL could not be generated."
        );
      }

      /* =====================================================
         MEDIA HISTORY

         CURRENT SCHEMA:
         file_name
         size_bytes
         uploaded_by
         url

         file_type is omitted so the DB default is used.
      ===================================================== */

      try {
        const {
          error:
            mediaError,
        } =
          await supabase
            .from(
              "media"
            )
            .insert({
              file_name:
                `avatar-${storageFileName}`,

              size_bytes:
                avatarFile.size ||
                0,

              uploaded_by:
                user.id,

              url:
                publicUrl,

              created_at:
                new Date()
                  .toISOString(),
            });

        if (
          mediaError
        ) {
          console.warn(
            "AVATAR MEDIA HISTORY ERROR:",
            mediaError
          );
        }
      } catch (
        mediaException
      ) {
        console.warn(
          "AVATAR MEDIA HISTORY EXCEPTION:",
          mediaException
        );
      }

      return publicUrl;
    };

  /* =========================================================
     UPDATE PROFILE
  ========================================================= */

  const updateProfile =
    async (
      avatarUrl
    ) => {
      const cleanUsername =
        normalizeUsername(
          profile.username
        );

      const cleanFullName =
        normalizeText(
          profile.full_name
        );

      const roleCandidates =
        getDatabaseRoleCandidates(
          profile.role
        );

      if (
        roleCandidates.length ===
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
        roleCandidates
      ) {
        const {
          data,
          error:
            profileError,
        } =
          await supabase
            .from(
              "profiles"
            )
            .update({
              username:
                cleanUsername,

              full_name:
                cleanFullName,

              avatar_url:
                avatarUrl ||
                null,

              bio:
                normalizeText(
                  profile.bio
                ) ||
                null,

              role:
                databaseRole,

              career_goal:
                normalizeText(
                  profile.career_goal
                ) ||
                null,

              location:
                normalizeText(
                  profile.location
                ) ||
                null,

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
            .select(
              "id"
            )
            .maybeSingle();

        if (
          !profileError
        ) {
          if (
            !data?.id
          ) {
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
          "ROLE_SAVE_FAILED"
        )
      );
    };

  /* =========================================================
     SAVE USER SKILLS
  ========================================================= */

  const saveUserSkills =
    async () => {
      const teachingIds =
        new Set(
          teachingSkills
            .map(
              (
                item
              ) =>
                item.skill_id
            )
            .filter(
              Boolean
            )
        );

      const learningIds =
        new Set(
          learningSkills
            .map(
              (
                item
              ) =>
                item.skill_id
            )
            .filter(
              Boolean
            )
        );

      const allIds =
        new Set([
          ...teachingIds,
          ...learningIds,
        ]);

      const {
        error:
          deleteError,
      } =
        await supabase
          .from(
            "user_skills"
          )
          .delete()
          .eq(
            "user_id",
            user.id
          );

      if (
        deleteError
      ) {
        throw deleteError;
      }

      if (
        allIds.size ===
        0
      ) {
        return;
      }

      const rows =
        Array.from(
          allIds
        ).map(
          (
            skillId
          ) => ({
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

      const {
        error:
          insertError,
      } =
        await supabase
          .from(
            "user_skills"
          )
          .insert(
            rows
          );

      if (
        insertError
      ) {
        throw insertError;
      }
    };

  /* =========================================================
     SAVE LEARNING INTERESTS
  ========================================================= */

  const saveLearningInterests =
    async () => {
      const {
        error:
          deleteError,
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

      if (
        deleteError
      ) {
        throw deleteError;
      }

      if (
        learningSkills.length ===
        0
      ) {
        return;
      }

      const rows =
        learningSkills
          .filter(
            (
              item
            ) =>
              item.skill_id
          )
          .map(
            (
              item
            ) => ({
              user_id:
                user.id,

              skill_id:
                item.skill_id,

              interest_text:
                normalizeText(
                  item.interest_text
                ) ||
                null,

              weight:
                Number(
                  item.weight
                ) ||
                3,
            })
          );

      const {
        error:
          insertError,
      } =
        await supabase
          .from(
            "user_interests"
          )
          .insert(
            rows
          );

      if (
        insertError
      ) {
        throw insertError;
      }
    };

  /* =========================================================
     SAVE SETTINGS
  ========================================================= */

  const saveSettings =
    async () => {
      if (
        settingsExists
      ) {
        const {
          error:
            settingsError,
        } =
          await supabase
            .from(
              "user_settings"
            )
            .update({
              language:
                preferences.language,

              timezone:
                preferences.timezone,

              theme:
                preferences.theme,
            })
            .eq(
              "user_id",
              user.id
            );

        if (
          settingsError
        ) {
          throw settingsError;
        }

        return;
      }

      const {
        error:
          settingsError,
      } =
        await supabase
          .from(
            "user_settings"
          )
          .insert({
            user_id:
              user.id,

            language:
              preferences.language,

            timezone:
              preferences.timezone,

            theme:
              preferences.theme,
          });

      if (
        settingsError
      ) {
        throw settingsError;
      }

      setSettingsExists(
        true
      );
    };

  /* =========================================================
     ACTIVITY LOGGING

     Runs only AFTER all important save operations succeed.
  ========================================================= */

  const logProfileActivities =
    async (
      avatarUrl
    ) => {
      const logs =
        [];

      const originalProfile =
        originalProfileRef.current ||
        initialProfile;

      const originalPreferences =
        originalPreferencesRef.current ||
        initialPreferences;

      /* =====================================================
         CURRENT VALUES
      ===================================================== */

      const currentProfile =
        {
          username:
            normalizeUsername(
              profile.username
            ),

          full_name:
            normalizeText(
              profile.full_name
            ),

          avatar_url:
            avatarUrl ||
            "",

          bio:
            normalizeText(
              profile.bio
            ),

          role:
            profile.role,

          career_goal:
            normalizeText(
              profile.career_goal
            ),

          location:
            normalizeText(
              profile.location
            ),
        };

      /* =====================================================
         PROFILE FIELD CHANGES

         Avatar is logged separately.
      ===================================================== */

      const profileFields = [
        "username",
        "full_name",
        "bio",
        "role",
        "career_goal",
        "location",
      ];

      const changedProfileFields =
        profileFields.filter(
          (
            field
          ) => {
            const oldValue =
              normalizeText(
                originalProfile[
                  field
                ]
              );

            const newValue =
              normalizeText(
                currentProfile[
                  field
                ]
              );

            return (
              oldValue !==
              newValue
            );
          }
        );

      if (
        changedProfileFields.length >
        0
      ) {
        logs.push(
          logActivity(
            "profile_updated",
            {
              entityType:
                "profile",

              entityId:
                user.id,

              metadata: {
                changed_fields:
                  changedProfileFields,
              },
            }
          )
        );
      }

      /* =====================================================
         AVATAR CHANGE
      ===================================================== */

      const oldAvatar =
        originalProfile.avatar_url ||
        "";

      const newAvatar =
        avatarUrl ||
        "";

      if (
        oldAvatar !==
        newAvatar
      ) {
        logs.push(
          logActivity(
            "avatar_updated",
            {
              entityType:
                "profile",

              entityId:
                user.id,
            }
          )
        );
      }

      /* =====================================================
         TEACHING SKILL CHANGES
      ===================================================== */

      const oldTeachingIds =
        originalTeachingIdsRef.current ||
        new Set();

      const newTeachingIds =
        new Set(
          teachingSkills
            .map(
              (
                item
              ) =>
                item.skill_id
            )
            .filter(
              Boolean
            )
        );

      const teachingAdded =
        [
          ...newTeachingIds,
        ].filter(
          (
            id
          ) =>
            !oldTeachingIds.has(
              id
            )
        );

      const teachingRemoved =
        [
          ...oldTeachingIds,
        ].filter(
          (
            id
          ) =>
            !newTeachingIds.has(
              id
            )
        );

      for (
        const skillId of
        teachingAdded
      ) {
        const skill =
          skillMap.get(
            skillId
          );

        logs.push(
          logActivity(
            "teaching_skill_added",
            {
              entityType:
                "skill",

              entityId:
                skillId,

              metadata: {
                skill_name:
                  skill?.name ||
                  "Skill",
              },
            }
          )
        );
      }

      for (
        const skillId of
        teachingRemoved
      ) {
        const skill =
          skillMap.get(
            skillId
          );

        logs.push(
          logActivity(
            "teaching_skill_removed",
            {
              entityType:
                "skill",

              entityId:
                skillId,

              metadata: {
                skill_name:
                  skill?.name ||
                  "Skill",
              },
            }
          )
        );
      }

      /* =====================================================
         LEARNING SKILL CHANGES
      ===================================================== */

      const oldLearningIds =
        originalLearningIdsRef.current ||
        new Set();

      const newLearningIds =
        new Set(
          learningSkills
            .map(
              (
                item
              ) =>
                item.skill_id
            )
            .filter(
              Boolean
            )
        );

      const learningAdded =
        [
          ...newLearningIds,
        ].filter(
          (
            id
          ) =>
            !oldLearningIds.has(
              id
            )
        );

      const learningRemoved =
        [
          ...oldLearningIds,
        ].filter(
          (
            id
          ) =>
            !newLearningIds.has(
              id
            )
        );

      for (
        const skillId of
        learningAdded
      ) {
        const skill =
          skillMap.get(
            skillId
          );

        logs.push(
          logActivity(
            "learning_skill_added",
            {
              entityType:
                "skill",

              entityId:
                skillId,

              metadata: {
                skill_name:
                  skill?.name ||
                  "Skill",
              },
            }
          )
        );
      }

      for (
        const skillId of
        learningRemoved
      ) {
        const skill =
          skillMap.get(
            skillId
          );

        logs.push(
          logActivity(
            "learning_skill_removed",
            {
              entityType:
                "skill",

              entityId:
                skillId,

              metadata: {
                skill_name:
                  skill?.name ||
                  "Skill",
              },
            }
          )
        );
      }

      /* =====================================================
         PREFERENCE CHANGES
      ===================================================== */

      const preferenceFields =
        [
          "language",
          "timezone",
          "theme",
        ];

      const changedPreferenceFields =
        preferenceFields.filter(
          (
            field
          ) =>
            String(
              originalPreferences[
                field
              ] ||
                ""
            ) !==
            String(
              preferences[
                field
              ] ||
                ""
            )
        );

      if (
        changedPreferenceFields.length >
        0
      ) {
        logs.push(
          logActivity(
            "preferences_updated",
            {
              entityType:
                "user_settings",

              metadata: {
                changed_fields:
                  changedPreferenceFields,
              },
            }
          )
        );
      }

      /* =====================================================
         ACTIVITY LOGGING IS NON-CRITICAL

         logActivity already handles its own failures.
      ===================================================== */

      if (
        logs.length >
        0
      ) {
        await Promise.all(
          logs
        );
      }

      /* =====================================================
         UPDATE ORIGINAL SNAPSHOTS

         Prevent duplicate history when Save is clicked again.
      ===================================================== */

      originalProfileRef.current =
        {
          ...currentProfile,
        };

      originalPreferencesRef.current =
        {
          ...preferences,
        };

      originalTeachingIdsRef.current =
        new Set(
          newTeachingIds
        );

      originalLearningIdsRef.current =
        new Set(
          newLearningIds
        );
    };

  /* =========================================================
     SAVE EVERYTHING
  ========================================================= */

  const saveProfile =
    async () => {
      if (
        !user ||
        saving
      ) {
        return;
      }

      const validationError =
        validate();

      if (
        validationError
      ) {
        setError(
          validationError
        );

        setSuccess("");

        return;
      }

      try {
        setSaving(
          true
        );

        setError("");

        setSuccess("");

        const cleanUsername =
          normalizeUsername(
            profile.username
          );

        /* =====================================================
           USERNAME CHECK
        ===================================================== */

        const {
          data:
            existingUsername,

          error:
            usernameCheckError,
        } =
          await supabase
            .from(
              "profiles"
            )
            .select(
              "id"
            )
            .eq(
              "username",
              cleanUsername
            )
            .neq(
              "id",
              user.id
            )
            .maybeSingle();

        if (
          usernameCheckError
        ) {
          throw usernameCheckError;
        }

        if (
          existingUsername
        ) {
          setTab(
            "profile"
          );

          setError(
            "That username is already in use. Choose another one."
          );

          return;
        }

        /* =====================================================
           1. AVATAR
        ===================================================== */

        const avatarUrl =
          await uploadAvatar();

        console.log(
          "1. Avatar ready"
        );

        /* =====================================================
           2. PROFILE
        ===================================================== */

        await updateProfile(
          avatarUrl
        );

        console.log(
          "2. Profile saved"
        );

        /* =====================================================
           3. USER SKILLS
        ===================================================== */

        await saveUserSkills();

        console.log(
          "3. User skills saved"
        );

        /* =====================================================
           4. LEARNING INTERESTS
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
           6. ACTIVITY HISTORY

           Runs AFTER actual data has saved successfully.
        ===================================================== */

        await logProfileActivities(
          avatarUrl
        );

        console.log(
          "6. Activity history recorded"
        );

        /* =====================================================
           LOCAL STATE
        ===================================================== */

        setProfile(
          (
            current
          ) => ({
            ...current,

            avatar_url:
              avatarUrl ||
              "",

            username:
              cleanUsername,

            full_name:
              normalizeText(
                current.full_name
              ),
          })
        );

        setAvatarFile(
          null
        );

        setSuccess(
          "Your profile changes have been saved."
        );

        /* =====================================================
           REFRESH AVATAR HISTORY
        ===================================================== */

        await loadPreviousAvatars(
          user.id
        );
      } catch (
        err
      ) {
        console.error(
          "EDIT PROFILE SAVE ERROR:",
          err
        );

        console.error(
          "EDIT PROFILE SAVE DETAILS:",
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

        /* DUPLICATE USERNAME */

        if (
          err?.code ===
          "23505"
        ) {
          setError(
            "That username is already in use. Choose another one."
          );

          return;
        }

        /* INVALID ROLE */

        if (
          err?.message ===
          "INVALID_PROFILE_ROLE"
        ) {
          setError(
            "Please select a valid role."
          );

          return;
        }

        /* ROLE ENUM */

        if (
          isRoleEnumError(
            err
          )
        ) {
          setError(
            err?.message ||
              "Your selected role could not be saved."
          );

          return;
        }

        /* PROFILE UPDATE */

        if (
          err?.message ===
          "PROFILE_UPDATE_NOT_ALLOWED"
        ) {
          setError(
            "Your profile could not be updated. Check your profile permissions."
          );

          return;
        }

        /* STORAGE */

        const message =
          String(
            err?.message ||
              ""
          ).toLowerCase();

        if (
          message.includes(
            "bucket"
          )
        ) {
          setError(
            "Avatar storage is not configured correctly. Make sure the Supabase bucket is named avatars."
          );

          return;
        }

        /* PERMISSION / RLS */

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
              "Your account does not currently have permission to perform that update."
          );

          return;
        }

        /* AVATAR VALIDATION */

        if (
          err?.message
            ?.includes(
              "5 MB"
            ) ||
          err?.message
            ?.includes(
              "JPG"
            )
        ) {
          setError(
            err.message
          );

          return;
        }

        setError(
          err?.message ||
            err?.details ||
            "We couldn't save your changes right now."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* =========================================================
     LOADING
  ========================================================= */

  if (
    loading
  ) {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#060807] text-[#f2f4ef]">
        <div className="noise pointer-events-none fixed inset-0" />

        <div className="relative z-10 text-center">
          <div className="mx-auto mb-5 h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-[#c7ff39]" />

          <p className="text-xs uppercase tracking-[0.18em] text-[#a1a1aa]">
            Loading profile
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
            "radial-gradient(ellipse at 85% 0%, rgba(199,255,57,.055), transparent 34%)",
        }}
      />

      <div className="relative z-10">
        {/* HEADER */}

        <EditProfileHeader
          profile={
            profile
          }
          activeTab={
            activeTab
          }
          setTab={
            setTab
          }
          onBack={() =>
            navigate(
              "/dashboard"
            )
          }
          onSave={
            saveProfile
          }
          saving={
            saving
          }
        />

        <div className="mx-auto max-w-[1180px] px-5 pb-16 pt-28 md:px-8 lg:px-10 lg:pt-32">
          {/* PAGE HEADING */}

          <div className="mb-8 max-w-3xl">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#c7ff39]">
              Account settings
            </p>

            <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em] md:text-5xl">
              Edit your profile.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#a1a1aa]">
              Update your public profile,
              teaching skills, learning
              interests and preferences
              without restarting onboarding.
            </p>
          </div>

          {/* ERROR */}

          {error && (
            <div
              role="alert"
              className="mb-5 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm text-[#ff8b8b]"
            >
              {error}
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div
              ref={
                successRef
              }
              role="status"
              className="mb-5 border border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] px-4 py-3 text-sm text-[#c7ff39]"
            >
              {success}
            </div>
          )}

          {/* EDIT CONTENT */}

          <section className="border border-white/10 bg-[#0a0d0b]/70">
            {/* PROFILE */}

            {activeTab ===
              "profile" && (
              <ProfileEditTab
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
                previousAvatars={
                  previousAvatars
                }
                setProfileAvatar={(
                  url
                ) =>
                  setProfile(
                    (
                      current
                    ) => ({
                      ...current,

                      avatar_url:
                        url,
                    })
                  )
                }
              />
            )}

            {/* TEACHING */}

            {activeTab ===
              "teaching" && (
              <TeachingEditTab
                skills={
                  skills
                }
                selected={
                  teachingSkills
                }
                setSelected={
                  setTeachingSkills
                }
                skillMap={
                  skillMap
                }
                required={
                  profile.role ===
                    ROLE_MENTOR ||
                  profile.role ===
                    ROLE_SWAP_MASTER
                }
              />
            )}

            {/* LEARNING */}

            {activeTab ===
              "learning" && (
              <LearningEditTab
                skills={
                  skills
                }
                selected={
                  learningSkills
                }
                setSelected={
                  setLearningSkills
                }
                skillMap={
                  skillMap
                }
                required={
                  profile.role ===
                    ROLE_LEARNER ||
                  profile.role ===
                    ROLE_SWAP_MASTER
                }
              />
            )}

            {/* PREFERENCES */}

            {activeTab ===
              "preferences" && (
              <PreferencesEditTab
                preferences={
                  preferences
                }
                setPreferences={
                  setPreferences
                }
              />
            )}
          </section>

          {/* BOTTOM BUTTONS */}

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
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
              className="min-h-11 border border-white/10 px-5 text-sm text-[#a1a1aa] transition hover:border-white/25 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={
                saveProfile
              }
              disabled={
                saving
              }
              className="min-h-11 bg-[#c7ff39] px-6 text-sm font-semibold text-[#071008] transition hover:bg-[#d4ff66] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}