import StatsCounter from "./StatsCounter";

export default function Stats() {
  return (
    <section id="stats" className="border-b border-white/10 bg-[#0a0d0b]">
      <div className="mx-auto grid max-w-7xl sm:grid-cols-3 sm:divide-x sm:divide-white/10">
        <StatsCounter value="12K" suffix="+" label="Members learning and teaching" />
        <StatsCounter value="34K" suffix="+" label="Skill exchanges completed" />
        <StatsCounter value="1:1" label="Human-to-human learning" />
      </div>
    </section>
  );
}
