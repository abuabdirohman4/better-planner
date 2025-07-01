import React from "react";

interface SpinnerProps {
  size?: number;
  colorClass?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 32, colorClass = "border-brand-600" }) => (
  <div className={`animate-spin rounded-full h-${size} w-${size} border-t-2 border-b-2 ${colorClass}`}></div>
);

export default Spinner; 