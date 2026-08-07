export default function StatsCounter({ value, label, suffix }) {
  return (
    <div className="px-0 py-7 sm:px-7 md:py-8">
      <div className="flex items-end gap-1 text-[#c7ff39]">
        <span className="text-4xl font-semibold tracking-[-0.045em] md:text-5xl">{value}</span>
        {suffix && <span className="mb-1 text-sm font-semibold">{suffix}</span>}
      </div>
      <p className="mt-2 text-sm text-zinc-400">{label}</p>
    </div>
  );
}
