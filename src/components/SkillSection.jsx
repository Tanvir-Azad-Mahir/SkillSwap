import { Plus, Sparkles } from "lucide-react";

export default function SkillSection({
  type,
  title,
  eyebrow,
  items = [],
  onAdd,
}) {
  const isLearning = type === "learning";

  return (
    <section className="border border-white/10 bg-[#0a0d0b]/65">
      <div className="flex items-end justify-between border-b border-white/10 p-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#a1a1aa]">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-medium tracking-[-0.03em]">
            {title}
          </h2>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="grid h-9 w-9 place-items-center border border-white/10 text-[#a1a1aa] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"
        >
          <Plus size={16} strokeWidth={1.6} />
        </button>
      </div>

      <div className="p-5">
        {items.length === 0 ? (
          <div className="grid min-h-[180px] place-items-center border border-dashed border-white/10 p-6 text-center">
            <div>
              <Sparkles
                size={20}
                strokeWidth={1.4}
                className="mx-auto text-white/25"
              />
              <p className="mt-3 text-sm text-[#a1a1aa]">
                {isLearning
                  ? "No learning skills added."
                  : "No teaching skills added."}
              </p>
              <button
                type="button"
                onClick={onAdd}
                className="mt-3 text-xs font-medium text-[#c7ff39] hover:underline"
              >
                Add a skill →
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {items.slice(0, 5).map((item, index) => (
              <div
                key={item.id || item.skill_id}
                className="flex items-center justify-between gap-4 border border-white/[0.07] bg-[#060807] px-4 py-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {item.skill?.name || "Skill"}
                  </p>

                  <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/30">
                    {isLearning
                      ? `Priority ${item.weight ?? 3}/5`
                      : `${item.proficiency_level || "intermediate"} · ${
                          Number(item.years_experience || 0)
                        } yrs`}
                  </p>
                </div>

                <span className="text-[10px] tabular-nums text-white/20">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
