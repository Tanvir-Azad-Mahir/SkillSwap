import UserCard from "./UserCard";

const MEMBERS = [
  { name: "Nadia Rahman", location: "Dhaka, BD", rating: "4.9", offers: "Graphic Design", wants: "React Development", percent: 92, initials: "NR", color: "#2F6FED" },
  { name: "Tomás Silva", location: "Lisbon, PT", rating: "4.8", offers: "Photography", wants: "Digital Marketing", percent: 88, initials: "TS", color: "#16A34A" },
  { name: "Priya Nair", location: "Bengaluru, IN", rating: "5.0", offers: "Python", wants: "UI/UX Design", percent: 95, initials: "PN", color: "#F59E0B" },
  { name: "Jonas Weber", location: "Berlin, DE", rating: "4.7", offers: "German Language", wants: "Video Editing", percent: 84, initials: "JW", color: "#0B1B33" },
];

export default function FeaturedMembers() {
  return (
    <section id="community" className="bg-[#F8FAFC] py-24">
      <div className="w-full px-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1B33] tracking-tight text-center">
          Meet People Ready to Swap Skills
        </h2>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {MEMBERS.map((m) => (
            <UserCard key={m.name} {...m} />
          ))}
        </div>
      </div>
    </section>
  );
}
