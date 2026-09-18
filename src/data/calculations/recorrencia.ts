import { monthKey } from "../format";
import type { Lancamento } from "../schema";
import { uid } from "../schema";

export function addFreq(dateStr: string, freq: string, n: number, intervalo?: number): string {
  const interv = intervalo || 1;
  const d = new Date(dateStr + "T00:00:00");
  const passos = n * interv;
  if (freq === "diario" || freq === "dia") d.setDate(d.getDate() + passos);
  else if (freq === "semanal") d.setDate(d.getDate() + 7 * n);
  else if (freq === "quinzenal") d.setDate(d.getDate() + 15 * n);
  else if (freq === "bimestral") d.setMonth(d.getMonth() + 2 * n);
  else if (freq === "trimestral") d.setMonth(d.getMonth() + 3 * n);
  else if (freq === "anual" || freq === "ano") d.setFullYear(d.getFullYear() + passos);
  else d.setMonth(d.getMonth() + passos);
  return d.toISOString().slice(0, 10);
}

/** Gera as ocorrências futuras (parceladas ou fixas) de um lançamento recorrente. */
export function gerarOcorrenciasRecorrencia(base: Lancamento, horizonte = 11): Lancamento[] {
  if (!base.recorrencia.ativa) return [];
  const isParcelado = base.recorrencia.tipo === "parcelado";
  const total = base.recorrencia.totalParcelas;
  const baseNome = isParcelado ? (base.nome || "").replace(/\s*\(\d+\/\d+\)\s*$/, "") : base.nome;
  const novos: Lancamento[] = [];
  for (let i = 1; i <= horizonte; i++) {
    const novaDataCalculada = addFreq(base.data, base.recorrencia.frequencia, i, base.recorrencia.intervalo);
    if (!isParcelado && base.recorrencia.dataTermino && novaDataCalculada > base.recorrencia.dataTermino) break;
    const parcelaAtual = isParcelado ? (base.recorrencia.parcelaAtual || 1) + i : null;
    let novaCompetencia = base.competenciaFatura;
    if (base.cartaoId && base.competenciaFatura) {
      const [cy, cm] = base.competenciaFatura.split("-").map(Number);
      const d = new Date(cy, cm - 1 + i, 1);
      novaCompetencia = monthKey(d);
    }
    const novaData = isParcelado && base.cartaoId ? base.data : novaDataCalculada;
    novos.push({
      ...base,
      id: uid("lanc"),
      data: novaData,
      competenciaFatura: novaCompetencia,
      efetivado: false,
      dataEfetivacao: null,
      nome: isParcelado && total ? `${baseNome} (${parcelaAtual}/${total})` : base.nome,
      recorrencia: { ...base.recorrencia, parcelaAtual },
    });
  }
  return novos;
}
