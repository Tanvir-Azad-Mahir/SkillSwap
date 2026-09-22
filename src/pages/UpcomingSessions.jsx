import {
  CalendarDays,
  Clock3,
  GraduationCap,
  Repeat2,
  Video,
  ArrowRight,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

/* =========================================================
   HELPERS
========================================================= */

function formatSessionDate(value) {
  if (!value) {
    return {
      date: "Date not set",
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
      date: "Date not set",
      time: "",
    };
  }

  return {
    date:
      new Intl.DateTimeFormat(
        undefined,
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        }
      ).format(date),

    time:
      new Intl.DateTimeFormat(
        undefined,
        {
          hour: "numeric",
          minute: "2-digit",
        }
      ).format(date),
  };
}

function normalizeStatus(value) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
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
        session?.meetingUrl ||
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

  return "skillmeet";
}

function getSkillMeetPath(
  session
) {
  const type =
    isSwapSession(
      session
    )
      ? "swap"
      : "mentor";

  const storedPath =
    String(
      session?.meeting_url ||
        session?.meetingUrl ||
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

function isSwapSession(
  session
) {
  return (
    session?.session_type ===
      "swap" ||
    session?.type ===
      "swap" ||
    Boolean(
      session?.swap_id
    )
  );
}

function getSessionTitle(
  session
) {
  if (
    session?.title
  ) {
    return session.title;
  }

  if (
    isSwapSession(
      session
    )
  ) {
    const firstSkill =
      session?.my_skill?.name ||
      session?.my_skill_name ||
      session?.skill?.name;

    const secondSkill =
      session?.partner_skill?.name ||
      session?.partner_skill_name;

    if (
      firstSkill &&
      secondSkill
    ) {
      return `${firstSkill} ↔ ${secondSkill}`;
    }

    return "Skill swap session";
  }

  if (
    session?.skill?.name
  ) {
    return session.skill.name;
  }

  return "Learning session";
}

function getSessionSubtitle(
  session
) {
  if (
    isSwapSession(
      session
    )
  ) {
    const partnerName =
      session?.partner?.full_name ||
      session?.partner?.username ||
      session?.partner_name;

    return partnerName
      ? `With ${partnerName}`
      : "Shared Swap Master meeting";
  }

  if (
    session?.viewerRole
  ) {
    return session.viewerRole ===
      "Mentor"
      ? "You are mentoring"
      : "You are learning";
  }

  return "Mentor session";
}

function getStatusClasses(
  status
) {
  const clean =
    normalizeStatus(
      status
    );

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

  return "border-white/10 bg-white/[0.025] text-[#a1a1aa]";
}

/* =========================================================
   UPCOMING SESSIONS
========================================================= */

export default function UpcomingSessions({
  sessions = [],
  onViewAll,
  onOpenMeeting,
  onOpenSwap,
}) {
  const navigate =
    useNavigate();

  const visibleSessions =
    [...sessions]
      .filter(
        (session) => {
          const status =
            normalizeStatus(
              session?.status
            );

          return ![
            "completed",
            "cancelled",
            "canceled",
          ].includes(
            status
          );
        }
      )
      .sort(
        (a, b) =>
          new Date(
            a?.scheduled_at ||
              0
          ).getTime() -
          new Date(
            b?.scheduled_at ||
              0
          ).getTime()
      )
      .slice(
        0,
        5
      );

  return (
    <section className="overflow-hidden border border-white/10 bg-[#0a0d0b]/75">
      {/* HEADER */}

      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-[9px] uppercase tracking-[0.16em] text-[#c7ff39]">
            Schedule
          </p>

          <h2 className="mt-1 text-lg font-medium tracking-[-0.03em] text-[#f2f4ef]">
            Upcoming sessions
          </h2>
        </div>

        <div className="grid h-9 w-9 place-items-center border border-[#c7ff39]/15 bg-[#c7ff39]/[0.035] text-[#c7ff39]">
          <CalendarDays
            size={16}
          />
        </div>
      </div>

      {/* SESSIONS */}

      {visibleSessions.length >
      0 ? (
        <div>
          {visibleSessions.map(
            (
              session,
              index
            ) => {
              const swap =
                isSwapSession(
                  session
                );

              const {
                date,
                time,
              } =
                formatSessionDate(
                  session.scheduled_at
                );

              const duration =
                Number(
                  session.duration_minutes
                ) || 0;

              const meetingUrl =
                session.meeting_url ||
                session.meetingUrl ||
                "";

              const meetingProvider =
                getMeetingProvider(
                  session
                );

              const canOpenMeeting =
                meetingProvider ===
                  "skillmeet" ||
                Boolean(
                  meetingUrl
                );

              const meetingLabel =
                getMeetingButtonLabel(
                  session
                );

              return (
                <article
                  key={
                    session.id ||
                    `${session.scheduled_at}-${index}`
                  }
                  className={`p-5 transition hover:bg-white/[0.02] ${
                    index <
                    visibleSessions.length -
                      1
                      ? "border-b border-white/10"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center border ${
                        swap
                          ? "border-[#c7ff39]/20 bg-[#c7ff39]/[0.04] text-[#c7ff39]"
                          : "border-white/10 bg-white/[0.025] text-[#a1a1aa]"
                      }`}
                    >
                      {swap ? (
                        <Repeat2
                          size={16}
                        />
                      ) : (
                        <GraduationCap
                          size={16}
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`border px-2 py-1 text-[8px] uppercase tracking-[0.13em] ${
                                swap
                                  ? "border-[#c7ff39]/20 bg-[#c7ff39]/[0.035] text-[#c7ff39]"
                                  : "border-white/10 bg-white/[0.02] text-[#a1a1aa]"
                              }`}
                            >
                              {swap
                                ? "Skill swap"
                                : "Session"}
                            </span>

                            {session.status && (
                              <span
                                className={`border px-2 py-1 text-[8px] uppercase tracking-[0.13em] ${getStatusClasses(
                                  session.status
                                )}`}
                              >
                                {
                                  session.status
                                }
                              </span>
                            )}
                          </div>

                          <h3 className="mt-3 truncate text-sm font-medium text-[#f2f4ef]">
                            {getSessionTitle(
                              session
                            )}
                          </h3>

                          <p className="mt-1 text-xs text-[#a1a1aa]">
                            {getSessionSubtitle(
                              session
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-white/35">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays
                            size={11}
                          />

                          {
                            date
                          }
                        </span>

                        {time && (
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3
                              size={11}
                            />

                            {
                              time
                            }
                          </span>
                        )}

                        {duration >
                          0 && (
                          <span>
                            {
                              duration
                            }{" "}
                            min
                          </span>
                        )}
                      </div>

                      {(canOpenMeeting ||
                        (swap &&
                          onOpenSwap)) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {canOpenMeeting && (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  meetingProvider ===
                                  "skillmeet"
                                ) {
                                  navigate(
                                    getSkillMeetPath(
                                      session
                                    )
                                  );
                                  return;
                                }

                                if (
                                  onOpenMeeting
                                ) {
                                  onOpenMeeting(
                                    meetingUrl,
                                    session
                                  );
                                } else if (
                                  meetingUrl
                                ) {
                                  window.open(
                                    meetingUrl,
                                    "_blank",
                                    "noopener,noreferrer"
                                  );
                                }
                              }}
                              className="inline-flex min-h-9 items-center gap-2 bg-[#c7ff39] px-3 text-[10px] font-semibold text-[#071008] transition hover:bg-[#d4ff66]"
                            >
                              <Video
                                size={12}
                              />

                              {meetingLabel}
                            </button>
                          )}

                          {swap &&
                            onOpenSwap && (
                              <button
                                type="button"
                                onClick={() =>
                                  onOpenSwap(
                                    session
                                  )
                                }
                                className="inline-flex min-h-9 items-center gap-2 border border-white/10 px-3 text-[10px] text-[#a1a1aa] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"
                              >
                                View swap

                                <ArrowRight
                                  size={11}
                                />
                              </button>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </div>
      ) : (
        <div className="p-6">
          <div className="grid h-10 w-10 place-items-center border border-white/10 text-white/25">
            <CalendarDays
              size={17}
            />
          </div>

          <h3 className="mt-4 text-base font-medium text-[#f2f4ef]">
            No upcoming sessions.
          </h3>

          <p className="mt-2 text-xs leading-6 text-[#a1a1aa]">
            Scheduled mentor sessions and Skill Swap meetings will appear here.
          </p>
        </div>
      )}

      {/* FOOTER */}

      {onViewAll && (
        <button
          type="button"
          onClick={
            onViewAll
          }
          className="flex min-h-11 w-full items-center justify-between border-t border-white/10 px-5 text-xs text-[#a1a1aa] transition hover:bg-white/[0.02] hover:text-[#c7ff39]"
        >
          View all sessions

          <ArrowRight
            size={13}
          />
        </button>
      )}
    </section>
  );
}
