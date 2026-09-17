import { CATEGORY_ICONS, type CategoryIconName } from "./categoryRegistry";

interface CategoryIconProps {
  name: CategoryIconName;
  size?: number;
  className?: string;
}

export function CategoryIcon({ name, size = 16, className }: CategoryIconProps) {
  return (
    <span
      className={className}
      style={{ width: size, height: size, display: "inline-flex", flex: "none" }}
      dangerouslySetInnerHTML={{ __html: CATEGORY_ICONS[name] }}
    />
  );
}
