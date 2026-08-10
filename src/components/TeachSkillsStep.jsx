import { Trash2 } from "lucide-react";
import SkillSearch from "./SkillSearch";

export default function TeachSkillsStep({
  skills,
  selected,
  setSelected,
  skillMap,
  role,
  required,
}) {
  const excludedIds = new Set(
    selected.map((item) => item.skill_id)
  );

  const addSkill = (skill) => {
    setSelected((current) => [
      ...current,
      {
        skill_id: skill.id,
        proficiency_level: "intermediate",
        years_experience: 0,
      },
    ]);
  };

  const update = (skillId, field, value) => {
    setSelected((current) =>
      current.map((item) =>
        item.skill_id === skillId
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const remove = (skillId) => {
    setSelected((current) =>
      current.filter(
        (item) => item.skill_id !== skillId
      )
    );
  };

  const roleLabel =
    role === "learner"
      ? "Learner"
      : role === "mentor"
      ? "Mentor"
      : role === "swap_master"
      ? "Swap Master"
      : "";

  return (
    <div>
      {/* Heading */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-medium tracking-[-0.035em] md:text-3xl">
            What can you teach?
          </h2>

          <span
            className={`border px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] ${
              required
                ? "border-[#c7ff39]/30 bg-[#c7ff39]/[0.05] text-[#c7ff39]"
                : "border-white/10 text-[#a1a1aa]"
            }`}
          >
            {required ? "Required" : "Optional"}
          </span>
        </div>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a1a1aa]">
          {role === "learner"
            ? "Teaching is optional for learners. If you already have a skill you can share with others, you can add it here and earn SS Credits by teaching."
            : role === "mentor"
            ? "As a Mentor, add at least one skill you can confidently teach. You can earn SS Credits by helping other members learn."
            : role === "swap_master"
            ? "As a Swap Master, add at least one skill you can teach. Swap Masters both teach and learn through skill exchanges."
            : "Add skills you can confidently share with another member."}
        </p>

        {roleLabel && (
          <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-white/30">
            Account type · {roleLabel}
          </p>
        )}
      </div>

      {/* Search */}
      <SkillSearch
        skills={skills}
        excludedIds={excludedIds}
        onSelect={addSkill}
        placeholder="Search a skill you can teach"
      />

      {/* Selected skills */}
      <div className="mt-6 space-y-3">
        {selected.length === 0 ? (
          <div className="border border-dashed border-white/15 px-5 py-10 text-center">
            <p className="text-sm text-[#a1a1aa]">
              {required
                ? "You haven't added a teaching skill yet."
                : "No teaching skills added. That's completely optional for your role."}
            </p>

            {required && (
              <p className="mt-2 text-xs text-white/35">
                Add at least one skill to continue.
              </p>
            )}
          </div>
        ) : (
          selected.map((item, index) => {
            const skill = skillMap.get(item.skill_id);

            return (
              <div
                key={item.skill_id}
                className="grid gap-4 border border-white/10 bg-[#0a0d0b]/70 p-5 md:grid-cols-[1fr_170px_150px_auto] md:items-end"
              >
                {/* Skill */}
                <div>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">
                    Teaching {String(index + 1).padStart(2, "0")}
                  </span>

                  <h3 className="mt-2 text-lg font-medium">
                    {skill?.name || "Selected skill"}
                  </h3>

                  {skill?.description && (
                    <p className="mt-1 max-w-md text-sm leading-5 text-[#a1a1aa]">
                      {skill.description}
                    </p>
                  )}
                </div>

                {/* Proficiency */}
                <label className="text-xs text-[#a1a1aa]">
                  Proficiency

                  <select
                    value={item.proficiency_level}
                    onChange={(event) =>
                      update(
                        item.skill_id,
                        "proficiency_level",
                        event.target.value
                      )
                    }
                    className="mt-2 min-h-11 w-full border border-white/15 bg-[#060807] px-3 text-sm text-white transition hover:border-white/25 focus:border-[#c7ff39]/70 focus:outline-none focus:ring-1 focus:ring-[#c7ff39]/30"
                  >
                    <option value="beginner">
                      Beginner
                    </option>

                    <option value="intermediate">
                      Intermediate
                    </option>

                    <option value="advanced">
                      Advanced
                    </option>

                    <option value="expert">
                      Expert
                    </option>
                  </select>
                </label>

                {/* Experience */}
                <label className="text-xs text-[#a1a1aa]">
                  Years experience

                  <input
                    type="number"
                    min="0"
                    max="60"
                    step="0.5"
                    value={item.years_experience}
                    onChange={(event) =>
                      update(
                        item.skill_id,
                        "years_experience",
                        Number(event.target.value)
                      )
                    }
                    className="mt-2 min-h-11 w-full border border-white/15 bg-[#060807] px-3 text-sm text-white transition hover:border-white/25 focus:border-[#c7ff39]/70 focus:outline-none focus:ring-1 focus:ring-[#c7ff39]/30"
                  />
                </label>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => remove(item.skill_id)}
                  aria-label={`Remove ${
                    skill?.name || "skill"
                  }`}
                  className="grid h-11 w-11 place-items-center border border-white/15 text-[#a1a1aa] transition hover:border-[#ff6b6b]/40 hover:text-[#ff8b8b] focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
                >
                  <Trash2
                    size={16}
                    strokeWidth={1.5}
                  />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Role rule */}
      <div className="mt-6 border-l border-white/10 pl-4">
        {role === "learner" && (
          <p className="text-xs leading-5 text-[#a1a1aa]">
            <span className="text-[#c7ff39]">
              Learner:
            </span>{" "}
            Teaching is optional. You can continue without adding
            a teaching skill.
          </p>
        )}

        {role === "mentor" && (
          <p className="text-xs leading-5 text-[#a1a1aa]">
            <span className="text-[#c7ff39]">
              Mentor:
            </span>{" "}
            Add at least one skill you can teach. Learning skills
            are optional.
          </p>
        )}

        {role === "swap_master" && (
          <p className="text-xs leading-5 text-[#a1a1aa]">
            <span className="text-[#c7ff39]">
              Swap Master:
            </span>{" "}
            At least one teaching skill and one learning skill are
            required.
          </p>
        )}
      </div>

      {/* SS Credit explanation */}
      <div className="mt-6 border border-[#c7ff39]/15 bg-[#c7ff39]/[0.025] p-4">
        <p className="text-xs uppercase tracking-[0.15em] text-[#c7ff39]">
          Earn SS Credits
        </p>

        <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
          Teaching other SkillSwap+ members can earn you SS Credits.
          Your teaching skills help learners find you for relevant
          sessions and exchanges.
        </p>
      </div>
    </div>
  );
}