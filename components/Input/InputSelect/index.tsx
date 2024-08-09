"use client";
import { ReactSelect } from "@/types";
import dynamic from "next/dynamic";
import { StylesConfig } from "react-select";

type SelectProps = {
  name: string;
  style?: StylesConfig;
  label?: string;
  placeholder?: string;
  options: ReactSelect[];
  isClearable?: boolean;
  menuIsOpen?: boolean;
  disabled?: boolean;
  defaultValue?: ReactSelect | number;
  onChange?: (selected: any) => void;
  required?: boolean;
  ssr?: boolean;
  validation?: string | number;
};

const Select = dynamic(() => import("react-select"), {
  ssr: false,
  // loading: () => <SkeletonText row={2} />,
});

function InputSelect({
  name,
  style,
  label,
  placeholder,
  options,
  isClearable,
  menuIsOpen,
  disabled,
  defaultValue,
  onChange,
  required,
  validation,
}: SelectProps) {
  return (
    <div className="mb-6">
      <label htmlFor={name} className="mb-2 block text-gray-1">
        {label}
      </label>
      <Select
        name={name}
        className={`${
          validation && "rounded-md border border-red-1 hover:cursor-pointer"
        }`}
        styles={style}
        placeholder={placeholder}
        options={options}
        isClearable={isClearable}
        menuIsOpen={menuIsOpen}
        isDisabled={disabled}
        defaultValue={defaultValue}
        onChange={onChange}
        required={required}
      />
      {validation && (
        <p id="outlined_error_help" className="mt-2 text-xs text-red-400">
          <span className="font-medium">{validation}</span>
        </p>
      )}
    </div>
  );
}

export default InputSelect;
