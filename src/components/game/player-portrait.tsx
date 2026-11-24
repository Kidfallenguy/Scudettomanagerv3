import { useState } from "react";
import type { Player } from "@/lib/game/types";
import {
  DEFAULT_PLAYER_FACE_URL,
  playerFaceUrl,
  wonderkidAtlasTile,
} from "@/lib/game/face-assets";
import { cn } from "@/lib/cn";
import { WONDERKID_ATLAS_COLUMNS } from "@/lib/game/wonderkid-face-config";

type PortraitSize = "row" | "list" | "hero";
type PortraitPlayer = Pick<Player, "name"> &
  Partial<Pick<Player, "id" | "clubId" | "portraitUrl">>;

const SIZE_CLASS: Record<PortraitSize, string> = {
  row: "size-10 rounded-xl",
  list: "size-12 rounded-2xl",
  hero: "h-28 w-24 rounded-2xl",
};

function PlayerPhoto({
  source,
  loading,
  size,
}: {
  source: string;
  loading: "eager" | "lazy";
  size: PortraitSize;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  const tile = wonderkidAtlasTile(source);
  if (tile) {
    const tileScale = size === "hero" ? 112 / 96 : 1;
    const horizontalCrop = (tileScale - 1) * 50;
    return (
      <span className="relative size-full overflow-hidden">
        <img
          aria-hidden="true"
          className="absolute max-w-none"
          src={tile.atlasUrl}
          loading={loading}
          decoding="async"
          onError={() => setFailed(true)}
          style={{
            width: `${WONDERKID_ATLAS_COLUMNS * tileScale * 100}%`,
            height: `${WONDERKID_ATLAS_COLUMNS * 100}%`,
            left: `calc(-${tile.column * tileScale * 100}% - ${horizontalCrop}%)`,
            top: `-${tile.row * 100}%`,
          }}
        />
      </span>
    );
  }

  return (
    <img
      aria-hidden="true"
      className="size-full object-cover"
      src={source}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export function PlayerPortrait({
  player,
  size = "list",
  className,
}: {
  player: PortraitPlayer;
  size?: PortraitSize;
  className?: string;
}) {
  const source = playerFaceUrl(player) ?? DEFAULT_PLAYER_FACE_URL;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden bg-elevated shadow-[var(--shadow-border)]",
        SIZE_CLASS[size],
        className,
      )}
    >
      <PlayerPhoto
        key={`${player.id}:${source}`}
        source={source}
        loading={size === "hero" ? "eager" : "lazy"}
        size={size}
      />
    </span>
  );
}
