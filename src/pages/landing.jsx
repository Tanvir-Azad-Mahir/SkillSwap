import { useEffect } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Stats from "../components/Stats";
import PopularSkills from "../components/PopularSkills";
import WhySkillSwap from "../components/WhySkillSwap";
import HowItWorks from "../components/HowItWorks";
import FeaturedMembers from "../components/FeaturedMembers";
import Testimonials from "../components/Testimonials";
import CTASection from "../components/CTASection";
import Footer from "../components/Footer";

export default function Landing() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 }
    );

    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#060807] text-[#f2f4ef] antialiased">
      <Navbar />
      <Hero />
      <Stats />
      <PopularSkills />
      <WhySkillSwap />
      <HowItWorks />
      <FeaturedMembers />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  );
}
