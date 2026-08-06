import { PiggyBank, Users2, Share2, Award } from "lucide-react";

const BENEFITS = [
  {
    icon: PiggyBank,
    title: "Learn Without Expensive Courses",
    text: "Exchange your knowledge instead of paying large course fees.",
  },
  {
    icon: Users2,
    title: "Real Human Connections",
    text: "Learn directly from people with real-world experience.",
  },
  {
    icon: Share2,
    title: "Share What You Know",
    text: "Your existing skills have value to someone else.",
  },
  {
    icon: Award,
    title: "Build Your Reputation",
    text: "Earn ratings, reviews, badges, and credibility as you help others.",
  },
];

export default function WhySkillSwap() {
  return (
    <section className="bg-white py-24">
      <div className="w-full px-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1B33] tracking-tight text-center">
          Why Skill Swap+
        </h2>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-2xl border border-slate-100 p-6 hover:shadow-lg hover:shadow-slate-200/60 transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-[#ECFDF3] flex items-center justify-center">
                <b.icon className="w-5 h-5 text-[#16A34A]" strokeWidth={2} />
              </div>
              <p className="mt-4 font-semibold text-[#0B1B33]">{b.title}</p>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
