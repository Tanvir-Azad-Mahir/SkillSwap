import { Trash2 } from "lucide-react";
import SkillSearch from "./SkillSearch";

export default function LearnSkillsStep({
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
        interest_text: "",
        weight: 3,
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
            What do you want to learn?
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
          {role === "mentor"
            ? "Learning is optional for mentors. Add a skill if there is something new you would also like to learn from the SkillSwap+ community."
            : role === "swap_master"
            ? "As a Swap Master, add at least one skill you want to learn. You will exchange knowledge by both learning and teaching."
            : "Add at least one skill you want to learn. These interests help SkillSwap+ find relevant mentors, sessions and exchanges for you."}
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
        placeholder="Search a skill you want to learn"
      />

      {/* Selected skills */}
      <div className="mt-6 space-y-3">
        {selected.length === 0 ? (
          <div className="border border-dashed border-white/15 px-5 py-10 text-center">
            <p className="text-sm text-[#a1a1aa]">
              {required
                ? "You haven't added a learning skill yet."
                : "No learning skills added. That's completely optional for your role."}
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
                className="border border-white/10 bg-[#0a0d0b]/70 p-5"
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">
                      Learning {String(index + 1).padStart(2, "0")}
                    </span>

                    <h3 className="mt-2 text-lg font-medium">
                      {skill?.name || "Selected skill"}
                    </h3>

                    {skill?.description && (
                      <p className="mt-1 max-w-xl text-sm leading-6 text-[#a1a1aa]">
                        {skill.description}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(item.skill_id)}
                    aria-label={`Remove ${
                      skill?.name || "skill"
                    }`}
                    className="grid h-10 w-10 shrink-0 place-items-center border border-white/15 text-[#a1a1aa] transition hover:border-[#ff6b6b]/40 hover:text-[#ff8b8b] focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
                  >
                    <Trash2
                      size={16}
                      strokeWidth={1.5}
                    />
                  </button>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-[1fr_190px]">
                  {/* Goal */}
                  <label className="text-xs text-[#a1a1aa]">
                    What do you want to achieve?
                    <span className="ml-1 text-white/30">
                      Optional
                    </span>

                    <input
                      value={item.interest_text}
                      onChange={(event) =>
                        update(
                          item.skill_id,
                          "interest_text",
                          event.target.value
                        )
                      }
                      placeholder="e.g. Build responsive React interfaces confidently"
                      className="mt-2 min-h-11 w-full border border-white/15 bg-[#060807] px-3 text-sm text-white placeholder:text-white/25 transition hover:border-white/25 focus:border-[#c7ff39]/70 focus:outline-none focus:ring-1 focus:ring-[#c7ff39]/30"
                    />
                  </label>

                  {/* Priority */}
                  <label className="text-xs text-[#a1a1aa]">
                    Priority

                    <select
                      value={item.weight}
                      onChange={(event) =>
                        update(
                          item.skill_id,
                          "weight",
                          Number(event.target.value)
                        )
                      }
                      className="mt-2 min-h-11 w-full border border-white/15 bg-[#060807] px-3 text-sm text-white transition hover:border-white/25 focus:border-[#c7ff39]/70 focus:outline-none focus:ring-1 focus:ring-[#c7ff39]/30"
                    >
                      <option value={1}>1 — Low</option>
                      <option value={2}>2</option>
                      <option value={3}>3 — Medium</option>
                      <option value={4}>4</option>
                      <option value={5}>5 — High</option>
                    </select>
                  </label>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Role rule reminder */}
      <div className="mt-6 border-l border-white/10 pl-4">
        {role === "learner" && (
          <p className="text-xs leading-5 text-[#a1a1aa]">
            <span className="text-[#c7ff39]">Learner:</span>{" "}
            Add at least one skill you want to learn. Teaching skills are
            optional.
          </p>
        )}

        {role === "mentor" && (
          <p className="text-xs leading-5 text-[#a1a1aa]">
            <span className="text-[#c7ff39]">Mentor:</span>{" "}
            Learning skills are optional. You can continue without adding
            anything here.
          </p>
        )}

        {role === "swap_master" && (
          <p className="text-xs leading-5 text-[#a1a1aa]">
            <span className="text-[#c7ff39]">Swap Master:</span>{" "}
            At least one learning skill and one teaching skill are required.
          </p>
        )}
      </div>
    </div>
  );
}