import { useState } from "react";
import { useConfirm } from "../../components/ConfirmDialog";
import { EntityCircle } from "../../components/EntityCircle";
import { Icon } from "../../components/icons/Icon";
import { Modal } from "../../components/Modal";
import { aportadoNoMes, baseAntesAtualizacao, rendimentoNoMes, valorAtualAtivo } from "../../data/calculations/investimentos";
import { isInMonth } from "../../data/calculations/lancamentos";
import { diaAnteriorA, fmtDate, fmtMoney, monthKey, primeiroDiaMes, sortByData } from "../../data/format";
import { persist } from "../../data/persistence";
import type { AppState, Ativo, TipoAporte } from "../../data/schema";
import { useAppStore } from "../../data/store";
import { AporteModal } from "./AporteModal";
import { AtualizarValorModal } from "./AtualizarValorModal";
import { TransferenciaAtivoModal } from "./TransferenciaAtivoModal";

interface ExtratoEntryBase {
  id: string;
  data: string;
  tipo: "aporte" | "resgate" | "transferencia" | "rendimento";
  valor: number;
  kind: "aporte" | "atualizacao";
}

interface ExtratoEntry {
  id: string;
  data: string | null;
  tipo: "aporte" | "resgate" | "transferencia" | "rendimento" | "saldo_inicial";
  valor: number;
  kind: "aporte" | "atualizacao" | "saldoInicial";
}

function buildEntries(state: AppState, ativoId: string, ativo: Ativo): ExtratoEntry[] {
  const aportes: ExtratoEntryBase[] = state.investimentos.aportes
    .filter((a) => a.ativoId === ativoId)
    .map((a) => ({
      id: a.id,
      data: a.data,
      tipo: a.transferenciaGrupoId ? "transferencia" : a.tipo,
      valor: a.tipo === "resgate" ? -a.valor : a.valor,
      kind: "aporte",
    }));
  const upds = [...state.investimentos.atualizacoes.filter((a) => a.ativoId === ativoId)].sort((a, b) => a.data.localeCompare(b.data));
  const rendimentos: ExtratoEntryBase[] = upds.map((u) => ({
    id: u.id,
    data: u.data,
    tipo: "rendimento",
    valor: u.valorAtual - baseAntesAtualizacao(state, ativoId, u),
    kind: "atualizacao",
  }));
  const entries: ExtratoEntry[] = sortByData([...aportes, ...rendimentos], state.configuracoes.ordenacaoDecrescente);
  if (ativo.saldoInicial) {
    entries.push({ id: "saldoinicial-" + ativoId, data: null, tipo: "saldo_inicial", valor: ativo.saldoInicial, kind: "saldoInicial" });
  }
  return entries;
}

const LABEL_TIPO: Record<ExtratoEntry["tipo"], string> = {
  saldo_inicial: "Saldo inicial",
  transferencia: "Transferência",
  aporte: "Aporte",
  resgate: "Resgate",
  rendimento: "Rendimento",
};

function chipClasse(tipo: ExtratoEntry["tipo"]): string {
  if (tipo === "rendimento") return "investimento";
  if (tipo === "transferencia") return "transferencia";
  if (tipo === "saldo_inicial") return "entrada";
  if (tipo === "resgate") return "despesa";
  return "entrada";
}

type SubModal =
  | { kind: "aporte"; tipo: TipoAporte; aporteId: string | null }
  | { kind: "atualizar"; atualizacaoId: string | null }
  | { kind: "transferir" }
  | null;

interface AtivoExtratoModalProps {
  ativoId: string;
  onClose: () => void;
  onEditAtivo: () => void;
}

export function AtivoExtratoModal({ ativoId, onClose, onEditAtivo }: AtivoExtratoModalProps) {
  const state = useAppStore((s) => s.data);
  const currentMonth = useAppStore((s) => s.currentMonth);
  const deleteAporte = useAppStore((s) => s.deleteAporte);
  const deleteAtualizacaoAtivo = useAppStore((s) => s.deleteAtualizacaoAtivo);
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [subModal, setSubModal] = useState<SubModal>(null);

  const ativo = state.investimentos.ativos.find((a) => a.id === ativoId);
  if (!ativo) return null;

  const contaDoAtivo = ativo.contaId ? state.contas.find((c) => c.id === ativo.contaId) : null;
  const entriesTodas = buildEntries(state, ativoId, ativo);
  const mesCriacaoAtivo = ativo.dataCriacao ? monthKey(new Date(ativo.dataCriacao + "T00:00:00")) : null;
  const mesAtualKey = monthKey(currentMonth);
  const entries = entriesTodas.filter((e) => {
    if (e.kind === "saldoInicial") return !mesCriacaoAtivo || mesCriacaoAtivo === mesAtualKey;
    return isInMonth(e.data, currentMonth);
  });

  const aportadoMes = aportadoNoMes(state, ativoId, currentMonth);
  const valorAtual = valorAtualAtivo(state, ativoId);
  const baseInicioMes = valorAtualAtivo(state, ativoId, diaAnteriorA(primeiroDiaMes(currentMonth)));
  const rendimentoMesAtivo = rendimentoNoMes(state, ativoId, currentMonth);
  const rentMesPct = baseInicioMes > 0 ? (rendimentoMesAtivo / baseInicioMes) * 100 : 0;

  async function handleEditEntry(e: ExtratoEntry) {
    if (e.kind === "aporte") {
      const a = state.investimentos.aportes.find((x) => x.id === e.id);
      if (a) setSubModal({ kind: "aporte", tipo: a.tipo, aporteId: a.id });
    } else if (e.kind === "saldoInicial") {
      onClose();
      onEditAtivo();
    } else {
      setSubModal({ kind: "atualizar", atualizacaoId: e.id });
    }
  }

  async function handleDeleteEntry(e: ExtratoEntry) {
    const ok = await confirm("Excluir este registro?", { danger: true });
    if (!ok) return;
    if (e.kind === "aporte") {
      deleteAporte(e.id);
    } else {
      deleteAtualizacaoAtivo(e.id);
    }
    await persist(true);
  }

  return (
    <>
      <Modal
        title={
          <span>
            <strong>Extrato:</strong>{" "}
            <span style={{ fontWeight: 400, display: "inline-flex", alignItems: "center" }}>
              {contaDoAtivo && <EntityCircle cor={contaDoAtivo.cor} icone={contaDoAtivo.icone} size={20} iconSize={11} />}
              {contaDoAtivo ? `${contaDoAtivo.nome} - ${ativo.nome}` : ativo.nome}
            </span>
          </span>
        }
        onClose={onClose}
        wide
        footer={
          <>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn small"
                style={{ background: "var(--type-entrada)", color: "#fff", borderColor: "var(--type-entrada)" }}
                onClick={() => setSubModal({ kind: "aporte", tipo: "aporte", aporteId: null })}
              >
                <Icon name="plus" size={14} /> Aporte
              </button>
              <button
                type="button"
                className="btn small ghost"
                style={{ color: "var(--type-despesa)", borderColor: "var(--type-despesa)" }}
                onClick={() => setSubModal({ kind: "aporte", tipo: "resgate", aporteId: null })}
              >
                <Icon name="swap" size={14} /> Resgate
              </button>
              <button
                type="button"
                className="btn small ghost"
                style={{ borderColor: "var(--gray-400)" }}
                onClick={() => setSubModal({ kind: "atualizar", atualizacaoId: null })}
              >
                <Icon name="repeat" size={14} /> Atualizar valor
              </button>
              <button type="button" className="btn small ghost" style={{ borderColor: "var(--gray-400)" }} onClick={() => setSubModal({ kind: "transferir" })}>
                <Icon name="swap" size={14} /> Transferir
              </button>
            </div>
            <button type="button" className="btn ghost" onClick={onClose}>
              Fechar
            </button>
          </>
        }
      >
        <div className="kpi-grid cols4" style={{ marginBottom: 16 }}>
          <div className="kpi-card">
            <div className="lbl">Aportado no mês</div>
            <div className="val">{fmtMoney(aportadoMes)}</div>
          </div>
          <div className="kpi-card">
            <div className="lbl">Valor atual</div>
            <div className="val">{fmtMoney(valorAtual)}</div>
          </div>
          <div className="kpi-card">
            <div className="lbl">Rendimento no mês</div>
            <div className={`val ${rendimentoMesAtivo < 0 ? "neg" : "pos"}`}>{fmtMoney(rendimentoMesAtivo)}</div>
          </div>
          <div className="kpi-card">
            <div className="lbl">Rentabilidade no mês</div>
            <div className={`val ${rentMesPct < 0 ? "neg" : "pos"}`}>{rentMesPct.toFixed(2)}%</div>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th style={{ textAlign: "right" }}>Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">
                      <Icon name="empty" size={38} />
                      <div>Nenhuma movimentação registrada ainda.</div>
                    </div>
                  </td>
                </tr>
              )}
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>{e.data ? fmtDate(e.data) : "—"}</td>
                  <td>
                    <span className={`chip ${chipClasse(e.tipo)}`}>{LABEL_TIPO[e.tipo]}</span>
                  </td>
                  <td style={{ textAlign: "right" }} className={e.valor < 0 ? "neg" : "pos"}>
                    {e.valor < 0 ? "-" : "+"}
                    {fmtMoney(Math.abs(e.valor))}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button type="button" className="icon-btn" onClick={() => handleEditEntry(e)}>
                      <Icon name="edit" size={14} />
                    </button>
                    {e.kind !== "saldoInicial" && (
                      <button type="button" className="icon-btn danger" onClick={() => handleDeleteEntry(e)}>
                        <Icon name="trash" size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {confirmDialog}
      </Modal>

      {subModal?.kind === "aporte" && (
        <AporteModal ativoId={ativoId} tipo={subModal.tipo} aporteId={subModal.aporteId} onClose={() => setSubModal(null)} />
      )}
      {subModal?.kind === "atualizar" && (
        <AtualizarValorModal ativoId={ativoId} atualizacaoId={subModal.atualizacaoId} onClose={() => setSubModal(null)} />
      )}
      {subModal?.kind === "transferir" && <TransferenciaAtivoModal ativoOrigemId={ativoId} onClose={() => setSubModal(null)} />}
    </>
  );
}
