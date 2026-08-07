import SkillCard from "./SkillCard";

const ASTER = "https://akpcainfbirpjvexinzt.supabase.co/storage/v1/object/sign/image/frontend.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xZDM3MGYyYy02Nzk4LTQ3MjItOWNmYy1lNmFlOWE0YTU1YzUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZS9mcm9udGVuZC5qcGciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg2MTI4OTQxLCJleHAiOjE4MTc2NjQ5NDF9.HQSgnT2ppAL7CqMAq57fG8j8J1m1yL3Wxb_lAFcyRqU";
const LUMA = "https://akpcainfbirpjvexinzt.supabase.co/storage/v1/object/sign/image/videoediting.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xZDM3MGYyYy02Nzk4LTQ3MjItOWNmYy1lNmFlOWE0YTU1YzUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZS92aWRlb2VkaXRpbmcuanBnIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4NjEyODY2MCwiZXhwIjoxODE3NjY0NjYwfQ.cvqHUNLGHuNJn0RECfg-OC4XgqZ_bv0rhgx2xoJiB4I";
const FIELD = "https://akpcainfbirpjvexinzt.supabase.co/storage/v1/object/sign/image/Logo%20Design.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xZDM3MGYyYy02Nzk4LTQ3MjItOWNmYy1lNmFlOWE0YTU1YzUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZS9Mb2dvIERlc2lnbi5qcGciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg2MTI5Njk1LCJleHAiOjE4MTc2NjU2OTV9.x6zN5B0xjNxsHCn_Lwip412slqmhM4hVuwWyD8XYOYo";

export default function PopularSkills() {
  return (
    <section id="discover" className="relative py-28 md:py-36 lg:py-40">
      <div className="noise absolute inset-0 -z-10 opacity-30" />
      <div className="mx-auto max-w-7xl px-5 md:px-8 lg:px-10">
        <div className="reveal mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c7ff39]">/ Popular exchanges</p>
            <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.045em] text-white md:text-5xl">Skills people are trading right now.</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-zinc-400">Browse real skill categories and connect with people who can teach what you want to learn.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <SkillCard
            image={ASTER}
            eyebrow="Featured exchange"
            title="Product design ↔ Front-end development"
            description="Pair a strong visual thinker with a builder. Swap practical sessions, critique work, and ship something together."
            large
            className="reveal lg:col-span-2"
          />
          <SkillCard
            image={LUMA}
            eyebrow="Creative skills"
            title="Photography ↔ Video editing"
            description="Learn faster through focused practice sessions with someone who wants exactly what you can teach."
            className="reveal"
          />
          <SkillCard
            image={FIELD}
            eyebrow="Career skills"
            title="English speaking ↔ Digital marketing"
            description="Build confidence, practice live, and exchange useful feedback in a simple one-to-one format."
            className="reveal"
          />
        </div>
      </div>
    </section>
  );
}
