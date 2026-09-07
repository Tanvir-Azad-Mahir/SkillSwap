import { useState, useEffect } from "react";
import { Coins, ArrowUpRight, ArrowDownRight, AlertCircle, X, Gift } from "lucide-react";
import AdminStatCard from "../../components/admin/AdminStatCard";
import AdminDataTable from "../../components/admin/AdminDataTable";
import { supabase } from "../../lib/supabase";

export default function AdminCredits() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Adjust balance modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustReason, setAdjustReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('credit_transactions')
        .select(`
          *,
          user:user_id(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(20); // Only get recent for the dashboard
        
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
      setError("Failed to load transactions.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAdjustBalance(e) {
    e.preventDefault();
    if (!targetUserId.trim() || adjustAmount === 0) return;

    try {
      setIsSubmitting(true);
      
      const { error: insertError } = await supabase
        .from('credit_transactions')
        .insert([{ 
          user_id: targetUserId.trim(),
          amount: parseInt(adjustAmount, 10),
          transaction_type: 'Adjustment',
          description: adjustReason.substring(0, 20) || 'ADMIN'
        }]);

      if (insertError) throw insertError;
      
      setIsModalOpen(false);
      setTargetUserId("");
      setAdjustAmount(0);
      setAdjustReason("");
      fetchTransactions(); // Refresh the list
    } catch (err) {
      console.error("Error adjusting balance:", err);
      alert("Failed to process transaction");
    } finally {
      setIsSubmitting(false);
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
    { header: "Type", accessor: "transaction_type", render: (row) => (
      <span className="text-sm text-[#a1a1aa]">{row.transaction_type}</span>
    ) },
    { header: "Reference", accessor: "description", render: (row) => (
      <span className="font-mono text-xs text-[#a1a1aa] bg-white/[0.03] px-1.5 py-0.5 rounded">{row.description || '-'}</span>
    ) },
    { header: "Date", accessor: "date", render: (row) => (
      <span className="text-sm text-[#a1a1aa]">{row.date}</span>
    ) }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium tracking-[-0.04em] text-[#f2f4ef] mb-2">
            SS Credits Administration
          </h1>
          <p className="text-sm text-[#a1a1aa]">
            Monitor platform economy, credit circulation, and transaction history.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-4 bg-[#0a0d0b] border border-white/15 text-[#f2f4ef] font-medium hover:bg-white/[0.03] rounded-md transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-[#c7ff39]">
            Adjust Balance
          </button>
          <button className="h-10 px-4 bg-[#c7ff39] text-[#071008] font-semibold hover:bg-[#d2ff64] rounded-md transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-2 focus:ring-offset-[#060807]">
            Issue Reward
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard 
          title="Credits in Circulation" 
          value="124,500" 
          trend="up" 
          trendValue="+1,200 this week"
          icon={Coins}
          isImportant={true}
        />
        <AdminStatCard 
          title="Earned Today" 
          value="450" 
          trend="up" 
          trendValue="Avg daily volume"
          icon={ArrowUpRight}
        />
        <AdminStatCard 
          title="Spent Today" 
          value="450" 
          trend="down" 
          trendValue="Avg daily volume"
          icon={ArrowDownRight}
        />
        <AdminStatCard 
          title="Welcome Bonuses" 
          value="3,400" 
          trend="up" 
          trendValue="Issued this month"
          icon={Gift}
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0a0d0b] border border-white/10 w-full max-w-md rounded-md p-6 relative shadow-2xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-[#a1a1aa] hover:text-[#f2f4ef]">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-medium text-[#f2f4ef] mb-6">Manual Credit Adjustment</h2>
            <form onSubmit={handleAdjustBalance}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-2">User UUID</label>
                  <input 
                    type="text" 
                    required
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="w-full h-10 bg-[#060807] border border-white/15 rounded-md px-4 text-sm font-mono text-[#f2f4ef] focus:outline-none focus:border-[#c7ff39]/70 focus:ring-1 focus:ring-[#c7ff39]/30 transition-all"
                    placeholder="Enter user UUID"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-2">Amount (SS)</label>
                  <input 
                    type="number" 
                    required
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="w-full h-10 bg-[#060807] border border-white/15 rounded-md px-4 text-sm font-mono text-[#f2f4ef] focus:outline-none focus:border-[#c7ff39]/70 focus:ring-1 focus:ring-[#c7ff39]/30 transition-all"
                    placeholder="e.g. 50 or -50"
                  />
                  <p className="text-xs text-[#a1a1aa] mt-1">Use negative values to deduct.</p>
                </div>
                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-2">Reason (Optional)</label>
                  <input 
                    type="text" 
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full h-10 bg-[#060807] border border-white/15 rounded-md px-4 text-sm text-[#f2f4ef] focus:outline-none focus:border-[#c7ff39]/70 focus:ring-1 focus:ring-[#c7ff39]/30 transition-all"
                    placeholder="e.g. Refund"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-[#a1a1aa] hover:text-[#f2f4ef]">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[#c7ff39] text-[#071008] text-sm font-semibold rounded hover:bg-[#d2ff64] disabled:opacity-50">
                  {isSubmitting ? 'Processing...' : 'Apply Adjustment'}
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
          title="RECENT TRANSACTION HISTORY"
          columns={columns}
          data={transactions}
          searchPlaceholder="Search history by ID or reference..."
        />
      )}
      
    </div>
  );
}
