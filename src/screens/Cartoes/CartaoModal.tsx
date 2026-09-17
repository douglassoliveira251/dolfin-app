import { useState } from "react";
import { ColorPicker } from "../../components/ColorPicker";
import { CustomSelect, type CustomSelectOption } from "../../components/CustomSelect";
import { EntityCircle } from "../../components/EntityCircle";
import { IconPicker } from "../../components/IconPicker";
import { CategoryIcon } from "../../components/icons/CategoryIcon";
import type { CategoryIconName } from "../../components/icons/categoryRegistry";
import { Modal } from "../../components/Modal";
import { MoneyInput } from "../../components/MoneyInput";
import { Switch } from "../../components/Switch";
import { showToast } from "../../components/Toast";
import { persist } from "../../data/persistence";
import type { Cartao } from "../../data/schema";
import { uid } from "../../data/schema";
import { useAppStore } from "../../data/store";

const ICON_OPTIONS: CategoryIconName[] = ["card", "wallet", "bank", "briefcase"];

const BANDEIRA_OPTIONS: CustomSelectOption[] = [
  {
    id: "mastercard",
    label: "Mastercard",
    icon: (
      <span className="cat-circle" style={{ background: "var(--surface-2)", width: 30, height: 30 }}>
        <CategoryIcon name="bandeiraMastercard" size={20} />
      </span>
    ),
  },
  {
    id: "visa",
    label: "Visa",
    icon: (
      <span className="cat-circle" style={{ background: "var(--surface-2)", width: 30, height: 30 }}>
        <CategoryIcon name="bandeiraVisa" size={20} />
      </span>
    ),
  },
  {
    id: "outros",
    label: "Outros",
    icon: (
      <span className="cat-circle" style={{ background: "var(--surface-2)", color: "var(--gray-400)", width: 30, height: 30 }}>
        <CategoryIcon name="bandeiraOutros" size={20} />
      </span>
    ),
  },
];

interface CartaoModalProps {
  cartaoId: string | null;
  onClose: () => void;
}

export function CartaoModal({ cartaoId, onClose }: CartaoModalProps) {
  const editing = !!cartaoId;
  const cartoes = useAppStore((s) => s.data.cartoes);
  const contas = useAppStore((s) => s.data.contas);
  const saveCartao = useAppStore((s) => s.saveCartao);
  const existente = editing ? cartoes.find((c) => c.id === cartaoId) : null;

  const [nome, setNome] = useState(existente?.nome ?? "");
  const [icone, setIcone] = useState<string>(existente?.icone ?? "card");
  const [cor, setCor] = useState(existente?.cor ?? "#B8863A");
  const [contaVinculada, setContaVinculada] = useState<string | null>(
    existente?.contaVinculada ?? (contas[0]?.id ?? null),
  );
  const [bandeira, setBandeira] = useState(existente?.bandeira ?? "outros");
  const [ultimosDigitos, setUltimosDigitos] = useState(existente?.ultimosDigitos ?? "");
  const [diaFechamento, setDiaFechamento] = useState(existente?.diaFechamento ?? 25);
  const [diaVencimento, setDiaVencimento] = useState(existente?.diaVencimento ?? 5);
  const [limite, setLimite] = useState(existente?.limite ?? 0);
  const [mostrarNoDashboard, setMostrarNoDashboard] = useState(existente?.mostrarNoDashboard ?? true);
  const [padrao, setPadrao] = useState(existente?.padrao ?? false);

  const contaOptions: CustomSelectOption[] = contas.map((c) => ({
    id: c.id,
    label: c.nome,
    color: c.cor,
    icon: <EntityCircle cor={c.cor} icone={c.icone} size={20} iconSize={11} />,
  }));

  async function handleSave() {
    const nomeTrim = nome.trim();
    if (!nomeTrim) {
      showToast("Informe um nome.");
      return;
    }
    const cartao: Cartao = {
      id: editing ? (cartaoId as string) : uid("cartao"),
      nome: nomeTrim,
      icone: icone || "card",
      bandeira: bandeira || "outros",
      contaVinculada,
      diaFechamento: Number(diaFechamento) || 25,
      diaVencimento: Number(diaVencimento) || 5,
      limite,
      ultimosDigitos: ultimosDigitos.trim(),
      cor,
      padrao,
      mostrarNoDashboard,
      ativo: true,
      arquivada: existente?.arquivada ?? false,
    };
    saveCartao(cartao);
    await persist();
    onClose();
    showToast("Cartão salvo.");
  }

  return (
    <Modal
      title={editing ? "Editar cartão" : "Novo cartão"}
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

      <div className="field-row" style={{ gridTemplateColumns: "1.4fr 1fr 0.7fr", gap: 12, alignItems: "flex-end" }}>
        <label className="field">
          Conta vinculada (débito da fatura)
          <CustomSelect options={contaOptions} value={contaVinculada} onChange={setContaVinculada} placeholder="Selecionar conta" />
        </label>
        <label className="field">
          Bandeira
          <CustomSelect options={BANDEIRA_OPTIONS} value={bandeira} onChange={setBandeira} placeholder="Selecionar bandeira" />
        </label>
        <label className="field">
          Últimos 4 dígitos
          <input
            type="text"
            maxLength={4}
            inputMode="numeric"
            placeholder="0000"
            value={ultimosDigitos}
            onChange={(e) => setUltimosDigitos(e.target.value.replace(/\D/g, "").slice(0, 4))}
            style={{ minHeight: 40, boxSizing: "border-box" }}
          />
        </label>
      </div>

      <div className="field-row3">
        <label className="field">
          Fecha dia
          <input type="number" min={1} max={31} value={diaFechamento} onChange={(e) => setDiaFechamento(Number(e.target.value))} />
        </label>
        <label className="field">
          Vence dia
          <input type="number" min={1} max={31} value={diaVencimento} onChange={(e) => setDiaVencimento(Number(e.target.value))} />
        </label>
        <label className="field">
          Limite
          <MoneyInput value={limite} onChange={setLimite} />
        </label>
      </div>

      <div className="toggle-row">
        <div className="ti">
          <h4>Mostrar na tela inicial</h4>
          <p>Desative para ocultar este cartão do Dashboard. Ele continua disponível na tela de Cartões normalmente.</p>
        </div>
        <Switch on={mostrarNoDashboard} onToggle={() => setMostrarNoDashboard((v) => !v)} />
      </div>
      <div className="toggle-row">
        <div className="ti">
          <h4>Definir como cartão padrão</h4>
          <p>Usado como sugestão automática ao marcar um lançamento como despesa de cartão.</p>
        </div>
        <Switch on={padrao} onToggle={() => setPadrao((v) => !v)} />
      </div>
    </Modal>
  );
}
