import { useRef, useState } from "react";
import { Icon } from "../../components/icons/Icon";
import { Modal } from "../../components/Modal";
import { useConfirm } from "../../components/ConfirmDialog";
import { Switch } from "../../components/Switch";
import { showToast } from "../../components/Toast";
import { fmtDate } from "../../data/format";
import { disconnect, getConnectedFileName, persist } from "../../data/persistence";
import { useAppStore } from "../../data/store";
import { CropFotoModal } from "./CropFotoModal";

type ConfigTab = "perfil" | "personalizacao" | "arquivo";

const TABS: { id: ConfigTab; label: string; icon: "detail" | "config" | "dashboard" }[] = [
  { id: "perfil", label: "Perfil", icon: "detail" },
  { id: "personalizacao", label: "Personalização", icon: "config" },
  { id: "arquivo", label: "Arquivo Base", icon: "dashboard" },
];

export function Configuracoes() {
  const [tab, setTab] = useState<ConfigTab>("perfil");
  const [sobreOpen, setSobreOpen] = useState(false);

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1>Configurações</h1>
          <div className="sub">Preferências e personalização do sistema</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <div className="config-side-menu">
          {TABS.map((t) => (
            <button key={t.id} type="button" className={`config-side-item${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
              <Icon name={t.icon} size={16} /> {t.label}
            </button>
          ))}
          <button type="button" className="config-side-item" onClick={() => setSobreOpen(true)}>
            <Icon name="info" size={16} /> Sobre
          </button>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {tab === "perfil" && <PerfilTab />}
          {tab === "personalizacao" && <PersonalizacaoTab />}
          {tab === "arquivo" && <ArquivoTab />}
        </div>
      </div>

      {sobreOpen && (
        <Modal
          title="Sobre o Dolfin"
          onClose={() => setSobreOpen(false)}
          closeOnBackdropClick
          modalClassName="confirm-box"
          footer={
            <>
              <div />
              <button type="button" className="btn ghost" onClick={() => setSobreOpen(false)}>
                Fechar
              </button>
            </>
          }
        >
          <p style={{ marginBottom: 10 }}>
            <strong>Dolfin</strong> — Controle Financeiro Pessoal
          </p>
          <p className="mini-note" style={{ marginBottom: 10 }}>
            Aplicativo com dados salvos diretamente no seu computador via File System Access API.
          </p>
          <p className="mini-note" style={{ marginBottom: 4 }}>
            Versão: 1.11.021
          </p>
          <p className="mini-note">Navegador recomendado: Chrome ou Edge.</p>
        </Modal>
      )}
    </div>
  );
}

function PerfilTab() {
  const perfil = useAppStore((s) => s.data.perfil);
  const [nome, setNome] = useState(perfil.nome);
  const [email, setEmail] = useState(perfil.email);
  const [fotoTemp, setFotoTemp] = useState<string | null>(perfil.fotoDataUrl);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleEscolherFoto() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSalvarPerfil() {
    useAppStore.setState((s) => ({ data: { ...s.data, perfil: { nome: nome.trim(), email: email.trim(), fotoDataUrl: fotoTemp } } }));
    await persist();
    showToast("Perfil salvo.");
  }

  return (
    <div className="card">
      <h3>Perfil</h3>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 20, marginBottom: 20 }}>
        <div style={{ position: "relative", flex: "none" }}>
          <span
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--gold)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 20,
              overflow: "hidden",
              backgroundImage: fotoTemp ? `url(${fotoTemp})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {!fotoTemp && (
              <span className="tt-icon" style={{ width: 32, height: 32, color: "#fff" }}>
                <Icon name="userGeneric" size={32} />
              </span>
            )}
          </span>
          <button
            type="button"
            className="icon-btn"
            title="Escolher foto"
            onClick={handleEscolherFoto}
            style={{ position: "absolute", bottom: -2, right: -2, background: "var(--surface)", border: "2px solid var(--bg)", width: 22, height: 22 }}
          >
            <Icon name="edit" size={12} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
        </div>
        <div className="field-row" style={{ flex: 1, marginBottom: 0 }}>
          <label className="field" style={{ marginBottom: 0 }}>
            Nome
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            E-mail
            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
          </label>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="button" className="btn primary" style={{ marginTop: 6 }} onClick={handleSalvarPerfil}>
          Salvar perfil
        </button>
      </div>

      {cropSrc && (
        <CropFotoModal
          imgSrc={cropSrc}
          onClose={() => setCropSrc(null)}
          onDone={(dataUrl) => {
            setFotoTemp(dataUrl);
            setCropSrc(null);
          }}
        />
      )}
    </div>
  );
}

function PersonalizacaoTab() {
  const cfg = useAppStore((s) => s.data.configuracoes);
  const updateConfiguracoes = useAppStore((s) => s.updateConfiguracoes);

  async function toggle(key: keyof typeof cfg) {
    updateConfiguracoes({ [key]: !cfg[key] } as Partial<typeof cfg>);
    await persist();
    showToast("Preferência salva.");
  }

  async function handleFuso(v: string) {
    updateConfiguracoes({ fusoHorario: v });
    await persist();
    showToast("Fuso horário salvo.");
  }

  return (
    <div className="card">
      <h3>Personalização</h3>
      <div className="toggle-row">
        <div className="ti">
          <h4>Orçamento afeta o saldo previsto</h4>
          <p>Quando ativado, o valor ainda não gasto de cada orçamento planejado (Entrada, Despesa ou Investimento) é somado ao Saldo Previsto do Dashboard. Quando desativado, o Saldo Previsto considera apenas os lançamentos já registrados no mês.</p>
        </div>
        <Switch on={cfg.orcamentoAfetaPrevisto} onToggle={() => toggle("orcamentoAfetaPrevisto")} />
      </div>
      <div className="toggle-row">
        <div className="ti">
          <h4>Mostrar apenas contas com saldo</h4>
          <p>Quando ativado, contas com saldo zerado ficam ocultas nas listagens de Contas e no Dashboard.</p>
        </div>
        <Switch on={cfg.mostrarApenasContasComSaldo} onToggle={() => toggle("mostrarApenasContasComSaldo")} />
      </div>
      <div className="toggle-row">
        <div className="ti">
          <h4>Modo escuro</h4>
          <p>Alterna o tema visual do aplicativo para um fundo escuro.</p>
        </div>
        <Switch on={cfg.temaEscuro} onToggle={() => toggle("temaEscuro")} />
      </div>
      <div className="toggle-row">
        <div className="ti">
          <h4>Ordenar lançamentos do mais novo para o mais antigo</h4>
          <p>Quando desativado, as listas mostram do mais antigo para o mais novo.</p>
        </div>
        <Switch on={cfg.ordenacaoDecrescente} onToggle={() => toggle("ordenacaoDecrescente")} />
      </div>
      <div className="toggle-row">
        <div className="ti">
          <h4>Fuso horário</h4>
          <p>Usado para calcular "hoje" e os horários exibidos nos lançamentos.</p>
        </div>
        <select value={cfg.fusoHorario} style={{ width: "auto" }} onChange={(e) => handleFuso(e.target.value)}>
          <option value="-05:00">-05:00 (Acre)</option>
          <option value="-04:00">-04:00 (Amazonas)</option>
          <option value="-03:00">-03:00 (Brasília)</option>
        </select>
      </div>
      <div className="toggle-row">
        <div className="ti">
          <h4>Ocultar valores ao abrir</h4>
          <p>Os valores financeiros já começam ocultos toda vez que você reabrir o Dolfin.</p>
        </div>
        <Switch on={cfg.ocultarValoresAoAbrir} onToggle={() => toggle("ocultarValoresAoAbrir")} />
      </div>
    </div>
  );
}

function ArquivoTab() {
  const state = useAppStore((s) => s.data);
  const updateConfiguracoes = useAppStore((s) => s.updateConfiguracoes);
  const { confirm, dialog: confirmDialog } = useConfirm();
  const fileName = getConnectedFileName();

  async function handleSalvarAgora() {
    await persist(true);
    showToast("Arquivo salvo.");
  }

  async function handleTrocar() {
    const ok = await confirm("Isso desconecta o arquivo atual e abre o seletor para escolher outro. Continuar?");
    if (!ok) return;
    await disconnect();
  }

  async function handleDesconectar() {
    const ok = await confirm("Deseja desconectar deste arquivo? Seus dados continuam salvos localmente.", { okLabel: "Desconectar" });
    if (ok) await disconnect();
  }

  async function handleExportarBackup() {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const agora = new Date();
    const stamp = agora.toISOString().slice(0, 16).replace("T", "_").replace(":", "-");
    a.href = url;
    a.download = `dolfin_backup_${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    updateConfiguracoes({ ultimoBackup: agora.toISOString() });
    await persist();
    showToast("Backup exportado.");
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Arquivo base</h3>
        <p className="mini-note" style={{ marginBottom: 14 }}>
          Arquivo conectado: <strong>{fileName || "—"}</strong>
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="btn primary" onClick={handleSalvarAgora}>
            Salvar agora
          </button>
          <button type="button" className="btn" onClick={handleTrocar}>
            Carregar outro arquivo
          </button>
          <button type="button" className="btn danger-solid" onClick={handleDesconectar}>
            Desconectar
          </button>
        </div>
      </div>
      <div className="card">
        <h3 style={{ margin: "0 0 4px" }}>Gestão de dados</h3>
        <p className="mini-note" style={{ marginBottom: 14 }}>
          Último backup:{" "}
          <strong>
            {state.configuracoes.ultimoBackup ? `${fmtDate(state.configuracoes.ultimoBackup.slice(0, 10))} às ${state.configuracoes.ultimoBackup.slice(11, 16)}` : "nunca feito"}
          </strong>
        </p>
        <button type="button" className="btn primary" onClick={handleExportarBackup}>
          Exportar backup agora
        </button>
      </div>
      {confirmDialog}
    </>
  );
}
