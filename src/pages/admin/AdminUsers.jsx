import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import { supabase } from "../../lib/supabase";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setUsers(data.map(user => ({
        ...user,
        joined: new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      })));
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please check your database connection.");
    } finally {
      setIsLoading(false);
    }
  }

  const columns = [
    { header: "User", accessor: "name", render: (row) => (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded bg-[#0a0d0b] border border-white/15 flex items-center justify-center text-[#c7ff39] font-medium text-xs overflow-hidden">
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=0a0d0b&color=c7ff39&bold=true`} alt={row.name} />
        </div>
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-[10px] text-[#a1a1aa] font-mono mt-0.5">{row.id}</div>
        </div>
      </div>
    ) },
    { header: "Role", accessor: "role", render: (row) => (
      <span className="text-sm text-[#f2f4ef]">{row.role}</span>
    ) },
    { header: "Status", accessor: "status", render: (row) => (
      <AdminStatusBadge status={row.status} />
    ) },
    { header: "SS Credits", accessor: "credits", render: (row) => (
      <span className="font-mono text-sm text-[#c7ff39]">{row.credits}</span>
    ) },
    { header: "Joined", accessor: "joined", render: (row) => (
      <span className="text-sm text-[#a1a1aa]">{row.joined}</span>
    ) },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium tracking-[-0.04em] text-[#f2f4ef] mb-2">
            Users
          </h1>
          <p className="text-sm text-[#a1a1aa]">
            Manage all registered users, roles, and account statuses.
          </p>
        </div>
        
        <button className="h-10 px-4 bg-[#c7ff39] text-[#071008] font-semibold hover:bg-[#d2ff64] rounded-md transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-2 focus:ring-offset-[#060807]">
          Add User manually
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
          title="ALL USERS"
          columns={columns}
          data={users}
          searchPlaceholder="Search users by name, email, or ID..."
          onRowClick={(row) => navigate(`/admin/users/${row.id}`)}
        />
      )}
      
    </div>
  );
}
