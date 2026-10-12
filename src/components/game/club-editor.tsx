import { useState } from "react";
import { ArrowLeft, Copy, Plus, Save, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClubCrest } from "@/components/game/crest";
import { clubById } from "@/lib/game/clubs";
import { uid } from "@/lib/game/format";
import { useGame } from "@/lib/game/store";
import type { ClubCustomization } from "@/lib/game/types";

function draftFrom(club: ClubCustomization): ClubCustomization {
  return { ...club };
}

function freshDraft(): ClubCustomization {
  return {
    id: uid("custom-club"),
    name: "",
    short: "",
    city: "",
    stadium: "",
    capacity: 5000,
    color: "#1f6feb",
    color2: "#ffffff",
    crest: "",
    crestBackgroundTransparent: false,
    prestige: 50,
    stadiumFacilities: 2,
    startingBudget: 0,
  };
}

const inputClass = "min-h-11 w-full rounded-lg border border-border bg-bg px-3 text-sm text-fg";

export function ClubEditor() {
  const clubId = useGame((s) => s.clubId);
  const customClubs = useGame((s) => s.customClubs);
  const saveCustomClub = useGame((s) => s.saveCustomClub);
  const duplicateCustomClub = useGame((s) => s.duplicateCustomClub);
  const deleteCustomClub = useGame((s) => s.deleteCustomClub);
  const setScreen = useGame((s) => s.setScreen);
  const [draft, setDraft] = useState<ClubCustomization>(freshDraft);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");

  const update = <K extends keyof ClubCustomization>(key: K, value: ClubCustomization[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const save = () => {
    const error = saveCustomClub({ ...draft, name: draft.name.trim() });
    if (error) {
      setNotice(error);
      return;
    }
    setEditing(true);
    setNotice("Identidad guardada en tu biblioteca.");
  };

  const uploadCrest = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 1_000_000) {
      setNotice("Usá un archivo de imagen de hasta 1 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") update("crest", reader.result);
    };
    reader.onerror = () => setNotice("No se pudo leer el archivo de escudo.");
    reader.readAsDataURL(file);
  };

  return (
    <main className="min-h-dvh bg-bg px-4 py-6 text-fg md:py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-fg-muted">Biblioteca persistente</p>
            <h1 className="mt-2 font-display text-4xl font-semibold md:text-6xl">Editor de clubes</h1>
            <p className="mt-2 max-w-2xl text-sm text-fg-muted">
              Guardá identidades propias y reemplazá visualmente a un participante al iniciar una carrera. El club conserva su ID,
              división, calendario e historia.
            </p>
          </div>
          <Button variant="outline" onClick={() => setScreen(clubId ? "boot" : "select")}>
            <ArrowLeft className="size-4" /> Volver
          </Button>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
          <section className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold">Nueva identidad</h2>
              <Button variant="ghost" onClick={() => { setDraft(freshDraft()); setEditing(false); setNotice(""); }}>
                <Plus className="size-4" /> Nuevo
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-fg-muted">Nombre<input className={`${inputClass} mt-1`} maxLength={50} value={draft.name} onChange={(e) => update("name", e.target.value)} /></label>
              <label className="text-xs text-fg-muted">Abreviatura<input className={`${inputClass} mt-1`} maxLength={8} value={draft.short} onChange={(e) => update("short", e.target.value)} /></label>
              <label className="text-xs text-fg-muted">Ciudad<input className={`${inputClass} mt-1`} maxLength={50} value={draft.city} onChange={(e) => update("city", e.target.value)} /></label>
              <label className="text-xs text-fg-muted">Estadio<input className={`${inputClass} mt-1`} maxLength={60} value={draft.stadium} onChange={(e) => update("stadium", e.target.value)} /></label>
              <label className="text-xs text-fg-muted">Capacidad inicial<input className={`${inputClass} mt-1`} type="number" min={500} max={200000} step={500} value={draft.capacity} onChange={(e) => update("capacity", Number(e.target.value))} /></label>
              <label className="text-xs text-fg-muted">Instalaciones iniciales (1–5)<select className={`${inputClass} mt-1`} value={draft.stadiumFacilities ?? 2} onChange={(e) => update("stadiumFacilities", Number(e.target.value))}>{[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>{level} {level === 1 ? "· Básicas" : level === 5 ? "· Élite" : ""}</option>)}</select></label>
              <label className="text-xs text-fg-muted">Prestigio (1–100)<input className={`${inputClass} mt-1`} type="number" min={1} max={100} value={draft.prestige} onChange={(e) => update("prestige", Number(e.target.value))} /></label>
              <label className="text-xs text-fg-muted">Presupuesto inicial (€)<input className={`${inputClass} mt-1`} type="number" min={0} max={2_000_000_000} step={100_000} value={draft.startingBudget ?? 0} onChange={(e) => update("startingBudget", Number(e.target.value))} /></label>
              <label className="text-xs text-fg-muted">Color local<span className="mt-1 flex h-11 items-center gap-3 rounded-lg border border-border bg-bg px-3"><input type="color" value={draft.color} onChange={(e) => update("color", e.target.value)} /><span>{draft.color}</span></span></label>
              <label className="text-xs text-fg-muted">Color alternativo<span className="mt-1 flex h-11 items-center gap-3 rounded-lg border border-border bg-bg px-3"><input type="color" value={draft.color2} onChange={(e) => update("color2", e.target.value)} /><span>{draft.color2}</span></span></label>
              <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border bg-bg px-3 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={draft.crestBackgroundTransparent ?? false}
                  onChange={(e) => update("crestBackgroundTransparent", e.target.checked)}
                />
                Fondo transparente detrás del escudo
              </label>
              <p className="text-xs text-fg-subtle sm:col-span-2">
                Deja ver el fondo de la pantalla a través del escudo. Para transparencia dentro de la imagen, carga un PNG transparente.
              </p>
              <label className="text-xs text-fg-muted sm:col-span-2">URL del escudo<input className={`${inputClass} mt-1`} value={draft.crest.startsWith("data:image/") ? "" : draft.crest} onChange={(e) => update("crest", e.target.value)} placeholder="https://… o /escudos/club.png" /></label>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-elevated p-3">
              <div
                className="flex size-16 shrink-0 items-center justify-center rounded-full border border-border"
                style={{
                  backgroundColor: draft.crestBackgroundTransparent ? "transparent" : draft.color,
                  backgroundImage: draft.crestBackgroundTransparent
                    ? "linear-gradient(45deg, #777 25%, transparent 25%), linear-gradient(-45deg, #777 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #777 75%), linear-gradient(-45deg, transparent 75%, #777 75%)"
                    : undefined,
                  backgroundSize: draft.crestBackgroundTransparent ? "12px 12px" : undefined,
                  backgroundPosition: draft.crestBackgroundTransparent ? "0 0, 0 6px, 6px -6px, -6px 0" : undefined,
                }}
              >
                <ClubCrest
                  club={{
                    id: draft.id,
                    name: draft.name || "Club de prueba",
                    short: draft.short || "CLB",
                    city: draft.city,
                    stadium: draft.stadium,
                    capacity: draft.capacity,
                    color: draft.color,
                    color2: draft.color2,
                    crest: draft.crest,
                    crestBackgroundTransparent: draft.crestBackgroundTransparent,
                    league: "mls",
                    prestige: draft.prestige,
                  }}
                  size={48}
                />
              </div>
              <div>
                <p className="text-sm font-medium">Vista previa del escudo</p>
                <p className="text-xs text-fg-muted">
                  {draft.crestBackgroundTransparent ? "Cuadrícula = fondo transparente" : "Fondo con el color del club"}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 text-sm hover:bg-elevated">
                <Upload className="size-4" /> Cargar escudo
                <input className="sr-only" type="file" accept="image/*" onChange={(e) => uploadCrest(e.target.files?.[0])} />
              </label>
              <span className="text-xs text-fg-subtle">Imagen de hasta 1 MB</span>
              <Button variant="club" onClick={save}><Save className="size-4" /> Guardar identidad</Button>
            </div>
            {notice ? <p className="mt-3 text-sm text-fg-muted" role="status">{notice}</p> : null}
          </section>

          <section className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] md:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-2xl font-semibold">Mis clubes</h2>
                <p className="text-xs text-fg-muted">{customClubs.length} identidades guardadas</p>
              </div>
              <span className="text-xs text-fg-muted">Máximo 100</span>
            </div>
            {customClubs.length === 0 ? (
              <p className="rounded-xl bg-elevated p-4 text-sm text-fg-muted">Todavía no guardaste identidades.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {customClubs.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 rounded-xl bg-elevated p-3">
                    <div
                      className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border font-display text-sm font-semibold"
                      style={{ backgroundColor: item.crestBackgroundTransparent ? "transparent" : item.color }}
                    >
                      <ClubCrest
                        club={{
                          id: item.id,
                          name: item.name,
                          short: item.short,
                          city: item.city,
                          stadium: item.stadium,
                          capacity: item.capacity,
                          color: item.color,
                          color2: item.color2,
                          crest: item.crest,
                          crestBackgroundTransparent: item.crestBackgroundTransparent,
                          league: "mls",
                          prestige: item.prestige,
                        }}
                        size={40}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="truncate text-xs text-fg-muted">{item.city || "Sin ciudad"} · {item.stadium || "Sin estadio"}</p>
                    </div>
                    <Button variant="ghost" size="icon" aria-label={`Editar ${item.name}`} onClick={() => { setDraft(draftFrom(item)); setEditing(true); setNotice(""); }}>
                      Editar
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`Duplicar ${item.name}`} onClick={() => duplicateCustomClub(item.id)}>
                      <Copy className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`Eliminar ${item.name}`} onClick={() => { deleteCustomClub(item.id); if (editing && draft.id === item.id) { setDraft(freshDraft()); setEditing(false); } }}>
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {editing ? <p className="mt-3 text-xs text-fg-subtle">Editando: {draft.name}</p> : null}
            {clubId ? <p className="mt-4 text-xs text-fg-subtle">Carrera actual: {clubById(clubId).name}. Los cambios de biblioteca solo se aplican a carreras nuevas.</p> : null}
          </section>
        </div>
      </div>
    </main>
  );
}
