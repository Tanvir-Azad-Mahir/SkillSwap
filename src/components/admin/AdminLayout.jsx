import {
  LogOut,
  LayoutDashboard,
  Users,
  UserCog,
  BookOpen,
  Sparkles,
  Activity,
  Moon,
  Sun,
} from "lucide-react";

import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import { supabase } from "../../lib/supabase";
import { useTheme } from "../../lib/ThemeContext";

const NAV_ITEMS = [
  {
    to: "/admin",
    end: true,
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    to: "/admin/users",
    label: "Users",
    icon: Users,
  },
  {
    to: "/admin/role-requests",
    label: "Role requests",
    icon: UserCog,
  },
  {
    to: "/admin/courses",
    label: "Courses",
    icon: BookOpen,
  },
  {
    to: "/admin/skills",
    label: "Skills",
    icon: Sparkles,
  },
  {
    to: "/admin/activity",
    label: "Activity log",
    icon: Activity,
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const {
    resolvedTheme,
    toggleTheme,
  } = useTheme();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/login", {
      replace: true,
    });
  };

  return (
    <main className="admin-shell min-h-screen text-[#f2f4ef]">
      <div className="noise pointer-events-none fixed inset-0" />

      <aside className="admin-sidebar fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <Link
              to="/admin"
              aria-label="SkillSwap home"
              className="skillswap-logo group inline-flex items-center gap-2 rounded-sm text-xl font-black tracking-[-0.045em] text-white"
            >
              <span className="skillswap-logo-word relative">
                SKILLSWAP
              </span>
              <span className="text-[#c7ff39] transition-transform duration-300 group-hover:rotate-12">
                +
              </span>
            </Link>
            <p className="mt-3 text-[9px] uppercase tracking-[0.18em] text-[#a1a1aa]">
              Admin console
            </p>
          </div>

          <nav className="flex-1 space-y-1 p-4 pt-7">
            <p className="mb-3 px-4 text-[9px] uppercase tracking-[0.18em] text-white/30">
              Workspace
            </p>
            {NAV_ITEMS.map(
              ({
                to,
                end,
                label,
                icon: Icon,
              }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `group flex min-h-11 items-center gap-3 border px-4 text-sm transition ${
                      isActive
                        ? "border-[#c7ff39]/30 bg-[#c7ff39]/[0.08] text-[#c7ff39] shadow-[inset_3px_0_0_#c7ff39]"
                        : "border-transparent text-[#a1a1aa] hover:border-white/10 hover:text-white"
                    }`
                  }
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              )
            )}
          </nav>

          <div className="space-y-2 border-t border-white/10 p-4">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} theme`}
              title={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} theme`}
              className="flex min-h-11 w-full items-center gap-3 border border-white/10 bg-white/[0.02] px-4 text-sm text-[#a1a1aa] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"
            >
              {resolvedTheme === "light" ? (
                <Moon size={16} />
              ) : (
                <Sun size={16} />
              )}
              {resolvedTheme === "light" ? "Dark mode" : "Light mode"}
            </button>

            <button
              type="button"
              onClick={signOut}
              className="flex min-h-11 w-full items-center gap-3 border border-white/10 bg-white/[0.02] px-4 text-sm text-[#a1a1aa] transition hover:border-[#ff6b6b]/30 hover:text-[#ff8b8b]"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080b09]/90 backdrop-blur-xl lg:hidden">
          <div className="flex min-h-[68px] items-center justify-between px-4">
            <div>
              <Link
                to="/admin"
                aria-label="SkillSwap home"
                className="skillswap-logo group inline-flex items-center gap-2 rounded-sm text-xl font-black tracking-[-0.045em] text-white"
              >
                <span className="skillswap-logo-word relative">
                  SKILLSWAP
                </span>
                <span className="text-[#c7ff39] transition-transform duration-300 group-hover:rotate-12">
                  +
                </span>
              </Link>
              <p className="mt-1 text-[8px] uppercase tracking-[0.18em] text-[#a1a1aa]">
                Admin console
              </p>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} theme`}
              title={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} theme`}
              className="grid h-10 w-10 place-items-center border border-white/10 text-[#a1a1aa] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"
            >
              {resolvedTheme === "light" ? (
                <Moon size={16} />
              ) : (
                <Sun size={16} />
              )}
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto border-t border-white/10 px-4 py-3">
            {NAV_ITEMS.map(
              ({
                to,
                end,
                label,
              }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `shrink-0 border px-3 py-2 text-[11px] transition ${
                      isActive
                        ? "border-[#c7ff39]/30 bg-[#c7ff39]/[0.08] text-[#c7ff39]"
                        : "border-white/10 text-[#a1a1aa] hover:border-white/20 hover:text-white"
                    }`
                  }
                >
                  {label}
                </NavLink>
              )
            )}
          </div>
        </header>

        <div className="relative z-10">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
