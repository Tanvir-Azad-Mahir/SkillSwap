import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

import EditProfileHeader from "../components/EditProfileHeader";
import ProfileEditTab from "../components/ProfileEditTab";
import TeachingEditTab from "../components/TeachingEditTab";
import LearningEditTab from "../components/LearningEditTab";
import PreferencesEditTab from "../components/PreferencesEditTab";

const AVATAR_BUCKET = "avatars";
const TEACH_TYPE = "offering";

const TABS = [
  "profile",
  "teaching",
  "learning",
  "preferences",
];

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

function getTabFromSearch(search) {
  const params = new URLSearchParams(search);
  const tab = params.get("tab");

  return TABS.includes(tab) ? tab : "profile";
}

export default function EditProfile() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(() =>
    getTabFromSearch(location.search)
  );

  const [user, setUser] = useState(null);

  const [profile, setProfile] = useState(initialProfile);

  const [preferences, setPreferences] =
    useState(initialPreferences);

  const [skills, setSkills] = useState([]);

  const [teachingSkills, setTeachingSkills] =
    useState([]);

  const [learningSkills, setLearningSkills] =
    useState([]);

  const [avatarFile, setAvatarFile] = useState(null);

  const [settingsExists, setSettingsExists] =
    useState(false);

  const [previousAvatars, setPreviousAvatars] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const successRef = useRef(null);

  /* -------------------------------------------------------
     TAB FROM URL
  ------------------------------------------------------- */

  useEffect(() => {
    const nextTab = getTabFromSearch(location.search);

    setActiveTab(nextTab);
  }, [location.search]);

  /* -------------------------------------------------------
     SUCCESS MESSAGE SCROLL
  ------------------------------------------------------- */

  useEffect(() => {
    if (!success) return;

    successRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [success]);

  /* -------------------------------------------------------
     AUTO HIDE SUCCESS
  ------------------------------------------------------- */

  useEffect(() => {
    if (!success) return;

    const timer = window.setTimeout(() => {
      setSuccess("");
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [success]);

  /* -------------------------------------------------------
     LOAD PREVIOUS AVATARS
  ------------------------------------------------------- */

  const loadPreviousAvatars = async (userId) => {
    try {
      const { data, error: mediaError } =
        await supabase
          .from("media")
          .select(
            "id, url, public_id, media_type, created_at"
          )
          .eq("owner_id", userId)
          .eq("media_type", "avatar")
          .order("created_at", {
            ascending: false,
          });

      if (mediaError) {
        console.error(
          "Previous avatar load error:",
          mediaError
        );

        // Media history is optional.
        // Do not break Edit Profile.
        setPreviousAvatars([]);

        return;
      }

      setPreviousAvatars(data || []);
    } catch (err) {
      console.error(
        "Previous avatar load exception:",
        err
      );

      setPreviousAvatars([]);
    }
  };

  /* -------------------------------------------------------
     LOAD PROFILE
  ------------------------------------------------------- */

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!authUser) {
          navigate("/login", {
            replace: true,
          });

          return;
        }

        if (!active) return;

        setUser(authUser);

        // Previous avatar history is optional.
        await loadPreviousAvatars(authUser.id);

        const [
          profileResult,
          skillsResult,
          teachingResult,
          learningResult,
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
                profile_completed
              `
            )
            .eq("id", authUser.id)
            .maybeSingle(),

          /* ACTIVE SKILLS */

          supabase
            .from("skills")
            .select(
              `
                id,
                name,
                description,
                difficulty_level
              `
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
                proficiency_level,
                years_experience,
                is_verified
              `
            )
            .eq("user_id", authUser.id)
            .eq("type", TEACH_TYPE),

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

        /* PROFILE IS REQUIRED */

        if (profileResult.error) {
          throw profileResult.error;
        }

        if (!profileResult.data) {
          navigate("/profile-setup", {
            replace: true,
          });

          return;
        }

        if (!profileResult.data.profile_completed) {
          navigate("/profile-setup", {
            replace: true,
          });

          return;
        }

        if (!active) return;

        setProfile({
          username:
            profileResult.data.username || "",

          full_name:
            profileResult.data.full_name || "",

          avatar_url:
            profileResult.data.avatar_url || "",

          bio:
            profileResult.data.bio || "",

          role:
            profileResult.data.role || "",

          career_goal:
            profileResult.data.career_goal || "",

          location:
            profileResult.data.location || "",
        });

        /* SKILLS */

        if (skillsResult.error) {
          console.error(
            "Edit profile skills error:",
            skillsResult.error
          );

          setSkills([]);
        } else {
          setSkills(skillsResult.data || []);
        }

        /* TEACHING */

        if (teachingResult.error) {
          console.error(
            "Edit profile teaching error:",
            teachingResult.error
          );

          setTeachingSkills([]);
        } else {
          setTeachingSkills(
            teachingResult.data || []
          );
        }

        /* LEARNING */

        if (learningResult.error) {
          console.error(
            "Edit profile learning error:",
            learningResult.error
          );

          setLearningSkills([]);
        } else {
          setLearningSkills(
            learningResult.data || []
          );
        }

        /* SETTINGS */

        if (settingsResult.error) {
          console.error(
            "Edit profile settings error:",
            settingsResult.error
          );
        } else if (settingsResult.data) {
          setSettingsExists(true);

          setPreferences({
            language:
              settingsResult.data.language ||
              "English",

            timezone:
              settingsResult.data.timezone ||
              "Asia/Dhaka",

            theme:
              settingsResult.data.theme ||
              "dark",
          });
        }
      } catch (err) {
        console.error(
          "Edit profile load error:",
          err
        );

        if (active) {
          setError(
            "We couldn't load your profile right now. Please refresh and try again."
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

  /* -------------------------------------------------------
     SKILL MAP
  ------------------------------------------------------- */

  const skillMap = useMemo(() => {
    return new Map(
      skills.map((skill) => [
        skill.id,
        skill,
      ])
    );
  }, [skills]);

  /* -------------------------------------------------------
     CHANGE TAB
  ------------------------------------------------------- */

  const setTab = (tab) => {
    if (!TABS.includes(tab)) {
      return;
    }

    setActiveTab(tab);

    navigate(
      `/profile/edit?tab=${tab}`,
      {
        replace: true,
      }
    );

    setError("");
    setSuccess("");
  };

  /* -------------------------------------------------------
     VALIDATION
  ------------------------------------------------------- */

  const validate = () => {
    const cleanUsername =
      profile.username.trim();

    if (
      !/^[a-zA-Z0-9._]{3,20}$/.test(
        cleanUsername
      )
    ) {
      setTab("profile");

      return "Username must be 3–20 characters and use only letters, numbers, dots or underscores.";
    }

    if (!profile.full_name.trim()) {
      setTab("profile");

      return "Full name is required.";
    }

    if (!profile.role) {
      setTab("profile");

      return "Please select your role.";
    }

    const needsTeaching =
      profile.role === "mentor" ||
      profile.role === "swap_master";

    const needsLearning =
      profile.role === "learner" ||
      profile.role === "swap_master";

    if (
      needsTeaching &&
      teachingSkills.length === 0
    ) {
      setTab("teaching");

      return "Your current role requires at least one teaching skill.";
    }

    if (
      needsLearning &&
      learningSkills.length === 0
    ) {
      setTab("learning");

      return "Your current role requires at least one learning skill.";
    }

    return "";
  };

  /* -------------------------------------------------------
     AVATAR VALIDATION
  ------------------------------------------------------- */

  const validateAvatar = (file) => {
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Please upload a JPG, PNG or WebP image."
      );
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      throw new Error(
        "Profile image must be smaller than 5 MB."
      );
    }
  };

  /* -------------------------------------------------------
     UPLOAD AVATAR
  ------------------------------------------------------- */

  const uploadAvatar = async () => {
    if (!avatarFile || !user) {
      return profile.avatar_url || null;
    }

    validateAvatar(avatarFile);

    const extension =
      avatarFile.name
        .split(".")
        .pop()
        ?.toLowerCase() || "jpg";

    const filePath =
      `${user.id}/profile-${Date.now()}.${extension}`;

    console.log(
      "Uploading avatar to:",
      AVATAR_BUCKET,
      filePath
    );

    /*
      IMPORTANT:

      Bucket name must be exactly:

      avatars

      Storage path:

      avatars/
        USER_ID/
          profile-xxxxx.jpg
    */

    const {
      data: uploadData,
      error: uploadError,
    } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(
        filePath,
        avatarFile,
        {
          upsert: false,
          contentType:
            avatarFile.type || undefined,
          cacheControl: "3600",
        }
      );

    if (uploadError) {
      console.error(
        "Avatar upload error:",
        uploadError
      );

      throw uploadError;
    }

    console.log(
      "Avatar uploaded:",
      uploadData
    );

    /* GET PUBLIC URL */

    const { data: publicData } =
      supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(filePath);

    const publicUrl =
      publicData?.publicUrl;

    if (!publicUrl) {
      throw new Error(
        "Avatar uploaded, but the public URL could not be generated."
      );
    }

    /*
      MEDIA HISTORY

      This is optional.

      If media table permissions are not configured,
      we log the error but DO NOT fail profile saving.
    */

    try {
      const { error: mediaError } =
        await supabase
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
        console.error(
          "Avatar media history error:",
          mediaError
        );
      }
    } catch (mediaException) {
      console.error(
        "Avatar media history exception:",
        mediaException
      );
    }

    return publicUrl;
  };

  /* -------------------------------------------------------
     SAVE
  ------------------------------------------------------- */

  const saveProfile = async () => {
    if (!user || saving) return;

    const validationError =
      validate();

    if (validationError) {
      setError(validationError);
      setSuccess("");

      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const cleanUsername =
        profile.username
          .trim()
          .toLowerCase();

      /* ---------------------------------------------------
         CHECK USERNAME
      --------------------------------------------------- */

      const {
        data: existingUsername,
        error: usernameCheckError,
      } = await supabase
        .from("profiles")
        .select("id")
        .eq(
          "username",
          cleanUsername
        )
        .neq("id", user.id)
        .maybeSingle();

      if (usernameCheckError) {
        throw usernameCheckError;
      }

      if (existingUsername) {
        setTab("profile");

        setError(
          "That username is already in use. Choose another one."
        );

        return;
      }

      /* ---------------------------------------------------
         AVATAR
      --------------------------------------------------- */

      const avatarUrl =
        await uploadAvatar();

      /* ---------------------------------------------------
         UPDATE PROFILE
      --------------------------------------------------- */

      const {
        error: profileError,
      } = await supabase
        .from("profiles")
        .update({
          username: cleanUsername,

          full_name:
            profile.full_name.trim(),

          avatar_url:
            avatarUrl || null,

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

          updated_at:
            new Date().toISOString(),

          /*
            DO NOT ADD:

            profile_completed

            Edit Profile must never restart
            onboarding.
          */
        })
        .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      /* ---------------------------------------------------
         TEACHING SKILLS
      --------------------------------------------------- */

      const {
        error: deleteTeachingError,
      } = await supabase
        .from("user_skills")
        .delete()
        .eq("user_id", user.id)
        .eq("type", TEACH_TYPE);

      if (deleteTeachingError) {
        throw deleteTeachingError;
      }

      if (teachingSkills.length > 0) {
        const teachingRows =
          teachingSkills.map((item) => ({
            user_id: user.id,

            skill_id:
              item.skill_id,

            type:
              TEACH_TYPE,

            proficiency_level:
              item.proficiency_level ||
              "intermediate",

            years_experience:
              Number(
                item.years_experience || 0
              ),

            is_verified:
              Boolean(
                item.is_verified
              ),
          }));

        const {
          error: insertTeachingError,
        } = await supabase
          .from("user_skills")
          .insert(teachingRows);

        if (insertTeachingError) {
          throw insertTeachingError;
        }
      }

      /* ---------------------------------------------------
         LEARNING INTERESTS
      --------------------------------------------------- */

      const {
        error: deleteLearningError,
      } = await supabase
        .from("user_interests")
        .delete()
        .eq("user_id", user.id);

      if (deleteLearningError) {
        throw deleteLearningError;
      }

      if (learningSkills.length > 0) {
        const learningRows =
          learningSkills.map((item) => ({
            user_id:
              user.id,

            skill_id:
              item.skill_id,

            interest_text:
              item.interest_text?.trim() ||
              null,

            weight:
              Number(
                item.weight || 3
              ),
          }));

        const {
          error: insertLearningError,
        } = await supabase
          .from("user_interests")
          .insert(learningRows);

        if (insertLearningError) {
          throw insertLearningError;
        }
      }

      /* ---------------------------------------------------
         SETTINGS
      --------------------------------------------------- */

      if (settingsExists) {
        const {
          error: settingsError,
        } = await supabase
          .from("user_settings")
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

        if (settingsError) {
          throw settingsError;
        }
      } else {
        const {
          error: settingsError,
        } = await supabase
          .from("user_settings")
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

        if (settingsError) {
          throw settingsError;
        }

        setSettingsExists(true);
      }

      /* ---------------------------------------------------
         UPDATE LOCAL PROFILE
      --------------------------------------------------- */

      setProfile((current) => ({
        ...current,

        avatar_url:
          avatarUrl || "",

        username:
          cleanUsername,

        full_name:
          current.full_name.trim(),
      }));

      setAvatarFile(null);

      setSuccess(
        "Your profile changes have been saved."
      );

      /*
        Refresh previous avatars.

        Failure here does not affect save.
      */

      await loadPreviousAvatars(
        user.id
      );
    } catch (err) {
      console.error(
        "Edit profile save error:",
        err
      );

      if (err?.code === "23505") {
        setError(
          "That username is already in use. Choose another one."
        );

        return;
      }

      if (
        err?.message
          ?.toLowerCase()
          .includes("bucket")
      ) {
        setError(
          "Avatar storage is not configured correctly. Make sure the Supabase bucket is named avatars."
        );

        return;
      }

      if (
        err?.message
          ?.toLowerCase()
          .includes(
            "row-level security"
          )
      ) {
        setError(
          "Your account does not currently have permission to perform that update."
        );

        return;
      }

      if (
        err?.message?.includes(
          "5 MB"
        ) ||
        err?.message?.includes(
          "JPG"
        )
      ) {
        setError(err.message);

        return;
      }

      setError(
        "We couldn't save your changes right now. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  /* -------------------------------------------------------
     LOADING
  ------------------------------------------------------- */

  if (loading) {
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

  /* -------------------------------------------------------
     PAGE
  ------------------------------------------------------- */

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
        <EditProfileHeader
          profile={profile}
          activeTab={activeTab}
          setTab={setTab}
          onBack={() =>
            navigate("/dashboard")
          }
          onSave={saveProfile}
          saving={saving}
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
              ref={successRef}
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
                profile={profile}
                setProfile={setProfile}
                avatarFile={avatarFile}
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
                    (current) => ({
                      ...current,
                      avatar_url: url,
                    })
                  )
                }
              />
            )}

            {/* TEACHING */}

            {activeTab ===
              "teaching" && (
              <TeachingEditTab
                skills={skills}
                selected={
                  teachingSkills
                }
                setSelected={
                  setTeachingSkills
                }
                skillMap={skillMap}
                required={
                  profile.role ===
                    "mentor" ||
                  profile.role ===
                    "swap_master"
                }
              />
            )}

            {/* LEARNING */}

            {activeTab ===
              "learning" && (
              <LearningEditTab
                skills={skills}
                selected={
                  learningSkills
                }
                setSelected={
                  setLearningSkills
                }
                skillMap={skillMap}
                required={
                  profile.role ===
                    "learner" ||
                  profile.role ===
                    "swap_master"
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
                navigate("/dashboard")
              }
              disabled={saving}
              className="min-h-11 border border-white/10 px-5 text-sm text-[#a1a1aa] transition hover:border-white/25 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
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