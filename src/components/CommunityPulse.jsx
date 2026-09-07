export default function CommunityPulse() {
  return (
    <div className="absolute -bottom-4 -left-4 border border-white/10 bg-[#0c120d] px-4 py-3 shadow-2xl shadow-black/30">
      <div className="flex items-center gap-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c7ff39] opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#c7ff39]" />
        </span>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Community pulse</p>
          <p className="mt-1 text-xs font-semibold text-white">117 swaps active right now</p>
        </div>
      </div>
    </div>
  );
}
