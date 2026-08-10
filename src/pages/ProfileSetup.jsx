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

export default function ProfileSetup() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [user, setUser] = useState(null);

  // Username + full name were already collected during signup.
  // Keep them only for saving the profiles row; do not ask for them again.
  const [identity, setIdentity] = useState(initialIdentity);

  const [profile, setProfile] = useState(initialProfile);
  const [avatarFile, setAvatarFile] = useState(null);

  const [skills, setSkills] = useState([]);
  const [teachSkills, setTeachSkills] = useState([]);
  const [learnSkills, setLearnSkills] = useState([]);

  const [settings, setSettings] = useState({
    language: "English",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    theme: "dark",
  });

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const currentStep = STEPS[step];

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setInitialLoading(true);
        setError("");

        const {
          data: { user: authUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!authUser) {
          navigate("/login", { replace: true });
          return;
        }

        if (!active) return;

        setUser(authUser);

        const [
          profileResult,
          skillsResult,
          userSkillsResult,
          interestsResult,
          settingsResult,
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              "id, username, full_name, avatar_url, bio, role, career_goal, location, is_active"
            )
            .eq("id", authUser.id)
            .maybeSingle(),

          supabase
            .from("skills")
            .select("id, name, description, difficulty_level, category_id")
            .eq("is_active", true)
            .order("name"),

          supabase
            .from("user_skills")
            .select(
              "id, skill_id, type, proficiency_level, years_experience, is_verified"
            )
            .eq("user_id", authUser.id),

          supabase
            .from("user_interests")
            .select("id, skill_id, interest_text, weight")
            .eq("user_id", authUser.id),

          supabase
            .from("user_settings")
            .select("id, language, timezone, theme")
            .eq("user_id", authUser.id)
            .maybeSingle(),
        ]);

        // IMPORTANT:
        // Do not let an error from user_skills, user_interests, or user_settings
        // prevent the main skill catalog from loading.
        //
        // This keeps SkillSearch working even if one optional onboarding table
        // still has an RLS/permission problem.

        if (skillsResult.error) {
          console.error("Skills load error:", skillsResult.error);
          setSkills([]);
        } else {
          setSkills(skillsResult.data || []);
        }

        if (profileResult.error) {
          console.error("Profile load error:", profileResult.error);
        }

        if (userSkillsResult.error) {
          console.error("Teaching skills load error:", userSkillsResult.error);
        }

        if (interestsResult.error) {
          console.error("Learning interests load error:", interestsResult.error);
        }

        if (settingsResult.error) {
          console.error("Settings load error:", settingsResult.error);
        }

        const metadata = authUser.user_metadata || {};
        const existingProfile = profileResult.error ? null : profileResult.data;

        const username =
          existingProfile?.username ?? metadata.username ?? "";

        const fullName =
          existingProfile?.full_name ??
          metadata.full_name ??
          metadata.name ??
          "";

        if (!username) {
          throw new Error(
            "Your signup username was not found. Please create your account again."
          );
        }

        if (!fullName) {
          throw new Error(
            "Your signup name was not found. Please create your account again."
          );
        }

        if (!active) return;

        setIdentity({
          username,
          full_name: fullName,
        });

        setProfile({
          avatar_url:
            existingProfile?.avatar_url ??
            metadata.avatar_url ??
            metadata.picture ??
            "",
          bio: existingProfile?.bio ?? "",
          role: existingProfile?.role ?? "",
          career_goal: existingProfile?.career_goal ?? "",
          location: existingProfile?.location ?? "",
        });

        setTeachSkills(
          (userSkillsResult.error ? [] : userSkillsResult.data || [])
            .filter((row) => row.type === TEACH_SKILL_TYPE)
            .map((row) => ({
              skill_id: row.skill_id,
              proficiency_level: row.proficiency_level || "intermediate",
              years_experience: row.years_experience ?? 0,
            }))
        );

        setLearnSkills(
          (interestsResult.error ? [] : interestsResult.data || []).map((row) => ({
            skill_id: row.skill_id,
            interest_text: row.interest_text || "",
            weight: row.weight ?? 3,
          }))
        );

        if (!settingsResult.error && settingsResult.data) {
          setSettings({
            language: settingsResult.data.language || "English",
            timezone:
              settingsResult.data.timezone ||
              Intl.DateTimeFormat().resolvedOptions().timeZone ||
              "UTC",
            theme: settingsResult.data.theme || "dark",
          });
        }
      } catch (err) {
        // Keep the real Supabase/database error in DevTools only.
        console.error("Profile setup load error:", err);

        if (active) {
          setError(
            "We couldn't load your profile right now. Please refresh and try again."
          );
        }
      } finally {
        if (active) setInitialLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [navigate]);

  const skillMap = useMemo(
    () => new Map(skills.map((skill) => [skill.id, skill])),
    [skills]
  );

  const roleRequiresTeaching =
    profile.role === ROLE_MENTOR || profile.role === ROLE_SWAP_MASTER;

  const roleRequiresLearning =
    profile.role === ROLE_LEARNER || profile.role === ROLE_SWAP_MASTER;

  const validateStep = () => {
    setError("");

    if (step === 0) {
      if (
        ![ROLE_LEARNER, ROLE_MENTOR, ROLE_SWAP_MASTER].includes(profile.role)
      ) {
        setError("Choose how you want to use SkillSwap+.");
        return false;
      }
    }

    // Learner: teaching is optional.
    // Mentor: teaching is required.
    // Swap Master: teaching is required.
    if (step === 1 && roleRequiresTeaching && teachSkills.length === 0) {
      setError(
        profile.role === ROLE_MENTOR
          ? "Mentors need at least one skill they can teach."
          : "Swap Masters need at least one skill they can teach."
      );
      return false;
    }

    // Mentor: learning is optional.
    // Learner: learning is required.
    // Swap Master: learning is required.
    if (step === 2 && roleRequiresLearning && learnSkills.length === 0) {
      setError(
        profile.role === ROLE_LEARNER
          ? "Learners need at least one skill they want to learn."
          : "Swap Masters need at least one skill they want to learn."
      );
      return false;
    }

    return true;
  };

  const goNext = () => {
    if (!validateStep()) return;

    setStep((current) => Math.min(current + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setError("");
    setStep((current) => Math.max(current - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !user) return profile.avatar_url || null;

    const extension =
      avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";

    const filePath = `${user.id}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, avatarFile, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // Username is not editable here, but because the profiles row may not
  // exist yet, verify the signup username is still available before upsert.
  const verifySignupUsername = async () => {
    const cleanUsername = identity.username.trim().toLowerCase();

    const { data, error: usernameError } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", cleanUsername)
      .neq("id", user.id)
      .limit(1);

    if (usernameError) throw usernameError;

    if (data?.length) {
      throw new Error(
        "Your signup username is no longer available. Please contact support or choose another username."
      );
    }

    return cleanUsername;
  };

  const saveSettings = async () => {
    const { data: existing, error: existingError } = await supabase
      .from("user_settings")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      const { error } = await supabase
        .from("user_settings")
        .update({
          language: settings.language,
          timezone: settings.timezone,
          theme: settings.theme,
        })
        .eq("id", existing.id);

      if (error) throw error;
      return;
    }

    const { error } = await supabase.from("user_settings").insert({
      user_id: user.id,
      language: settings.language,
      timezone: settings.timezone,
      theme: settings.theme,
    });

    if (error) throw error;
  };

  const handleFinish = async () => {
    if (!validateStep() || !user) return;

    try {
      setSaving(true);
      setError("");

      const cleanUsername = await verifySignupUsername();
      const avatarUrl = await uploadAvatar();

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,

            // Already collected during signup.
            username: cleanUsername,
            full_name: identity.full_name.trim(),

            // Collected during profile setup.
            avatar_url: avatarUrl,
            bio: profile.bio.trim() || null,
            role: profile.role,
            career_goal: profile.career_goal.trim() || null,
            location: profile.location.trim() || null,
            is_active: true,

            // Add this column to profiles before using this line.
            profile_completed: true,

            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (profileError) throw profileError;

      // Replace teaching skills.
      const { error: deleteTeachError } = await supabase
        .from("user_skills")
        .delete()
        .eq("user_id", user.id)
        .eq("type", TEACH_SKILL_TYPE);

      if (deleteTeachError) throw deleteTeachError;

      // Learners are allowed to have zero teaching skills.
      if (teachSkills.length > 0) {
        const { error: teachError } = await supabase
          .from("user_skills")
          .insert(
            teachSkills.map((item) => ({
              user_id: user.id,
              skill_id: item.skill_id,
              type: TEACH_SKILL_TYPE,
              proficiency_level: item.proficiency_level,
              years_experience: Number(item.years_experience) || 0,
              is_verified: false,
            }))
          );

        if (teachError) throw teachError;
      }

      // Replace learning interests.
      const { error: deleteInterestsError } = await supabase
        .from("user_interests")
        .delete()
        .eq("user_id", user.id);

      if (deleteInterestsError) throw deleteInterestsError;

      // Mentors are allowed to have zero learning skills.
      if (learnSkills.length > 0) {
        const { error: interestsError } = await supabase
          .from("user_interests")
          .insert(
            learnSkills.map((item) => ({
              user_id: user.id,
              skill_id: item.skill_id,
              interest_text: item.interest_text.trim() || null,
              weight: Number(item.weight) || 3,
            }))
          );

        if (interestsError) throw interestsError;
      }

      await saveSettings();

      setProfile((current) => ({
        ...current,
        avatar_url: avatarUrl || "",
      }));

      setSuccess(true);
    } catch (err) {
      // Never expose raw Supabase/database errors in the UI.
      console.error("Profile setup save error:", err);

      if (err?.code === "23505") {
        setError(
          "That account information is already in use. Please try again."
        );
      } else {
        setError(
          "We couldn't save your profile right now. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  };

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
            onClick={() => navigate("/dashboard", { replace: true })}
            className="mt-8 min-h-12 bg-[#c7ff39] px-6 font-semibold text-[#071008] transition hover:bg-[#d2ff64] focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
          >
            Enter SkillSwap+ →
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060807] text-[#f2f4ef]">
      <div className="noise pointer-events-none fixed inset-0 z-0" />

      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 75% 24%, rgba(199,255,57,.07), transparent 42%)",
        }}
      />

      <div className="relative z-10">
        <ProfileSetupHeader />

        <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-28 md:px-8 lg:grid-cols-[0.35fr_0.65fr] lg:gap-16 lg:px-10 lg:pt-32">
          <ProfileSetupProgress
            steps={STEPS}
            currentStep={step}
            onStepClick={(index) => {
              if (index <= step) {
                setError("");
                setStep(index);
              }
            }}
          />

          <section className="w-full">
            <div className="mb-7 flex items-end justify-between gap-5 border-b border-white/10 pb-5">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#a1a1aa]">
                  <span className="mr-2 text-[#c7ff39]">●</span>
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

            {error && (
              <div
                role="alert"
                className="mb-6 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm text-[#ff8b8b]"
              >
                {error}
              </div>
            )}

            {step === 0 && (
              <BasicProfileStep
                profile={profile}
                setProfile={setProfile}
                avatarFile={avatarFile}
                setAvatarFile={setAvatarFile}
              />
            )}

            {step === 1 && (
              <TeachSkillsStep
                skills={skills}
                selected={teachSkills}
                setSelected={setTeachSkills}
                skillMap={skillMap}
                role={profile.role}
                required={roleRequiresTeaching}
              />
            )}

            {step === 2 && (
              <LearnSkillsStep
                skills={skills}
                selected={learnSkills}
                setSelected={setLearnSkills}
                skillMap={skillMap}
                role={profile.role}
                required={roleRequiresLearning}
              />
            )}

            {step === 3 && (
              <PreferencesStep
                settings={settings}
                setSettings={setSettings}
              />
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 0 || saving}
                className="min-h-12 border border-white/15 px-5 text-sm font-medium text-[#f2f4ef] transition hover:border-white/30 hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
              >
                ← Back
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="min-h-12 bg-[#c7ff39] px-6 text-sm font-semibold text-[#071008] transition hover:bg-[#d2ff64] focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
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