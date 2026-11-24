import { useState } from "react";
import { cn } from "@/lib/cn";
import type { Competition, HonourCounts } from "@/lib/game/types";

type TrophyVariant =
  | keyof HonourCounts
  | Competition
  | "balon_oro"
  | "bota_oro"
  | "puskas"
  | "guante_oro"
  | "dt_anio"
  | "kopa"
  | "future";

type LicensedArtwork = {
  src: string;
  alt: string;
  artist: string;
  license: string;
  page: string;
};

const PHOTO_ART: Partial<Record<TrophyVariant, LicensedArtwork>> = {
  ucl: {
    src: "https://upload.wikimedia.org/wikipedia/commons/3/30/2005_Champions_League_trophy_in_Anfield_museum.jpg",
    alt: "Copa de la Champions League expuesta en el museo de Anfield",
    artist: "Jprw",
    license: "CC0",
    page: "https://commons.wikimedia.org/wiki/File:2005_Champions_League_trophy_in_Anfield_museum.jpg",
  },
  libertadores: {
    src: "https://upload.wikimedia.org/wikipedia/commons/0/0a/Trof%C3%A9u_da_Copa_Libertadores_da_Am%C3%A9rica_de_2023.jpg",
    alt: "Trofeo de la Copa Libertadores de América",
    artist: "Alexandre M. B. Berwanger",
    license: "CC0",
    page: "https://commons.wikimedia.org/wiki/File:Trof%C3%A9u_da_Copa_Libertadores_da_Am%C3%A9rica_de_2023.jpg",
  },
  balon_oro: {
    src: "https://upload.wikimedia.org/wikipedia/commons/9/98/2014_Ballon_dOr_CR7Museum2.jpg",
    alt: "Balón de Oro expuesto en un museo",
    artist: "Tkotw12",
    license: "CC BY-SA 4.0",
    page: "https://commons.wikimedia.org/wiki/File:2014_Ballon_dOr_CR7Museum2.jpg",
  },
};

export function TrophyIllustration({
  className,
  variant = "future",
  label = "",
}: {
  className?: string;
  variant?: TrophyVariant;
  label?: string;
}) {
  const isCopaDelRey = variant === "coppa" && /copa del rey/i.test(label);
  const photo = isCopaDelRey
    ? {
        src: "https://upload.wikimedia.org/wikipedia/commons/a/a4/Copa_del_Rey_Trophy.png",
        alt: "Trofeo de la Copa del Rey",
        artist: "MacMoreno",
        license: "CC BY-SA 4.0",
        page: "https://commons.wikimedia.org/wiki/File:Copa_del_Rey_Trophy.png",
      }
    : PHOTO_ART[variant];
  const [failedSrc, setFailedSrc] = useState("");

  if (photo && failedSrc !== photo.src) {
    return (
      <figure className={cn("trophy-photo-frame", className)}>
        <img
          src={photo.src}
          alt={photo.alt}
          className="trophy-photo"
          decoding="async"
          onError={() => setFailedSrc(photo.src)}
        />
        <figcaption className="trophy-photo-credit">
          <a href={photo.page} target="_blank" rel="noreferrer">
            {photo.artist} · {photo.license}
          </a>
        </figcaption>
      </figure>
    );
  }

  return (
    <svg
      viewBox="0 0 160 180"
      role="img"
      aria-label={`${label || variantLabel(variant)}: ilustración`}
      className={cn("trophy-art", className)}
      fill="none"
    >
      <defs>
        <linearGradient id="art-gold" x1="42" y1="20" x2="124" y2="154">
          <stop stopColor="#fff4ad" />
          <stop offset=".34" stopColor="#f5c84b" />
          <stop offset=".68" stopColor="#bd7b12" />
          <stop offset="1" stopColor="#ffe58b" />
        </linearGradient>
        <linearGradient id="art-silver" x1="42" y1="20" x2="124" y2="154">
          <stop stopColor="#f6fbff" />
          <stop offset=".35" stopColor="#aebdca" />
          <stop offset=".68" stopColor="#5f7486" />
          <stop offset="1" stopColor="#e8f0f5" />
        </linearGradient>
        <radialGradient id="art-halo">
          <stop stopColor={artColor(variant)} stopOpacity=".38" />
          <stop offset="1" stopColor={artColor(variant)} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="80" cy="82" rx="76" ry="76" fill="url(#art-halo)" />
      {renderArtwork(variant)}
    </svg>
  );
}

function variantLabel(variant: TrophyVariant) {
  const labels: Partial<Record<TrophyVariant, string>> = {
    ucl: "Champions League",
    libertadores: "Copa Libertadores",
    coppa: "Copa nacional",
    balon_oro: "Balón de Oro",
    bota_oro: "Bota de Oro",
    puskas: "Premio Puskás",
    guante_oro: "Guante de Oro",
    dt_anio: "DT del Año",
    kopa: "Trofeo Kopa",
  };
  return labels[variant] ?? "Trofeo";
}

function artColor(variant: TrophyVariant) {
  if (variant === "ucl") return "#517cff";
  if (variant === "libertadores" || variant === "coppa") return "#d5a545";
  if (variant === "uel") return "#ec8738";
  if (variant === "sudamericana") return "#b98a4d";
  if (variant === "uecl") return "#62b97a";
  if (variant === "carabao") return "#c43b43";
  if (variant === "supercoppa") return "#8bc4d8";
  if (variant === "trofeo") return "#c2a36d";
  if (variant === "balon_oro" || variant === "bota_oro") return "#f5c84b";
  if (variant === "guante_oro") return "#71c9b0";
  if (variant === "puskas") return "#72aaff";
  if (variant === "dt_anio") return "#bd8cf2";
  if (variant === "kopa") return "#ffb47d";
  return "#e9c46a";
}

function renderArtwork(variant: TrophyVariant) {
  if (variant === "balon_oro") {
    return (
      <>
        <path d="m55 121 50-13 18 23-54 16-22-26Z" fill="#765126" />
        <path d="m55 121 50-13 7 9-52 17-5-13Z" fill="url(#art-gold)" />
        <circle
          cx="81"
          cy="67"
          r="38"
          fill="url(#art-gold)"
          stroke="#fff1a6"
          strokeWidth="2"
        />
        <path
          d="m81 34 8 20 21-2-16 14 8 20-21-12-18 15 6-23-18-12 23-2 7-18Z"
          fill="#fff7cf"
          fillOpacity=".78"
        />
        <path d="M44 155h74v10H44z" fill="#80602d" />
      </>
    );
  }

  if (variant === "bota_oro") {
    return (
      <>
        <path
          d="M46 83c14 0 19-10 20-29l24 2c-1 21 10 30 28 37l14 17-13 17-70-3-13-14 10-27Z"
          fill="url(#art-gold)"
          stroke="#fff1a6"
          strokeWidth="2"
        />
        <path
          d="m64 101 54 10M68 112l45 8M72 123l33 6"
          stroke="#805c22"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path d="m41 125 93 2-8 15-73 4-12-10v-11Z" fill="#866324" />
        <path d="M43 150h86v10H43z" fill="url(#art-gold)" />
      </>
    );
  }

  if (variant === "puskas") {
    return (
      <>
        <path d="M47 115h66v36H47z" stroke="#dce8ff" strokeWidth="3" />
        <path
          d="M80 115v36M47 132h16c8 0 12 4 12 19M113 132H97c-8 0-12 4-12 19"
          stroke="#dce8ff"
          strokeWidth="2"
        />
        <circle
          cx="88"
          cy="67"
          r="31"
          fill="#f4f7fb"
          stroke="#72aaff"
          strokeWidth="4"
        />
        <path
          d="m88 48 10 8-4 12-12 2-7-10 5-11Zm-20 26 14-4 8 9-5 14-12 1-9-10Zm34-4 13-2 8 10-6 13-15-2-5-11Z"
          fill="#375889"
        />
        <path
          d="M39 60c16-25 37-35 61-34"
          stroke="#72aaff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="2 9"
        />
        <path
          d="m119 45 5 12 13 1-10 8 3 12-11-7-11 7 3-12-10-8 13-1 5-12Z"
          fill="#fff0a3"
        />
      </>
    );
  }

  if (variant === "guante_oro") {
    return (
      <>
        <path
          d="M62 130c-8-4-12-10-12-20V71c0-7 10-8 12-1l5 17V46c0-8 12-8 12 0v35-43c0-8 12-8 12 0v43-37c0-8 12-8 12 0v42-29c0-8 12-8 12 0v42c0 22-14 37-38 37-7 0-11-2-15-6Z"
          fill="#7bd3b7"
          stroke="#d7fff1"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M54 145h65v13H54z" fill="#366d68" />
        <path d="M47 163h79v8H47z" fill="url(#art-gold)" />
      </>
    );
  }

  if (variant === "dt_anio") {
    return (
      <>
        <rect
          x="40"
          y="35"
          width="80"
          height="102"
          rx="7"
          fill="#26334c"
          stroke="#d7c2ff"
          strokeWidth="3"
        />
        <path
          d="M54 52h52M54 120h52M80 52v68M54 86h52"
          stroke="#9b8bc0"
          strokeWidth="2"
        />
        <circle cx="66" cy="69" r="6" fill="#e9c6ff" />
        <circle cx="95" cy="69" r="6" fill="#e9c6ff" />
        <circle cx="66" cy="103" r="6" fill="#e9c6ff" />
        <circle cx="95" cy="103" r="6" fill="#e9c6ff" />
        <path d="M80 137v12M63 150h34l9 12H54l9-12Z" fill="url(#art-gold)" />
      </>
    );
  }

  if (variant === "kopa") {
    return (
      <>
        <path
          d="m80 30 12 28 31 3-23 21 7 30-27-16-27 16 7-30-23-21 31-3 12-28Z"
          fill="url(#art-gold)"
          stroke="#fff1a6"
          strokeWidth="2"
        />
        <path d="M69 111h22v24H69z" fill="#b77628" />
        <path d="M56 135h48l9 17H47l9-17Z" fill="url(#art-gold)" />
        <path d="M40 153h80v12H40z" fill="#93641f" />
      </>
    );
  }

  if (variant === "ucl") {
    return cup("silver", "#517cff", true);
  }
  if (variant === "libertadores") {
    return (
      <>
        <path
          d="M65 49c0-12 7-20 15-20s15 8 15 20v20H65V49Z"
          fill="url(#art-silver)"
          stroke="#f5fbff"
          strokeWidth="2"
        />
        <path
          d="m59 69 42 0 11 14-14 13H62L48 83l11-14Z"
          fill="url(#art-silver)"
        />
        <path
          d="M80 32v62M65 44h30M58 78h44"
          stroke="#9a5e24"
          strokeWidth="3"
        />
        <path d="M69 96h22v28H69z" fill="url(#art-silver)" />
        <path
          d="M53 123h54l10 17H43l10-17Z"
          fill="#687b89"
          stroke="#e8f0f5"
          strokeWidth="2"
        />
        <path
          d="M36 142h88v14H36z"
          fill="url(#art-gold)"
          stroke="#fff1a6"
          strokeWidth="2"
        />
      </>
    );
  }
  if (variant === "uel") {
    return (
      <>
        <path
          d="M60 35h40l-5 37-10 20H75L65 72l-5-37Z"
          fill="url(#art-silver)"
          stroke="#fff2e5"
          strokeWidth="2"
        />
        <path d="m71 91 18 0 13 32H58l13-32Z" fill="#bc7336" />
        <path d="M51 122h58l10 17H41l10-17Z" fill="url(#art-silver)" />
        <path
          d="M36 141h88v15H36z"
          fill="#ce7b32"
          stroke="#ffe0b9"
          strokeWidth="2"
        />
        <path d="M68 47h24M71 58h18" stroke="#fff" strokeWidth="3" />
      </>
    );
  }
  if (variant === "sudamericana") {
    return (
      <>
        <path
          d="m80 28 14 24-8 23 20 16-8 17H62l-8-17 20-16-8-23 14-24Z"
          fill="url(#art-silver)"
          stroke="#ffe0bc"
          strokeWidth="2"
        />
        <path d="M69 108h22l9 20H60l9-20Z" fill="#8a5e39" />
        <path d="M49 128h62l10 15H39l10-15Z" fill="url(#art-gold)" />
        <path
          d="M34 145h92v14H34z"
          fill="#714a34"
          stroke="#e9cba5"
          strokeWidth="2"
        />
        <path d="M80 36v57" stroke="#a55435" strokeWidth="3" />
      </>
    );
  }
  if (variant === "uecl") {
    return (
      <>
        <path
          d="M80 28 96 45 91 77 105 97 95 119H65L55 97l14-20-5-32 16-17Z"
          fill="url(#art-silver)"
          stroke="#d8ffe0"
          strokeWidth="2"
        />
        <path
          d="M80 36v75M70 55h20M63 96h34"
          stroke="#387d56"
          strokeWidth="4"
        />
        <path d="M65 119h30l8 20H57l8-20Z" fill="#547360" />
        <path d="M42 142h76v14H42z" fill="url(#art-silver)" />
      </>
    );
  }
  if (variant === "scudetto") {
    return (
      <>
        <path
          d="M80 27 124 43v36c0 31-18 52-44 68-26-16-44-37-44-68V43l44-16Z"
          fill="#1c3442"
          stroke="#eef5fa"
          strokeWidth="3"
        />
        <path
          d="M80 37 114 49v29c0 23-13 40-34 54-21-14-34-31-34-54V49l34-12Z"
          fill="#d83b45"
        />
        <path
          d="m80 51 6 18 19 0-15 11 6 18-16-11-16 11 6-18-15-11 19 0 6-18Z"
          fill="#fff"
        />
      </>
    );
  }
  if (variant === "coppa") {
    return cup("gold", "#c43b43", true);
  }
  if (variant === "carabao") {
    return (
      <>
        <path
          d="M49 39H29v12c0 23 16 34 32 36m50-48h20v12c0 23-16 34-32 36"
          stroke="#c43b43"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M50 29h60v39c0 24-12 42-30 42S50 92 50 68V29Z"
          fill="url(#art-silver)"
          stroke="#ffd6da"
          strokeWidth="2"
        />
        <path d="M69 43h22v24H69z" fill="#c43b43" />
        <path d="M73 110h14v18H73z" fill="#a83c48" />
        <path d="M50 126h60l10 15H40l10-15Z" fill="url(#art-silver)" />
        <path d="M34 144h92v14H34z" fill="#c43b43" />
      </>
    );
  }
  if (variant === "supercoppa") {
    return (
      <>
        <ellipse
          cx="80"
          cy="74"
          rx="42"
          ry="29"
          fill="url(#art-silver)"
          stroke="#d9f7ff"
          strokeWidth="3"
        />
        <ellipse
          cx="80"
          cy="70"
          rx="26"
          ry="15"
          fill="#263441"
          stroke="#f5fbff"
          strokeWidth="2"
        />
        <path
          d="M43 78c3 24 16 38 37 38s34-14 37-38M80 115v18"
          stroke="#8bc4d8"
          strokeWidth="7"
        />
        <path d="M62 133h36l9 14H53l9-14Z" fill="url(#art-silver)" />
        <path d="M38 148h84v13H38z" fill="#728797" />
      </>
    );
  }
  if (variant === "trofeo") {
    return (
      <>
        <path
          d="M57 36h46v32c0 17-10 30-23 30S57 85 57 68V36Z"
          fill="url(#art-gold)"
          stroke="#fff1a6"
          strokeWidth="2"
        />
        <path
          d="M57 44H43v8c0 15 9 23 22 24m38-32h14v8c0 15-9 23-22 24"
          stroke="#c9ac74"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path d="M72 98h16v23H72z" fill="#846a44" />
        <path d="M55 119h50l10 19H45l10-19Z" fill="#c9ac74" />
        <path d="M35 140h90v17H35z" fill="url(#art-gold)" />
      </>
    );
  }
  if (variant === "mundial") {
    return (
      <>
        <path
          d="m80 28 16 7 5 17 17 7-3 18 12 13-10 16 2 19-19 7-11 17-18-6-18 6-11-17-19-7 2-19-10-16 12-13-3-18 17-7 5-17 16-7Z"
          fill="url(#art-gold)"
          stroke="#fff1a6"
          strokeWidth="2"
        />
        <circle
          cx="80"
          cy="85"
          r="25"
          fill="#38654e"
          stroke="#fff1a6"
          strokeWidth="2"
        />
        <path
          d="M80 61v48M56 85h48M68 66c8 9 8 29 0 38m24-38c-8 9-8 29 0 38"
          stroke="#eaffdb"
          strokeWidth="2"
        />
        <path d="M66 136h28v12H66zM49 149h62l7 13H42l7-13Z" fill="#a8752e" />
      </>
    );
  }
  if (variant === "intercontinental") {
    return (
      <>
        <path
          d="M80 30c-25 0-42 17-42 42 0 22 16 37 42 50 26-13 42-28 42-50 0-25-17-42-42-42Z"
          fill="url(#art-gold)"
          stroke="#fff1a6"
          strokeWidth="2"
        />
        <circle
          cx="80"
          cy="72"
          r="25"
          fill="#304b71"
          stroke="#eaf2ff"
          strokeWidth="2"
        />
        <path
          d="M80 48c-10 9-10 39 0 48m0-48c10 9 10 39 0 48M56 72h48M64 56c10 6 22 6 32 0m-32 32c10-6 22-6 32 0"
          stroke="#fff"
          strokeWidth="2"
        />
        <path d="M70 123h20v14H70zM53 138h54l10 18H43l10-18Z" fill="#a8752e" />
      </>
    );
  }
  if (variant === "transatlantica") {
    return (
      <>
        <path
          d="M80 27 92 45l-5 26 15 24-8 22H66l-8-22 15-24-5-26 12-18Z"
          fill="url(#art-silver)"
          stroke="#e8f0f5"
          strokeWidth="2"
        />
        <circle
          cx="48"
          cy="69"
          r="14"
          fill="#fff"
          stroke="#72aaff"
          strokeWidth="3"
        />
        <circle
          cx="112"
          cy="69"
          r="14"
          fill="#fff"
          stroke="#c43b43"
          strokeWidth="3"
        />
        <path
          d="m48 58 5 7 8 1-6 6 2 8-9-4-7 4 1-8-6-6 8-1 4-7Zm64 0 5 7 8 1-6 6 2 8-9-4-7 4 1-8-6-6 8-1 4-7Z"
          fill="#566575"
        />
        <path d="M63 116h34l10 20H53l10-20Z" fill="url(#art-gold)" />
        <path d="M39 137h82v17H39z" fill="#796443" />
      </>
    );
  }

  return (
    <>
      <path
        d="M80 28 121 43v36c0 31-17 52-41 68-24-16-41-37-41-68V43l41-15Z"
        fill="#263441"
        stroke="#e8f0f5"
        strokeWidth="3"
      />
      <path
        d="M80 43v91M53 70h54M55 104h50"
        stroke={artColor(variant)}
        strokeWidth="5"
      />
      <path
        d="m80 54 5 11 12 2-9 8 2 12-10-6-10 6 2-12-9-8 12-2 5-11Z"
        fill="url(#art-gold)"
      />
    </>
  );
}

function cup(metal: "gold" | "silver", accent: string, handles: boolean) {
  const fill = metal === "gold" ? "url(#art-gold)" : "url(#art-silver)";
  return (
    <>
      {handles ? (
        <path
          d="M49 44H30v10c0 20 13 31 29 33m52-43h19v10c0 20-13 31-29 33"
          stroke={fill}
          strokeWidth="8"
          strokeLinecap="round"
        />
      ) : null}
      <path
        d="M51 31h58v37c0 22-12 39-29 39S51 90 51 68V31Z"
        fill={fill}
        stroke="#fff1a6"
        strokeWidth="2"
      />
      <path d="M80 107v18" stroke={accent} strokeWidth="12" />
      <path
        d="M58 122h44l10 17H48l10-17Z"
        fill={fill}
        stroke="#f8d970"
        strokeWidth="2"
      />
      <path
        d="M38 142h84v14H38z"
        fill={fill}
        stroke="#fff1a6"
        strokeWidth="2"
      />
      <path
        d="m80 43 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2 5-10Z"
        fill={accent}
      />
    </>
  );
}
