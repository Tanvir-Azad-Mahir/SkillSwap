import { Star, MapPin } from "lucide-react";

export default function UserCard({ name, location, rating, offers, wants, percent, initials, color }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all">
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>
        <div>
          <p className="font-semibold text-[#0B1B33]">{name}</p>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {location}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1 text-sm">
        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
        <span className="font-medium text-[#0B1B33]">{rating}</span>
      </div>

      <div className="mt-4 space-y-1.5">
        <p className="text-xs text-slate-500">Offers</p>
        <p className="text-sm font-medium text-[#2F6FED]">{offers}</p>
        <p className="text-xs text-slate-500 mt-2">Wants</p>
        <p className="text-sm font-medium text-[#0B1B33]">{wants}</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-bold text-[#16A34A] bg-[#ECFDF3] rounded-full px-2.5 py-1">
          {percent}% Match
        </span>
      </div>

      <button className="mt-4 w-full text-sm font-semibold text-[#0B1B33] border border-slate-200 hover:border-slate-300 rounded-full py-2.5 transition-colors">
        View Profile
      </button>
    </div>
  );
}
