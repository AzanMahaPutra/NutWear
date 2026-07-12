import { cn } from "@/utils/cn";

interface FilterOption {
  value: string;
  label: string;
  swatch?: string; // untuk filter warna
}

interface FilterCheckboxGroupProps {
  title: string;
  options: FilterOption[];
  selected: string[];
  onChange: (value: string) => void;
}

/**
 * Grup checkbox filter reusable — dipakai untuk filter Kategori, Ukuran, dan Warna.
 */
export function FilterCheckboxGroup({ title, options, selected, onChange }: FilterCheckboxGroupProps) {
  return (
    <div className="border-b border-neutral-100 py-5">
      <h4 className="mb-3 text-sm font-semibold text-neutral-900">{title}</h4>
      <div className="space-y-2">
        {options.map((option) => {
          const isChecked = selected.includes(option.value);
          return (
            <label key={option.value} className="flex cursor-pointer items-center gap-2 text-sm text-neutral-600">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onChange(option.value)}
                className="h-4 w-4 rounded border-neutral-300 accent-neutral-900"
              />
              {option.swatch && (
                <span
                  className={cn("h-4 w-4 rounded-full border", isChecked && "ring-1 ring-neutral-900 ring-offset-1")}
                  style={{ backgroundColor: option.swatch }}
                />
              )}
              {option.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}
