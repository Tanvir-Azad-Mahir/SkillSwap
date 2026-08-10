import { ArrowLeft } from "lucide-react";

const focusClass =
  "focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]";

export default function SignupHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-50 border-b border-white/10 bg-[#060807]/70 backdrop-blur-sm">
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-5 md:px-8 lg:px-10">
        <a
          href="/"
          className={`inline-flex items-baseline text-[22px] font-bold tracking-[-0.04em] text-[#f2f4ef] ${focusClass}`}
          aria-label="SkillSwap+ home"
        >
          SKILLSWAP<span className="text-[#c7ff39]">+</span>
        </a>

        <a
          href="/"
          className={`group inline-flex items-center gap-2 text-sm font-medium text-[#a1a1aa] transition hover:text-white ${focusClass}`}
        >
          <ArrowLeft
            size={16}
            strokeWidth={1.7}
            className="transition-transform duration-300 group-hover:-translate-x-1"
          />
          Back to home
        </a>
      </div>
    </header>
  );
}
