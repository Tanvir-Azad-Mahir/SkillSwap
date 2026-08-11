import { BookOpen, CheckCircle2, Clock3, Coins } from "lucide-react";

export default function DashboardStats({
  takenCourses = 0,
  finishedCourses = 0,
  upcomingSessions = 0,
  credits = 0,
}) {
  const items = [
    {
      label: "Taken courses",
      value: takenCourses,
      icon: BookOpen,
    },
    {
      label: "Finished courses",
      value: finishedCourses,
      icon: CheckCircle2,
    },
    {
      label: "Upcoming sessions",
      value: upcomingSessions,
      icon: Clock3,
    },
    {
      label: "SS Credits",
      value: credits,
      icon: Coins,
    },
  ];

  return (
    <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="border border-white/10 bg-[#0a0d0b]/65 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-[#a1a1aa]">
                  {item.label}
                </p>

                <p className="mt-4 text-3xl font-medium tracking-[-0.04em]">
                  {item.value}
                </p>
              </div>

              <div className="grid h-10 w-10 place-items-center border border-white/10 text-[#c7ff39]">
                <Icon size={18} strokeWidth={1.4} />
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
