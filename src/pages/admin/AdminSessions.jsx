import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import { supabase } from "../../lib/supabase";

export default function AdminSessions() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          learner:learner_id(full_name),
          mentor:mentor_id(full_name),
          skill:skill_id(name)
        `)
        .order('scheduled_at', { ascending: false });
        
      if (error) throw error;
      
      setSessions(data.map(session => ({
        ...session,
        learnerName: session.learner?.full_name || 'Unknown',
        mentorName: session.mentor?.full_name || 'Unknown',
        skillName: session.skill?.name || 'Unknown',
        date: new Date(session.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      })));
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError("Failed to load sessions. Please check your database connection.");
    } finally {
      setIsLoading(false);
    }
  }

  async function updateStatus(id, newStatus) {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setSessions(sessions.map(s => s.id === id ? { ...s, status: newStatus } : s));
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  }

  const columns = [
    { header: "Session ID", accessor: "id", render: (row) => (
      <span className="font-mono text-xs text-[#a1a1aa] bg-white/[0.03] px-1.5 py-0.5 rounded">{row.id}</span>
    ) },
    { header: "Learner", accessor: "learnerName", render: (row) => (
      <span className="text-sm text-[#f2f4ef] font-medium">{row.learnerName}</span>
    ) },
    { header: "Mentor", accessor: "mentorName", render: (row) => (
      <span className="text-sm text-[#f2f4ef]">{row.mentorName}</span>
    ) },
    { header: "Skill", accessor: "skillName", render: (row) => (
      <span className="text-sm text-[#a1a1aa]">{row.skillName}</span>
    ) },
    { header: "Date", accessor: "date", render: (row) => (
      <span className="text-sm text-[#a1a1aa] whitespace-nowrap">{row.date}</span>
    ) },
    { header: "Credits", accessor: "credits_exchanged", render: (row) => (
      <span className="font-mono text-sm text-[#c7ff39]">{row.credits_exchanged} SS</span>
    ) },
    { header: "Status", accessor: "status", render: (row) => (
      <AdminStatusBadge status={row.status} />
    ) },
    { header: "Actions", accessor: "actions", render: (row) => (
      <div className="flex items-center justify-end gap-2">
        {row.status === 'Scheduled' && (
          <button onClick={() => updateStatus(row.id, 'Cancelled')} className="text-xs font-medium text-[#ff6b6b] hover:underline">Cancel</button>
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
            Sessions
          </h1>
          <p className="text-sm text-[#a1a1aa]">
            Monitor scheduled, active, and completed skill swap sessions.
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
          title="ALL SESSIONS"
          columns={columns}
          data={sessions}
          searchPlaceholder="Search sessions..."
        />
      )}
      
    </div>
  );
}
