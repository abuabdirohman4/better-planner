type Props = {
  autoComplete?: string;
  disabled?: boolean;
  label: string;
  name: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  className?: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
  validation?: string | number;
  value: string;
};

export default function InputTextWithLabel({
  autoComplete = "on",
  disabled,
  label,
  name,
  onChange,
  className,
  placeholder,
  required,
  type = "text",
  validation,
  value,
}: Props) {
  return (
    <div className="mb-6">
      <div className="relative">
        <label htmlFor={name} className="mb-2 block text-gray-1">
          {label}
        </label>
        <input
          className={`${className} w-full rounded-lg border border-gray-2 bg-white p-2.5 text-gray-1 outline-none focus:border-teal-1 ${
            validation && "border-red-1"
          }`}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          type={type}
          value={value}
          disabled={disabled}
        />
      </div>
      {validation && (
        <p id="outlined_error_help" className="mt-2 text-xs text-red-400">
          <span className="font-medium">{validation}</span>
        </p>
      )}
    </div>
  );
}
