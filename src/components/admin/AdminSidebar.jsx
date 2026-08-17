import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Layers,
  HeartHandshake,
  Calendar,
  GraduationCap,
  Coins,
  ArrowRightLeft,
  MessageSquareWarning,
  Star,
  Image as ImageIcon,
  BarChart3,
  ShieldCheck,
  Settings
} from "lucide-react";

export default function AdminSidebar() {
  const navGroups = [
    {
      label: "OVERVIEW",
      items: [
        { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
        { name: "Analytics", path: "/admin/analytics", icon: BarChart3 },
      ],
    },
    {
      label: "MANAGEMENT",
      items: [
        { name: "Users", path: "/admin/users", icon: Users },
        { name: "Mentorship", path: "/admin/mentorship", icon: HeartHandshake },
        { name: "Sessions", path: "/admin/sessions", icon: Calendar },
        { name: "Courses", path: "/admin/courses", icon: GraduationCap },
      ],
    },
    {
      label: "PLATFORM",
      items: [
        { name: "Skills", path: "/admin/skills", icon: Briefcase },
        { name: "Categories", path: "/admin/categories", icon: Layers },
        { name: "SS Credits", path: "/admin/credits", icon: Coins },
        { name: "Transactions", path: "/admin/transactions", icon: ArrowRightLeft },
      ],
    },
    {
      label: "SYSTEM",
      items: [
        { name: "Reports", path: "/admin/reports", icon: MessageSquareWarning },
        { name: "Reviews", path: "/admin/reviews", icon: Star },
        { name: "Media", path: "/admin/media", icon: ImageIcon },
        { name: "Admin Management", path: "/admin/management", icon: ShieldCheck },
        { name: "Settings", path: "/admin/settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 w-[240px] border-r border-white/10 bg-[#060807] overflow-y-auto">
      {/* Branding */}
      <div className="flex h-16 items-center px-6 border-b border-white/10">
        <span className="font-bold tracking-tight text-white flex items-center gap-2">
          SKILLSWAP+ <span className="text-[#c7ff39] text-[10px] uppercase tracking-[0.16em] px-1.5 py-0.5 border border-[#c7ff39]/25 rounded bg-[#c7ff39]/10">Admin</span>
        </span>
      </div>

      {/* Navigation */}
      <div className="py-6 px-3 space-y-8">
        {navGroups.map((group) => (
          <div key={group.label}>
            <h3 className="px-3 mb-3 text-[10px] font-semibold text-[#a1a1aa] uppercase tracking-[0.16em]">
              {group.label}
            </h3>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.path}
                    end={item.path === "/admin"}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                        isActive
                          ? "bg-[#c7ff39]/[0.06] text-[#c7ff39] relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-1 before:bg-[#c7ff39] before:rounded-r-full"
                          : "text-[#a1a1aa] hover:bg-white/[0.03] hover:text-[#f2f4ef]"
                      }`
                    }
                  >
                    <item.icon className="h-[18px] w-[18px] stroke-[1.5]" />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
