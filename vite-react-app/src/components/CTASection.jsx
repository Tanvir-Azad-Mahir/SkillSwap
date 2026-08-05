export default function CTASection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#96F7B1] via-[#34D399] to-[#0F766E] py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_28%)]" />
      <div className="relative mx-auto max-w-5xl px-6 text-center text-slate-950">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-800/80">
          Ready to join?
        </p>
        <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
          Launch your first skill swap in minutes.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-800/80">
          Build confidence, expand your expertise, and trade knowledge in a community that rewards real exchange.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="#"
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-4 text-sm font-semibold text-white shadow-2xl shadow-slate-950/20 transition hover:bg-slate-800"
          >
            Get started for free
          </a>
          <a
            href="#about"
            className="inline-flex items-center justify-center rounded-full border border-slate-950/15 bg-white/90 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:border-slate-950"
          >
            Learn more
          </a>
        </div>
      </div>
    </section>
  );
}
