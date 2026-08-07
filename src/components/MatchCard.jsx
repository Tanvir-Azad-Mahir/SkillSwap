export default function MatchCard({ icon: Icon, title, description, index }) {
  return (
    <article className="group border-t border-white/10 py-7 first:border-t-0 lg:border-t lg:first:border-t">
      <div className="grid gap-5 sm:grid-cols-[4rem_1fr]">
        <div className="flex h-12 w-12 items-center justify-center border border-white/15 text-zinc-500 transition duration-300 group-hover:border-[#c7ff39]/50 group-hover:text-[#c7ff39]">
          <Icon size={19} strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">0{index}</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">{title}</h3>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">{description}</p>
        </div>
      </div>
    </article>
  );
}
