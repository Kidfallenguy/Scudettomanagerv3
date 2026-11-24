import { useId } from "react";
import { MapPin } from "lucide-react";
import type { Club } from "@/lib/game/types";

function safeColor(color: string, fallback: string) {
  return /^#[\da-f]{3,8}$/i.test(color) ? color : fallback;
}

export function StadiumIllustration({
  club,
  stadium,
}: {
  club: Club;
  stadium: string;
}) {
  const id = useId().replace(/:/g, "");
  const skyId = `stadium-sky-${id}`;
  const standId = `stadium-stand-${id}`;
  const pitchId = `stadium-pitch-${id}`;
  const lightId = `stadium-lights-${id}`;
  const seatsId = `stadium-seats-${id}`;
  const primary = safeColor(club.color, "#b51f31");
  const secondary = safeColor(club.color2, "#e5dfd2");
  const crowd = Array.from({ length: 66 }, (_, index) => {
    const x = 74 + ((index * 83 + club.prestige * 11) % 812);
    const y = 127 + ((index * 37 + (club.capacity % 91)) % 48);
    return { x, y, opacity: 0.22 + ((index * 13) % 45) / 100 };
  });

  return (
    <figure className="stadium-illustration relative isolate overflow-hidden rounded-2xl shadow-[var(--shadow-border)]">
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 960 360"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={`Ilustración nocturna del estadio ${stadium}`}
      >
        <defs>
          <linearGradient
            id={skyId}
            x1="480"
            y1="0"
            x2="480"
            y2="290"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#101923" />
            <stop offset=".7" stopColor="#18212b" />
            <stop offset="1" stopColor="#26302b" />
          </linearGradient>
          <linearGradient
            id={standId}
            x1="480"
            y1="93"
            x2="480"
            y2="285"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor={primary} stopOpacity=".86" />
            <stop offset="1" stopColor="#11151a" />
          </linearGradient>
          <linearGradient
            id={pitchId}
            x1="480"
            y1="236"
            x2="480"
            y2="360"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#35543d" />
            <stop offset="1" stopColor="#1b3023" />
          </linearGradient>
          <radialGradient
            id={lightId}
            cx="0"
            cy="0"
            r="1"
            gradientTransform="matrix(0 244 -365 0 480 30)"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor={secondary} stopOpacity=".34" />
            <stop offset="1" stopColor={secondary} stopOpacity="0" />
          </radialGradient>
          <pattern
            id={seatsId}
            width="29"
            height="17"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M1 3h7v3H1zM15 10h8v3h-8z"
              fill={secondary}
              fillOpacity=".2"
            />
            <path
              d="M10 10h3v3h-3zM25 2h3v3h-3z"
              fill="white"
              fillOpacity=".16"
            />
          </pattern>
        </defs>
        <rect width="960" height="360" fill={`url(#${skyId})`} />
        <rect width="960" height="280" fill={`url(#${lightId})`} />
        <path
          d="M0 150 68 109l40 2 42 43v86H0v-90ZM960 150l-68-41-40 2-42 43v86h150v-90Z"
          fill="#0b1016"
        />
        <path
          d="M132 119Q480 19 828 119l-23 30Q480 66 155 149l-23-30Z"
          fill="#0b1016"
        />
        <path
          d="M57 150Q480 65 903 150v103H57V150Z"
          fill={`url(#${standId})`}
        />
        <path
          d="M57 150Q480 65 903 150v103H57V150Z"
          fill={`url(#${seatsId})`}
        />
        <path
          d="M57 184Q480 105 903 184M57 220Q480 153 903 220"
          fill="none"
          stroke="white"
          strokeOpacity=".17"
          strokeWidth="3"
        />
        <path d="M46 251h868l46 109H0l46-109Z" fill="#141a1e" />
        <path d="M0 280h960v80H0z" fill={`url(#${pitchId})`} />
        <path
          d="m287 280 386 0 84 80H203l84-80Z"
          fill="#a9c798"
          fillOpacity=".09"
        />
        <path
          d="M203 360h554M287 280l-84 80m470-80 84 80M480 280v80"
          stroke="white"
          strokeOpacity=".3"
          strokeWidth="2"
        />
        <circle
          cx="480"
          cy="326"
          r="29"
          fill="none"
          stroke="white"
          strokeOpacity=".27"
          strokeWidth="2"
        />
        <path
          d="m0 0 126 17 160 253H0V0Zm960 0L834 17 674 270h286V0Z"
          fill="white"
          fillOpacity=".025"
        />
        <path
          d="M102 73v57M82 76h40M858 73v57m-20-54h40"
          stroke="#111820"
          strokeWidth="5"
        />
        <path
          d="M79 72h47m-45-6h43m-43 12h43M835 72h47m-45-6h43m-43 12h43"
          stroke={secondary}
          strokeOpacity=".9"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {crowd.map((person, index) => (
          <circle
            key={index}
            cx={person.x}
            cy={person.y}
            r={index % 8 === 0 ? 2.4 : 1.6}
            fill={
              index % 3 === 0
                ? primary
                : index % 5 === 0
                  ? secondary
                  : "#f0e9dd"
            }
            fillOpacity={person.opacity}
          />
        ))}
        <path d="M0 0h960v360H0z" fill="url(#stadium-sky)" fillOpacity=".16" />
        <text
          x="480"
          y="245"
          fill="white"
          fillOpacity=".52"
          fontSize="17"
          fontWeight="800"
          textAnchor="middle"
          letterSpacing="7"
        >
          {club.short}
        </text>
      </svg>
      <figcaption className="stadium-illustration-caption absolute inset-x-0 bottom-0 flex min-h-12 items-end justify-between gap-3 px-4 pb-3 pt-8">
        <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-fg">
          <MapPin className="size-3.5 shrink-0 text-primary" />
          <span className="truncate">{stadium}</span>
        </span>
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-fg-muted">
          Noche de partido
        </span>
      </figcaption>
    </figure>
  );
}
