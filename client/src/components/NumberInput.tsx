import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { clampNumber, isValidNumberInputRaw, parseNumberInput } from "@/lib/numberInput";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** blur 時空字串回退值 */
  emptyFallback?: number;
};

export function NumberInput({
  value,
  onChange,
  min,
  max,
  emptyFallback = 0,
  className,
  onBlur,
  ...rest
}: Props) {
  const [raw, setRaw] = useState(() => String(value));
  const lastExternal = useRef(value);

  useEffect(() => {
    if (value !== lastExternal.current) {
      lastExternal.current = value;
      setRaw(String(value));
    }
  }, [value]);

  const commit = (nextRaw: string) => {
    let n = parseNumberInput(nextRaw, emptyFallback);
    n = clampNumber(n, min, max);
    setRaw(String(n));
    lastExternal.current = n;
    onChange(n);
  };

  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      value={raw}
      className={className}
      onChange={(e) => {
        const v = e.target.value;
        if (!isValidNumberInputRaw(v)) return;
        setRaw(v);
        if (v !== "" && v !== "-") {
          let n = parseNumberInput(v, emptyFallback);
          n = clampNumber(n, min, max);
          lastExternal.current = n;
          onChange(n);
        }
      }}
      onBlur={(e) => {
        commit(raw);
        onBlur?.(e);
      }}
    />
  );
}
