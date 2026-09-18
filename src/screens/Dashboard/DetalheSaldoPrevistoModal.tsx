import { useState } from "react";
import { EntityCircle } from "../../components/EntityCircle";
import { Modal } from "../../components/Modal";
import { mesImpactoConta } from "../../data/calculations/contas";
import { realizadoOrcamento, valorPlanejadoEfetivo } from "../../data/calculations/orcamento";
import { fmtMoney, monthKey } from "../../data/format";
import type { Aporte, Categoria } from "../../data/schema";
import { useAppStore } from "../../data/store";
import { AportesPrevistosModal } from "./AportesPrevistosModal";
import { ExtratoKpiModalPrevisto } from "./ExtratoKpiModalPrevisto";

type AberturaTipo = "entrada" | "despesa" | "aportes" | "aportes-saidos" | null;

export function DetalheSaldoPrevistoModal({ onClose }: { onClose: () => void }) {
  const state = useAppStore((s) => s.data);
  const currentMonth = useAppStore((s) => s.currentMonth);
  const [abertura, setAbertura] = useState<AberturaTipo>(null);

  const mesKeyAlvo = monthKey(currentMonth);
  const entradasMes = state.lancamentos.filter((l) => l.tipo === "entrada" && mesImpactoConta(state, l) === mesKeyAlvo);
  const despesasMes = state.lancamentos.filter((l) => l.tipo === "despesa" && mesImpactoConta(state, l) === mesKeyAlvo);
  const totalEntradasMes = entradasMes.reduce((s, l) => s + l.valor, 0);
  const totalDespesasMes = despesasMes.reduce((s, l) => s + l.valor, 0);
  const aportesSaidosDaConta = state.investimentos.aportes.filter((a) => a.tipo === "aporte" && a.efetivado && a.contaId && a.data && a.data.slice(0, 7) === mesKeyAlvo);
  const totalAportesSaidos = aportesSaidosDaConta.reduce((s, a) => s + a.valor, 0);
  const aportesPrevistos = state.investimentos.aportes.filter((a) => a.tipo === "aporte" && !a.efetivado && a.contaId && a.data && a.data.slice(0, 7) === mesKeyAlvo);
  const totalAportes = aportesPrevistos.reduce((s, a) => s + a.valor, 0);

  let linhasOrcamento: { cat: Categoria; restante: number }[] = [];
  if (state.configuracoes.orcamentoAfetaPrevisto) {
    const orcamentosDoMes = state.orcamentos.filter(
      (o) => o.mesReferencia === mesKeyAlvo || (!o.mesReferencia && (!o.validoApartirDe || mesKeyAlvo >= monthKey(new Date(o.validoApartirDe + "T00:00:00")))),
    );
    orcamentosDoMes.forEach((o) => {
      const cat = o.categoriaId ? state.categorias.find((c) => c.id === o.categoriaId) : null;
      if (!cat) return;
      const realizado = realizadoOrcamento(state, o.categoriaId, currentMonth);
      const restante = valorPlanejadoEfetivo(o, currentMonth) - realizado;
      if (restante <= 0) return;
      linhasOrcamento.push({ cat, restante });
    });
  }
  const totalOrcamentoEntrada = linhasOrcamento.filter((l) => l.cat.tipo === "entrada").reduce((s, l) => s + l.restante, 0);
  const totalOrcamentoSaida = linhasOrcamento.filter((l) => l.cat.tipo === "despesa" || l.cat.tipo === "investimento").reduce((s, l) => s + l.restante, 0);

  return (
    <>
      <Modal title="Como chegamos no Saldo Previsto" onClose={onClose} closeOnBackdropClick>
        <p className="mini-note" style={{ marginBottom: 14 }}>
          A partir do saldo das contas, somamos entradas, descontamos despesas e aportes do mês (já realizados ou ainda previstos).
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div className="lanc-row" style={{ display: "flex", justifyContent: "space-between", padding: "10px 4px", cursor: "pointer", borderBottom: "1px solid var(--line)" }} onClick={() => setAbertura("entrada")}>
            <span>+ Entradas do mês ({entradasMes.length})</span>
            <span className="pos">{fmtMoney(totalEntradasMes)}</span>
          </div>
          <div className="lanc-row" style={{ display: "flex", justifyContent: "space-between", padding: "10px 4px", cursor: "pointer", borderBottom: "1px solid var(--line)" }} onClick={() => setAbertura("despesa")}>
            <span>− Despesas do mês ({despesasMes.length})</span>
            <span className="neg">{fmtMoney(totalDespesasMes)}</span>
          </div>
          {aportesSaidosDaConta.length > 0 && (
            <div className="lanc-row" style={{ display: "flex", justifyContent: "space-between", padding: "10px 4px", cursor: "pointer", borderBottom: "1px solid var(--line)" }} onClick={() => setAbertura("aportes-saidos")}>
              <span>− Aportes que já saíram das contas ({aportesSaidosDaConta.length})</span>
              <span className="neg">{fmtMoney(totalAportesSaidos)}</span>
            </div>
          )}
          {aportesPrevistos.length > 0 && (
            <div className="lanc-row" style={{ display: "flex", justifyContent: "space-between", padding: "10px 4px", cursor: "pointer", borderBottom: "1px solid var(--line)" }} onClick={() => setAbertura("aportes")}>
              <span>− Aportes previstos, com conta definida ({aportesPrevistos.length})</span>
              <span className="neg">{fmtMoney(totalAportes)}</span>
            </div>
          )}
          {state.configuracoes.orcamentoAfetaPrevisto ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 4px", borderBottom: "1px solid var(--line)" }}>
                <span>+ Restante do orçamento (entradas)</span>
                <span className="pos">{fmtMoney(totalOrcamentoEntrada)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 4px", borderBottom: "1px solid var(--line)" }}>
                <span>− Restante do orçamento (despesas e aportes)</span>
                <span className="neg">{fmtMoney(totalOrcamentoSaida)}</span>
              </div>
              {linhasOrcamento.length > 0 && (
                <div style={{ margin: "4px 0 4px 14px" }}>
                  {linhasOrcamento.map((l) => (
                    <div key={l.cat.id} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }} className="mini-note">
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <EntityCircle cor={l.cat.cor} icone={l.cat.icone} />
                        {l.cat.nome}
                      </span>
                      <span style={{ marginLeft: "auto" }}>
                        {l.cat.tipo === "entrada" ? "+" : "−"} {fmtMoney(l.restante)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="mini-note" style={{ padding: "10px 4px" }}>
              A opção "Orçamento afeta o saldo previsto" está desativada nas Configurações — o restante do orçamento não entra nesta conta.
            </p>
          )}
        </div>
      </Modal>

      {(abertura === "entrada" || abertura === "despesa") && (
        <ExtratoKpiModalPrevisto tipo={abertura} itens={abertura === "entrada" ? entradasMes : despesasMes} onClose={() => setAbertura(null)} />
      )}
      {abertura === "aportes" && <AportesPrevistosModal titulo="Aportes previstos com conta definida" aportes={aportesPrevistos as Aporte[]} onClose={() => setAbertura(null)} />}
      {abertura === "aportes-saidos" && <AportesPrevistosModal titulo="Aportes que já saíram das contas" aportes={aportesSaidosDaConta as Aporte[]} onClose={() => setAbertura(null)} />}
    </>
  );
}
