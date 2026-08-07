export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#060807] px-5 text-[#f2f4ef]">
      <div className="w-full max-w-md border border-white/10 bg-[#080a09] p-7">
        <a href="/" className="text-2xl font-black tracking-[-0.045em]">SKILLSWAP<span className="text-[#c7ff39]">+</span></a>
        <h1 className="mt-10 text-3xl font-semibold tracking-tight">Welcome back.</h1>
        <p className="mt-3 text-sm text-zinc-400">Sign in to continue your skill exchanges.</p>
        <form className="mt-8 space-y-4">
          <input className="min-h-12 w-full border border-white/15 bg-transparent px-4 text-sm outline-none transition focus:border-[#c7ff39]" placeholder="Email" type="email" />
          <input className="min-h-12 w-full border border-white/15 bg-transparent px-4 text-sm outline-none transition focus:border-[#c7ff39]" placeholder="Password" type="password" />
          <button className="min-h-12 w-full bg-[#c7ff39] font-semibold text-[#071008]" type="submit">Sign in</button>
        </form>
      </div>
    </main>
  );
}
