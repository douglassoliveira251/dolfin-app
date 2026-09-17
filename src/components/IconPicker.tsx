import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { CategoryIcon } from "./icons/CategoryIcon";
import { CATEGORY_ICON_KEYS, resolveIconKey, type CategoryIconName } from "./icons/categoryRegistry";

interface IconPickerProps {
  value: string | null;
  onChange: (key: CategoryIconName | "") => void;
  /** Restringe as opções (ex: ícones de tipo de conta). Padrão: todos. */
  keys?: CategoryIconName[];
}

export function IconPicker({ value, onChange, keys }: IconPickerProps) {
  const options = keys || CATEGORY_ICON_KEYS;
  const resolved = resolveIconKey(value);
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
    const rect = triggerRef.current!.getBoundingClientRect();
    const estimatedHeight = 260;
    const abreParaCima = rect.bottom + estimatedHeight > window.innerHeight && rect.top > estimatedHeight;
    setPos({
      top: abreParaCima ? rect.top - estimatedHeight - 6 : rect.bottom + 6,
      left: Math.min(rect.left, window.innerWidth - 220),
    });
    setOpen(true);
  }

  function pick(key: CategoryIconName | "") {
    onChange(key);
    setOpen(false);
  }

  return (
    <div className="icon-picker">
      <button type="button" className="icon-preview-btn" ref={triggerRef} onClick={handleToggle}>
        {resolved ? (
          <CategoryIcon name={resolved} size={17} />
        ) : (
          <span className="mini-note" style={{ margin: 0 }}>
            Escolher
          </span>
        )}
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            className="color-popover open"
            style={{ position: "fixed", top: pos.top, left: pos.left, width: 220, maxHeight: 260, overflowY: "auto" } as CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="icon-swatch-grid">
              <button type="button" className={`icon-swatch${!resolved ? " sel" : ""}`} onClick={() => pick("")}>
                —
              </button>
              {options.map((k) => (
                <button key={k} type="button" className={`icon-swatch${resolved === k ? " sel" : ""}`} onClick={() => pick(k)}>
                  <CategoryIcon name={k} size={22} />
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
