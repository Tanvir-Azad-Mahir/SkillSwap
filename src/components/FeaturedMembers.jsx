import UserCard from "./UserCard";

const MAYA = "https://akpcainfbirpjvexinzt.supabase.co/storage/v1/object/sign/image/The%20Deep.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xZDM3MGYyYy02Nzk4LTQ3MjItOWNmYy1lNmFlOWE0YTU1YzUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZS9UaGUgRGVlcC5qcGciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg2MTMwMjY1LCJleHAiOjE4MTc2NjYyNjV9.j0fe_E9gqsYFf_nt3QxrYaxIRHr6zhVNTA3tjYQznsI";

export default function FeaturedMembers() {
  return (
    <section id="community" className="border-y border-white/10 bg-[#080a09] py-28 md:py-36 lg:py-40">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 md:px-8 lg:grid-cols-2 lg:items-center lg:px-10">
        <div className="reveal max-w-lg">
          <UserCard image={MAYA} name="The Deep" role="Lord of Seven Seas · SkillSwap member">
            <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-300">Swapped over 20 skills · Learning conversational Japanese</p>
          </UserCard>
        </div>
        <div className="reveal" style={{ transitionDelay: "90ms" }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c7ff39]">/ Community</p>
          <h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.045em] text-white md:text-5xl">Senior thinking. Beginner energy. Same table.</h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-zinc-400">The best exchanges happen when people can be expert and beginner at the same time. SkillSwap+ makes that normal.</p>
          <blockquote className="mt-8 max-w-xl border-l border-[#c7ff39] pl-6 text-xl leading-8 text-zinc-200">
            “I can help someone understand product design on Tuesday and be the complete beginner in a language session on Thursday.”
          </blockquote>
        </div>
      </div>
    </section>
  );
}
