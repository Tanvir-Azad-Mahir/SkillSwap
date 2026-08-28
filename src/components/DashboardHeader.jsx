import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  CheckCheck,
  GraduationCap,
  LogOut,
  MessageCircle,
  Pencil,
  Search,
  UserRound,
  X,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabase";

/* =========================================================
   ROLE LABELS
========================================================= */

const roleLabels = {
  learner: "Learner",
  mentor: "Mentor",
  swap_master: "Swap Master",
};

/* =========================================================
   NOTIFICATION TIME
========================================================= */

function formatNotificationTime(value) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const diffMs =
    Date.now() -
    date.getTime();

  const diffMinutes =
    Math.floor(
      diffMs / 60000
    );

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours =
    Math.floor(
      diffMinutes / 60
    );

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays =
    Math.floor(
      diffHours / 24
    );

  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      month: "short",
      day: "numeric",
    }
  ).format(date);
}

/* =========================================================
   DASHBOARD HEADER
========================================================= */

export default function DashboardHeader({
  profile,
  skills = [],
  mentors = [],
  learningSkills = [],
  teachingSkills = [],
  onLogout,
}) {
  const navigate = useNavigate();

  const [query, setQuery] =
    useState("");

  const [focused, setFocused] =
    useState(false);

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    notificationsOpen,
    setNotificationsOpen,
  ] = useState(false);

  const [
    notificationsLoading,
    setNotificationsLoading,
  ] = useState(false);

  const [
    notificationError,
    setNotificationError,
  ] = useState("");

  const notificationRef =
    useRef(null);

  /* =======================================================
     NOTIFICATIONS
  ======================================================= */

  const loadNotifications =
    async ({
      silent = false,
    } = {}) => {
      if (!profile?.id) {
        setNotifications([]);
        return;
      }

      try {
        if (!silent) {
          setNotificationsLoading(
            true
          );
        }

        setNotificationError("");

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "notifications"
            )
            .select(
              `
                id,
                user_id,
                type,
                title,
                message,
                reference_type,
                reference_id,
                is_read,
                created_at
              `
            )
            .eq(
              "user_id",
              profile.id
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            )
            .limit(10);

        if (error) {
          throw error;
        }

        setNotifications(
          data || []
        );
      } catch (err) {
        console.error(
          "NOTIFICATION LOAD ERROR:",
          err
        );

        setNotificationError(
          err?.message ||
            "Notifications could not be loaded."
        );
      } finally {
        if (!silent) {
          setNotificationsLoading(
            false
          );
        }
      }
    };

  useEffect(() => {
    if (!profile?.id) {
      setNotifications([]);
      return;
    }

    let active = true;

    const loadInitial =
      async () => {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              "notifications"
            )
            .select(
              `
                id,
                user_id,
                type,
                title,
                message,
                reference_type,
                reference_id,
                is_read,
                created_at
              `
            )
            .eq(
              "user_id",
              profile.id
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            )
            .limit(10);

        if (!active) {
          return;
        }

        if (error) {
          console.error(
            "INITIAL NOTIFICATION LOAD ERROR:",
            error
          );

          return;
        }

        setNotifications(
          data || []
        );
      };

    loadInitial();

    return () => {
      active = false;
    };
  }, [profile?.id]);

  useEffect(() => {
    const handleOutsideClick =
      (event) => {
        if (
          notificationRef.current &&
          !notificationRef.current.contains(
            event.target
          )
        ) {
          setNotificationsOpen(
            false
          );
        }
      };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const unreadNotificationCount =
    useMemo(
      () =>
        notifications.filter(
          (item) =>
            item.is_read !== true
        ).length,
      [notifications]
    );

  const toggleNotifications =
    async () => {
      const nextOpen =
        !notificationsOpen;

      setNotificationsOpen(
        nextOpen
      );

      if (nextOpen) {
        await loadNotifications();
      }
    };

  const markNotificationRead =
    async (
      notificationId
    ) => {
      const item =
        notifications.find(
          (notification) =>
            notification.id ===
            notificationId
        );

      if (
        !item ||
        item.is_read === true
      ) {
        return;
      }

      const {
        error,
      } =
        await supabase
          .from(
            "notifications"
          )
          .update({
            is_read: true,
          })
          .eq(
            "id",
            notificationId
          )
          .eq(
            "user_id",
            profile.id
          );

      if (error) {
        console.error(
          "MARK NOTIFICATION READ ERROR:",
          error
        );

        return;
      }

      setNotifications(
        (current) =>
          current.map(
            (notification) =>
              notification.id ===
              notificationId
                ? {
                    ...notification,
                    is_read: true,
                  }
                : notification
          )
      );
    };

  const markAllNotificationsRead =
    async () => {
      if (
        !profile?.id ||
        unreadNotificationCount ===
          0
      ) {
        return;
      }

      const {
        error,
      } =
        await supabase
          .from(
            "notifications"
          )
          .update({
            is_read: true,
          })
          .eq(
            "user_id",
            profile.id
          )
          .eq(
            "is_read",
            false
          );

      if (error) {
        console.error(
          "MARK ALL NOTIFICATIONS READ ERROR:",
          error
        );

        return;
      }

      setNotifications(
        (current) =>
          current.map(
            (notification) => ({
              ...notification,
              is_read: true,
            })
          )
      );
    };

  /* =======================================================
     CURRENT USER INITIALS
  ======================================================= */

  const initials = String(
    profile?.full_name ||
      profile?.username ||
      "S"
  )
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part[0]?.toUpperCase()
    )
    .join("");

  /* =======================================================
     USER SKILL IDS
  ======================================================= */

  const learningIds =
    useMemo(
      () =>
        new Set(
          learningSkills.map(
            (item) =>
              item.skill_id
          )
        ),
      [learningSkills]
    );

  const teachingIds =
    useMemo(
      () =>
        new Set(
          teachingSkills.map(
            (item) =>
              item.skill_id
          )
        ),
      [teachingSkills]
    );

  /* =======================================================
     CLEAN SEARCH QUERY
  ======================================================= */

  const cleanQuery =
    query
      .trim()
      .toLowerCase();

  /* =======================================================
     SKILL SEARCH
  ======================================================= */

  const skillResults =
    useMemo(() => {
      if (!cleanQuery) {
        return [];
      }

      return skills
        .filter((skill) => {
          const name =
            String(
              skill.name || ""
            ).toLowerCase();

          const description =
            String(
              skill.description ||
                ""
            ).toLowerCase();

          return (
            name.includes(
              cleanQuery
            ) ||
            description.includes(
              cleanQuery
            )
          );
        })
        .sort((a, b) => {
          const aName =
            String(
              a.name || ""
            ).toLowerCase();

          const bName =
            String(
              b.name || ""
            ).toLowerCase();

          const aStarts =
            aName.startsWith(
              cleanQuery
            );

          const bStarts =
            bName.startsWith(
              cleanQuery
            );

          if (
            aStarts &&
            !bStarts
          ) {
            return -1;
          }

          if (
            !aStarts &&
            bStarts
          ) {
            return 1;
          }

          return aName.localeCompare(
            bName
          );
        })
        .slice(0, 5);
    }, [
      skills,
      cleanQuery,
    ]);

  /* =======================================================
     MEMBER SEARCH

     "mentors" prop now contains:
     - learners
     - mentors
     - swap masters
  ======================================================= */

  const memberResults =
    useMemo(() => {
      if (!cleanQuery) {
        return [];
      }

      return mentors
        .filter((member) => {
          const fullName =
            String(
              member.full_name ||
                ""
            ).toLowerCase();

          const username =
            String(
              member.username ||
                ""
            ).toLowerCase();

          const location =
            String(
              member.location ||
                ""
            ).toLowerCase();

          const role =
            String(
              roleLabels[
                member.role
              ] ||
                member.role ||
                ""
            ).toLowerCase();

          /*
            If member teaches something,
            allow searching by that skill too.
          */

          const teachesMatchingSkill =
            (
              member.teachingSkills ||
              []
            ).some(
              (item) =>
                String(
                  item.skill
                    ?.name ||
                    ""
                )
                  .toLowerCase()
                  .includes(
                    cleanQuery
                  )
            );

          return (
            fullName.includes(
              cleanQuery
            ) ||
            username.includes(
              cleanQuery
            ) ||
            location.includes(
              cleanQuery
            ) ||
            role.includes(
              cleanQuery
            ) ||
            teachesMatchingSkill
          );
        })
        .sort((a, b) => {
          const aName =
            String(
              a.full_name ||
                a.username ||
                ""
            ).toLowerCase();

          const bName =
            String(
              b.full_name ||
                b.username ||
                ""
            ).toLowerCase();

          const aUsername =
            String(
              a.username || ""
            ).toLowerCase();

          const bUsername =
            String(
              b.username || ""
            ).toLowerCase();

          /*
            Prioritize username exact match.
          */

          if (
            aUsername ===
              cleanQuery &&
            bUsername !==
              cleanQuery
          ) {
            return -1;
          }

          if (
            aUsername !==
              cleanQuery &&
            bUsername ===
              cleanQuery
          ) {
            return 1;
          }

          /*
            Then prioritize names
            starting with query.
          */

          const aStarts =
            aName.startsWith(
              cleanQuery
            );

          const bStarts =
            bName.startsWith(
              cleanQuery
            );

          if (
            aStarts &&
            !bStarts
          ) {
            return -1;
          }

          if (
            !aStarts &&
            bStarts
          ) {
            return 1;
          }

          return aName.localeCompare(
            bName
          );
        })
        .slice(0, 6);
    }, [
      mentors,
      cleanQuery,
    ]);

  /* =======================================================
     RESULTS
  ======================================================= */

  const hasResults =
    skillResults.length > 0 ||
    memberResults.length > 0;

  /* =======================================================
     SKILL CLICK
  ======================================================= */

  const handleSkillClick =
    (skill) => {
      setQuery(
        skill.name
      );

      setFocused(false);
    };

  /* =======================================================
     MEMBER CLICK

     IMPORTANT:
     Opens PublicProfile.jsx
  ======================================================= */

  const handleMemberClick =
    (member) => {
      if (
        !member?.username
      ) {
        console.warn(
          "Cannot open profile: username missing",
          member
        );

        return;
      }

      setFocused(false);
      setQuery("");

      navigate(
        `/profile/${encodeURIComponent(
          member.username
        )}`
      );
    };

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#060807]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1500px] items-center gap-5 px-5 md:px-8 lg:px-10">
        {/* =================================================
            LOGO
        ================================================= */}

        <Link
          to="/dashboard"
          className="shrink-0 text-lg font-semibold tracking-[-0.035em]"
        >
          SKILLSWAP
          <span className="text-[#c7ff39]">
            +
          </span>
        </Link>

        {/* =================================================
            SEARCH
        ================================================= */}

        <div className="hidden flex-1 md:block">
          <div className="relative z-[100] max-w-xl">
            <Search
              size={16}
              strokeWidth={1.5}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a1a1aa]"
            />

            <input
              type="search"
              value={query}
              onChange={(
                event
              ) => {
                setQuery(
                  event.target
                    .value
                );

                setFocused(
                  true
                );
              }}
              onFocus={() =>
                setFocused(
                  true
                )
              }
              onBlur={() => {
                /*
                  Short delay lets result
                  click complete before
                  dropdown closes.
                */

                setTimeout(
                  () =>
                    setFocused(
                      false
                    ),
                  180
                );
              }}
              placeholder="Search skills or members..."
              autoComplete="off"
              className="min-h-10 w-full border border-white/10 bg-white/[0.025] pl-10 pr-10 text-sm text-white placeholder:text-white/25 transition hover:border-white/20 focus:border-[#c7ff39]/50 focus:outline-none focus:ring-1 focus:ring-[#c7ff39]/20"
            />

            {/* Clear */}

            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");

                  setFocused(
                    false
                  );
                }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center text-[#a1a1aa] transition hover:text-white"
              >
                <X
                  size={14}
                />
              </button>
            )}

            {/* =================================================
                SEARCH DROPDOWN
            ================================================= */}

            {focused &&
              cleanQuery && (
                <div className="absolute left-0 right-0 top-[calc(100%+10px)] max-h-[460px] overflow-y-auto border border-white/15 bg-[#0a0d0b] shadow-2xl">
                  {/* No results */}

                  {!hasResults ? (
                    <div className="px-5 py-8 text-center">
                      <p className="text-sm text-[#a1a1aa]">
                        No skill
                        or member
                        found.
                      </p>

                      <p className="mt-1 text-xs text-white/30">
                        Try another
                        name,
                        username
                        or skill.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* =======================================
                          SKILL RESULTS
                      ======================================= */}

                      {skillResults.length >
                        0 && (
                        <div>
                          <div className="border-b border-white/[0.07] px-4 py-2.5">
                            <p className="text-[9px] uppercase tracking-[0.17em] text-white/30">
                              Skills
                            </p>
                          </div>

                          {skillResults.map(
                            (
                              skill
                            ) => {
                              const learning =
                                learningIds.has(
                                  skill.id
                                );

                              const teaching =
                                teachingIds.has(
                                  skill.id
                                );

                              return (
                                <button
                                  key={`skill-${skill.id}`}
                                  type="button"
                                  onMouseDown={(
                                    event
                                  ) =>
                                    event.preventDefault()
                                  }
                                  onClick={() =>
                                    handleSkillClick(
                                      skill
                                    )
                                  }
                                  className="group flex w-full items-center justify-between gap-4 border-b border-white/[0.06] px-4 py-3.5 text-left transition hover:bg-[#c7ff39]/[0.05]"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium">
                                      {
                                        skill.name
                                      }
                                    </p>

                                    {skill.description && (
                                      <p className="mt-1 truncate text-xs text-[#a1a1aa]">
                                        {
                                          skill.description
                                        }
                                      </p>
                                    )}

                                    {(learning ||
                                      teaching) && (
                                      <div className="mt-2 flex gap-2">
                                        {learning && (
                                          <span className="inline-flex items-center gap-1 border border-[#c7ff39]/20 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-[#c7ff39]">
                                            <BookOpen
                                              size={
                                                10
                                              }
                                            />

                                            Learning
                                          </span>
                                        )}

                                        {teaching && (
                                          <span className="inline-flex items-center gap-1 border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-[#a1a1aa]">
                                            <GraduationCap
                                              size={
                                                10
                                              }
                                            />

                                            Teaching
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  <span className="text-[10px] uppercase tracking-[0.12em] text-white/20 transition group-hover:text-[#c7ff39]">
                                    Skill
                                  </span>
                                </button>
                              );
                            }
                          )}
                        </div>
                      )}

                      {/* =======================================
                          MEMBER RESULTS
                      ======================================= */}

                      {memberResults.length >
                        0 && (
                        <div>
                          <div className="border-b border-white/[0.07] px-4 py-2.5">
                            <p className="text-[9px] uppercase tracking-[0.17em] text-white/30">
                              Members
                            </p>
                          </div>

                          {memberResults.map(
                            (
                              member
                            ) => {
                              const memberInitials =
                                String(
                                  member.full_name ||
                                    member.username ||
                                    "M"
                                )
                                  .split(
                                    /\s+/
                                  )
                                  .filter(
                                    Boolean
                                  )
                                  .slice(
                                    0,
                                    2
                                  )
                                  .map(
                                    (
                                      part
                                    ) =>
                                      part[0]?.toUpperCase()
                                  )
                                  .join(
                                    ""
                                  );

                              return (
                                <button
                                  key={`member-${member.id}`}
                                  type="button"
                                  onMouseDown={(
                                    event
                                  ) =>
                                    event.preventDefault()
                                  }
                                  onClick={() =>
                                    handleMemberClick(
                                      member
                                    )
                                  }
                                  className="group flex w-full items-center gap-3 border-b border-white/[0.06] px-4 py-3.5 text-left transition last:border-b-0 hover:bg-[#c7ff39]/[0.05]"
                                >
                                  {/* Avatar */}

                                  {member.avatar_url ? (
                                    <img
                                      src={
                                        member.avatar_url
                                      }
                                      alt={
                                        member.full_name ||
                                        member.username ||
                                        ""
                                      }
                                      className="h-10 w-10 shrink-0 object-cover"
                                    />
                                  ) : (
                                    <div className="grid h-10 w-10 shrink-0 place-items-center border border-white/10 bg-[#060807] text-xs font-semibold text-[#c7ff39]">
                                      {memberInitials || (
                                        <UserRound
                                          size={
                                            16
                                          }
                                        />
                                      )}
                                    </div>
                                  )}

                                  {/* Member info */}

                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="truncate text-sm font-medium">
                                        {member.full_name ||
                                          member.username}
                                      </p>

                                      <span className="text-[9px] uppercase tracking-[0.12em] text-[#c7ff39]">
                                        {roleLabels[
                                          member
                                            .role
                                        ] ||
                                          "Member"}
                                      </span>
                                    </div>

                                    <p className="mt-0.5 truncate text-xs text-[#a1a1aa]">
                                      @
                                      {
                                        member.username
                                      }

                                      {member.location
                                        ? ` · ${member.location}`
                                        : ""}
                                    </p>

                                    {/* Teaching skills */}

                                    {member
                                      .teachingSkills
                                      ?.length >
                                      0 && (
                                      <p className="mt-1.5 truncate text-[10px] text-white/35">
                                        Teaches:{" "}
                                        {member.teachingSkills
                                          .map(
                                            (
                                              item
                                            ) =>
                                              item
                                                .skill
                                                ?.name
                                          )
                                          .filter(
                                            Boolean
                                          )
                                          .slice(
                                            0,
                                            4
                                          )
                                          .join(
                                            " · "
                                          )}
                                      </p>
                                    )}
                                  </div>

                                  {/* View */}

                                  <span className="shrink-0 text-[10px] uppercase tracking-[0.12em] text-white/20 transition group-hover:text-[#c7ff39]">
                                    View →
                                  </span>
                                </button>
                              );
                            }
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
          </div>
        </div>

        {/* =================================================
            RIGHT ACTIONS
        ================================================= */}

        <div className="ml-auto flex items-center gap-2">
          {/* Messages */}

          <button
            type="button"
            onClick={() =>
              navigate(
                "/messages"
              )
            }
            aria-label="Messages"
            title="Messages"
            className="grid h-10 w-10 place-items-center border border-white/10 text-[#a1a1aa] transition hover:border-[#c7ff39]/30 hover:bg-[#c7ff39]/[0.03] hover:text-[#c7ff39]"
          >
            <MessageCircle
              size={17}
              strokeWidth={1.5}
            />
          </button>

          {/* Notifications */}

          <div
            ref={
              notificationRef
            }
            className="relative"
          >
            <button
              type="button"
              onClick={
                toggleNotifications
              }
              aria-label="Notifications"
              aria-expanded={
                notificationsOpen
              }
              title="Notifications"
              className={`relative grid h-10 w-10 place-items-center border transition ${
                notificationsOpen
                  ? "border-[#c7ff39]/30 bg-[#c7ff39]/[0.04] text-[#c7ff39]"
                  : "border-white/10 text-[#a1a1aa] hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"
              }`}
            >
              <Bell
                size={17}
                strokeWidth={1.5}
              />

              {unreadNotificationCount >
                0 && (
                <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[#c7ff39] px-1 text-[9px] font-bold leading-none text-[#071008]">
                  {unreadNotificationCount >
                  9
                    ? "9+"
                    : unreadNotificationCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] z-[140] w-[min(92vw,390px)] overflow-hidden border border-white/15 bg-[#0a0d0b] shadow-2xl">
                {/* HEADER */}

                <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-[#f2f4ef]">
                      Notifications
                    </p>

                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/30">
                      {unreadNotificationCount} unread
                    </p>
                  </div>

                  {unreadNotificationCount >
                    0 && (
                    <button
                      type="button"
                      onClick={
                        markAllNotificationsRead
                      }
                      className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-[#a1a1aa] transition hover:text-[#c7ff39]"
                    >
                      <CheckCheck
                        size={13}
                      />

                      Mark all read
                    </button>
                  )}
                </div>

                {/* BODY */}

                <div className="max-h-[430px] overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="px-5 py-10 text-center">
                      <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-[#c7ff39]" />

                      <p className="mt-3 text-xs text-[#a1a1aa]">
                        Loading notifications...
                      </p>
                    </div>
                  ) : notificationError ? (
                    <div className="px-5 py-8">
                      <p className="text-sm text-[#ff8b8b]">
                        {
                          notificationError
                        }
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          loadNotifications()
                        }
                        className="mt-3 text-xs text-[#c7ff39]"
                      >
                        Try again
                      </button>
                    </div>
                  ) : notifications.length ===
                    0 ? (
                    <div className="px-5 py-10 text-center">
                      <Bell
                        size={20}
                        className="mx-auto text-white/20"
                      />

                      <p className="mt-3 text-sm text-[#a1a1aa]">
                        No notifications yet.
                      </p>

                      <p className="mt-1 text-xs text-white/30">
                        Enrollment, credit and swap updates will appear here.
                      </p>
                    </div>
                  ) : (
                    notifications.map(
                      (
                        notification
                      ) => (
                        <button
                          key={
                            notification.id
                          }
                          type="button"
                          onClick={() =>
                            markNotificationRead(
                              notification.id
                            )
                          }
                          className={`relative block w-full border-b border-white/[0.06] px-4 py-4 text-left transition last:border-b-0 hover:bg-white/[0.025] ${
                            notification.is_read
                              ? ""
                              : "bg-[#c7ff39]/[0.025]"
                          }`}
                        >
                          {!notification.is_read && (
                            <span className="absolute left-2 top-5 h-1.5 w-1.5 rounded-full bg-[#c7ff39]" />
                          )}

                          <div className="pl-2">
                            <div className="flex items-start justify-between gap-4">
                              <p className={`text-sm ${
                                notification.is_read
                                  ? "font-normal text-[#d0d0d0]"
                                  : "font-medium text-[#f2f4ef]"
                              }`}>
                                {
                                  notification.title
                                }
                              </p>

                              <span className="shrink-0 text-[9px] uppercase tracking-[0.1em] text-white/25">
                                {formatNotificationTime(
                                  notification.created_at
                                )}
                              </span>
                            </div>

                            {notification.message && (
                              <p className="mt-1.5 text-xs leading-5 text-[#a1a1aa]">
                                {
                                  notification.message
                                }
                              </p>
                            )}
                          </div>
                        </button>
                      )
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Edit profile */}

          <Link
            to="/profile/edit?tab=profile"
            className="inline-flex h-10 items-center gap-2 rounded border border-white/10 bg-[#0a0d0b] px-3 text-xs font-medium text-[#a1a1aa] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"
          >
            <Pencil
              size={14}
              strokeWidth={1.5}
            />

            Edit profile
          </Link>

          {/* =================================================
              CURRENT USER
          ================================================= */}

          <div className="hidden items-center gap-3 border-l border-white/10 pl-3 sm:flex">
            {profile?.avatar_url ? (
              <img
                src={
                  profile.avatar_url
                }
                alt={
                  profile.full_name ||
                  profile.username ||
                  ""
                }
                className="h-9 w-9 object-cover"
              />
            ) : (
              <div className="grid h-9 w-9 place-items-center bg-[#c7ff39] text-xs font-semibold text-[#071008]">
                {initials ||
                  "SS"}
              </div>
            )}

            <div className="hidden max-w-[160px] lg:block">
              <p className="truncate text-sm font-medium">
                {profile?.full_name ||
                  "SkillSwap member"}
              </p>

              <p className="truncate text-[10px] uppercase tracking-[0.13em] text-[#a1a1aa]">
                @
                {profile?.username ||
                  "member"}
              </p>
            </div>
          </div>

          {/* Logout */}

          <button
            type="button"
            onClick={onLogout}
            aria-label="Sign out"
            className="grid h-10 w-10 place-items-center text-[#a1a1aa] transition hover:text-[#ff8b8b]"
          >
            <LogOut
              size={17}
              strokeWidth={1.5}
            />
          </button>
        </div>
      </div>
    </header>
  );
}