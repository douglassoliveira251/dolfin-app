import { useEffect, useRef, useState } from "react";

function formatMoneyMask(num: number): string {
  return "R$ " + Number(num).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  id?: string;
}

/** Campo "R$ 0,00" que trata a digitação como centavos, como o input original. */
export function MoneyInput({ value, onChange, id }: MoneyInputProps) {
  const [display, setDisplay] = useState(() => formatMoneyMask(value));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplay(formatMoneyMask(value));
  }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (el) el.setSelectionRange(el.value.length, el.value.length);
  }, [display]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "") || "0";
    onChange(parseInt(digits, 10) / 100);
  }

  return (
    <input
      ref={ref}
      id={id}
      type="text"
      inputMode="decimal"
      placeholder="R$ 0,00"
      value={display}
      onChange={handleChange}
    />
  );
}
