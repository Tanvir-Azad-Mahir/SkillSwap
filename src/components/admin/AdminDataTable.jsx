import { Search, Filter, MoreHorizontal } from "lucide-react";

export default function AdminDataTable({ 
  title, 
  columns, 
  data, 
  searchPlaceholder = "Search...", 
  onRowClick 
}) {
  return (
    <div className="bg-[#0a0d0b] border border-white/10 rounded-sm overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-sm font-semibold tracking-wide text-[#f2f4ef] uppercase">{title}</h2>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a1a1aa]" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="w-full h-9 bg-[#060807] border border-white/15 rounded-md pl-9 pr-4 text-sm text-[#f2f4ef] placeholder:text-[#a1a1aa]/60 focus:outline-none focus:border-[#c7ff39]/70 focus:ring-1 focus:ring-[#c7ff39]/30 transition-all"
            />
          </div>
          <button className="h-9 px-3 border border-white/15 bg-[#060807] text-[#f2f4ef] hover:border-white/30 hover:bg-white/[0.03] rounded-md transition-colors flex items-center gap-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-2 focus:ring-offset-[#060807]">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              {columns.map((col, i) => (
                <th key={i} className="px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-[#a1a1aa] font-semibold">
                  {col.header}
                </th>
              ))}
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`border-b border-white/[0.07] hover:bg-white/[0.02] transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-4 py-3 text-sm text-[#f2f4ef] whitespace-nowrap">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <button className="text-[#a1a1aa] hover:text-[#f2f4ef] p-1 rounded hover:bg-white/[0.05] transition-colors focus:outline-none focus:ring-2 focus:ring-[#c7ff39]" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-[#a1a1aa] text-sm">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-white/10 flex items-center justify-between text-sm text-[#a1a1aa]">
        <span>Showing 1 to {Math.min(10, data.length)} of {data.length} results</span>
        <div className="flex gap-1">
          <button className="px-3 py-1 border border-white/10 rounded hover:bg-white/[0.03] hover:text-[#f2f4ef] transition-colors disabled:opacity-50" disabled>Previous</button>
          <button className="px-3 py-1 border border-white/10 rounded hover:bg-white/[0.03] hover:text-[#f2f4ef] transition-colors">Next</button>
        </div>
      </div>
    </div>
  );
}
