import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Loader2,
  MessageSquare,
  RefreshCw,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabase";

/* =========================================================
   HELPERS
========================================================= */

function normalizeRole(value) {
  const role =
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(
        /[\s-]+/g,
        "_"
      );

  if (
    role ===
      "swapmaster" ||
    role ===
      "swap_master"
  ) {
    return "swap_master";
  }

  if (
    role === "mentor"
  ) {
    return "mentor";
  }

  if (
    role === "learner"
  ) {
    return "learner";
  }

  return role;
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

function getStatusClasses(status) {
  const clean =
    String(status || "")
      .trim()
      .toLowerCase();

  if (
    clean === "accepted"
  ) {
    return "border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] text-[#c7ff39]";
  }

  if (
    clean === "pending"
  ) {
    return "border-[#ffbf69]/25 bg-[#ffbf69]/[0.04] text-[#ffca80]";
  }

  if (
    clean === "rejected"
  ) {
    return "border-[#ff6b6b]/25 bg-[#ff6b6b]/[0.04] text-[#ff8b8b]";
  }

  if (
    clean === "completed"
  ) {
    return "border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] text-[#c7ff39]";
  }

  return "border-white/10 bg-white/[0.025] text-[#a1a1aa]";
}

const TABS = [
  {
    id: "pending",
    label: "Pending",
  },
  {
    id: "accepted",
    label: "Accepted",
  },
  {
    id: "history",
    label: "History",
  },
];

/* =========================================================
   PAGE
========================================================= */

export default function MentorshipRequests() {
  const navigate =
    useNavigate();

  const [
    profile,
    setProfile,
  ] = useState(null);

  const [
    requests,
    setRequests,
  ] = useState([]);

  const [
    tab,
    setTab,
  ] = useState(
    "pending"
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    actionId,
    setActionId,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  /* =========================================================
     LOAD
  ========================================================= */

  const load =
    useCallback(
      async (
        fullPage = false
      ) => {
        try {
          if (fullPage) {
            setLoading(true);
          } else {
            setRefreshing(true);
          }

          setError("");

          const {
            data: {
              user,
            },
            error:
              authError,
          } =
            await supabase.auth.getUser();

          if (authError) {
            throw authError;
          }

          if (!user) {
            navigate(
              "/login",
              {
                replace: true,
              }
            );

            return;
          }

          const {
            data:
              profileData,
            error:
              profileError,
          } =
            await supabase
              .from(
                "profiles"
              )
              .select(
                `
                  id,
                  username,
                  full_name,
                  avatar_url,
                  role,
                  is_active,
                  profile_completed
                `
              )
              .eq(
                "id",
                user.id
              )
              .maybeSingle();

          if (
            profileError
          ) {
            throw profileError;
          }

          if (
            !profileData
          ) {
            throw new Error(
              "PROFILE_NOT_FOUND"
            );
          }

          if (
            profileData.is_active ===
            false
          ) {
            await supabase.auth.signOut(
              {
                scope: "local",
              }
            );

            navigate(
              "/login",
              {
                replace: true,
              }
            );

            return;
          }

          const normalized =
            {
              ...profileData,
              role:
                normalizeRole(
                  profileData.role
                ),
            };

          if (
            ![
              "mentor",
              "swap_master",
            ].includes(
              normalized.role
            )
          ) {
            navigate(
              "/dashboard",
              {
                replace: true,
              }
            );

            return;
          }

          setProfile(
            normalized
          );

          const {
            data,
            error:
              requestError,
          } =
            await supabase.rpc(
              "get_my_mentorship_requests"
            );

          if (
            requestError
          ) {
            throw requestError;
          }

          setRequests(
            data || []
          );
        } catch (err) {
          console.error(
            "MENTORSHIP REQUESTS LOAD ERROR:",
            err
          );

          setError(
            err?.message ||
              "The mentorship requests could not be loaded."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [navigate]
    );

  useEffect(() => {
    load(true);
  }, [load]);

  /* =========================================================
     FILTERS
  ========================================================= */

  const counts =
    useMemo(
      () => ({
        pending:
          requests.filter(
            (item) =>
              item.status ===
              "Pending"
          ).length,

        accepted:
          requests.filter(
            (item) =>
              item.status ===
              "Accepted"
          ).length,

        history:
          requests.filter(
            (item) =>
              [
                "Rejected",
                "Completed",
                "Cancelled",
              ].includes(
                item.status
              )
          ).length,
      }),
      [requests]
    );

  const visibleRequests =
    useMemo(
      () => {
        if (
          tab === "pending"
        ) {
          return requests.filter(
            (item) =>
              item.status ===
              "Pending"
          );
        }

        if (
          tab === "accepted"
        ) {
          return requests.filter(
            (item) =>
              item.status ===
              "Accepted"
          );
        }

        return requests.filter(
          (item) =>
            [
              "Rejected",
              "Completed",
              "Cancelled",
            ].includes(
              item.status
            )
        );
      },
      [
        requests,
        tab,
      ]
    );

  /* =========================================================
     RESPOND
  ========================================================= */

  const respond =
    async (
      request,
      action
    ) => {
      if (
        !request?.request_id ||
        actionId
      ) {
        return;
      }

      const key =
        `${action}-${request.request_id}`;

      try {
        setActionId(
          key
        );

        setError("");
        setSuccess("");

        const {
          data,
          error:
            responseError,
        } =
          await supabase.rpc(
            "respond_mentorship_request",
            {
              p_request_id:
                request.request_id,
              p_action:
                action,
            }
          );

        if (
          responseError
        ) {
          throw responseError;
        }

        const nextStatus =
          data?.status ||
          (
            action ===
            "accept"
              ? "Accepted"
              : "Rejected"
          );

        setRequests(
          (current) =>
            current.map(
              (item) =>
                item.request_id ===
                request.request_id
                  ? {
                      ...item,
                      status:
                        nextStatus,
                    }
                  : item
            )
        );

        setSuccess(
          nextStatus ===
            "Accepted"
            ? `Mentorship request from ${
                request.learner_full_name ||
                request.learner_username ||
                "the learner"
              } accepted.`
            : "Mentorship request rejected."
        );
      } catch (err) {
        console.error(
          "RESPOND MENTORSHIP REQUEST ERROR:",
          err
        );

        const message =
          String(
            err?.message ||
              ""
          );

        if (
          message.includes(
            "MENTORSHIP_REQUEST_ALREADY_PROCESSED"
          )
        ) {
          setError(
            "This mentorship request has already been processed."
          );

          await load(false);
        } else if (
          message.includes(
            "SKILL_NOT_OFFERED"
          )
        ) {
          setError(
            "You can no longer accept this request because that skill is not currently one of your teaching skills."
          );
        } else {
          setError(
            err?.message ||
              "The mentorship request could not be updated."
          );
        }
      } finally {
        setActionId("");
      }
    };

  /* =========================================================
     MESSAGE LEARNER
  ========================================================= */

  const messageLearner =
    async (
      learnerId
    ) => {
      if (
        !learnerId ||
        actionId
      ) {
        return;
      }

      const key =
        `message-${learnerId}`;

      try {
        setActionId(
          key
        );

        setError("");

        const {
          data,
          error:
            conversationError,
        } =
          await supabase.rpc(
            "get_or_create_conversation",
            {
              p_other_user_id:
                learnerId,
            }
          );

        if (
          conversationError
        ) {
          throw conversationError;
        }

        if (!data) {
          throw new Error(
            "CONVERSATION_NOT_CREATED"
          );
        }

        navigate(
          `/messages/${data}`
        );
      } catch (err) {
        console.error(
          "MENTORSHIP MESSAGE ERROR:",
          err
        );

        setError(
          err?.message ||
            "The conversation could not be opened."
        );
      } finally {
        setActionId("");
      }
    };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#060807] text-[#f2f4ef]">
        <div className="noise pointer-events-none fixed inset-0" />

        <div className="relative z-10 text-center">
          <div className="mx-auto mb-5 h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-[#c7ff39]" />

          <p className="text-xs uppercase tracking-[0.18em] text-[#a1a1aa]">
            Loading mentorship requests
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060807] text-[#f2f4ef]">
      <div className="noise pointer-events-none fixed inset-0 z-0" />

      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 75% 5%, rgba(199,255,57,.055), transparent 35%)",
        }}
      />

      <div className="relative z-10">
        <header className="border-b border-white/10 bg-[#060807]/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1350px] items-center justify-between gap-4 px-5 py-4 md:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/dashboard"
                  )
                }
                className="grid h-10 w-10 shrink-0 place-items-center border border-white/10 text-[#a1a1aa] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"
              >
                <ArrowLeft
                  size={16}
                />
              </button>

              <div>
                <p className="text-[9px] uppercase tracking-[0.17em] text-[#c7ff39]">
                  {profile?.role ===
                  "swap_master"
                    ? "Swap Master"
                    : "Mentor"}
                </p>

                <h1 className="text-lg font-medium tracking-[-0.03em]">
                  Mentorship requests
                </h1>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                load(false)
              }
              disabled={
                refreshing
              }
              className="inline-flex min-h-10 items-center gap-2 border border-white/10 px-4 text-xs text-[#a1a1aa] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39] disabled:opacity-50"
            >
              <RefreshCw
                size={13}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1350px] px-5 pb-20 pt-8 md:px-8">
          <section className="overflow-hidden border border-white/10 bg-[#0a0d0b]/75">
            <div className="grid lg:grid-cols-[1fr_.72fr]">
              <div className="relative p-6 md:p-8">
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at 5% 0%, rgba(199,255,57,.07), transparent 40%)",
                  }}
                />

                <div className="relative">
                  <div className="inline-flex items-center gap-2 border border-[#c7ff39]/20 bg-[#c7ff39]/[0.04] px-3 py-1.5 text-[9px] uppercase tracking-[0.16em] text-[#c7ff39]">
                    <GraduationCap
                      size={11}
                    />

                    Mentorship
                  </div>

                  <h2 className="mt-5 max-w-2xl text-2xl font-medium tracking-[-0.045em] md:text-3xl">
                    Review learners who want to learn from you.
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[#a1a1aa]">
                    Accept a request when you are ready to mentor the learner in the requested teaching skill.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 border-t border-white/10 lg:border-l lg:border-t-0">
                <Metric
                  value={
                    counts.pending
                  }
                  label="Pending"
                />

                <Metric
                  value={
                    counts.accepted
                  }
                  label="Accepted"
                  bordered
                />

                <Metric
                  value={
                    counts.history
                  }
                  label="History"
                  bordered
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="mt-5 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm text-[#ff8b8b]">
              {
                error
              }
            </div>
          )}

          {success && (
            <div className="mt-5 border border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] px-4 py-3 text-sm text-[#c7ff39]">
              {
                success
              }
            </div>
          )}

          <div className="mt-6 flex overflow-x-auto border border-white/10 bg-[#0a0d0b]/75">
            {TABS.map(
              (item) => {
                const active =
                  item.id ===
                  tab;

                return (
                  <button
                    key={
                      item.id
                    }
                    type="button"
                    onClick={() => {
                      setTab(
                        item.id
                      );

                      setError("");
                      setSuccess("");
                    }}
                    className={`min-h-12 shrink-0 border-r border-white/10 px-5 text-xs transition ${
                      active
                        ? "bg-[#c7ff39]/[0.055] text-[#c7ff39]"
                        : "text-[#a1a1aa] hover:bg-white/[0.02] hover:text-white"
                    }`}
                  >
                    {
                      item.label
                    }

                    <span className="ml-2 text-[10px] opacity-60">
                      {
                        counts[
                          item.id
                        ]
                      }
                    </span>
                  </button>
                );
              }
            )}
          </div>

          <section className="mt-5 border border-white/10 bg-[#0a0d0b]/70">
            {visibleRequests.length >
            0 ? (
              <div>
                {visibleRequests.map(
                  (
                    request,
                    index
                  ) => (
                    <RequestCard
                      key={
                        request.request_id
                      }
                      request={
                        request
                      }
                      actionId={
                        actionId
                      }
                      onAccept={() =>
                        respond(
                          request,
                          "accept"
                        )
                      }
                      onReject={() =>
                        respond(
                          request,
                          "reject"
                        )
                      }
                      onMessage={() =>
                        messageLearner(
                          request.learner_id
                        )
                      }
                      last={
                        index ===
                        visibleRequests.length -
                          1
                      }
                    />
                  )
                )}
              </div>
            ) : (
              <div className="p-8 text-center md:p-12">
                <div className="mx-auto grid h-12 w-12 place-items-center border border-white/10 text-white/25">
                  <UserRound
                    size={19}
                  />
                </div>

                <h3 className="mt-5 text-lg font-medium tracking-[-0.03em]">
                  No {
                    tab
                  } mentorship requests.
                </h3>

                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#a1a1aa]">
                  New learner requests from your public profile will appear here.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   METRIC
========================================================= */

function Metric({
  value,
  label,
  bordered = false,
}) {
  return (
    <div
      className={`p-5 md:p-6 ${
        bordered
          ? "border-l border-white/10"
          : ""
      }`}
    >
      <p className="text-2xl font-medium tracking-[-0.05em]">
        {
          value
        }
      </p>

      <p className="mt-2 text-[9px] uppercase tracking-[0.15em] text-[#a1a1aa]">
        {
          label
        }
      </p>
    </div>
  );
}

/* =========================================================
   REQUEST CARD
========================================================= */

function RequestCard({
  request,
  actionId,
  onAccept,
  onReject,
  onMessage,
  last,
}) {
  const accepted =
    request.status ===
    "Accepted";

  const pending =
    request.status ===
    "Pending";

  const acceptKey =
    `accept-${request.request_id}`;

  const rejectKey =
    `reject-${request.request_id}`;

  const messageKey =
    `message-${request.learner_id}`;

  const busy =
    Boolean(actionId);

  const name =
    request.learner_full_name ||
    request.learner_username ||
    "Learner";

  return (
    <article
      className={`p-5 md:p-6 ${
        !last
          ? "border-b border-white/10"
          : ""
      }`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-4">
          {request.learner_avatar_url ? (
            <img
              src={
                request.learner_avatar_url
              }
              alt={
                name
              }
              className="h-12 w-12 shrink-0 border border-white/10 object-cover"
            />
          ) : (
            <div className="grid h-12 w-12 shrink-0 place-items-center border border-white/10 bg-[#060807] text-[#c7ff39]">
              <UserRound
                size={18}
              />
            </div>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-medium text-[#f2f4ef]">
                {
                  name
                }
              </h3>

              <span
                className={`border px-2 py-1 text-[8px] uppercase tracking-[0.13em] ${getStatusClasses(
                  request.status
                )}`}
              >
                {
                  request.status
                }
              </span>
            </div>

            {request.learner_username && (
              <p className="mt-1 text-xs text-white/35">
                @
                {
                  request.learner_username
                }
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
              <div>
                <p className="text-[9px] uppercase tracking-[0.14em] text-white/30">
                  Requested skill
                </p>

                <p className="mt-1 text-sm text-[#c7ff39]">
                  {
                    request.skill_name ||
                    "Teaching skill"
                  }
                </p>
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-[0.14em] text-white/30">
                  Requested
                </p>

                <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#a1a1aa]">
                  <Clock3
                    size={11}
                  />

                  {formatDate(
                    request.created_at
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {pending && (
            <>
              <button
                type="button"
                onClick={
                  onAccept
                }
                disabled={
                  busy
                }
                className="inline-flex min-h-10 items-center gap-2 bg-[#c7ff39] px-4 text-xs font-semibold text-[#071008] transition hover:bg-[#d4ff66] disabled:opacity-50"
              >
                {actionId ===
                acceptKey ? (
                  <Loader2
                    size={13}
                    className="animate-spin"
                  />
                ) : (
                  <Check
                    size={13}
                  />
                )}

                Accept
              </button>

              <button
                type="button"
                onClick={
                  onReject
                }
                disabled={
                  busy
                }
                className="inline-flex min-h-10 items-center gap-2 border border-white/10 px-4 text-xs text-[#a1a1aa] transition hover:border-[#ff6b6b]/30 hover:text-[#ff8b8b] disabled:opacity-50"
              >
                {actionId ===
                rejectKey ? (
                  <Loader2
                    size={13}
                    className="animate-spin"
                  />
                ) : (
                  <X
                    size={13}
                  />
                )}

                Reject
              </button>
            </>
          )}

          {(accepted ||
            !pending) && (
            <button
              type="button"
              onClick={
                onMessage
              }
              disabled={
                busy
              }
              className="inline-flex min-h-10 items-center gap-2 border border-white/10 px-4 text-xs text-[#a1a1aa] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39] disabled:opacity-50"
            >
              {actionId ===
              messageKey ? (
                <Loader2
                  size={13}
                  className="animate-spin"
                />
              ) : (
                <MessageSquare
                  size={13}
                />
              )}

              Message learner
            </button>
          )}

          {request.status ===
            "Completed" && (
            <span className="inline-flex min-h-10 items-center gap-2 border border-[#c7ff39]/20 px-4 text-xs text-[#c7ff39]">
              <CheckCircle2
                size={13}
              />

              Completed
            </span>
          )}

          {request.status ===
            "Rejected" && (
            <span className="inline-flex min-h-10 items-center gap-2 border border-[#ff6b6b]/20 px-4 text-xs text-[#ff8b8b]">
              <XCircle
                size={13}
              />

              Rejected
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
