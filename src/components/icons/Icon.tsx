import { ICONS, type IconName } from "./registry";

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 16, className }: IconProps) {
  return (
    <span
      className={className}
      style={{ width: size, height: size, display: "inline-flex", flex: "none" }}
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}
