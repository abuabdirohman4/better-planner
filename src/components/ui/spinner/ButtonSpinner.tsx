import React from "react";

interface ButtonSpinnerProps {
  size?: number;
  colorClass?: string;
}

const ButtonSpinner: React.FC<ButtonSpinnerProps> = ({ size = 16, colorClass = "text-white" }) => (
  <span className="inline-block mr-2 align-middle animate-spin">
    <svg
      className={colorClass}
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  </span>
);

export default ButtonSpinner; 