import type { Meta } from "../schema";

export function progressoMeta(meta: Meta): { pct: number; pctReal: number; concluida: boolean } {
  const pctReal = meta.valorAlvo > 0 ? (meta.valorAtual / meta.valorAlvo) * 100 : 0;
  const pct = Math.min(100, pctReal);
  const concluida = meta.concluida || pctReal >= 100;
  return { pct, pctReal, concluida };
}
