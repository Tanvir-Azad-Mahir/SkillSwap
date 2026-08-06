import { ArrowRightLeft, Sparkles, Users, ShieldCheck } from "lucide-react";
import logo from "../assets/logo.png";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,#96F7B1_0%,rgba(255,255,255,0.5)_45%),radial-gradient(circle_at_bottom_right,#54D58A_0%,rgba(255,255,255,0.6)_40%),linear-gradient(180deg,#D8FFE4_0%,#FFFFFF_100%)] text-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.16),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_24%)]" />
      <div className="relative mx-auto flex max-w-7xl flex-col px-6 py-24 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-8 lg:max-w-xl">
          <div className="inline-flex items-center gap-3 rounded-full bg-white/80 px-4 py-3 text-sm font-semibold uppercase tracking-[0.32em] text-slate-950 ring-1 ring-slate-200 backdrop-blur-sm">
            <img src={logo} alt="Skill Swap+" className="h-10 w-10 object-contain" />
            <span>Now live</span>
          </div>

          <div className="space-y-5">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
              Swap skills with confidence and grow your network without course fees.
            </h1>
            <p className="text-lg leading-relaxed text-slate-700">
              Skill Swap+ brings learners and teachers together for fast, friendly skill exchanges—no subscriptions, no hidden costs.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <a
              href="#skills"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-800"
            >
              Explore Skills
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/90 px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:border-slate-400"
            >
              How it works
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 px-5 py-4">
              <p className="text-sm text-slate-600">No monthly fees</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">Pay only with skills</p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 px-5 py-4">
              <p className="text-sm text-slate-600">Verified exchanges</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">Trusted partnerships</p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 px-5 py-4">
              <p className="text-sm text-slate-600">Global community</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">Creators worldwide</p>
            </div>
          </div>
        </div>

        <div className="relative mt-14 lg:mt-0 lg:w-[520px]">
          <div className="absolute -left-16 top-14 h-64 w-64 rounded-full bg-[#34D399]/20 blur-3xl" />
          <div className="absolute -right-10 bottom-16 h-56 w-56 rounded-full bg-[#6EE7B7]/20 blur-3xl" />

          <div className="relative rounded-[2.5rem] border border-slate-200/70 bg-white/90 p-6 shadow-2xl shadow-slate-950/10 backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between gap-3 rounded-3xl bg-slate-100 px-4 py-3 text-slate-950">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Featured swap</p>
                <p className="mt-1 text-sm text-slate-700">Creative portfolio exchange</p>
              </div>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>

            <div className="rounded-[2rem] bg-slate-50 p-5 shadow-inner shadow-slate-950/10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-emerald-700">You teach</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">UX design</p>
                </div>
                <div className="rounded-3xl bg-emerald-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  Matched
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <div className="rounded-3xl bg-white p-4 shadow-sm shadow-slate-950/5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Partner</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">Maya • Python mentor</p>
                </div>
                <div className="rounded-3xl bg-white p-4 shadow-sm shadow-slate-950/5">
                  <div className="flex items-center justify-between text-slate-500 text-sm">
                    <span>Swap length</span>
                    <span>2 hrs</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-slate-900 text-sm">
                    <span>Status</span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Confirmed</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-3xl bg-white p-4 shadow-sm shadow-slate-950/5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Connections</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">128</p>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm shadow-slate-950/5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Success rate</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">95%</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 rounded-[2rem] bg-white/85 px-5 py-4 text-slate-700 shadow-sm shadow-slate-950/10 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-950">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              AI-powered match suggestions
            </div>
            <div className="inline-flex items-center gap-2 text-sm text-slate-700">
              <Users className="h-4 w-4 text-emerald-600" />
              10K+ learners joined
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
