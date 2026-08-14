import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#060807] text-[#f2f4ef] font-sans selection:bg-[#c7ff39]/30 selection:text-[#f2f4ef] flex">
      {/* Background effects */}
      <div className="noise pointer-events-none fixed inset-0 z-0 mix-blend-overlay opacity-50" />
      <div 
        className="pointer-events-none fixed inset-0 z-0" 
        style={{
          background: "radial-gradient(ellipse at 78% 5%, rgba(199,255,57,.04), transparent 36%)"
        }} 
      />

      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pl-[240px] relative z-10 min-h-screen">
        <AdminHeader />
        
        <main className="flex-1 p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
