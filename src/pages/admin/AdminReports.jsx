import { useState, useEffect } from "react";
import { ShieldAlert, AlertCircle } from "lucide-react";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import { supabase } from "../../lib/supabase";

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:reporter_id(username),
          reportedUser:reported_user_id(username)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setReports(data.map(rep => ({
        ...rep,
        reporterUsername: rep.reporter?.username || 'Unknown',
        reportedUsername: rep.reportedUser?.username || 'Unknown',
        date: new Date(rep.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      })));
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports. Please check your database connection.");
    } finally {
      setIsLoading(false);
    }
  }

  async function updateStatus(id, newStatus) {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setReports(reports.map(rep => rep.id === id ? { ...rep, status: newStatus } : rep));
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  }

  const columns = [
    { header: "Report ID", accessor: "id", render: (row) => (
      <span className="font-mono text-xs text-[#a1a1aa] bg-white/[0.03] px-1.5 py-0.5 rounded">{row.id}</span>
    ) },
    { header: "Reporter", accessor: "reporterUsername", render: (row) => (
      <span className="text-sm text-[#f2f4ef] font-medium">{row.reporterUsername}</span>
    ) },
    { header: "Reported User", accessor: "reportedUsername", render: (row) => (
      <span className="text-sm text-[#ff6b6b]">{row.reportedUsername}</span>
    ) },
    { header: "Type", accessor: "report_type", render: (row) => (
      <span className="text-sm text-[#a1a1aa]">{row.report_type}</span>
    ) },
    { header: "Date", accessor: "date", render: (row) => (
      <span className="text-sm text-[#a1a1aa] whitespace-nowrap">{row.date}</span>
    ) },
    { header: "Status", accessor: "status", render: (row) => (
      <AdminStatusBadge status={row.status} />
    ) },
    { header: "Actions", accessor: "actions", render: (row) => (
      <div className="flex items-center justify-end gap-2">
        {(row.status === 'Pending' || row.status === 'Under Review') && (
          <>
            <button onClick={() => updateStatus(row.id, 'Resolved')} className="text-xs font-medium text-[#c7ff39] hover:underline">Resolve</button>
            <button onClick={() => updateStatus(row.id, 'Dismissed')} className="text-xs font-medium text-[#a1a1aa] hover:underline">Dismiss</button>
          </>
        )}
      </div>
    )}
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium tracking-[-0.04em] text-[#f2f4ef] mb-2">
            Moderation Reports
          </h1>
          <p className="text-sm text-[#a1a1aa]">
            Review user-submitted reports regarding messages, sessions, or accounts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0a0d0b] border border-[#ff6b6b]/30 p-6 rounded-sm">
          <div className="flex items-center gap-2 text-[#ff6b6b] mb-2">
            <ShieldAlert className="h-5 w-5" />
            <span className="font-medium">Action Required</span>
          </div>
          <div className="text-3xl font-medium tracking-[-0.04em] text-[#f2f4ef]">
            {reports.filter(r => r.status === 'Pending').length}
          </div>
          <div className="text-sm text-[#a1a1aa] mt-1">Pending reports</div>
        </div>
        <div className="bg-[#0a0d0b] border border-white/10 p-6 rounded-sm">
          <div className="text-[#a1a1aa] font-medium mb-2">Under Review</div>
          <div className="text-3xl font-medium tracking-[-0.04em] text-[#f2f4ef]">
            {reports.filter(r => r.status === 'Under Review').length}
          </div>
          <div className="text-sm text-[#a1a1aa] mt-1">Currently investigating</div>
        </div>
        <div className="bg-[#0a0d0b] border border-white/10 p-6 rounded-sm">
          <div className="text-[#a1a1aa] font-medium mb-2">Resolved</div>
          <div className="text-3xl font-medium tracking-[-0.04em] text-[#f2f4ef]">
            {reports.filter(r => r.status === 'Resolved').length}
          </div>
          <div className="text-sm text-[#a1a1aa] mt-1">Reports closed recently</div>
        </div>
      </div>

      {error ? (
        <div className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 p-6 rounded text-[#ff8b8b] flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      ) : isLoading ? (
        <div className="p-12 flex justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-[#c7ff39]" />
        </div>
      ) : (
        <AdminDataTable 
          title="ALL REPORTS"
          columns={columns}
          data={reports}
          searchPlaceholder="Search by ID or username..."
        />
      )}
      
    </div>
  );
}
