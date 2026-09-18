import { useState } from "react";
import { useConfirm } from "../../components/ConfirmDialog";
import { contrastIconColor } from "../../data/colors";
import { CategoryIcon } from "../../components/icons/CategoryIcon";
import { CATEGORY_ICONS, type CategoryIconName } from "../../components/icons/categoryRegistry";
import { Icon } from "../../components/icons/Icon";
import { showToast } from "../../components/Toast";
import { competenciaAberta, faturaPrecisaPagar, totalFaturaMes, vencimentoCompetencia } from "../../data/calculations/cartoes";
import { fmtDate, fmtMoney } from "../../data/format";
import { persist } from "../../data/persistence";
import { useAppStore } from "../../data/store";
import { CartaoModal } from "./CartaoModal";
import { ExtratoFaturaModal } from "./ExtratoFaturaModal";

function bandeiraMonoIcon(bandeira: string): CategoryIconName {
  const key = `bandeira${bandeira.charAt(0).toUpperCase()}${bandeira.slice(1)}Mono`;
  return (key in CATEGORY_ICONS ? key : "bandeiraOutrosMono") as CategoryIconName;
}

export function Cartoes() {
  const data = useAppStore((s) => s.data);
  const setCartaoArquivada = useAppStore((s) => s.setCartaoArquivada);
  const deleteCartao = useAppStore((s) => s.deleteCartao);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [extratoCartaoId, setExtratoCartaoId] = useState<string | null>(null);
  const { confirm, dialog: confirmDialog } = useConfirm();

  const cartoesAtivos = data.cartoes.filter((c) => !c.arquivada);

  function openCreate() {
    setEditingId(null);
    setModalOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setModalOpen(true);
  }

  async function handleArquivar(id: string) {
    const ok = await confirm("Arquivar este cartão? Ele sai das telas principais, mas o histórico é mantido.");
    if (!ok) return;
    setCartaoArquivada(id, true);
    await persist();
    showToast("Cartão arquivado.");
  }

  async function handleExcluir(id: string) {
    const ok = await confirm("Deseja excluir este cartão?", { danger: true });
    if (!ok) return;
    deleteCartao(id);
    await persist();
    showToast("Cartão excluído.");
  }

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1>Cartões de Crédito</h1>
          <div className="sub">Faturas e limites dos seus cartões</div>
        </div>
        <button type="button" className="btn-create" onClick={openCreate}>
          <span className="badge-plus">
            <Icon name="plus" size={14} />
          </span>{" "}
          Novo cartão
        </button>
      </div>

      <div className="cartoes-grid">
        {cartoesAtivos.length === 0 && (
          <div className="empty-state">
            <Icon name="empty" size={38} />
            <div>Nenhum cartão cadastrado.</div>
          </div>
        )}
        {cartoesAtivos.map((c) => {
          const venc = faturaPrecisaPagar(data, c);
          const mesRefAtualKey = competenciaAberta(c);
          const [refY, refM] = mesRefAtualKey.split("-").map(Number);
          const mesRefAtual = new Date(refY, refM - 1, 1);
          const totalFaturaAtual = totalFaturaMes(data, c.id, mesRefAtual);
          const mesVencAtualCartao = vencimentoCompetencia(c, mesRefAtual);
          const corTexto = contrastIconColor(c.cor);
          const corSuaveBtn = corTexto === "#FFFFFF" ? "rgba(255,255,255,.22)" : "rgba(0,0,0,.10)";
          const digitos = c.ultimosDigitos && c.ultimosDigitos.length === 4 ? c.ultimosDigitos : "0000";

          return (
            <div
              key={c.id}
              className={`card dash-cartao-mini${c.padrao ? " ribbon-padrao" : ""}`}
              style={{
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                minHeight: 170,
                background: c.cor,
                color: corTexto,
                padding: 16,
                borderRadius: 16,
              }}
              onClick={() => setExtratoCartaoId(c.id)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <span style={{ width: 30, height: 18, display: "inline-flex", alignItems: "center", color: corTexto }}>
                  <CategoryIcon name={bandeiraMonoIcon(c.bandeira)} size={16} />
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 4, flex: "none" }} onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="icon-btn" title="Relatório" style={{ background: corSuaveBtn, color: corTexto }} onClick={() => showToast("Relatório em breve.")}>
                    <Icon name="report" size={14} />
                  </button>
                  <button type="button" className="icon-btn" title="Arquivar" style={{ background: corSuaveBtn, color: corTexto }} onClick={() => handleArquivar(c.id)}>
                    <Icon name="archive" size={14} />
                  </button>
                  <button type="button" className="icon-btn" title="Editar" style={{ background: corSuaveBtn, color: corTexto }} onClick={() => openEdit(c.id)}>
                    <Icon name="edit" size={14} />
                  </button>
                  <button type="button" className="icon-btn danger" title="Excluir" style={{ background: corSuaveBtn, color: corTexto }} onClick={() => handleExcluir(c.id)}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
              <div style={{ marginTop: 14, minWidth: 0 }}>
                <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: corTexto }}>{c.nome}</strong>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ textAlign: "right" }}>
                {venc && (
                  <div>
                    <span className="badge-status previsto" style={{ whiteSpace: "nowrap", display: "inline-block", marginBottom: 4 }}>
                      Pagar até {fmtDate(venc.toISOString().slice(0, 10))}
                    </span>
                  </div>
                )}
                <div style={{ fontSize: 11, opacity: 0.8 }}>Vence em {fmtDate(mesVencAtualCartao.toISOString().slice(0, 10))}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 4 }}>
                <span style={{ fontSize: 13, letterSpacing: 1.5, opacity: 0.85, flex: "none" }}>**** {digitos}</span>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 26, lineHeight: 1.1, color: corTexto, textAlign: "right" }}>
                  {fmtMoney(totalFaturaAtual)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && <CartaoModal cartaoId={editingId} onClose={() => setModalOpen(false)} />}
      {extratoCartaoId && <ExtratoFaturaModal cartaoId={extratoCartaoId} onClose={() => setExtratoCartaoId(null)} />}
      {confirmDialog}
    </div>
  );
}
