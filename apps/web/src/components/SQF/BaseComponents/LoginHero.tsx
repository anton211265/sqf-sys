import React from 'react';

/**
 * Decorative split-screen panel for the login page: a low-poly mosaic
 * skyline referencing KLCC's twin towers, laid over a finance growth
 * chart and a loose AI/graph-network constellation. Pure SVG so it stays
 * self-contained (no image assets to host) and picks up the Mantine
 * theme's primary/navy colors via the CSS custom properties Mantine
 * injects (--mantine-color-{name}-{shade}).
 */
const LoginHero: React.FC = () => {
  return (
    <div className="hidden md:block md:w-[44%] lg:w-[40%] relative overflow-hidden">
      <svg
        viewBox="0 0 600 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        role="img"
        aria-label="Illustration of the Kuala Lumpur skyline over a rising trend line and a connected data network"
      >
        <defs>
          <linearGradient id="heroBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--mantine-color-navy-6)" />
            <stop offset="65%" stopColor="var(--mantine-color-navy-7)" />
            <stop offset="100%" stopColor="var(--mantine-color-primary-8)" />
          </linearGradient>
          <pattern id="heroMosaic" width="64" height="56" patternUnits="userSpaceOnUse">
            <polygon points="0,0 32,28 0,56" fill="var(--mantine-color-primary-6)" opacity="0.05" />
            <polygon points="64,0 32,28 64,56" fill="var(--mantine-color-primary-4)" opacity="0.04" />
            <polygon points="0,0 32,28 64,0" fill="var(--mantine-color-navy-3)" opacity="0.05" />
            <polygon points="0,56 32,28 64,56" fill="var(--mantine-color-primary-3)" opacity="0.035" />
          </pattern>
          <filter id="heroGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x="0" y="0" width="600" height="900" fill="url(#heroBg)" />
        <rect x="0" y="0" width="600" height="900" fill="url(#heroMosaic)" />

        {/* AI / graph-network constellation in the sky */}
        <g stroke="var(--mantine-color-primary-3)" strokeWidth="0.75" opacity="0.3">
          <line x1="80" y1="120" x2="150" y2="90" />
          <line x1="150" y1="90" x2="210" y2="130" />
          <line x1="150" y1="90" x2="120" y2="180" />
          <line x1="420" y1="80" x2="480" y2="130" />
          <line x1="480" y1="130" x2="440" y2="190" />
          <line x1="480" y1="130" x2="540" y2="110" />
          <line x1="210" y1="130" x2="330" y2="70" />
          <line x1="330" y1="70" x2="420" y2="80" />
        </g>
        <g fill="var(--mantine-color-primary-2)">
          <circle cx="80" cy="120" r="2.5" opacity="0.6" />
          <circle cx="210" cy="130" r="2.5" opacity="0.6" />
          <circle cx="120" cy="180" r="2.5" opacity="0.5" />
          <circle cx="420" cy="80" r="2.5" opacity="0.6" />
          <circle cx="440" cy="190" r="2.5" opacity="0.5" />
          <circle cx="540" cy="110" r="2.5" opacity="0.55" />
        </g>
        <g fill="var(--mantine-color-primary-1)">
          <circle cx="150" cy="90" r="3.5" filter="url(#heroGlow)" opacity="0.85" />
          <circle cx="330" cy="70" r="3.5" filter="url(#heroGlow)" opacity="0.85" />
          <circle cx="480" cy="130" r="3.5" filter="url(#heroGlow)" opacity="0.85" />
        </g>

        {/* KLCC-referencing twin towers, stacked-tier low-poly silhouette */}
        {[255, 345].map((cx, twinIdx) => {
          const baseY = 760;
          const tierHeight = 70;
          const tierCount = 7;
          const tiers = Array.from({ length: tierCount }, (_, i) => {
            const halfWidth = 40 - i * 5;
            const yBottom = baseY - i * tierHeight;
            const yTop = baseY - (i + 1) * tierHeight;
            return { halfWidth, yBottom, yTop };
          });
          const topY = tiers[tierCount - 1].yTop;
          return (
            <g key={cx}>
              {tiers.map((t, i) => (
                <rect
                  key={i}
                  x={cx - t.halfWidth}
                  y={t.yTop}
                  width={t.halfWidth * 2}
                  height={t.yBottom - t.yTop}
                  fill={
                    ['var(--mantine-color-navy-4)', 'var(--mantine-color-primary-6)', 'var(--mantine-color-primary-5)'][
                      i % 3
                    ]
                  }
                  opacity={0.9}
                  stroke="var(--mantine-color-primary-1)"
                  strokeOpacity="0.2"
                  strokeWidth="1"
                />
              ))}
              {/* spire */}
              <line x1={cx} y1={topY} x2={cx} y2={topY - 90} stroke="var(--mantine-color-primary-2)" strokeWidth="2" opacity="0.8" />
              <circle cx={cx} cy={topY - 92} r="3.5" fill="var(--mantine-color-primary-1)" filter="url(#heroGlow)" opacity={twinIdx === 0 ? 0.9 : 0.7} />
            </g>
          );
        })}
        {/* skybridge */}
        <rect x="280" y="497" width="40" height="16" fill="var(--mantine-color-navy-2)" opacity="0.6" />

        {/* Finance growth chart along the base */}
        <g>
          {[
            { x: 44, h: 26 },
            { x: 96, h: 34 },
            { x: 148, h: 30 },
            { x: 200, h: 46 },
            { x: 252, h: 40 },
            { x: 400, h: 52 },
            { x: 452, h: 66 },
            { x: 504, h: 60 },
            { x: 556, h: 78 },
          ].map((bar, i) => (
            <rect
              key={i}
              x={bar.x}
              y={800 - bar.h}
              width="14"
              height={bar.h}
              rx="1.5"
              fill="var(--mantine-color-teal-4)"
              opacity="0.55"
            />
          ))}
          <polyline
            points="51,774 103,766 155,770 207,754 259,760 407,748 459,734 511,740 563,722"
            fill="none"
            stroke="var(--mantine-color-teal-3)"
            strokeWidth="2"
            opacity="0.85"
          />
        </g>
        <line x1="30" y1="800" x2="570" y2="800" stroke="var(--mantine-color-primary-3)" strokeWidth="1" opacity="0.25" />
      </svg>

      <div className="absolute inset-0 flex flex-col justify-end p-10 pb-14">
        <p
          style={{
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontWeight: 400,
            letterSpacing: '0.06em',
            fontSize: 13,
            color: 'var(--mantine-color-primary-2)',
            textTransform: 'uppercase',
            margin: '0 0 8px',
          }}
        >
          SQF.AI · Trade Directory
        </p>
        <p
          style={{
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontWeight: 400,
            fontSize: 22,
            lineHeight: 1.4,
            color: '#FFFFFF',
            margin: 0,
            maxWidth: '30ch',
          }}
        >
          Financing intelligence for Malaysia&rsquo;s trade network.
        </p>
      </div>
    </div>
  );
};

export default LoginHero;
