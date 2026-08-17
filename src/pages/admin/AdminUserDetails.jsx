import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Ban, ShieldAlert, Edit2, AlertCircle } from "lucide-react";
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import { supabase } from "../../lib/supabase";

export default function AdminUserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  async function fetchUserDetails() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      setUser({
        id: data.id,
        name: data.full_name || 'Unknown',
        username: data.username || data.id.substring(0,8),
        email: data.email || 'N/A', // Assuming email might be fetched if available via auth or another table, keeping it as N/A if not in profiles
        role: data.is_admin ? "Admin" : "User",
        status: "Active", // Status isn't explicitly in profiles in schema, mock as Active
        credits: data.ss_credits_balance,
        joined: new Date(data.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        lastActive: "Recent", // Mock
        bio: data.bio || "No bio provided.",
        location: "Unknown", // Mock
        learningSkills: [], // Mock
        teachingSkills: [] // Mock
      });
    } catch (err) {
      console.error("Error fetching user details:", err);
      setError("Failed to load user details.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteUser() {
    if (!confirm("Are you sure you want to permanently delete this user?")) return;
    try {
      // In a real scenario, this would likely be an Edge Function calling admin auth API
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      navigate('/admin/users');
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user");
    }
  }

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-[#c7ff39]" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 p-6 rounded text-[#ff8b8b] flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error || "User not found"}</p>
        </div>
        <button onClick={() => navigate("/admin/users")} className="text-sm text-[#a1a1aa] hover:text-[#f2f4ef]">Back to Users</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Back & Actions */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate("/admin/users")}
          className="flex items-center gap-2 text-sm text-[#a1a1aa] hover:text-[#f2f4ef] transition-colors focus:outline-none focus:ring-2 focus:ring-[#c7ff39] rounded"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </button>

        <div className="flex gap-2">
          <button className="h-9 px-3 border border-[#ff6b6b]/30 bg-[#060807] text-[#ff8b8b] hover:bg-[#ff6b6b]/[0.06] rounded-md transition-colors flex items-center gap-2 text-sm focus:outline-none">
            <Ban className="h-4 w-4" />
            Suspend
          </button>
        </div>
      </div>

      {/* Header Profile Info */}
      <div className="flex items-start gap-6 bg-[#0a0d0b] border border-white/10 p-6">
        <div className="h-20 w-20 rounded bg-[#060807] border border-white/15 flex items-center justify-center text-[#c7ff39] text-2xl font-bold overflow-hidden shrink-0">
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0a0d0b&color=c7ff39&bold=true`} alt={user.name} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-medium tracking-[-0.03em] text-[#f2f4ef] flex items-center gap-3">
                {user.name}
                <AdminStatusBadge status={user.status} />
              </h1>
              <div className="text-sm text-[#a1a1aa] font-mono mt-1">@{user.username} • {user.id}</div>
            </div>
            
            <div className="text-right">
              <div className="text-[10px] font-semibold text-[#a1a1aa] uppercase tracking-[0.16em] mb-1">Role</div>
              <div className="text-sm text-[#f2f4ef] bg-white/[0.03] border border-white/10 px-2 py-1 rounded inline-block">{user.role}</div>
            </div>
          </div>
          
          <p className="text-sm text-[#a1a1aa] mt-4 max-w-2xl">{user.bio}</p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Account Info */}
        <div className="bg-[#0a0d0b] border border-white/10 p-6 space-y-4">
          <h2 className="text-[10px] font-semibold text-[#a1a1aa] uppercase tracking-[0.16em] mb-4">Account Information</h2>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[#a1a1aa] mb-1">Email</div>
              <div className="text-[#f2f4ef]">{user.email}</div>
            </div>
            <div>
              <div className="text-[#a1a1aa] mb-1">Location</div>
              <div className="text-[#f2f4ef]">{user.location}</div>
            </div>
            <div>
              <div className="text-[#a1a1aa] mb-1">Joined</div>
              <div className="text-[#f2f4ef]">{user.joined}</div>
            </div>
            <div>
              <div className="text-[#a1a1aa] mb-1">Last Active</div>
              <div className="text-[#f2f4ef]">{user.lastActive}</div>
            </div>
          </div>
        </div>

        {/* SS Credits */}
        <div className="bg-[#0a0d0b] border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-semibold text-[#a1a1aa] uppercase tracking-[0.16em]">SS Credit Wallet</h2>
          </div>
          
          <div className="flex items-end gap-3 mb-6">
            <div className="text-4xl font-medium tracking-[-0.04em] text-[#c7ff39]">{user.credits}</div>
            <div className="text-sm text-[#a1a1aa] mb-1 uppercase tracking-widest font-semibold">SS</div>
          </div>
        </div>

      </div>

      {/* Danger Zone */}
      <div className="border border-[#ff6b6b]/20 p-6 rounded-sm bg-[#ff6b6b]/[0.02] mt-12">
        <h2 className="text-[10px] font-semibold text-[#ff6b6b] uppercase tracking-[0.16em] mb-4 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" /> Danger Zone
        </h2>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm font-medium text-[#f2f4ef] mb-1">Delete Account</div>
            <div className="text-xs text-[#a1a1aa]">Permanently remove this user and all associated data.</div>
          </div>
          <button onClick={handleDeleteUser} className="h-9 px-4 border border-[#ff6b6b]/30 text-[#ff8b8b] hover:bg-[#ff6b6b]/[0.06] rounded-md transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]">
            Delete User
          </button>
        </div>
      </div>

    </div>
  );
}
