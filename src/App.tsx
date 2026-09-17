import { useEffect, useState } from "react";
import { CustomSelect } from "./components/CustomSelect";
import { Icon } from "./components/icons/Icon";
import { KpiCard } from "./components/KpiCard";
import { Modal } from "./components/Modal";
import { fmtMoney } from "./data/format";
import { createNew, disconnect, openExisting, tryReconnect } from "./data/persistence";
import { useAppStore } from "./data/store";

function ConnectScreen() {
  const [hint, setHint] = useState("");
  const [reconnect, setReconnect] = useState<{ fileName: string; retry: () => Promise<{ ok: boolean; error?: string }> } | null>(null);

  useEffect(() => {
    (async () => {
      const result = await tryReconnect();
      if (result.status === "needs-click") {
        setReconnect({ fileName: result.fileName, retry: result.retry });
      }
    })();
  }, []);

  async function handleOpen() {
    setHint("");
    const res = await openExisting();
    if (!res.ok && res.error) setHint(res.error);
  }

  async function handleCreate() {
    setHint("");
    const res = await createNew();
    if (!res.ok && res.error) setHint(res.error);
  }

  async function handleReconnect() {
    if (!reconnect) return;
    const res = await reconnect.retry();
    if (res.ok) setReconnect(null);
    else setHint(res.error || "");
  }

  return (
    <div id="connectScreen">
      <div className="brand-lockup">
        <div className="logo-mark-lg">
          <Icon name="dashboard" size={32} />
        </div>
        <div className="mark">Dolfin</div>
      </div>
      <div className="slogan">Controle Financeiro Pessoal</div>
      <p className="sub">
        Seus dados ficam sempre em um arquivo JSON local, sob seu controle. Abra um arquivo existente ou crie um novo
        para começar.
      </p>
      {reconnect && (
        <div className="connect-actions" style={{ marginBottom: 14 }}>
          <button type="button" className="btn primary" style={{ width: "100%", justifyContent: "center" }} onClick={handleReconnect}>
            Reconectar a "{reconnect.fileName}"
          </button>
        </div>
      )}
      <div className="connect-actions">
        <button type="button" className="btn primary" onClick={handleOpen}>
          Abrir arquivo existente
        </button>
        <button
          type="button"
          className="btn"
          style={{ background: "var(--surface)", color: "var(--sidebar-accent)", borderColor: "var(--sidebar-accent)" }}
          onClick={handleCreate}
        >
          Criar novo arquivo
        </button>
      </div>
      <div className="hint">{hint}</div>
    </div>
  );
}

/**
 * Página temporária de validação da Fase 1: prova que a camada de dados
 * (schema + persistência) e os componentes-base funcionam juntos. Será
 * substituída pelo roteamento das 11 telas reais na Fase 2.
 */
function Fase1Playground() {
  const data = useAppStore((s) => s.data);
  const [modalOpen, setModalOpen] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState<string | null>(data.contas[0]?.id ?? null);

  const saldoTotal = data.contas.reduce((acc, c) => acc + c.saldoInicial, 0);
  const options = data.contas.map((c) => ({ id: c.id, label: c.nome, color: c.cor }));

  return (
    <main style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}>Dolfin — Fase 1</h1>
      <p className="mini-note">Validação dos componentes-base extraídos: KpiCard, Modal, CustomSelect e ícones.</p>

      <div className="kpi-grid cols3" style={{ marginTop: 20 }}>
        <KpiCard
          icon="kpiWallet"
          iconBgLight="#DFF0E4"
          iconColorLight="var(--positive)"
          iconBgDark="#16A34A"
          label="Contas cadastradas"
          value={data.contas.length}
        />
        <KpiCard
          icon="lanc"
          iconBgLight="#F5E0DC"
          iconColorLight="var(--negative)"
          iconBgDark="#DC2626"
          label="Lançamentos"
          value={data.lancamentos.length}
        />
        <KpiCard
          icon="kpiCoin"
          iconBgLight="#EDE3F5"
          iconColorLight="var(--type-investimento)"
          iconBgDark="#7C3AED"
          label="Saldo inicial somado"
          value={fmtMoney(saldoTotal)}
          valueTone={saldoTotal < 0 ? "neg" : "pos"}
        />
      </div>

      <div style={{ marginTop: 24, display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ width: 260 }}>
          <CustomSelect options={options} value={contaSelecionada} onChange={setContaSelecionada} placeholder="Selecionar conta" />
        </div>
        <button type="button" className="btn primary" onClick={() => setModalOpen(true)}>
          Abrir modal de teste
        </button>
        <button type="button" className="btn ghost" onClick={() => disconnect()}>
          Desconectar
        </button>
      </div>

      {modalOpen && (
        <Modal
          title="Modal de teste"
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <div />
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" className="btn ghost" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn primary" onClick={() => setModalOpen(false)}>
                  Salvar
                </button>
              </div>
            </>
          }
        >
          <p>
            Conteúdo de exemplo. Este componente substitui os ~20 blocos de <code>.portal-overlay</code> duplicados no
            arquivo original.
          </p>
        </Modal>
      )}
    </main>
  );
}

function App() {
  const connected = useAppStore((s) => s.connected);
  return connected ? <Fase1Playground /> : <ConnectScreen />;
}

export default App;
