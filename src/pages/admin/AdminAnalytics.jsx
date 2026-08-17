import { BarChart3, TrendingUp, Users, Clock } from "lucide-react";
import AdminStatCard from "../../components/admin/AdminStatCard";

export default function AdminAnalytics() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-medium tracking-[-0.04em] text-[#f2f4ef] mb-2">
          Analytics
        </h1>
        <p className="text-sm text-[#a1a1aa]">
          Deep dive into platform metrics, user engagement, and growth.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard 
          title="Avg Session Time" 
          value="45m" 
          trend="up" 
          trendValue="+5m vs last month"
          icon={Clock}
        />
        <AdminStatCard 
          title="Monthly Active Users" 
          value="1,842" 
          trend="up" 
          trendValue="+12% vs last month"
          icon={Users}
        />
        <AdminStatCard 
          title="Retention Rate" 
          value="68%" 
          trend="down" 
          trendValue="-2% vs last month"
          icon={TrendingUp}
        />
        <AdminStatCard 
          title="Conversion to Mentor" 
          value="12%" 
          trend="neutral" 
          trendValue="Stable"
          icon={BarChart3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Placeholder Chart 1 */}
        <div className="bg-[#0a0d0b] border border-white/10 p-6 flex flex-col min-h-[350px]">
          <h2 className="text-sm font-semibold tracking-wide text-[#f2f4ef] uppercase mb-6">User Registrations Over Time</h2>
          <div className="flex-1 border border-white/[0.05] border-dashed rounded flex items-center justify-center text-[#a1a1aa] text-sm bg-white/[0.01]">
            [ Line Chart: Registrations ]
          </div>
        </div>

        {/* Placeholder Chart 2 */}
        <div className="bg-[#0a0d0b] border border-white/10 p-6 flex flex-col min-h-[350px]">
          <h2 className="text-sm font-semibold tracking-wide text-[#f2f4ef] uppercase mb-6">Top Learned Skills</h2>
          <div className="flex-1 border border-white/[0.05] border-dashed rounded flex items-center justify-center text-[#a1a1aa] text-sm bg-white/[0.01]">
            [ Bar Chart: Skills by Demand ]
          </div>
        </div>

        {/* Placeholder Chart 3 */}
        <div className="bg-[#0a0d0b] border border-white/10 p-6 flex flex-col min-h-[350px]">
          <h2 className="text-sm font-semibold tracking-wide text-[#f2f4ef] uppercase mb-6">SS Credits Volume</h2>
          <div className="flex-1 border border-white/[0.05] border-dashed rounded flex items-center justify-center text-[#a1a1aa] text-sm bg-white/[0.01]">
            [ Area Chart: SS Credits Exchanged ]
          </div>
        </div>
        
        {/* Placeholder Chart 4 */}
        <div className="bg-[#0a0d0b] border border-white/10 p-6 flex flex-col min-h-[350px]">
          <h2 className="text-sm font-semibold tracking-wide text-[#f2f4ef] uppercase mb-6">Session Completion Rate</h2>
          <div className="flex-1 border border-white/[0.05] border-dashed rounded flex items-center justify-center text-[#a1a1aa] text-sm bg-white/[0.01]">
            [ Pie Chart: Completed vs Cancelled ]
          </div>
        </div>

      </div>
    </div>
  );
}
