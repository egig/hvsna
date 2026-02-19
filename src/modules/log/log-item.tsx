import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import type { Log } from "src/modules/tracker/types";
import { formatValue } from "src/lib/format";
import type { Tracker } from "../tracker/trackerStore";
import type { AttributeOption } from "../option/optionStore";
import { ListItem } from "src/ui/list-item";
import type { TrackerAttribute } from "../attribute/trackerAttributeStore";

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
    <ListItem
      title={getTrackerName(log.trackerId)}
      subtitle={`${formatLogValue(log)} • ${formatTimestamp(log.timestamp)}`}
      description={
        !compact
          ? `Created: ${new Date(log.createdAt).toLocaleDateString()}`
          : undefined
      }
      leftIcon={<FileText size={compact ? 16 : 24} className="text-gray-400" />}
      onClick={handleItemClick}
      compact={compact}
    >
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

      {log.note && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {log.note}
        </p>
      )}
    </ListItem>
  );
}
