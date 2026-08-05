// Add to index.html <head>:
// <link rel="preconnect" href="https://fonts.googleapis.com">
// <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
// Then in tailwind.config.js, extend theme.fontFamily.sans with ['Plus Jakarta Sans', 'sans-serif']

import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "../assets/logo.png";

const LINKS = [
  { label: "Home", href: "#" },
  { label: "Skills", href: "#skills" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Community", href: "#community" },
  { label: "Testimonials", href: "#testimonials" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 h-24 border-b border-emerald-200/90 bg-gradient-to-r from-[#ECFDF5] via-[#D9FCE5] to-[#E8F8EE] text-slate-950 backdrop-blur-xl shadow-sm overflow-visible">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 h-full">
        <a href="#" className="flex items-center">
          <img src={logo} alt="logo" className="h-[150px] w-[200px] object-contain" />
        </a>

        <div className="hidden lg:flex items-center gap-6">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-700 transition hover:text-slate-950"
            >
              {link.label}
            </a>
          ))}
          <a href="#" className="text-sm font-medium text-slate-700 transition hover:text-slate-950">
            Log In
          </a>
          <a
            href="#"
            className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Join
          </a>
        </div>

        <button
          className="lg:hidden rounded-full border border-slate-800 bg-slate-950/90 p-2 text-slate-100 shadow-sm shadow-slate-950/30"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden rounded-b-3xl border-t border-emerald-200/80 bg-[#ECFDF5] px-6 py-4 shadow-2xl shadow-emerald-200/20">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block rounded-3xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-emerald-100"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="mt-3 flex flex-col gap-2">
            <a
              href="#"
              className="rounded-3xl border border-slate-800 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-900"
            >
              Log In
            </a>
            <a
              href="#"
              className="inline-flex justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Join Skill Swap+
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
