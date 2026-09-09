import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "../lib/ThemeContext";

const links = [
  ["Discover", "#discover"],
  ["How it works", "#how-it-works"],
  ["Community", "#community"],
  ["FAQ", "#faq"],
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", open);
    return () => document.body.classList.remove("overflow-hidden");
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-[#080a09]/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8 lg:px-10">
        <a
          href="#top"
          className="group inline-flex items-center gap-2 rounded-sm text-xl font-black tracking-[-0.045em] text-white outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807] md:text-2xl"
          aria-label="SkillSwap home"
        >
          <span className="relative">SKILLSWAP</span>
          <span className="text-[#c7ff39] transition-transform duration-300 group-hover:rotate-12">+</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
          {links.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="rounded-sm text-sm font-medium text-zinc-400 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={toggleTheme}
            className="grid h-10 w-10 place-items-center rounded-sm border border-white/15 text-zinc-400 transition hover:border-white/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
            aria-label={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} theme`}
            title={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} theme`}
          >
            {resolvedTheme === "light" ? <Moon size={17} /> : <Sun size={17} />}
          </button>
          <Link
            to="/login"
            className="rounded-sm px-3 py-2 text-sm text-zinc-400 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="inline-flex min-h-11 items-center justify-center bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008] transition hover:bg-[#d4ff67] focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
          >
            Join SkillSwap+
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="grid h-11 w-11 place-items-center border border-white/15 text-white transition hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807] md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <div
        id="mobile-menu"
        className={`absolute inset-x-0 top-0 z-50 min-h-screen bg-[#060807] px-5 pt-5 md:hidden ${
          open ? "block" : "hidden"
        }`}
      >
        <div className="flex items-center justify-between">
          <a href="#top" onClick={() => setOpen(false)} className="text-2xl font-black tracking-[-0.045em] text-white">
            SKILLSWAP<span className="text-[#c7ff39]">+</span>
          </a>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-11 w-11 place-items-center border border-white/15 text-white"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="mt-20 flex flex-col border-t border-white/10">
          {links.map(([label, href]) => (
            <a
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className="border-b border-white/10 py-5 text-2xl tracking-tight text-zinc-300"
            >
              {label}
            </a>
          ))}
          <Link
            to="/signup"
            onClick={() => setOpen(false)}
            className="mt-8 inline-flex min-h-12 items-center justify-center bg-[#c7ff39] px-6 font-semibold text-[#071008]"
          >
            Join SkillSwap+
          </Link>
        </nav>
      </div>
    </header>
  );
}
