import { contrastIconColor } from "../data/colors";
import { CategoryIcon } from "./icons/CategoryIcon";
import { resolveIconKey } from "./icons/categoryRegistry";

interface EntityCircleProps {
  cor: string;
  icone: string | null;
  size?: number;
  iconSize?: number;
  className?: string;
}

/** Círculo colorido com ícone, usado para contas, cartões, categorias e ativos. */
export function EntityCircle({ cor, icone, size = 24, iconSize = 13, className }: EntityCircleProps) {
  const key = resolveIconKey(icone);
  return (
    <span
      className={`cat-circle${className ? " " + className : ""}`}
      style={{ background: cor, color: contrastIconColor(cor), width: size, height: size }}
    >
      {key && <CategoryIcon name={key} size={iconSize} />}
    </span>
  );
}
