import { type ReactNode } from 'react';

interface FormInputProps {
  label: string;
  value: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'email' | 'tel';
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

export function FormInput({
  label,
  value,
  placeholder = '',
  type = 'text',
  disabled = false,
  required = false,
  error,
  className = '',
  onChange,
  onBlur,
}: FormInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`mb-4 ${className}`}>
      <label className="
        block
        text-sm
        font-medium
        text-gray-700
        mb-2
      ">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full
          px-3
          py-2
          border
          rounded-lg
          text-base
          transition-colors
          duration-150
          ease-in-out
          ${error 
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
          }
          ${disabled 
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
            : 'bg-white text-gray-900'
          }
          focus:outline-none
          focus:ring-2
          focus:ring-opacity-50
          [-webkit-appearance:none]
          [appearance:none]
        `}
        onChange={handleChange}
        onBlur={onBlur}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
