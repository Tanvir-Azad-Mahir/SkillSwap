import TestimonialCard from "./TestimonialCard";

const TESTIMONIALS = [
  {
    name: "Maya Rahman",
    initials: "MR",
    color: "#2F6FED",
    quote: "I taught Photoshop and learned Python in return. Skill Swap+ made learning feel completely different.",
  },
  {
    name: "Carlos Mendes",
    initials: "CM",
    color: "#16A34A",
    quote: "Found a mentor for React in two days and taught Spanish in exchange. No fees, just a fair trade.",
  },
  {
    name: "Aiko Tanaka",
    initials: "AT",
    color: "#F59E0B",
    quote: "The match system actually works — my first swap partner turned into a long-term study buddy.",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-[#F8FAFC] py-24">
      <div className="w-full px-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1B33] tracking-tight text-center">
          Real People. Real Skills. Real Growth.
        </h2>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.name} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}
