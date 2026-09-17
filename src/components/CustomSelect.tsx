import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface CustomSelectOption {
  id: string;
  label: string;
  /** Cor do "dot" exibido quando não há ícone. */
  color?: string;
  icon?: ReactNode;
}

interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string | null;
  onChange: (id: string) => void;
  placeholder?: string;
}

export function CustomSelect({ options, value, onChange, placeholder = "Selecionar" }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const current = options.find((o) => o.id === value) ?? null;

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  function iconOf(o: CustomSelectOption) {
    return o.icon ?? <span className="csel-dot" style={{ background: o.color || "var(--gray-400)" }} />;
  }

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (open) {
      setOpen(false);
      return;
    }
    const rect = triggerRef.current!.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, left: Math.min(rect.left, window.innerWidth - 240) });
    setOpen(true);
  }

  return (
    <div className="custom-select">
      <button type="button" className="custom-select-trigger" ref={triggerRef} onClick={handleToggle}>
        {current ? (
          <>
            {iconOf(current)}
            <span style={{ fontWeight: 600 }}>{current.label}</span>
          </>
        ) : (
          <span className="mini-note" style={{ margin: 0 }}>
            {placeholder}
          </span>
        )}
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            className="color-popover open"
            style={{ position: "fixed", top: pos.top, left: pos.left, width: 220, maxHeight: 260, overflow: "auto" } as CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            {options.length === 0 && (
              <div className="mini-note" style={{ padding: 6 }}>
                Nenhuma opção disponível.
              </div>
            )}
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                className="fab-menu-item"
                style={{ display: "flex", alignItems: "center", gap: 8 }}
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
              >
                {iconOf(o)}
                {o.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
