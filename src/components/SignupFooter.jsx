const focusClass =
  "focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]";

export default function SignupFooter() {
  return (
    <footer className="relative z-10 border-t border-white/10">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-5 py-6 text-xs text-[#a1a1aa] sm:flex-row sm:items-center sm:justify-between md:px-8 lg:px-10">
        <p>© 2026 SkillSwap+</p>

        <div className="flex items-center gap-5">
          <a href="/privacy" className={`transition hover:text-white ${focusClass}`}>
            Privacy
          </a>
          <a href="/terms" className={`transition hover:text-white ${focusClass}`}>
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
