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
          className={`rounded-lg border px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition ${
            value === option.value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-outline-variant bg-surface-lowest text-on-surface-variant hover:border-outline'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
