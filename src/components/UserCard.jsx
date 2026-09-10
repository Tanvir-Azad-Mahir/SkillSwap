export default function UserCard({ image, name, role, children }) {
  return (
    <div className="user-card group relative overflow-hidden border border-white/10 bg-[#080a09]">
      <img src={image} alt={name} className="aspect-[4/5] h-full w-full object-cover grayscale transition duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.03] group-hover:grayscale-0" />
      <div className="user-card-overlay absolute inset-0 bg-gradient-to-t from-[#060807] via-[#060807]/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-[#c7ff39]">{role}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{name}</p>
        {children}
      </div>
    </div>
  );
}
