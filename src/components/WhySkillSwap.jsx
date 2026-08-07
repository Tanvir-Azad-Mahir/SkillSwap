import { Compass, Shapes, PanelsTopLeft } from "lucide-react";
import MatchCard from "./MatchCard";

const items = [
  {
    icon: Compass,
    title: "Find the right person",
    description: "Search by skill, level, availability, and what someone wants in return. Matching stays human and specific.",
  },
  {
    icon: Shapes,
    title: "Exchange value, not money",
    description: "Offer a skill you already know and receive focused learning in return. Every exchange starts with mutual value.",
  },
  {
    icon: PanelsTopLeft,
    title: "Keep learning practical",
    description: "Plan short sessions, share resources, track progress, and leave feedback without turning learning into another feed.",
  },
];

export default function WhySkillSwap() {
  return (
    <section className="border-y border-white/10 bg-[#080a09] py-28 md:py-36 lg:py-40">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 md:px-8 lg:grid-cols-12 lg:px-10">
        <div className="reveal lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c7ff39]">/ Why SkillSwap+</p>
            <h2 className="mt-4 max-w-lg text-4xl font-semibold tracking-[-0.045em] text-white md:text-5xl">A better way to learn from people.</h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-zinc-400">SkillSwap+ is designed around direct exchange: your experience is useful to someone, and theirs can move you forward.</p>
          </div>
        </div>
        <div className="reveal lg:col-span-7">
          {items.map((item, index) => <MatchCard key={item.title} {...item} index={index + 1} />)}
        </div>
      </div>
    </section>
  );
}
