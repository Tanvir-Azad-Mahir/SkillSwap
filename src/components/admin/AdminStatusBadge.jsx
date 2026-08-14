export default function AdminStatusBadge({ status }) {
  const getStatusStyles = (status) => {
    const s = status?.toLowerCase() || '';
    
    switch (s) {
      case 'active':
      case 'completed':
      case 'resolved':
      case 'verified':
        return 'border-[#c7ff39]/25 bg-[#c7ff39]/[0.06] text-[#c7ff39]';
      case 'pending':
      case 'under review':
        return 'border-amber-500/25 bg-amber-500/[0.06] text-amber-500';
      case 'suspended':
      case 'cancelled':
      case 'dismissed':
      case 'rejected':
        return 'border-[#ff6b6b]/25 bg-[#ff6b6b]/[0.06] text-[#ff6b6b]';
      default:
        return 'border-white/15 bg-white/[0.03] text-[#a1a1aa]';
    }
  };

  return (
    <span className={`px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.06em] rounded-sm border whitespace-nowrap ${getStatusStyles(status)}`}>
      {status}
    </span>
  );
}
