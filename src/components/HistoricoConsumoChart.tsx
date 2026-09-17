import { fmtMoneyShort } from "../data/format";
import type { MesConsumo } from "../data/calculations/orcamento";

interface HistoricoConsumoChartProps {
  meses: MesConsumo[];
  metas: (number | null)[];
  cor: string;
  w?: number;
  h?: number;
}

export function HistoricoConsumoChart({ meses, metas, cor, w = 420, h = 110 }: HistoricoConsumoChartProps) {
  const padL = 46;
  const padR = 8;
  const padT = 10;
  const padB = 20;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const vals = meses.map((m) => m.valor);
  const valsTodos = metas ? vals.concat(metas.filter((v): v is number => v != null)) : vals;
  const min = 0;
  const max = Math.max(...valsTodos, 1);
  const range = max - min || 1;
  const n = meses.length;
  const stepX = n > 1 ? plotW / (n - 1) : 0;
  const yFor = (v: number) => padT + plotH - ((v - min) / range) * plotH;
  const xFor = (i: number) => padL + i * stepX;

  const pts = meses.map((m, i) => [xFor(i), yFor(m.valor)]);
  let path = pts.length ? `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}` : "";
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const cx = (x0 + x1) / 2;
    path += ` C${cx.toFixed(1)},${y0.toFixed(1)} ${cx.toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }

  const temMeta = metas.some((v) => v != null);
  let metaPath = "";
  if (temMeta) {
    metas.forEach((v, i) => {
      if (v == null) return;
      const p = [xFor(i), yFor(v)];
      metaPath += metaPath === "" ? `M${p[0].toFixed(1)},${p[1].toFixed(1)}` : ` L${p[0].toFixed(1)},${p[1].toFixed(1)}`;
    });
  }

  return (
    <div style={{ position: "relative", width: "100%", height: h }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" style={{ overflow: "visible", display: "block" }}>
        <line x1={padL} y1={yFor(max)} x2={w - padR} y2={yFor(max)} stroke="var(--line)" strokeWidth={1} opacity={0.4} />
        <text x={padL - 6} y={yFor(max) + 3} textAnchor="end" fontSize={9} fill="var(--gray-400)">
          {fmtMoneyShort(max)}
        </text>
        {metaPath && (
          <path d={metaPath} fill="none" stroke="var(--gray-400)" strokeWidth={1.5} strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" />
        )}
        <path d={path} fill="none" stroke={cor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        {meses.map((m, i) => (
          <text key={m.mesKey} x={xFor(i)} y={h - 4} textAnchor="middle" fontSize={9} fill="var(--gray-400)">
            {m.label}
          </text>
        ))}
      </svg>
      {meses.map((m, i) => (
        <span
          key={m.mesKey}
          style={{
            position: "absolute",
            left: `${((xFor(i) / w) * 100).toFixed(2)}%`,
            top: `${((yFor(m.valor) / h) * 100).toFixed(2)}%`,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--surface)",
            border: `1.6px solid ${cor}`,
            transform: "translate(-50%,-50%)",
            boxSizing: "border-box",
          }}
        />
      ))}
      {temMeta &&
        metas.map(
          (v, i) =>
            v != null && (
              <span
                key={i}
                style={{
                  position: "absolute",
                  left: `${((xFor(i) / w) * 100).toFixed(2)}%`,
                  top: `${((yFor(v) / h) * 100).toFixed(2)}%`,
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "var(--gray-400)",
                  transform: "translate(-50%,-50%)",
                }}
              />
            ),
        )}
    </div>
  );
}
