import type { CSSProperties, ReactNode } from "react";
import { Icon } from "./icons/Icon";
import type { IconName } from "./icons/registry";

interface KpiCardProps {
  icon: IconName;
  /** Cor de fundo do círculo do ícone no tema claro (ex: "#DFF0E4"). */
  iconBgLight: string;
  /** Cor do ícone no tema claro (ex: "var(--positive)"). */
  iconColorLight: string;
  /** Cor base do círculo do ícone no tema escuro (misturada com preto via CSS). */
  iconBgDark: string;
  label: ReactNode;
  value: ReactNode;
  valueTone?: "pos" | "neg" | "neutral";
  sub?: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
  /** Conteúdo extra posicionado livremente sobre o card (ex: sparkline). */
  children?: ReactNode;
}

export function KpiCard({
  icon,
  iconBgLight,
  iconColorLight,
  iconBgDark,
  label,
  value,
  valueTone = "neutral",
  sub,
  onClick,
  style,
  children,
}: KpiCardProps) {
  return (
    <div
      className="kpi-card"
      style={{ position: "relative", overflow: "hidden", cursor: onClick ? "pointer" : undefined, ...style }}
      onClick={onClick}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span
          className="kpi-icon-circle"
          style={
            {
              width: 36,
              height: 36,
              borderRadius: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
              "--kpi-bg-light": iconBgLight,
              "--kpi-color-light": iconColorLight,
              "--kpi-bg-dark": iconBgDark,
            } as CSSProperties
          }
        >
          <Icon name={icon} size={18} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div className="lbl" style={{ margin: 0 }}>
            {label}
          </div>
          <div className={`val ${valueTone === "neg" ? "neg" : valueTone === "pos" ? "pos" : ""}`} style={{ marginTop: 1 }}>
            {value}
          </div>
        </div>
      </div>
      {sub && (
        <div className="mini-note" style={{ marginTop: 4, marginLeft: 50 }}>
          {sub}
        </div>
      )}
      {children}
    </div>
  );
}
