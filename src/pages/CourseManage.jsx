import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Layers3,
  Loader2,
  LockKeyhole,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabase";

/* =========================================================
   HELPERS
========================================================= */

const tabs = [
  {
    id: "overview",
    label: "Overview",
    icon: BookOpen,
  },
  {
    id: "lectures",
    label: "Lectures",
    icon: Layers3,
  },
  {
    id: "assignments",
    label: "Assignments",
    icon: ClipboardCheck,
  },
  {
    id: "notes",
    label: "Notes",
    icon: FileText,
  },
  {
    id: "quiz",
    label: "Quiz",
    icon: GraduationCap,
  },
  {
    id: "learners",
    label: "Learners",
    icon: Users,
  },
  {
    id: "completion",
    label: "Completion Requests",
    icon: CheckCircle2,
  },
];

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getStatusClasses(status) {
  const clean =
    normalizeStatus(status);

  if (clean === "active") {
    return "border-[#c7ff39]/30 bg-[#c7ff39]/[0.06] text-[#c7ff39]";
  }

  if (clean === "pending") {
    return "border-[#ffbf69]/30 bg-[#ffbf69]/[0.06] text-[#ffca80]";
  }

  if (clean === "suspended") {
    return "border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.06] text-[#ff8b8b]";
  }

  if (clean === "completed") {
    return "border-[#7dd3fc]/30 bg-[#7dd3fc]/[0.06] text-[#9bdcff]";
  }

  if (clean === "approved" || clean === "graded") {
    return "border-[#c7ff39]/30 bg-[#c7ff39]/[0.06] text-[#c7ff39]";
  }

  if (clean === "rejected") {
    return "border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.06] text-[#ff8b8b]";
  }

  if (clean === "submitted") {
    return "border-[#ffbf69]/30 bg-[#ffbf69]/[0.06] text-[#ffca80]";
  }

  return "border-white/10 bg-white/[0.03] text-[#a1a1aa]";
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ).format(date);
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/* =========================================================
   COURSE MANAGE
========================================================= */

export default function CourseManage() {
  const navigate =
    useNavigate();

  const {
    courseId,
  } =
    useParams();

  const [
    activeTab,
    setActiveTab,
  ] =
    useState("overview");

  const [
    profile,
    setProfile,
  ] =
    useState(null);

  const [
    course,
    setCourse,
  ] =
    useState(null);

  const [
    skill,
    setSkill,
  ] =
    useState(null);

  const [
    modules,
    setModules,
  ] =
    useState([]);

  const [
    lectures,
    setLectures,
  ] =
    useState([]);

  const [
    notes,
    setNotes,
  ] =
    useState([]);

  const [
    assignments,
    setAssignments,
  ] =
    useState([]);

  const [
    quizzes,
    setQuizzes,
  ] =
    useState([]);

  const [
    quizQuestions,
    setQuizQuestions,
  ] =
    useState([]);

  const [
    learners,
    setLearners,
  ] =
    useState([]);

  const [
    completionRequests,
    setCompletionRequests,
  ] =
    useState([]);

  const [
    assignmentSubmissions,
    setAssignmentSubmissions,
  ] =
    useState([]);

  const [
    lectureProgress,
    setLectureProgress,
  ] =
    useState([]);

  const [
    quizAttempts,
    setQuizAttempts,
  ] =
    useState([]);

  const [
    gradeDrafts,
    setGradeDrafts,
  ] =
    useState({});

  const [
    completionReviewNotes,
    setCompletionReviewNotes,
  ] =
    useState({});

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  /* =========================================================
     FORMS
  ========================================================= */

  const [
    moduleForm,
    setModuleForm,
  ] =
    useState({
      title: "",
      description: "",
    });

  const [
    lectureForm,
    setLectureForm,
  ] =
    useState({
      module_id: "",
      title: "",
      content: "",
      video_url: "",
      estimated_minutes: "",
    });

  const [
    noteForm,
    setNoteForm,
  ] =
    useState({
      title: "",
      content: "",
      resource_url: "",
    });

  const [
    assignmentForm,
    setAssignmentForm,
  ] =
    useState({
      title: "",
      instructions: "",
      max_marks: "100",
      due_at: "",
    });

  const [
    quizForm,
    setQuizForm,
  ] =
    useState({
      title: "Final Quiz",
      description: "",
      passing_marks: "80",
      max_attempts: "",
    });

  const [
    questionForm,
    setQuestionForm,
  ] =
    useState({
      quiz_id: "",
      question_text: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_option: "A",
      marks: "",
    });

  /* =========================================================
     LOAD
  ========================================================= */

  const loadCourseWorkspace =
    async ({
      silent = false,
    } = {}) => {
      if (
        !courseId
      ) {
        setError(
          "Course ID is missing."
        );
        setLoading(false);
        return;
      }

      try {
        if (!silent) {
          setLoading(true);
        }

        setError("");

        const {
          data: {
            user,
          },
          error:
            authError,
        } =
          await supabase.auth
            .getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          navigate(
            "/login",
            {
              replace: true,
            }
          );

          return;
        }

        const {
          data:
            profileData,
          error:
            profileError,
        } =
          await supabase
            .from("profiles")
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
              user.id
            )
            .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (!profileData) {
          throw new Error(
            "PROFILE_NOT_FOUND"
          );
        }

        if (
          profileData.is_active ===
          false
        ) {
          navigate(
            "/dashboard",
            {
              replace: true,
            }
          );

          return;
        }

        const {
          data:
            courseData,
          error:
            courseError,
        } =
          await supabase
            .from("courses")
            .select(
              `
                id,
                title,
                instructor_id,
                skill_id,
                price_credits,
                course_level,
                status,
                created_at
              `
            )
            .eq(
              "id",
              courseId
            )
            .maybeSingle();

        if (courseError) {
          throw courseError;
        }

        if (!courseData) {
          throw new Error(
            "COURSE_NOT_FOUND"
          );
        }

        if (
          courseData.instructor_id !==
          user.id
        ) {
          navigate(
            "/my-courses",
            {
              replace: true,
            }
          );

          return;
        }

        const [
          skillResult,
          modulesResult,
          lecturesResult,
          notesResult,
          assignmentsResult,
          quizzesResult,
          enrollmentsResult,
        ] =
          await Promise.all([
            courseData.skill_id
              ? supabase
                  .from("skills")
                  .select(
                    `
                      id,
                      name
                    `
                  )
                  .eq(
                    "id",
                    courseData.skill_id
                  )
                  .maybeSingle()
              : Promise.resolve({
                  data: null,
                  error: null,
                }),

            supabase
              .from(
                "course_modules"
              )
              .select(
                `
                  id,
                  course_id,
                  title,
                  description,
                  position,
                  is_published,
                  created_at,
                  updated_at
                `
              )
              .eq(
                "course_id",
                courseId
              )
              .order(
                "position",
                {
                  ascending: true,
                }
              ),

            supabase
              .from(
                "course_lectures"
              )
              .select(
                `
                  id,
                  module_id,
                  title,
                  content,
                  video_url,
                  position,
                  estimated_minutes,
                  is_published,
                  created_at,
                  updated_at
                `
              )
              .order(
                "position",
                {
                  ascending: true,
                }
              ),

            supabase
              .from(
                "course_notes"
              )
              .select(
                `
                  id,
                  course_id,
                  lecture_id,
                  title,
                  content,
                  resource_url,
                  position,
                  is_published,
                  created_at,
                  updated_at
                `
              )
              .eq(
                "course_id",
                courseId
              )
              .order(
                "position",
                {
                  ascending: true,
                }
              ),

            supabase
              .from(
                "course_assignments"
              )
              .select(
                `
                  id,
                  course_id,
                  title,
                  instructions,
                  max_marks,
                  due_at,
                  is_published,
                  created_at,
                  updated_at
                `
              )
              .eq(
                "course_id",
                courseId
              )
              .order(
                "created_at",
                {
                  ascending: true,
                }
              ),

            supabase
              .from(
                "course_quizzes"
              )
              .select(
                `
                  id,
                  course_id,
                  title,
                  description,
                  total_marks,
                  passing_marks,
                  max_attempts,
                  is_published,
                  created_at,
                  updated_at
                `
              )
              .eq(
                "course_id",
                courseId
              )
              .order(
                "created_at",
                {
                  ascending: true,
                }
              ),

            supabase
              .from(
                "course_enrollments"
              )
              .select(
                `
                  id,
                  course_id,
                  learner_id,
                  instructor_id,
                  price_credits,
                  status,
                  created_at,
                  approved_at,
                  completed_at
                `
              )
              .eq(
                "course_id",
                courseId
              )
              .in(
                "status",
                [
                  "Approved",
                  "Completed",
                ]
              )
              .order(
                "created_at",
                {
                  ascending: false,
                }
              ),
          ]);

        if (
          modulesResult.error
        ) {
          throw modulesResult.error;
        }

        if (
          lecturesResult.error
        ) {
          throw lecturesResult.error;
        }

        if (
          notesResult.error
        ) {
          throw notesResult.error;
        }

        if (
          assignmentsResult.error
        ) {
          throw assignmentsResult.error;
        }

        if (
          quizzesResult.error
        ) {
          throw quizzesResult.error;
        }

        if (
          enrollmentsResult.error
        ) {
          throw enrollmentsResult.error;
        }

        const moduleRows =
          modulesResult.data ||
          [];

        const moduleIds =
          new Set(
            moduleRows.map(
              (item) =>
                item.id
            )
          );

        const lectureRows =
          (
            lecturesResult.data ||
            []
          ).filter(
            (item) =>
              moduleIds.has(
                item.module_id
              )
          );

        const quizRows =
          quizzesResult.data ||
          [];

        const quizIds =
          quizRows
            .map(
              (item) =>
                item.id
            )
            .filter(Boolean);

        let questionRows = [];

        if (
          quizIds.length >
          0
        ) {
          const {
            data,
            error:
              questionError,
          } =
            await supabase
              .from(
                "quiz_questions"
              )
              .select(
                `
                  id,
                  quiz_id,
                  question_text,
                  option_a,
                  option_b,
                  option_c,
                  option_d,
                  marks,
                  position,
                  created_at,
                  updated_at
                `
              )
              .in(
                "quiz_id",
                quizIds
              )
              .order(
                "position",
                {
                  ascending: true,
                }
              );

          if (
            questionError
          ) {
            throw questionError;
          }

          questionRows =
            data || [];
        }

        const enrollmentRows =
          enrollmentsResult.data ||
          [];

        const learnerIds =
          [
            ...new Set(
              enrollmentRows
                .map(
                  (row) =>
                    row.learner_id
                )
                .filter(Boolean)
            ),
          ];

        let learnerProfiles = [];

        if (
          learnerIds.length >
          0
        ) {
          const {
            data,
            error:
              learnerError,
          } =
            await supabase
              .from("profiles")
              .select(
                `
                  id,
                  username,
                  full_name,
                  avatar_url,
                  location
                `
              )
              .in(
                "id",
                learnerIds
              );

          if (
            learnerError
          ) {
            throw learnerError;
          }

          learnerProfiles =
            data || [];
        }

        const learnerMap =
          new Map(
            learnerProfiles.map(
              (item) => [
                item.id,
                item,
              ]
            )
          );

        const joinedLearners =
          enrollmentRows.map(
            (
              enrollment
            ) => ({
              ...enrollment,

              learner:
                learnerMap.get(
                  enrollment.learner_id
                ) ||
                null,
            })
          );

        const assignmentIds =
          (assignmentsResult.data || [])
            .map((item) => item.id)
            .filter(Boolean);

        let submissionRows = [];

        if (assignmentIds.length > 0) {
          const {
            data,
            error: submissionError,
          } = await supabase
            .from("assignment_submissions")
            .select(`
              id,
              assignment_id,
              learner_id,
              submission_text,
              attachment_url,
              status,
              grade,
              feedback,
              submitted_at,
              graded_by,
              graded_at
            `)
            .in("assignment_id", assignmentIds)
            .order("submitted_at", { ascending: false });

          if (submissionError) {
            throw submissionError;
          }

          submissionRows = data || [];
        }

        const publishedModuleIds = new Set(
          moduleRows
            .filter((item) => item.is_published)
            .map((item) => item.id)
        );

        const publishedLectureIds = lectureRows
          .filter(
            (item) =>
              item.is_published &&
              publishedModuleIds.has(item.module_id)
          )
          .map((item) => item.id);

        let progressRows = [];

        if (
          publishedLectureIds.length > 0 &&
          learnerIds.length > 0
        ) {
          const {
            data,
            error: progressError,
          } = await supabase
            .from("lecture_progress")
            .select(`
              id,
              lecture_id,
              learner_id,
              completed,
              completed_at
            `)
            .in("lecture_id", publishedLectureIds)
            .in("learner_id", learnerIds);

          if (progressError) {
            throw progressError;
          }

          progressRows = data || [];
        }

        const enrollmentIds =
          enrollmentRows
            .map(
              (item) =>
                item.id
            )
            .filter(Boolean);

        let attemptRows = [];

        if (
          quizIds.length > 0 &&
          enrollmentIds.length > 0
        ) {
          const {
            data,
            error: attemptError,
          } = await supabase
            .from("quiz_attempts")
            .select(`
              id,
              quiz_id,
              enrollment_id,
              learner_id,
              attempt_number,
              score,
              passed,
              submitted_at
            `)
            .in("quiz_id", quizIds)
            .in("enrollment_id", enrollmentIds)
            .order("submitted_at", { ascending: false });

          if (attemptError) {
            throw attemptError;
          }

          attemptRows = data || [];
        }

        let completionRows = [];

        if (
          enrollmentIds.length >
          0
        ) {
          const {
            data,
            error:
              completionError,
          } =
            await supabase
              .from(
                "course_completion_requests"
              )
              .select(
                `
                  id,
                  enrollment_id,
                  status,
                  learner_note,
                  instructor_note,
                  requested_at,
                  reviewed_at,
                  reviewed_by
                `
              )
              .in(
                "enrollment_id",
                enrollmentIds
              )
              .order(
                "requested_at",
                {
                  ascending: false,
                }
              );

          if (
            completionError
          ) {
            throw completionError;
          }

          const enrollmentMap =
            new Map(
              joinedLearners.map(
                (item) => [
                  item.id,
                  item,
                ]
              )
            );

          completionRows =
            (
              data || []
            ).map(
              (request) => ({
                ...request,

                enrollment:
                  enrollmentMap.get(
                    request.enrollment_id
                  ) ||
                  null,
              })
            );
        }

        setProfile(
          profileData
        );

        setCourse(
          courseData
        );

        setSkill(
          skillResult.data ||
            null
        );

        setModules(
          moduleRows
        );

        setLectures(
          lectureRows
        );

        setNotes(
          notesResult.data ||
            []
        );

        setAssignments(
          assignmentsResult.data ||
            []
        );

        setQuizzes(
          quizRows
        );

        setQuizQuestions(
          questionRows
        );

        setLearners(
          joinedLearners
        );

        setCompletionRequests(
          completionRows
        );

        setAssignmentSubmissions(
          submissionRows
        );

        setLectureProgress(
          progressRows
        );

        setQuizAttempts(
          attemptRows
        );

        setGradeDrafts(() => {
          const next = {};

          submissionRows.forEach((submission) => {
            next[submission.id] = {
              grade:
                submission.grade === null ||
                submission.grade === undefined
                  ? ""
                  : String(submission.grade),
              feedback: submission.feedback || "",
            };
          });

          return next;
        });

        setCompletionReviewNotes((current) => {
          const next = { ...current };

          completionRows.forEach((request) => {
            if (next[request.id] === undefined) {
              next[request.id] = request.instructor_note || "";
            }
          });

          return next;
        });

        if (
          !lectureForm.module_id &&
          moduleRows[0]?.id
        ) {
          setLectureForm(
            (current) => ({
              ...current,
              module_id:
                moduleRows[0].id,
            })
          );
        }

        if (
          !questionForm.quiz_id &&
          quizRows[0]?.id
        ) {
          setQuestionForm(
            (current) => ({
              ...current,
              quiz_id:
                quizRows[0].id,
            })
          );
        }
      } catch (err) {
        console.error(
          "COURSE MANAGE LOAD ERROR:",
          err
        );

        setError(
          err?.message ===
            "COURSE_NOT_FOUND"
            ? "Course not found."
            : err?.message ||
                "We couldn't load this course workspace."
        );
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    };

  useEffect(() => {
    loadCourseWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  /* =========================================================
     DERIVED
  ========================================================= */

  const lecturesByModule =
    useMemo(() => {
      const map =
        new Map();

      modules.forEach(
        (module) => {
          map.set(
            module.id,
            []
          );
        }
      );

      lectures.forEach(
        (lecture) => {
          const list =
            map.get(
              lecture.module_id
            ) || [];

          list.push(
            lecture
          );

          map.set(
            lecture.module_id,
            list
          );
        }
      );

      return map;
    }, [
      modules,
      lectures,
    ]);

  const questionMarksByQuiz =
    useMemo(() => {
      const map =
        new Map();

      quizQuestions.forEach(
        (question) => {
          map.set(
            question.quiz_id,
            Number(
              map.get(
                question.quiz_id
              ) || 0
            ) +
              Number(
                question.marks ||
                  0
              )
          );
        }
      );

      return map;
    }, [
      quizQuestions,
    ]);

  const learnerEnrollmentByLearnerId =
    useMemo(() => {
      return new Map(
        learners.map((enrollment) => [
          enrollment.learner_id,
          enrollment,
        ])
      );
    }, [learners]);

  const submissionsByAssignment =
    useMemo(() => {
      const map = new Map();

      assignments.forEach((assignment) => {
        map.set(assignment.id, []);
      });

      assignmentSubmissions.forEach((submission) => {
        const list = map.get(submission.assignment_id) || [];
        list.push(submission);
        map.set(submission.assignment_id, list);
      });

      return map;
    }, [assignments, assignmentSubmissions]);

  const publishedLectureIds =
    useMemo(() => {
      const publishedModuleIds = new Set(
        modules
          .filter((module) => module.is_published)
          .map((module) => module.id)
      );

      return lectures
        .filter(
          (lecture) =>
            lecture.is_published &&
            publishedModuleIds.has(lecture.module_id)
        )
        .map((lecture) => lecture.id);
    }, [modules, lectures]);

  const pendingCompletionRequests =
    completionRequests.filter(
      (item) =>
        item.status ===
        "Pending"
    );

  /* =========================================================
     MUTATION WRAPPER
  ========================================================= */

  const runMutation =
    async (
      callback,
      message
    ) => {
      try {
        setSaving(true);
        setError("");
        setSuccess("");

        await callback();

        setSuccess(
          message
        );

        await loadCourseWorkspace({
          silent: true,
        });
      } catch (err) {
        console.error(
          "COURSE MANAGE MUTATION ERROR:",
          err
        );

        setError(
          err?.message ||
            "The change could not be saved."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =========================================================
     ASSIGNMENT GRADING
  ========================================================= */

  const gradeAssignmentSubmission =
    async (submission, assignment) => {
      const draft = gradeDrafts[submission.id] || {
        grade: "",
        feedback: "",
      };

      const grade = Number(draft.grade);

      if (draft.grade === "" || Number.isNaN(grade)) {
        setError("Enter a valid grade.");
        return;
      }

      if (grade < 0 || grade > Number(assignment.max_marks)) {
        setError(
          `Grade must be between 0 and ${assignment.max_marks}.`
        );
        return;
      }

      await runMutation(
        async () => {
          const { error: rpcError } = await supabase.rpc(
            "grade_course_assignment",
            {
              p_submission_id: submission.id,
              p_grade: grade,
              p_feedback: draft.feedback.trim() || null,
            }
          );

          if (rpcError) {
            throw rpcError;
          }
        },
        submission.status === "Graded"
          ? "Assignment grade updated."
          : "Assignment graded."
      );
    };

  /* =========================================================
     COMPLETION REVIEW
  ========================================================= */

  const reviewCompletionRequest =
    async (request, decision) => {
      const note =
        completionReviewNotes[request.id]?.trim() || null;

      if (decision === "Rejected" && !note) {
        setError(
          "Add instructor feedback before rejecting the completion request."
        );
        return;
      }

      await runMutation(
        async () => {
          const { error: rpcError } = await supabase.rpc(
            "review_course_completion",
            {
              p_request_id: request.id,
              p_decision: decision,
              p_instructor_note: note,
            }
          );

          if (rpcError) {
            throw rpcError;
          }
        },
        decision === "Approved"
          ? "Course completion approved and certificate issued."
          : "Course completion request rejected."
      );
    };

  /* =========================================================
     MODULES
  ========================================================= */

  const addModule =
    async () => {
      const title =
        moduleForm.title.trim();

      if (!title) {
        setError(
          "Module title is required."
        );
        return;
      }

      await runMutation(
        async () => {
          const nextPosition =
            modules.length >
            0
              ? Math.max(
                  ...modules.map(
                    (item) =>
                      Number(
                        item.position ||
                          0
                      )
                  )
                ) + 1
              : 1;

          const {
            error:
              insertError,
          } =
            await supabase
              .from(
                "course_modules"
              )
              .insert({
                course_id:
                  courseId,

                title,

                description:
                  moduleForm.description.trim() ||
                  null,

                position:
                  nextPosition,

                is_published:
                  false,
              });

          if (
            insertError
          ) {
            throw insertError;
          }

          setModuleForm({
            title: "",
            description: "",
          });
        },
        "Module created."
      );
    };

  const toggleModulePublished =
    async (
      module
    ) => {
      await runMutation(
        async () => {
          const {
            error:
              updateError,
          } =
            await supabase
              .from(
                "course_modules"
              )
              .update({
                is_published:
                  !module.is_published,
              })
              .eq(
                "id",
                module.id
              )
              .eq(
                "course_id",
                courseId
              );

          if (
            updateError
          ) {
            throw updateError;
          }
        },
        module.is_published
          ? "Module unpublished."
          : "Module published."
      );
    };

  const deleteModule =
    async (
      module
    ) => {
      const confirmed =
        window.confirm(
          `Delete "${module.title}" and all lectures inside it?`
        );

      if (!confirmed) {
        return;
      }

      await runMutation(
        async () => {
          const {
            error:
              deleteError,
          } =
            await supabase
              .from(
                "course_modules"
              )
              .delete()
              .eq(
                "id",
                module.id
              )
              .eq(
                "course_id",
                courseId
              );

          if (
            deleteError
          ) {
            throw deleteError;
          }
        },
        "Module deleted."
      );
    };

  /* =========================================================
     LECTURES
  ========================================================= */

  const addLecture =
    async () => {
      if (
        !lectureForm.module_id
      ) {
        setError(
          "Choose a module first."
        );
        return;
      }

      const title =
        lectureForm.title.trim();

      if (!title) {
        setError(
          "Lecture title is required."
        );
        return;
      }

      await runMutation(
        async () => {
          const moduleLectures =
            lectures.filter(
              (item) =>
                item.module_id ===
                lectureForm.module_id
            );

          const nextPosition =
            moduleLectures.length >
            0
              ? Math.max(
                  ...moduleLectures.map(
                    (item) =>
                      Number(
                        item.position ||
                          0
                      )
                  )
                ) + 1
              : 1;

          const {
            error:
              insertError,
          } =
            await supabase
              .from(
                "course_lectures"
              )
              .insert({
                module_id:
                  lectureForm.module_id,

                title,

                content:
                  lectureForm.content.trim() ||
                  null,

                video_url:
                  lectureForm.video_url.trim() ||
                  null,

                estimated_minutes:
                  lectureForm.estimated_minutes
                    ? Number(
                        lectureForm.estimated_minutes
                      )
                    : null,

                position:
                  nextPosition,

                is_published:
                  false,
              });

          if (
            insertError
          ) {
            throw insertError;
          }

          setLectureForm(
            (current) => ({
              module_id:
                current.module_id,
              title: "",
              content: "",
              video_url: "",
              estimated_minutes:
                "",
            })
          );
        },
        "Lecture created."
      );
    };

  const toggleLecturePublished =
    async (
      lecture
    ) => {
      await runMutation(
        async () => {
          const {
            error:
              updateError,
          } =
            await supabase
              .from(
                "course_lectures"
              )
              .update({
                is_published:
                  !lecture.is_published,
              })
              .eq(
                "id",
                lecture.id
              );

          if (
            updateError
          ) {
            throw updateError;
          }
        },
        lecture.is_published
          ? "Lecture unpublished."
          : "Lecture published."
      );
    };

  const deleteLecture =
    async (
      lecture
    ) => {
      if (
        !window.confirm(
          `Delete "${lecture.title}"?`
        )
      ) {
        return;
      }

      await runMutation(
        async () => {
          const {
            error:
              deleteError,
          } =
            await supabase
              .from(
                "course_lectures"
              )
              .delete()
              .eq(
                "id",
                lecture.id
              );

          if (
            deleteError
          ) {
            throw deleteError;
          }
        },
        "Lecture deleted."
      );
    };

  /* =========================================================
     NOTES
  ========================================================= */

  const addNote =
    async () => {
      const title =
        noteForm.title.trim();

      if (!title) {
        setError(
          "Note title is required."
        );
        return;
      }

      await runMutation(
        async () => {
          const nextPosition =
            notes.length >
            0
              ? Math.max(
                  ...notes.map(
                    (item) =>
                      Number(
                        item.position ||
                          0
                      )
                  )
                ) + 1
              : 1;

          const {
            error:
              insertError,
          } =
            await supabase
              .from(
                "course_notes"
              )
              .insert({
                course_id:
                  courseId,

                title,

                content:
                  noteForm.content.trim() ||
                  null,

                resource_url:
                  noteForm.resource_url.trim() ||
                  null,

                position:
                  nextPosition,

                is_published:
                  false,
              });

          if (
            insertError
          ) {
            throw insertError;
          }

          setNoteForm({
            title: "",
            content: "",
            resource_url: "",
          });
        },
        "Note added."
      );
    };

  const toggleNotePublished =
    async (
      note
    ) => {
      await runMutation(
        async () => {
          const {
            error:
              updateError,
          } =
            await supabase
              .from(
                "course_notes"
              )
              .update({
                is_published:
                  !note.is_published,
              })
              .eq(
                "id",
                note.id
              )
              .eq(
                "course_id",
                courseId
              );

          if (
            updateError
          ) {
            throw updateError;
          }
        },
        note.is_published
          ? "Note unpublished."
          : "Note published."
      );
    };

  const deleteNote =
    async (
      note
    ) => {
      if (
        !window.confirm(
          `Delete "${note.title}"?`
        )
      ) {
        return;
      }

      await runMutation(
        async () => {
          const {
            error:
              deleteError,
          } =
            await supabase
              .from(
                "course_notes"
              )
              .delete()
              .eq(
                "id",
                note.id
              )
              .eq(
                "course_id",
                courseId
              );

          if (
            deleteError
          ) {
            throw deleteError;
          }
        },
        "Note deleted."
      );
    };

  /* =========================================================
     ASSIGNMENTS
  ========================================================= */

  const addAssignment =
    async () => {
      const title =
        assignmentForm.title.trim();

      const instructions =
        assignmentForm.instructions.trim();

      if (
        !title ||
        !instructions
      ) {
        setError(
          "Assignment title and instructions are required."
        );
        return;
      }

      const maxMarks =
        Number(
          assignmentForm.max_marks
        );

      if (
        !Number.isFinite(
          maxMarks
        ) ||
        maxMarks <= 0 ||
        maxMarks > 100
      ) {
        setError(
          "Assignment marks must be between 1 and 100."
        );
        return;
      }

      await runMutation(
        async () => {
          const {
            error:
              insertError,
          } =
            await supabase
              .from(
                "course_assignments"
              )
              .insert({
                course_id:
                  courseId,

                title,

                instructions,

                max_marks:
                  maxMarks,

                due_at:
                  assignmentForm.due_at
                    ? new Date(
                        assignmentForm.due_at
                      ).toISOString()
                    : null,

                is_published:
                  false,
              });

          if (
            insertError
          ) {
            throw insertError;
          }

          setAssignmentForm({
            title: "",
            instructions: "",
            max_marks: "100",
            due_at: "",
          });
        },
        "Assignment created."
      );
    };

  const toggleAssignmentPublished =
    async (
      assignment
    ) => {
      await runMutation(
        async () => {
          const {
            error:
              updateError,
          } =
            await supabase
              .from(
                "course_assignments"
              )
              .update({
                is_published:
                  !assignment.is_published,
              })
              .eq(
                "id",
                assignment.id
              )
              .eq(
                "course_id",
                courseId
              );

          if (
            updateError
          ) {
            throw updateError;
          }
        },
        assignment.is_published
          ? "Assignment unpublished."
          : "Assignment published."
      );
    };

  const deleteAssignment =
    async (
      assignment
    ) => {
      if (
        !window.confirm(
          `Delete "${assignment.title}"?`
        )
      ) {
        return;
      }

      await runMutation(
        async () => {
          const {
            error:
              deleteError,
          } =
            await supabase
              .from(
                "course_assignments"
              )
              .delete()
              .eq(
                "id",
                assignment.id
              )
              .eq(
                "course_id",
                courseId
              );

          if (
            deleteError
          ) {
            throw deleteError;
          }
        },
        "Assignment deleted."
      );
    };

  /* =========================================================
     QUIZ
  ========================================================= */

  const addQuiz =
    async () => {
      const title =
        quizForm.title.trim();

      if (!title) {
        setError(
          "Quiz title is required."
        );
        return;
      }

      const passingMarks =
        Number(
          quizForm.passing_marks
        );

      if (
        !Number.isFinite(
          passingMarks
        ) ||
        passingMarks < 0 ||
        passingMarks > 100
      ) {
        setError(
          "Passing marks must be between 0 and 100."
        );
        return;
      }

      const maxAttempts =
        quizForm.max_attempts
          ? Number(
              quizForm.max_attempts
            )
          : null;

      if (
        maxAttempts !==
          null &&
        (
          !Number.isInteger(
            maxAttempts
          ) ||
          maxAttempts <= 0
        )
      ) {
        setError(
          "Maximum attempts must be a positive whole number."
        );
        return;
      }

      await runMutation(
        async () => {
          const {
            data,
            error:
              insertError,
          } =
            await supabase
              .from(
                "course_quizzes"
              )
              .insert({
                course_id:
                  courseId,

                title,

                description:
                  quizForm.description.trim() ||
                  null,

                total_marks:
                  100,

                passing_marks:
                  passingMarks,

                max_attempts:
                  maxAttempts,

                is_published:
                  false,
              })
              .select(
                "id"
              )
              .single();

          if (
            insertError
          ) {
            throw insertError;
          }

          setQuizForm({
            title: "Final Quiz",
            description: "",
            passing_marks:
              "80",
            max_attempts:
              "",
          });

          if (
            data?.id
          ) {
            setQuestionForm(
              (current) => ({
                ...current,
                quiz_id:
                  data.id,
              })
            );
          }
        },
        "Quiz created."
      );
    };

  const addQuestion =
    async () => {
      const {
        quiz_id,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_option,
        marks,
      } =
        questionForm;

      if (!quiz_id) {
        setError(
          "Create or select a quiz first."
        );
        return;
      }

      if (
        !question_text.trim() ||
        !option_a.trim() ||
        !option_b.trim() ||
        !option_c.trim() ||
        !option_d.trim()
      ) {
        setError(
          "Question text and all four options are required."
        );
        return;
      }

      const numericMarks =
        Number(marks);

      if (
        !Number.isInteger(
          numericMarks
        ) ||
        numericMarks <= 0 ||
        numericMarks > 100
      ) {
        setError(
          "Question marks must be a positive whole number."
        );
        return;
      }

      const currentMarks =
        Number(
          questionMarksByQuiz.get(
            quiz_id
          ) || 0
        );

      if (
        currentMarks +
          numericMarks >
        100
      ) {
        setError(
          `This quiz already has ${currentMarks} marks. Total question marks cannot exceed 100.`
        );
        return;
      }

      await runMutation(
        async () => {
          const quizQuestionsForQuiz =
            quizQuestions.filter(
              (item) =>
                item.quiz_id ===
                quiz_id
            );

          const nextPosition =
            quizQuestionsForQuiz.length >
            0
              ? Math.max(
                  ...quizQuestionsForQuiz.map(
                    (item) =>
                      Number(
                        item.position ||
                          0
                      )
                  )
                ) + 1
              : 1;

          const {
            data:
              questionData,
            error:
              questionError,
          } =
            await supabase
              .from(
                "quiz_questions"
              )
              .insert({
                quiz_id,

                question_text:
                  question_text.trim(),

                option_a:
                  option_a.trim(),

                option_b:
                  option_b.trim(),

                option_c:
                  option_c.trim(),

                option_d:
                  option_d.trim(),

                marks:
                  numericMarks,

                position:
                  nextPosition,
              })
              .select(
                "id"
              )
              .single();

          if (
            questionError
          ) {
            throw questionError;
          }

          const {
            error:
              keyError,
          } =
            await supabase
              .from(
                "quiz_question_keys"
              )
              .insert({
                question_id:
                  questionData.id,

                correct_option:
                  correct_option,
              });

          if (
            keyError
          ) {
            await supabase
              .from(
                "quiz_questions"
              )
              .delete()
              .eq(
                "id",
                questionData.id
              );

            throw keyError;
          }

          setQuestionForm(
            (current) => ({
              quiz_id:
                current.quiz_id,
              question_text: "",
              option_a: "",
              option_b: "",
              option_c: "",
              option_d: "",
              correct_option:
                "A",
              marks: "",
            })
          );
        },
        "Quiz question added."
      );
    };

  const toggleQuizPublished =
    async (
      quiz
    ) => {
      const currentMarks =
        Number(
          questionMarksByQuiz.get(
            quiz.id
          ) || 0
        );

      if (
        !quiz.is_published &&
        currentMarks !== 100
      ) {
        setError(
          `Quiz questions currently total ${currentMarks}/100 marks. They must total exactly 100 before publishing.`
        );

        return;
      }

      await runMutation(
        async () => {
          const {
            error:
              updateError,
          } =
            await supabase
              .from(
                "course_quizzes"
              )
              .update({
                is_published:
                  !quiz.is_published,
              })
              .eq(
                "id",
                quiz.id
              )
              .eq(
                "course_id",
                courseId
              );

          if (
            updateError
          ) {
            throw updateError;
          }
        },
        quiz.is_published
          ? "Quiz unpublished."
          : "Quiz published."
      );
    };

  const deleteQuestion =
    async (
      question
    ) => {
      if (
        !window.confirm(
          "Delete this quiz question?"
        )
      ) {
        return;
      }

      await runMutation(
        async () => {
          const {
            error:
              deleteError,
          } =
            await supabase
              .from(
                "quiz_questions"
              )
              .delete()
              .eq(
                "id",
                question.id
              );

          if (
            deleteError
          ) {
            throw deleteError;
          }
        },
        "Quiz question deleted."
      );
    };

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
            Loading course workspace
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
            "radial-gradient(ellipse at 82% 0%, rgba(199,255,57,.06), transparent 38%)",
        }}
      />

      <div className="relative z-10">
        {/* =================================================
            HEADER
        ================================================= */}

        <header className="border-b border-white/10 bg-[#060807]/90 backdrop-blur-xl">
          <div className="mx-auto flex min-h-[72px] max-w-[1500px] items-center justify-between gap-4 px-5 md:px-8 lg:px-10">
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/my-courses"
                )
              }
              className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] transition hover:text-[#c7ff39]"
            >
              <ArrowLeft
                size={16}
              />

              My Courses
            </button>

            <div className="flex items-center gap-3">
              {course && (
                <span
                  className={`hidden border px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] sm:inline-flex ${getStatusClasses(
                    course.status
                  )}`}
                >
                  {
                    course.status
                  }
                </span>
              )}

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/courses/${courseId}`
                  )
                }
                className="inline-flex min-h-10 items-center justify-center gap-2 border border-white/10 px-4 text-xs font-medium text-[#f2f4ef] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"
              >
                Public details

                <ChevronRight
                  size={14}
                />
              </button>
            </div>
          </div>
        </header>

        {/* =================================================
            HERO
        ================================================= */}

        <div className="mx-auto max-w-[1500px] px-5 pb-20 pt-10 md:px-8 lg:px-10">
          {error && (
            <div className="mb-5 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm text-[#ff8b8b]">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 border border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] px-4 py-3 text-sm text-[#c7ff39]">
              {success}
            </div>
          )}

          {course && (
            <>
              <section className="border-b border-white/10 pb-8">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#c7ff39]">
                  Instructor course workspace
                </p>

                <h1 className="mt-3 max-w-4xl text-3xl font-medium tracking-[-0.05em] md:text-4xl">
                  {
                    course.title
                  }
                </h1>

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#a1a1aa]">
                  <span>
                    {skill?.name ||
                      "Course"}
                  </span>

                  <span>
                    {
                      course.course_level
                    }
                  </span>

                  <span>
                    {
                      course.price_credits
                    }{" "}
                    SS
                  </span>

                  <span>
                    Created{" "}
                    {formatDate(
                      course.created_at
                    )}
                  </span>
                </div>
              </section>

              {/* =============================================
                  TABS
              ============================================= */}

              <div className="mt-6 overflow-x-auto border-b border-white/10">
                <div className="flex min-w-max">
                  {tabs.map(
                    (tab) => {
                      const Icon =
                        tab.icon;

                      const active =
                        activeTab ===
                        tab.id;

                      return (
                        <button
                          key={
                            tab.id
                          }
                          type="button"
                          onClick={() => {
                            setActiveTab(
                              tab.id
                            );
                            setError("");
                            setSuccess("");
                          }}
                          className={`inline-flex min-h-12 items-center gap-2 border-b-2 px-4 text-xs font-medium transition ${
                            active
                              ? "border-[#c7ff39] text-[#c7ff39]"
                              : "border-transparent text-[#a1a1aa] hover:text-white"
                          }`}
                        >
                          <Icon
                            size={14}
                          />

                          {
                            tab.label
                          }

                          {tab.id ===
                            "completion" &&
                            pendingCompletionRequests.length >
                              0 && (
                              <span className="grid min-h-5 min-w-5 place-items-center rounded-full bg-[#c7ff39] px-1 text-[9px] font-bold text-[#071008]">
                                {
                                  pendingCompletionRequests.length
                                }
                              </span>
                            )}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* =============================================
                  OVERVIEW
              ============================================= */}

              {activeTab ===
                "overview" && (
                <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
                  <div className="border border-white/10 bg-[#0a0d0b]/70 p-6 md:p-7">
                    <div className="flex items-center gap-2">
                      <LockKeyhole
                        size={15}
                        className="text-[#c7ff39]"
                      />

                      <p className="text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">
                        Locked identity
                      </p>
                    </div>

                    <h2 className="mt-3 text-2xl font-medium">
                      Course information
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
                      The course title stays locked here. Teaching content is managed through the other tabs.
                    </p>

                    <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="border border-white/10 p-4">
                        <dt className="text-[9px] uppercase tracking-[0.14em] text-white/30">
                          Title
                        </dt>
                        <dd className="mt-2 text-sm">
                          {
                            course.title
                          }
                        </dd>
                      </div>

                      <div className="border border-white/10 p-4">
                        <dt className="text-[9px] uppercase tracking-[0.14em] text-white/30">
                          Skill
                        </dt>
                        <dd className="mt-2 text-sm">
                          {skill?.name ||
                            "—"}
                        </dd>
                      </div>

                      <div className="border border-white/10 p-4">
                        <dt className="text-[9px] uppercase tracking-[0.14em] text-white/30">
                          Level
                        </dt>
                        <dd className="mt-2 text-sm">
                          {
                            course.course_level
                          }
                        </dd>
                      </div>

                      <div className="border border-white/10 p-4">
                        <dt className="text-[9px] uppercase tracking-[0.14em] text-white/30">
                          Enrollment value
                        </dt>
                        <dd className="mt-2 text-sm text-[#c7ff39]">
                          {
                            course.price_credits
                          }{" "}
                          SS
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="border border-white/10 bg-[#0a0d0b]/70 p-6 md:p-7">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">
                      Course build status
                    </p>

                    <div className="mt-5 space-y-4">
                      {[
                        [
                          "Modules",
                          modules.length,
                        ],
                        [
                          "Lectures",
                          lectures.length,
                        ],
                        [
                          "Notes",
                          notes.length,
                        ],
                        [
                          "Assignments",
                          assignments.length,
                        ],
                        [
                          "Quizzes",
                          quizzes.length,
                        ],
                        [
                          "Learners",
                          learners.length,
                        ],
                      ].map(
                        ([
                          label,
                          value,
                        ]) => (
                          <div
                            key={
                              label
                            }
                            className="flex items-center justify-between border-b border-white/10 pb-3"
                          >
                            <span className="text-sm text-[#a1a1aa]">
                              {
                                label
                              }
                            </span>

                            <span className="text-sm font-medium text-[#f2f4ef]">
                              {
                                value
                              }
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* =============================================
                  LECTURES
              ============================================= */}

              {activeTab ===
                "lectures" && (
                <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
                  <div className="space-y-5">
                    {modules.length >
                    0 ? (
                      modules.map(
                        (module) => {
                          const moduleLectures =
                            lecturesByModule.get(
                              module.id
                            ) ||
                            [];

                          return (
                            <article
                              key={
                                module.id
                              }
                              className="border border-white/10 bg-[#0a0d0b]/70"
                            >
                              <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-start">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[9px] uppercase tracking-[0.14em] text-[#c7ff39]">
                                      Module{" "}
                                      {
                                        module.position
                                      }
                                    </span>

                                    <span
                                      className={`border px-2 py-0.5 text-[8px] uppercase tracking-[0.12em] ${
                                        module.is_published
                                          ? "border-[#c7ff39]/25 text-[#c7ff39]"
                                          : "border-white/10 text-white/35"
                                      }`}
                                    >
                                      {module.is_published
                                        ? "Published"
                                        : "Draft"}
                                    </span>
                                  </div>

                                  <h3 className="mt-2 text-lg font-medium">
                                    {
                                      module.title
                                    }
                                  </h3>

                                  {module.description && (
                                    <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
                                      {
                                        module.description
                                      }
                                    </p>
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    disabled={
                                      saving
                                    }
                                    onClick={() =>
                                      toggleModulePublished(
                                        module
                                      )
                                    }
                                    className="min-h-9 border border-white/10 px-3 text-[10px] uppercase tracking-[0.11em] text-[#a1a1aa] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39] disabled:opacity-50"
                                  >
                                    {module.is_published
                                      ? "Unpublish"
                                      : "Publish"}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={
                                      saving
                                    }
                                    onClick={() =>
                                      deleteModule(
                                        module
                                      )
                                    }
                                    className="grid h-9 w-9 place-items-center border border-white/10 text-[#a1a1aa] transition hover:border-[#ff6b6b]/30 hover:text-[#ff8b8b] disabled:opacity-50"
                                  >
                                    <Trash2
                                      size={14}
                                    />
                                  </button>
                                </div>
                              </div>

                              {moduleLectures.length >
                              0 ? (
                                <div>
                                  {moduleLectures.map(
                                    (
                                      lecture
                                    ) => (
                                      <div
                                        key={
                                          lecture.id
                                        }
                                        className="flex flex-col justify-between gap-4 border-b border-white/[0.07] px-5 py-4 last:border-b-0 sm:flex-row sm:items-center"
                                      >
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="text-[9px] uppercase tracking-[0.12em] text-white/25">
                                              Lecture{" "}
                                              {
                                                lecture.position
                                              }
                                            </span>

                                            <span
                                              className={`text-[9px] ${
                                                lecture.is_published
                                                  ? "text-[#c7ff39]"
                                                  : "text-white/25"
                                              }`}
                                            >
                                              {lecture.is_published
                                                ? "Published"
                                                : "Draft"}
                                            </span>
                                          </div>

                                          <p className="mt-1 truncate text-sm font-medium">
                                            {
                                              lecture.title
                                            }
                                          </p>

                                          {lecture.estimated_minutes && (
                                            <p className="mt-1 text-xs text-[#a1a1aa]">
                                              {
                                                lecture.estimated_minutes
                                              }{" "}
                                              min
                                            </p>
                                          )}
                                        </div>

                                        <div className="flex shrink-0 gap-2">
                                          <button
                                            type="button"
                                            disabled={
                                              saving
                                            }
                                            onClick={() =>
                                              toggleLecturePublished(
                                                lecture
                                              )
                                            }
                                            className="min-h-9 border border-white/10 px-3 text-[10px] uppercase tracking-[0.11em] text-[#a1a1aa] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39] disabled:opacity-50"
                                          >
                                            {lecture.is_published
                                              ? "Unpublish"
                                              : "Publish"}
                                          </button>

                                          <button
                                            type="button"
                                            disabled={
                                              saving
                                            }
                                            onClick={() =>
                                              deleteLecture(
                                                lecture
                                              )
                                            }
                                            className="grid h-9 w-9 place-items-center border border-white/10 text-[#a1a1aa] transition hover:border-[#ff6b6b]/30 hover:text-[#ff8b8b] disabled:opacity-50"
                                          >
                                            <X
                                              size={14}
                                            />
                                          </button>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              ) : (
                                <div className="px-5 py-5 text-sm text-[#a1a1aa]">
                                  No lectures in this module yet.
                                </div>
                              )}
                            </article>
                          );
                        }
                      )
                    ) : (
                      <div className="border border-white/10 bg-[#0a0d0b]/70 p-7">
                        <Layers3
                          size={20}
                          className="text-white/25"
                        />

                        <h3 className="mt-4 text-lg font-medium">
                          Start with a module.
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
                          Modules organize your course lectures into a clear learning sequence.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="border border-white/10 bg-[#0a0d0b]/70 p-6">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">
                        New module
                      </p>

                      <input
                        value={
                          moduleForm.title
                        }
                        onChange={(
                          event
                        ) =>
                          setModuleForm(
                            (
                              current
                            ) => ({
                              ...current,
                              title:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="Module title"
                        className="mt-4 min-h-11 w-full border border-white/10 bg-white/[0.025] px-3 text-sm outline-none transition focus:border-[#c7ff39]/40"
                      />

                      <textarea
                        value={
                          moduleForm.description
                        }
                        onChange={(
                          event
                        ) =>
                          setModuleForm(
                            (
                              current
                            ) => ({
                              ...current,
                              description:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="Module description (optional)"
                        rows={4}
                        className="mt-3 w-full resize-y border border-white/10 bg-white/[0.025] p-3 text-sm outline-none transition focus:border-[#c7ff39]/40"
                      />

                      <button
                        type="button"
                        disabled={
                          saving
                        }
                        onClick={
                          addModule
                        }
                        className="mt-4 inline-flex min-h-10 items-center gap-2 bg-[#c7ff39] px-4 text-xs font-semibold text-[#071008] disabled:opacity-50"
                      >
                        <Plus
                          size={14}
                        />

                        Add module
                      </button>
                    </div>

                    <div className="border border-white/10 bg-[#0a0d0b]/70 p-6">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">
                        New lecture
                      </p>

                      <select
                        value={
                          lectureForm.module_id
                        }
                        onChange={(
                          event
                        ) =>
                          setLectureForm(
                            (
                              current
                            ) => ({
                              ...current,
                              module_id:
                                event.target.value,
                            })
                          )
                        }
                        className="mt-4 min-h-11 w-full border border-white/10 bg-[#0a0d0b] px-3 text-sm outline-none transition focus:border-[#c7ff39]/40"
                      >
                        <option value="">
                          Select module
                        </option>

                        {modules.map(
                          (module) => (
                            <option
                              key={
                                module.id
                              }
                              value={
                                module.id
                              }
                            >
                              {
                                module.title
                              }
                            </option>
                          )
                        )}
                      </select>

                      <input
                        value={
                          lectureForm.title
                        }
                        onChange={(
                          event
                        ) =>
                          setLectureForm(
                            (
                              current
                            ) => ({
                              ...current,
                              title:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="Lecture title"
                        className="mt-3 min-h-11 w-full border border-white/10 bg-white/[0.025] px-3 text-sm outline-none transition focus:border-[#c7ff39]/40"
                      />

                      <textarea
                        value={
                          lectureForm.content
                        }
                        onChange={(
                          event
                        ) =>
                          setLectureForm(
                            (
                              current
                            ) => ({
                              ...current,
                              content:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="Lecture content / explanation"
                        rows={6}
                        className="mt-3 w-full resize-y border border-white/10 bg-white/[0.025] p-3 text-sm outline-none transition focus:border-[#c7ff39]/40"
                      />

                      <input
                        value={
                          lectureForm.video_url
                        }
                        onChange={(
                          event
                        ) =>
                          setLectureForm(
                            (
                              current
                            ) => ({
                              ...current,
                              video_url:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="Video URL (optional)"
                        className="mt-3 min-h-11 w-full border border-white/10 bg-white/[0.025] px-3 text-sm outline-none transition focus:border-[#c7ff39]/40"
                      />

                      <input
                        type="number"
                        min="1"
                        value={
                          lectureForm.estimated_minutes
                        }
                        onChange={(
                          event
                        ) =>
                          setLectureForm(
                            (
                              current
                            ) => ({
                              ...current,
                              estimated_minutes:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="Estimated minutes"
                        className="mt-3 min-h-11 w-full border border-white/10 bg-white/[0.025] px-3 text-sm outline-none transition focus:border-[#c7ff39]/40"
                      />

                      <button
                        type="button"
                        disabled={
                          saving ||
                          modules.length ===
                            0
                        }
                        onClick={
                          addLecture
                        }
                        className="mt-4 inline-flex min-h-10 items-center gap-2 bg-[#c7ff39] px-4 text-xs font-semibold text-[#071008] disabled:opacity-40"
                      >
                        <Plus
                          size={14}
                        />

                        Add lecture
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* =============================================
                  ASSIGNMENTS
              ============================================= */}

              {activeTab ===
                "assignments" && (
                <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
                  <div className="border border-white/10 bg-[#0a0d0b]/70">
                    <div className="border-b border-white/10 p-6">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">
                        Assignments
                      </p>

                      <h2 className="mt-2 text-2xl font-medium">
                        Course work
                      </h2>
                    </div>

                    {assignments.length > 0 ? (
                      assignments.map((assignment) => (
                        <article
                          key={assignment.id}
                          className="border-b border-white/10 p-5 last:border-b-0"
                        >
                          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                            <div>
                              <div className="flex flex-wrap gap-2">
                                <span
                                  className={`border px-2 py-0.5 text-[8px] uppercase tracking-[0.12em] ${
                                    assignment.is_published
                                      ? "border-[#c7ff39]/25 text-[#c7ff39]"
                                      : "border-white/10 text-white/35"
                                  }`}
                                >
                                  {assignment.is_published
                                    ? "Published"
                                    : "Draft"}
                                </span>

                                <span className="border border-white/10 px-2 py-0.5 text-[8px] uppercase tracking-[0.12em] text-white/35">
                                  {assignment.max_marks} marks
                                </span>

                                <span className="border border-white/10 px-2 py-0.5 text-[8px] uppercase tracking-[0.12em] text-white/35">
                                  {(submissionsByAssignment.get(assignment.id) || []).length} submissions
                                </span>
                              </div>

                              <h3 className="mt-3 text-lg font-medium">
                                {assignment.title}
                              </h3>

                              <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
                                {assignment.instructions}
                              </p>

                              {assignment.due_at && (
                                <p className="mt-3 text-xs text-white/35">
                                  Due {formatDateTime(assignment.due_at)}
                                </p>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                  toggleAssignmentPublished(assignment)
                                }
                                className="min-h-9 border border-white/10 px-3 text-[10px] uppercase tracking-[0.11em] text-[#a1a1aa] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"
                              >
                                {assignment.is_published
                                  ? "Unpublish"
                                  : "Publish"}
                              </button>

                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => deleteAssignment(assignment)}
                                className="grid h-9 w-9 place-items-center border border-white/10 text-[#a1a1aa] transition hover:border-[#ff6b6b]/30 hover:text-[#ff8b8b]"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="p-7 text-sm text-[#a1a1aa]">
                        No assignments yet.
                      </div>
                    )}
                  </div>

                  <div className="border border-white/10 bg-[#0a0d0b]/70 p-6">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">
                      New assignment
                    </p>

                    <input
                      value={assignmentForm.title}
                      onChange={(event) =>
                        setAssignmentForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Assignment title"
                      className="mt-5 min-h-11 w-full border border-white/10 bg-white/[0.025] px-3 text-sm outline-none focus:border-[#c7ff39]/40"
                    />

                    <textarea
                      value={assignmentForm.instructions}
                      onChange={(event) =>
                        setAssignmentForm((current) => ({
                          ...current,
                          instructions: event.target.value,
                        }))
                      }
                      placeholder="Instructions"
                      rows={6}
                      className="mt-3 w-full border border-white/10 bg-white/[0.025] p-3 text-sm outline-none focus:border-[#c7ff39]/40"
                    />

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={assignmentForm.max_marks}
                        onChange={(event) =>
                          setAssignmentForm((current) => ({
                            ...current,
                            max_marks: event.target.value,
                          }))
                        }
                        placeholder="Max marks"
                        className="min-h-11 border border-white/10 bg-white/[0.025] px-3 text-sm outline-none focus:border-[#c7ff39]/40"
                      />

                      <input
                        type="datetime-local"
                        value={assignmentForm.due_at}
                        onChange={(event) =>
                          setAssignmentForm((current) => ({
                            ...current,
                            due_at: event.target.value,
                          }))
                        }
                        className="min-h-11 border border-white/10 bg-white/[0.025] px-3 text-sm outline-none focus:border-[#c7ff39]/40"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={addAssignment}
                      className="mt-4 inline-flex min-h-10 items-center gap-2 bg-[#c7ff39] px-4 text-xs font-semibold text-[#071008] disabled:opacity-50"
                    >
                      <Plus size={14} />
                      Add assignment
                    </button>
                  </div>

                  <div className="border border-white/10 bg-[#0a0d0b]/70 xl:col-span-2">
                    <div className="border-b border-white/10 p-6">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">
                        Learner submissions
                      </p>

                      <h2 className="mt-2 text-2xl font-medium">
                        Review & grade
                      </h2>

                      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#a1a1aa]">
                        Review submitted work, enter marks, and leave feedback for each learner.
                      </p>
                    </div>

                    {assignmentSubmissions.length > 0 ? (
                      assignments.map((assignment) => {
                        const submissionRows =
                          submissionsByAssignment.get(assignment.id) || [];

                        if (submissionRows.length === 0) {
                          return null;
                        }

                        return (
                          <div
                            key={`submissions-${assignment.id}`}
                            className="border-b border-white/10 last:border-b-0"
                          >
                            <div className="bg-white/[0.015] px-6 py-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium">
                                    {assignment.title}
                                  </p>

                                  <p className="mt-1 text-xs text-white/35">
                                    Maximum {assignment.max_marks} marks · {submissionRows.length} submission{submissionRows.length === 1 ? "" : "s"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {submissionRows.map((submission) => {
                              const enrollment =
                                learnerEnrollmentByLearnerId.get(
                                  submission.learner_id
                                );

                              const learner = enrollment?.learner;

                              const draft = gradeDrafts[submission.id] || {
                                grade:
                                  submission.grade === null ||
                                  submission.grade === undefined
                                    ? ""
                                    : String(submission.grade),
                                feedback: submission.feedback || "",
                              };

                              return (
                                <article
                                  key={submission.id}
                                  className="border-t border-white/[0.07] p-6 first:border-t-0"
                                >
                                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-medium">
                                          {learner?.full_name ||
                                            learner?.username ||
                                            "Learner"}
                                        </p>

                                        <span
                                          className={`border px-2 py-0.5 text-[8px] uppercase tracking-[0.12em] ${getStatusClasses(
                                            submission.status
                                          )}`}
                                        >
                                          {submission.status}
                                        </span>
                                      </div>

                                      <p className="mt-1 text-xs text-white/35">
                                        @{learner?.username || "learner"} · Submitted {formatDateTime(submission.submitted_at)}
                                      </p>
                                    </div>

                                    {submission.status === "Graded" && (
                                      <div className="border border-[#c7ff39]/20 bg-[#c7ff39]/[0.04] px-4 py-3 text-center">
                                        <p className="text-[8px] uppercase tracking-[0.12em] text-white/35">
                                          Current grade
                                        </p>

                                        <p className="mt-1 text-lg font-medium text-[#c7ff39]">
                                          {submission.grade}/{assignment.max_marks}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {submission.submission_text && (
                                    <div className="mt-5 border border-white/10 bg-white/[0.02] p-4">
                                      <p className="text-[9px] uppercase tracking-[0.13em] text-[#c7ff39]">
                                        Submission
                                      </p>

                                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#a1a1aa]">
                                        {submission.submission_text}
                                      </p>
                                    </div>
                                  )}

                                  {submission.attachment_url && (
                                    <a
                                      href={submission.attachment_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-4 inline-flex text-xs text-[#c7ff39] hover:underline"
                                    >
                                      Open learner attachment
                                    </a>
                                  )}

                                  <div className="mt-5 grid gap-3 lg:grid-cols-[180px_1fr_auto] lg:items-end">
                                    <label>
                                      <span className="mb-2 block text-[9px] uppercase tracking-[0.12em] text-white/35">
                                        Marks
                                      </span>

                                      <input
                                        type="number"
                                        min="0"
                                        max={assignment.max_marks}
                                        step="0.01"
                                        value={draft.grade}
                                        onChange={(event) =>
                                          setGradeDrafts((current) => ({
                                            ...current,
                                            [submission.id]: {
                                              ...draft,
                                              grade: event.target.value,
                                            },
                                          }))
                                        }
                                        className="min-h-11 w-full border border-white/10 bg-white/[0.025] px-3 text-sm outline-none focus:border-[#c7ff39]/40"
                                      />
                                    </label>

                                    <label>
                                      <span className="mb-2 block text-[9px] uppercase tracking-[0.12em] text-white/35">
                                        Feedback
                                      </span>

                                      <textarea
                                        rows={3}
                                        value={draft.feedback}
                                        onChange={(event) =>
                                          setGradeDrafts((current) => ({
                                            ...current,
                                            [submission.id]: {
                                              ...draft,
                                              feedback: event.target.value,
                                            },
                                          }))
                                        }
                                        placeholder="Feedback for the learner"
                                        className="w-full border border-white/10 bg-white/[0.025] p-3 text-sm outline-none focus:border-[#c7ff39]/40"
                                      />
                                    </label>

                                    <button
                                      type="button"
                                      disabled={saving}
                                      onClick={() =>
                                        gradeAssignmentSubmission(
                                          submission,
                                          assignment
                                        )
                                      }
                                      className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#c7ff39] px-5 text-xs font-semibold text-[#071008] disabled:opacity-50"
                                    >
                                      <Save size={14} />
                                      {submission.status === "Graded"
                                        ? "Update grade"
                                        : "Grade"}
                                    </button>
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-7 text-sm text-[#a1a1aa]">
                        No learner submissions yet.
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* =============================================
                  NOTES
              ============================================= */}

              {activeTab ===
                "notes" && (
                <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
                  <div className="border border-white/10 bg-[#0a0d0b]/70">
                    <div className="border-b border-white/10 p-6">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">
                        Notes & resources
                      </p>
                    </div>

                    {notes.length >
                    0 ? (
                      notes.map(
                        (note) => (
                          <article
                            key={
                              note.id
                            }
                            className="border-b border-white/10 p-5 last:border-b-0"
                          >
                            <div className="flex flex-col justify-between gap-4 sm:flex-row">
                              <div>
                                <span
                                  className={`border px-2 py-0.5 text-[8px] uppercase tracking-[0.12em] ${
                                    note.is_published
                                      ? "border-[#c7ff39]/25 text-[#c7ff39]"
                                      : "border-white/10 text-white/35"
                                  }`}
                                >
                                  {note.is_published
                                    ? "Published"
                                    : "Draft"}
                                </span>

                                <h3 className="mt-3 text-lg font-medium">
                                  {
                                    note.title
                                  }
                                </h3>

                                {note.content && (
                                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#a1a1aa]">
                                    {
                                      note.content
                                    }
                                  </p>
                                )}

                                {note.resource_url && (
                                  <a
                                    href={
                                      note.resource_url
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-3 inline-flex text-xs text-[#c7ff39]"
                                  >
                                    Open resource
                                  </a>
                                )}
                              </div>

                              <div className="flex shrink-0 gap-2">
                                <button
                                  type="button"
                                  disabled={
                                    saving
                                  }
                                  onClick={() =>
                                    toggleNotePublished(
                                      note
                                    )
                                  }
                                  className="min-h-9 border border-white/10 px-3 text-[10px] uppercase tracking-[0.11em] text-[#a1a1aa] hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"
                                >
                                  {note.is_published
                                    ? "Unpublish"
                                    : "Publish"}
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    saving
                                  }
                                  onClick={() =>
                                    deleteNote(
                                      note
                                    )
                                  }
                                  className="grid h-9 w-9 place-items-center border border-white/10 text-[#a1a1aa] hover:border-[#ff6b6b]/30 hover:text-[#ff8b8b]"
                                >
                                  <Trash2
                                    size={14}
                                  />
                                </button>
                              </div>
                            </div>
                          </article>
                        )
                      )
                    ) : (
                      <div className="p-7 text-sm text-[#a1a1aa]">
                        No notes or resources yet.
                      </div>
                    )}
                  </div>

                  <div className="border border-white/10 bg-[#0a0d0b]/70 p-6">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">
                      Add note
                    </p>

                    <input
                      value={
                        noteForm.title
                      }
                      onChange={(
                        event
                      ) =>
                        setNoteForm(
                          (
                            current
                          ) => ({
                            ...current,
                            title:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="Note title"
                      className="mt-4 min-h-11 w-full border border-white/10 bg-white/[0.025] px-3 text-sm outline-none focus:border-[#c7ff39]/40"
                    />

                    <textarea
                      value={
                        noteForm.content
                      }
                      onChange={(
                        event
                      ) =>
                        setNoteForm(
                          (
                            current
                          ) => ({
                            ...current,
                            content:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="Course note / resource description"
                      rows={7}
                      className="mt-3 w-full border border-white/10 bg-white/[0.025] p-3 text-sm outline-none focus:border-[#c7ff39]/40"
                    />

                    <input
                      value={
                        noteForm.resource_url
                      }
                      onChange={(
                        event
                      ) =>
                        setNoteForm(
                          (
                            current
                          ) => ({
                            ...current,
                            resource_url:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="Resource URL (optional)"
                      className="mt-3 min-h-11 w-full border border-white/10 bg-white/[0.025] px-3 text-sm outline-none focus:border-[#c7ff39]/40"
                    />

                    <button
                      type="button"
                      disabled={
                        saving
                      }
                      onClick={
                        addNote
                      }
                      className="mt-4 inline-flex min-h-10 items-center gap-2 bg-[#c7ff39] px-4 text-xs font-semibold text-[#071008] disabled:opacity-50"
                    >
                      <Plus
                        size={14}
                      />

                      Add note
                    </button>
                  </div>
                </section>
              )}

              {/* =============================================
                  QUIZ
              ============================================= */}

              {activeTab ===
                "quiz" && (
                <section className="mt-8 space-y-6">
                  <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
                    <div className="space-y-5">
                      {quizzes.length >
                      0 ? (
                        quizzes.map(
                          (
                            quiz
                          ) => {
                            const questions =
                              quizQuestions.filter(
                                (
                                  item
                                ) =>
                                  item.quiz_id ===
                                  quiz.id
                              );

                            const totalQuestionMarks =
                              Number(
                                questionMarksByQuiz.get(
                                  quiz.id
                                ) || 0
                              );

                            return (
                              <article
                                key={
                                  quiz.id
                                }
                                className="border border-white/10 bg-[#0a0d0b]/70"
                              >
                                <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-start">
                                  <div>
                                    <div className="flex flex-wrap gap-2">
                                      <span
                                        className={`border px-2 py-0.5 text-[8px] uppercase tracking-[0.12em] ${
                                          quiz.is_published
                                            ? "border-[#c7ff39]/25 text-[#c7ff39]"
                                            : "border-white/10 text-white/35"
                                        }`}
                                      >
                                        {quiz.is_published
                                          ? "Published"
                                          : "Draft"}
                                      </span>

                                      <span className="border border-white/10 px-2 py-0.5 text-[8px] uppercase tracking-[0.12em] text-white/35">
                                        Pass{" "}
                                        {
                                          quiz.passing_marks
                                        }
                                        /100
                                      </span>
                                    </div>

                                    <h3 className="mt-3 text-xl font-medium">
                                      {
                                        quiz.title
                                      }
                                    </h3>

                                    {quiz.description && (
                                      <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
                                        {
                                          quiz.description
                                        }
                                      </p>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    disabled={
                                      saving
                                    }
                                    onClick={() =>
                                      toggleQuizPublished(
                                        quiz
                                      )
                                    }
                                    className="min-h-9 border border-white/10 px-3 text-[10px] uppercase tracking-[0.11em] text-[#a1a1aa] hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"
                                  >
                                    {quiz.is_published
                                      ? "Unpublish"
                                      : "Publish"}
                                  </button>
                                </div>

                                <div className="border-b border-white/10 px-6 py-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-[#a1a1aa]">
                                      Question marks
                                    </span>

                                    <span
                                      className={`text-sm font-medium ${
                                        totalQuestionMarks ===
                                        100
                                          ? "text-[#c7ff39]"
                                          : "text-[#ffca80]"
                                      }`}
                                    >
                                      {
                                        totalQuestionMarks
                                      }
                                      /100
                                    </span>
                                  </div>
                                </div>

                                {questions.length >
                                0 ? (
                                  questions.map(
                                    (
                                      question,
                                      index
                                    ) => (
                                      <div
                                        key={
                                          question.id
                                        }
                                        className="border-b border-white/[0.07] p-5 last:border-b-0"
                                      >
                                        <div className="flex justify-between gap-4">
                                          <div>
                                            <p className="text-[9px] uppercase tracking-[0.12em] text-white/30">
                                              Question{" "}
                                              {
                                                index +
                                                1
                                              }{" "}
                                              ·{" "}
                                              {
                                                question.marks
                                              }{" "}
                                              marks
                                            </p>

                                            <p className="mt-2 text-sm font-medium">
                                              {
                                                question.question_text
                                              }
                                            </p>

                                            <div className="mt-3 grid gap-2 text-xs text-[#a1a1aa] sm:grid-cols-2">
                                              <span>
                                                A.{" "}
                                                {
                                                  question.option_a
                                                }
                                              </span>
                                              <span>
                                                B.{" "}
                                                {
                                                  question.option_b
                                                }
                                              </span>
                                              <span>
                                                C.{" "}
                                                {
                                                  question.option_c
                                                }
                                              </span>
                                              <span>
                                                D.{" "}
                                                {
                                                  question.option_d
                                                }
                                              </span>
                                            </div>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              deleteQuestion(
                                                question
                                              )
                                            }
                                            className="grid h-9 w-9 shrink-0 place-items-center border border-white/10 text-[#a1a1aa] hover:border-[#ff6b6b]/30 hover:text-[#ff8b8b]"
                                          >
                                            <Trash2
                                              size={14}
                                            />
                                          </button>
                                        </div>
                                      </div>
                                    )
                                  )
                                ) : (
                                  <div className="p-6 text-sm text-[#a1a1aa]">
                                    No questions yet.
                                  </div>
                                )}
                              </article>
                            );
                          }
                        )
                      ) : (
                        <div className="border border-white/10 bg-[#0a0d0b]/70 p-7 text-sm text-[#a1a1aa]">
                          Create the final quiz first.
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="border border-white/10 bg-[#0a0d0b]/70 p-6">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">
                          New quiz
                        </p>

                        <input
                          value={
                            quizForm.title
                          }
                          onChange={(
                            event
                          ) =>
                            setQuizForm(
                              (
                                current
                              ) => ({
                                ...current,
                                title:
                                  event.target.value,
                              })
                            )
                          }
                          placeholder="Quiz title"
                          className="mt-4 min-h-11 w-full border border-white/10 bg-white/[0.025] px-3 text-sm outline-none focus:border-[#c7ff39]/40"
                        />

                        <textarea
                          value={
                            quizForm.description
                          }
                          onChange={(
                            event
                          ) =>
                            setQuizForm(
                              (
                                current
                              ) => ({
                                ...current,
                                description:
                                  event.target.value,
                              })
                            )
                          }
                          placeholder="Quiz description"
                          rows={4}
                          className="mt-3 w-full border border-white/10 bg-white/[0.025] p-3 text-sm outline-none focus:border-[#c7ff39]/40"
                        />

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={
                              quizForm.passing_marks
                            }
                            onChange={(
                              event
                            ) =>
                              setQuizForm(
                                (
                                  current
                                ) => ({
                                  ...current,
                                  passing_marks:
                                    event.target.value,
                                })
                              )
                            }
                            placeholder="Passing marks"
                            className="min-h-11 border border-white/10 bg-white/[0.025] px-3 text-sm outline-none focus:border-[#c7ff39]/40"
                          />

                          <input
                            type="number"
                            min="1"
                            value={
                              quizForm.max_attempts
                            }
                            onChange={(
                              event
                            ) =>
                              setQuizForm(
                                (
                                  current
                                ) => ({
                                  ...current,
                                  max_attempts:
                                    event.target.value,
                                })
                              )
                            }
                            placeholder="Attempts (blank = unlimited)"
                            className="min-h-11 border border-white/10 bg-white/[0.025] px-3 text-sm outline-none focus:border-[#c7ff39]/40"
                          />
                        </div>

                        <button
                          type="button"
                          disabled={
                            saving
                          }
                          onClick={
                            addQuiz
                          }
                          className="mt-4 inline-flex min-h-10 items-center gap-2 bg-[#c7ff39] px-4 text-xs font-semibold text-[#071008] disabled:opacity-50"
                        >
                          <Plus
                            size={14}
                          />

                          Create quiz
                        </button>
                      </div>

                      <div className="border border-white/10 bg-[#0a0d0b]/70 p-6">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">
                          Add question
                        </p>

                        <select
                          value={
                            questionForm.quiz_id
                          }
                          onChange={(
                            event
                          ) =>
                            setQuestionForm(
                              (
                                current
                              ) => ({
                                ...current,
                                quiz_id:
                                  event.target.value,
                              })
                            )
                          }
                          className="mt-4 min-h-11 w-full border border-white/10 bg-[#0a0d0b] px-3 text-sm outline-none focus:border-[#c7ff39]/40"
                        >
                          <option value="">
                            Select quiz
                          </option>

                          {quizzes.map(
                            (quiz) => (
                              <option
                                key={
                                  quiz.id
                                }
                                value={
                                  quiz.id
                                }
                              >
                                {
                                  quiz.title
                                }
                              </option>
                            )
                          )}
                        </select>

                        <textarea
                          value={
                            questionForm.question_text
                          }
                          onChange={(
                            event
                          ) =>
                            setQuestionForm(
                              (
                                current
                              ) => ({
                                ...current,
                                question_text:
                                  event.target.value,
                              })
                            )
                          }
                          placeholder="Question"
                          rows={4}
                          className="mt-3 w-full border border-white/10 bg-white/[0.025] p-3 text-sm outline-none focus:border-[#c7ff39]/40"
                        />

                        {[
                          [
                            "option_a",
                            "Option A",
                          ],
                          [
                            "option_b",
                            "Option B",
                          ],
                          [
                            "option_c",
                            "Option C",
                          ],
                          [
                            "option_d",
                            "Option D",
                          ],
                        ].map(
                          ([
                            field,
                            placeholder,
                          ]) => (
                            <input
                              key={
                                field
                              }
                              value={
                                questionForm[
                                  field
                                ]
                              }
                              onChange={(
                                event
                              ) =>
                                setQuestionForm(
                                  (
                                    current
                                  ) => ({
                                    ...current,
                                    [field]:
                                      event.target.value,
                                  })
                                )
                              }
                              placeholder={
                                placeholder
                              }
                              className="mt-3 min-h-11 w-full border border-white/10 bg-white/[0.025] px-3 text-sm outline-none focus:border-[#c7ff39]/40"
                            />
                          )
                        )}

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <select
                            value={
                              questionForm.correct_option
                            }
                            onChange={(
                              event
                            ) =>
                              setQuestionForm(
                                (
                                  current
                                ) => ({
                                  ...current,
                                  correct_option:
                                    event.target.value,
                                })
                              )
                            }
                            className="min-h-11 border border-white/10 bg-[#0a0d0b] px-3 text-sm outline-none focus:border-[#c7ff39]/40"
                          >
                            <option value="A">
                              Correct: A
                            </option>
                            <option value="B">
                              Correct: B
                            </option>
                            <option value="C">
                              Correct: C
                            </option>
                            <option value="D">
                              Correct: D
                            </option>
                          </select>

                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={
                              questionForm.marks
                            }
                            onChange={(
                              event
                            ) =>
                              setQuestionForm(
                                (
                                  current
                                ) => ({
                                  ...current,
                                  marks:
                                    event.target.value,
                                })
                              )
                            }
                            placeholder="Marks"
                            className="min-h-11 border border-white/10 bg-white/[0.025] px-3 text-sm outline-none focus:border-[#c7ff39]/40"
                          />
                        </div>

                        <button
                          type="button"
                          disabled={
                            saving ||
                            quizzes.length ===
                              0
                          }
                          onClick={
                            addQuestion
                          }
                          className="mt-4 inline-flex min-h-10 items-center gap-2 bg-[#c7ff39] px-4 text-xs font-semibold text-[#071008] disabled:opacity-40"
                        >
                          <Plus
                            size={14}
                          />

                          Add question
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* =============================================
                  LEARNERS
              ============================================= */}

              {activeTab ===
                "learners" && (
                <section className="mt-8 border border-white/10 bg-[#0a0d0b]/70">
                  <div className="border-b border-white/10 p-6">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">
                      Enrolled learners
                    </p>

                    <h2 className="mt-2 text-2xl font-medium">
                      {
                        learners.length
                      }{" "}
                      learner
                      {learners.length ===
                      1
                        ? ""
                        : "s"}
                    </h2>
                  </div>

                  {learners.length >
                  0 ? (
                    learners.map(
                      (
                        enrollment
                      ) => (
                        <div
                          key={
                            enrollment.id
                          }
                          className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 last:border-b-0 sm:flex-row sm:items-center"
                        >
                          <div className="flex items-center gap-3">
                            {enrollment
                              .learner
                              ?.avatar_url ? (
                              <img
                                src={
                                  enrollment
                                    .learner
                                    .avatar_url
                                }
                                alt=""
                                className="h-10 w-10 object-cover"
                              />
                            ) : (
                              <div className="grid h-10 w-10 place-items-center border border-white/10 text-xs font-semibold text-[#c7ff39]">
                                {String(
                                  enrollment
                                    .learner
                                    ?.full_name ||
                                    enrollment
                                      .learner
                                      ?.username ||
                                    "L"
                                )
                                  .slice(
                                    0,
                                    1
                                  )
                                  .toUpperCase()}
                              </div>
                            )}

                            <div>
                              <p className="text-sm font-medium">
                                {enrollment
                                  .learner
                                  ?.full_name ||
                                  enrollment
                                    .learner
                                    ?.username ||
                                  "Learner"}
                              </p>

                              <p className="mt-1 text-xs text-[#a1a1aa]">
                                @
                                {enrollment
                                  .learner
                                  ?.username ||
                                  "learner"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`border px-2 py-1 text-[9px] uppercase tracking-[0.13em] ${getStatusClasses(
                                enrollment.status
                              )}`}
                            >
                              {
                                enrollment.status
                              }
                            </span>

                            <span className="text-xs text-white/35">
                              Approved{" "}
                              {formatDate(
                                enrollment.approved_at
                              )}
                            </span>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <div className="p-7 text-sm text-[#a1a1aa]">
                      No approved learners yet.
                    </div>
                  )}
                </section>
              )}

              {/* =============================================
                  COMPLETION REQUESTS
              ============================================= */}

              {activeTab ===
                "completion" && (
                <section className="mt-8 border border-white/10 bg-[#0a0d0b]/70">
                  <div className="border-b border-white/10 p-6">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">
                      Course completion
                    </p>

                    <h2 className="mt-2 text-2xl font-medium">
                      Completion requests
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[#a1a1aa]">
                      Review each learner's lecture progress, assignment grades, and final quiz results before approving completion.
                    </p>
                  </div>

                  {completionRequests.length > 0 ? (
                    completionRequests.map((request) => {
                      const enrollment = request.enrollment;
                      const learner = enrollment?.learner;
                      const learnerId = enrollment?.learner_id;

                      const completedLectureCount =
                        lectureProgress.filter(
                          (item) =>
                            item.learner_id === learnerId &&
                            item.completed === true &&
                            publishedLectureIds.includes(item.lecture_id)
                        ).length;

                      const publishedAssignments = assignments.filter(
                        (assignment) => assignment.is_published
                      );

                      const learnerAssignmentRows = publishedAssignments.map(
                        (assignment) => ({
                          assignment,
                          submission: assignmentSubmissions.find(
                            (submission) =>
                              submission.assignment_id === assignment.id &&
                              submission.learner_id === learnerId
                          ),
                        })
                      );

                      const gradedAssignmentCount =
                        learnerAssignmentRows.filter(
                          (item) => item.submission?.status === "Graded"
                        ).length;

                      const publishedQuizzes = quizzes.filter(
                        (quiz) => quiz.is_published
                      );

                      const quizReviewRows = publishedQuizzes.map((quiz) => {
                        const rows = quizAttempts.filter(
                          (attempt) =>
                            attempt.quiz_id === quiz.id &&
                            attempt.enrollment_id === enrollment?.id
                        );

                        const best = rows.reduce(
                          (bestAttempt, current) =>
                            !bestAttempt ||
                            Number(current.score) >
                              Number(bestAttempt.score)
                              ? current
                              : bestAttempt,
                          null
                        );

                        const requiredScore = Math.max(
                          Number(quiz.passing_marks || 0),
                          80
                        );

                        return {
                          quiz,
                          best,
                          requiredScore,
                          passed:
                            best !== null &&
                            Number(best.score) >= requiredScore,
                        };
                      });

                      const note =
                        completionReviewNotes[request.id] || "";

                      return (
                        <article
                          key={request.id}
                          className="border-b border-white/10 p-6 last:border-b-0"
                        >
                          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                            <div>
                              <div className="flex flex-wrap items-center gap-3">
                                <p className="text-lg font-medium">
                                  {learner?.full_name ||
                                    learner?.username ||
                                    "Learner"}
                                </p>

                                <span
                                  className={`border px-2 py-1 text-[9px] uppercase tracking-[0.13em] ${getStatusClasses(
                                    request.status
                                  )}`}
                                >
                                  {request.status}
                                </span>
                              </div>

                              <p className="mt-1 text-xs text-[#a1a1aa]">
                                @{learner?.username || "learner"} · Requested {formatDateTime(request.requested_at)}
                              </p>

                              {request.learner_note && (
                                <div className="mt-4 max-w-3xl border border-white/10 bg-white/[0.02] p-4">
                                  <p className="text-[9px] uppercase tracking-[0.13em] text-[#c7ff39]">
                                    Learner note
                                  </p>

                                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#a1a1aa]">
                                    {request.learner_note}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="grid min-w-[260px] grid-cols-3 gap-2">
                              <div className="border border-white/10 p-3 text-center">
                                <p className="text-[8px] uppercase tracking-[0.11em] text-white/30">
                                  Lectures
                                </p>
                                <p className="mt-1 text-sm font-medium">
                                  {completedLectureCount}/{publishedLectureIds.length}
                                </p>
                              </div>

                              <div className="border border-white/10 p-3 text-center">
                                <p className="text-[8px] uppercase tracking-[0.11em] text-white/30">
                                  Graded
                                </p>
                                <p className="mt-1 text-sm font-medium">
                                  {gradedAssignmentCount}/{publishedAssignments.length}
                                </p>
                              </div>

                              <div className="border border-white/10 p-3 text-center">
                                <p className="text-[8px] uppercase tracking-[0.11em] text-white/30">
                                  Quizzes
                                </p>
                                <p className="mt-1 text-sm font-medium">
                                  {quizReviewRows.filter((item) => item.passed).length}/{publishedQuizzes.length}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 grid gap-5 xl:grid-cols-2">
                            <div className="border border-white/10">
                              <div className="border-b border-white/10 px-4 py-3">
                                <p className="text-[9px] uppercase tracking-[0.13em] text-[#c7ff39]">
                                  Assignment grades
                                </p>
                              </div>

                              {learnerAssignmentRows.length > 0 ? (
                                learnerAssignmentRows.map(
                                  ({ assignment, submission }) => (
                                    <div
                                      key={assignment.id}
                                      className="flex flex-col justify-between gap-2 border-b border-white/[0.07] px-4 py-3 last:border-b-0 sm:flex-row sm:items-center"
                                    >
                                      <div>
                                        <p className="text-sm">
                                          {assignment.title}
                                        </p>
                                        <p className="mt-1 text-[10px] text-white/35">
                                          {submission?.status || "Not submitted"}
                                        </p>
                                      </div>

                                      <p
                                        className={`text-sm font-medium ${
                                          submission?.status === "Graded"
                                            ? "text-[#c7ff39]"
                                            : "text-white/30"
                                        }`}
                                      >
                                        {submission?.status === "Graded"
                                          ? `${submission.grade}/${assignment.max_marks}`
                                          : "—"}
                                      </p>
                                    </div>
                                  )
                                )
                              ) : (
                                <div className="p-4 text-xs text-[#a1a1aa]">
                                  No published assignments.
                                </div>
                              )}
                            </div>

                            <div className="border border-white/10">
                              <div className="border-b border-white/10 px-4 py-3">
                                <p className="text-[9px] uppercase tracking-[0.13em] text-[#c7ff39]">
                                  Final quiz results
                                </p>
                              </div>

                              {quizReviewRows.length > 0 ? (
                                quizReviewRows.map((item) => (
                                  <div
                                    key={item.quiz.id}
                                    className="flex flex-col justify-between gap-2 border-b border-white/[0.07] px-4 py-3 last:border-b-0 sm:flex-row sm:items-center"
                                  >
                                    <div>
                                      <p className="text-sm">
                                        {item.quiz.title}
                                      </p>
                                      <p className="mt-1 text-[10px] text-white/35">
                                        Required {item.requiredScore}/100
                                      </p>
                                    </div>

                                    <div className="text-right">
                                      <p
                                        className={`text-sm font-medium ${
                                          item.passed
                                            ? "text-[#c7ff39]"
                                            : "text-[#ff8b8b]"
                                        }`}
                                      >
                                        {item.best
                                          ? `${item.best.score}/100`
                                          : "No attempt"}
                                      </p>

                                      <p className="mt-1 text-[9px] uppercase tracking-[0.11em] text-white/30">
                                        {item.passed ? "Passed" : "Not passed"}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-4 text-xs text-[#a1a1aa]">
                                  No published final quiz.
                                </div>
                              )}
                            </div>
                          </div>

                          {request.status === "Pending" ? (
                            <div className="mt-6 border-t border-white/10 pt-5">
                              <label>
                                <span className="mb-2 block text-[9px] uppercase tracking-[0.13em] text-white/35">
                                  Instructor note
                                </span>

                                <textarea
                                  rows={4}
                                  value={note}
                                  onChange={(event) =>
                                    setCompletionReviewNotes((current) => ({
                                      ...current,
                                      [request.id]: event.target.value,
                                    }))
                                  }
                                  placeholder="Optional for approval. Required when rejecting."
                                  className="w-full border border-white/10 bg-white/[0.025] p-3 text-sm outline-none focus:border-[#c7ff39]/40"
                                />
                              </label>

                              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() =>
                                    reviewCompletionRequest(
                                      request,
                                      "Rejected"
                                    )
                                  }
                                  className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#ff6b6b]/30 px-5 text-xs font-semibold text-[#ff8b8b] transition hover:bg-[#ff6b6b]/[0.05] disabled:opacity-50"
                                >
                                  <X size={14} />
                                  Reject
                                </button>

                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() =>
                                    reviewCompletionRequest(
                                      request,
                                      "Approved"
                                    )
                                  }
                                  className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#c7ff39] px-5 text-xs font-semibold text-[#071008] disabled:opacity-50"
                                >
                                  <CheckCircle2 size={14} />
                                  Approve & issue certificate
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-6 border-t border-white/10 pt-5">
                              <p className="text-xs text-white/35">
                                Reviewed {formatDateTime(request.reviewed_at)}
                              </p>

                              {request.instructor_note && (
                                <div className="mt-3 border border-white/10 bg-white/[0.02] p-4">
                                  <p className="text-[9px] uppercase tracking-[0.13em] text-[#c7ff39]">
                                    Instructor note
                                  </p>

                                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#a1a1aa]">
                                    {request.instructor_note}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })
                  ) : (
                    <div className="p-7 text-sm text-[#a1a1aa]">
                      No completion requests yet.
                    </div>
                  )}
                </section>
              )}
            </>
          )}

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
      </div>
    </main>
  );
}
