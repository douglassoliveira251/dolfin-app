import { useEffect, useState } from "react";
import { Icon } from "./components/icons/Icon";
import { ToastHost } from "./components/Toast";
import { createNew, openExisting, tryReconnect } from "./data/persistence";
import { useAppStore } from "./data/store";
import { Cartoes } from "./screens/Cartoes/Cartoes";
import { Categorias } from "./screens/Categorias/Categorias";
import { Contas } from "./screens/Contas/Contas";
import { Investimentos } from "./screens/Investimentos/Investimentos";
import { Lancamentos } from "./screens/Lancamentos/Lancamentos";
import { Metas } from "./screens/Metas/Metas";
import { Orcamento } from "./screens/Orcamento/Orcamento";
import { Tags } from "./screens/Tags/Tags";

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
 * Navegação provisória entre as telas já migradas, só para poder testá-las.
 * Será substituída pela sidebar real quando mais telas existirem.
 */
const SCREENS = [
  { id: "contas", label: "Contas", Component: Contas },
  { id: "cartoes", label: "Cartões", Component: Cartoes },
  { id: "categorias", label: "Categorias", Component: Categorias },
  { id: "investimentos", label: "Investimentos", Component: Investimentos },
  { id: "lancamentos", label: "Lançamentos", Component: Lancamentos },
  { id: "metas", label: "Metas", Component: Metas },
  { id: "orcamento", label: "Orçamento", Component: Orcamento },
  { id: "tags", label: "Tags", Component: Tags },
] as const;

function ConnectedApp() {
  const [screenId, setScreenId] = useState<(typeof SCREENS)[number]["id"]>(SCREENS[0].id);
  const Screen = SCREENS.find((s) => s.id === screenId)!.Component;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div className="tabs-card" style={{ margin: "20px 28px 0" }}>
        {SCREENS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`pill-opt${screenId === s.id ? " active" : ""}`}
            onClick={() => setScreenId(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <Screen />
    </div>
  );
}

function App() {
  const connected = useAppStore((s) => s.connected);
  return (
    <>
      {connected ? <ConnectedApp /> : <ConnectScreen />}
      <ToastHost />
    </>
  );
}

export default App;
