import { ArrowDown, ArrowUpRight } from "lucide-react";
import CommunityPulse from "./CommunityPulse";

const HERO_IMAGE = "https://akpcainfbirpjvexinzt.supabase.co/storage/v1/object/sign/image/hero.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xZDM3MGYyYy02Nzk4LTQ3MjItOWNmYy1lNmFlOWE0YTU1YzUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZS9oZXJvLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODYxMjc3MDEsImV4cCI6MTgxNzY2MzcwMX0.1yCWblTXX-1IVAabWU4Ix0i-CsgN4UrAisTmopU5RF4";

export default function Hero() {
  return (
    <section id="top" className="relative isolate min-h-screen overflow-hidden pt-20">
      <div className="noise absolute inset-0 -z-30 opacity-70" />
      <div className="absolute left-[68%] top-[17%] -z-20 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(199,255,57,0.16),rgba(199,255,57,0.035)_42%,transparent_70%)] blur-3xl" />

      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-14 px-5 py-20 md:px-8 lg:grid-cols-[1.08fr_.92fr] lg:px-10 lg:py-24">
        <div className="reveal relative z-10 max-w-4xl">
          <p className="mb-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400 md:text-xs">
            Peer-to-peer learning · Built for curious people
          </p>

          <h1 className="text-[3.3rem] font-semibold leading-[0.95] tracking-[-0.055em] text-[#f2f4ef] sm:text-6xl md:text-7xl lg:text-[6.6rem]">
            Learn what matters.
            <span className="mt-2 block text-zinc-500">Share what you know.</span>
          </h1>

          <p className="mt-8 max-w-xl text-base leading-7 text-zinc-400 md:text-lg md:leading-8">
            SkillSwap+ connects people who want to exchange practical skills, one meaningful match at a time. No endless courses. No passive feeds. Just people teaching people.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#discover"
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#c7ff39] px-6 text-sm font-semibold text-[#071008] transition hover:bg-[#d4ff67] focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
            >
              Explore skills <ArrowUpRight size={17} />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/15 px-6 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
            >
              How it works <ArrowDown size={16} />
            </a>
          </div>
        </div>

        <div className="reveal relative mx-auto w-full max-w-[31rem] lg:justify-self-end" style={{ transitionDelay: "110ms" }}>
          <div className="group relative aspect-[4/5] overflow-hidden border border-white/10 bg-[#0a0d0b]">
            <img
              src={HERO_IMAGE}
              alt="Abstract collaborative object representing SkillSwap connections"
              className="h-full w-full object-cover grayscale transition duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.03] group-hover:grayscale-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060807]/45 via-transparent to-transparent" />
          </div>
          <CommunityPulse />
        </div>
      </div>

      <div className="relative z-10 border-t border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 text-[11px] uppercase tracking-[0.18em] text-zinc-500 md:px-8 lg:px-10">
          <span>01 / 07</span>
          <span className="hidden sm:block">Skill exchange, redesigned for real connection</span>
          <a href="#stats" className="inline-flex items-center gap-2 text-zinc-400 transition hover:text-white">
            Scroll <ArrowDown size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}
