interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  name?: string;
}

/** Grupo de botões mutuamente exclusivos (substitui os radios estilizados repetidos). */
export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`border px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] transition ${
            value === option.value
              ? 'border-lime-300 bg-lime-300/10 text-lime-300'
              : 'border-[#384534] text-stone-400 hover:border-stone-500'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
