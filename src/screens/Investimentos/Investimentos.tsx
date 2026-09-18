import { useState } from "react";
import { useConfirm } from "../../components/ConfirmDialog";
import { EntityCircle } from "../../components/EntityCircle";
import { Icon } from "../../components/icons/Icon";
import { KebabMenu } from "../../components/KebabMenu";
import { showToast } from "../../components/Toast";
import {
  aportadoNoMes,
  calcPatrimonioInvestido,
  rendimentoNoMes,
  rentabilidadeJanela,
  rentabilidadeMesTotal,
  rentabilidadeProjetadaAnual,
  valorAtualAtivo,
} from "../../data/calculations/investimentos";
import { lancamentosDoMes } from "../../data/calculations/lancamentos";
import { diaAnteriorA, fmtMoney, monthKey, primeiroDiaMes, ultimoDiaMes } from "../../data/format";
import { persist } from "../../data/persistence";
import { useAppStore } from "../../data/store";
import { CategoriaModal } from "../Categorias/CategoriaModal";
import { AtivoExtratoModal } from "./AtivoExtratoModal";
import { AtivoModal } from "./AtivoModal";

export function Investimentos() {
  const state = useAppStore((s) => s.data);
  const currentMonth = useAppStore((s) => s.currentMonth);
  const deleteAtivoComHistorico = useAppStore((s) => s.deleteAtivoComHistorico);
  const { confirm, dialog: confirmDialog } = useConfirm();

  const [ativoModal, setAtivoModal] = useState<{ id: string | null } | null>(null);
  const [extratoAtivoId, setExtratoAtivoId] = useState<string | null>(null);
  const [categoriaModalOpen, setCategoriaModalOpen] = useState(false);

  const fimMesRef = ultimoDiaMes(currentMonth);
  const ativos = state.investimentos.ativos.filter((a) => a.ativo && (!a.dataCriacao || a.dataCriacao <= fimMesRef));
  const aportadoTotal = ativos.reduce((s, a) => s + aportadoNoMes(state, a.id, currentMonth), 0);
  const rendimentoTotal = ativos.reduce((s, a) => s + rendimentoNoMes(state, a.id, currentMonth), 0);
  const atualTotal = calcPatrimonioInvestido(state, ultimoDiaMes(currentMonth));
  const rentMesTotal = rentabilidadeMesTotal(state, rendimentoTotal, currentMonth);
  const receitasMes = lancamentosDoMes(state, currentMonth)
    .filter((l) => l.tipo === "entrada" && l.efetivado)
    .reduce((s, l) => s + l.valor, 0);
  const aportadoPct = receitasMes > 0 ? (aportadoTotal / receitasMes) * 100 : 0;

  const contasComAtivo = state.contas.filter((c) => ativos.some((a) => a.contaId === c.id));
  const semConta = ativos.filter((a) => !a.contaId || !state.contas.find((c) => c.id === a.contaId));
  const grupos = [
    ...contasComAtivo.map((c) => ({ conta: c, itens: ativos.filter((a) => a.contaId === c.id) })),
    ...(semConta.length ? [{ conta: null, itens: semConta }] : []),
  ];

  async function handleExcluirAtivo(ativoId: string) {
    const ok = await confirm("Excluir este ativo e todo seu histórico de aportes?", { danger: true });
    if (!ok) return;
    deleteAtivoComHistorico(ativoId);
    await persist();
    showToast("Ativo excluído.");
  }

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1>Investimentos</h1>
          <div className="sub">Carteira, aportes e rentabilidade</div>
        </div>
        <button type="button" className="btn-create" onClick={() => setAtivoModal({ id: null })}>
          <span className="badge-plus">
            <Icon name="plus" size={14} />
          </span>{" "}
          Novo ativo
        </button>
      </div>

      <div className="kpi-grid cols5">
        <div className="kpi-card">
          <div className="lbl">Patrimônio inicial do mês</div>
          <div className="val">{fmtMoney(calcPatrimonioInvestido(state, diaAnteriorA(monthKey(currentMonth) + "-01")))}</div>
          <div className="mini-note">Antes de rendimentos e aportes</div>
        </div>
        <div className="kpi-card">
          <div className="lbl">Aportado no mês</div>
          <div className="val">{fmtMoney(aportadoTotal)}</div>
          <div className="mini-note">{aportadoPct.toFixed(1)}% das receitas</div>
        </div>
        <div className="kpi-card">
          <div className="lbl">Rendimento no mês</div>
          <div className={`val ${rendimentoTotal < 0 ? "neg" : "pos"}`}>{fmtMoney(rendimentoTotal)}</div>
        </div>
        <div className="kpi-card">
          <div className="lbl">Patrimônio Atual</div>
          <div className="val">{fmtMoney(atualTotal)}</div>
        </div>
        <div className="kpi-card">
          <div className="lbl">Rentabilidade no mês</div>
          <div className={`val ${rentMesTotal < 0 ? "neg" : "pos"}`}>{rentMesTotal.toFixed(2)}%</div>
        </div>
      </div>

      {ativos.length === 0 ? (
        <div className="table-wrap">
          <div className="table-scroll">
            <div className="empty-state">
              <Icon name="empty" size={38} />
              <div>Nenhum ativo cadastrado ainda.</div>
            </div>
          </div>
        </div>
      ) : (
        grupos.map((grupo) => {
          const totSaldoInicio = grupo.itens.reduce((s, a) => s + valorAtualAtivo(state, a.id, diaAnteriorA(primeiroDiaMes(currentMonth))), 0);
          const totAportado = grupo.itens.reduce((s, a) => s + aportadoNoMes(state, a.id, currentMonth), 0);
          const totRendimento = grupo.itens.reduce((s, a) => s + rendimentoNoMes(state, a.id, currentMonth), 0);
          const totValorTotal = grupo.itens.reduce((s, a) => s + valorAtualAtivo(state, a.id, ultimoDiaMes(currentMonth)), 0);
          const n = grupo.itens.length || 1;
          const media1m = grupo.itens.reduce((s, a) => s + rentabilidadeJanela(state, a.id, 1, currentMonth), 0) / n;
          const media3m = grupo.itens.reduce((s, a) => s + rentabilidadeJanela(state, a.id, 3, currentMonth), 0) / n;
          const media12m = grupo.itens.reduce((s, a) => s + rentabilidadeJanela(state, a.id, 12, currentMonth), 0) / n;
          const mediaProjetada = grupo.itens.reduce((s, a) => s + rentabilidadeProjetadaAnual(state, a.id, currentMonth), 0) / n;
          return (
            <div className="table-wrap" style={{ marginBottom: 16 }} key={grupo.conta?.id ?? "sem-conta"}>
              <div className="table-toolbar">
                {grupo.conta ? (
                  <strong style={{ display: "flex", alignItems: "center" }}>
                    <EntityCircle cor={grupo.conta.cor} icone={grupo.conta.icone} size={20} iconSize={11} />
                    {grupo.conta.nome}
                  </strong>
                ) : (
                  <strong className="mini-note">Sem conta associada</strong>
                )}
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 150 }}>Ativo</th>
                      <th>Categoria</th>
                      <th>Saldo início do mês</th>
                      <th>Aportado no mês</th>
                      <th>Rendimento no mês</th>
                      <th>Valor total</th>
                      <th>Neste mês</th>
                      <th>3 meses</th>
                      <th>
                        Último ano <span className="mini-note" style={{ textTransform: "none", fontWeight: 400 }}>/Projetado</span>
                      </th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.itens.map((a) => {
                      const saldoInicioMes = valorAtualAtivo(state, a.id, diaAnteriorA(primeiroDiaMes(currentMonth)));
                      const aportadoMes = aportadoNoMes(state, a.id, currentMonth);
                      const rendimentoMes = rendimentoNoMes(state, a.id, currentMonth);
                      const valorTotal = valorAtualAtivo(state, a.id, ultimoDiaMes(currentMonth));
                      const rent1m = rentabilidadeJanela(state, a.id, 1, currentMonth);
                      const rent3m = rentabilidadeJanela(state, a.id, 3, currentMonth);
                      const rent12m = rentabilidadeJanela(state, a.id, 12, currentMonth);
                      const rentProjetada = rentabilidadeProjetadaAnual(state, a.id, currentMonth);
                      const cat = a.categoriaId ? state.categorias.find((c) => c.id === a.categoriaId) : null;
                      return (
                        <tr key={a.id} style={{ cursor: "pointer" }} onClick={() => setExtratoAtivoId(a.id)}>
                          <td style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nome}</td>
                          <td>
                            {cat ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <EntityCircle cor={cat.cor} icone={cat.icone} />
                                {cat.nome}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>{fmtMoney(saldoInicioMes)}</td>
                          <td>{fmtMoney(aportadoMes)}</td>
                          <td className={rendimentoMes < 0 ? "neg" : "pos"}>{fmtMoney(rendimentoMes)}</td>
                          <td style={{ fontWeight: 600 }}>{fmtMoney(valorTotal)}</td>
                          <td className={rent1m < 0 ? "neg" : "pos"}>{rent1m.toFixed(2)}%</td>
                          <td className={rent3m < 0 ? "neg" : "pos"}>{rent3m.toFixed(2)}%</td>
                          <td className={rent12m < 0 ? "neg" : "pos"}>
                            {rent12m.toFixed(2)}% <span className="mini-note" style={{ display: "inline" }}>/{rentProjetada.toFixed(2)}%</span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <KebabMenu
                              items={[
                                { label: "Editar", onClick: () => setAtivoModal({ id: a.id }) },
                                { label: "Excluir", danger: true, onClick: () => handleExcluirAtivo(a.id) },
                              ]}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ fontWeight: 700, borderTop: "2px solid var(--line)" }}>
                      <td>Total</td>
                      <td></td>
                      <td>{fmtMoney(totSaldoInicio)}</td>
                      <td>{fmtMoney(totAportado)}</td>
                      <td className={totRendimento < 0 ? "neg" : "pos"}>{fmtMoney(totRendimento)}</td>
                      <td>{fmtMoney(totValorTotal)}</td>
                      <td className={media1m < 0 ? "neg" : "pos"}>{media1m.toFixed(2)}%</td>
                      <td className={media3m < 0 ? "neg" : "pos"}>{media3m.toFixed(2)}%</td>
                      <td className={media12m < 0 ? "neg" : "pos"}>
                        {media12m.toFixed(2)}% <span className="mini-note" style={{ display: "inline", fontWeight: 400 }}>/{mediaProjetada.toFixed(2)}%</span>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        })
      )}

      {ativoModal && (
        <AtivoModal ativoId={ativoModal.id} onClose={() => setAtivoModal(null)} onRequestNovaCategoria={() => setCategoriaModalOpen(true)} />
      )}
      {extratoAtivoId && (
        <AtivoExtratoModal ativoId={extratoAtivoId} onClose={() => setExtratoAtivoId(null)} onEditAtivo={() => setAtivoModal({ id: extratoAtivoId })} />
      )}
      {categoriaModalOpen && (
        <CategoriaModal categoriaId={null} tipoPreset="investimento" onClose={() => setCategoriaModalOpen(false)} onNavigate={() => {}} />
      )}
      {confirmDialog}
    </div>
  );
}
