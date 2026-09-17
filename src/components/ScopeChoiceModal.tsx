import { useCallback, useRef, useState } from "react";
import { Modal } from "./Modal";

export interface ScopeOption {
  value: string;
  label: string;
}

interface ScopeChoiceState {
  title: string;
  intro?: string;
  options: ScopeOption[];
}

/**
 * Porta os pequenos overlays ad-hoc de "escolha de escopo" (ex: excluir só
 * este mês / daqui em diante / tudo) como um hook, no mesmo espírito do
 * useConfirm. Resolve para o `value` escolhido, ou null se cancelado.
 */
export function useScopeChoice() {
  const [state, setState] = useState<ScopeChoiceState | null>(null);
  const resolveRef = useRef<((value: string | null) => void) | null>(null);

  const askScope = useCallback((title: string, options: ScopeOption[], intro?: string) => {
    setState({ title, options, intro });
    return new Promise<string | null>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function close(value: string | null) {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setState(null);
  }

  const dialog = state ? (
    <Modal
      title={state.title}
      onClose={() => close(null)}
      closeOnBackdropClick
      footer={
        <>
          <div />
          <button type="button" className="btn ghost" onClick={() => close(null)}>
            Cancelar
          </button>
        </>
      }
    >
      {state.intro && (
        <p className="mini-note" style={{ marginBottom: 14 }}>
          {state.intro}
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {state.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className="btn ghost"
            style={{ justifyContent: "flex-start" }}
            onClick={() => close(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </Modal>
  ) : null;

  return { askScope, dialog };
}
