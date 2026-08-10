import { Link } from "react-router-dom";

export default function ProfileSetupHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-40 border-b border-white/10">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8 lg:px-10">
        <Link
          to="/"
          className="text-[22px] font-bold tracking-[-0.045em] text-[#f2f4ef] focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
        >
          SKILLSWAP<span className="text-[#c7ff39]">+</span>
        </Link>

        <span className="text-[10px] uppercase tracking-[0.18em] text-[#a1a1aa]">
          Set up your profile
        </span>
      </div>
    </header>
  );
}
