import { Search, PenTool, Rocket } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: PenTool,
    label: "Step 01",
    title: "Create your profile",
    text: "List what you can teach, what you want to learn, and when you are usually available.",
  },
  {
    number: "02",
    icon: Search,
    label: "Step 02",
    title: "Build the right match",
    text: "Explore members, compare skill fit, and send a clear swap request with your learning goal.",
    featured: true,
  },
  {
    number: "03",
    icon: Rocket,
    label: "Step 03",
    title: "Start learning",
    text: "Agree on a session plan, exchange knowledge, and keep building momentum through practical practice.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="how-it-works-section py-28 md:py-36 lg:py-40">
      <div className="mx-auto max-w-7xl px-5 md:px-8 lg:px-10">
        <div className="reveal mb-12 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c7ff39]">/ How it works</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-white md:text-5xl">Three steps from curiosity to exchange.</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {steps.map(({ icon: Icon, label, title, text, featured }, index) => (
            <article
              key={title}
              className={`how-it-works-card reveal group min-h-[21rem] border border-white/15 p-7 transition duration-300 hover:border-white/30 md:p-8 ${featured ? "how-it-works-card-featured bg-[#0c120d]" : "bg-[#060807]"}`}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <div className={`how-it-works-icon flex h-12 w-12 items-center justify-center border ${featured ? "how-it-works-icon-featured border-[#c7ff39]/30 bg-[#c7ff39]/[0.06] text-[#c7ff39]" : "border-white/15 text-zinc-500"}`}>
                <Icon size={19} strokeWidth={1.5} />
              </div>
              <p className="mt-12 text-[10px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">{title}</h3>
              <p className="mt-4 text-sm leading-6 text-zinc-400">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
