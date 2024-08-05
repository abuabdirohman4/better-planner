type Props = {
  label: string;
  validation?: string;
  value?: string;
};

export default function InputChecbox({
  label,
  validation,
  value,
}: Props) {
  return (
    <div className="mb-4">
      <div className="flex items-center">
        <input
          id="default-checkbox"
          type="checkbox"
          value={value}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <label
          htmlFor="default-checkbox"
          className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
        >
          {label}
        </label>
      </div>
      {validation && (
        <p id="outlined_error_help" className="mt-2 text-xs text-red-400">
          <span className="font-medium">{validation}</span>
        </p>
      )}
    </div>
  );
}
