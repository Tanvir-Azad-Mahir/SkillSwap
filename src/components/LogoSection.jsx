import TrustedBy from "./TrustedBy";

export default function LogoSection() {
  return (
    <section className="border-b border-white/10 bg-[#080a09]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 md:flex-row md:items-center md:justify-between md:px-8 lg:px-10">
        <span className="text-[10px] uppercase tracking-[0.18em] text-[#c7ff39]">Popular categories</span>
        <TrustedBy />
      </div>
    </section>
  );
}
