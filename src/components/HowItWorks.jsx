import { UserPlus, Search, Send, Sparkles } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create your profile",
    text: "Show what you know, what you want to learn, and how you prefer to swap.",
  },
  {
    number: "02",
    icon: Search,
    title: "Find ideal matches",
    text: "Discover compatible learners and teachers based on skill and schedule.",
  },
  {
    number: "03",
    icon: Send,
    title: "Start the swap",
    text: "Agree on an exchange, meet online, and trade knowledge clearly.",
  },
  {
    number: "04",
    icon: Sparkles,
    title: "Grow together",
    text: "Complete the swap, share feedback, and improve your next match.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#ECFDF5] py-24 text-slate-950">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-emerald-700">
            How it works
          </p>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">
            Four simple steps to swap skills with confidence.
          </h2>
          <p className="mt-4 text-slate-700">
            Our guided process helps you connect, agree, and learn from each other with less friction.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.number} className="rounded-[2rem] border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-100">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
                <step.icon className="h-6 w-6" />
              </div>
              <p className="mt-6 text-sm uppercase tracking-[0.3em] text-emerald-700">Step {step.number}</p>
              <h3 className="mt-3 text-xl font-semibold text-slate-950">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
