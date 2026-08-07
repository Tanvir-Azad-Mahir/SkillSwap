export default function TrustedBy() {
  const items = ["Design", "Development", "Languages", "Photography", "Marketing"];
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-[0.14em] text-zinc-500">
      {items.map((item) => <span key={item}>{item}</span>)}
    </div>
  );
}
