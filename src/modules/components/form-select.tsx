type SelectProps = {
  name: string;
  label: string;
  value?: any;
  options: SelectOption[];
  required?: boolean;
  onChange?: (e: any) => void;
  disabled?: boolean;
};

type SelectOption = {
  label: string;
  value: any;
};

export default function Select({
  name,
  value,
  label,
  options,
  required,
  disabled,
  ...props
}: SelectProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        name={name}
        {...props}
        defaultValue={value}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
