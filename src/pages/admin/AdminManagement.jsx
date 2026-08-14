import { useState, useEffect } from "react";
import { ShieldCheck, Trash2, AlertCircle } from "lucide-react";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import { supabase } from "../../lib/supabase";

export default function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  async function fetchAdmins() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_admin', true)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setAdmins(data.map(admin => ({
        ...admin,
        role: admin.username === 'david_k' ? 'SUPER ADMIN' : 'ADMIN',
        lastLogin: new Date(admin.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      })));
    } catch (err) {
      console.error("Error fetching admins:", err);
      setError("Failed to load admins. Please check your database connection.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemoveAdmin(id) {
    if (!confirm("Are you sure you want to remove admin privileges from this user?")) return;
    try {
      const { error } = await supabase.from('profiles').update({ is_admin: false }).eq('id', id);
      if (error) throw error;
      setAdmins(admins.filter(a => a.id !== id));
    } catch (err) {
      console.error("Error removing admin:", err);
      alert("Failed to remove admin");
    }
  }

  const columns = [
    { header: "Admin", accessor: "full_name", render: (row) => (
      <div>
        <div className="font-medium text-[#f2f4ef]">{row.full_name}</div>
        <div className="text-xs text-[#a1a1aa] mt-0.5">{row.username || row.id}</div>
      </div>
    ) },
    { header: "Role", accessor: "role", render: (row) => (
      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#c7ff39] bg-[#c7ff39]/[0.06] border border-[#c7ff39]/25 px-2 py-1 rounded">{row.role}</span>
    ) },
    { header: "Status", accessor: "status", render: (row) => (
      <AdminStatusBadge status="Active" />
    ) },
    { header: "Last Login", accessor: "lastLogin", render: (row) => (
      <span className="text-sm text-[#a1a1aa]">{row.lastLogin}</span>
    ) },
    { header: "Actions", accessor: "actions", render: (row) => (
      <div className="flex items-center justify-end">
        <button onClick={() => handleRemoveAdmin(row.id)} className="text-[#a1a1aa] hover:text-[#ff6b6b] p-1 transition-colors rounded">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    )}
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium tracking-[-0.04em] text-[#f2f4ef] mb-2">
            Admin Management
          </h1>
          <p className="text-sm text-[#a1a1aa]">
            Control access, roles, and permissions for internal staff.
          </p>
        </div>
        
        <button className="h-10 px-4 bg-[#c7ff39] text-[#071008] font-semibold hover:bg-[#d2ff64] rounded-md transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-2 focus:ring-offset-[#060807] flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          Invite Admin
        </button>
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
          title="ADMINISTRATIVE ACCOUNTS"
          columns={columns}
          data={admins}
          searchPlaceholder="Search admins by name or email..."
        />
      )}
      
    </div>
  );
}
