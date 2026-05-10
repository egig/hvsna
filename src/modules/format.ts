/**
 * Format a numeric value
 */
export function formatValue(value: number, format?: "plain" | "idr"): string {
  if (format === "idr") {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  // Default to plain number
  return value.toString();
}

/**
 * Format a numeric value with unit
 */
export function formatValueWithUnit(
  value: number,
  unit: string,
  format?: "plain" | "idr"
): string {
  const formattedValue = formatValue(value, format);

  if (format === "idr") {
    // IDR already includes the currency symbol, so just return the formatted value
    return formattedValue;
  }

  // For plain format, append the unit if provided
  return unit ? `${formattedValue} ${unit}` : formattedValue;
}
