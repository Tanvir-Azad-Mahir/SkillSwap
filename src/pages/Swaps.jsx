import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  GraduationCap,
  Loader2,
  MapPin,
  RefreshCw,
  Repeat2,
  Send,
  Sparkles,
  UserRound,
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

        const [
          profilesResult,
          skillsResult,
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

        setProfiles(
          profilesResult.data ||
            []
        );

        setSkills(
          skillsResult.data ||
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
              active
            />
          )}
        </div>
      </div>
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
  incoming = false,
  active = false,
  onAccept,
  onReject,
}) {
  if (
    swaps.length ===
    0
  ) {
    return (
      <section className="mt-6 border border-white/10 bg-[#0a0d0b]/70 p-9 md:p-12">
        <Clock3
          size={24}
          className="text-[#737373]"
        />

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

            const acceptKey =
              `Accepted-${swap.id}`;

            const rejectKey =
              `Rejected-${swap.id}`;

            const processing =
              actionId ===
                acceptKey ||
              actionId ===
                rejectKey;

            return (
              <article
                key={
                  swap.id
                }
                className="border border-white/10 bg-[#0a0d0b]/80 p-6"
              >
                <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`border px-2 py-1 text-[9px] uppercase tracking-[0.14em] ${
                          active
                            ? "border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] text-[#c7ff39]"
                            : "border-[#ffbf69]/25 bg-[#ffbf69]/[0.04] text-[#ffca80]"
                        }`}
                      >
                        {
                          swap.status
                        }
                      </span>

                      {active && (
                        <span className="border border-white/10 px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-[#a1a1aa]">
                          Reward{" "}
                          {
                            swap.reward_credits
                          }{" "}
                          SS
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
                      {active
                        ? `Accepted ${formatDate(
                            swap.accepted_at
                          )}`
                        : `Requested ${formatDate(
                            swap.created_at
                          )}`}
                    </p>
                  </div>

                  {incoming && (
                    <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
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

                  {active && (
                    <div className="border border-white/10 bg-[#060807] px-5 py-4">
                      <div className="flex items-center gap-2 text-[#c7ff39]">
                        <GraduationCap
                          size={14}
                        />

                        <p className="text-[9px] uppercase tracking-[0.14em]">
                          Swap active
                        </p>
                      </div>

                      <p className="mt-2 max-w-[220px] text-xs leading-5 text-[#a1a1aa]">
                        Completion confirmation
                        and SS rewards will be
                        added in the next step.
                      </p>
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
