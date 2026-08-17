import { X } from "lucide-react";
import { useEffect } from "react";

export default function AdminModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  maxWidth = "max-w-md"
}) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#060807]/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full ${maxWidth} bg-[#0a0d0b] border border-white/10 rounded-sm shadow-2xl flex flex-col max-h-[90vh]`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-lg font-medium tracking-[-0.03em] text-[#f2f4ef]">{title}</h2>
          <button 
            onClick={onClose}
            className="text-[#a1a1aa] hover:text-[#f2f4ef] p-1 rounded hover:bg-white/[0.05] transition-colors focus:outline-none focus:ring-2 focus:ring-[#c7ff39]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-5 overflow-y-auto">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="p-5 border-t border-white/10 flex justify-end gap-3 bg-[#0c120d]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
