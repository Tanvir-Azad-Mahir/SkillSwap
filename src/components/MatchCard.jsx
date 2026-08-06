import { ArrowRightLeft } from "lucide-react";

export default function MatchCard({ you, match, percent }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8 grid md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{you.label}</p>
        <p className="mt-2 font-bold text-[#0B1B33]">{you.name}</p>
        <p className="mt-3 text-xs text-slate-500">I can teach</p>
        <p className="text-sm font-medium text-[#2F6FED]">{you.teaches}</p>
        <p className="mt-2 text-xs text-slate-500">I want to learn</p>
        <p className="text-sm font-medium text-[#0B1B33]">{you.wants}</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="w-14 h-14 rounded-full bg-[#ECFDF3] flex items-center justify-center">
          <ArrowRightLeft className="w-6 h-6 text-[#16A34A]" strokeWidth={2.5} />
        </div>
        <span className="text-xs font-bold text-[#16A34A] whitespace-nowrap">
          {percent}% Match
        </span>
      </div>

      <div className="md:text-right">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{match.label}</p>
        <p className="mt-2 font-bold text-[#0B1B33]">{match.name}</p>
        <p className="mt-3 text-xs text-slate-500">Can teach</p>
        <p className="text-sm font-medium text-[#16A34A]">{match.teaches}</p>
        <p className="mt-2 text-xs text-slate-500">Wants to learn</p>
        <p className="text-sm font-medium text-[#0B1B33]">{match.wants}</p>
        <button className="mt-4 text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#0F766E] rounded-full px-5 py-2.5 transition-colors">
          Connect
        </button>
      </div>
    </div>
  );
}
