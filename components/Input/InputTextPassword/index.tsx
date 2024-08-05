import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

type Props = {
  disabled?: boolean;
  label: string;
  name: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  required?: boolean;
  validation?: string | boolean;
  verifyPassword?: string | boolean;
  value: string;
};

export default function InputTextPassword({
  disabled,
  label,
  name,
  onChange,
  placeholder,
  required,
  validation,
  verifyPassword,
  value,
}: Props) {
  const [showPass, setShowPass] = useState(false);
  return (
    <div className="mb-6">
      <div className="relative">
        <label htmlFor={name} className="mb-2 block text-gray-1">
          {label}
        </label>
        <input
          className={`w-full rounded-lg border bg-white p-2.5 pr-12 text-gray-1 outline-none transition-all  ${
            validation
              ? "border-red-1 focus:border-red-1"
              : "border-gray-2 focus:border-teal-1"
          }`}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          type={showPass ? "text" : "password"}
          value={value}
          disabled={disabled}
        />
        <FontAwesomeIcon
          icon={showPass ? faEye : faEyeSlash}
          onClick={() => setShowPass(!showPass)}
          className={`absolute bottom-2 right-2 cursor-pointer rounded-full p-2 hover:bg-gray-100 ${
            !value && "hidden"
          }`}
        />
      </div>
      {validation && (
        <p id="outlined_error_help" className="mt-2 text-xs text-red-400">
          <span className="font-medium">{validation}</span>
        </p>
      )}
      {verifyPassword && (
        <p id="outlined_error_help" className="mt-2 text-xs text-red-400">
          <span className="font-medium">
            Password Yang Dimasukkan Belum Sama
          </span>
        </p>
      )}
    </div>
  );
}
