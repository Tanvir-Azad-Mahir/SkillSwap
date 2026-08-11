import { Coins, MapPin } from "lucide-react";

const roleNames = {
  learner: "Learner",
  mentor: "Mentor",
  swap_master: "Swap Master",
};

export default function WelcomePanel({ profile, wallet }) {
  const firstName =
    profile?.full_name?.trim()?.split(/\s+/)?.[0] || profile?.username || "there";

  const balance = wallet?.balance ?? 0;
  const totalEarned = wallet?.total_earned ?? 0;

  return (
    <section className="grid overflow-hidden border border-white/10 bg-[#0a0d0b]/75 lg:grid-cols-[1.25fr_.75fr]">
      <div className="p-6 md:p-8 lg:p-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="border border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">
            {roleNames[profile?.role] || "Member"}
          </span>

          {profile?.location && (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#a1a1aa]">
              <MapPin size={13} strokeWidth={1.5} />
              {profile.location}
            </span>
          )}
        </div>

        <h1 className="mt-6 text-4xl font-medium tracking-[-0.05em] md:text-5xl lg:text-6xl">
          Welcome back, {firstName}.
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#a1a1aa] md:text-base">
          {profile?.career_goal ||
            "Keep learning, sharing and building useful skill exchanges."}
        </p>
      </div>

      <div className="border-t border-white/10 bg-[#c7ff39]/[0.035] p-6 md:p-8 lg:border-l lg:border-t-0 lg:p-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.17em] text-[#c7ff39]">
              SS Credit wallet
            </p>
            <p className="mt-4 text-5xl font-medium tracking-[-0.06em] text-[#c7ff39]">
              {balance}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#a1a1aa]">
              Available credits
            </p>
          </div>

          <div className="grid h-12 w-12 place-items-center border border-[#c7ff39]/20 text-[#c7ff39]">
            <Coins size={22} strokeWidth={1.4} />
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#a1a1aa]">Total earned</span>
            <span className="font-medium">{totalEarned} SS</span>
          </div>

          {!wallet && (
            <p className="mt-3 text-xs leading-5 text-white/35">
              Credit wallet is not initialized yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
