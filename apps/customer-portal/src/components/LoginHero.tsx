import React from 'react';

/**
 * Full-bleed login background using the real Synlian brand artwork Tony
 * supplied (apps/web-next/public/image.png). Unlike the earlier artwork,
 * this one has no baked-in mockup form — just the wordmark/tagline top
 * right and open dark-blue space below it — so the real card is simply
 * centered in that open space with its own visible card chrome, no
 * position/size masking needed.
 *
 * `children` renders once; positioning switches between a plain centered
 * mobile layout and the image-overlay desktop layout via CSS breakpoints
 * only (no duplicate mount of the form). Desktop treatment needs real
 * width (lg: 1024px+).
 */
const LoginHero: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full bg-[#0a1a3f] overflow-hidden">
      <img
        src="/image.png"
        alt="AI-connected trade finance, supply chain finance and cross-border payments over a city skyline, with the Synlian wordmark"
        className="hidden lg:block absolute inset-0 w-full h-full object-cover"
      />
      <div
        className="
          flex min-h-screen items-center justify-center p-6
          lg:absolute lg:min-h-0 lg:p-0
          lg:left-[60%] lg:top-[30%] lg:w-[35%] lg:h-[68%]
          lg:flex lg:items-center lg:justify-center
        "
      >
        {children}
      </div>
    </div>
  );
};

export default LoginHero;
