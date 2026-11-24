import type { CSSProperties } from "react";
import type { Player } from "@/lib/game/types";
import { clubById } from "@/lib/game/clubs";
import { cn } from "@/lib/cn";

export function PlayerKit({
  player,
  size = "row",
  className,
}: {
  player: Player;
  size?: "row" | "hero";
  className?: string;
}) {
  const club = clubById(player.clubId);
  const darkText = luminance(club.color) > 0.62;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "player-shirt inline-flex shrink-0 items-center justify-center font-display font-semibold tabular-nums shadow-[var(--shadow-border)]",
        size === "row" ? "size-10 text-xs" : "h-[5.5rem] w-[4.75rem] text-xl",
        className,
      )}
      style={
        {
          backgroundColor: club.color,
          color: darkText ? "#171717" : "#ffffff",
          "--player-accent": club.color,
          textShadow: darkText
            ? "0 1px 1px rgb(255 255 255 / 0.35)"
            : "0 1px 2px rgb(0 0 0 / 0.55)",
        } as CSSProperties
      }
    >
      {player.number}
    </span>
  );
}

function luminance(color: string) {
  const hex = color.replace("#", "");
  if (!/^[\da-f]{6}$/i.test(hex)) return 0;
  const channels = [0, 2, 4].map(
    (index) => parseInt(hex.slice(index, index + 2), 16) / 255,
  );
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}
