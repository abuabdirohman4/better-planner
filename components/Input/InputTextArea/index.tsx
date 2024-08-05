import React from "react";

type Props = {
  autoComplete?: string;
  disabled?: boolean;
  label: string;
  name: string;
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  className?: string;
  placeholder?: string;
  required?: boolean;
  rows: number;
  type?: string;
  validation?: string;
  value: string;
};

export default function InputTextArea({
  label,
  name,
  value,
  placeholder,
  className,
  onChange,
  disabled = false,
  required = true,
  rows,
  validation,
}: Props) {
  return (
    <div className="mb-6">
      <label htmlFor={name} className="mb-2 block text-gray-1">
        {label}
      </label>
      <textarea
        name={name}
        id={name}
        onChange={onChange}
        value={value}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        className={`${className} w-full rounded-lg border border-gray-2 bg-white p-2.5 text-gray-1 outline-none focus:border-teal-1 ${
          validation && "border-red-1"
        }`}
        required={required}
      ></textarea>
      {validation && (
        <p id="outlined_error_help" className="mt-2 text-xs text-red-400">
          <span className="font-medium">{validation}</span>
        </p>
      )}
    </div>
  );
}
