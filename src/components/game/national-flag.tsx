import { useState } from "react";
import type { NationalTeam } from "@/lib/game/national";
import { cn } from "@/lib/cn";

const FLAG_IMAGE_CODE: Record<string, string> = {
  ENG: "gb-eng",
  NIR: "gb-nir",
  SCO: "gb-sct",
  WAL: "gb-wls",
};

function flagImageCode(team: Pick<NationalTeam, "code" | "flag">) {
  if (FLAG_IMAGE_CODE[team.code]) return FLAG_IMAGE_CODE[team.code];

  const indicators = [...team.flag]
    .map((character) => character.codePointAt(0) ?? 0)
    .filter((codePoint) => codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff);

  if (indicators.length >= 2) {
    return indicators
      .slice(0, 2)
      .map((codePoint) => String.fromCharCode(codePoint - 0x1f1e6 + 97))
      .join("");
  }

  return team.code.toLowerCase();
}

export function NationalFlag({
  team,
  size = "md",
  className,
}: {
  team: Pick<NationalTeam, "code" | "flag" | "name">;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const sizeClass = {
    sm: "h-3.5 w-5",
    md: "h-4 w-6",
    lg: "h-6 w-9",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-sm bg-white/10 align-middle",
        sizeClass,
        className,
      )}
      role="img"
      aria-label={`Bandera de ${team.name}`}
    >
      {imageFailed ? (
        <span className="text-[0.85em] leading-none" aria-hidden="true">
          {team.flag}
        </span>
      ) : (
        <img
          src={`https://flagcdn.com/${flagImageCode(team)}.svg`}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      )}
    </span>
  );
}
