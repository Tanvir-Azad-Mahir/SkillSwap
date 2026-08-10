export default function ProfileSetupProgress({
  steps,
  currentStep,
  onStepClick,
}) {
  return (
    <aside className="lg:sticky lg:top-28 lg:self-start">
      <p className="mb-7 text-xs uppercase tracking-[0.18em] text-[#a1a1aa]">
        <span className="mr-2 inline-block h-1.5 w-1.5 bg-[#c7ff39]" />
        / PROFILE SETUP
      </p>

      <h2 className="max-w-sm text-[40px] font-medium leading-[0.98] tracking-[-0.045em] md:text-5xl lg:text-[3.8rem]">
        Build a profile
        <br />
        people want to
        <br />
        <span className="text-[#a1a1aa]">swap with.</span>
      </h2>

      <p className="mt-6 max-w-sm text-sm leading-6 text-[#a1a1aa] md:text-base">
        Show what you can teach, what you want to learn, and what you’re
        working toward. SkillSwap+ uses this information to surface better
        exchanges.
      </p>

      <div className="mt-9 border-t border-white/10">
        {steps.map((item, index) => {
          const active = index === currentStep;
          const complete = index < currentStep;
          const clickable = index <= currentStep;

          return (
            <button
              key={item.number}
              type="button"
              onClick={() => clickable && onStepClick(index)}
              className={`grid w-full grid-cols-[46px_1fr_auto] items-center border-b border-white/10 py-4 text-left transition ${
                clickable ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <span
                className={`font-mono text-xs ${
                  active || complete ? "text-[#c7ff39]" : "text-white/25"
                }`}
              >
                {item.number}
              </span>

              <span
                className={`text-sm ${
                  active ? "text-white" : "text-[#a1a1aa]"
                }`}
              >
                {item.label}
              </span>

              <span
                className={`h-1.5 w-1.5 ${
                  active || complete ? "bg-[#c7ff39]" : "bg-white/10"
                }`}
              />
            </button>
          );
        })}
      </div>
    </aside>
  );
}
