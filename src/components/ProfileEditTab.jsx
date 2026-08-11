import { Camera, MapPin, Target, UserRound } from "lucide-react";
import { useEffect, useMemo } from "react";

const roles = [
  {
    value: "learner",
    title: "Learner",
    description: "Primarily here to learn new skills.",
  },
  {
    value: "mentor",
    title: "Mentor",
    description: "Primarily here to teach and earn SS Credits.",
  },
  {
    value: "swap_master",
    title: "Swap Master",
    description: "Actively teaches and learns.",
  },
];

export default function ProfileEditTab({
  profile,
  setProfile,
  avatarFile,
  setAvatarFile,
  previousAvatars,
  setProfileAvatar,
}) {
  const previewUrl = useMemo(() => {
    if (!avatarFile) return "";
    return URL.createObjectURL(avatarFile);
  }, [avatarFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const avatarSrc = previewUrl || profile.avatar_url;

  const update = (field, value) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div className="p-5 md:p-8">
      <div className="border-b border-white/10 pb-6">
        <p className="text-[10px] uppercase tracking-[0.17em] text-[#a1a1aa]">
          Public profile
        </p>
        <h2 className="mt-2 text-2xl font-medium tracking-[-0.035em]">
          Profile information
        </h2>
      </div>

      <div className="mt-7 grid gap-8 lg:grid-cols-[220px_1fr]">
        <div>
          <div className="relative h-40 w-40 overflow-hidden border border-white/10 bg-[#060807]">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-white/20">
                <UserRound size={42} strokeWidth={1.2} />
              </div>
            )}

            <label className="absolute inset-x-0 bottom-0 flex cursor-pointer items-center justify-center gap-2 bg-black/75 px-3 py-2.5 text-xs text-white backdrop-blur-sm">
              <Camera size={14} />
              Change photo
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setAvatarFile(event.target.files?.[0] || null)
                }
                className="hidden"
              />
            </label>
          </div>

          <p className="mt-3 max-w-[180px] text-xs leading-5 text-white/35">
            JPG, PNG or WebP. Your existing photo remains unless you upload a
            new one.
          </p>

          {previousAvatars?.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs uppercase tracking-[0.17em] text-[#a1a1aa]">
                Previous avatars
              </p>
              <div className="grid gap-2">
                {previousAvatars.slice(0, 4).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setProfileAvatar(item.url)}
                    className="group flex items-center gap-3 rounded border border-white/10 bg-[#0a0d0b]/70 px-3 py-2 text-left text-sm text-white transition hover:border-[#c7ff39]/30"
                  >
                    <img
                      src={item.url}
                      alt="Previous avatar"
                      className="h-11 w-11 rounded object-cover"
                    />
                    <span className="truncate">Saved {new Date(item.created_at).toLocaleDateString()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-xs text-[#a1a1aa]">
                Full name
              </span>
              <input
                value={profile.full_name}
                disabled
                className="min-h-11 w-full cursor-not-allowed border border-white/10 bg-[#060807]/80 px-4 text-sm text-white/70 focus:border-[#c7ff39]/45 focus:outline-none"
              />
              <p className="mt-2 text-xs text-[#a1a1aa]">
                Full name cannot be changed here.
              </p>
            </label>

            <label>
              <span className="mb-2 block text-xs text-[#a1a1aa]">
                Username
              </span>
              <div className="flex min-h-11 items-center border border-white/10 bg-[#060807] focus-within:border-[#c7ff39]/45">
                <span className="pl-4 text-sm text-white/30">@</span>
                <input
                  value={profile.username}
                  onChange={(event) =>
                    update("username", event.target.value)
                  }
                  className="min-h-11 min-w-0 flex-1 bg-transparent px-1 pr-4 text-sm text-white focus:outline-none"
                />
              </div>
              <p className="mt-2 text-xs text-[#a1a1aa]">
                Your public username can be changed here. It must be unique.
              </p>
            </label>
          </div>

          <label>
            <span className="mb-2 block text-xs text-[#a1a1aa]">Bio</span>
            <textarea
              value={profile.bio}
              onChange={(event) => update("bio", event.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Tell people what you are learning, teaching or building."
              className="w-full resize-none border border-white/10 bg-[#060807] px-4 py-3 text-sm leading-6 text-white placeholder:text-white/20 focus:border-[#c7ff39]/45 focus:outline-none"
            />
          </label>

          <div>
            <span className="mb-2 block text-xs text-[#a1a1aa]">
              Current role
            </span>

            <div className="grid gap-3 md:grid-cols-3">
              {roles.map((role) => {
                const selected = profile.role === role.value;

                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => update("role", role.value)}
                    className={`border p-4 text-left transition ${
                      selected
                        ? "border-[#c7ff39]/45 bg-[#c7ff39]/[0.05]"
                        : "border-white/10 bg-[#060807] hover:border-white/20"
                    }`}
                  >
                    <p
                      className={`text-sm font-medium ${
                        selected ? "text-[#c7ff39]" : "text-white"
                      }`}
                    >
                      {role.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#a1a1aa]">
                      {role.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <label>
            <span className="mb-2 flex items-center gap-2 text-xs text-[#a1a1aa]">
              <Target size={13} />
              Career / learning goal
            </span>
            <input
              value={profile.career_goal}
              onChange={(event) =>
                update("career_goal", event.target.value)
              }
              placeholder="e.g. Become a front-end developer"
              className="min-h-11 w-full border border-white/10 bg-[#060807] px-4 text-sm text-white placeholder:text-white/20 focus:border-[#c7ff39]/45 focus:outline-none"
            />
          </label>

          <label>
            <span className="mb-2 flex items-center gap-2 text-xs text-[#a1a1aa]">
              <MapPin size={13} />
              Location
            </span>
            <input
              value={profile.location}
              onChange={(event) =>
                update("location", event.target.value)
              }
              placeholder="e.g. Dhaka, Bangladesh"
              className="min-h-11 w-full border border-white/10 bg-[#060807] px-4 text-sm text-white placeholder:text-white/20 focus:border-[#c7ff39]/45 focus:outline-none"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
