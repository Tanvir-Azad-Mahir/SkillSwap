import { useState } from "react";
import TestimonialCard from "./TestimonialCard";

const faqs = [
  ["Do I have to pay to swap skills?", "The core idea is reciprocal learning: you offer useful knowledge or practice in exchange for something you want to learn. You can decide the scope of each exchange with your match."],
  ["What if our skill levels are different?", "That is expected. Profiles make experience levels clear so you can choose a match that fits. A strong exchange only needs clear expectations, not identical expertise."],
  ["How do I know someone is a good match?", "Compare offered skills, learning goals, availability, profile details, and community feedback before sending or accepting a swap request."],
  ["Can I offer more than one skill?", "Yes. Your profile can contain multiple skills you can teach and multiple skills you want to learn, which gives the matching system more useful combinations."],
  ["How long should a skill swap last?", "There is no fixed duration. You can arrange a single focused session or a recurring exchange depending on the skill and what both people agree to."],
];

export default function Testimonials() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="py-28 md:py-36 lg:py-40">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 md:px-8 lg:grid-cols-[.72fr_1.28fr] lg:px-10">
        <div className="reveal">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c7ff39]">/ FAQ</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-white md:text-5xl">Good questions before a good swap.</h2>
        </div>
        <div className="reveal">
          {faqs.map(([question, answer], index) => (
            <TestimonialCard
              key={question}
              question={question}
              answer={answer}
              open={open === index}
              onClick={() => setOpen(open === index ? -1 : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
