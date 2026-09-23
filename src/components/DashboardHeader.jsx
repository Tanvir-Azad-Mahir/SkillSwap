import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CheckCheck,
  LogOut,
  MessageCircle,
  Pencil,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabase";

import SearchSkillsProfiles from "./SearchSkillsProfiles";

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
  onLogout,
  onOpenMessages,
}) {
  const navigate = useNavigate();

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

  const [
    unreadMessageCount,
    setUnreadMessageCount,
  ] = useState(0);

  const notificationRef =
    useRef(null);

  useEffect(() => {
    if (!profile?.id) {
      setUnreadMessageCount(0);
      return undefined;
    }

    let active = true;

    const loadUnreadMessages = async () => {
      const {
        data,
        error,
      } = await supabase.rpc(
        "get_my_conversations"
      );

      if (error) {
        console.error(
          "UNREAD MESSAGE COUNT ERROR:",
          error
        );
        return;
      }

      if (active) {
        setUnreadMessageCount(
          (data || []).reduce(
            (total, conversation) =>
              total + Number(
                conversation.unread_count || 0
              ),
            0
          )
        );
      }
    };

    loadUnreadMessages();

    const interval = window.setInterval(
      loadUnreadMessages,
      5000
    );

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [profile?.id]);

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
            <SearchSkillsProfiles
              placeholder="Search skills or profiles..."
            />
          </div>
        </div>

        {/* =================================================
            RIGHT ACTIONS
        ================================================= */}

        <div className="ml-auto flex items-center gap-2">
          {/* Messages */}

          <button
            type="button"
            onClick={onOpenMessages || (() => navigate("/messages"))}
            aria-label="Messages"
            title="Messages"
            className="relative grid h-10 w-10 place-items-center border border-white/10 text-[#a1a1aa] transition hover:border-[#c7ff39]/30 hover:bg-[#c7ff39]/[0.03] hover:text-[#c7ff39]"
          >
            <MessageCircle
              size={17}
              strokeWidth={1.5}
            />

            {unreadMessageCount > 0 && (
              <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-[#060807] bg-[#c7ff39] px-1 text-[9px] font-bold text-[#071008] shadow-[0_0_12px_rgba(199,255,57,0.85)]">
                {unreadMessageCount > 99
                  ? "99+"
                  : unreadMessageCount}
              </span>
            )}
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