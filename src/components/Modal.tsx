import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  title: ReactNode;
  onClose: () => void;
  wide?: boolean;
  footer?: ReactNode;
  children: ReactNode;
  /** Fecha o modal ao clicar no fundo escurecido (usado pelo ConfirmDialog). */
  closeOnBackdropClick?: boolean;
  /** Classe extra no .portal-modal (ex: "confirm-box" para limitar a largura). */
  modalClassName?: string;
}

export function Modal({ title, onClose, wide, footer, children, closeOnBackdropClick, modalClassName }: ModalProps) {
  return createPortal(
    <div
      className="portal-overlay"
      onClick={closeOnBackdropClick ? (e) => e.target === e.currentTarget && onClose() : undefined}
    >
      <div className={`portal-modal${wide ? " wide" : ""}${modalClassName ? " " + modalClassName : ""}`}>
        <div className="portal-head">
          <h2>{title}</h2>
          <button type="button" className="close-x" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="portal-body">{children}</div>
        {footer && <div className="portal-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
