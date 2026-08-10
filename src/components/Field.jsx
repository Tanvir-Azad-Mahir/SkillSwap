export default function Field({
  label,
  hint,
  children,
  htmlFor,
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <label htmlFor={htmlFor} className="text-sm font-medium text-[#f2f4ef]">
          {label}
        </label>
        {hint && <span className="text-xs text-[#a1a1aa]">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
