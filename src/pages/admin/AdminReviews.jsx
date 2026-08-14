import { useState, useEffect } from "react";
import { Star, AlertCircle, Trash2 } from "lucide-react";
import AdminDataTable from "../../components/admin/AdminDataTable";
import { supabase } from "../../lib/supabase";

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:reviewer_id(full_name),
          reviewedUser:reviewed_user_id(full_name)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setReviews(data.map(rev => ({
        ...rev,
        reviewerName: rev.reviewer?.full_name || 'Unknown',
        reviewedUserName: rev.reviewedUser?.full_name || 'Unknown',
        date: new Date(rev.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      })));
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError("Failed to load reviews. Please check your database connection.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteReview(id) {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
      setReviews(reviews.filter(r => r.id !== id));
    } catch (err) {
      console.error("Error deleting review:", err);
      alert("Failed to delete review");
    }
  }

  const columns = [
    { header: "Review ID", accessor: "id", render: (row) => (
      <span className="font-mono text-xs text-[#a1a1aa] bg-white/[0.03] px-1.5 py-0.5 rounded">{row.id}</span>
    ) },
    { header: "Reviewer", accessor: "reviewerName", render: (row) => (
      <span className="text-sm text-[#f2f4ef] font-medium">{row.reviewerName}</span>
    ) },
    { header: "Reviewed User", accessor: "reviewedUserName", render: (row) => (
      <span className="text-sm text-[#a1a1aa]">{row.reviewedUserName}</span>
    ) },
    { header: "Rating", accessor: "rating", render: (row) => (
      <div className="flex items-center gap-1">
        <span className="text-sm text-[#f2f4ef] font-medium mr-1">{row.rating}.0</span>
        <Star className="h-3 w-3 fill-[#c7ff39] text-[#c7ff39]" />
      </div>
    ) },
    { header: "Review Text", accessor: "review_text", render: (row) => (
      <span className="text-sm text-[#a1a1aa] max-w-[200px] truncate block">{row.review_text}</span>
    ) },
    { header: "Session", accessor: "session_id", render: (row) => (
      <span className="font-mono text-xs text-[#a1a1aa] bg-white/[0.03] px-1.5 py-0.5 rounded">{row.session_id || '-'}</span>
    ) },
    { header: "Actions", accessor: "actions", render: (row) => (
      <div className="flex items-center justify-end">
        <button onClick={() => handleDeleteReview(row.id)} className="text-[#a1a1aa] hover:text-[#ff6b6b] p-1 transition-colors rounded">
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
            Reviews
          </h1>
          <p className="text-sm text-[#a1a1aa]">
            Moderate user reviews left after skill swap sessions.
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
          title="ALL REVIEWS"
          columns={columns}
          data={reviews}
          searchPlaceholder="Search reviews by text or user..."
        />
      )}
      
    </div>
  );
}
