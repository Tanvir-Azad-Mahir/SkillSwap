import React, { useEffect, useState, useRef } from 'react';

const StatsCounter = ({ stats }) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} className="bg-navy rounded-3xl p-10 md:p-14">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`text-center ${isVisible ? 'animate-count-up' : 'opacity-0'}`}
            style={{ animationDelay: `${index * 0.2}s` }}
          >
            <div className="text-3xl md:text-4xl font-extrabold text-white mb-2">
              {stat.value}
            </div>
            <div className="text-emerald-400 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsCounter;