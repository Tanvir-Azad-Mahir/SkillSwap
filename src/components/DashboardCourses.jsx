import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
} from "lucide-react";

function CourseCard({ course, type }) {
  const finished = type === "finished";

  return (
    <article className="border border-white/[0.08] bg-[#060807] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {course.title || "Course"}
          </p>

          <p className="mt-1 text-xs text-[#a1a1aa]">
            {course.mentor_name || "SkillSwap mentor"}
          </p>
        </div>

        {finished ? (
          <CheckCircle2
            size={19}
            strokeWidth={1.5}
            className="shrink-0 text-[#c7ff39]"
          />
        ) : (
          <Clock3
            size={19}
            strokeWidth={1.5}
            className="shrink-0 text-[#c7ff39]"
          />
        )}
      </div>

      {!finished && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.13em] text-white/35">
            <span>Progress</span>
            <span>{Number(course.progress || 0)}%</span>
          </div>

          <div className="h-1.5 overflow-hidden bg-white/[0.06]">
            <div
              className="h-full bg-[#c7ff39]"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, Number(course.progress || 0))
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {finished && course.completed_at && (
        <p className="mt-4 text-xs text-white/35">
          Completed {course.completed_at}
        </p>
      )}
    </article>
  );
}

export default function DashboardCourses({
  title,
  eyebrow,
  type,
  courses = [],
  emptyTitle,
  emptyText,
  actionLabel,
  onAction,
}) {
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

        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#c7ff39] hover:underline"
        >
          {actionLabel}
          <ArrowRight size={13} />
        </button>
      </div>

      <div className="p-5">
        {courses.length === 0 ? (
          <div className="grid min-h-[190px] place-items-center border border-dashed border-white/10 p-8 text-center">
            <div>
              <BookOpen
                size={23}
                strokeWidth={1.3}
                className="mx-auto text-white/20"
              />

              <p className="mt-4 text-sm font-medium">
                {emptyTitle}
              </p>

              <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-[#a1a1aa]">
                {emptyText}
              </p>

              <button
                type="button"
                onClick={onAction}
                className="mt-4 text-xs font-medium text-[#c7ff39] hover:underline"
              >
                {actionLabel} →
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                type={type}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
