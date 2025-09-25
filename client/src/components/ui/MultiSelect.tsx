// client/src/components/ui/MultiSelect.tsx
import { useState } from "react";
import { X } from "lucide-react";

type Option = {
  label: string;
  value: number | string;
};

interface MultiSelectProps {
  options: Option[];
  values: (number | string)[];
  onChange: (values: (number | string)[]) => void;
  placeholder?: string;
}

export function MultiSelect({
  options,
  values,
  onChange,
  placeholder = "Select options",
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggleValue = (value: number | string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  return (
    <div className="relative">
      {/* Input / Trigger */}
      <div
        className="min-h-[2.5rem] flex flex-wrap items-center gap-1 border rounded-md px-2 py-1 bg-white cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {values.length === 0 && (
          <span className="text-gray-400 text-sm">{placeholder}</span>
        )}
        {values.map((val) => {
          const option = options.find((o) => o.value === val);
          return (
            <span
              key={val}
              className="flex items-center bg-blue-100 text-blue-700 text-sm rounded px-2 py-0.5"
            >
              {option?.label}
              <button
                type="button"
                className="ml-1 text-blue-500 hover:text-blue-700"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleValue(val);
                }}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => toggleValue(opt.value)}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                values.includes(opt.value) ? "bg-blue-50 text-blue-700" : ""
              }`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
