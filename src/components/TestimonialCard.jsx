import { Star } from "lucide-react";

export default function TestimonialCard({ name, initials, color, quote }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-lg hover:shadow-slate-200/60 transition-shadow">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-600 leading-relaxed">"{quote}"</p>
      <div className="mt-5 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>
        <p className="text-sm font-semibold text-[#0B1B33]">{name}</p>
      </div>
    </div>
  );
}
