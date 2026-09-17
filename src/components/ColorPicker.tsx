import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { COLOR_PRESETS, COLOR_PRESETS_DARK, COLOR_PRESETS_LIGHT } from "../data/colors";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
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
    setPos({ top: rect.bottom + 6, left: Math.min(rect.left, window.innerWidth - 266) });
    setOpen(true);
  }

  function pick(color: string) {
    onChange(color);
    setOpen(false);
  }

  return (
    <div className="color-picker">
      <button type="button" className="color-trigger" ref={triggerRef} style={{ background: value }} onClick={handleToggle} />
      {open &&
        pos &&
        createPortal(
          <div
            className="color-popover open"
            style={{ position: "fixed", top: pos.top, left: pos.left, width: 264 } as CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="color-group-grid">
              {COLOR_PRESETS.map((c, i) => (
                <div className="color-group-col" key={c}>
                  <button
                    type="button"
                    className={`color-swatch sm${value === COLOR_PRESETS_LIGHT[i] ? " sel" : ""}`}
                    style={{ background: COLOR_PRESETS_LIGHT[i] }}
                    onClick={() => pick(COLOR_PRESETS_LIGHT[i])}
                  />
                  <button
                    type="button"
                    className={`color-swatch${value === c ? " sel" : ""}`}
                    style={{ background: c }}
                    onClick={() => pick(c)}
                  />
                  <button
                    type="button"
                    className={`color-swatch sm${value === COLOR_PRESETS_DARK[i] ? " sel" : ""}`}
                    style={{ background: COLOR_PRESETS_DARK[i] }}
                    onClick={() => pick(COLOR_PRESETS_DARK[i])}
                  />
                </div>
              ))}
            </div>
            <label className="color-custom-wrap">
              <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
              <span>Cor personalizada</span>
            </label>
          </div>,
          document.body,
        )}
    </div>
  );
}
