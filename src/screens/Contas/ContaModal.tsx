import { useState } from "react";
import { ColorPicker } from "../../components/ColorPicker";
import { IconPicker } from "../../components/IconPicker";
import type { CategoryIconName } from "../../components/icons/categoryRegistry";
import { Modal } from "../../components/Modal";
import { MoneyInput } from "../../components/MoneyInput";
import { Switch } from "../../components/Switch";
import { showToast } from "../../components/Toast";
import { persist } from "../../data/persistence";
import type { Conta, TipoConta } from "../../data/schema";
import { uid } from "../../data/schema";
import { useAppStore } from "../../data/store";

const ACCOUNT_TYPE_ICON: Record<TipoConta, CategoryIconName> = {
  corrente: "bank",
  poupanca: "bank",
  carteira: "bank",
  investimento: "bank",
};

const ICON_OPTIONS: CategoryIconName[] = ["bank", "piggy", "wallet", "investment"];

interface ContaModalProps {
  contaId: string | null;
  onClose: () => void;
}

export function ContaModal({ contaId, onClose }: ContaModalProps) {
  const editing = !!contaId;
  const contas = useAppStore((s) => s.data.contas);
  const saveConta = useAppStore((s) => s.saveConta);
  const existente = editing ? contas.find((c) => c.id === contaId) : null;

  const [nome, setNome] = useState(existente?.nome ?? "");
  const [tipo, setTipo] = useState<TipoConta>(existente?.tipo ?? "corrente");
  const [moeda, setMoeda] = useState(existente?.moeda ?? "BRL");
  const [icone, setIcone] = useState<string>(existente?.icone ?? "bank");
  const [cor, setCor] = useState(existente?.cor ?? "#173E37");
  const [saldoInicial, setSaldoInicial] = useState(existente?.saldoInicial ?? 0);
  const [oculta, setOculta] = useState(existente?.oculta ?? false);
  const [padrao, setPadrao] = useState(existente?.padrao ?? false);

  function handleTipoChange(novoTipo: TipoConta) {
    setTipo(novoTipo);
    if (!editing) setIcone(ACCOUNT_TYPE_ICON[novoTipo]);
  }

  async function handleSave() {
    const nomeTrim = nome.trim();
    if (!nomeTrim) {
      showToast("Informe um nome.");
      return;
    }
    const conta: Conta = {
      id: editing ? (contaId as string) : uid("conta"),
      nome: nomeTrim,
      tipo,
      moeda,
      icone: icone || "bank",
      categoriaContaId: existente?.categoriaContaId ?? null,
      saldoInicial,
      cor,
      oculta,
      arquivada: existente?.arquivada ?? false,
      padrao,
      ativo: true,
    };
    saveConta(conta);
    await persist();
    onClose();
    showToast("Conta salva.");
  }

  return (
    <Modal
      title={editing ? "Editar conta" : "Nova conta"}
      onClose={onClose}
      footer={
        <>
          <div />
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="btn primary" onClick={handleSave}>
              Salvar
            </button>
          </div>
        </>
      }
    >
      <div className="field-row" style={{ gridTemplateColumns: "auto 1fr auto", alignItems: "flex-end", gap: 14 }}>
        <div className="field" style={{ alignItems: "center" }}>
          <IconPicker value={icone} onChange={(k) => setIcone(k)} keys={ICON_OPTIONS} />
        </div>
        <label className="field">
          Nome <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>
        <div className="field" style={{ alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 5 }}>Cor</span>
          <ColorPicker value={cor} onChange={setCor} />
        </div>
      </div>

      <div className="field-row">
        <label className="field">
          Tipo
          <select value={tipo} onChange={(e) => handleTipoChange(e.target.value as TipoConta)}>
            <option value="corrente">Conta corrente</option>
            <option value="poupanca">Poupança</option>
            <option value="carteira">Carteira / dinheiro</option>
            <option value="investimento">Conta investimento</option>
          </select>
        </label>
        <label className="field">
          Moeda principal
          <select value={moeda} onChange={(e) => setMoeda(e.target.value)}>
            <option value="BRL">R$ — Real (BRL)</option>
            <option value="USD">US$ — Dólar (USD)</option>
            <option value="EUR">€ — Euro (EUR)</option>
            <option value="GBP">£ — Libra (GBP)</option>
            <option value="MXN">MX$ — Peso mexicano (MXN)</option>
          </select>
        </label>
      </div>

      <label className="field">
        Saldo inicial
        <MoneyInput value={saldoInicial} onChange={setSaldoInicial} />
      </label>

      <div className="toggle-row" style={{ padding: "10px 0 0" }}>
        <div className="ti">
          <h4>Ocultar esta conta da tela principal</h4>
          <p>Mesmo com saldo, ela não aparecerá no Dashboard. O histórico e o saldo continuam sendo calculados normalmente.</p>
        </div>
        <Switch on={oculta} onToggle={() => setOculta((v) => !v)} />
      </div>
      <div className="toggle-row">
        <div className="ti">
          <h4>Definir como conta padrão</h4>
          <p>Usada como sugestão automática ao criar um novo lançamento.</p>
        </div>
        <Switch on={padrao} onToggle={() => setPadrao((v) => !v)} />
      </div>
    </Modal>
  );
}
