export default function AuthInput({
  id,
  label,
  icon: Icon,
  error,
  rightControl,
  className = "",
  ...inputProps
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-[#f2f4ef]"
      >
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            size={17}
            strokeWidth={1.6}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a1a1aa]"
            aria-hidden="true"
          />
        )}

        <input
          id={id}
          className={`min-h-[52px] w-full rounded-md border bg-[#060807] text-[#f2f4ef] outline-none transition placeholder:text-white/25 hover:border-white/25 focus:border-[#c7ff39]/70 focus:ring-1 focus:ring-[#c7ff39]/30 ${
            Icon ? "pl-11" : "pl-4"
          } ${rightControl ? "pr-12" : "pr-4"} ${
            error ? "border-[#ff6b6b]/70" : "border-white/15"
          }`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...inputProps}
        />

        {rightControl && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {rightControl}
          </div>
        )}
      </div>

      {error && (
        <p id={`${id}-error`} className="mt-2 text-xs leading-5 text-[#ff6b6b]">
          {error}
        </p>
      )}
    </div>
  );
}
