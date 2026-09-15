import { ArrowRight, MapPin, UserRound } from "lucide-react";

export default function RecommendedMentors({
  mentors = [],
  onEditLearning,
  title = "Recommended mentors",
  eyebrow = "Discover people",
}) {
  const visible = mentors.slice(0, 4);

  return (
    <section className="mt-8 border border-white/10 bg-[#0a0d0b]/65">
      <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#a1a1aa]">
            {eyebrow}
          </p>

          <h2 className="mt-1 text-2xl font-medium tracking-[-0.035em]">
            {title}
          </h2>
        </div>

        {onEditLearning && (
          <button
            type="button"
            onClick={onEditLearning}
            className="inline-flex items-center gap-2 text-xs font-medium text-[#c7ff39] hover:underline"
          >
            Update learning interests
            <ArrowRight size={13} />
          </button>
        )}
      </div>

      <div className="p-5">
        {visible.length === 0 ? (
          <div className="border border-dashed border-white/10 px-5 py-10 text-center">
            <p className="text-sm text-[#a1a1aa]">
              No mentors available yet.
            </p>

            <p className="mt-1 text-xs text-white/30">
              Add skills to improve future matching.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {visible.map((mentor) => {
              const initials = String(
                mentor.full_name || mentor.username || "M"
              )
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join("");

              const teaching = (mentor.teachingSkills || [])
                .map((item) => item.skill?.name)
                .filter(Boolean)
                .slice(0, 3);

              return (
                <article
                  key={mentor.id}
                  className="border border-white/[0.08] bg-[#060807] p-5"
                >
                  <div className="flex items-start gap-3">
                    {mentor.avatar_url ? (
                      <img
                        src={mentor.avatar_url}
                        alt=""
                        className="h-11 w-11 shrink-0 object-cover"
                      />
                    ) : (
                      <div className="grid h-11 w-11 shrink-0 place-items-center border border-white/10 text-xs font-semibold text-[#c7ff39]">
                        {initials || <UserRound size={17} />}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {mentor.full_name || mentor.username}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-[#a1a1aa]">
                        @{mentor.username}
                      </p>
                    </div>
                  </div>

                  {mentor.location && (
                    <p className="mt-4 flex items-center gap-1.5 text-xs text-white/35">
                      <MapPin size={12} />
                      {mentor.location}
                    </p>
                  )}

                  <p className="mt-4 text-xs text-white/45">
                    {mentor.courseCount} created {mentor.courseCount === 1 ? "course" : "courses"}
                  </p>

                  {teaching.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {teaching.map((skill) => (
                        <span
                          key={skill}
                          className="border border-[#c7ff39]/15 bg-[#c7ff39]/[0.03] px-2 py-1 text-[9px] uppercase tracking-[0.11em] text-[#c7ff39]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
