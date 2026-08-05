export default function SkillCard({ icon: Icon, name, count }) {
  return (
    <a
      href="#"
      className="group bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-[#EEF4FF] flex items-center justify-center group-hover:bg-[#2F6FED] transition-colors">
        <Icon className="w-5 h-5 text-[#2F6FED] group-hover:text-white transition-colors" strokeWidth={2} />
      </div>
      <p className="mt-4 font-semibold text-[#0B1B33]">{name}</p>
      <p className="text-sm text-slate-500 mt-1">{count} members</p>
    </a>
  );
}
