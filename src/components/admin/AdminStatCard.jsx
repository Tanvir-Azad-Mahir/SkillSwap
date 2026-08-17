import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export default function AdminStatCard({ title, value, trend, trendValue, icon: Icon, isImportant }) {
  return (
    <div className="bg-[#0a0d0b] border border-white/10 p-6 flex flex-col justify-between h-full relative overflow-hidden group">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-[10px] font-semibold text-[#a1a1aa] uppercase tracking-[0.16em]">
          {title}
        </h3>
        {Icon && <Icon className="h-4 w-4 text-white/30" />}
      </div>
      
      <div>
        <div className={`text-3xl font-medium tracking-[-0.04em] mb-2 ${isImportant ? 'text-[#c7ff39]' : 'text-[#f2f4ef]'}`}>
          {value}
        </div>
        
        {trend && (
          <div className="flex items-center gap-1 text-sm">
            {trend === "up" ? (
              <ArrowUpRight className="h-4 w-4 text-[#c7ff39]" />
            ) : trend === "down" ? (
              <ArrowDownRight className="h-4 w-4 text-[#ff6b6b]" />
            ) : (
              <Minus className="h-4 w-4 text-[#a1a1aa]" />
            )}
            <span className={trend === "up" ? "text-[#c7ff39]" : trend === "down" ? "text-[#ff6b6b]" : "text-[#a1a1aa]"}>
              {trendValue}
            </span>
          </div>
        )}
      </div>

      {/* Subtle hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}
