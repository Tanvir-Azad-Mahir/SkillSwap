import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  Repeat2,
  Send,
  Sparkles,
  UserRound,
  Video,
  X,
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
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
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

function toDateTimeLocalValue(
  date
) {
  const value =
    date instanceof Date
      ? date
      : new Date(date);

  if (
    Number.isNaN(
      value.getTime()
    )
  ) {
    return "";
  }

  const offset =
    value.getTimezoneOffset();

  const local =
    new Date(
      value.getTime() -
        offset * 60 * 1000
    );

  return local
    .toISOString()
    .slice(0, 16);
}

function defaultSessionTime() {
  const date =
    new Date();

  date.setDate(
    date.getDate() + 1
  );

  date.setMinutes(
    0,
    0,
    0
  );

  return toDateTimeLocalValue(
    date
  );
}

const TABS = [
  {
    id: "discover",
    label: "Discover",
  },
  {
    id: "incoming",
    label: "Incoming",
  },
  {
    id: "sent",
    label: "Sent",
  },
  {
    id: "active",
    label: "Active",
  },
  {
    id: "completed",
    label: "Completed",
  },
];

/* =========================================================
   PAGE
========================================================= */

export default function Swaps() {
  const navigate =
    useNavigate();

  const [
    user,
    setUser,
  ] = useState(null);

  const [
    profile,
    setProfile,
  ] = useState(null);

  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "discover"
  );

  const [
    matches,
    setMatches,
  ] = useState([]);

  const [
    swaps,
    setSwaps,
  ] = useState([]);

  const [
    profiles,
    setProfiles,
  ] = useState([]);

  const [
    skills,
    setSkills,
  ] = useState([]);

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
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    sessions,
    setSessions,
  ] = useState([]);

  const [
    sessionModalSwap,
    setSessionModalSwap,
  ] = useState(null);

  const [
    sessionForm,
    setSessionForm,
  ] = useState({
    title:
      "Skill swap session",
    description: "",
    scheduledAt:
      defaultSessionTime(),
    durationMinutes: 60,
  });

  /* =========================================================
     LOAD MATCHES
  ========================================================= */

  const loadMatches =
    useCallback(
      async () => {
        const {
          data,
          error:
            matchError,
        } =
          await supabase.rpc(
            "find_swap_matches"
          );

        if (matchError) {
          throw matchError;
        }

        setMatches(
          data || []
        );
      },
      []
    );

  /* =========================================================
     LOAD MY SWAPS
  ========================================================= */

  const loadSwaps =
    useCallback(
      async (
        userId
      ) => {
        if (!userId) {
          setSwaps([]);
          setProfiles([]);
          setSkills([]);
          setSessions([]);
          return;
        }

        const {
          data:
            swapData,

          error:
            swapError,
        } =
          await supabase
            .from(
              "skill_swaps"
            )
            .select(
              `
                id,
                requester_id,
                partner_id,
                requester_teaches_skill_id,
                partner_teaches_skill_id,
                status,
                requester_completed,
                partner_completed,
                reward_credits,
                created_at,
                accepted_at,
                completed_at
              `
            )
            .or(
              `requester_id.eq.${userId},partner_id.eq.${userId}`
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            );

        if (swapError) {
          throw swapError;
        }

        const rows =
          swapData || [];

        setSwaps(
          rows
        );

        const profileIds =
          [
            ...new Set(
              rows
                .flatMap(
                  (row) => [
                    row.requester_id,
                    row.partner_id,
                  ]
                )
                .filter(Boolean)
            ),
          ];

        const skillIds =
          [
            ...new Set(
              rows
                .flatMap(
                  (row) => [
                    row.requester_teaches_skill_id,
                    row.partner_teaches_skill_id,
                  ]
                )
                .filter(Boolean)
            ),
          ];

        const swapIds =
          rows
            .map(
              (row) =>
                row.id
            )
            .filter(Boolean);

        const [
          profilesResult,
          skillsResult,
          sessionsResult,
        ] =
          await Promise.all([
            profileIds.length
              ? supabase
                  .from(
                    "profiles"
                  )
                  .select(
                    `
                      id,
                      username,
                      full_name,
                      avatar_url,
                      location,
                      role,
                      is_active
                    `
                  )
                  .in(
                    "id",
                    profileIds
                  )
              : Promise.resolve({
                  data: [],
                  error: null,
                }),

            skillIds.length
              ? supabase
                  .from(
                    "skills"
                  )
                  .select(
                    `
                      id,
                      name
                    `
                  )
                  .in(
                    "id",
                    skillIds
                  )
              : Promise.resolve({
                  data: [],
                  error: null,
                }),

            swapIds.length
              ? supabase
                  .from(
                    "swap_sessions"
                  )
                  .select(
                    `
                      id,
                      swap_id,
                      title,
                      description,
                      scheduled_at,
                      duration_minutes,
                      meeting_url,
                      status,
                      created_by,
                      created_at,
                      updated_at,
                      completed_at,
                      completed_by,
                      cancelled_at,
                      cancelled_by
                    `
                  )
                  .in(
                    "swap_id",
                    swapIds
                  )
                  .order(
                    "scheduled_at",
                    {
                      ascending:
                        true,
                    }
                  )
              : Promise.resolve({
                  data: [],
                  error: null,
                }),
          ]);

        if (
          profilesResult.error
        ) {
          throw (
            profilesResult.error
          );
        }

        if (
          skillsResult.error
        ) {
          throw (
            skillsResult.error
          );
        }

        if (
          sessionsResult.error
        ) {
          throw (
            sessionsResult.error
          );
        }

        setProfiles(
          profilesResult.data ||
            []
        );

        setSkills(
          skillsResult.data ||
            []
        );

        setSessions(
          sessionsResult.data ||
            []
        );
      },
      []
    );

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    let active =
      true;

    const load =
      async () => {
        try {
          setLoading(
            true
          );

          setError("");

          const {
            data: {
              user:
                authUser,
            },

            error:
              authError,
          } =
            await supabase.auth
              .getUser();

          if (authError) {
            throw authError;
          }

          if (!authUser) {
            navigate(
              "/login",
              {
                replace:
                  true,
              }
            );

            return;
          }

          if (!active) {
            return;
          }

          setUser(
            authUser
          );

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
                authUser.id
              )
              .maybeSingle();

          if (
            profileError
          ) {
            throw profileError;
          }

          if (!profileData) {
            throw new Error(
              "PROFILE_NOT_FOUND"
            );
          }

          const normalizedProfile =
            {
              ...profileData,

              role:
                normalizeRole(
                  profileData.role
                ),
            };

          if (
            normalizedProfile
              .is_active !==
              true ||
            normalizedProfile
              .profile_completed !==
              true
          ) {
            navigate(
              "/dashboard",
              {
                replace:
                  true,
              }
            );

            return;
          }

          if (
            normalizedProfile
              .role !==
            "swap_master"
          ) {
            navigate(
              "/dashboard",
              {
                replace:
                  true,
              }
            );

            return;
          }

          if (!active) {
            return;
          }

          setProfile(
            normalizedProfile
          );

          await Promise.all([
            loadMatches(),
            loadSwaps(
              authUser.id
            ),
          ]);
        } catch (err) {
          console.error(
            "SWAPS LOAD ERROR:",
            err
          );

          if (active) {
            setError(
              err?.message ||
                "We couldn't load skill swaps."
            );
          }
        } finally {
          if (active) {
            setLoading(
              false
            );
          }
        }
      };

    load();

    return () => {
      active =
        false;
    };
  }, [
    navigate,
    loadMatches,
    loadSwaps,
  ]);

  /* =========================================================
     MAPS
  ========================================================= */

  const profileMap =
    useMemo(
      () =>
        new Map(
          profiles.map(
            (item) => [
              item.id,
              item,
            ]
          )
        ),
      [profiles]
    );

  const skillMap =
    useMemo(
      () =>
        new Map(
          skills.map(
            (item) => [
              item.id,
              item,
            ]
          )
        ),
      [skills]
    );

  const sessionsBySwap =
    useMemo(
      () => {
        const map =
          new Map();

        sessions.forEach(
          (session) => {
            const current =
              map.get(
                session.swap_id
              ) || [];

            current.push(
              session
            );

            map.set(
              session.swap_id,
              current
            );
          }
        );

        return map;
      },
      [sessions]
    );

  /* =========================================================
     SWAP GROUPS
  ========================================================= */

  const incomingSwaps =
    useMemo(
      () =>
        swaps.filter(
          (swap) =>
            swap.partner_id ===
              user?.id &&
            swap.status ===
              "Pending"
        ),
      [
        swaps,
        user,
      ]
    );

  const sentSwaps =
    useMemo(
      () =>
        swaps.filter(
          (swap) =>
            swap.requester_id ===
              user?.id &&
            swap.status ===
              "Pending"
        ),
      [
        swaps,
        user,
      ]
    );

  const activeSwaps =
    useMemo(
      () =>
        swaps.filter(
          (swap) =>
            swap.status ===
            "Accepted"
        ),
      [swaps]
    );

  const completedSwaps =
    useMemo(
      () =>
        swaps.filter(
          (swap) =>
            swap.status ===
            "Completed"
        ),
      [swaps]
    );

  /* =========================================================
     REFRESH
  ========================================================= */

  const refresh =
    async () => {
      if (
        refreshing ||
        !user
      ) {
        return;
      }

      try {
        setRefreshing(
          true
        );

        setError("");

        await Promise.all([
          loadMatches(),
          loadSwaps(
            user.id
          ),
        ]);
      } catch (err) {
        console.error(
          "SWAP REFRESH ERROR:",
          err
        );

        setError(
          err?.message ||
            "Could not refresh swaps."
        );
      } finally {
        setRefreshing(
          false
        );
      }
    };

  /* =========================================================
     REQUEST SWAP
  ========================================================= */

  const requestSwap =
    async (
      match
    ) => {
      if (
        actionId ||
        !match
      ) {
        return;
      }

      const actionKey =
        `request-${match.partner_id}-${match.my_teaches_skill_id}-${match.partner_teaches_skill_id}`;

      try {
        setActionId(
          actionKey
        );

        setError("");
        setSuccess("");

        const {
          error:
            requestError,
        } =
          await supabase.rpc(
            "request_skill_swap",
            {
              p_partner_id:
                match.partner_id,

              p_requester_teaches_skill_id:
                match.my_teaches_skill_id,

              p_partner_teaches_skill_id:
                match.partner_teaches_skill_id,
            }
          );

        if (
          requestError
        ) {
          throw requestError;
        }

        setSuccess(
          `Swap request sent to ${
            match.full_name ||
            match.username ||
            "this member"
          }.`
        );

        await Promise.all([
          loadMatches(),
          loadSwaps(
            user.id
          ),
        ]);

        setActiveTab(
          "sent"
        );
      } catch (err) {
        console.error(
          "REQUEST SWAP ERROR:",
          err
        );

        const message =
          String(
            err?.message ||
              ""
          );

        if (
          message.includes(
            "SWAP_ALREADY_EXISTS"
          )
        ) {
          setError(
            "A pending or active swap already exists for this skill pair."
          );

          return;
        }

        if (
          message.includes(
            "NOT_RECIPROCAL_MATCH"
          )
        ) {
          setError(
            "This member is no longer a reciprocal skill match."
          );

          return;
        }

        setError(
          err?.message ||
            "The swap request could not be sent."
        );
      } finally {
        setActionId(
          null
        );
      }
    };

  /* =========================================================
     RESPOND
  ========================================================= */

  const respondToSwap =
    async (
      swap,
      decision
    ) => {
      if (
        actionId ||
        !swap
      ) {
        return;
      }

      const actionKey =
        `${decision}-${swap.id}`;

      try {
        setActionId(
          actionKey
        );

        setError("");
        setSuccess("");

        const {
          error:
            responseError,
        } =
          await supabase.rpc(
            "respond_skill_swap",
            {
              p_swap_id:
                swap.id,

              p_decision:
                decision,
            }
          );

        if (
          responseError
        ) {
          throw responseError;
        }

        setSuccess(
          decision ===
            "Accepted"
            ? "Skill swap accepted."
            : "Skill swap request rejected."
        );

        await Promise.all([
          loadMatches(),
          loadSwaps(
            user.id
          ),
        ]);

        if (
          decision ===
          "Accepted"
        ) {
          setActiveTab(
            "active"
          );
        }
      } catch (err) {
        console.error(
          "RESPOND SWAP ERROR:",
          err
        );

        setError(
          err?.message ||
            "The swap request could not be updated."
        );
      } finally {
        setActionId(
          null
        );
      }
    };

  /* =========================================================
     MARK MY SIDE COMPLETE
  ========================================================= */

  const markMySideComplete =
    async (
      swap
    ) => {
      if (
        actionId ||
        !swap ||
        !user
      ) {
        return;
      }

      const actionKey =
        `complete-${swap.id}`;

      try {
        setActionId(
          actionKey
        );

        setError("");
        setSuccess("");

        const {
          data,
          error:
            completionError,
        } =
          await supabase.rpc(
            "mark_skill_swap_complete",
            {
              p_swap_id:
                swap.id,
            }
          );

        if (
          completionError
        ) {
          throw completionError;
        }

        const result =
          data || {};

        if (
          result.completed_now ===
          true
        ) {
          setSuccess(
            Number(
              result.reward_credits ||
                0
            ) > 0
              ? `Skill swap completed. You earned ${result.reward_credits} SS.`
              : "Skill swap completed."
          );

          setActiveTab(
            "completed"
          );
        } else {
          setSuccess(
            "Your side is marked complete. Waiting for your partner to confirm their side."
          );
        }

        await Promise.all([
          loadMatches(),
          loadSwaps(
            user.id
          ),
        ]);
      } catch (err) {
        console.error(
          "COMPLETE SWAP ERROR:",
          err
        );

        const message =
          String(
            err?.message ||
              ""
          );

        if (
          message.includes(
            "COMPLETED_SESSION_REQUIRED"
          )
        ) {
          setError(
            "Complete at least one shared swap session before confirming the whole swap."
          );
        } else if (
          message.includes(
            "SWAP_NOT_ACTIVE"
          )
        ) {
          setError(
            "Only an accepted skill swap can be marked complete."
          );
        } else if (
          message.includes(
            "SWAP_ACCESS_DENIED"
          )
        ) {
          setError(
            "You do not have access to this skill swap."
          );
        } else {
          setError(
            err?.message ||
              "Your completion could not be saved."
          );
        }
      } finally {
        setActionId(
          null
        );
      }
    };

  /* =========================================================
     SHARED SWAP SESSIONS
  ========================================================= */

  const openSessionModal =
    (
      swap
    ) => {
      setError("");
      setSuccess("");

      setSessionForm({
        title:
          "Skill swap session",
        description: "",
        scheduledAt:
          defaultSessionTime(),
        durationMinutes: 60,
      });

      setSessionModalSwap(
        swap
      );
    };

  const closeSessionModal =
    () => {
      if (
        actionId &&
        String(
          actionId
        ).startsWith(
          "schedule-"
        )
      ) {
        return;
      }

      setSessionModalSwap(
        null
      );
    };

  const createSession =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        !sessionModalSwap ||
        !user ||
        actionId
      ) {
        return;
      }

      const actionKey =
        `schedule-${sessionModalSwap.id}`;

      const title =
        sessionForm.title
          .trim();

      if (!title) {
        setError(
          "Enter a session title."
        );
        return;
      }

      if (
        !sessionForm.scheduledAt
      ) {
        setError(
          "Choose a session date and time."
        );
        return;
      }

      const scheduledDate =
        new Date(
          sessionForm.scheduledAt
        );

      if (
        Number.isNaN(
          scheduledDate.getTime()
        )
      ) {
        setError(
          "Choose a valid session date and time."
        );
        return;
      }

      try {
        setActionId(
          actionKey
        );

        setError("");
        setSuccess("");

        const {
          error:
            sessionError,
        } =
          await supabase.rpc(
            "create_swap_session",
            {
              p_swap_id:
                sessionModalSwap.id,
              p_title:
                title,
              p_description:
                sessionForm.description
                  .trim() ||
                null,
              p_scheduled_at:
                scheduledDate.toISOString(),
              p_duration_minutes:
                Number(
                  sessionForm.durationMinutes
                ),
              // Keep the existing RPC signature for compatibility.
              // New swap sessions use SkillMeet, so no external URL is stored.
              p_meeting_url:
                null,
            }
          );

        if (
          sessionError
        ) {
          throw sessionError;
        }

        setSessionModalSwap(
          null
        );

        setSuccess(
          "SkillMeet swap session scheduled."
        );

        await loadSwaps(
          user.id
        );
      } catch (err) {
        console.error(
          "CREATE SWAP SESSION ERROR:",
          err
        );

        const message =
          String(
            err?.message ||
              ""
          );

        if (
          message.includes(
            "SESSION_TIME_MUST_BE_FUTURE"
          )
        ) {
          setError(
            "The session must be scheduled for a future time."
          );
        } else if (
          message.includes(
            "SWAP_NOT_ACTIVE"
          )
        ) {
          setError(
            "Sessions can only be scheduled for an active swap."
          );
        } else {
          setError(
            err?.message ||
              "The session could not be scheduled."
          );
        }
      } finally {
        setActionId(
          null
        );
      }
    };

  const completeSession =
    async (
      session
    ) => {
      if (
        actionId ||
        !session ||
        !user
      ) {
        return;
      }

      const actionKey =
        `session-complete-${session.id}`;

      try {
        setActionId(
          actionKey
        );

        setError("");
        setSuccess("");

        const {
          error:
            sessionError,
        } =
          await supabase.rpc(
            "complete_swap_session",
            {
              p_session_id:
                session.id,
            }
          );

        if (
          sessionError
        ) {
          throw sessionError;
        }

        setSuccess(
          "Shared session marked complete."
        );

        await loadSwaps(
          user.id
        );
      } catch (err) {
        console.error(
          "COMPLETE SWAP SESSION ERROR:",
          err
        );

        const message =
          String(
            err?.message ||
              ""
          );

        if (
          message.includes(
            "SESSION_HAS_NOT_STARTED"
          )
        ) {
          setError(
            "You can mark the session complete after its scheduled start time."
          );
        } else {
          setError(
            err?.message ||
              "The session could not be completed."
          );
        }
      } finally {
        setActionId(
          null
        );
      }
    };

  const cancelSession =
    async (
      session
    ) => {
      if (
        actionId ||
        !session ||
        !user
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Cancel "${session.title}"?`
        );

      if (
        !confirmed
      ) {
        return;
      }

      const actionKey =
        `session-cancel-${session.id}`;

      try {
        setActionId(
          actionKey
        );

        setError("");
        setSuccess("");

        const {
          error:
            sessionError,
        } =
          await supabase.rpc(
            "cancel_swap_session",
            {
              p_session_id:
                session.id,
            }
          );

        if (
          sessionError
        ) {
          throw sessionError;
        }

        setSuccess(
          "Shared session cancelled."
        );

        await loadSwaps(
          user.id
        );
      } catch (err) {
        console.error(
          "CANCEL SWAP SESSION ERROR:",
          err
        );

        setError(
          err?.message ||
            "The session could not be cancelled."
        );
      } finally {
        setActionId(
          null
        );
      }
    };

  const openMeeting =
    (
      session
    ) => {
      if (
        !session?.id
      ) {
        setError(
          "This SkillMeet session is unavailable."
        );
        return;
      }

      const externalUrl =
        String(
          session.meeting_url ||
            ""
        ).trim();

      /*
       * Migration behavior:
       * - Existing swap sessions with a saved URL keep opening
       *   Google Meet / Zoom / Teams externally.
       * - New swap sessions have no meeting_url and therefore
       *   use the built-in SkillMeet room.
       */
      if (externalUrl) {
        window.open(
          externalUrl,
          "_blank",
          "noopener,noreferrer"
        );

        return;
      }

      navigate(
        `/skillmeet/swap/${session.id}`
      );
    };

  /* =========================================================
     MESSAGE SWAP PARTNER
  ========================================================= */

  const messagePartner =
    async (
      partnerId
    ) => {
      if (
        actionId ||
        !partnerId
      ) {
        return;
      }

      const actionKey =
        `message-${partnerId}`;

      try {
        setActionId(
          actionKey
        );

        setError("");
        setSuccess("");

        const {
          data:
            conversationId,
          error:
            conversationError,
        } =
          await supabase.rpc(
            "get_or_create_conversation",
            {
              p_other_user_id:
                partnerId,
            }
          );

        if (
          conversationError
        ) {
          throw conversationError;
        }

        if (
          !conversationId
        ) {
          throw new Error(
            "CONVERSATION_NOT_CREATED"
          );
        }

        navigate(
          `/messages/${conversationId}`
        );
      } catch (err) {
        console.error(
          "MESSAGE PARTNER ERROR:",
          err
        );

        setError(
          err?.message ||
            "The conversation could not be opened."
        );
      } finally {
        setActionId(
          null
        );
      }
    };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="relative grid min-h-screen place-items-center bg-[#060807] text-[#f2f4ef]">
        <div className="noise pointer-events-none fixed inset-0" />

        <div className="relative z-10 text-center">
          <div className="mx-auto mb-5 h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-[#c7ff39]" />

          <p className="text-xs uppercase tracking-[0.18em] text-[#a1a1aa]">
            Finding skill swaps
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
            "radial-gradient(ellipse at 82% 0%, rgba(199,255,57,.06), transparent 36%)",
        }}
      />

      <div className="relative z-10">
        {/* HEADER */}

        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#060807]/90 backdrop-blur-xl">
          <div className="mx-auto flex min-h-[76px] max-w-[1400px] items-center justify-between gap-4 px-5 md:px-8 lg:px-10">
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/dashboard"
                )
              }
              className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] transition hover:text-white"
            >
              <ArrowLeft
                size={16}
              />

              Dashboard
            </button>

            <button
              type="button"
              onClick={
                refresh
              }
              disabled={
                refreshing
              }
              className="inline-flex h-10 items-center gap-2 border border-white/10 px-3 text-xs text-[#a1a1aa] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39] disabled:opacity-50"
            >
              <RefreshCw
                size={14}
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

        {/* CONTENT */}

        <div className="mx-auto max-w-[1400px] px-5 pb-20 pt-28 md:px-8 lg:px-10 lg:pt-32">
          {/* HERO */}

          <section className="border-b border-white/10 pb-8">
            <div className="flex items-center gap-2 text-[#c7ff39]">
              <Repeat2
                size={16}
              />

              <p className="text-[10px] uppercase tracking-[0.18em]">
                Swap Master network
              </p>
            </div>

            <div className="mt-4 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <h1 className="text-4xl font-medium tracking-[-0.055em] md:text-5xl">
                  Reciprocal skill swaps.
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#a1a1aa]">
                  Find Swap Masters who teach
                  what you want to learn and
                  want to learn what you teach.
                </p>
              </div>

              <div className="border border-[#c7ff39]/15 bg-[#c7ff39]/[0.03] px-5 py-4">
                <p className="text-[9px] uppercase tracking-[0.15em] text-[#a1a1aa]">
                  Signed in as
                </p>

                <p className="mt-1 text-sm font-medium text-[#c7ff39]">
                  {profile?.full_name ||
                    profile?.username ||
                    "Swap Master"}
                </p>
              </div>
            </div>
          </section>

          {/* FEEDBACK */}

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

          {/* TABS */}

          <div className="mt-7 flex flex-wrap gap-2 border-b border-white/10 pb-4">
            {TABS.map(
              (tab) => {
                let count =
                  null;

                if (
                  tab.id ===
                  "discover"
                ) {
                  count =
                    matches.length;
                }

                if (
                  tab.id ===
                  "incoming"
                ) {
                  count =
                    incomingSwaps.length;
                }

                if (
                  tab.id ===
                  "sent"
                ) {
                  count =
                    sentSwaps.length;
                }

                if (
                  tab.id ===
                  "active"
                ) {
                  count =
                    activeSwaps.length;
                }

                if (
                  tab.id ===
                  "completed"
                ) {
                  count =
                    completedSwaps.length;
                }

                return (
                  <button
                    key={
                      tab.id
                    }
                    type="button"
                    onClick={() =>
                      setActiveTab(
                        tab.id
                      )
                    }
                    className={`inline-flex min-h-10 items-center gap-2 border px-4 text-xs font-medium transition ${
                      activeTab ===
                      tab.id
                        ? "border-[#c7ff39]/35 bg-[#c7ff39]/[0.05] text-[#c7ff39]"
                        : "border-white/10 text-[#a1a1aa] hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {
                      tab.label
                    }

                    <span className="text-[9px] opacity-60">
                      {
                        count
                      }
                    </span>
                  </button>
                );
              }
            )}
          </div>

          {/* DISCOVER */}

          {activeTab ===
            "discover" && (
            <DiscoverSection
              matches={
                matches
              }
              actionId={
                actionId
              }
              onRequest={
                requestSwap
              }
              onProfile={(
                username
              ) => {
                if (
                  username
                ) {
                  navigate(
                    `/profile/${encodeURIComponent(
                      username
                    )}`
                  );
                }
              }}
              onEditSkills={() =>
                navigate(
                  "/profile/edit?tab=learning"
                )
              }
            />
          )}

          {/* INCOMING */}

          {activeTab ===
            "incoming" && (
            <SwapList
              title="Incoming requests"
              emptyTitle="No incoming requests."
              emptyText="New reciprocal swap requests will appear here."
              swaps={
                incomingSwaps
              }
              currentUserId={
                user?.id
              }
              profileMap={
                profileMap
              }
              skillMap={
                skillMap
              }
              actionId={
                actionId
              }
              incoming
              onAccept={(
                swap
              ) =>
                respondToSwap(
                  swap,
                  "Accepted"
                )
              }
              onReject={(
                swap
              ) =>
                respondToSwap(
                  swap,
                  "Rejected"
                )
              }
            />
          )}

          {/* SENT */}

          {activeTab ===
            "sent" && (
            <SwapList
              title="Sent requests"
              emptyTitle="No pending requests sent."
              emptyText="Perfect matches you request will appear here while they wait for a response."
              swaps={
                sentSwaps
              }
              currentUserId={
                user?.id
              }
              profileMap={
                profileMap
              }
              skillMap={
                skillMap
              }
              actionId={
                actionId
              }
            />
          )}

          {/* ACTIVE */}

          {activeTab ===
            "active" && (
            <SwapList
              title="Active swaps"
              emptyTitle="No active swaps yet."
              emptyText="Accepted reciprocal skill swaps will appear here."
              swaps={
                activeSwaps
              }
              currentUserId={
                user?.id
              }
              profileMap={
                profileMap
              }
              skillMap={
                skillMap
              }
              actionId={
                actionId
              }
              sessionsBySwap={
                sessionsBySwap
              }
              active
              onScheduleSession={
                openSessionModal
              }
              onCompleteSession={
                completeSession
              }
              onCancelSession={
                cancelSession
              }
              onOpenMeeting={
                openMeeting
              }
              onComplete={
                markMySideComplete
              }
              onMessage={
                messagePartner
              }
            />
          )}

          {/* COMPLETED */}

          {activeTab ===
            "completed" && (
            <SwapList
              title="Completed swaps"
              emptyTitle="No completed swaps yet."
              emptyText="A skill swap moves here after both members confirm completion."
              swaps={
                completedSwaps
              }
              currentUserId={
                user?.id
              }
              profileMap={
                profileMap
              }
              skillMap={
                skillMap
              }
              actionId={
                actionId
              }
              sessionsBySwap={
                sessionsBySwap
              }
              completed
              onOpenMeeting={
                openMeeting
              }
              onMessage={
                messagePartner
              }
            />
          )}
        </div>
      </div>

      {sessionModalSwap && (
        <SessionModal
          swap={
            sessionModalSwap
          }
          form={
            sessionForm
          }
          setForm={
            setSessionForm
          }
          saving={
            actionId ===
            `schedule-${sessionModalSwap.id}`
          }
          onClose={
            closeSessionModal
          }
          onSubmit={
            createSession
          }
        />
      )}
    </main>
  );
}

/* =========================================================
   DISCOVER
========================================================= */

function DiscoverSection({
  matches,
  actionId,
  onRequest,
  onProfile,
  onEditSkills,
}) {
  if (
    matches.length ===
    0
  ) {
    return (
      <section className="mt-6 border border-white/10 bg-[#0a0d0b]/70 p-9 md:p-12">
        <Sparkles
          size={24}
          className="text-[#737373]"
        />

        <h2 className="mt-5 text-2xl font-medium tracking-[-0.04em]">
          No perfect matches yet.
        </h2>

        <p className="mt-2 max-w-xl text-sm leading-7 text-[#a1a1aa]">
          A perfect match needs another
          Swap Master who teaches a skill
          you want and wants a skill you
          teach.
        </p>

        <button
          type="button"
          onClick={
            onEditSkills
          }
          className="mt-5 inline-flex min-h-11 items-center gap-2 border border-white/15 px-5 text-sm font-medium transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"
        >
          Refine my skills

          <ArrowRight
            size={14}
          />
        </button>
      </section>
    );
  }

  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-2">
      {matches.map(
        (
          match
        ) => {
          const key =
            `${match.partner_id}-${match.my_teaches_skill_id}-${match.partner_teaches_skill_id}`;

          const requestKey =
            `request-${key}`;

          const processing =
            actionId ===
            requestKey;

          return (
            <article
              key={
                key
              }
              className="border border-white/10 bg-[#0a0d0b]/80 p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  {match.avatar_url ? (
                    <img
                      src={
                        match.avatar_url
                      }
                      alt={
                        match.full_name ||
                        match.username ||
                        "Swap Master"
                      }
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/10">
                      <UserRound
                        size={18}
                        className="text-[#737373]"
                      />
                    </div>
                  )}

                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-medium">
                      {match.full_name ||
                        match.username ||
                        "Swap Master"}
                    </h2>

                    <p className="mt-1 truncate text-xs text-[#a1a1aa]">
                      @
                      {
                        match.username
                      }
                    </p>

                    {match.location && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-white/35">
                        <MapPin
                          size={11}
                        />

                        {
                          match.location
                        }
                      </p>
                    )}
                  </div>
                </div>

                <span className="shrink-0 border border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-[#c7ff39]">
                  Perfect match
                </span>
              </div>

              {/* RECIPROCAL PAIR */}

              <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <SkillBox
                  eyebrow="You teach"
                  skill={
                    match.my_teaches_skill_name
                  }
                />

                <div className="hidden text-[#c7ff39] sm:block">
                  <Repeat2
                    size={18}
                  />
                </div>

                <SkillBox
                  eyebrow="You learn"
                  skill={
                    match.partner_teaches_skill_name
                  }
                />
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <p className="text-xs leading-5 text-white/35">
                  They want to learn{" "}
                  <span className="text-[#f2f4ef]">
                    {
                      match.my_teaches_skill_name
                    }
                  </span>
                  .
                </p>

                <p className="text-xs leading-5 text-white/35">
                  They can teach you{" "}
                  <span className="text-[#f2f4ef]">
                    {
                      match.partner_teaches_skill_name
                    }
                  </span>
                  .
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-5">
                <button
                  type="button"
                  onClick={() =>
                    onRequest(
                      match
                    )
                  }
                  disabled={
                    processing
                  }
                  className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008] transition hover:bg-[#d4ff66] disabled:opacity-50"
                >
                  {processing ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Send
                      size={15}
                    />
                  )}

                  Request swap
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onProfile(
                      match.username
                    )
                  }
                  className="inline-flex min-h-11 items-center justify-center border border-white/15 px-5 text-sm text-[#a1a1aa] transition hover:border-white/30 hover:text-white"
                >
                  View profile
                </button>
              </div>
            </article>
          );
        }
      )}
    </section>
  );
}

/* =========================================================
   SWAP LIST
========================================================= */

function SwapList({
  title,
  emptyTitle,
  emptyText,
  swaps,
  currentUserId,
  profileMap,
  skillMap,
  actionId,
  sessionsBySwap,
  incoming = false,
  active = false,
  completed = false,
  onAccept,
  onReject,
  onScheduleSession,
  onCompleteSession,
  onCancelSession,
  onOpenMeeting,
  onComplete,
  onMessage,
}) {
  if (
    swaps.length ===
    0
  ) {
    return (
      <section className="mt-6 border border-white/10 bg-[#0a0d0b]/70 p-9 md:p-12">
        {completed ? (
          <CheckCircle2
            size={24}
            className="text-white/25"
          />
        ) : (
          <Clock3
            size={24}
            className="text-[#737373]"
          />
        )}

        <h2 className="mt-5 text-2xl font-medium tracking-[-0.04em]">
          {
            emptyTitle
          }
        </h2>

        <p className="mt-2 max-w-xl text-sm leading-7 text-[#a1a1aa]">
          {
            emptyText
          }
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6">
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-[0.17em] text-[#c7ff39]">
          {
            title
          }
        </p>
      </div>

      <div className="grid gap-4">
        {swaps.map(
          (
            swap
          ) => {
            const amRequester =
              swap.requester_id ===
              currentUserId;

            const otherId =
              amRequester
                ? swap.partner_id
                : swap.requester_id;

            const other =
              profileMap.get(
                otherId
              );

            const mySkillId =
              amRequester
                ? swap.requester_teaches_skill_id
                : swap.partner_teaches_skill_id;

            const theirSkillId =
              amRequester
                ? swap.partner_teaches_skill_id
                : swap.requester_teaches_skill_id;

            const mySkill =
              skillMap.get(
                mySkillId
              );

            const theirSkill =
              skillMap.get(
                theirSkillId
              );

            const myCompleted =
              amRequester
                ? Boolean(
                    swap.requester_completed
                  )
                : Boolean(
                    swap.partner_completed
                  );

            const partnerCompleted =
              amRequester
                ? Boolean(
                    swap.partner_completed
                  )
                : Boolean(
                    swap.requester_completed
                  );

            const swapSessions =
              sessionsBySwap?.get(
                swap.id
              ) || [];

            const completedSessionCount =
              swapSessions.filter(
                (session) =>
                  session.status ===
                  "Completed"
              ).length;

            const scheduledSessions =
              swapSessions.filter(
                (session) =>
                  session.status ===
                  "Scheduled"
              );

            const acceptKey =
              `Accepted-${swap.id}`;

            const rejectKey =
              `Rejected-${swap.id}`;

            const completeKey =
              `complete-${swap.id}`;

            const messageKey =
              `message-${otherId}`;

            const processing =
              actionId ===
                acceptKey ||
              actionId ===
                rejectKey ||
              actionId ===
                completeKey ||
              actionId ===
                messageKey;

            return (
              <article
                key={
                  swap.id
                }
                className="border border-white/10 bg-[#0a0d0b]/80 p-6"
              >
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`border px-2 py-1 text-[9px] uppercase tracking-[0.14em] ${
                          completed
                            ? "border-[#7dd3fc]/25 bg-[#7dd3fc]/[0.04] text-[#9bdcff]"
                            : active
                              ? "border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] text-[#c7ff39]"
                              : "border-[#ffbf69]/25 bg-[#ffbf69]/[0.04] text-[#ffca80]"
                        }`}
                      >
                        {
                          swap.status
                        }
                      </span>

                      {(active ||
                        completed) && (
                        <span className="border border-white/10 px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-[#a1a1aa]">
                          Swap reward{" "}
                          {
                            swap.reward_credits
                          }{" "}
                          SS each
                        </span>
                      )}
                    </div>

                    <div className="mt-5 flex items-center gap-4">
                      {other?.avatar_url ? (
                        <img
                          src={
                            other.avatar_url
                          }
                          alt={
                            other.full_name ||
                            "Swap Master"
                          }
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="grid h-12 w-12 place-items-center rounded-full border border-white/10">
                          <UserRound
                            size={18}
                            className="text-[#737373]"
                          />
                        </div>
                      )}

                      <div>
                        <h2 className="text-lg font-medium">
                          {other?.full_name ||
                            other?.username ||
                            "Swap Master"}
                        </h2>

                        <p className="mt-1 text-xs text-[#a1a1aa]">
                          @
                          {
                            other?.username ||
                            "member"
                          }
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                      <SkillBox
                        eyebrow="You teach"
                        skill={
                          mySkill?.name ||
                          "Skill"
                        }
                      />

                      <div className="hidden text-[#c7ff39] sm:block">
                        <Repeat2
                          size={18}
                        />
                      </div>

                      <SkillBox
                        eyebrow="You learn"
                        skill={
                          theirSkill?.name ||
                          "Skill"
                        }
                      />
                    </div>

                    <p className="mt-4 text-xs text-white/35">
                      {completed
                        ? `Completed ${formatDate(
                            swap.completed_at
                          )}`
                        : active
                          ? `Accepted ${formatDate(
                              swap.accepted_at
                            )}`
                          : `Requested ${formatDate(
                              swap.created_at
                            )}`}
                    </p>
                  </div>

                  {/* =======================================
                      REQUEST ACTIONS
                  ======================================= */}

                  {incoming && (
                    <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
                      <button
                        type="button"
                        onClick={() =>
                          onAccept(
                            swap
                          )
                        }
                        disabled={
                          processing
                        }
                        className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008] transition hover:bg-[#d4ff66] disabled:opacity-50"
                      >
                        {actionId ===
                        acceptKey ? (
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />
                        ) : (
                          <Check
                            size={15}
                          />
                        )}

                        Accept
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onReject(
                            swap
                          )
                        }
                        disabled={
                          processing
                        }
                        className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/15 px-5 text-sm text-[#a1a1aa] transition hover:border-[#ff6b6b]/40 hover:text-[#ff8b8b] disabled:opacity-50"
                      >
                        {actionId ===
                        rejectKey ? (
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />
                        ) : (
                          <X
                            size={15}
                          />
                        )}

                        Reject
                      </button>
                    </div>
                  )}

                  {/* =======================================
                      ACTIVE SWAP
                  ======================================= */}

                  {active && (
                    <div className="space-y-4">
                      <div className="border border-white/10 bg-[#060807] p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-[#c7ff39]">
                            <CalendarDays
                              size={14}
                            />

                            <p className="text-[9px] uppercase tracking-[0.14em]">
                              Shared sessions
                            </p>
                          </div>

                          <span className="text-[9px] text-white/30">
                            {completedSessionCount} completed
                          </span>
                        </div>

                        <div className="mt-4 space-y-3">
                          {swapSessions.length > 0 ? (
                            swapSessions.map(
                              (session) => (
                                <SessionRow
                                  key={
                                    session.id
                                  }
                                  session={
                                    session
                                  }
                                  actionId={
                                    actionId
                                  }
                                  onComplete={
                                    onCompleteSession
                                  }
                                  onCancel={
                                    onCancelSession
                                  }
                                  onOpenMeeting={
                                    onOpenMeeting
                                  }
                                />
                              )
                            )
                          ) : (
                            <p className="text-xs leading-5 text-[#a1a1aa]">
                              No SkillMeet sessions scheduled yet.
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            onScheduleSession(
                              swap
                            )
                          }
                          disabled={
                            Boolean(
                              actionId
                            )
                          }
                          className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 border border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] px-4 text-xs font-medium text-[#c7ff39] transition hover:bg-[#c7ff39]/[0.08] disabled:opacity-50"
                        >
                          <Plus
                            size={14}
                          />

                          Schedule SkillMeet
                        </button>
                      </div>

                      <div className="border border-white/10 bg-[#060807] p-5">
                        <div className="flex items-center gap-2 text-[#c7ff39]">
                          <GraduationCap
                            size={14}
                          />

                          <p className="text-[9px] uppercase tracking-[0.14em]">
                            Completion status
                          </p>
                        </div>

                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                          <span className="text-xs text-[#a1a1aa]">
                            You
                          </span>

                          <span
                            className={`inline-flex items-center gap-1.5 text-xs ${
                              myCompleted
                                ? "text-[#c7ff39]"
                                : "text-[#ffca80]"
                            }`}
                          >
                            {myCompleted && (
                              <CheckCircle2
                                size={13}
                              />
                            )}

                            {myCompleted
                              ? "Complete"
                              : "Pending"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-[#a1a1aa]">
                            Partner
                          </span>

                          <span
                            className={`inline-flex items-center gap-1.5 text-xs ${
                              partnerCompleted
                                ? "text-[#c7ff39]"
                                : "text-[#ffca80]"
                            }`}
                          >
                            {partnerCompleted && (
                              <CheckCircle2
                                size={13}
                              />
                            )}

                            {partnerCompleted
                              ? "Complete"
                              : "Pending"}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={
                          processing ||
                          myCompleted ||
                          completedSessionCount < 1
                        }
                        onClick={() =>
                          onComplete(
                            swap
                          )
                        }
                        className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[#c7ff39] px-4 text-sm font-semibold text-[#071008] transition hover:bg-[#d4ff66] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {actionId ===
                        completeKey ? (
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />
                        ) : (
                          <CheckCircle2
                            size={15}
                          />
                        )}

                        {myCompleted
                          ? "You confirmed completion"
                          : "Mark my side complete"}
                      </button>

                      <button
                        type="button"
                        disabled={
                          processing
                        }
                        onClick={() =>
                          onMessage(
                            otherId
                          )
                        }
                        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 border border-white/15 px-4 text-sm text-[#f2f4ef] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39] disabled:opacity-50"
                      >
                        {actionId ===
                        messageKey ? (
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />
                        ) : (
                          <MessageSquare
                            size={15}
                          />
                        )}

                        Message partner
                      </button>

                      {myCompleted &&
                        !partnerCompleted && (
                          <p className="mt-3 text-center text-[10px] leading-5 text-white/35">
                            Your confirmation is saved. The swap will finish when your partner confirms completion.
                          </p>
                        )}

                        {!myCompleted &&
                          partnerCompleted && (
                            <p className="mt-3 text-center text-[10px] leading-5 text-[#c7ff39]">
                              Your partner has already confirmed. Your confirmation will complete the swap and release the SS reward.
                            </p>
                          )}

                        {completedSessionCount < 1 && (
                          <p className="mt-3 text-center text-[10px] leading-5 text-[#ffca80]">
                            Complete at least one shared session before either member can confirm the whole swap.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* =======================================
                      COMPLETED SWAP
                  ======================================= */}

                  {completed && (
                    <div className="border border-[#c7ff39]/20 bg-[#c7ff39]/[0.035] p-5">
                      <div className="flex items-center gap-2 text-[#c7ff39]">
                        <CheckCircle2
                          size={15}
                        />

                        <p className="text-[9px] uppercase tracking-[0.14em]">
                          Swap completed
                        </p>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-[#f2f4ef]">
                        Both members confirmed completion.
                      </p>

                      <div className="mt-4 border border-white/10 bg-[#060807] p-4">
                        <p className="text-[9px] uppercase tracking-[0.13em] text-white/30">
                          Swap reward earned
                        </p>

                        <p className="mt-1 text-xl font-medium text-[#c7ff39]">
                          +{
                            swap.reward_credits
                          }{" "}
                          SS
                        </p>

                        <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-white/25">
                          Credit type: Swap reward
                        </p>
                      </div>

                      <div className="mt-3 border border-white/10 bg-[#060807] p-4">
                        <p className="text-[9px] uppercase tracking-[0.13em] text-white/30">
                          Shared sessions completed
                        </p>

                        <p className="mt-1 text-xl font-medium text-[#f2f4ef]">
                          {
                            completedSessionCount
                          }
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={
                          processing
                        }
                        onClick={() =>
                          onMessage(
                            otherId
                          )
                        }
                        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 border border-white/15 px-4 text-sm text-[#f2f4ef] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39] disabled:opacity-50"
                      >
                        {actionId ===
                        messageKey ? (
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />
                        ) : (
                          <MessageSquare
                            size={15}
                          />
                        )}

                        Message partner
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          }
        )}
      </div>
    </section>
  );
}

/* =========================================================
   SWAP SESSION ROW
========================================================= */

function SessionRow({
  session,
  actionId,
  onComplete,
  onCancel,
  onOpenMeeting,
}) {
  const completeKey =
    `session-complete-${session.id}`;

  const cancelKey =
    `session-cancel-${session.id}`;

  const busy =
    actionId ===
      completeKey ||
    actionId ===
      cancelKey;

  const scheduled =
    session.status ===
    "Scheduled";

  const completed =
    session.status ===
    "Completed";

  const cancelled =
    session.status ===
    "Cancelled";

  return (
    <div className="border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-[#f2f4ef]">
            {
              session.title
            }
          </p>

          <p className="mt-1 text-[10px] leading-5 text-[#a1a1aa]">
            {formatDate(
              session.scheduled_at
            )}
            {" · "}
            {
              session.duration_minutes
            }{" "}
            min
          </p>
        </div>

        <span
          className={`shrink-0 text-[9px] uppercase tracking-[0.12em] ${
            completed
              ? "text-[#c7ff39]"
              : cancelled
                ? "text-[#ff8b8b]"
                : "text-[#ffca80]"
          }`}
        >
          {
            session.status
          }
        </span>
      </div>

      {session.description && (
        <p className="mt-2 text-[10px] leading-5 text-white/35">
          {
            session.description
          }
        </p>
      )}

      {!cancelled && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              onOpenMeeting(
                session
              )
            }
            className={`inline-flex min-h-8 items-center gap-1.5 border px-2.5 text-[10px] transition ${
              session.meeting_url
                ? "border-white/10 text-[#f2f4ef] hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"
                : "border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] text-[#c7ff39] hover:bg-[#c7ff39]/[0.08]"
            }`}
          >
            <Video
              size={11}
            />

            {session.meeting_url
              ? "Open external meeting"
              : "Join SkillMeet"}
          </button>

          {scheduled && (
            <>
              <button
                type="button"
                disabled={
                  busy
                }
                onClick={() =>
                  onComplete(
                    session
                  )
                }
                className="inline-flex min-h-8 items-center gap-1.5 bg-[#c7ff39] px-2.5 text-[10px] font-semibold text-[#071008] disabled:opacity-45"
              >
                {actionId ===
                completeKey ? (
                  <Loader2
                    size={11}
                    className="animate-spin"
                  />
                ) : (
                  <Check
                    size={11}
                  />
                )}

                Complete
              </button>

              <button
                type="button"
                disabled={
                  busy
                }
                onClick={() =>
                  onCancel(
                    session
                  )
                }
                className="inline-flex min-h-8 items-center gap-1.5 border border-white/10 px-2.5 text-[10px] text-[#a1a1aa] transition hover:border-[#ff6b6b]/30 hover:text-[#ff8b8b] disabled:opacity-45"
              >
                {actionId ===
                cancelKey ? (
                  <Loader2
                    size={11}
                    className="animate-spin"
                  />
                ) : (
                  <X
                    size={11}
                  />
                )}

                Cancel
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SCHEDULE SESSION MODAL
========================================================= */

function SessionModal({
  swap,
  form,
  setForm,
  saving,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-xl border border-white/10 bg-[#0a0d0b]">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
          <div>
            <div className="flex items-center gap-2 text-[#c7ff39]">
              <CalendarDays
                size={14}
              />

              <p className="text-[10px] uppercase tracking-[0.16em]">
                SkillMeet swap session
              </p>
            </div>

            <h2 className="mt-2 text-xl font-medium tracking-[-0.035em]">
              Schedule SkillMeet
            </h2>

            <p className="mt-2 text-xs leading-5 text-[#a1a1aa]">
              Both Swap Masters will join the same built-in SkillMeet room to teach each other.
            </p>
          </div>

          <button
            type="button"
            disabled={
              saving
            }
            onClick={
              onClose
            }
            className="grid h-9 w-9 shrink-0 place-items-center border border-white/10 text-[#a1a1aa] transition hover:text-white disabled:opacity-50"
          >
            <X
              size={14}
            />
          </button>
        </div>

        <form
          onSubmit={
            onSubmit
          }
          className="p-5"
        >
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.13em] text-[#a1a1aa]">
              Session title
            </span>

            <input
              value={
                form.title
              }
              onChange={(
                event
              ) =>
                setForm(
                  (
                    current
                  ) => ({
                    ...current,
                    title:
                      event.target.value,
                  })
                )
              }
              maxLength={
                120
              }
              required
              className="mt-2 min-h-11 w-full border border-white/10 bg-[#060807] px-3 text-sm outline-none transition focus:border-[#c7ff39]/40"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-[10px] uppercase tracking-[0.13em] text-[#a1a1aa]">
              Description
            </span>

            <textarea
              value={
                form.description
              }
              onChange={(
                event
              ) =>
                setForm(
                  (
                    current
                  ) => ({
                    ...current,
                    description:
                      event.target.value,
                  })
                )
              }
              maxLength={
                2000
              }
              rows={
                3
              }
              placeholder="What will you cover in this meeting?"
              className="mt-2 w-full resize-none border border-white/10 bg-[#060807] px-3 py-3 text-sm outline-none transition placeholder:text-white/20 focus:border-[#c7ff39]/40"
            />
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.13em] text-[#a1a1aa]">
                Date & time
              </span>

              <input
                type="datetime-local"
                value={
                  form.scheduledAt
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,
                      scheduledAt:
                        event.target.value,
                    })
                  )
                }
                required
                className="mt-2 min-h-11 w-full border border-white/10 bg-[#060807] px-3 text-sm outline-none transition focus:border-[#c7ff39]/40"
              />
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.13em] text-[#a1a1aa]">
                Duration
              </span>

              <select
                value={
                  form.durationMinutes
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,
                      durationMinutes:
                        Number(
                          event.target.value
                        ),
                    })
                  )
                }
                className="mt-2 min-h-11 w-full border border-white/10 bg-[#060807] px-3 text-sm outline-none transition focus:border-[#c7ff39]/40"
              >
                <option value="30">
                  30 minutes
                </option>

                <option value="45">
                  45 minutes
                </option>

                <option value="60">
                  60 minutes
                </option>

                <option value="90">
                  90 minutes
                </option>

                <option value="120">
                  120 minutes
                </option>
              </select>
            </label>
          </div>

          <div className="mt-4 border border-[#c7ff39]/20 bg-[#c7ff39]/[0.035] p-4">
            <div className="flex items-center gap-2 text-[#c7ff39]">
              <Video
                size={14}
              />

              <p className="text-[10px] uppercase tracking-[0.14em]">
                SkillMeet included
              </p>
            </div>

            <p className="mt-2 text-xs leading-6 text-[#a1a1aa]">
              No external meeting link is required. SkillSwap will create a private SkillMeet room automatically for both Swap Masters after the session is scheduled.
            </p>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={
                saving
              }
              onClick={
                onClose
              }
              className="min-h-11 border border-white/15 px-5 text-sm text-[#a1a1aa] transition hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008] transition hover:bg-[#d4ff66] disabled:opacity-50"
            >
              {saving ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <CalendarDays
                  size={15}
                />
              )}

              Schedule SkillMeet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   SKILL BOX
========================================================= */

function SkillBox({
  eyebrow,
  skill,
}) {
  return (
    <div className="border border-white/10 bg-[#060807] p-4">
      <p className="text-[9px] uppercase tracking-[0.14em] text-white/30">
        {
          eyebrow
        }
      </p>

      <p className="mt-1.5 text-sm font-medium text-[#f2f4ef]">
        {
          skill
        }
      </p>
    </div>
  );
}
