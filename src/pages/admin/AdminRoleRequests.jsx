import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Check,
  Loader2,
  UserCog,
  X,
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
      timeStyle: "short",
    }
  ).format(
    new Date(value)
  );
}

export default function AdminRoleRequests() {
  const [requests, setRequests] =
    useState([]);

  const [status, setStatus] =
    useState("Pending");

  const [loading, setLoading] =
    useState(true);

  const [actionId, setActionId] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const loadRequests =
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
              "admin_list_role_requests",
              {
                p_status:
                  status || null,
              }
            );

          if (rpcError) {
            throw rpcError;
          }

          setRequests(
            data || []
          );
        } catch (err) {
          setError(
            err?.message ||
              "Could not load role requests."
          );
        } finally {
          setLoading(false);
        }
      },
      [status]
    );

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const review =
    async (
      request,
      decision
    ) => {
      const key =
        `request-${request.request_id}`;

      try {
        setActionId(key);
        setError("");
        setSuccess("");

        const {
          error: rpcError,
        } =
          await supabase.rpc(
            "admin_review_role_request",
            {
              p_request_id:
                request.request_id,
              p_decision:
                decision,
              p_note:
                null,
            }
          );

        if (rpcError) {
          throw rpcError;
        }

        setSuccess(
          decision ===
            "Approved"
            ? "Role request approved."
            : "Role request rejected."
        );

        await loadRequests();
      } catch (err) {
        setError(
          err?.message ||
            "Role request could not be reviewed."
        );
      } finally {
        setActionId("");
      }
    };

  return (
    <div className="admin-page mx-auto max-w-[1350px] px-5 py-8 md:px-8 lg:px-10 lg:py-10">
      <div className="admin-page-header flex flex-col justify-between gap-5 border-b border-white/10 pb-7 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 text-[#c7ff39]">
            <UserCog size={16} />

            <p className="text-[10px] uppercase tracking-[0.18em]">
              Role moderation
            </p>
          </div>

          <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em]">
            Role requests.
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#a1a1aa]">
            Approve or reject requests to move between Learner, Mentor, and Swap Master.
          </p>
        </div>

        <select
          value={status}
          onChange={(event) =>
            setStatus(
              event.target.value
            )
          }
          className="min-h-10 border border-white/10 bg-[#060807] px-3 text-xs outline-none"
        >
          <option value="">
            All
          </option>

          <option value="Pending">
            Pending
          </option>

          <option value="Approved">
            Accepted
          </option>

          <option value="Rejected">
            Rejected
          </option>
        </select>
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

      <div className="mt-6 grid gap-4">
        {loading ? (
          <div className="grid min-h-[280px] place-items-center">
            <Loader2
              size={22}
              className="animate-spin text-[#c7ff39]"
            />
          </div>
        ) : requests.length ===
          0 ? (
          <div className="border border-white/10 bg-[#0a0d0b]/80 p-10 text-center text-sm text-[#a1a1aa]">
            No role requests found.
          </div>
        ) : (
          requests.map(
            (request) => {
              const busy =
                actionId ===
                `request-${request.request_id}`;

              return (
                <article
                  key={
                    request.request_id
                  }
                  className="admin-panel p-5 transition hover:border-white/20"
                >
                  <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-medium">
                          {request.full_name ||
                            request.username}
                        </h2>

                        <span
                          className={`border px-2 py-1 text-[9px] uppercase tracking-[0.12em] ${
                            request.status ===
                            "Approved"
                              ? "border-[#c7ff39]/25 text-[#c7ff39]"
                              : request.status ===
                                  "Rejected"
                                ? "border-[#ff6b6b]/25 text-[#ff8b8b]"
                                : "border-[#ffbf69]/25 text-[#ffca80]"
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-[#a1a1aa]">
                        @{request.username}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                        <span className="border border-white/10 px-3 py-2">
                          {request.from_role}
                        </span>

                        <span className="text-[#c7ff39]">
                          →
                        </span>

                        <span className="border border-[#c7ff39]/20 px-3 py-2 text-[#c7ff39]">
                          {request.requested_role}
                        </span>
                      </div>

                      {request.reason && (
                        <div className="mt-4 border-l border-white/10 pl-4">
                          <p className="text-[9px] uppercase tracking-[0.13em] text-white/30">
                            Reason
                          </p>

                          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#a1a1aa]">
                            {request.reason}
                          </p>
                        </div>
                      )}

                      <p className="mt-4 text-[10px] text-white/30">
                        Requested{" "}
                        {formatDate(
                          request.created_at
                        )}
                      </p>
                    </div>

                    {request.status ===
                      "Pending" && (
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            review(
                              request,
                              "Approved"
                            )
                          }
                          className="inline-flex min-h-10 items-center gap-2 bg-[#c7ff39] px-4 text-xs font-semibold text-[#071008] disabled:opacity-50"
                        >
                          {busy ? (
                            <Loader2
                              size={13}
                              className="animate-spin"
                            />
                          ) : (
                            <Check
                              size={13}
                            />
                          )}

                          Approve
                        </button>

                        <button
                          type="button"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            review(
                              request,
                              "Rejected"
                            )
                          }
                          className="inline-flex min-h-10 items-center gap-2 border border-[#ff6b6b]/30 px-4 text-xs text-[#ff8b8b] disabled:opacity-50"
                        >
                          <X size={13} />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            }
          )
        )}
      </div>
    </div>
  );
}
