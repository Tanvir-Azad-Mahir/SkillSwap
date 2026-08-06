import {
  Code2,
  Palette,
  Languages,
  Camera,
  Megaphone,
  Music,
  Briefcase,
  Video,
  ArrowRight,
} from "lucide-react";
import SkillCard from "./SkillCard";

const SKILLS = [
  { icon: Code2, name: "Programming", count: "1,240" },
  { icon: Palette, name: "Graphic Design", count: "980" },
  { icon: Languages, name: "Languages", count: "1,510" },
  { icon: Camera, name: "Photography", count: "640" },
  { icon: Megaphone, name: "Digital Marketing", count: "720" },
  { icon: Music, name: "Music", count: "410" },
  { icon: Briefcase, name: "Business", count: "560" },
  { icon: Video, name: "Video Editing", count: "390" },
];

export default function PopularSkills() {
  return (
    <section id="skills" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#2F6FED]">
            Popular skill categories
          </p>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-[#0B1B33] tracking-tight">
            Swap fast with in-demand skills.
          </h2>
          <p className="mt-4 text-slate-600">
            Explore the most active skill areas and connect with practitioners who want to teach and learn.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {SKILLS.map((skill) => (
            <div
              key={skill.name}
              className="rounded-[2rem] border border-slate-200/80 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white"
            >
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-[#EFF8FF] text-[#0369A1] shadow-sm shadow-cyan-500/10">
                <skill.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-[#0B1B33]">{skill.name}</h3>
              <p className="mt-3 text-sm text-slate-500">{skill.count} active swaps</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href="#"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#2F6FED] transition hover:text-[#134e96]"
          >
            Browse all skills <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
