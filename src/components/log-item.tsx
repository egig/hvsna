import { useEffect, useState } from "react";
import { FileText, MoreHorizontal } from "lucide-react";
import { useTrackerAttributes } from "../modules/attribute/use-tracker-attributes";
import { useAttributeOptions } from "../modules/option/use-options";
import type { Tracker } from "../modules/tracker/trackerStore";
import type { TrackerAttribute } from "../modules/attribute/trackerAttributeStore";
import type { AttributeOption } from "../modules/option/optionStore";
import type { Log } from "src/lib/tracker/types";
import { formatValue } from "src/lib/format";

interface LogItemProps {
  log: Log;
  trackers?: Tracker[];
  getTrackerName?: (trackerId: string) => string;
  formatLogValue?: (log: Log) => string;
  formatTimestamp?: (timestamp: number) => string;
  onEdit?: (log: Log) => void;
  onDelete?: (log: Log) => void;
  showActions?: boolean;
  compact?: boolean;
  trackerAttributes?: TrackerAttribute[];
  attributeOptions?: AttributeOption[];
}

export function LogItem({
  log,
  trackers = [],
  getTrackerName = (trackerId: string) => {
    const tracker = trackers.find((t) => t.id === trackerId);
    return tracker ? tracker.name : "Unknown tracker";
  },
  formatLogValue = (log: Log) => {
    const tracker = trackers.find((t) => t.id === log.trackerId);
    const value = log.negative ? -Math.abs(log.value) : log.value;
    return formatValue(value, tracker?.format);
  },
  formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  },
  onEdit,
  onDelete,
  showActions = true,
  compact = false,
  trackerAttributes,
  attributeOptions,
}: LogItemProps) {
  const [attributesMap, setAttributesMap] = useState<
    Record<string, TrackerAttribute>
  >({});
  const [optionsMap, setOptionsMap] = useState<Record<string, AttributeOption>>(
    {},
  );

  useEffect(() => {
    if (!trackerAttributes) return;

    // Build attributes map for quick lookup
    const attrMap: Record<string, TrackerAttribute> = {};
    trackerAttributes.forEach((attr) => {
      attrMap[attr.id] = attr;
    });
    setAttributesMap(attrMap);
  }, [trackerAttributes]);

  useEffect(() => {
    if (!attributeOptions) return;
    // Build options map for quick lookup
    const optMap: Record<string, AttributeOption> = {};
    attributeOptions.forEach((opt) => {
      optMap[opt.id] = opt;
    });
    setOptionsMap(optMap);
  }, [attributeOptions]);

  const handleItemClick = () => {
    if (onEdit && !compact) {
      onEdit(log);
    }
  };

  // Helper function to format attribute values for display
  const formatAttributeValue = (attributeId: string, value: any): string => {
    const attribute = attributesMap[attributeId];
    if (!attribute) return String(value);

    // If it's an options type, try to get the option name
    if (attribute.type === "options" && typeof value === "string") {
      const option = optionsMap[value];
      return option ? option.name : String(value);
    }

    // For other types, just convert to string
    return String(value);
  };

  // Helper function to get attribute display name
  const getAttributeDisplayName = (attributeId: string): string => {
    const attribute = attributesMap[attributeId];
    return attribute ? attribute.name : attributeId;
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 border-b border-gray-200 p-4 transition-shadow ${
        !compact && onEdit ? "cursor-pointer" : ""
      }`}
      onClick={handleItemClick}
    >
      <div className="flex items-start gap-3">
        {/* Log Icon */}
        <div className="flex-shrink-0 mt-1">
          <FileText size={compact ? 16 : 24} className="text-gray-400" />
        </div>

        {/* Log Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={`font-medium text-gray-900 dark:text-white truncate ${
              !compact && onEdit
                ? "hover:text-blue-600 dark:hover:text-blue-400"
                : ""
            }`}
          >
            {getTrackerName(log.trackerId)}
          </h3>
          <p
            className={`text-gray-500 dark:text-gray-400 mt-1 ${
              compact ? "text-xs" : "text-sm"
            }`}
          >
            {formatLogValue(log)} •{" "}
            {compact
              ? new Date(log.timestamp).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : formatTimestamp(log.timestamp)}
          </p>
          {!compact && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Created: {new Date(log.createdAt).toLocaleDateString()}
            </p>
          )}

          {/* Attributes */}
          {log.attributes && Object.keys(log.attributes).length > 0 && (
            <div
              className={`text-gray-500 dark:text-gray-400 mt-2 ${
                compact ? "text-xs" : "text-xs"
              }`}
            >
              {Object.entries(log.attributes).map(([attributeId, value]) => (
                <span key={attributeId} className="mr-3">
                  {getAttributeDisplayName(attributeId)}:{" "}
                  {formatAttributeValue(attributeId, value)}
                </span>
              ))}
            </div>
          )}

          {log.note && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{log.note}</p>}
        </div>
      </div>
    </div>
  );
}
