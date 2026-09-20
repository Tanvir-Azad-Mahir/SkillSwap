import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  BookOpen,
  Check,
  Loader2,
  PauseCircle,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

export default function AdminCourses() {
  const [courses, setCourses] =
    useState([]);

  const [status, setStatus] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [actionId, setActionId] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const loadCourses =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const {
            data,
            error: rpcError,
          } =
            await supabase.rpc(
              "admin_list_courses",
              {
                p_status:
                  status || null,
              }
            );

          if (rpcError) {
            throw rpcError;
          }

          setCourses(
            data || []
          );
        } catch (err) {
          setError(
            err?.message ||
              "Could not load courses."
          );
        } finally {
          setLoading(false);
        }
      },
      [status]
    );

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const updateStatus =
    async (
      course,
      nextStatus
    ) => {
      const key =
        `course-${course.course_id}`;

      try {
        setActionId(key);
        setError("");
        setSuccess("");

        const {
          error: rpcError,
        } =
          await supabase.rpc(
            "admin_set_course_status",
            {
              p_course_id:
                course.course_id,
              p_status:
                nextStatus,
            }
          );

        if (rpcError) {
          throw rpcError;
        }

        setSuccess(
          `Course changed to ${nextStatus}.`
        );

        await loadCourses();
      } catch (err) {
        setError(
          err?.message ||
            "Course status could not be updated."
        );
      } finally {
        setActionId("");
      }
    };

  return (
    <div className="admin-page mx-auto max-w-[1350px] px-5 py-8 md:px-8 lg:px-10 lg:py-10">
      <div className="admin-page-header flex flex-col justify-between gap-5 border-b border-white/10 pb-7 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 text-[#c7ff39]">
            <BookOpen size={16} />

            <p className="text-[10px] uppercase tracking-[0.18em]">
              Course moderation
            </p>
          </div>

          <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em]">
            Courses.
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#a1a1aa]">
            Review pending courses, activate approved courses, and suspend courses when needed.
          </p>
        </div>

        <select
          value={status}
          onChange={(event) =>
            setStatus(
              event.target.value
            )
          }
          className="min-h-10 border border-white/10 bg-[#060807] px-3 text-xs outline-none"
        >
          <option value="">
            All statuses
          </option>

          <option value="Pending">
            Pending
          </option>

          <option value="Active">
            Active
          </option>

          <option value="Suspended">
            Suspended
          </option>
        </select>
      </div>

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

      <div className="mt-6 grid gap-4">
        {loading ? (
          <div className="grid min-h-[280px] place-items-center">
            <Loader2
              size={22}
              className="animate-spin text-[#c7ff39]"
            />
          </div>
        ) : courses.length ===
          0 ? (
          <div className="border border-white/10 bg-[#0a0d0b]/80 p-10 text-center text-sm text-[#a1a1aa]">
            No courses found.
          </div>
        ) : (
          courses.map(
            (course) => {
              const busy =
                actionId ===
                `course-${course.course_id}`;

              return (
                <article
                  key={
                    course.course_id
                  }
                  className="admin-panel p-5 transition hover:border-white/20"
                >
                  <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-medium">
                          {course.title}
                        </h2>

                        <span
                          className={`border px-2 py-1 text-[9px] uppercase tracking-[0.12em] ${
                            course.status ===
                            "Active"
                              ? "border-[#c7ff39]/25 text-[#c7ff39]"
                              : course.status ===
                                  "Suspended"
                                ? "border-[#ff6b6b]/25 text-[#ff8b8b]"
                                : "border-[#ffbf69]/25 text-[#ffca80]"
                          }`}
                        >
                          {course.status}
                        </span>
                      </div>

                      <p className="mt-3 text-xs leading-6 text-[#a1a1aa]">
                        Skill:{" "}
                        <span className="text-[#f2f4ef]">
                          {course.skill_name}
                        </span>
                        {" · "}
                        Level:{" "}
                        <span className="text-[#f2f4ef]">
                          {course.course_level}
                        </span>
                        {" · "}
                        Price:{" "}
                        <span className="text-[#c7ff39]">
                          {course.price_credits} SS
                        </span>
                      </p>

                      <p className="mt-2 text-xs text-white/35">
                        Instructor:{" "}
                        {course.instructor_full_name ||
                          course.instructor_username}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {course.status !==
                        "Active" && (
                        <button
                          type="button"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            updateStatus(
                              course,
                              "Active"
                            )
                          }
                          className="inline-flex min-h-10 items-center gap-2 bg-[#c7ff39] px-4 text-xs font-semibold text-[#071008] disabled:opacity-50"
                        >
                          {busy ? (
                            <Loader2
                              size={13}
                              className="animate-spin"
                            />
                          ) : (
                            <Check
                              size={13}
                            />
                          )}

                          Activate
                        </button>
                      )}

                      {course.status !==
                        "Suspended" && (
                        <button
                          type="button"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            updateStatus(
                              course,
                              "Suspended"
                            )
                          }
                          className="inline-flex min-h-10 items-center gap-2 border border-[#ff6b6b]/30 px-4 text-xs text-[#ff8b8b] disabled:opacity-50"
                        >
                          <PauseCircle
                            size={13}
                          />

                          Suspend
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            }
          )
        )}
      </div>
    </div>
  );
}
