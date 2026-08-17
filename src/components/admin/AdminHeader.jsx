import { Bell, Search, ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function AdminHeader() {
  const location = useLocation();
  
  // Create a simple breadcrumb based on path
  const pathnames = location.pathname.split("/").filter((x) => x);
  
  return (
    <header className="h-16 border-b border-white/10 bg-[#060807]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
      {/* Breadcrumb / Global Search */}
      <div className="flex items-center gap-8 flex-1">
        <div className="flex items-center text-sm">
          <span className="text-[#a1a1aa]">Admin</span>
          {pathnames.length > 1 && (
            <>
              <span className="text-white/20 mx-2">/</span>
              <span className="text-[#f2f4ef] capitalize">{pathnames[pathnames.length - 1].replace(/-/g, ' ')}</span>
            </>
          )}
        </div>

        <div className="relative max-w-md w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a1a1aa]" />
          <input
            type="text"
            placeholder="Search users, skills, sessions..."
            className="w-full h-9 bg-[#0a0d0b] border border-white/10 rounded-md pl-9 pr-4 text-sm text-[#f2f4ef] placeholder:text-[#a1a1aa]/60 focus:outline-none focus:border-[#c7ff39]/50 focus:ring-1 focus:ring-[#c7ff39]/30 transition-all"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-[#a1a1aa] hover:text-[#f2f4ef] hover:bg-white/[0.03] rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-2 focus:ring-offset-[#060807]">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#c7ff39] border border-[#060807]"></span>
        </button>

        <div className="h-6 w-px bg-white/10 mx-1"></div>

        <button className="flex items-center gap-3 p-1 pl-2 pr-1 rounded-md hover:bg-white/[0.03] transition-colors focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-2 focus:ring-offset-[#060807]">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-medium text-[#f2f4ef]">Admin User</span>
            <span className="text-[10px] text-[#c7ff39] uppercase tracking-wider">Super Admin</span>
          </div>
          <div className="h-8 w-8 rounded bg-[#0a0d0b] border border-white/15 flex items-center justify-center text-[#c7ff39] font-medium overflow-hidden">
            <img src="https://ui-avatars.com/api/?name=Admin&background=0a0d0b&color=c7ff39&bold=true" alt="Admin" />
          </div>
          <ChevronDown className="h-4 w-4 text-[#a1a1aa]" />
        </button>
      </div>
    </header>
  );
}
