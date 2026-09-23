import {
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  Repeat2,
  Search,
  Users,
} from "lucide-react";

export default function QuickActions({ role, navigate, onFindMentor }) {
  const actions =
    role === "learner"
      ? [
          {
            label: "Find a mentor",
            description: "Discover people who can teach what you want to learn.",
            icon: Search,
            onClick: onFindMentor,
          },
          {
            label: "Explore skills",
            description: "Update or expand the skills you want to learn.",
            icon: BookOpen,
            onClick: () => navigate("/profile/edit?tab=learning"),
          },
          {
            label: "Teach something",
            description: "Optional: add a skill and start earning SS Credits.",
            icon: GraduationCap,
            onClick: () => navigate("/profile/edit?tab=teaching"),
          },
        ]
      : role === "mentor"
      ? [
          {
            label: "Teaching requests",
            description: "Review learners looking for the skills you teach.",
            icon: Users,
            onClick: () => navigate("/mentorship-requests"),
          },
          {
            label: "Manage teaching",
            description: "Update your teaching skills and experience.",
            icon: GraduationCap,
            onClick: () => navigate("/profile/edit?tab=teaching"),
          },
        ]
      : [
          {
            label: "Find a swap",
            description: "Discover complementary two-way skill exchanges.",
            icon: Repeat2,
            onClick: () => navigate("/swaps"),
          },
          {
            label: "Find a mentor",
            description: "Explore mentors for your learning goals.",
            icon: Search,
            onClick: onFindMentor,
          },
          {
            label: "Manage skills",
            description: "Update both learning and teaching skills.",
            icon: GraduationCap,
            onClick: () => navigate("/profile/edit?tab=learning"),
          },
        ];

  return (
    <section className="mt-6">
      <div className="mb-3">
        <p className="text-[10px] uppercase tracking-[0.17em] text-[#a1a1aa]">
          Quick actions
        </p>
        <h2 className="mt-1 text-xl font-medium tracking-[-0.03em]">
          What do you want to do?
        </h2>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="group flex min-h-[116px] flex-col justify-between border border-white/10 bg-[#0a0d0b]/65 p-4 text-left transition hover:border-[#c7ff39]/30 hover:bg-[#c7ff39]/[0.025] focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
            >
              <div className="flex items-start justify-between">
                <Icon size={20} strokeWidth={1.5} className="text-[#c7ff39]" />
                <ArrowUpRight
                  size={16}
                  strokeWidth={1.5}
                  className="text-white/25 transition group-hover:text-[#c7ff39]"
                />
              </div>

              <div className="mt-7">
                <h3 className="text-sm font-medium">{action.label}</h3>
                <p className="mt-1 text-xs leading-5 text-[#a1a1aa]">
                  {action.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
