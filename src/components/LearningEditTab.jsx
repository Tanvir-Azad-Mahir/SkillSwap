import { BookOpen, Trash2 } from "lucide-react";
import EditProfileSkillSearch from "./EditProfileSkillSearch";

export default function LearningEditTab({
  skills,
  selected,
  setSelected,
  skillMap,
  required,
}) {
  const excludedIds = new Set(selected.map((item) => item.skill_id));

  const addSkill = (skill) => {
    setSelected((current) => [
      ...current,
      {
        skill_id: skill.id,
        interest_text: "",
        weight: 3,
      },
    ]);
  };

  const updateSkill = (skillId, field, value) => {
    setSelected((current) =>
      current.map((item) =>
        item.skill_id === skillId
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const removeSkill = (skillId) => {
    setSelected((current) =>
      current.filter((item) => item.skill_id !== skillId)
    );
  };

  return (
    <div className="p-5 md:p-8">
      <div className="border-b border-white/10 pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <BookOpen
            size={20}
            strokeWidth={1.4}
            className="text-[#c7ff39]"
          />

          <p className="text-[10px] uppercase tracking-[0.17em] text-[#a1a1aa]">
            Learning interests
          </p>

          {required && (
            <span className="border border-[#c7ff39]/20 px-2 py-1 text-[9px] uppercase tracking-[0.13em] text-[#c7ff39]">
              Required for your role
            </span>
          )}
        </div>

        <h2 className="mt-3 text-2xl font-medium tracking-[-0.035em]">
          What do you want to learn?
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a1a1aa]">
          Your learning interests help SkillSwap+ recommend mentors and future
          learning opportunities.
        </p>
      </div>

      <div className="mt-6">
        <EditProfileSkillSearch
          skills={skills}
          excludedIds={excludedIds}
          onSelect={addSkill}
          placeholder="Search and add a learning skill..."
        />
      </div>

      <div className="mt-6 space-y-3">
        {selected.length === 0 ? (
          <div className="border border-dashed border-white/10 px-5 py-10 text-center text-sm text-[#a1a1aa]">
            No learning skills added.
          </div>
        ) : (
          selected.map((item) => {
            const skill = skillMap.get(item.skill_id);

            return (
              <div
                key={item.skill_id}
                className="grid gap-4 border border-white/[0.08] bg-[#060807] p-4 md:grid-cols-[1fr_180px_42px] md:items-end"
              >
                <div>
                  <p className="text-sm font-medium">
                    {skill?.name || "Skill"}
                  </p>

                  <input
                    value={item.interest_text || ""}
                    onChange={(event) =>
                      updateSkill(
                        item.skill_id,
                        "interest_text",
                        event.target.value
                      )
                    }
                    placeholder="Optional note, e.g. want to build real projects"
                    className="mt-2 min-h-9 w-full border border-white/[0.08] bg-[#0a0d0b] px-3 text-xs text-white placeholder:text-white/20 focus:border-[#c7ff39]/40 focus:outline-none"
                  />
                </div>

                <label>
                  <span className="mb-2 block text-[10px] uppercase tracking-[0.13em] text-white/35">
                    Priority
                  </span>

                  <select
                    value={item.weight ?? 3}
                    onChange={(event) =>
                      updateSkill(
                        item.skill_id,
                        "weight",
                        Number(event.target.value)
                      )
                    }
                    className="min-h-10 w-full border border-white/10 bg-[#0a0d0b] px-3 text-xs text-white focus:border-[#c7ff39]/45 focus:outline-none"
                  >
                    <option value={1}>1 — Low</option>
                    <option value={2}>2</option>
                    <option value={3}>3 — Medium</option>
                    <option value={4}>4</option>
                    <option value={5}>5 — High</option>
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() => removeSkill(item.skill_id)}
                  className="grid h-10 w-10 place-items-center border border-white/10 text-[#a1a1aa] transition hover:border-[#ff6b6b]/30 hover:text-[#ff8b8b]"
                  aria-label={`Remove ${skill?.name || "skill"}`}
                >
                  <Trash2 size={15} strokeWidth={1.5} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
