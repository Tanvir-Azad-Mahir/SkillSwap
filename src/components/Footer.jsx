export default function Footer() {
  return (
    <footer className="bg-[#060807]">
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 lg:px-10">
        <div className="flex flex-col gap-8 border-b border-white/10 pb-9 md:flex-row md:items-end md:justify-between">
          <a href="#top" className="text-3xl font-black tracking-[-0.05em] text-white md:text-4xl">SKILLSWAP<span className="text-[#c7ff39]">+</span></a>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-500">
            <a href="#discover" className="transition hover:text-white">Discover</a>
            <a href="#how-it-works" className="transition hover:text-white">How it works</a>
            <a href="#community" className="transition hover:text-white">Community</a>
            <a href="#faq" className="transition hover:text-white">FAQ</a>
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-6 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 SkillSwap+. All rights reserved.</p>
          <p>Built for people who still like learning from people.</p>
        </div>
      </div>
    </footer>
  );
}
