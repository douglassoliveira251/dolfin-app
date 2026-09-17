import { useCallback, useRef, useState } from "react";
import { Modal } from "./Modal";

interface ConfirmOptions {
  title?: string;
  okLabel?: string;
  danger?: boolean;
}

/**
 * Porta o antigo openConfirmPortal() (Promise imperativa) para um hook React.
 * Uso: const { confirm, dialog } = useConfirm(); ... if (await confirm("...")) { ... }
 * Renderize {dialog} uma vez na árvore do componente que chama confirm().
 */
export function useConfirm() {
  const [state, setState] = useState<{ message: string; opts: ConfirmOptions } | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((message: string, opts: ConfirmOptions = {}) => {
    setState({ message, opts });
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function close(value: boolean) {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setState(null);
  }

  const dialog = state ? (
    <Modal
      title={state.opts.title || "Confirmar ação"}
      onClose={() => close(false)}
      closeOnBackdropClick
      modalClassName="confirm-box"
      footer={
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", width: "100%" }}>
          <button type="button" className="btn ghost" onClick={() => close(false)}>
            Cancelar
          </button>
          <button type="button" className={`btn ${state.opts.danger ? "danger" : "primary"}`} onClick={() => close(true)}>
            {state.opts.okLabel || "Confirmar"}
          </button>
        </div>
      }
    >
      <p>{state.message}</p>
    </Modal>
  ) : null;

  return { confirm, dialog };
}
