import { CalendarClock, ExternalLink } from "lucide-react";

function formatDate(value) {
  if (!value) return "Time not set";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function UpcomingSessions({ sessions = [] }) {
  return (
    <section className="border border-white/10 bg-[#0a0d0b]/65">
      <div className="border-b border-white/10 p-5">
        <p className="text-[10px] uppercase tracking-[0.16em] text-[#a1a1aa]">
          Schedule
        </p>
        <h2 className="mt-1 text-xl font-medium tracking-[-0.03em]">
          Upcoming sessions
        </h2>
      </div>

      <div className="p-5">
        {sessions.length === 0 ? (
          <div className="grid min-h-[160px] place-items-center border border-dashed border-white/10 px-5 py-8 text-center">
            <div>
              <CalendarClock
                size={21}
                strokeWidth={1.4}
                className="mx-auto text-white/25"
              />
              <p className="mt-3 text-sm text-[#a1a1aa]">
                No upcoming sessions yet.
              </p>
              <p className="mt-1 text-xs text-white/30">
                Scheduled mentoring or swap sessions will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="border border-white/[0.07] bg-[#060807] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">
                      {session.skill?.name || "Skill session"}
                    </p>
                    <p className="mt-1 text-xs text-[#a1a1aa]">
                      {formatDate(session.scheduled_at)}
                      {session.duration_minutes
                        ? ` · ${session.duration_minutes} min`
                        : ""}
                    </p>
                  </div>

                  <span className="border border-white/10 px-2 py-1 text-[9px] uppercase tracking-[0.13em] text-[#a1a1aa]">
                    {session.viewerRole}
                  </span>
                </div>

                {session.meeting_url && (
                  <a
                    href={session.meeting_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#c7ff39] hover:underline"
                  >
                    Join meeting
                    <ExternalLink size={12} strokeWidth={1.5} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
