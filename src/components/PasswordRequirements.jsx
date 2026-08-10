import { Check } from "lucide-react";

export default function PasswordRequirements({ password }) {
  const requirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase character", met: /[A-Z]/.test(password) },
    { label: "One number", met: /\d/.test(password) },
  ];

  return (
    <div className="mt-3" aria-live="polite">
      <p className="mb-2 text-xs text-[#a1a1aa]">Password must contain:</p>
      <div className="grid gap-1.5 sm:grid-cols-3">
        {requirements.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-1.5 text-[11px] leading-4 ${
              item.met ? "text-[#c7ff39]" : "text-[#a1a1aa]"
            }`}
          >
            <span
              className={`grid h-4 w-4 shrink-0 place-items-center border ${
                item.met
                  ? "border-[#c7ff39]/60 bg-[#c7ff39]/10"
                  : "border-white/15"
              }`}
              aria-hidden="true"
            >
              {item.met && <Check size={11} strokeWidth={2.2} />}
            </span>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
