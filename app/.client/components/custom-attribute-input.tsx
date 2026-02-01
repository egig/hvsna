import type { TrackerAttribute } from "../modules/attribute/trackerAttributeStore";
import type { Log } from "~/lib/tracker/types";
import type { AttributeOption } from "../modules/option/optionStore";
import { useAttributeOptions } from "../modules/option/use-options";
import { useEffect, useState } from "react";

interface CustomAttributeInputProps {
  logId?: string;
  attr: TrackerAttribute;
  value: any;
  disabled?: boolean;
  onChange?: (value: any) => void;
  attributeOptions?: AttributeOption[];
}

export default function CustomAttributeInput({
  logId,
  attr,
  value,
  disabled = false,
}: CustomAttributeInputProps) {
  const { getAttributeOptions } = useAttributeOptions(
    attr.type === "options" ? attr.id : undefined,
  );
  const [attributeOptions, setAttributeOptions] = useState<AttributeOption[]>(
    [],
  );

  useEffect(() => {
    getAttributeOptions({ attributeId: attr.id }).then((options) => {
      setAttributeOptions(options);
    });
  }, [attr.id, logId]);

  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {attr.name}
        {attr.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {attr.type === "text" && (
        <input
          key={attr.trackerId}
          name={attr.id}
          type="text"
          defaultValue={(value as string) || ""}
          disabled={disabled}
          required={attr.required}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-opacity-50"
        />
      )}

      {attr.type === "number" && (
        <input
          key={attr.trackerId}
          name={attr.id}
          type="number"
          defaultValue={(value as string) || ""}
          disabled={disabled}
          required={attr.required}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-opacity-50"
        />
      )}

      {attr.type === "date" && (
        <input
          key={attr.trackerId}
          name={attr.id}
          type="date"
          defaultValue={(value as string) || ""}
          disabled={disabled}
          required={attr.required}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-opacity-50"
        />
      )}

      {attr.type === "boolean" && (
        <div className="flex items-center">
          <input
            key={attr.trackerId}
            name={attr.id}
            type="checkbox"
            defaultChecked={(value as boolean) || false}
            disabled={disabled}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <label className="ml-2 text-sm text-gray-700">{attr.name}</label>
        </div>
      )}

      {attr.type === "options" &&
        (() => {
          return (
            <select
              // HACK to force re-render
              key={Math.random()}
              name={attr.id}
              defaultValue={(value as string) || ""}
              disabled={disabled}
              required={attr.required}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-opacity-50"
            >
              <option value="">Select an option</option>
              {attributeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          );
        })()}
    </div>
  );
}
