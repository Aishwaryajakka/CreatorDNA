import { useId } from "react";

type LogoVariant = "light" | "dark";

export function CreatorDNALogo({
  variant,
  showIcon = true,
  showTagline = true,
  className = "h-full w-full",
}: {
  variant: LogoVariant;
  showIcon?: boolean;
  showTagline?: boolean;
  className?: string;
}) {
  const glowId = useId().replace(/:/g, "");
  const dark = variant === "dark";
  const viewBox = showIcon
    ? showTagline
      ? "0 0 1200 300"
      : "0 0 900 280"
    : showTagline
      ? "290 55 700 175"
      : "290 55 590 125";

  return (
    <svg
      viewBox={viewBox}
      className={className}
      role="img"
      aria-label="Creator DNA — Your stories. A brighter tomorrow."
      preserveAspectRatio="xMinYMid meet"
    >
      {dark ? (
        <defs>
          <filter id={glowId} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      ) : null}
      {showIcon ? (
        <g transform="translate(38 38)">
          <rect
            width="224"
            height="224"
            rx="52"
            fill={dark ? "#0E1726" : "#F8FAFC"}
            stroke={dark ? "#172338" : "#D8E1EC"}
            strokeWidth="4"
          />
          <g transform="translate(18 18) scale(1.88)">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill={dark ? "#0B1120" : "#FFFFFF"}
              stroke="#155EEF"
              strokeWidth="2.5"
            />
            <path
              d="M30 26C45 26 55 42 70 42C85 42 85 58 70 58C55 58 45 74 30 74"
              fill="none"
              stroke="#155EEF"
              strokeLinecap="round"
              strokeWidth="4"
            />
            <path
              d="M70 26C55 26 45 42 30 42C15 42 15 58 30 58C45 58 55 74 70 74"
              fill="none"
              stroke="#36D6C5"
              strokeLinecap="round"
              strokeWidth="4"
              opacity={dark ? 0.85 : 0.95}
            />
            <circle
              cx="70"
              cy="26"
              r="7"
              fill="#E8F31A"
              filter={dark ? `url(#${glowId})` : undefined}
            />
            <circle cx="30" cy="26" r="6" fill="#FFD83D" />
            <circle cx="50" cy="42" r="5" fill="#31D158" />
            <circle cx="70" cy="58" r="6" fill="#155EEF" />
            <circle cx="30" cy="58" r="7" fill="#36D6C5" />
            <circle cx="50" cy="74" r="6" fill="#E8F31A" />
          </g>
        </g>
      ) : null}
      <text
        x="310"
        y="153"
        fontFamily="var(--font-display)"
        fontSize="106"
        fontWeight="700"
        letterSpacing="-4"
        fill={dark ? "#FFFFFF" : "#0B1120"}
      >
        Creator
      </text>
      <text
        x="688"
        y="153"
        fontFamily="var(--font-display)"
        fontSize="106"
        fontWeight="900"
        letterSpacing="-4"
        fill={dark ? "#E8F31A" : "#155EEF"}
      >
        DNA
      </text>
      {showTagline ? (
        <text
          x="316"
          y="207"
          fontFamily="var(--font-mono)"
          fontSize="22"
          fontWeight="700"
          letterSpacing="4.2"
          fill={dark ? "#94A3B8" : "#526174"}
        >
          YOUR STORIES. A BRIGHTER TOMORROW.
        </text>
      ) : null}
    </svg>
  );
}

export function AdaptiveCreatorDNALogo({
  showIcon = true,
  showTagline = true,
  className = "h-14 w-56",
}: {
  showIcon?: boolean;
  showTagline?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-grid shrink-0 ${className}`}>
      <CreatorDNALogo
        variant="light"
        showIcon={showIcon}
        showTagline={showTagline}
        className="col-start-1 row-start-1 h-full w-full dark:hidden"
      />
      <CreatorDNALogo
        variant="dark"
        showIcon={showIcon}
        showTagline={showTagline}
        className="col-start-1 row-start-1 hidden h-full w-full dark:block"
      />
    </span>
  );
}

export function CreatorDNAIcon({
  variant = "dark",
  className = "h-10 w-10",
}: {
  variant?: LogoVariant;
  className?: string;
}) {
  const dark = variant === "dark";
  const id = useId().replace(/:/g, "");
  const surface = `${id}-surface`;
  const edge = `${id}-edge`;
  const strandBlue = `${id}-strand-blue`;
  const strandAqua = `${id}-strand-aqua`;
  const softGlow = `${id}-soft-glow`;
  const nodeGlow = `${id}-node-glow`;
  const tile = `${id}-tile`;

  return (
    <svg
      viewBox="0 0 1024 1024"
      className={className}
      role="img"
      aria-label="Creator DNA"
    >
      <defs>
        <radialGradient id={surface} cx="42%" cy="32%" r="82%">
          <stop offset="0" stopColor={dark ? "#182D4D" : "#FFFFFF"} />
          <stop offset="0.52" stopColor={dark ? "#0B1120" : "#F8FAF5"} />
          <stop offset="1" stopColor={dark ? "#050811" : "#E7EEF6"} />
        </radialGradient>
        <linearGradient id={edge} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#155EEF" />
          <stop offset="0.52" stopColor="#36D6C5" />
          <stop offset="1" stopColor="#E8F31A" />
        </linearGradient>
        <linearGradient id={strandBlue} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#155EEF" />
          <stop offset="1" stopColor="#4385FF" />
        </linearGradient>
        <linearGradient id={strandAqua} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#36D6C5" />
          <stop offset="1" stopColor="#19BBAA" />
        </linearGradient>
        <filter id={softGlow} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="22" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={nodeGlow} x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={tile}>
          <rect x="32" y="32" width="960" height="960" rx="224" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${tile})`}>
        <rect
          x="32"
          y="32"
          width="960"
          height="960"
          rx="224"
          fill={`url(#${surface})`}
        />
        <circle
          cx="282"
          cy="228"
          r="330"
          fill="#155EEF"
          opacity=".13"
          filter={`url(#${softGlow})`}
        />
        <circle
          cx="802"
          cy="782"
          r="310"
          fill="#36D6C5"
          opacity=".11"
          filter={`url(#${softGlow})`}
        />
        <path
          d="M72 742L336 1006M688 22L980 314"
          stroke="#36D6C5"
          strokeWidth="2"
          opacity=".12"
        />
        <path
          d="M20 376L376 20M648 1004L1004 648"
          stroke="#155EEF"
          strokeWidth="2"
          opacity=".13"
        />
      </g>
      <rect
        x="44"
        y="44"
        width="936"
        height="936"
        rx="212"
        fill="none"
        stroke={`url(#${edge})`}
        strokeWidth="9"
        opacity=".9"
      />
      <circle
        cx="512"
        cy="512"
        r="326"
        fill={dark ? "#08101D" : "#FFFFFF"}
        stroke={dark ? "#1E304F" : "#D8E1EC"}
        strokeWidth="10"
      />
      <circle
        cx="512"
        cy="512"
        r="304"
        fill="none"
        stroke={`url(#${edge})`}
        strokeWidth="8"
        opacity=".75"
      />
      <g filter={`url(#${softGlow})`}>
        <path
          d="M350 304C446 304 482 434 674 434C800 434 800 590 674 590C482 590 446 720 350 720"
          fill="none"
          stroke={`url(#${strandBlue})`}
          strokeLinecap="round"
          strokeWidth="38"
        />
        <path
          d="M674 304C578 304 542 434 350 434C224 434 224 590 350 590C542 590 578 720 674 720"
          fill="none"
          stroke={`url(#${strandAqua})`}
          strokeLinecap="round"
          strokeWidth="38"
        />
      </g>
      <circle
        cx="674"
        cy="304"
        r="52"
        fill="#E8F31A"
        filter={`url(#${nodeGlow})`}
      />
      <circle cx="350" cy="304" r="44" fill="#FFD83D" />
      <circle cx="512" cy="434" r="38" fill="#31D158" />
      <circle cx="674" cy="590" r="45" fill="#155EEF" />
      <circle
        cx="350"
        cy="590"
        r="52"
        fill="#36D6C5"
        filter={`url(#${nodeGlow})`}
      />
      <circle cx="512" cy="720" r="45" fill="#E8F31A" />
      <g fill={dark ? "#FFFFFF" : "#08204A"} opacity=".36">
        <circle cx="658" cy="286" r="12" />
        <circle cx="336" cy="289" r="10" />
        <circle cx="499" cy="421" r="8" />
        <circle cx="658" cy="574" r="10" />
        <circle cx="332" cy="572" r="12" />
        <circle cx="496" cy="704" r="10" />
      </g>
    </svg>
  );
}

export function AdaptiveCreatorDNAIcon({
  className = "h-10 w-10",
}: {
  className?: string;
}) {
  return (
    <span className={`inline-grid shrink-0 ${className}`}>
      <CreatorDNAIcon
        variant="light"
        className="col-start-1 row-start-1 h-full w-full dark:hidden"
      />
      <CreatorDNAIcon
        variant="dark"
        className="col-start-1 row-start-1 hidden h-full w-full dark:block"
      />
    </span>
  );
}
