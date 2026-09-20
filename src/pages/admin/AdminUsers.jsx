import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Loader2,
  RefreshCw,
  Search,
  UserRound,
  Users,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
    }
  ).format(
    new Date(value)
  );
}

export default function AdminUsers() {
  const [users, setUsers] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [role, setRole] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [actionId, setActionId] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const loadUsers = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const {
          data,
          error: rpcError,
        } =
          await supabase.rpc(
            "admin_list_users",
            {
              p_search:
                search.trim() || null,
              p_role:
                role || null,
              p_active:
                status === ""
                  ? null
                  : status ===
                    "active",
            }
          );

        if (rpcError) {
          throw rpcError;
        }

        setUsers(
          data || []
        );
      } catch (err) {
        setError(
          err?.message ||
            "Could not load users."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      search,
      role,
      status,
    ]
  );

  useEffect(() => {
    loadUsers();
  }, []);

  const changeStatus =
    async (
      user
    ) => {
      const nextActive =
        !user.is_active;

      const key =
        `user-${user.id}`;

      try {
        setActionId(key);
        setError("");
        setSuccess("");

        const {
          error: rpcError,
        } =
          await supabase.rpc(
            "admin_set_user_active",
            {
              p_user_id:
                user.id,
              p_is_active:
                nextActive,
            }
          );

        if (rpcError) {
          throw rpcError;
        }

        setSuccess(
          nextActive
            ? "User activated."
            : "User suspended."
        );

        await loadUsers();
      } catch (err) {
        setError(
          err?.message ||
            "User status could not be updated."
        );
      } finally {
        setActionId("");
      }
    };

  return (
    <div className="admin-page mx-auto max-w-[1450px] px-5 py-8 md:px-8 lg:px-10 lg:py-10">
      <div className="admin-page-header border-b border-white/10 pb-7">
        <div className="flex items-center gap-2 text-[#c7ff39]">
          <Users size={16} />
          <p className="text-[10px] uppercase tracking-[0.18em]">
            Member management
          </p>
        </div>

        <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em]">
          Users.
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-7 text-[#a1a1aa]">
          Search members, inspect roles and SS balances, and suspend or reactivate accounts.
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

      <div className="admin-panel mt-6 grid gap-3 p-4 lg:grid-cols-[1fr_180px_180px_auto_auto]">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search name, username, email"
            className="min-h-11 w-full border border-white/10 bg-[#060807] pl-9 pr-3 text-sm outline-none placeholder:text-white/20 focus:border-[#c7ff39]/40"
          />
        </div>

        <select
          value={role}
          onChange={(event) =>
            setRole(
              event.target.value
            )
          }
          className="min-h-11 border border-white/10 bg-[#060807] px-3 text-sm outline-none"
        >
          <option value="">
            All roles
          </option>

          <option value="Learner">
            Learner
          </option>

          <option value="Mentor">
            Mentor
          </option>

          <option value="Swap Master">
            Swap Master
          </option>
        </select>

        <select
          value={status}
          onChange={(event) =>
            setStatus(
              event.target.value
            )
          }
          className="min-h-11 border border-white/10 bg-[#060807] px-3 text-sm outline-none"
        >
          <option value="">
            All statuses
          </option>

          <option value="active">
            Active
          </option>

          <option value="inactive">
            Suspended
          </option>
        </select>

        <button
          type="button"
          onClick={loadUsers}
          className="min-h-11 bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008]"
        >
          Apply
        </button>

        <button
          type="button"
          onClick={() => {
            setSearch("");
            setRole("");
            setStatus("");
            setTimeout(
              () =>
                loadUsers(),
              0
            );
          }}
          className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/10 px-4 text-xs text-[#a1a1aa]"
        >
          <RefreshCw size={14} />
          Reset
        </button>
      </div>

      <div className="admin-panel mt-4 overflow-x-auto">
        <table className="admin-table w-full min-w-[1100px] text-left text-sm">
          <thead className="border-b border-white/10 text-[9px] uppercase tracking-[0.14em] text-white/30">
            <tr>
              <th className="px-4 py-3">
                Member
              </th>

              <th className="px-4 py-3">
                Role
              </th>

              <th className="px-4 py-3">
                Credits
              </th>

              <th className="px-4 py-3">
                Status
              </th>

              <th className="px-4 py-3">
                Joined
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
                  colSpan="6"
                  className="px-4 py-12 text-center"
                >
                  <Loader2
                    size={20}
                    className="mx-auto animate-spin text-[#c7ff39]"
                  />
                </td>
              </tr>
            ) : users.length ===
              0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-12 text-center text-sm text-[#a1a1aa]"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              users.map(
                (user) => {
                  const busy =
                    actionId ===
                    `user-${user.id}`;

                  return (
                    <tr
                      key={
                        user.id
                      }
                      className="border-b border-white/[0.06] last:border-0"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <img
                              src={
                                user.avatar_url
                              }
                              alt={
                                user.full_name ||
                                user.username ||
                                "User"
                              }
                              className="h-11 w-11 shrink-0 rounded-full border border-white/10 object-cover"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.02]">
                              <UserRound
                                size={17}
                                className="text-white/25"
                              />
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {user.full_name ||
                                user.username}
                            </p>

                            <p className="mt-1 truncate text-xs text-[#a1a1aa]">
                              {user.email}
                            </p>

                            <p className="mt-1 truncate text-[10px] text-white/25">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {user.role}
                      </td>

                      <td className="px-4 py-4 font-medium text-[#c7ff39]">
                        {user.credits} SS
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex border px-2 py-1 text-[9px] uppercase tracking-[0.12em] ${
                            user.is_active
                              ? "border-[#c7ff39]/25 text-[#c7ff39]"
                              : "border-[#ff6b6b]/25 text-[#ff8b8b]"
                          }`}
                        >
                          {user.is_active
                            ? "Active"
                            : "Suspended"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-xs text-[#a1a1aa]">
                        {formatDate(
                          user.created_at
                        )}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            changeStatus(
                              user
                            )
                          }
                          className={`inline-flex min-h-9 items-center gap-2 border px-3 text-xs disabled:opacity-50 ${
                            user.is_active
                              ? "border-[#ff6b6b]/30 text-[#ff8b8b]"
                              : "border-[#c7ff39]/30 text-[#c7ff39]"
                          }`}
                        >
                          {busy && (
                            <Loader2
                              size={12}
                              className="animate-spin"
                            />
                          )}

                          {user.is_active
                            ? "Suspend"
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
