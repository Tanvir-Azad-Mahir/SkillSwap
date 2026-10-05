import {

  useCallback,

  useEffect,

  useMemo,

  useState,

} from "react";

import {

  ArrowLeft,

  CalendarDays,

  CheckCircle2,

  Clock3,

  ExternalLink,

  GraduationCap,

  Loader2,

  RefreshCw,

  Repeat2,

  UserRound,

  Video,

  XCircle,

} from "lucide-react";

import {

  useNavigate,

} from "react-router-dom";

import {

  supabase,

} from "../lib/supabase";

import SessionReviewModal from "../components/SessionReviewModal";

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

function normalizeStatus(value) {

  return String(

    value || ""

  )

    .trim()

    .toLowerCase();

}

function formatDateTime(value) {

  if (!value) {

    return {

      date:

        "Date unavailable",

      time: "",

    };

  }

  const date =

    new Date(value);

  if (

    Number.isNaN(

      date.getTime()

    )

  ) {

    return {

      date:

        "Date unavailable",

      time: "",

    };

  }

  return {

    date:

      new Intl.DateTimeFormat(

        undefined,

        {

          dateStyle:

            "medium",

        }

      ).format(date),

    time:

      new Intl.DateTimeFormat(

        undefined,

        {

          hour:

            "numeric",

          minute:

            "2-digit",

        }

      ).format(date),

  };

}

function getProfileName(profile) {

  return (

    profile?.full_name ||

    profile?.username ||

    "SkillSwap+ member"

  );

}

function getStatusClasses(status) {

  const clean =

    normalizeStatus(

      status

    );

  if (

    clean ===

    "completed"

  ) {

    return "border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] text-[#c7ff39]";

  }

  if (

    clean ===

      "cancelled" ||

    clean ===

      "canceled"

  ) {

    return "border-[#ff6b6b]/25 bg-[#ff6b6b]/[0.04] text-[#ff8b8b]";

  }

  if (

    clean ===

      "scheduled" ||

    clean ===

      "pending" ||

    clean ===

      "confirmed"

  ) {

    return "border-[#ffbf69]/25 bg-[#ffbf69]/[0.04] text-[#ffca80]";

  }

  return "border-white/10 bg-white/[0.025] text-[#a1a1aa]";

}

function isCompleted(

  session

) {

  return (

    normalizeStatus(

      session.status

    ) ===

    "completed"

  );

}

function isCancelled(

  session

) {

  const status =

    normalizeStatus(

      session.status

    );

  return (

    status ===

      "cancelled" ||

    status ===

      "canceled"

  );

}

function isUpcoming(

  session

) {

  if (

    isCompleted(session) ||

    isCancelled(session)

  ) {

    return false;

  }

  return Boolean(

    session.scheduled_at

  );

}

function getMeetingProvider(

  session

) {

  const explicit =

    String(

      session?.meeting_provider ||

        ""

    )

      .trim()

      .toLowerCase();

  if (

    explicit ===

      "skillmeet" ||

    explicit ===

      "skill_meet"

  ) {

    return "skillmeet";

  }

  if (

    explicit ===

      "googlemeet" ||

    explicit ===

      "google_meet"

  ) {

    return "googlemeet";

  }

  const meetingUrl =

    String(

      session?.meeting_url ||

        ""

    ).trim();

  if (

    meetingUrl.startsWith(

      "/skillmeet/"

    )

  ) {

    return "skillmeet";

  }

  if (

    /meet\.google\.com/i.test(

      meetingUrl

    )

  ) {

    return "googlemeet";

  }

  if (

    /^https?:\/\//i.test(

      meetingUrl

    )

  ) {

    return "external";

  }

  // New SkillSwap+ sessions default to the

  // built-in meeting experience.

  return "skillmeet";

}

function getSkillMeetPath(

  session

) {

  const type =

    session?.session_type ===

    "swap"

      ? "swap"

      : "mentor";

  const storedPath =

    String(

      session?.meeting_url ||

        ""

    ).trim();

  if (

    storedPath.startsWith(

      "/skillmeet/"

    )

  ) {

    return storedPath;

  }

  return `/skillmeet/${type}/${session.id}`;

}

function getMeetingButtonLabel(

  session

) {

  const provider =

    getMeetingProvider(

      session

    );

  if (

    provider ===

    "skillmeet"

  ) {

    return "Join SkillMeet";

  }

  if (

    provider ===

    "googlemeet"

  ) {

    return "Open Google Meet";

  }

  return "Open meeting";

}

const TABS = [

  {

    id: "upcoming",

    label: "Scheduled",

  },

  {

    id: "completed",

    label: "Completed",

  },

  {

    id: "cancelled",

    label: "Cancelled",

  },

];

/* =========================================================

   PAGE

========================================================= */

export default function Sessions() {

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

    allSessions,

    setAllSessions,

  ] = useState([]);

  const [

    tab,

    setTab,

  ] = useState(

    "upcoming"

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

    reviewSession,

    setReviewSession,

  ] = useState(null);

  /* =========================================================

     LOAD

  ========================================================= */

  const loadSessions =

    useCallback(

      async (

        showPageLoader =

          false

      ) => {

        try {

          if (

            showPageLoader

          ) {

            setLoading(

              true

            );

          } else {

            setRefreshing(

              true

            );

          }

          setError("");

          const {

            data: {

              user:

                authUser,

            },

            error:

              authError,

          } =

            await supabase.auth.getUser();

          if (

            authError

          ) {

            throw authError;

          }

          if (

            !authUser

          ) {

            navigate(

              "/login",

              {

                replace:

                  true,

              }

            );

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

                scope:

                  "local",

              }

            );

            navigate(

              "/login",

              {

                replace:

                  true,

              }

            );

            return;

          }

          if (

            profileData.profile_completed !==

            true

          ) {

            navigate(

              "/profile-setup",

              {

                replace:

                  true,

              }

            );

            return;

          }

          const normalizedProfile =

            {

              ...profileData,

              role:

                normalizeRole(

                  profileData.role

                ),

            };

          setProfile(

            normalizedProfile

          );

          const isSwapMaster =

            normalizedProfile.role ===

            "swap_master";

          const [

            normalResult,

            swapSessionResult,

            swapResult,

          ] =

            await Promise.all([

              supabase

                .from(

                  "sessions"

                )

                .select(

                  `

                    id,

                    learner_id,

                    mentor_id,

                    skill_id,

                    title,

                    description,

                    meeting_url,

                    scheduled_at,

                    duration_minutes,

                    status

                  `

                )

                .or(

                  `learner_id.eq.${authUser.id},mentor_id.eq.${authUser.id}`

                )

                .order(

                  "scheduled_at",

                  {

                    ascending:

                      false,

                  }

                ),

              isSwapMaster

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

                    .order(

                      "scheduled_at",

                      {

                        ascending:

                          false,

                      }

                    )

                : Promise.resolve({

                    data: [],

                    error: null,

                  }),

              isSwapMaster

                ? supabase

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

                        reward_credits

                      `

                    )

                    .or(

                      `requester_id.eq.${authUser.id},partner_id.eq.${authUser.id}`

                    )

                : Promise.resolve({

                    data: [],

                    error: null,

                  }),

            ]);

          if (

            normalResult.error

          ) {

            console.warn(

              "NORMAL SESSIONS ERROR:",

              normalResult.error

            );

          }

          if (

            swapSessionResult.error

          ) {

            console.warn(

              "SWAP SESSIONS ERROR:",

              swapSessionResult.error

            );

          }

          if (

            swapResult.error

          ) {

            console.warn(

              "SKILL SWAPS ERROR:",

              swapResult.error

            );

          }

          const normalRows =

            normalResult.error

              ? []

              : normalResult.data ||

                [];

          const swapSessionRows =

            swapSessionResult.error

              ? []

              : swapSessionResult.data ||

                [];

          const swapRows =

            swapResult.error

              ? []

              : swapResult.data ||

                [];

          const swapMap =

            new Map(

              swapRows.map(

                (swap) => [

                  swap.id,

                  swap,

                ]

              )

            );

          const profileIds =

            new Set();

          const skillIds =

            new Set();

          normalRows.forEach(

            (session) => {

              if (

                session.learner_id

              ) {

                profileIds.add(

                  session.learner_id

                );

              }

              if (

                session.mentor_id

              ) {

                profileIds.add(

                  session.mentor_id

                );

              }

              if (

                session.skill_id

              ) {

                skillIds.add(

                  session.skill_id

                );

              }

            }

          );

          swapRows.forEach(

            (swap) => {

              if (

                swap.requester_id

              ) {

                profileIds.add(

                  swap.requester_id

                );

              }

              if (

                swap.partner_id

              ) {

                profileIds.add(

                  swap.partner_id

                );

              }

              if (

                swap.requester_teaches_skill_id

              ) {

                skillIds.add(

                  swap.requester_teaches_skill_id

                );

              }

              if (

                swap.partner_teaches_skill_id

              ) {

                skillIds.add(

                  swap.partner_teaches_skill_id

                );

              }

            }

          );

          const reviewableSessionIds =

            normalRows

              .map((session) => session.id)

              .filter(Boolean);

          const [

            profilesResult,

            skillsResult,

            reviewsResult,

          ] =

            await Promise.all([

              profileIds.size >

              0

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

                        role

                      `

                    )

                    .in(

                      "id",

                      [

                        ...profileIds,

                      ]

                    )

                : Promise.resolve({

                    data: [],

                    error: null,

                  }),

              skillIds.size >

              0

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

                      [

                        ...skillIds,

                      ]

                    )

                : Promise.resolve({

                    data: [],

                    error: null,

                  }),

              reviewableSessionIds.length >

              0

                ? supabase

                    .from(

                      "reviews"

                    )

                    .select(

                      `

                        id,

                        session_id,

                        reviewer_id,

                        reviewee_id,

                        rating,

                        comment,

                        created_at,

                        updated_at

                      `

                    )

                    .eq(

                      "reviewer_id",

                      authUser.id

                    )

                    .in(

                      "session_id",

                      reviewableSessionIds

                    )

                : Promise.resolve({

                    data: [],

                    error: null,

                  }),

            ]);

          if (

            profilesResult.error

          ) {

            console.warn(

              "SESSION PROFILES ERROR:",

              profilesResult.error

            );

          }

          if (

            skillsResult.error

          ) {

            console.warn(

              "SESSION SKILLS ERROR:",

              skillsResult.error

            );

          }

          if (

            reviewsResult.error

          ) {

            console.warn(

              "SESSION REVIEWS ERROR:",

              reviewsResult.error

            );

          }

          const profileMap =

            new Map(

              (

                profilesResult.data ||

                []

              ).map(

                (

                  member

                ) => [

                  member.id,

                  member,

                ]

              )

            );

          const skillMap =

            new Map(

              (

                skillsResult.data ||

                []

              ).map(

                (

                  skill

                ) => [

                  skill.id,

                  skill,

                ]

              )

            );

          const reviewMap =

            new Map(

              (

                reviewsResult.data ||

                []

              ).map(

                (review) => [

                  review.session_id,

                  review,

                ]

              )

            );

          const normalItems =

            normalRows.map(

              (

                session

              ) => {

                const amMentor =

                  session.mentor_id ===

                  authUser.id;

                const otherId =

                  amMentor

                    ? session.learner_id

                    : session.mentor_id;

                return {

                  ...session,

                  session_type:

                    "standard",

                  skill:

                    skillMap.get(

                      session.skill_id

                    ) ||

                    null,

                  viewer_role:

                    amMentor

                      ? "Mentor"

                      : "Learner",

                  counterpart:

                    profileMap.get(

                      otherId

                    ) ||

                    null,

                  my_review:

                    reviewMap.get(

                      session.id

                    ) ||

                    null,

                };

              }

            );

          const swapItems =

            swapSessionRows.map(

              (

                session

              ) => {

                const swap =

                  swapMap.get(

                    session.swap_id

                  ) ||

                  null;

                if (

                  !swap

                ) {

                  return {

                    ...session,

                    session_type:

                      "swap",

                    swap:

                      null,

                    partner:

                      null,

                    my_skill:

                      null,

                    partner_skill:

                      null,

                  };

                }

                const amRequester =

                  swap.requester_id ===

                  authUser.id;

                const partnerId =

                  amRequester

                    ? swap.partner_id

                    : swap.requester_id;

                const mySkillId =

                  amRequester

                    ? swap.requester_teaches_skill_id

                    : swap.partner_teaches_skill_id;

                const partnerSkillId =

                  amRequester

                    ? swap.partner_teaches_skill_id

                    : swap.requester_teaches_skill_id;

                return {

                  ...session,

                  session_type:

                    "swap",

                  swap,

                  partner:

                    profileMap.get(

                      partnerId

                    ) ||

                    null,

                  my_skill:

                    skillMap.get(

                      mySkillId

                    ) ||

                    null,

                  partner_skill:

                    skillMap.get(

                      partnerSkillId

                    ) ||

                    null,

                };

              }

            );

          setAllSessions(

            [

              ...normalItems,

              ...swapItems,

            ].sort(

              (

                a,

                b

              ) =>

                new Date(

                  b.scheduled_at ||

                    0

                ).getTime() -

                new Date(

                  a.scheduled_at ||

                    0

                ).getTime()

            )

          );

        } catch (err) {

          console.error(

            "SESSIONS PAGE ERROR:",

            err

          );

          setError(

            err?.message ===

              "PROFILE_NOT_FOUND"

              ? "Your SkillSwap+ profile could not be found."

              : err?.message ||

                  "The sessions page could not be loaded."

          );

        } finally {

          setLoading(

            false

          );

          setRefreshing(

            false

          );

        }

      },

      [navigate]

    );

  useEffect(() => {

    loadSessions(

      true

    );

  }, [loadSessions]);

  /* =========================================================

     FILTERED LIST

  ========================================================= */

  const filteredSessions =

    useMemo(

      () => {

        const rows =

          allSessions.filter(

            (session) => {

              if (

                tab ===

                "completed"

              ) {

                return isCompleted(

                  session

                );

              }

              if (

                tab ===

                "cancelled"

              ) {

                return isCancelled(

                  session

                );

              }

              return isUpcoming(

                session

              );

            }

          );

        return rows.sort(

          (

            a,

            b

          ) => {

            const aTime =

              new Date(

                a.scheduled_at ||

                  0

              ).getTime();

            const bTime =

              new Date(

                b.scheduled_at ||

                  0

              ).getTime();

            return tab ===

              "upcoming"

              ? aTime -

                  bTime

              : bTime -

                  aTime;

          }

        );

      },

      [

        allSessions,

        tab,

      ]

    );

  const counts =

    useMemo(

      () => ({

        upcoming:

          allSessions.filter(

            isUpcoming

          ).length,

        completed:

          allSessions.filter(

            isCompleted

          ).length,

        cancelled:

          allSessions.filter(

            isCancelled

          ).length,

      }),

      [allSessions]

    );

  /* =========================================================

     MEETING

  ========================================================= */

  const openMeeting =

    useCallback(

      (session) => {

        if (!session?.id) {

          return;

        }

        const provider =

          getMeetingProvider(

            session

          );

        if (

          provider ===

          "skillmeet"

        ) {

          navigate(

            getSkillMeetPath(

              session

            )

          );

          return;

        }

        const meetingUrl =

          String(

            session.meeting_url ||

              ""

          ).trim();

        if (!meetingUrl) {

          setError(

            "This session does not have a meeting link."

          );

          return;

        }

        window.open(

          meetingUrl,

          "_blank",

          "noopener,noreferrer"

        );

      },

      [navigate]

    );

  /* =========================================================

     SWAP SESSION ACTIONS

  ========================================================= */

  const completeSwapSession =

    async (

      session

    ) => {

      if (

        !session?.id ||

        actionId

      ) {

        return;

      }

      const key =

        `complete-${session.id}`;

      try {

        setActionId(

          key

        );

        setError("");

        setSuccess("");

        const {

          error:

            rpcError,

        } =

          await supabase.rpc(

            "complete_swap_session",

            {

              p_session_id:

                session.id,

            }

          );

        if (

          rpcError

        ) {

          throw rpcError;

        }

        setSuccess(

          "Shared swap session marked complete."

        );

        await loadSessions(

          false

        );

      } catch (err) {

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

            "This session can only be completed after its scheduled start time."

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

  const cancelSwapSession =

    async (

      session

    ) => {

      if (

        !session?.id ||

        actionId

      ) {

        return;

      }

      const confirmed =

        window.confirm(

          `Cancel "${session.title || "this session"}"?`

        );

      if (

        !confirmed

      ) {

        return;

      }

      const key =

        `cancel-${session.id}`;

      try {

        setActionId(

          key

        );

        setError("");

        setSuccess("");

        const {

          error:

            rpcError,

        } =

          await supabase.rpc(

            "cancel_swap_session",

            {

              p_session_id:

                session.id,

            }

          );

        if (

          rpcError

        ) {

          throw rpcError;

        }

        setSuccess(

          "Shared swap session cancelled."

        );

        await loadSessions(

          false

        );

      } catch (err) {

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

  /* =========================================================

     STANDARD MENTOR SESSION ACTIONS

  ========================================================= */

  const completeMentorSession =

    async (

      session

    ) => {

      if (

        !session?.id ||

        actionId

      ) {

        return;

      }

      const key =

        `mentor-complete-${session.id}`;

      try {

        setActionId(

          key

        );

        setError("");

        setSuccess("");

        const {

          error:

            rpcError,

        } =

          await supabase.rpc(

            "complete_mentor_session",

            {

              p_session_id:

                session.id,

            }

          );

        if (

          rpcError

        ) {

          throw rpcError;

        }

        setSuccess(

          "Mentor session marked complete."

        );

        await loadSessions(

          false

        );

      } catch (err) {

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

            "This session can only be completed after its scheduled start time."

          );

        } else {

          setError(

            err?.message ||

              "The mentor session could not be completed."

          );

        }

      } finally {

        setActionId(

          null

        );

      }

    };

  const cancelMentorSession =

    async (

      session

    ) => {

      if (

        !session?.id ||

        actionId

      ) {

        return;

      }

      const confirmed =

        window.confirm(

          "Cancel this mentor session?"

        );

      if (

        !confirmed

      ) {

        return;

      }

      const key =

        `mentor-cancel-${session.id}`;

      try {

        setActionId(

          key

        );

        setError("");

        setSuccess("");

        const {

          error:

            rpcError,

        } =

          await supabase.rpc(

            "cancel_mentor_session",

            {

              p_session_id:

                session.id,

            }

          );

        if (

          rpcError

        ) {

          throw rpcError;

        }

        setSuccess(

          "Mentor session cancelled."

        );

        await loadSessions(

          false

        );

      } catch (err) {

        setError(

          err?.message ||

            "The mentor session could not be cancelled."

        );

      } finally {

        setActionId(

          null

        );

      }

    };

  const handleReviewSubmitted = useCallback(

    (review) => {

      if (!review?.session_id) {

        return;

      }

      setAllSessions((current) =>

        current.map((session) =>

          session.session_type === "standard" &&

          session.id === review.session_id

            ? {

                ...session,

                my_review: review,

              }

            : session

        )

      );

      setReviewSession(null);

      setError("");

      setSuccess("Mentor review submitted.");

    },

    []

  );

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

            Loading sessions

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

            "radial-gradient(ellipse at 76% 5%, rgba(199,255,57,.055), transparent 34%)",

        }}

      />

      <div className="relative z-10">

        {/* TOP BAR */}

        <header className="border-b border-white/10 bg-[#060807]/90 backdrop-blur-xl">

          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-4 md:px-8">

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

              <div className="min-w-0">

                <p className="text-[9px] uppercase tracking-[0.17em] text-[#c7ff39]">

                  SkillSwap+

                </p>

                <h1 className="truncate text-lg font-medium tracking-[-0.03em]">

                  Sessions

                </h1>

              </div>

            </div>

            <button

              type="button"

              onClick={() =>

                loadSessions(

                  false

                )

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

        <div className="mx-auto max-w-[1400px] px-5 pb-20 pt-8 md:px-8">

          {/* INTRO */}

          <section className="overflow-hidden border border-white/10 bg-[#0a0d0b]/75">

            <div className="grid lg:grid-cols-[1fr_.7fr]">

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

                    <CalendarDays

                      size={11}

                    />

                    Learning schedule

                  </div>

                  <h2 className="mt-5 max-w-2xl text-2xl font-medium tracking-[-0.045em] md:text-3xl">

                    Keep every learning meeting in one place.

                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[#a1a1aa]">

                    Standard mentor sessions and shared Skill Swap meetings are shown together here.

                  </p>

                </div>

              </div>

              <div className="grid grid-cols-3 border-t border-white/10 lg:border-l lg:border-t-0">

                <SessionMetric

                  value={

                    counts.upcoming

                  }

                  label="Scheduled"

                />

                <SessionMetric

                  value={

                    counts.completed

                  }

                  label="Completed"

                  bordered

                />

                <SessionMetric

                  value={

                    counts.cancelled

                  }

                  label="Cancelled"

                  bordered

                />

              </div>

            </div>

          </section>

          {/* MESSAGES */}

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

          {/* TABS */}

          <div className="mt-6 flex overflow-x-auto border border-white/10 bg-[#0a0d0b]/75">

            {TABS.map(

              (item) => {

                const active =

                  tab ===

                  item.id;

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

                      setError(

                        ""

                      );

                      setSuccess(

                        ""

                      );

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

          {/* LIST */}

          <section className="mt-5 border border-white/10 bg-[#0a0d0b]/70">

            {filteredSessions.length >

            0 ? (

              <div>

                {filteredSessions.map(

                  (

                    session,

                    index

                  ) => (

                    <SessionCard

                      key={`${session.session_type}-${session.id}`}

                      session={

                        session

                      }

                      user={

                        user

                      }

                      actionId={

                        actionId

                      }

                      onOpenMeeting={

                        openMeeting

                      }

                      onOpenSwap={() =>

                        navigate(

                          "/swaps"

                        )

                      }

                      onCompleteSwapSession={

                        completeSwapSession

                      }

                      onCancelSwapSession={

                        cancelSwapSession

                      }

                      onCompleteMentorSession={

                        completeMentorSession

                      }

                      onCancelMentorSession={

                        cancelMentorSession

                      }

                      onReviewMentor={

                        setReviewSession

                      }

                      last={

                        index ===

                        filteredSessions.length -

                          1

                      }

                    />

                  )

                )}

              </div>

            ) : (

              <EmptyState

                tab={

                  tab

                }

                isSwapMaster={

                  profile?.role ===

                  "swap_master"

                }

                onSwaps={() =>

                  navigate(

                    "/swaps"

                  )

                }

              />

            )}

          </section>

        </div>

      </div>

      {reviewSession &&

        user?.id && (

          <SessionReviewModal

            session={reviewSession}

            reviewerId={user.id}

            revieweeId={reviewSession.counterpart?.id}

            onClose={() => setReviewSession(null)}

            onSubmitted={handleReviewSubmitted}

          />

        )}

    </main>

  );

}

/* =========================================================

   SESSION METRIC

========================================================= */

function SessionMetric({

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

      <p className="text-2xl font-medium tracking-[-0.05em] text-[#f2f4ef]">

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

   SESSION CARD

========================================================= */

function SessionCard({

  session,

  actionId,

  onOpenMeeting,

  onOpenSwap,

  onCompleteSwapSession,

  onCancelSwapSession,

  onCompleteMentorSession,

  onCancelMentorSession,

  onReviewMentor,

  last,

}) {

  const swapSession =

    session.session_type ===

    "swap";

  const {

    date,

    time,

  } =

    formatDateTime(

      session.scheduled_at

    );

  const duration =

    Number(

      session.duration_minutes

    ) || 0;

  const completeKey =

    `complete-${session.id}`;

  const cancelKey =

    `cancel-${session.id}`;

  const mentorCompleteKey =

    `mentor-complete-${session.id}`;

  const mentorCancelKey =

    `mentor-cancel-${session.id}`;

  const busy =

    actionId ===

      completeKey ||

    actionId ===

      cancelKey ||

    actionId ===

      mentorCompleteKey ||

    actionId ===

      mentorCancelKey;

  const canManageMentorSession =

    !swapSession &&

    session.viewer_role ===

      "Mentor";

  const completed =

    isCompleted(

      session

    );

  const canReviewMentor =

    !swapSession &&

    completed &&

    session.viewer_role === "Learner" &&

    Boolean(session.counterpart?.id);

  const cancelled =

    isCancelled(

      session

    );

  const meetingProvider =

    getMeetingProvider(

      session

    );

  const canOpenMeeting =

    !completed &&

    !cancelled &&

    (

      meetingProvider ===

        "skillmeet" ||

      Boolean(

        session.meeting_url

      )

    );

  const meetingLabel =

    getMeetingButtonLabel(

      session

    );

  const skillTitle =

    swapSession

      ? [

          session.my_skill

            ?.name,

          session.partner_skill

            ?.name,

        ]

          .filter(Boolean)

          .join(" ↔ ") ||

        session.title ||

        "Skill swap session"

      : session.title ||

        session.skill

          ?.name ||

        "Mentor session";

  const subtitle =

    swapSession

      ? `With ${getProfileName(

          session.partner

        )}`

      : `${session.viewer_role} · ${getProfileName(

          session.counterpart

        )}`;

  return (

    <article

      className={`p-5 md:p-6 ${

        !last

          ? "border-b border-white/10"

          : ""

      }`}

    >

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">

        <div className="flex min-w-0 gap-4">

          <div

            className={`grid h-11 w-11 shrink-0 place-items-center border ${

              swapSession

                ? "border-[#c7ff39]/20 bg-[#c7ff39]/[0.04] text-[#c7ff39]"

                : "border-white/10 bg-white/[0.025] text-[#a1a1aa]"

            }`}

          >

            {swapSession ? (

              <Repeat2

                size={18}

              />

            ) : (

              <GraduationCap

                size={18}

              />

            )}

          </div>

          <div className="min-w-0">

            <div className="flex flex-wrap items-center gap-2">

              <span

                className={`border px-2 py-1 text-[8px] uppercase tracking-[0.14em] ${

                  swapSession

                    ? "border-[#c7ff39]/20 bg-[#c7ff39]/[0.035] text-[#c7ff39]"

                    : "border-white/10 bg-white/[0.02] text-[#a1a1aa]"

                }`}

              >

                {swapSession

                  ? "Skill Swap"

                  : "Mentor session"}

              </span>

              <span

                className={`border px-2 py-1 text-[8px] uppercase tracking-[0.14em] ${getStatusClasses(

                  session.status

                )}`}

              >

                {

                  session.status ||

                  "Scheduled"

                }

              </span>

            </div>

            <h3 className="mt-3 text-lg font-medium tracking-[-0.03em] text-[#f2f4ef]">

              {

                skillTitle

              }

            </h3>

            {swapSession &&

              session.title &&

              session.title !==

                skillTitle && (

                <p className="mt-1 text-xs text-white/40">

                  {

                    session.title

                  }

                </p>

              )}

            {!swapSession &&

              session.title &&

              session.skill?.name && (

                <p className="mt-1 text-xs text-white/40">

                  {

                    session.skill.name

                  }

                </p>

              )}

            <div className="mt-3 flex items-center gap-2 text-xs text-[#a1a1aa]">

              <UserRound

                size={12}

              />

              {

                subtitle

              }

            </div>

            {session.description && (

              <p className="mt-3 max-w-2xl text-xs leading-6 text-white/35">

                {

                  session.description

                }

              </p>

            )}

          </div>

        </div>

        <div className="xl:min-w-[390px]">

          <div className="grid grid-cols-3 gap-2">

            <InfoBox

              icon={

                <CalendarDays

                  size={12}

                />

              }

              label="Date"

              value={

                date

              }

            />

            <InfoBox

              icon={

                <Clock3

                  size={12}

                />

              }

              label="Time"

              value={

                time ||

                "—"

              }

            />

            <InfoBox

              icon={

                <Clock3

                  size={12}

                />

              }

              label="Duration"

              value={

                duration >

                0

                  ? `${duration} min`

                  : "—"

              }

            />

          </div>

          {swapSession && (

            <div className="mt-3 flex flex-wrap justify-start gap-2 xl:justify-end">

              {canOpenMeeting && (

                <button

                  type="button"

                  onClick={() =>

                    onOpenMeeting(

                      session

                    )

                  }

                  className="inline-flex min-h-10 items-center gap-2 bg-[#c7ff39] px-4 text-xs font-semibold text-[#071008] transition hover:bg-[#d4ff66]"

                >

                  <Video

                    size={13}

                  />

                  {meetingLabel}

                  {meetingProvider !==

                    "skillmeet" && (

                    <ExternalLink

                      size={11}

                    />

                  )}

                </button>

              )}

              <button

                type="button"

                onClick={

                  onOpenSwap

                }

                className="inline-flex min-h-10 items-center gap-2 border border-white/10 px-4 text-xs text-[#a1a1aa] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"

              >

                <Repeat2

                  size={13}

                />

                View swap

              </button>

              {!completed &&

                !cancelled && (

                  <>

                    <button

                      type="button"

                      disabled={

                        busy

                      }

                      onClick={() =>

                        onCompleteSwapSession(

                          session

                        )

                      }

                      className="inline-flex min-h-10 items-center gap-2 border border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] px-4 text-xs text-[#c7ff39] transition hover:bg-[#c7ff39]/[0.08] disabled:opacity-50"

                    >

                      {actionId ===

                      completeKey ? (

                        <Loader2

                          size={13}

                          className="animate-spin"

                        />

                      ) : (

                        <CheckCircle2

                          size={13}

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

                        onCancelSwapSession(

                          session

                        )

                      }

                      className="inline-flex min-h-10 items-center gap-2 border border-white/10 px-4 text-xs text-[#a1a1aa] transition hover:border-[#ff6b6b]/30 hover:text-[#ff8b8b] disabled:opacity-50"

                    >

                      {actionId ===

                      cancelKey ? (

                        <Loader2

                          size={13}

                          className="animate-spin"

                        />

                      ) : (

                        <XCircle

                          size={13}

                        />

                      )}

                      Cancel

                    </button>

                  </>

                )}

            </div>

          )}

          {!swapSession &&

            canOpenMeeting && (

            <div className="mt-3 flex flex-wrap justify-start gap-2 xl:justify-end">

              <button

                type="button"

                onClick={() =>

                  onOpenMeeting(

                    session

                  )

                }

                className="inline-flex min-h-10 items-center gap-2 bg-[#c7ff39] px-4 text-xs font-semibold text-[#071008] transition hover:bg-[#d4ff66]"

              >

                <Video

                  size={13}

                />

                {meetingLabel}

                {meetingProvider !==

                  "skillmeet" && (

                  <ExternalLink

                    size={11}

                  />

                )}

              </button>

            </div>

          )}

          {canManageMentorSession &&

            !completed &&

            !cancelled && (

            <div className="mt-3 flex flex-wrap justify-start gap-2 xl:justify-end">

              <button

                type="button"

                disabled={

                  busy

                }

                onClick={() =>

                  onCompleteMentorSession(

                    session

                  )

                }

                className="inline-flex min-h-10 items-center gap-2 border border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] px-4 text-xs text-[#c7ff39] transition hover:bg-[#c7ff39]/[0.08] disabled:opacity-50"

              >

                {actionId ===

                mentorCompleteKey ? (

                  <Loader2

                    size={13}

                    className="animate-spin"

                  />

                ) : (

                  <CheckCircle2

                    size={13}

                  />

                )}

                Complete session

              </button>

              <button

                type="button"

                disabled={

                  busy

                }

                onClick={() =>

                  onCancelMentorSession(

                    session

                  )

                }

                className="inline-flex min-h-10 items-center gap-2 border border-white/10 px-4 text-xs text-[#a1a1aa] transition hover:border-[#ff6b6b]/30 hover:text-[#ff8b8b] disabled:opacity-50"

              >

                {actionId ===

                mentorCancelKey ? (

                  <Loader2

                    size={13}

                    className="animate-spin"

                  />

                ) : (

                  <XCircle

                    size={13}

                  />

                )}

                Cancel session

              </button>

            </div>

          )}

          {canReviewMentor && (

            <div className="mt-3 flex flex-wrap justify-start gap-2 xl:justify-end">

              {session.my_review ? (

                <div className="inline-flex min-h-10 items-center gap-2 border border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] px-4 text-xs text-[#c7ff39]">

                  <CheckCircle2 size={13} />

                  Reviewed · {session.my_review.rating}/5

                </div>

              ) : (

                <button

                  type="button"

                  onClick={() => onReviewMentor(session)}

                  className="inline-flex min-h-10 items-center gap-2 border border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] px-4 text-xs text-[#c7ff39] transition hover:bg-[#c7ff39]/[0.08]"

                >

                  Review Mentor

                </button>

              )}

            </div>

          )}

        </div>

      </div>

    </article>

  );

}

/* =========================================================

   INFO BOX

========================================================= */

function InfoBox({

  icon,

  label,

  value,

}) {

  return (

    <div className="min-w-0 border border-white/10 bg-[#060807] p-3">

      <div className="flex items-center gap-1.5 text-white/30">

        {

          icon

        }

        <p className="text-[8px] uppercase tracking-[0.13em]">

          {

            label

          }

        </p>

      </div>

      <p className="mt-2 break-words text-[11px] text-[#f2f4ef]">

        {

          value

        }

      </p>

    </div>

  );

}

/* =========================================================

   EMPTY

========================================================= */

function EmptyState({

  tab,

  isSwapMaster,

  onSwaps,

}) {

  const text =

    tab ===

    "completed"

      ? "Completed sessions will appear here."

      : tab ===

          "cancelled"

        ? "Cancelled sessions will appear here."

        : "Scheduled mentor and Skill Swap meetings will appear here.";

  return (

    <div className="p-8 text-center md:p-12">

      <div className="mx-auto grid h-12 w-12 place-items-center border border-white/10 text-white/25">

        <CalendarDays

          size={19}

        />

      </div>

      <h3 className="mt-5 text-lg font-medium tracking-[-0.03em]">

        No {

          tab

        } sessions.

      </h3>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#a1a1aa]">

        {

          text

        }

      </p>

      {tab ===

        "upcoming" &&

        isSwapMaster && (

          <button

            type="button"

            onClick={

              onSwaps

            }

            className="mt-5 inline-flex min-h-10 items-center gap-2 border border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] px-4 text-xs text-[#c7ff39] transition hover:bg-[#c7ff39]/[0.08]"

          >

            <Repeat2

              size={13}

            />

            Open skill swaps

          </button>

        )}

    </div>

  );

}
