import logo from "../assets/logo.png";

export default function LogoSection({ className = "", labelClass = "", titleClass = "" }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <img src={logo} alt="Skill Swap+" className="h-10 w-10 rounded-2xl object-cover shadow-lg shadow-slate-900/20" />
      <div>
        <p className={`text-xs uppercase tracking-[0.28em] ${labelClass}`}>Skill Swap+</p>
        <p className={`text-lg font-semibold ${titleClass}`}>Your exchange-first skill network</p>
      </div>
    </div>
  );
}
