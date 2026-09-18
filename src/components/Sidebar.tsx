import { useState } from "react";
import { Icon } from "./icons/Icon";
import type { IconName } from "./icons/registry";
import { SobreModal } from "./SobreModal";
import { getConnectedFileName, getLastSyncAt, persist } from "../data/persistence";
import type { ScreenId } from "../data/store";
import { useAppStore } from "../data/store";

const NAV_ITEMS: { id: ScreenId; label: string; icon: IconName }[] = [
  { id: "dashboard", label: "Resumo", icon: "dashboard" },
  { id: "lancamentos", label: "Lançamentos", icon: "lanc" },
  { id: "contas", label: "Contas", icon: "bank" },
  { id: "cartoes", label: "Cartões de Crédito", icon: "cartoes" },
  { id: "categorias", label: "Categorias", icon: "categorias" },
  { id: "metas", label: "Metas", icon: "target" },
  { id: "investimentos", label: "Investimentos", icon: "kpiTrend" },
  { id: "orcamento", label: "Orçamento", icon: "barChart" },
  { id: "tags", label: "Tags", icon: "tags" },
  { id: "relatorios", label: "Relatório", icon: "report" },
];

function fmtLastSync(d: Date): string {
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${ano} às ${hh}:${mm}`;
}

export function Sidebar() {
  const screenId = useAppStore((s) => s.screenId);
  const setScreenId = useAppStore((s) => s.setScreenId);
  const temaEscuro = useAppStore((s) => s.data.configuracoes.temaEscuro);
  const updateConfiguracoes = useAppStore((s) => s.updateConfiguracoes);
  const sidebarColapsada = useAppStore((s) => s.data.configuracoes.sidebarColapsada);
  const saving = useAppStore((s) => s.saving);
  const lastSyncAt = getLastSyncAt();
  const fileName = getConnectedFileName();
  const [sobreOpen, setSobreOpen] = useState(false);

  async function toggleColapso() {
    updateConfiguracoes({ sidebarColapsada: !sidebarColapsada });
    await persist();
  }

  async function toggleTema() {
    updateConfiguracoes({ temaEscuro: !temaEscuro });
    await persist();
  }

  return (
    <div className={`sidebar${sidebarColapsada ? " collapsed" : ""}`}>
      <button type="button" id="btnSidebarCollapse" title={sidebarColapsada ? "Maximizar menu" : "Minimizar menu"} onClick={toggleColapso}>
        <span className="tt-icon">
          <Icon name={sidebarColapsada ? "detail" : "chevronLeft"} size={11} />
        </span>
      </button>
      <div className="brand" style={{ alignItems: "center", textAlign: "left", padding: "6px 4px 4px" }}>
        <div className="brand-lockup-sb" style={{ justifyContent: "center", gap: 10 }}>
          <span style={{ color: "var(--sidebar-accent)", flex: "none", display: "flex" }}>
            <Icon name="dashboard" size={26} />
          </span>
          <div className="sidebar-brand-text">
            <span
              style={{
                display: "block",
                lineHeight: 1.05,
                fontFamily: "'Trebuchet MS','Century Gothic',Verdana,system-ui,sans-serif",
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: 2.2,
                color: "#A8ADB8",
              }}
            >
              DOLFIN
            </span>
            <small>Finanças Pessoais</small>
          </div>
        </div>
      </div>
      <div className="nav" style={{ marginTop: 22 }}>
        {NAV_ITEMS.map((item) => (
          <a
            key={item.id}
            href="#"
            className={`nav-item${screenId === item.id ? " active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setScreenId(item.id);
            }}
          >
            <Icon name={item.icon} size={16} />
            <span>{item.label}</span>
          </a>
        ))}
      </div>
      <div className="sidebar-foot">
        <a
          href="#"
          className="nav-item"
          style={{ marginBottom: 4 }}
          onClick={(e) => {
            e.preventDefault();
            toggleTema();
          }}
        >
          <span className="tt-icon">
            <Icon name={temaEscuro ? "sun" : "moon"} size={16} />
          </span>
          <span>{temaEscuro ? "Modo claro" : "Modo escuro"}</span>
        </a>
        <a
          href="#"
          className="nav-item"
          style={{ marginBottom: 8 }}
          onClick={(e) => {
            e.preventDefault();
            setSobreOpen(true);
          }}
        >
          <span className="tt-icon">
            <Icon name="info" size={16} />
          </span>
          <span>Sobre</span>
        </a>
        <div className="conn-pill" id="lastSyncPill" style={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={`dot${saving ? " saving" : ""}`} />
            <span style={{ fontSize: 10.5, color: "#8A8F99", textTransform: "uppercase", letterSpacing: 0.5 }}>Última sincronização</span>
          </div>
          <span className="fname" style={{ fontSize: 11.5, color: "#B8BCC5", paddingLeft: 20 }}>
            {fileName ? (lastSyncAt ? fmtLastSync(lastSyncAt) : "—") : "—"}
          </span>
          {saving && (
            <span className="mini-note" style={{ margin: "2px 0 0 20px", color: "#B8BCC5" }}>
              Salvando...
            </span>
          )}
        </div>
      </div>

      {sobreOpen && <SobreModal onClose={() => setSobreOpen(false)} />}
    </div>
  );
}
