import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./icons/Icon";

export interface KebabMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface KebabMenuProps {
  items: KebabMenuItem[];
}

export function KebabMenu({ items }: KebabMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (open) {
      setOpen(false);
      return;
    }
    const r = triggerRef.current!.getBoundingClientRect();
    const estimatedHeight = items.length * 36 + 12;
    const abreParaCima = r.bottom + estimatedHeight > window.innerHeight && r.top > estimatedHeight;
    setPos({
      top: abreParaCima ? r.top - estimatedHeight - 4 : r.bottom + 4,
      left: Math.min(r.left - 140, window.innerWidth - 190),
    });
    setOpen(true);
  }

  return (
    <>
      <button type="button" className="icon-btn kebab-btn" ref={triggerRef} onClick={handleToggle}>
        <Icon name="kebab" size={14} />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            className="kebab-dropdown color-popover open"
            style={{ position: "fixed", top: pos.top, left: pos.left, width: 170, padding: 6 } as CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((it, i) => (
              <button
                key={i}
                type="button"
                className={`fab-menu-item${it.danger ? " danger" : ""}`}
                onClick={() => {
                  setOpen(false);
                  it.onClick();
                }}
              >
                {it.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
