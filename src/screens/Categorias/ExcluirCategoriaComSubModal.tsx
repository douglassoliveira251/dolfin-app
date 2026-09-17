import { Modal } from "../../components/Modal";
import type { Categoria } from "../../data/schema";

interface ExcluirCategoriaComSubModalProps {
  cat: Categoria;
  filhas: Categoria[];
  qtdLanc: number;
  onChoice: (choice: "arquivar" | "excluir" | null) => void;
}

/** Porta openExcluirCategoriaComSubModal(): escolha de 3 vias (não é um simples sim/não). */
export function ExcluirCategoriaComSubModal({ cat, filhas, qtdLanc, onChoice }: ExcluirCategoriaComSubModalProps) {
  return (
    <Modal
      title={`Excluir "${cat.nome}"`}
      onClose={() => onChoice(null)}
      closeOnBackdropClick
      modalClassName="confirm-box"
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: 8, width: "100%" }}>
          <button type="button" className="btn ghost" onClick={() => onChoice(null)}>
            Cancelar
          </button>
          <button type="button" className="btn" onClick={() => onChoice("arquivar")}>
            Arquivar em vez disso
          </button>
          <button type="button" className="btn danger" onClick={() => onChoice("excluir")}>
            Excluir categoria e subcategorias
          </button>
        </div>
      }
    >
      <p>Esta categoria tem {filhas.length} subcategoria(s). O que você deseja fazer?</p>
      <p className="mini-note" style={{ marginTop: 10 }}>
        Excluir remove a categoria e/ou subcategorias definitivamente
        {qtdLanc > 0 ? `, e você perde o histórico de categorização de ${qtdLanc} lançamento(s) vinculado(s) a elas` : ""}.
        Essa ação não pode ser desfeita.
      </p>
      <p className="mini-note" style={{ marginTop: 6 }}>
        Se quiser manter o histórico, prefira <strong>arquivar</strong> — a categoria some das telas principais, mas pode
        ser restaurada depois.
      </p>
    </Modal>
  );
}
