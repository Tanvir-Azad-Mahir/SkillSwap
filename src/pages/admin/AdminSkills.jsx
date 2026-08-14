import { useState, useEffect } from "react";
import { Plus, AlertCircle, Trash2, X } from "lucide-react";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import { supabase } from "../../lib/supabase";

export default function AdminSkills() {
  const [skills, setSkills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("");
  const [newSkillDifficulty, setNewSkillDifficulty] = useState("Intermediate");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setIsLoading(true);
      
      const [skillsRes, catsRes] = await Promise.all([
        supabase.from('skills').select('*, category:categories(name)').order('name'),
        supabase.from('categories').select('id, name').order('name')
      ]);

      if (skillsRes.error) throw skillsRes.error;
      if (catsRes.error) throw catsRes.error;
      
      setCategories(catsRes.data);
      setSkills(skillsRes.data.map(skill => ({
        ...skill,
        categoryName: skill.category?.name || 'Uncategorized',
        learners: 0,
        mentors: 0
      })));
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load skills. Please check your database connection.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateSkill(e) {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    try {
      setIsSubmitting(true);
      const { data, error } = await supabase
        .from('skills')
        .insert([{ 
          name: newSkillName.trim(), 
          category_id: newSkillCategory || null,
          difficulty: newSkillDifficulty,
          status: 'Active' 
        }])
        .select('*, category:categories(name)')
        .single();

      if (error) throw error;
      
      setSkills([...skills, { 
        ...data, 
        categoryName: data.category?.name || 'Uncategorized',
        learners: 0, 
        mentors: 0 
      }]);
      setIsCreateModalOpen(false);
      setNewSkillName("");
      setNewSkillCategory("");
      setNewSkillDifficulty("Intermediate");
    } catch (err) {
      console.error("Error creating skill:", err);
      alert("Failed to create skill");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteSkill(id) {
    if (!confirm("Are you sure you want to delete this skill?")) return;
    
    try {
      const { error } = await supabase.from('skills').delete().eq('id', id);
      if (error) throw error;
      setSkills(skills.filter(s => s.id !== id));
    } catch (err) {
      console.error("Error deleting skill:", err);
      alert("Failed to delete skill");
    }
  }

  const columns = [
    { header: "Skill", accessor: "name", render: (row) => (
      <div className="font-medium text-[#f2f4ef]">{row.name}</div>
    ) },
    { header: "Category", accessor: "categoryName", render: (row) => (
      <span className="text-sm text-[#a1a1aa]">{row.categoryName}</span>
    ) },
    { header: "Difficulty", accessor: "difficulty", render: (row) => (
      <span className="text-sm text-[#a1a1aa]">{row.difficulty}</span>
    ) },
    { header: "Learners", accessor: "learners", render: (row) => (
      <span className="text-sm text-[#f2f4ef]">{row.learners}</span>
    ) },
    { header: "Mentors", accessor: "mentors", render: (row) => (
      <span className="text-sm text-[#f2f4ef]">{row.mentors}</span>
    ) },
    { header: "Status", accessor: "status", render: (row) => (
      <AdminStatusBadge status={row.status} />
    ) },
    { header: "Actions", accessor: "actions", render: (row) => (
      <div className="flex items-center justify-end">
        <button onClick={() => handleDeleteSkill(row.id)} className="text-[#a1a1aa] hover:text-[#ff6b6b] p-1 transition-colors rounded">
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
            Skills Taxonomy
          </h1>
          <p className="text-sm text-[#a1a1aa]">
            Manage the platform's standardized list of skills and categories.
          </p>
        </div>
        
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="h-10 px-4 bg-[#c7ff39] text-[#071008] font-semibold hover:bg-[#d2ff64] rounded-md transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-2 focus:ring-offset-[#060807] flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Skill
        </button>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0a0d0b] border border-white/10 w-full max-w-md rounded-md p-6 relative shadow-2xl">
            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-4 right-4 text-[#a1a1aa] hover:text-[#f2f4ef]">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-medium text-[#f2f4ef] mb-6">Create New Skill</h2>
            <form onSubmit={handleCreateSkill}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-2">Skill Name</label>
                  <input 
                    type="text" 
                    required
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    className="w-full h-10 bg-[#060807] border border-white/15 rounded-md px-4 text-sm text-[#f2f4ef] focus:outline-none focus:border-[#c7ff39]/70 focus:ring-1 focus:ring-[#c7ff39]/30 transition-all"
                    placeholder="e.g. React"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-2">Category</label>
                  <select 
                    value={newSkillCategory}
                    onChange={(e) => setNewSkillCategory(e.target.value)}
                    className="w-full h-10 bg-[#060807] border border-white/15 rounded-md px-4 text-sm text-[#f2f4ef] focus:outline-none focus:border-[#c7ff39]/70 focus:ring-1 focus:ring-[#c7ff39]/30 transition-all appearance-none"
                  >
                    <option value="">No Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-2">Difficulty</label>
                  <select 
                    value={newSkillDifficulty}
                    onChange={(e) => setNewSkillDifficulty(e.target.value)}
                    className="w-full h-10 bg-[#060807] border border-white/15 rounded-md px-4 text-sm text-[#f2f4ef] focus:outline-none focus:border-[#c7ff39]/70 focus:ring-1 focus:ring-[#c7ff39]/30 transition-all appearance-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-sm text-[#a1a1aa] hover:text-[#f2f4ef]">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[#c7ff39] text-[#071008] text-sm font-semibold rounded hover:bg-[#d2ff64] disabled:opacity-50">
                  {isSubmitting ? 'Adding...' : 'Add Skill'}
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
          title="ALL SKILLS"
          columns={columns}
          data={skills}
          searchPlaceholder="Search skills..."
        />
      )}
      
    </div>
  );
}
