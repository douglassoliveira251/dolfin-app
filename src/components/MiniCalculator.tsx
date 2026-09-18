import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./icons/Icon";

const KEYS = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", "0", ",", "=", "+"];

interface MiniCalculatorProps {
  value: number;
  onResult: (result: number) => void;
}

export function MiniCalculator({ value, onResult }: MiniCalculatorProps) {
  const [open, setOpen] = useState(false);
  const [expr, setExpr] = useState("");
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
    setPos({ top: r.bottom + 6, left: Math.min(r.left - 160, window.innerWidth - 220) });
    setExpr(value ? String(value).replace(".", ",") : "");
    setOpen(true);
  }

  function pressKey(k: string) {
    if (k === "=") {
      try {
        const safeExpr = expr.replace(/,/g, ".").replace(/×/g, "*").replace(/÷/g, "/").replace(/[^0-9.+\-*/()]/g, "");
        // eslint-disable-next-line no-new-func
        const result = Function('"use strict";return (' + safeExpr + ")")();
        if (isFinite(result)) {
          onResult(Number(result));
          setOpen(false);
        }
      } catch {
        // expressão inválida, ignora
      }
      return;
    }
    setExpr((e) => e + k);
  }

  return (
    <>
      <button type="button" className="icon-btn" ref={triggerRef} onClick={handleToggle} title="Calculadora">
        <Icon name="calc" size={14} />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            className="color-popover open"
            style={{ position: "fixed", top: pos.top, left: pos.left, width: 200 } as CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: "var(--surface-2)", borderRadius: 6, padding: "8px 10px", textAlign: "right",
                fontFamily: "var(--font-mono)", fontSize: 16, marginBottom: 8, minHeight: 20,
              }}
            >
              {expr || "0"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
              {KEYS.map((k) => (
                <button key={k} type="button" className="btn small" style={{ justifyContent: "center" }} onClick={() => pressKey(k)}>
                  {k}
                </button>
              ))}
            </div>
            <button type="button" className="btn ghost small" style={{ width: "100%", marginTop: 6, justifyContent: "center" }} onClick={() => setExpr("")}>
              Limpar
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
