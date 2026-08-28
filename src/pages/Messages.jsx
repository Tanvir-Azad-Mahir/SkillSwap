import {
  ArrowLeft,
  MessageCircle,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

export default function Messages() {
  const navigate =
    useNavigate();

  return (
    <main className="relative min-h-screen bg-[#060807] text-[#f2f4ef]">
      <div className="noise pointer-events-none fixed inset-0" />

      <div className="relative z-10 mx-auto max-w-[1200px] px-5 py-10 md:px-8">
        <button
          type="button"
          onClick={() =>
            navigate("/dashboard")
          }
          className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] transition hover:text-white"
        >
          <ArrowLeft size={16} />

          Dashboard
        </button>

        <section className="mt-16 border border-white/10 bg-[#0a0d0b]/80 p-8 md:p-12">
          <div className="grid h-12 w-12 place-items-center border border-[#c7ff39]/20 bg-[#c7ff39]/[0.04] text-[#c7ff39]">
            <MessageCircle size={20} />
          </div>

          <p className="mt-6 text-[10px] uppercase tracking-[0.18em] text-[#c7ff39]">
            SkillSwap+ Messages
          </p>

          <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em]">
            Messaging is coming next.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#a1a1aa]">
            Conversations between learners,
            mentors and Swap Masters will appear
            here once real-time chat is enabled.
          </p>
        </section>
      </div>
    </main>
  );
}