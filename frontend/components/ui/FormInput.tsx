import { forwardRef } from "react";
import { cn } from "@/utils/cn";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/**
 * Input form reusable dengan label mengambang & pesan error,
 * dipakai di seluruh form (Login, Register, Alamat, Checkout, Admin).
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div className="w-full">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg border bg-neutral-50 px-4 py-3.5",
            error ? "border-red-400" : "border-neutral-200 focus-within:border-neutral-900"
          )}
        >
          <label htmlFor={inputId} className="shrink-0 text-sm font-semibold text-neutral-800">
            {label}
          </label>
          <input
            id={inputId}
            ref={ref}
            className={cn("w-full bg-transparent text-right text-sm text-neutral-900 outline-none placeholder:text-neutral-400", className)}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";
