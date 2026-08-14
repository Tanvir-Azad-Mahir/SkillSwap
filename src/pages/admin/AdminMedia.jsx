import { useState, useEffect } from "react";
import { HardDrive, Trash2, AlertCircle } from "lucide-react";
import AdminDataTable from "../../components/admin/AdminDataTable";
import { supabase } from "../../lib/supabase";

export default function AdminMedia() {
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  async function fetchMedia() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('media')
        .select(`
          *,
          uploader:uploaded_by(full_name)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setMedia(data.map(m => ({
        ...m,
        uploaderName: m.uploader?.full_name || 'System',
        sizeFormatted: `${(m.size_bytes / 1024 / 1024).toFixed(2)} MB`,
        date: new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      })));
    } catch (err) {
      console.error("Error fetching media:", err);
      setError("Failed to load media. Please check your database connection.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteMedia(id) {
    if (!confirm("Are you sure you want to delete this file? This cannot be undone.")) return;
    try {
      const { error } = await supabase.from('media').delete().eq('id', id);
      if (error) throw error;
      setMedia(media.filter(m => m.id !== id));
    } catch (err) {
      console.error("Error deleting media:", err);
      alert("Failed to delete media");
    }
  }

  const columns = [
    { header: "File Name", accessor: "name", render: (row) => (
      <div className="font-medium text-[#f2f4ef]">{row.name}</div>
    ) },
    { header: "Type", accessor: "type", render: (row) => (
      <span className="text-sm text-[#a1a1aa]">{row.type}</span>
    ) },
    { header: "Size", accessor: "sizeFormatted", render: (row) => (
      <span className="text-sm text-[#a1a1aa]">{row.sizeFormatted}</span>
    ) },
    { header: "Uploaded By", accessor: "uploaderName", render: (row) => (
      <span className="text-sm text-[#f2f4ef]">{row.uploaderName}</span>
    ) },
    { header: "Date", accessor: "date", render: (row) => (
      <span className="text-sm text-[#a1a1aa] whitespace-nowrap">{row.date}</span>
    ) },
    { header: "Actions", accessor: "actions", render: (row) => (
      <div className="flex items-center justify-end">
        <button onClick={() => handleDeleteMedia(row.id)} className="text-[#a1a1aa] hover:text-[#ff6b6b] p-1 transition-colors rounded">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    ) }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium tracking-[-0.04em] text-[#f2f4ef] mb-2">
            Media Library
          </h1>
          <p className="text-sm text-[#a1a1aa]">
            Manage global assets, user uploads, and course attachments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0a0d0b] border border-[#c7ff39]/30 p-6 rounded-sm">
          <div className="flex items-center gap-2 text-[#c7ff39] mb-2">
            <HardDrive className="h-5 w-5" />
            <span className="font-medium">Storage Used</span>
          </div>
          <div className="text-3xl font-medium tracking-[-0.04em] text-[#f2f4ef]">
            {(media.reduce((acc, m) => acc + m.size_bytes, 0) / 1024 / 1024).toFixed(2)} MB
          </div>
          <div className="text-sm text-[#a1a1aa] mt-1">Total allocated: 50 GB</div>
        </div>
        <div className="bg-[#0a0d0b] border border-white/10 p-6 rounded-sm">
          <div className="text-[#a1a1aa] font-medium mb-2">Total Files</div>
          <div className="text-3xl font-medium tracking-[-0.04em] text-[#f2f4ef]">
            {media.length}
          </div>
          <div className="text-sm text-[#a1a1aa] mt-1">Across all categories</div>
        </div>
        <div className="bg-[#0a0d0b] border border-white/10 p-6 rounded-sm">
          <div className="text-[#a1a1aa] font-medium mb-2">Images</div>
          <div className="text-3xl font-medium tracking-[-0.04em] text-[#f2f4ef]">
            {media.filter(m => m.file_type?.toLowerCase().includes('image')).length}
          </div>
          <div className="text-sm text-[#a1a1aa] mt-1">Most common file type</div>
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
          title="ALL FILES"
          columns={columns}
          data={media}
          searchPlaceholder="Search files by name..."
        />
      )}
      
    </div>
  );
}
