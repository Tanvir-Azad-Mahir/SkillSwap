import { Sparkles, UserCheck, Globe2, HeartHandshake } from "lucide-react";

const CARDS = [
  {
    icon: Sparkles,
    title: "Skill Swaps That Feel Fresh",
    text: "Every match is designed to help you learn faster and teach better with real people.",
  },
  {
    icon: UserCheck,
    title: "Verified Skill Partners",
    text: "Connect with motivated learners and educators who share reviews and swap history.",
  },
  {
    icon: Globe2,
    title: "Global Learning Network",
    text: "Discover collaborators from around the world and broaden your skills and perspective.",
  },
  {
    icon: HeartHandshake,
    title: "Exchange with Confidence",
    text: "Build trust through transparent matching, clear expectations, and supportive feedback.",
  },
];

export default function CommunityPulse() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#EEF4FF] via-white to-[#F8FAFC] py-24">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.16),transparent_22%)]" />
      <div className="relative w-full px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2F6FED]">
            Community pulse
          </p>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-[#0B1B33] tracking-tight">
            The creative skill swap network people actually love.
          </h2>
          <p className="mt-4 text-slate-600">
            See how members exchange their time, talent, and trust in one dynamic space.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-4">
          {CARDS.map((card) => (
            <div key={card.title} className="relative rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-[#2F6FED]/10 text-[#2F6FED]">
                <card.icon className="h-6 w-6" />
              </div>
              <p className="mt-6 text-xl font-semibold text-[#0B1B33]">{card.title}</p>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
