const TRUSTS = [
  { value: "10K+", label: "Active Learners" },
  { value: "500+", label: "Available Skills" },
  { value: "95%", label: "Match Success" },
  { value: "24/7", label: "Community Support" },
];

export default function TrustedBy() {
  return (
    <section className="relative bg-gradient-to-br from-[#ECFDF5] via-white to-[#D1FAE5] text-slate-950 py-20 overflow-hidden">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(5,150,105,0.16),transparent_26%)]" />
      <div className="relative w-full px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
            Trusted by learners worldwide
          </span>
          <h2 className="mt-6 text-3xl sm:text-4xl font-extrabold tracking-tight">
            A community built for skill swaps, not subscriptions.
          </h2>
          <p className="mt-4 text-slate-700">
            Skill Swap+ helps learners and teachers trade knowledge with clear goals, fast connections, and trusted match recommendations.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRUSTS.map((stat) => (
            <div key={stat.label} className="rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-sm shadow-slate-950/5">
              <p className="text-4xl font-extrabold text-slate-950">{stat.value}</p>
              <p className="mt-3 text-sm text-slate-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
