import { useState } from "react";
import { EntityCircle } from "../../components/EntityCircle";
import { Modal } from "../../components/Modal";
import { fmtDate, fmtMoney } from "../../data/format";
import type { Aporte } from "../../data/schema";
import { useAppStore } from "../../data/store";
import { AtivoExtratoModal } from "../Investimentos/AtivoExtratoModal";

export function AportesPrevistosModal({ titulo, aportes, onClose }: { titulo: string; aportes: Aporte[]; onClose: () => void }) {
  const state = useAppStore((s) => s.data);
  const [ativoId, setAtivoId] = useState<string | null>(null);

  return (
    <>
      <Modal title={titulo} onClose={onClose} closeOnBackdropClick>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {aportes.map((a) => {
            const ativo = a.ativoId ? state.investimentos.ativos.find((x) => x.id === a.ativoId) : null;
            const conta = a.contaId ? state.contas.find((c) => c.id === a.contaId) : null;
            return (
              <div
                key={a.id}
                className="lanc-row"
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 4px", cursor: "pointer", borderBottom: "1px solid var(--line)" }}
                onClick={() => a.ativoId && setAtivoId(a.ativoId)}
              >
                {conta && <EntityCircle cor={conta.cor} icone={conta.icone} />}
                <div style={{ flex: 1 }}>
                  <div>{ativo ? ativo.nome : "—"}</div>
                  <div className="mini-note">
                    {fmtDate(a.data)}
                    {conta ? ` · ${conta.nome}` : ""}
                  </div>
                </div>
                <span className="neg">{fmtMoney(a.valor)}</span>
              </div>
            );
          })}
        </div>
      </Modal>
      {ativoId && <AtivoExtratoModal ativoId={ativoId} onClose={() => setAtivoId(null)} onEditAtivo={() => {}} />}
    </>
  );
}
