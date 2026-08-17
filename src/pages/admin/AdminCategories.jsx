import { useState, useEffect } from "react";
import { GripVertical, AlertCircle, Trash2, X } from "lucide-react";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import { supabase } from "../../lib/supabase";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      // Map to the required format
      setCategories(data.map(cat => ({
        ...cat,
        skillsCount: 0 // In a real query we would do a join/count here
      })));
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories. Please check your database connection.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateCategory(e) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      setIsSubmitting(true);
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: newCategoryName.trim(), status: 'Active' }])
        .select()
        .single();

      if (error) throw error;
      
      setCategories([...categories, { ...data, skillsCount: 0 }]);
      setIsCreateModalOpen(false);
      setNewCategoryName("");
    } catch (err) {
      console.error("Error creating category:", err);
      alert("Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteCategory(id) {
    if (!confirm("Are you sure you want to delete this category?")) return;
    
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      setCategories(categories.filter(c => c.id !== id));
    } catch (err) {
      console.error("Error deleting category:", err);
      alert("Failed to delete category");
    }
  }

  const columns = [
    { header: "", accessor: "drag", render: () => (
      <div className="text-[#a1a1aa] cursor-grab hover:text-[#f2f4ef] transition-colors"><GripVertical className="h-4 w-4" /></div>
    ) },
    { header: "Category Name", accessor: "name", render: (row) => (
      <div className="font-medium text-[#f2f4ef]">{row.name}</div>
    ) },
    { header: "Category ID", accessor: "id", render: (row) => (
      <span className="font-mono text-xs text-[#a1a1aa]">{row.id}</span>
    ) },
    { header: "Total Skills", accessor: "skillsCount", render: (row) => (
      <span className="text-sm text-[#f2f4ef]">{row.skillsCount}</span>
    ) },
    { header: "Status", accessor: "status", render: (row) => (
      <AdminStatusBadge status={row.status} />
    ) },
    { header: "Actions", accessor: "actions", render: (row) => (
      <div className="flex items-center justify-end">
        <button onClick={() => handleDeleteCategory(row.id)} className="text-[#a1a1aa] hover:text-[#ff6b6b] p-1 transition-colors rounded">
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
            Categories
          </h1>
          <p className="text-sm text-[#a1a1aa]">
            Manage high-level categories that organize skills across the platform.
          </p>
        </div>
        
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="h-10 px-4 bg-[#c7ff39] text-[#071008] font-semibold hover:bg-[#d2ff64] rounded-md transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-2 focus:ring-offset-[#060807]">
          Create Category
        </button>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0a0d0b] border border-white/10 w-full max-w-md rounded-md p-6 relative shadow-2xl">
            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-4 right-4 text-[#a1a1aa] hover:text-[#f2f4ef]">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-medium text-[#f2f4ef] mb-6">Create New Category</h2>
            <form onSubmit={handleCreateCategory}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-2">Category Name</label>
                  <input 
                    type="text" 
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full h-10 bg-[#060807] border border-white/15 rounded-md px-4 text-sm text-[#f2f4ef] focus:outline-none focus:border-[#c7ff39]/70 focus:ring-1 focus:ring-[#c7ff39]/30 transition-all"
                    placeholder="e.g. Development"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-sm text-[#a1a1aa] hover:text-[#f2f4ef]">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[#c7ff39] text-[#071008] text-sm font-semibold rounded hover:bg-[#d2ff64] disabled:opacity-50">
                  {isSubmitting ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
          title="ALL CATEGORIES"
          columns={columns}
          data={categories}
          searchPlaceholder="Search categories..."
        />
      )}
      
    </div>
  );
}
