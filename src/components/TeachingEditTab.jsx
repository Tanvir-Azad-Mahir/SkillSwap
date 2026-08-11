import { GraduationCap, Trash2 } from "lucide-react";
import EditProfileSkillSearch from "./EditProfileSkillSearch";

export default function TeachingEditTab({
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
        proficiency_level: "intermediate",
        years_experience: 0,
        is_verified: false,
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
          <GraduationCap
            size={20}
            strokeWidth={1.4}
            className="text-[#c7ff39]"
          />

          <p className="text-[10px] uppercase tracking-[0.17em] text-[#a1a1aa]">
            Teaching skills
          </p>

          {required && (
            <span className="border border-[#c7ff39]/20 px-2 py-1 text-[9px] uppercase tracking-[0.13em] text-[#c7ff39]">
              Required for your role
            </span>
          )}
        </div>

        <h2 className="mt-3 text-2xl font-medium tracking-[-0.035em]">
          What can you teach?
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a1a1aa]">
          These skills can be used to match you with learners and skill swap
          opportunities.
        </p>
      </div>

      <div className="mt-6">
        <EditProfileSkillSearch
          skills={skills}
          excludedIds={excludedIds}
          onSelect={addSkill}
          placeholder="Search and add a teaching skill..."
        />
      </div>

      <div className="mt-6 space-y-3">
        {selected.length === 0 ? (
          <div className="border border-dashed border-white/10 px-5 py-10 text-center text-sm text-[#a1a1aa]">
            No teaching skills added.
          </div>
        ) : (
          selected.map((item) => {
            const skill = skillMap.get(item.skill_id);

            return (
              <div
                key={item.skill_id}
                className="grid gap-4 border border-white/[0.08] bg-[#060807] p-4 md:grid-cols-[1fr_180px_160px_42px] md:items-end"
              >
                <div>
                  <p className="text-sm font-medium">
                    {skill?.name || "Skill"}
                  </p>
                  <p className="mt-1 text-xs text-[#a1a1aa]">
                    {skill?.description || "Teaching skill"}
                  </p>
                </div>

                <label>
                  <span className="mb-2 block text-[10px] uppercase tracking-[0.13em] text-white/35">
                    Proficiency
                  </span>

                  <select
                    value={item.proficiency_level || "intermediate"}
                    onChange={(event) =>
                      updateSkill(
                        item.skill_id,
                        "proficiency_level",
                        event.target.value
                      )
                    }
                    className="min-h-10 w-full border border-white/10 bg-[#0a0d0b] px-3 text-xs text-white focus:border-[#c7ff39]/45 focus:outline-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-[10px] uppercase tracking-[0.13em] text-white/35">
                    Years
                  </span>

                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={item.years_experience ?? 0}
                    onChange={(event) =>
                      updateSkill(
                        item.skill_id,
                        "years_experience",
                        Number(event.target.value)
                      )
                    }
                    className="min-h-10 w-full border border-white/10 bg-[#0a0d0b] px-3 text-xs text-white focus:border-[#c7ff39]/45 focus:outline-none"
                  />
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
