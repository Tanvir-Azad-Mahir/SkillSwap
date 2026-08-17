import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import AdminDataTable from "../../components/admin/AdminDataTable";
import { supabase } from "../../lib/supabase";

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ss_transactions')
        .select(`
          *,
          user:user_id(full_name)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setTransactions(data.map(trx => ({
        ...trx,
        userName: trx.user?.full_name || 'Unknown',
        amountFormatted: trx.amount > 0 ? `+${trx.amount} SS` : `${trx.amount} SS`,
        isPositive: trx.amount > 0,
        date: new Date(trx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      })));
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Failed to load transactions. Please check your database connection.");
    } finally {
      setIsLoading(false);
    }
  }

  const columns = [
    { header: "Transaction ID", accessor: "id", render: (row) => (
      <span className="font-mono text-xs text-[#a1a1aa] bg-white/[0.03] px-1.5 py-0.5 rounded">{row.id}</span>
    ) },
    { header: "User", accessor: "userName", render: (row) => (
      <span className="text-sm text-[#f2f4ef] font-medium">{row.userName}</span>
    ) },
    { header: "Amount", accessor: "amountFormatted", render: (row) => (
      <span className={`font-mono text-sm font-medium ${row.isPositive ? 'text-[#c7ff39]' : 'text-[#ff6b6b]'}`}>
        {row.amountFormatted}
      </span>
    ) },
    { header: "Type", accessor: "type", render: (row) => (
      <span className="text-sm text-[#a1a1aa]">{row.type}</span>
    ) },
    { header: "Reference", accessor: "reference_id", render: (row) => (
      <span className="font-mono text-xs text-[#a1a1aa] bg-white/[0.03] px-1.5 py-0.5 rounded">{row.reference_id || '-'}</span>
    ) },
    { header: "Date", accessor: "date", render: (row) => (
      <span className="text-sm text-[#a1a1aa] whitespace-nowrap">{row.date}</span>
    ) }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium tracking-[-0.04em] text-[#f2f4ef] mb-2">
            Global Transactions
          </h1>
          <p className="text-sm text-[#a1a1aa]">
            A complete ledger of every SS Credit transaction across the platform.
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
          title="TRANSACTION LEDGER"
          columns={columns}
          data={transactions}
          searchPlaceholder="Search by ID or reference..."
        />
      )}
      
    </div>
  );
}
