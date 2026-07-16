import React from 'react';

/**
 * Split-screen login hero using the real Synlian brand artwork Tony
 * supplied (apps/web-next/public/synlian-hero.png, cropped to just the
 * graphic panel — the source image's baked-in mockup form/wordmark were
 * cropped out since this app has its own live wordmark text below and a
 * real functional form, not static pixels).
 *
 * Colors here are sampled directly from the artwork as a stopgap — this
 * is NOT the real design-token pass (still pending, see CLAUDE.md
 * "Planned: Frontend Rebuild"). Swap for real tokens once that lands.
 */
const LoginHero: React.FC = () => {
  return (
    <div className="hidden md:flex md:w-[42%] lg:w-[40%] relative overflow-hidden flex-col bg-[#0a1a3f]">
      <img
        src="/synlian-hero-graphic.png"
        alt="AI-connected trade finance, supply chain finance and cross-border payments over a city skyline"
        className="absolute inset-0 w-full h-full object-cover object-left"
      />
      <div className="relative z-10 mt-auto p-10 pb-14 bg-gradient-to-t from-[#05102a]/90 via-[#05102a]/40 to-transparent">
        <p
          style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 400 }}
          className="text-3xl text-white mb-1"
        >
          synlian
        </p>
        <p
          style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 400 }}
          className="text-sm text-sky-200/80 mb-6"
        >
          Quantum age applications for digital age supply chains
        </p>
        <p
          style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 400 }}
          className="text-lg text-white leading-snug"
        >
          Financial services. Intelligent. Autonomous. Trusted.
        </p>
      </div>
    </div>
  );
};

export default LoginHero;
