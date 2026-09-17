import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  title: ReactNode;
  onClose: () => void;
  wide?: boolean;
  footer?: ReactNode;
  children: ReactNode;
}

export function Modal({ title, onClose, wide, footer, children }: ModalProps) {
  return createPortal(
    <div className="portal-overlay">
      <div className={`portal-modal${wide ? " wide" : ""}`}>
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
