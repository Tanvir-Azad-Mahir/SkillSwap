const values = [
  ["01", "Share your skills"],
  ["02", "Find the right match"],
  ["03", "Learn through exchange"],
];

export default function SignupIntro({ visible }) {
  return (
    <section
      className={`reveal ${visible ? "is-visible" : ""} flex items-center lg:pr-12`}
      aria-labelledby="signup-intro-title"
    >
      <div className="w-full py-12 lg:py-0">
        <div className="mb-8 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[#a1a1aa]">
          <span className="h-1.5 w-1.5 bg-[#c7ff39]" aria-hidden="true" />
          / Create account
        </div>

        <h1
          id="signup-intro-title"
          className="max-w-[680px] text-[42px] font-medium leading-[0.98] tracking-[-0.045em] text-[#f2f4ef] md:text-6xl lg:text-[4.75rem]"
        >
          Learn something.
          <br />
          Teach something.
          <br />
          <span className="text-[#a1a1aa]">Grow together.</span>
        </h1>

        <p className="mt-8 max-w-md text-base leading-7 text-[#a1a1aa] md:text-lg">
          Join a community where knowledge is the currency. Share what you know,
          discover people with the skills you want, and start meaningful
          one-to-one exchanges.
        </p>

        <div className="mt-12 hidden max-w-md border-t border-white/10 md:block">
          {values.map(([number, label]) => (
            <div
              key={number}
              className="grid grid-cols-[48px_1fr] border-b border-white/10 py-4 text-sm"
            >
              <span className="font-medium text-[#c7ff39]">{number}</span>
              <span className="text-[#a1a1aa]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
