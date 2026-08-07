import { ArrowUpRight } from "lucide-react";

export default function SkillCard({ image, eyebrow, title, description, className = "", large = false }) {
  return (
    <article className={`group overflow-hidden border border-white/10 bg-[#080a09] ${className}`}>
      <div className={`${large ? "lg:grid lg:grid-cols-[1.15fr_.85fr]" : ""}`}>
        <div className={`relative overflow-hidden ${large ? "aspect-[16/11] lg:aspect-auto lg:min-h-[32rem]" : "aspect-[4/3]"}`}>
          <img
            src={image}
            alt=""
            className="h-full w-full object-cover grayscale transition duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04] group-hover:grayscale-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        </div>
        <div className={`flex flex-col justify-between p-6 md:p-8 ${large ? "lg:p-10" : ""}`}>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c7ff39]">{eyebrow}</p>
            <h3 className={`mt-4 font-semibold tracking-[-0.035em] text-white ${large ? "text-3xl md:text-4xl" : "text-2xl"}`}>{title}</h3>
            <p className="mt-4 max-w-md text-sm leading-6 text-zinc-400">{description}</p>
          </div>
          <a href="#join" className="mt-8 inline-flex w-fit items-center gap-2 text-sm font-medium text-zinc-300 transition group-hover:text-white">
            Find a match <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </article>
  );
}
