export function normalizePlayerName(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u00f8\u00d8]/g, "o")
    .replace(/[\u00e6\u00c6]/g, "ae")
    .replace(/[\u0153\u0152]/g, "oe")
    .replace(/[\u0142\u0141]/g, "l")
    .replace(/[\u0111\u0110\u00f0\u00d0]/g, "d")
    .replace(/[\u00df\u1e9e]/g, "ss")
    .replace(/\u0131/g, "i")
    .replace(/[\u00fe\u00de]/g, "th")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}
