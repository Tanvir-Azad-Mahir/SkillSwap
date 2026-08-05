import { useEffect, useRef, useState } from "react";

const STATS = [
  { label: "Members", value: 10000, suffix: "+" },
  { label: "Skills", value: 500, suffix: "+" },
  { label: "Skill Swaps", value: 25000, suffix: "+" },
  { label: "Skill Categories", value: 50, suffix: "+" },
];

function Counter({ value, suffix }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1200;
          const start = performance.now();
          function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            setCount(Math.floor(progress * value));
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="text-3xl sm:text-4xl font-extrabold text-slate-950">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function Stats() {
  return (
    <section className="bg-[#D1FAE5] py-16">
      <div className="mx-auto w-full max-w-7xl px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-[2rem] bg-white p-6 shadow-sm shadow-slate-950/5">
            <Counter value={s.value} suffix={s.suffix} />
            <p className="mt-2 text-sm text-slate-700">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
