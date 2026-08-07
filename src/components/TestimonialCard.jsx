import { Plus } from "lucide-react";

export default function TestimonialCard({ question, answer, open, onClick }) {
  return (
    <article className="border-t border-white/10 last:border-b">
      <button
        type="button"
        onClick={onClick}
        className="group flex w-full items-center justify-between gap-5 py-6 text-left focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-inset"
        aria-expanded={open}
      >
        <span className="text-lg font-medium text-white md:text-xl">{question}</span>
        <span className={`grid h-9 w-9 shrink-0 place-items-center border border-white/15 text-zinc-400 transition duration-300 ${open ? "rotate-45 border-[#c7ff39]/50 text-[#c7ff39]" : "group-hover:text-white"}`}>
          <Plus size={17} />
        </span>
      </button>
      <div className={`faq-grid ${open ? "is-open" : ""}`}>
        <div className="overflow-hidden">
          <p className="max-w-3xl pb-7 pr-12 text-sm leading-7 text-zinc-400">{answer}</p>
        </div>
      </div>
    </article>
  );
}
