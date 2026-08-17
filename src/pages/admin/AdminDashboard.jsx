import { useState, useEffect } from "react";
import { Users, GraduationCap, Video, CreditCard } from "lucide-react";
import AdminStatCard from "../../components/admin/AdminStatCard";
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import { supabase } from "../../lib/supabase";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    courses: 0,
    sessions: 0,
    revenue: 0
  });
  const [recentReports, setRecentReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setIsLoading(true);
      
      const [
        { count: userCount },
        { count: courseCount },
        { count: sessionCount },
        { data: activityData }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('sessions').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*, user:reporter_id(username)').order('created_at', { ascending: false }).limit(4)
      ]);

      setStats({
        users: userCount || 0,
        courses: courseCount || 0,
        sessions: sessionCount || 0,
        revenue: 0 
      });

      setRecentReports((activityData || []).map(rep => ({
        id: rep.id,
        user: rep.user?.username || 'Unknown',
        type: rep.report_type,
        date: new Date(rep.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        status: rep.status
      })));

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-medium tracking-[-0.04em] text-[#f2f4ef] mb-2">
          Platform overview
        </h1>
        <p className="text-sm text-[#a1a1aa]">
          Monitor SkillSwap+ activity, users, sessions and platform health.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard 
          title="Total Users" 
          value={isLoading ? "-" : stats.users.toLocaleString()} 
          trend="up" 
          trendValue="+12.5%"
          icon={Users}
        />
        <AdminStatCard 
          title="Active Courses" 
          value={isLoading ? "-" : stats.courses.toLocaleString()} 
          trend="up" 
          trendValue="+5.2%"
          icon={GraduationCap}
        />
        <AdminStatCard 
          title="Mentorship Sessions" 
          value={isLoading ? "-" : stats.sessions.toLocaleString()} 
          trend="down" 
          trendValue="-2.1%"
          icon={Video}
        />
        <AdminStatCard 
          title="Platform Revenue (SS)" 
          value={isLoading ? "-" : "24,500"} 
          trend="up" 
          trendValue="+18.4%"
          icon={CreditCard}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Placeholder for Chart */}
        <div className="lg:col-span-2 bg-[#0a0d0b] border border-white/10 p-6 flex flex-col min-h-[300px]">
          <h2 className="text-sm font-semibold tracking-wide text-[#f2f4ef] uppercase mb-6">User Growth</h2>
          <div className="flex-1 border border-white/[0.05] border-dashed rounded flex items-center justify-center text-[#a1a1aa] text-sm bg-white/[0.01]">
            [ Activity Chart Area ]
          </div>
        </div>

        {/* Recent Reports Widget */}
        <div className="bg-[#0a0d0b] border border-white/10 p-0 flex flex-col min-h-[300px]">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-sm font-semibold tracking-wide text-[#f2f4ef] uppercase">Recent Reports</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {recentReports.map(report => (
              <div key={report.id} className="p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="font-mono text-xs text-[#a1a1aa]">{report.id}</div>
                  <AdminStatusBadge status={report.status} />
                </div>
                <div>
                  <div className="text-sm text-[#f2f4ef] font-medium">{report.user}</div>
                  <div className="text-xs text-[#a1a1aa]">{report.type}</div>
                </div>
                <div className="text-[10px] text-[#a1a1aa]/60 mt-1">{report.date}</div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-white/10 text-center">
            <button className="text-xs text-[#c7ff39] hover:underline uppercase tracking-wider font-semibold">View all reports</button>
          </div>
        </div>

      </div>
    </div>
  );
}
