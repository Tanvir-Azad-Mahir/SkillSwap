import { ArrowRightLeft, Mail, Globe, Link, Code } from "lucide-react";
import logo from "../assets/logo.png";

const COLUMNS = [
  {
    title: "Platform",
    links: ["Explore Skills", "How It Works", "Community", "Testimonials"],
  },
  {
    title: "Company",
    links: ["About", "Contact", "Careers", "Blog"],
  },
  {
    title: "Support",
    links: ["Help Center", "Safety", "Community Guidelines", "FAQ"],
  },
  {
    title: "Legal",
    links: ["Privacy Policy", "Terms of Service", "Terms of Use"],
  },
];

export default function Footer() {
  return (
    <footer id="about" className="bg-slate-50 text-slate-900 py-16">
      <div className="mx-auto w-full max-w-7xl px-6">
        <div className="grid gap-10 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Skill Swap logo" className="h-[160px] w-[220px] object-contain" />
            </div>
            <p className="mt-4 text-lg font-semibold text-slate-950">Skill Swap</p>
            <p className="mt-2 max-w-sm text-sm text-slate-600">
              Swap skills, build community. Community-powered skill exchange for learners and teachers.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {[Mail, Globe, Link, Code].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700 transition hover:bg-emerald-200"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">{col.title}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-slate-600 transition hover:text-slate-950">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
          © 2026 Skill Swap+. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
