export const COLOR_PRESETS = [
  "#AD4B34", "#E0562E", "#B8863A", "#C9A227", "#3FA34D", "#2E7D5B", "#173E37", "#3C7A8A",
  "#1FA6A6", "#2E5C8A", "#6E4E9E", "#D6336C", "#8A5A44", "#5E6B4A", "#9C978A", "#4A473E",
];

export function shadeColor(hex: string, percent: number): string {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const num = parseInt(hex, 16);
  let r = num >> 16;
  let g = (num >> 8) & 0x00ff;
  let b = num & 0x0000ff;
  const amt = Math.round(2.55 * percent);
  r = Math.min(255, Math.max(0, r + amt));
  g = Math.min(255, Math.max(0, g + amt));
  b = Math.min(255, Math.max(0, b + amt));
  return "#" + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}

export const COLOR_PRESETS_LIGHT = COLOR_PRESETS.map((c) => shadeColor(c, 28));
export const COLOR_PRESETS_DARK = COLOR_PRESETS.map((c) => shadeColor(c, -22));

export function contrastIconColor(hex: string): string {
  hex = (hex || "#173E37").replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const num = parseInt(hex, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#20281F" : "#FFFFFF";
}
