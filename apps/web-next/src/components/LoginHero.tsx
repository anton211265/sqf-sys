import React from 'react';

/**
 * Full-bleed login background using the real Synlian brand artwork Tony
 * supplied (apps/web-next/public/synlian-hero.png), with the real login
 * form layered directly on top of the source artwork's own card region —
 * per Tony's direction, using the full image as-is rather than a cropped
 * panel.
 *
 * The overlay box's position/size (left 61.2%, top 30.6%, width 30.5%,
 * height 62.0%) is measured directly from the source PNG's own mockup
 * card so our real card fully masks it regardless of which auth step is
 * showing — content is vertically centered inside a fixed-size, opaque
 * box rather than sized to content, since the email-only step is much
 * shorter than the password+org step and both must fully cover the
 * baked-in mockup text underneath.
 *
 * `children` renders once; positioning switches between a plain centered
 * mobile layout and the image-overlay desktop layout via CSS breakpoints
 * only (no duplicate mount of the form). Desktop treatment needs real
 * width (lg: 1024px+) — narrower "desktop" widths pushed the box off the
 * image's right edge.
 */
const LoginHero: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full bg-[#05102a] overflow-hidden">
      <img
        src="/synlian-hero.png"
        alt="AI-connected trade finance, supply chain finance and cross-border payments over a city skyline, with a Synlian sign-in panel"
        className="hidden lg:block absolute inset-0 w-full h-full object-cover"
      />
      <div
        className="
          flex min-h-screen items-center justify-center p-6
          lg:absolute lg:min-h-0 lg:p-0
          lg:left-[61.2%] lg:top-[30.6%] lg:w-[30.5%] lg:h-[62%]
          lg:bg-[#F2F4F9] lg:rounded-3xl lg:shadow-xl
          lg:flex lg:items-center lg:justify-center lg:p-8
        "
      >
        {children}
      </div>
    </div>
  );
};

export default LoginHero;
