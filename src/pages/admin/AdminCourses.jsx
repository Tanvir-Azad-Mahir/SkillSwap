import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import { supabase } from "../../lib/supabase";

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:instructor_id(full_name),
          skill:skill_id(name)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setCourses(data.map(course => ({
        ...course,
        instructorName: course.instructor?.full_name || 'Unknown',
        skillName: course.skill?.name || 'Unknown',
        students: 0, // Mock for now until join query
        created: new Date(course.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      })));
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Failed to load courses. Please check your database connection.");
    } finally {
      setIsLoading(false);
    }
  }

  async function updateStatus(id, newStatus) {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setCourses(courses.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  }

  const columns = [
    { header: "Course Title", accessor: "title", render: (row) => (
      <div className="font-medium text-[#f2f4ef]">{row.title}</div>
    ) },
    { header: "Instructor", accessor: "instructorName", render: (row) => (
      <span className="text-sm text-[#f2f4ef]">{row.instructorName}</span>
    ) },
    { header: "Skill", accessor: "skillName", render: (row) => (
      <span className="text-sm text-[#a1a1aa]">{row.skillName}</span>
    ) },
    { header: "Students", accessor: "students", render: (row) => (
      <span className="text-sm text-[#f2f4ef]">{row.students}</span>
    ) },
    { header: "Price", accessor: "price_credits", render: (row) => (
      <span className="font-mono text-sm text-[#c7ff39]">{row.price_credits} SS</span>
    ) },
    { header: "Status", accessor: "status", render: (row) => (
      <AdminStatusBadge status={row.status} />
    ) },
    { header: "Created", accessor: "created", render: (row) => (
      <span className="text-sm text-[#a1a1aa]">{row.created}</span>
    ) },
    { header: "Actions", accessor: "actions", render: (row) => (
      <div className="flex items-center justify-end gap-2">
        {row.status === 'Pending' && (
          <>
            <button onClick={() => updateStatus(row.id, 'Active')} className="text-xs font-medium text-[#c7ff39] hover:underline">Approve</button>
            <button onClick={() => updateStatus(row.id, 'Suspended')} className="text-xs font-medium text-[#ff6b6b] hover:underline">Reject</button>
          </>
        )}
        {row.status === 'Active' && (
          <button onClick={() => updateStatus(row.id, 'Suspended')} className="text-xs font-medium text-[#ff6b6b] hover:underline">Suspend</button>
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
            Courses
          </h1>
          <p className="text-sm text-[#a1a1aa]">
            Manage published and pending courses available on SkillSwap+.
          </p>
        </div>
        
        <button className="h-10 px-4 bg-[#c7ff39] text-[#071008] font-semibold hover:bg-[#d2ff64] rounded-md transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-2 focus:ring-offset-[#060807]">
          Create Course
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
          title="ALL COURSES"
          columns={columns}
          data={courses}
          searchPlaceholder="Search courses..."
        />
      )}
      
    </div>
  );
}
