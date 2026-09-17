interface SwitchProps {
  on: boolean;
  onToggle: () => void;
}

export function Switch({ on, onToggle }: SwitchProps) {
  return (
    <div className={`switch${on ? " on" : ""}`} onClick={onToggle}>
      <div className="knob" />
    </div>
  );
}
