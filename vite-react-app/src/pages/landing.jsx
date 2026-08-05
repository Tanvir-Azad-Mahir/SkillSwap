import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import PopularSkills from "../components/PopularSkills";
import HowItWorks from "../components/HowItWorks";
import MatchCard from "../components/MatchCard";
import FeaturedMembers from "../components/FeaturedMembers";
import WhySkillSwap from "../components/WhySkillSwap";
import Stats from "../components/Stats";
import Testimonials from "../components/Testimonials";
import CTASection from "../components/CTASection";
import CommunityPulse from "../components/CommunityPulse";
import TrustedBy from "../components/TrustedBy";
import Footer from "../components/Footer";

export default function Landing() {
  return (
    <div className="font-sans antialiased text-slate-900">
      <Navbar />
      <Hero />
      <CommunityPulse />
      <PopularSkills />
      <TrustedBy />
      <HowItWorks />

      <section className="bg-[#F8FAFC] py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-10 shadow-2xl shadow-slate-900/5">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#2F6FED]">
                Match example
              </p>
              <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B1B33]">
                Find the perfect swap for your next project.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-600">
                See how Skill Swap+ pairs learners and teachers with complementary skills, so every exchange creates growth.
              </p>
            </div>
            <div className="mt-12">
              <MatchCard
                you={{ label: "You", name: "You", teaches: "Web Development", wants: "Graphic Design" }}
                match={{ label: "Perfect Match", name: "Ayesha", teaches: "Graphic Design", wants: "Web Development" }}
                percent={95}
              />
            </div>
          </div>
        </div>
      </section>

      <FeaturedMembers />
      <WhySkillSwap />
      <Stats />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  );
}
