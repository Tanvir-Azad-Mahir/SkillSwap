import { useEffect, useState } from "react";
import {
  ImagePlus,
  GraduationCap,
  HandHeart,
  Repeat2,
  Check,
} from "lucide-react";
import Field from "./Field";

const inputClass =
  "min-h-[52px] w-full rounded-md border border-white/15 bg-[#060807] px-4 text-[#f2f4ef] placeholder:text-white/25 transition hover:border-white/25 focus:border-[#c7ff39]/70 focus:outline-none focus:ring-1 focus:ring-[#c7ff39]/30";

const roles = [
  {
    id: "learner",
    title: "Learner",
    icon: GraduationCap,
    description:
      "Learn new skills using your SS Credits. Teaching is completely optional.",
    requirement: "Learning skills required",
  },
  {
    id: "mentor",
    title: "Mentor",
    icon: HandHeart,
    description:
      "Share what you know, help other members grow, and earn SS Credits.",
    requirement: "Teaching skills required",
  },
  {
    id: "swap_master",
    title: "Swap Master",
    icon: Repeat2,
    description:
      "Teach what you know and learn what you don't through two-way skill exchanges.",
    requirement: "Learning + teaching required",
  },
];

export default function BasicProfileStep({
  profile,
  setProfile,
  avatarFile,
  setAvatarFile,
}) {
  const [preview, setPreview] = useState(profile.avatar_url || null);

  const update = (field) => (event) => {
    setProfile((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  useEffect(() => {
    if (!avatarFile) {
      setPreview(profile.avatar_url || null);
      return;
    }

    const objectUrl = URL.createObjectURL(avatarFile);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile, profile.avatar_url]);

  return (
    <div className="space-y-8">
      {/* Intro */}
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-[#c7ff39]">
          Tell us about yourself
        </p>

        <h2 className="mt-3 text-2xl font-medium tracking-[-0.035em] md:text-3xl">
          Build your SkillSwap+ profile.
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a1a1aa] md:text-base">
          Choose how you want to use SkillSwap+. You can update your profile
          and skills later.
        </p>
      </div>

      {/* Profile Photo */}
      <div className="grid gap-6 border-y border-white/10 py-7 sm:grid-cols-[120px_1fr] sm:items-center">
        <div className="relative flex h-[120px] w-[120px] items-center justify-center overflow-hidden border border-white/15 bg-[#0a0d0b]">
          {preview ? (
            <img
              src={preview}
              alt="Profile preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <ImagePlus
              size={30}
              strokeWidth={1.4}
              className="text-white/25"
            />
          )}
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-sm font-medium">Profile photo</p>

          <p className="mt-1 max-w-md text-sm leading-6 text-[#a1a1aa]">
            Optional. A clear photo makes your profile easier to recognize in
            skill matches and sessions.
          </p>

          <label className="mt-4 inline-flex w-fit cursor-pointer items-center border border-white/15 px-4 py-2.5 text-sm transition hover:border-white/30 hover:bg-white/[0.03] focus-within:ring-2 focus-within:ring-[#c7ff39] focus-within:ring-offset-4 focus-within:ring-offset-[#060807]">
            Choose image

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) =>
                setAvatarFile(event.target.files?.[0] || null)
              }
            />
          </label>

          {avatarFile && (
            <button
              type="button"
              onClick={() => setAvatarFile(null)}
              className="mt-3 w-fit text-xs text-[#a1a1aa] underline-offset-4 transition hover:text-white hover:underline"
            >
              Remove selected image
            </button>
          )}
        </div>
      </div>

      {/* Bio */}
      <Field
        label="Bio"
        hint={`${profile.bio?.length || 0}/240 · Optional`}
        htmlFor="bio"
      >
        <textarea
          id="bio"
          rows={4}
          maxLength={240}
          value={profile.bio || ""}
          onChange={update("bio")}
          placeholder="Tell the community what you're interested in learning, building or sharing."
          className={`${inputClass} min-h-[120px] resize-none py-3`}
        />
      </Field>

      {/* Role Selection */}
      <div>
        <div className="mb-4">
          <p className="text-sm font-medium">
            How will you use SkillSwap+?
            <span className="ml-1 text-[#c7ff39]">*</span>
          </p>

          <p className="mt-1 text-sm leading-6 text-[#a1a1aa]">
            Your role determines which types of skills you need to add during
            profile setup.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {roles.map((role) => {
            const Icon = role.icon;
            const selected = profile.role === role.id;

            return (
              <button
                key={role.id}
                type="button"
                onClick={() =>
                  setProfile((current) => ({
                    ...current,
                    role: role.id,
                  }))
                }
                className={`
                  group relative min-h-[210px] border p-5 text-left
                  transition duration-300
                  focus:outline-none
                  focus:ring-2
                  focus:ring-[#c7ff39]
                  focus:ring-offset-4
                  focus:ring-offset-[#060807]
                  ${
                    selected
                      ? "border-[#c7ff39]/70 bg-[#c7ff39]/[0.05]"
                      : "border-white/15 bg-[#0a0d0b] hover:border-white/30"
                  }
                `}
              >
                {selected && (
                  <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center bg-[#c7ff39] text-[#071008]">
                    <Check size={14} strokeWidth={2.2} />
                  </div>
                )}

                <div
                  className={`
                    flex h-10 w-10 items-center justify-center border
                    transition
                    ${
                      selected
                        ? "border-[#c7ff39]/40 bg-[#c7ff39]/10 text-[#c7ff39]"
                        : "border-white/10 text-[#a1a1aa] group-hover:text-[#c7ff39]"
                    }
                  `}
                >
                  <Icon size={20} strokeWidth={1.5} />
                </div>

                <h3 className="mt-6 text-lg font-medium tracking-[-0.025em]">
                  {role.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
                  {role.description}
                </p>

                <p
                  className={`
                    mt-5 text-[10px] uppercase tracking-[0.15em]
                    ${
                      selected
                        ? "text-[#c7ff39]"
                        : "text-white/30"
                    }
                  `}
                >
                  {role.requirement}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Role explanation */}
      {profile.role && (
        <div className="border-l border-[#c7ff39] bg-[#c7ff39]/[0.025] px-5 py-4">
          {profile.role === "learner" && (
            <>
              <p className="text-sm font-medium text-[#f2f4ef]">
                Learner
              </p>
              <p className="mt-1 text-sm leading-6 text-[#a1a1aa]">
                You'll need to add at least one skill you want to learn.
                Adding a skill you can teach is optional.
              </p>
            </>
          )}

          {profile.role === "mentor" && (
            <>
              <p className="text-sm font-medium text-[#f2f4ef]">
                Mentor
              </p>
              <p className="mt-1 text-sm leading-6 text-[#a1a1aa]">
                You'll need to add at least one skill you can teach.
                Learning skills are optional.
              </p>
            </>
          )}

          {profile.role === "swap_master" && (
            <>
              <p className="text-sm font-medium text-[#f2f4ef]">
                Swap Master
              </p>
              <p className="mt-1 text-sm leading-6 text-[#a1a1aa]">
                You'll need at least one skill you can teach and one skill
                you want to learn.
              </p>
            </>
          )}
        </div>
      )}

      {/* Career goal + Location */}
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Career / learning goal"
          hint="Optional"
          htmlFor="career_goal"
        >
          <textarea
            id="career_goal"
            rows={3}
            value={profile.career_goal || ""}
            onChange={update("career_goal")}
            placeholder="What would you like to become better at?"
            className={`${inputClass} min-h-[110px] resize-none py-3`}
          />
        </Field>

        <Field
          label="Location"
          hint="Optional"
          htmlFor="location"
        >
          <textarea
            id="location"
            rows={3}
            value={profile.location || ""}
            onChange={update("location")}
            placeholder="e.g. Dhaka, Bangladesh"
            className={`${inputClass} min-h-[110px] resize-none py-3`}
          />
        </Field>
      </div>

      {/* SS Credit Info */}
      <div className="border border-[#c7ff39]/20 bg-[#c7ff39]/[0.035] p-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#c7ff39]">
              New member bonus
            </p>

            <h3 className="mt-2 text-lg font-medium">
              Start with 100 SS Credits
            </h3>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#a1a1aa]">
              Every new SkillSwap+ member receives 100 SS Credits. Use them
              to learn from other members and earn more credits by completing
              learning activities or teaching others.
            </p>
          </div>

          <div className="shrink-0 text-right">
            <span className="text-3xl font-medium tracking-[-0.04em] text-[#c7ff39]">
              +100
            </span>

            <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-[#a1a1aa]">
              SS Credits
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}