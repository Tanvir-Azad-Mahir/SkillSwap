import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Loader2,
  Sparkles,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

export default function AdminSkills() {
  const [skills, setSkills] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [actionId, setActionId] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const loadSkills =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const {
            data,
            error: rpcError,
          } =
            await supabase.rpc(
              "admin_list_skills"
            );

          if (rpcError) {
            throw rpcError;
          }

          setSkills(
            data || []
          );
        } catch (err) {
          setError(
            err?.message ||
              "Could not load skills."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const changeActive =
    async (
      skill
    ) => {
      const key =
        `skill-${skill.skill_id}`;

      const nextActive =
        !skill.is_active;

      try {
        setActionId(key);
        setError("");
        setSuccess("");

        const {
          error: rpcError,
        } =
          await supabase.rpc(
            "admin_set_skill_active",
            {
              p_skill_id:
                skill.skill_id,
              p_is_active:
                nextActive,
            }
          );

        if (rpcError) {
          throw rpcError;
        }

        setSuccess(
          nextActive
            ? "Skill activated."
            : "Skill deactivated."
        );

        await loadSkills();
      } catch (err) {
        setError(
          err?.message ||
            "Skill status could not be updated."
        );
      } finally {
        setActionId("");
      }
    };

  return (
    <div className="admin-page mx-auto max-w-[1250px] px-5 py-8 md:px-8 lg:px-10 lg:py-10">
      <div className="admin-page-header border-b border-white/10 pb-7">
        <div className="flex items-center gap-2 text-[#c7ff39]">
          <Sparkles size={16} />

          <p className="text-[10px] uppercase tracking-[0.18em]">
            Skill management
          </p>
        </div>

        <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em]">
          Skills.
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-7 text-[#a1a1aa]">
          Control whether existing platform skills are available to users.
        </p>
      </div>

      {error && (
        <div className="mt-6 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm text-[#ff8b8b]">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-6 border border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] px-4 py-3 text-sm text-[#c7ff39]">
          {success}
        </div>
      )}

      <div className="admin-panel mt-6 overflow-x-auto">
        <table className="admin-table w-full min-w-[850px] text-left text-sm">
          <thead className="border-b border-white/10 text-[9px] uppercase tracking-[0.14em] text-white/30">
            <tr>
              <th className="px-4 py-3">
                Skill
              </th>

              <th className="px-4 py-3">
                Difficulty
              </th>

              <th className="px-4 py-3">
                Status
              </th>

              <th className="px-4 py-3">
                Availability
              </th>

              <th className="px-4 py-3 text-right">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-4 py-12 text-center"
                >
                  <Loader2
                    size={20}
                    className="mx-auto animate-spin text-[#c7ff39]"
                  />
                </td>
              </tr>
            ) : skills.length ===
              0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-4 py-12 text-center text-[#a1a1aa]"
                >
                  No skills found.
                </td>
              </tr>
            ) : (
              skills.map(
                (skill) => {
                  const busy =
                    actionId ===
                    `skill-${skill.skill_id}`;

                  return (
                    <tr
                      key={
                        skill.skill_id
                      }
                      className="border-b border-white/[0.06] last:border-0"
                    >
                      <td className="px-4 py-4 font-medium">
                        {skill.name}
                      </td>

                      <td className="px-4 py-4 text-[#a1a1aa]">
                        {skill.difficulty}
                      </td>

                      <td className="px-4 py-4">
                        {skill.status}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex border px-2 py-1 text-[9px] uppercase tracking-[0.12em] ${
                            skill.is_active
                              ? "border-[#c7ff39]/25 text-[#c7ff39]"
                              : "border-[#ff6b6b]/25 text-[#ff8b8b]"
                          }`}
                        >
                          {skill.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            changeActive(
                              skill
                            )
                          }
                          className={`min-h-9 border px-3 text-xs disabled:opacity-50 ${
                            skill.is_active
                              ? "border-[#ff6b6b]/25 text-[#ff8b8b]"
                              : "border-[#c7ff39]/25 text-[#c7ff39]"
                          }`}
                        >
                          {busy
                            ? "Saving..."
                            : skill.is_active
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                }
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
