import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

const PAGE_SIZE = 50;

async function fetchAdminActivity({
  search,
  action,
  entityType,
}) {
  const {
    data: {
      user,
    },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    return [];
  }

  const {
    data,
    error: rpcError,
  } = await supabase.rpc(
    "admin_list_activity_logs",
    {
      p_search:
        search.trim() || null,
      p_action: action || null,
      p_entity_type:
        entityType || null,
      p_limit: 1000,
      p_offset: 0,
    }
  );

  if (rpcError) {
    throw rpcError;
  }

  return (data || []).filter(
    (log) => log.user_id === user.id
  );
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(
    new Date(value)
  );
}

function formatLabel(value) {
  if (!value) {
    return "—";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

export default function AdminActivityLog() {
  const [logs, setLogs] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [action, setAction] =
    useState("");

  const [
    entityType,
    setEntityType,
  ] = useState("");

  const [page, setPage] =
    useState(0);

  const [hasNextPage, setHasNextPage] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadLogs = useCallback(
    async ({
      resetPage = false,
    } = {}) => {
      try {
        setLoading(true);
        setError("");

        const targetPage =
          resetPage ? 0 : page;

        if (resetPage) {
          setPage(0);
        }

        const allAdminLogs =
          await fetchAdminActivity({
            search,
            action,
            entityType,
          });

        const start =
          targetPage * PAGE_SIZE;

        setLogs(
          allAdminLogs.slice(
            start,
            start + PAGE_SIZE
          )
        );

        setHasNextPage(
          start + PAGE_SIZE <
            allAdminLogs.length
        );
      } catch (err) {
        setError(
          err?.message ||
            "Could not load activity log."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      action,
      entityType,
      page,
      search,
    ]
  );

  useEffect(() => {
    loadLogs();
  }, [page]);

  const handleApply = () => {
    loadLogs({
      resetPage: true,
    });
  };

  const handleReset = () => {
    setSearch("");
    setAction("");
    setEntityType("");
    setPage(0);

    setTimeout(
      async () => {
        try {
          setLoading(true);
          setError("");

          const allAdminLogs =
            await fetchAdminActivity({
              search: "",
              action: "",
              entityType: "",
            });

          setLogs(
            allAdminLogs.slice(
              0,
              PAGE_SIZE
            )
          );

          setHasNextPage(
            allAdminLogs.length >
              PAGE_SIZE
          );
        } catch (err) {
          setError(
            err?.message ||
              "Could not load activity log."
          );
        } finally {
          setLoading(false);
        }
      },
      0
    );
  };

  const actionOptions =
    [
      "role_change_requested",
      "role_change_approved",
      "role_change_rejected",
      "user_activated",
      "user_suspended",
      "course_status_changed",
      "skill_status_changed",
      "mentorship_completed",
      "skill_swap_completed",
    ];

  const entityOptions =
    [
      "profile",
      "role_change_request",
      "course",
      "skill",
      "mentorship_request",
      "skill_swap",
    ];

  return (
    <div className="admin-page mx-auto max-w-[1550px] px-5 py-8 md:px-8 lg:px-10 lg:py-10">
      <div className="admin-page-header flex flex-col justify-between gap-5 border-b border-white/10 pb-7 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 text-[#c7ff39]">
            <Activity size={16} />

            <p className="text-[10px] uppercase tracking-[0.18em]">
              Audit trail
            </p>
          </div>

          <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em]">
            Activity log.
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#a1a1aa]">
            Review account, role, course, skill, mentorship, and swap activity recorded by the platform.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadLogs()
          }
          className="inline-flex min-h-10 items-center justify-center gap-2 border border-white/10 px-4 text-xs text-[#a1a1aa] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-6 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm text-[#ff8b8b]">
          {error}
        </div>
      )}

      <div className="admin-panel mt-6 grid gap-3 p-4 lg:grid-cols-[1fr_220px_220px_auto_auto]">
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
            placeholder="Search user, action, entity"
            className="min-h-11 w-full border border-white/10 bg-[#060807] pl-9 pr-3 text-sm outline-none placeholder:text-white/20 focus:border-[#c7ff39]/40"
          />
        </div>

        <select
          value={action}
          onChange={(event) =>
            setAction(
              event.target.value
            )
          }
          className="min-h-11 border border-white/10 bg-[#060807] px-3 text-sm outline-none"
        >
          <option value="">
            All actions
          </option>

          {actionOptions.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {formatLabel(
                  item
                )}
              </option>
            )
          )}
        </select>

        <select
          value={entityType}
          onChange={(event) =>
            setEntityType(
              event.target.value
            )
          }
          className="min-h-11 border border-white/10 bg-[#060807] px-3 text-sm outline-none"
        >
          <option value="">
            All entities
          </option>

          {entityOptions.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {formatLabel(
                  item
                )}
              </option>
            )
          )}
        </select>

        <button
          type="button"
          onClick={
            handleApply
          }
          className="min-h-11 bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008]"
        >
          Apply
        </button>

        <button
          type="button"
          onClick={
            handleReset
          }
          className="min-h-11 border border-white/10 px-4 text-xs text-[#a1a1aa]"
        >
          Reset
        </button>
      </div>

      <div className="admin-panel mt-4 overflow-x-auto">
        <table className="admin-table w-full min-w-[1250px] text-left text-sm">
          <thead className="border-b border-white/10 text-[9px] uppercase tracking-[0.14em] text-white/30">
            <tr>
              <th className="px-4 py-3">
                User
              </th>

              <th className="px-4 py-3">
                Action
              </th>

              <th className="px-4 py-3">
                Entity
              </th>

              <th className="px-4 py-3">
                Time
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="4"
                  className="px-4 py-14 text-center"
                >
                  <Loader2
                    size={20}
                    className="mx-auto animate-spin text-[#c7ff39]"
                  />
                </td>
              </tr>
            ) : logs.length ===
              0 ? (
              <tr>
                <td
                  colSpan="4"
                  className="px-4 py-14 text-center text-[#a1a1aa]"
                >
                  No activity found.
                </td>
              </tr>
            ) : (
              logs.map(
                (log) => (
                  <tr
                    key={log.id}
                    className="border-b border-white/[0.06] align-top last:border-0"
                  >
                    <td className="px-4 py-4">
                      <div className="flex min-w-[220px] items-center gap-3">
                        {log.avatar_url ? (
                          <img
                            src={
                              log.avatar_url
                            }
                            alt={
                              log.full_name ||
                              log.username ||
                              "User"
                            }
                            className="h-9 w-9 shrink-0 rounded-full border border-white/10 object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.02]">
                            <UserRound
                              size={15}
                              className="text-white/25"
                            />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {log.full_name ||
                              log.username ||
                              "System"}
                          </p>

                          <p className="mt-1 truncate text-[10px] text-white/30">
                            {log.username
                              ? `@${log.username}`
                              : "Admin account"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex border border-[#c7ff39]/20 bg-[#c7ff39]/[0.03] px-2 py-1 text-[10px] text-[#c7ff39]">
                        {formatLabel(
                          log.action
                        )}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-sm">
                        {formatLabel(
                          log.entity_type
                        )}
                      </p>

                      <p className="mt-1 text-[10px] text-white/30">
                        Platform record
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-xs text-[#a1a1aa]">
                      {formatDate(
                        log.created_at
                      )}
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-white/30">
          Page {page + 1}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={
              page === 0 ||
              loading
            }
            onClick={() =>
              setPage(
                (current) =>
                  Math.max(
                    0,
                    current -
                      1
                  )
              )
            }
            className="inline-flex min-h-9 items-center gap-2 border border-white/10 px-3 text-xs text-[#a1a1aa] disabled:opacity-30"
          >
            <ChevronLeft
              size={13}
            />
            Previous
          </button>

          <button
            type="button"
            disabled={
              !hasNextPage ||
              loading
            }
            onClick={() =>
              setPage(
                (current) =>
                  current + 1
              )
            }
            className="inline-flex min-h-9 items-center gap-2 border border-white/10 px-3 text-xs text-[#a1a1aa] disabled:opacity-30"
          >
            Next
            <ChevronRight
              size={13}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
