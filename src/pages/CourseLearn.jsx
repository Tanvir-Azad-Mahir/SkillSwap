import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  GraduationCap,
  Layers3,
  Loader2,
  LockKeyhole,
  Send,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

const tabs = [
  ["lectures", "Lectures", Layers3],
  ["assignments", "Assignments", ClipboardCheck],
  ["notes", "Notes", FileText],
  ["quiz", "Quiz", GraduationCap],
  ["completion", "Completion", CheckCircle2],
];

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function isPast(value) {
  if (!value) return false;

  return new Date(value).getTime() < Date.now();
}

export default function CourseLearn() {
  const navigate = useNavigate();
  const { courseId } = useParams();

  const [activeTab, setActiveTab] = useState("lectures");

  const [profile, setProfile] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [course, setCourse] = useState(null);
  const [skill, setSkill] = useState(null);
  const [instructor, setInstructor] = useState(null);

  const [modules, setModules] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [progress, setProgress] = useState([]);
  const [notes, setNotes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [completionRequests, setCompletionRequests] = useState([]);

  const [assignmentDrafts, setAssignmentDrafts] = useState({});
  const [quizAnswers, setQuizAnswers] = useState({});
  const [completionNote, setCompletionNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);

      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          "id,username,full_name,avatar_url,role,is_active,profile_completed"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        throw new Error("PROFILE_NOT_FOUND");
      }

      if (profileData.is_active === false) {
        navigate("/dashboard", { replace: true });
        return;
      }

      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from("course_enrollments")
        .select(
          "id,course_id,learner_id,instructor_id,status,created_at,approved_at,completed_at"
        )
        .eq("course_id", courseId)
        .eq("learner_id", user.id)
        .in("status", ["Approved", "Completed"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (enrollmentError) throw enrollmentError;

      if (!enrollmentData) {
        navigate("/my-courses", { replace: true });
        return;
      }

      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select(
          "id,title,instructor_id,skill_id,price_credits,course_level,status,created_at"
        )
        .eq("id", courseId)
        .maybeSingle();

      if (courseError) throw courseError;

      if (!courseData) {
        throw new Error("COURSE_NOT_FOUND");
      }

      const [
        skillResult,
        instructorResult,
        modulesResult,
        notesResult,
        assignmentsResult,
        quizzesResult,
        submissionsResult,
        attemptsResult,
        completionRequestsResult,
      ] = await Promise.all([
        courseData.skill_id
          ? supabase
              .from("skills")
              .select("id,name")
              .eq("id", courseData.skill_id)
              .maybeSingle()
          : Promise.resolve({
              data: null,
              error: null,
            }),

        supabase
          .from("profiles")
          .select("id,username,full_name,avatar_url,role")
          .eq("id", courseData.instructor_id)
          .maybeSingle(),

        supabase
          .from("course_modules")
          .select(
            "id,course_id,title,description,position,is_published"
          )
          .eq("course_id", courseId)
          .eq("is_published", true)
          .order("position"),

        supabase
          .from("course_notes")
          .select(
            "id,course_id,lecture_id,title,content,resource_url,position,is_published"
          )
          .eq("course_id", courseId)
          .eq("is_published", true)
          .order("position"),

        supabase
          .from("course_assignments")
          .select(
            "id,course_id,title,instructions,max_marks,published_at,due_at,is_published,created_at"
          )
          .eq("course_id", courseId)
          .eq("is_published", true)
          .order("created_at"),

        supabase
          .from("course_quizzes")
          .select(
            "id,course_id,title,description,total_marks,passing_marks,max_attempts,is_published,created_at"
          )
          .eq("course_id", courseId)
          .eq("is_published", true)
          .order("created_at"),

        supabase
          .from("assignment_submissions")
          .select(
            "id,assignment_id,learner_id,submission_text,attachment_url,status,grade,feedback,submitted_at,graded_at"
          )
          .eq("learner_id", user.id),

        supabase
          .from("quiz_attempts")
          .select(
            "id,quiz_id,enrollment_id,learner_id,attempt_number,score,passed,submitted_at"
          )
          .eq("learner_id", user.id)
          .eq("enrollment_id", enrollmentData.id)
          .order("submitted_at", { ascending: false }),

        supabase
          .from("course_completion_requests")
          .select(
            "id,enrollment_id,status,learner_note,instructor_note,requested_at,reviewed_at,reviewed_by"
          )
          .eq("enrollment_id", enrollmentData.id)
          .order("requested_at", { ascending: false }),
      ]);

      for (const result of [
        modulesResult,
        notesResult,
        assignmentsResult,
        quizzesResult,
        submissionsResult,
        attemptsResult,
        completionRequestsResult,
      ]) {
        if (result.error) throw result.error;
      }

      const moduleRows = modulesResult.data || [];
      const moduleIds = moduleRows.map((module) => module.id);

      let lectureRows = [];
      let progressRows = [];

      if (moduleIds.length) {
        const { data: lectureData, error: lectureError } = await supabase
          .from("course_lectures")
          .select(
            "id,module_id,title,content,video_url,position,estimated_minutes,is_published"
          )
          .in("module_id", moduleIds)
          .eq("is_published", true)
          .order("position");

        if (lectureError) throw lectureError;

        lectureRows = lectureData || [];

        const lectureIds = lectureRows.map((lecture) => lecture.id);

        if (lectureIds.length) {
          const { data: progressData, error: progressError } = await supabase
            .from("lecture_progress")
            .select(
              "id,lecture_id,learner_id,completed,completed_at"
            )
            .eq("learner_id", user.id)
            .in("lecture_id", lectureIds);

          if (progressError) throw progressError;

          progressRows = progressData || [];
        }
      }

      const quizRows = quizzesResult.data || [];
      const quizIds = quizRows.map((quiz) => quiz.id);

      let questionRows = [];

      if (quizIds.length) {
        const { data: questionData, error: questionError } = await supabase
          .from("quiz_questions")
          .select(
            "id,quiz_id,question_text,option_a,option_b,option_c,option_d,marks,position"
          )
          .in("quiz_id", quizIds)
          .order("position");

        if (questionError) throw questionError;

        questionRows = questionData || [];
      }

      setProfile(profileData);
      setEnrollment(enrollmentData);
      setCourse(courseData);
      setSkill(skillResult.data || null);
      setInstructor(instructorResult.data || null);

      setModules(moduleRows);
      setLectures(lectureRows);
      setProgress(progressRows);
      setNotes(notesResult.data || []);
      setAssignments(assignmentsResult.data || []);
      setSubmissions(submissionsResult.data || []);
      setQuizzes(quizRows);
      setQuestions(questionRows);
      setAttempts(attemptsResult.data || []);
      setCompletionRequests(completionRequestsResult.data || []);

      const drafts = {};

      (submissionsResult.data || []).forEach((submission) => {
        drafts[submission.assignment_id] = {
          text: submission.submission_text || "",
          attachment: submission.attachment_url || "",
        };
      });

      setAssignmentDrafts(drafts);
    } catch (err) {
      console.error("COURSE LEARN LOAD ERROR:", err);

      setError(
        err?.message === "COURSE_NOT_FOUND"
          ? "Course not found."
          : err?.message || "We couldn't load this course."
      );
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const progressMap = useMemo(
    () => new Map(progress.map((item) => [item.lecture_id, item])),
    [progress]
  );

  const submissionMap = useMemo(
    () => new Map(submissions.map((item) => [item.assignment_id, item])),
    [submissions]
  );

  const lecturesByModule = useMemo(() => {
    const map = new Map(modules.map((module) => [module.id, []]));

    lectures.forEach((lecture) => {
      const list = map.get(lecture.module_id) || [];
      list.push(lecture);
      map.set(lecture.module_id, list);
    });

    return map;
  }, [modules, lectures]);

  const questionsByQuiz = useMemo(() => {
    const map = new Map(quizzes.map((quiz) => [quiz.id, []]));

    questions.forEach((question) => {
      const list = map.get(question.quiz_id) || [];
      list.push(question);
      map.set(question.quiz_id, list);
    });

    return map;
  }, [quizzes, questions]);

  const attemptsByQuiz = useMemo(() => {
    const map = new Map(quizzes.map((quiz) => [quiz.id, []]));

    attempts.forEach((attempt) => {
      const list = map.get(attempt.quiz_id) || [];
      list.push(attempt);
      map.set(attempt.quiz_id, list);
    });

    return map;
  }, [quizzes, attempts]);

  const latestCompletionRequest =
    completionRequests.length > 0 ? completionRequests[0] : null;

  const pendingCompletionRequest =
    latestCompletionRequest?.status === "Pending";

  const completedLectureCount = lectures.filter(
    (lecture) => progressMap.get(lecture.id)?.completed === true
  ).length;

  const lecturePercent = lectures.length
    ? Math.round((completedLectureCount / lectures.length) * 100)
    : 0;

  /*
    Backend request_course_completion requires at least
    one published lecture.
  */
  const allLecturesComplete =
    lectures.length > 0 &&
    completedLectureCount === lectures.length;

  const submittedAssignmentCount = assignments.filter((assignment) =>
    submissionMap.has(assignment.id)
  ).length;

  const allAssignmentsSubmitted =
    assignments.length === 0 ||
    submittedAssignmentCount === assignments.length;

  const allAssignmentsGraded =
    assignments.length === 0 ||
    assignments.every(
      (assignment) =>
        submissionMap.get(assignment.id)?.status === "Graded"
    );

  /*
    Match the backend rule:
    every published quiz must have a score >= max(passing_marks, 80).
  */
  const allQuizzesPassed =
    quizzes.length > 0 &&
    quizzes.every((quiz) => {
      const quizAttempts = attemptsByQuiz.get(quiz.id) || [];
      const requiredScore = Math.max(Number(quiz.passing_marks || 0), 80);

      return quizAttempts.some(
        (attempt) => Number(attempt.score) >= requiredScore
      );
    });

  const completionEligible =
    enrollment?.status === "Approved" &&
    allLecturesComplete &&
    allAssignmentsSubmitted &&
    allAssignmentsGraded &&
    allQuizzesPassed;

  const markLectureComplete = async (lecture) => {
    const existing = progressMap.get(lecture.id);

    if (existing?.completed) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (existing) {
        const { error: updateError } = await supabase
          .from("lecture_progress")
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("lecture_progress")
          .insert({
            lecture_id: lecture.id,
            learner_id: profile.id,
            completed: true,
            completed_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }

      setSuccess("Lecture marked complete.");

      await load({ silent: true });
    } catch (err) {
      setError(
        err?.message || "Lecture progress could not be saved."
      );
    } finally {
      setSaving(false);
    }
  };

  const submitAssignment = async (assignment) => {
    const draft = assignmentDrafts[assignment.id] || {
      text: "",
      attachment: "",
    };

    if (!draft.text.trim() && !draft.attachment.trim()) {
      setError("Add submission text or an attachment URL.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const { error: rpcError } = await supabase.rpc(
        "submit_course_assignment",
        {
          p_assignment_id: assignment.id,
          p_submission_text: draft.text.trim() || null,
          p_attachment_url: draft.attachment.trim() || null,
        }
      );

      if (rpcError) throw rpcError;

      setSuccess("Assignment submitted.");

      await load({ silent: true });
    } catch (err) {
      const message = err?.message || "";

      if (message.includes("ASSIGNMENT_DEADLINE_PASSED")) {
        setError("The assignment deadline has passed.");
      } else if (message.includes("ASSIGNMENT_ALREADY_GRADED")) {
        setError("This assignment is already graded and locked.");
      } else {
        setError(message || "Assignment could not be submitted.");
      }
    } finally {
      setSaving(false);
    }
  };

  const submitQuiz = async (quiz) => {
    const quizQuestions = questionsByQuiz.get(quiz.id) || [];
    const answers = quizAnswers[quiz.id] || {};

    if (!quizQuestions.every((question) => answers[question.id])) {
      setError("Answer every quiz question before submitting.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const { data, error: rpcError } = await supabase.rpc(
        "submit_course_quiz",
        {
          p_quiz_id: quiz.id,
          p_answers: answers,
        }
      );

      if (rpcError) throw rpcError;

      setSuccess(
        data?.passed
          ? `Quiz passed: ${data.score}/100.`
          : `Quiz submitted: ${data?.score ?? 0}/100. Passing mark is ${
              data?.passing_marks ?? quiz.passing_marks
            }/100.`
      );

      setQuizAnswers((current) => ({
        ...current,
        [quiz.id]: {},
      }));

      await load({ silent: true });
    } catch (err) {
      const message = err?.message || "";

      if (message.includes("MAX_ATTEMPTS_REACHED")) {
        setError("Maximum quiz attempts reached.");
      } else {
        setError(message || "Quiz could not be submitted.");
      }
    } finally {
      setSaving(false);
    }
  };

  const requestCourseCompletion = async () => {
    if (!enrollment?.id) {
      setError("Enrollment information is missing.");
      return;
    }

    if (!completionEligible) {
      setError(
        "Complete all course requirements before requesting completion."
      );
      return;
    }

    if (pendingCompletionRequest) {
      setError("Your completion request is already pending.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const { error: rpcError } = await supabase.rpc(
        "request_course_completion",
        {
          p_enrollment_id: enrollment.id,
          p_learner_note: completionNote.trim() || null,
        }
      );

      if (rpcError) throw rpcError;

      setCompletionNote("");

      setSuccess(
        "Completion request sent to your instructor."
      );

      await load({ silent: true });
    } catch (err) {
      const message = err?.message || "";

      if (message.includes("COMPLETION_REQUEST_ALREADY_PENDING")) {
        setError("Your completion request is already pending.");
      } else if (message.includes("LECTURES_NOT_COMPLETED")) {
        setError("Complete all published lectures first.");
      } else if (
        message.includes("COURSE_HAS_NO_PUBLISHED_LECTURES")
      ) {
        setError(
          "This course does not have published lectures yet."
        );
      } else if (message.includes("ASSIGNMENTS_NOT_SUBMITTED")) {
        setError("Submit all published assignments first.");
      } else if (message.includes("ASSIGNMENTS_NOT_GRADED")) {
        setError(
          "Your instructor must grade all published assignments first."
        );
      } else if (
        message.includes("FINAL_QUIZ_REQUIRED")
      ) {
        setError("The final quiz has not been published yet.");
      } else if (
        message.includes("FINAL_QUIZ_NOT_PASSED")
      ) {
        setError(
          "Pass the final quiz with at least 80/100 before requesting completion."
        );
      } else {
        setError(
          message || "Completion request could not be sent."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#060807] text-[#f2f4ef]">
        <div className="text-center">
          <div className="mx-auto mb-5 h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-[#c7ff39]" />

          <p className="text-xs uppercase tracking-[0.18em] text-[#a1a1aa]">
            Loading course
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#060807] text-[#f2f4ef]">
      <div className="noise pointer-events-none fixed inset-0" />

      <div className="relative z-10">
        <header className="border-b border-white/10 bg-[#060807]/90 backdrop-blur-xl">
          <div className="mx-auto flex min-h-[72px] max-w-[1500px] items-center justify-between px-5 md:px-8 lg:px-10">
            <button
              type="button"
              onClick={() => navigate("/my-courses")}
              className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] hover:text-[#c7ff39]"
            >
              <ArrowLeft size={16} />
              My Courses
            </button>

            <span className="border border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] px-3 py-1.5 text-[9px] uppercase tracking-[0.14em] text-[#c7ff39]">
              {enrollment?.status === "Completed"
                ? "Completed"
                : "In progress"}
            </span>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-5 pb-20 pt-10 md:px-8 lg:px-10">
          <section className="border-b border-white/10 pb-8">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#c7ff39]">
              Learning workspace
            </p>

            <h1 className="mt-3 max-w-4xl text-3xl font-medium tracking-[-0.05em] md:text-4xl">
              {course?.title || "Course"}
            </h1>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#a1a1aa]">
              <span>{skill?.name || "Course"}</span>

              <span>{course?.course_level || "—"}</span>

              <span>
                Instructor:{" "}
                {instructor?.full_name ||
                  instructor?.username ||
                  "Instructor"}
              </span>
            </div>

            <div className="mt-6 max-w-2xl">
              <div className="flex justify-between text-xs">
                <span className="text-[#a1a1aa]">
                  Lecture progress
                </span>

                <span className="text-[#c7ff39]">
                  {lecturePercent}%
                </span>
              </div>

              <div className="mt-2 h-1.5 bg-white/10">
                <div
                  className="h-full bg-[#c7ff39]"
                  style={{
                    width: `${lecturePercent}%`,
                  }}
                />
              </div>
            </div>
          </section>

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

          <div className="mt-6 overflow-x-auto border-b border-white/10">
            <div className="flex min-w-max">
              {tabs.map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setActiveTab(id);
                    setError("");
                    setSuccess("");
                  }}
                  className={`inline-flex min-h-12 items-center gap-2 border-b-2 px-4 text-xs font-medium ${
                    activeTab === id
                      ? "border-[#c7ff39] text-[#c7ff39]"
                      : "border-transparent text-[#a1a1aa] hover:text-white"
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "lectures" && (
            <section className="mt-8 space-y-5">
              {modules.length ? (
                modules.map((module) => (
                  <article
                    key={module.id}
                    className="border border-white/10 bg-[#0a0d0b]/70"
                  >
                    <div className="border-b border-white/10 p-6">
                      <p className="text-[9px] uppercase tracking-[0.14em] text-[#c7ff39]">
                        Module {module.position}
                      </p>

                      <h2 className="mt-2 text-xl font-medium">
                        {module.title}
                      </h2>

                      {module.description && (
                        <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
                          {module.description}
                        </p>
                      )}
                    </div>

                    {(lecturesByModule.get(module.id) || []).length ? (
                      (lecturesByModule.get(module.id) || []).map(
                        (lecture) => {
                          const completed =
                            progressMap.get(lecture.id)?.completed === true;

                          return (
                            <div
                              key={lecture.id}
                              className="border-b border-white/[0.07] p-6 last:border-b-0"
                            >
                              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                                <div className="max-w-4xl">
                                  <div className="flex flex-wrap gap-2 text-[9px] uppercase tracking-[0.12em] text-white/30">
                                    <span>
                                      Lecture {lecture.position}
                                    </span>

                                    {lecture.estimated_minutes && (
                                      <span>
                                        {lecture.estimated_minutes} min
                                      </span>
                                    )}

                                    {completed && (
                                      <span className="inline-flex items-center gap-1 text-[#c7ff39]">
                                        <Check size={11} />
                                        Complete
                                      </span>
                                    )}
                                  </div>

                                  <h3 className="mt-2 text-lg font-medium">
                                    {lecture.title}
                                  </h3>

                                  {lecture.content && (
                                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#a1a1aa]">
                                      {lecture.content}
                                    </p>
                                  )}

                                  {lecture.video_url && (
                                    <a
                                      href={lecture.video_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-4 inline-flex items-center gap-2 text-xs text-[#c7ff39]"
                                    >
                                      Open lecture video
                                      <ExternalLink size={12} />
                                    </a>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  disabled={
                                    saving ||
                                    completed ||
                                    enrollment?.status === "Completed"
                                  }
                                  onClick={() =>
                                    markLectureComplete(lecture)
                                  }
                                  className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 px-4 text-xs font-semibold ${
                                    completed
                                      ? "border border-[#c7ff39]/25 text-[#c7ff39]"
                                      : "bg-[#c7ff39] text-[#071008]"
                                  } disabled:opacity-60`}
                                >
                                  <CheckCircle2 size={14} />
                                  {completed
                                    ? "Completed"
                                    : "Mark complete"}
                                </button>
                              </div>
                            </div>
                          );
                        }
                      )
                    ) : (
                      <div className="p-6 text-sm text-[#a1a1aa]">
                        No published lectures in this module yet.
                      </div>
                    )}
                  </article>
                ))
              ) : (
                <div className="border border-white/10 bg-[#0a0d0b]/70 p-7 text-sm text-[#a1a1aa]">
                  Your instructor has not published lectures yet.
                </div>
              )}
            </section>
          )}

          {activeTab === "assignments" && (
            <section className="mt-8 space-y-5">
              {assignments.length ? (
                assignments.map((assignment) => {
                  const submission = submissionMap.get(assignment.id);
                  const expired = isPast(assignment.due_at);

                  const locked =
                    submission?.status === "Graded" ||
                    expired ||
                    enrollment?.status === "Completed";

                  const draft = assignmentDrafts[assignment.id] || {
                    text: submission?.submission_text || "",
                    attachment: submission?.attachment_url || "",
                  };

                  return (
                    <article
                      key={assignment.id}
                      className="border border-white/10 bg-[#0a0d0b]/70 p-6"
                    >
                      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                        <div>
                          <div className="flex flex-wrap gap-2 text-[9px] uppercase tracking-[0.12em]">
                            <span className="border border-white/10 px-2 py-1 text-white/35">
                              {assignment.max_marks} marks
                            </span>

                            {assignment.due_at && (
                              <span
                                className={`border px-2 py-1 ${
                                  expired
                                    ? "border-[#ff6b6b]/30 text-[#ff8b8b]"
                                    : "border-[#ffbf69]/30 text-[#ffca80]"
                                }`}
                              >
                                {expired
                                  ? "Closed"
                                  : `Due ${formatDateTime(
                                      assignment.due_at
                                    )}`}
                              </span>
                            )}

                            {submission && (
                              <span className="border border-[#c7ff39]/25 px-2 py-1 text-[#c7ff39]">
                                {submission.status}
                              </span>
                            )}
                          </div>

                          <h2 className="mt-3 text-xl font-medium">
                            {assignment.title}
                          </h2>

                          <p className="mt-3 max-w-4xl whitespace-pre-wrap text-sm leading-7 text-[#a1a1aa]">
                            {assignment.instructions}
                          </p>
                        </div>

                        {submission?.status === "Graded" && (
                          <div className="border border-[#c7ff39]/20 bg-[#c7ff39]/[0.04] px-5 py-4 text-center">
                            <p className="text-[9px] uppercase tracking-[0.14em] text-[#a1a1aa]">
                              Grade
                            </p>

                            <p className="mt-1 text-2xl font-medium text-[#c7ff39]">
                              {submission.grade}/{assignment.max_marks}
                            </p>
                          </div>
                        )}
                      </div>

                      {submission?.feedback && (
                        <div className="mt-5 border border-white/10 bg-white/[0.02] p-4">
                          <p className="text-[9px] uppercase tracking-[0.13em] text-[#c7ff39]">
                            Instructor feedback
                          </p>

                          <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
                            {submission.feedback}
                          </p>
                        </div>
                      )}

                      <textarea
                        value={draft.text}
                        disabled={locked}
                        onChange={(event) =>
                          setAssignmentDrafts((current) => ({
                            ...current,
                            [assignment.id]: {
                              ...draft,
                              text: event.target.value,
                            },
                          }))
                        }
                        placeholder="Write your assignment submission..."
                        rows={6}
                        className="mt-5 w-full border border-white/10 bg-white/[0.025] p-3 text-sm outline-none focus:border-[#c7ff39]/40 disabled:opacity-50"
                      />

                      <input
                        value={draft.attachment}
                        disabled={locked}
                        onChange={(event) =>
                          setAssignmentDrafts((current) => ({
                            ...current,
                            [assignment.id]: {
                              ...draft,
                              attachment: event.target.value,
                            },
                          }))
                        }
                        placeholder="Attachment / file URL (optional)"
                        className="mt-3 min-h-11 w-full border border-white/10 bg-white/[0.025] px-3 text-sm outline-none focus:border-[#c7ff39]/40 disabled:opacity-50"
                      />

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                        <p className="text-xs text-white/35">
                          {submission
                            ? `Last submitted ${formatDateTime(
                                submission.submitted_at
                              )}`
                            : "No submission yet."}
                        </p>

                        <button
                          type="button"
                          disabled={saving || locked}
                          onClick={() =>
                            submitAssignment(assignment)
                          }
                          className="inline-flex min-h-10 items-center gap-2 bg-[#c7ff39] px-4 text-xs font-semibold text-[#071008] disabled:opacity-40"
                        >
                          <Send size={14} />
                          {submission
                            ? "Update submission"
                            : "Submit assignment"}
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="border border-white/10 bg-[#0a0d0b]/70 p-7 text-sm text-[#a1a1aa]">
                  No published assignments yet.
                </div>
              )}
            </section>
          )}

          {activeTab === "notes" && (
            <section className="mt-8 grid gap-5 lg:grid-cols-2">
              {notes.length ? (
                notes.map((note) => (
                  <article
                    key={note.id}
                    className="border border-white/10 bg-[#0a0d0b]/70 p-6"
                  >
                    <FileText
                      size={18}
                      className="text-[#c7ff39]"
                    />

                    <h2 className="mt-4 text-lg font-medium">
                      {note.title}
                    </h2>

                    {note.content && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#a1a1aa]">
                        {note.content}
                      </p>
                    )}

                    {note.resource_url && (
                      <a
                        href={note.resource_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 inline-flex items-center gap-2 text-xs text-[#c7ff39]"
                      >
                        Open resource
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </article>
                ))
              ) : (
                <div className="border border-white/10 bg-[#0a0d0b]/70 p-7 text-sm text-[#a1a1aa] lg:col-span-2">
                  No published notes or resources yet.
                </div>
              )}
            </section>
          )}

          {activeTab === "quiz" && (
            <section className="mt-8 space-y-6">
              {quizzes.length ? (
                quizzes.map((quiz) => {
                  const quizQuestions =
                    questionsByQuiz.get(quiz.id) || [];

                  const quizAttempts =
                    attemptsByQuiz.get(quiz.id) || [];

                  const best = quizAttempts.reduce(
                    (bestAttempt, current) =>
                      !bestAttempt ||
                      Number(current.score) >
                        Number(bestAttempt.score)
                        ? current
                        : bestAttempt,
                    null
                  );

                  const answers = quizAnswers[quiz.id] || {};

                  const attemptsLeft = quiz.max_attempts
                    ? Math.max(
                        0,
                        quiz.max_attempts - quizAttempts.length
                      )
                    : null;

                  const cannotAttempt =
                    enrollment?.status === "Completed" ||
                    (attemptsLeft !== null && attemptsLeft <= 0);

                  return (
                    <article
                      key={quiz.id}
                      className="border border-white/10 bg-[#0a0d0b]/70"
                    >
                      <div className="border-b border-white/10 p-6">
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">
                              Final assessment
                            </p>

                            <h2 className="mt-2 text-2xl font-medium">
                              {quiz.title}
                            </h2>

                            {quiz.description && (
                              <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
                                {quiz.description}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-3">
                            <div className="border border-white/10 px-4 py-3 text-center">
                              <p className="text-[9px] uppercase tracking-[0.12em] text-white/30">
                                Pass
                              </p>

                              <p className="mt-1 text-lg font-medium text-[#c7ff39]">
                                {Math.max(
                                  Number(quiz.passing_marks || 0),
                                  80
                                )}
                                /100
                              </p>
                            </div>

                            {best && (
                              <div className="border border-white/10 px-4 py-3 text-center">
                                <p className="text-[9px] uppercase tracking-[0.12em] text-white/30">
                                  Best
                                </p>

                                <p className="mt-1 text-lg font-medium">
                                  {best.score}/100
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="mt-4 text-xs text-white/35">
                          Attempts used: {quizAttempts.length}
                          {quiz.max_attempts
                            ? ` / ${quiz.max_attempts}`
                            : " / unlimited"}
                        </p>
                      </div>

                      {quizQuestions.map((question, index) => (
                        <div
                          key={question.id}
                          className="border-b border-white/[0.07] p-6"
                        >
                          <p className="text-[9px] uppercase tracking-[0.12em] text-white/30">
                            Question {index + 1} · {question.marks} marks
                          </p>

                          <h3 className="mt-2 text-sm font-medium">
                            {question.question_text}
                          </h3>

                          <div className="mt-4 grid gap-2 md:grid-cols-2">
                            {[
                              ["A", question.option_a],
                              ["B", question.option_b],
                              ["C", question.option_c],
                              ["D", question.option_d],
                            ].map(([option, text]) => {
                              const selected =
                                answers[question.id] === option;

                              return (
                                <button
                                  key={option}
                                  type="button"
                                  disabled={cannotAttempt}
                                  onClick={() =>
                                    setQuizAnswers((current) => ({
                                      ...current,
                                      [quiz.id]: {
                                        ...answers,
                                        [question.id]: option,
                                      },
                                    }))
                                  }
                                  className={`min-h-12 border px-4 text-left text-sm ${
                                    selected
                                      ? "border-[#c7ff39]/50 bg-[#c7ff39]/[0.06] text-[#c7ff39]"
                                      : "border-white/10 text-[#a1a1aa] hover:border-white/25"
                                  } disabled:opacity-50`}
                                >
                                  <span className="mr-2 font-medium">
                                    {option}.
                                  </span>
                                  {text}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      <div className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
                        <div>
                          {best &&
                          Number(best.score) >=
                            Math.max(
                              Number(quiz.passing_marks || 0),
                              80
                            ) ? (
                            <p className="inline-flex items-center gap-2 text-sm font-medium text-[#c7ff39]">
                              <CheckCircle2 size={15} />
                              Quiz passed
                            </p>
                          ) : (
                            <p className="text-xs text-[#a1a1aa]">
                              Score at least{" "}
                              {Math.max(
                                Number(quiz.passing_marks || 0),
                                80
                              )}
                              /100 to pass.
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={
                            saving ||
                            cannotAttempt ||
                            quizQuestions.length === 0
                          }
                          onClick={() => submitQuiz(quiz)}
                          className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008] disabled:opacity-40"
                        >
                          <GraduationCap size={15} />
                          Submit quiz
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="border border-white/10 bg-[#0a0d0b]/70 p-7 text-sm text-[#a1a1aa]">
                  Your instructor has not published a quiz yet.
                </div>
              )}
            </section>
          )}

          {activeTab === "completion" && (
            <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_.8fr]">
              <div className="border border-white/10 bg-[#0a0d0b]/70 p-6 md:p-7">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">
                  Course completion
                </p>

                <h2 className="mt-2 text-2xl font-medium">
                  Completion requirements
                </h2>

                <div className="mt-6 space-y-3">
                  {[
                    [
                      `Lectures completed (${completedLectureCount}/${lectures.length})`,
                      allLecturesComplete,
                    ],
                    [
                      `Assignments submitted (${submittedAssignmentCount}/${assignments.length})`,
                      allAssignmentsSubmitted,
                    ],
                    [
                      assignments.length
                        ? "Assignments reviewed and graded"
                        : "No assignment grading required",
                      allAssignmentsGraded,
                    ],
                    [
                      quizzes.length
                        ? "Final quiz passed"
                        : "Final quiz not published yet",
                      allQuizzesPassed,
                    ],
                  ].map(([label, done]) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 border border-white/10 p-4"
                    >
                      <div
                        className={`grid h-7 w-7 place-items-center border ${
                          done
                            ? "border-[#c7ff39]/30 text-[#c7ff39]"
                            : "border-white/10 text-white/25"
                        }`}
                      >
                        {done ? (
                          <Check size={14} />
                        ) : (
                          <LockKeyhole size={13} />
                        )}
                      </div>

                      <span className="text-sm text-[#a1a1aa]">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-white/10 bg-[#0a0d0b]/70 p-6 md:p-7">
                <BookOpen
                  size={20}
                  className="text-[#c7ff39]"
                />

                <h3 className="mt-5 text-xl font-medium">
                  {enrollment?.status === "Completed"
                    ? "Course completed"
                    : pendingCompletionRequest
                    ? "Completion request pending"
                    : latestCompletionRequest?.status === "Rejected"
                    ? "Completion request needs attention"
                    : completionEligible
                    ? "Ready for instructor review"
                    : "Keep learning"}
                </h3>

                <p className="mt-3 text-sm leading-7 text-[#a1a1aa]">
                  {enrollment?.status === "Completed"
                    ? "Your instructor has approved course completion."
                    : pendingCompletionRequest
                    ? "Your completion request has been sent to your instructor and is waiting for review."
                    : latestCompletionRequest?.status === "Rejected"
                    ? "Your previous completion request was not approved. Review the instructor feedback, make any required changes, and submit a new request when ready."
                    : completionEligible
                    ? "You have completed all course requirements and can now request instructor approval."
                    : "Complete the outstanding requirements before requesting course completion."}
                </p>

                {latestCompletionRequest?.status === "Rejected" &&
                  latestCompletionRequest.instructor_note && (
                    <div className="mt-5 border border-[#ffbf69]/20 bg-[#ffbf69]/[0.03] p-4">
                      <p className="text-[9px] uppercase tracking-[0.13em] text-[#ffca80]">
                        Instructor feedback
                      </p>

                      <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
                        {latestCompletionRequest.instructor_note}
                      </p>
                    </div>
                  )}

                {enrollment?.status !== "Completed" &&
                  !pendingCompletionRequest && (
                    <textarea
                      value={completionNote}
                      onChange={(event) =>
                        setCompletionNote(event.target.value)
                      }
                      disabled={!completionEligible || saving}
                      rows={4}
                      maxLength={1000}
                      placeholder="Optional note for your instructor..."
                      className="mt-5 w-full border border-white/10 bg-white/[0.025] p-3 text-sm outline-none focus:border-[#c7ff39]/40 disabled:opacity-50"
                    />
                  )}

                <button
                  type="button"
                  disabled={
                    saving ||
                    !completionEligible ||
                    pendingCompletionRequest ||
                    enrollment?.status === "Completed"
                  }
                  onClick={requestCourseCompletion}
                  className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send size={15} />

                  {enrollment?.status === "Completed"
                    ? "Course completed"
                    : pendingCompletionRequest
                    ? "Request pending"
                    : latestCompletionRequest?.status === "Rejected"
                    ? "Request completion again"
                    : "Request course completion"}
                </button>

                <p className="mt-3 text-center text-[10px] uppercase tracking-[0.12em] text-white/25">
                  {enrollment?.status === "Completed"
                    ? "Completion approved"
                    : pendingCompletionRequest
                    ? `Requested ${formatDateTime(
                        latestCompletionRequest.requested_at
                      )}`
                    : completionEligible
                    ? "All course requirements are complete."
                    : "Complete all course requirements before requesting completion."}
                </p>
              </div>
            </section>
          )}
        </div>

        {saving && (
          <div className="fixed bottom-5 right-5 inline-flex items-center gap-2 border border-white/10 bg-[#0a0d0b] px-4 py-3 text-xs text-[#a1a1aa] shadow-2xl">
            <Loader2
              size={14}
              className="animate-spin text-[#c7ff39]"
            />
            Saving
          </div>
        )}
      </div>
    </main>
  );
}
