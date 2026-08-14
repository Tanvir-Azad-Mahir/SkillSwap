import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import { supabase } from "../../lib/supabase";

export default function AdminMentorship() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('mentorship_requests')
        .select(`
          *,
          learner:learner_id(full_name),
          mentor:mentor_id(full_name),
          skill:skill_id(name)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setRequests(data.map(req => ({
        ...req,
        learnerName: req.learner?.full_name || 'Unknown',
        mentorName: req.mentor?.full_name || 'Unknown',
        skillName: req.skill?.name || 'Unknown',
        date: new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      })));
    } catch (err) {
      console.error("Error fetching mentorship requests:", err);
      setError("Failed to load requests. Please check your database connection.");
    } finally {
      setIsLoading(false);
    }
  }

  async function updateStatus(id, newStatus) {
    try {
      const { error } = await supabase
        .from('mentorship_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  }

  const columns = [
    { header: "Request ID", accessor: "id", render: (row) => (
      <span className="font-mono text-xs text-[#a1a1aa] bg-white/[0.03] px-1.5 py-0.5 rounded">{row.id}</span>
    ) },
    { header: "Learner", accessor: "learnerName", render: (row) => (
      <span className="text-sm text-[#f2f4ef] font-medium">{row.learnerName}</span>
    ) },
    { header: "Mentor", accessor: "mentorName", render: (row) => (
      <span className="text-sm text-[#f2f4ef]">{row.mentorName}</span>
    ) },
    { header: "Requested Skill", accessor: "skillName", render: (row) => (
      <span className="text-sm text-[#a1a1aa]">{row.skillName}</span>
    ) },
    { header: "Date", accessor: "date", render: (row) => (
      <span className="text-sm text-[#a1a1aa] whitespace-nowrap">{row.date}</span>
    ) },
    { header: "Status", accessor: "status", render: (row) => (
      <AdminStatusBadge status={row.status} />
    ) },
    { header: "Actions", accessor: "actions", render: (row) => (
      <div className="flex items-center justify-end gap-2">
        {row.status === 'Pending' && (
          <>
            <button onClick={() => updateStatus(row.id, 'Accepted')} className="text-xs font-medium text-[#c7ff39] hover:underline">Accept</button>
            <button onClick={() => updateStatus(row.id, 'Rejected')} className="text-xs font-medium text-[#ff6b6b] hover:underline">Reject</button>
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
            Mentorship
          </h1>
          <p className="text-sm text-[#a1a1aa]">
            Manage and inspect mentorship connections and requests between users.
          </p>
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
          title="MENTORSHIP REQUESTS"
          columns={columns}
          data={requests}
          searchPlaceholder="Search by ID, learner, or mentor..."
        />
      )}
      
    </div>
  );
}
