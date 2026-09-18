import { useState } from "react";
import { CustomSelect, type CustomSelectOption } from "../../components/CustomSelect";
import { EntityCircle } from "../../components/EntityCircle";
import { Icon } from "../../components/icons/Icon";
import { Modal } from "../../components/Modal";
import { MoneyInput } from "../../components/MoneyInput";
import { showToast } from "../../components/Toast";
import { persist } from "../../data/persistence";
import type { Ativo } from "../../data/schema";
import { uid } from "../../data/schema";
import { todayStr } from "../../data/format";
import { useAppStore } from "../../data/store";

interface AtivoModalProps {
  ativoId: string | null;
  onClose: () => void;
  onRequestNovaCategoria: () => void;
}

export function AtivoModal({ ativoId, onClose, onRequestNovaCategoria }: AtivoModalProps) {
  const editing = !!ativoId;
  const categorias = useAppStore((s) => s.data.categorias);
  const contas = useAppStore((s) => s.data.contas);
  const ativos = useAppStore((s) => s.data.investimentos.ativos);
  const saveAtivo = useAppStore((s) => s.saveAtivo);

  const existente = editing ? (ativos.find((a) => a.id === ativoId) ?? null) : null;
  const catsInvestimento = categorias.filter((c) => c.tipo === "investimento" && !c.arquivada);

  const [nome, setNome] = useState(existente?.nome ?? "");
  const [categoriaId, setCategoriaId] = useState<string | null>(existente?.categoriaId ?? catsInvestimento[0]?.id ?? null);
  const [contaId, setContaId] = useState<string | null>(existente?.contaId ?? contas[0]?.id ?? null);
  const [saldoInicial, setSaldoInicial] = useState(existente?.saldoInicial ?? 0);

  const catOptions: CustomSelectOption[] = catsInvestimento.map((c) => ({
    id: c.id,
    label: c.nome,
    color: c.cor,
    icon: <EntityCircle cor={c.cor} icone={c.icone} />,
  }));
  const contaOptions: CustomSelectOption[] = contas
    .filter((c) => !c.arquivada)
    .map((c) => ({ id: c.id, label: c.nome, color: c.cor, icon: <EntityCircle cor={c.cor} icone={c.icone} /> }));

  async function handleSave() {
    const nomeTrim = nome.trim();
    if (!nomeTrim) {
      showToast("Informe um nome.");
      return;
    }
    if (!categoriaId) {
      showToast("Cadastre uma categoria de investimento primeiro.");
      return;
    }
    const ativo: Ativo = {
      id: editing ? (ativoId as string) : uid("ativo"),
      nome: nomeTrim,
      categoriaId,
      tipoLegado: existente?.tipoLegado ?? null,
      contaId,
      saldoInicial,
      dataCriacao: editing ? (existente?.dataCriacao ?? todayStr()) : todayStr(),
      ativo: true,
    };
    saveAtivo(ativo);
    await persist();
    onClose();
    showToast("Ativo salvo.");
  }

  return (
    <Modal
      title={editing ? "Editar ativo" : "Novo ativo"}
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
      <label className="field">
        Nome
        <input type="text" placeholder="Ex: Tesouro Selic 2029, PETR4, Fundo XP..." value={nome} onChange={(e) => setNome(e.target.value)} />
      </label>
      <label className="field">
        Categoria
        <CustomSelect options={catOptions} value={categoriaId} onChange={setCategoriaId} placeholder="Selecionar categoria" />
      </label>
      <button
        type="button"
        className="btn ghost small"
        onClick={() => {
          onClose();
          onRequestNovaCategoria();
        }}
      >
        <Icon name="plus" size={14} /> Nova categoria de investimento
      </button>
      <label className="field" style={{ marginTop: 12 }}>
        Conta associada
        <CustomSelect options={contaOptions} value={contaId} onChange={setContaId} placeholder="— nenhuma —" />
      </label>
      <label className="field" style={{ marginTop: 12 }}>
        Saldo inicial (ajuste, se necessário)
        <MoneyInput value={saldoInicial} onChange={setSaldoInicial} />
      </label>
    </Modal>
  );
}
