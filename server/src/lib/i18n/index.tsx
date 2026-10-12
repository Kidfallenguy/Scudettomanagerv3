import { useEffect, useSyncExternalStore } from "react";
import { DICT, FRAGMENTS, PATTERNS, type Lang } from "./dict";

export type { Lang };
export const LANGS: Array<{ id: Lang; label: string; flag: string }> = [
  { id: "es", label: "Español", flag: "ES" },
  { id: "en", label: "English", flag: "EN" },
  { id: "pt", label: "Português", flag: "PT" },
];

const KEY = "scudetto-lang";
let current: Lang = "es";
const listeners = new Set<() => void>();

function readStored(): Lang {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "en" || v === "pt" || v === "es" ? v : "es";
  } catch {
    return "es";
  }
}

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang) {
  current = lang;
  try {
    window.localStorage.setItem(KEY, lang);
  } catch {
    /* sin almacenamiento: solo dura la sesión */
  }
  document.documentElement.lang = lang;
  listeners.forEach((l) => l());
}

export function useLang(): Lang {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => "es" as Lang,
  );
}

const idx = (lang: Lang) => (lang === "en" ? 0 : 1);

/** Traduce un texto de la interfaz (español → idioma activo). Si no lo conoce lo devuelve igual (nombres, etc.). */
export function translate(text: string, lang: Lang = current): string {
  if (lang === "es") return text;
  const trimmed = text.trim();
  if (!trimmed) return text;
  const lead = text.slice(0, text.indexOf(trimmed));
  const tail = text.slice(lead.length + trimmed.length);
  const hit = DICT[trimmed];
  if (hit) return lead + hit[idx(lang)] + tail;
  for (const p of PATTERNS) {
    if (p.re.test(trimmed)) {
      const inner = trimmed.replace(p.re, lang === "en" ? p.en : p.pt);
      // Las partes capturadas pueden ser texto traducible (p. ej. "Premier League · Jornada 3"): una pasada más.
      return lead + inner.replace(/ · ([^·]+)$/, (m, g) => ` · ${DICT[g.trim()]?.[idx(lang)] ?? g}`) + tail;
    }
  }
  for (const [frag, tr] of FRAGMENTS) {
    if (trimmed.startsWith(frag.trim()) || text.includes(frag)) {
      if (text.includes(frag)) return text.replace(frag, tr[idx(lang)]);
    }
  }
  return text;
}

const ATTRS = ["title", "placeholder", "aria-label"];
type Seen = { orig: string; out: string };
const seenText = new WeakMap<Node, Seen>();
const seenAttr = new WeakMap<Element, Record<string, Seen>>();

function skip(el: Element | null): boolean {
  return Boolean(el?.closest("[data-no-translate],script,style,textarea,input"));
}

/** Original en español de un valor: si es lo que nosotros escribimos, el original guardado; si no, React lo cambió. */
function baseOf(cur: string, seen: Seen | undefined): string {
  return seen && cur === seen.out ? seen.orig : cur;
}

function applyText(node: Text, lang: Lang) {
  if (skip(node.parentElement)) return;
  const cur = node.nodeValue ?? "";
  const orig = baseOf(cur, seenText.get(node));
  const out = translate(orig, lang);
  seenText.set(node, { orig, out });
  if (cur !== out) node.nodeValue = out;
}

function applyAttrs(el: Element, lang: Lang) {
  if (skip(el)) return;
  const store = seenAttr.get(el) ?? {};
  for (const a of ATTRS) {
    const cur = el.getAttribute(a);
    if (cur === null) continue;
    const orig = baseOf(cur, store[a]);
    const out = translate(orig, lang);
    store[a] = { orig, out };
    if (cur !== out) el.setAttribute(a, out);
  }
  seenAttr.set(el, store);
}

function walk(root: Node, lang: Lang) {
  if (root.nodeType === Node.TEXT_NODE) return applyText(root as Text, lang);
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  applyAttrs(root as Element, lang);
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let n: Node | null = tw.nextNode();
  while (n) {
    if (n.nodeType === Node.TEXT_NODE) applyText(n as Text, lang);
    else applyAttrs(n as Element, lang);
    n = tw.nextNode();
  }
}

/**
 * Traduce la interfaz en pantalla según el idioma elegido (español por defecto). Solo cambia textos que están en el
 * diccionario: nombres de jugadores, clubes, estadios y ciudades no se tocan. Se monta una sola vez en la app.
 */
export function LanguageEngine() {
  const lang = useLang();

  useEffect(() => {
    const stored = readStored();
    if (stored !== current) {
      current = stored;
      document.documentElement.lang = stored;
      listeners.forEach((l) => l());
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    walk(document.body, lang);
    if (lang === "es") return; // ya restauró los originales arriba
    let busy = false;
    const obs = new MutationObserver((muts) => {
      if (busy) return;
      busy = true;
      obs.disconnect();
      for (const m of muts) {
        if (m.type === "characterData") walk(m.target, lang);
        else if (m.type === "attributes") applyAttrs(m.target as Element, lang);
        else m.addedNodes.forEach((n) => walk(n, lang));
      }
      obs.observe(document.body, opts);
      busy = false;
    });
    const opts: MutationObserverInit = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS };
    obs.observe(document.body, opts);
    return () => obs.disconnect();
  }, [lang]);

  return null;
}

export function LanguageSelect({ className }: { className?: string }) {
  const lang = useLang();
  return (
    <div className={className} data-no-translate role="group" aria-label="Idioma / Language / Idioma">
      <div className="flex gap-1 rounded-xl bg-surface p-1 shadow-[var(--shadow-border)]">
        {LANGS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setLang(l.id)}
            aria-pressed={lang === l.id}
            className={`min-h-10 flex-1 rounded-lg px-3 text-sm font-medium transition-colors ${
              lang === l.id ? "bg-fg text-bg" : "text-fg-muted hover:bg-fg/6 hover:text-fg"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}
