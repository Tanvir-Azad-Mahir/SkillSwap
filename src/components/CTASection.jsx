import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function CTASection() {
  return (
    <section id="join" className="relative overflow-hidden border-y border-white/10 bg-[#080a09] py-28 md:py-36 lg:py-40">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_100%,rgba(82,188,76,.30),transparent_51%)]" />
      <div className="noise absolute inset-0 -z-20 opacity-35" />
      <div className="reveal mx-auto max-w-5xl px-5 text-center md:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c7ff39]">Your next skill could start here</p>
        <h2 className="mx-auto mt-5 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-white md:text-7xl">Teach one thing. Learn another.</h2>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-zinc-400">Create your SkillSwap+ profile and turn what you already know into the next thing you want to learn.</p>
        <Link to="/signup" className="mt-9 inline-flex min-h-12 items-center justify-center gap-2 bg-[#c7ff39] px-7 text-sm font-semibold text-[#071008] transition hover:bg-[#d4ff67] focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]">
          Create your profile <ArrowUpRight size={17} />
        </Link>
      </div>
    </section>
  );
}
