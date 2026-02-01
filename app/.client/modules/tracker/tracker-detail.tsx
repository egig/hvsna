import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { BarChart3 } from "lucide-react";
import { useTracker } from "./use-tracker";
import { useTrackerAttributes } from "../attribute/use-tracker-attributes";
import { useAttributeOptions } from "../option/use-options";
import { useLogs } from "../log/useLogs";
import { usePouchDB } from "~/.client/pouchdb";
import { Navbar, Page } from "../navigation";
import type { TrackerAttribute } from "../attribute/trackerAttributeStore";
import type { AttributeOption } from "../option/optionStore";

interface AttributeOptionSum {
  option: string;
  sum: number;
  count: number;
}

export default function TrackerDetail() {
  const { trackerId } = useParams<{ trackerId: string }>();
  const { db } = usePouchDB();
  const {
    tracker,
    loading: trackerLoading,
    error: trackerError,
  } = useTracker(trackerId);
  const { trackerAttributes, loading: attributesLoading } =
    useTrackerAttributes(trackerId);
  const { getLogsByTracker } = useLogs();
  const [attributeSums, setAttributeSums] = useState<
    Record<string, AttributeOptionSum[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [attributeOptionsMap, setAttributeOptionsMap] = useState<
    Record<string, AttributeOption[]>
  >({});

  // Fetch options for each attribute
  useEffect(() => {
    const fetchAttributeOptions = async () => {
      const optionsMap: Record<string, AttributeOption[]> = {};

      for (const attribute of trackerAttributes) {
        if (attribute.type === "options") {
          try {
            // Fetch options directly from PouchDB
            const result = await db.allDocs({
              include_docs: true,
              startkey: "opt_",
              endkey: "opt_\uffff",
            });

            const options = result.rows
              .map((row) => row.doc as unknown as AttributeOption)
              .filter((option) => option.attributeId === attribute.id);

            optionsMap[attribute.id] = options;
          } catch (error) {
            console.error(
              `Failed to fetch options for attribute ${attribute.id}:`,
              error,
            );
            optionsMap[attribute.id] = [];
          }
        }
      }

      setAttributeOptionsMap(optionsMap);
    };

    if (trackerAttributes.length > 0) {
      fetchAttributeOptions();
    }
  }, [trackerAttributes, db]);

  useEffect(() => {
    if (
      trackerId &&
      trackerAttributes.length > 0 &&
      Object.keys(attributeOptionsMap).length > 0
    ) {
      calculateAttributeSums();
    }
  }, [trackerId, trackerAttributes, attributeOptionsMap]);

  const calculateAttributeSums = async () => {
    if (!trackerId) return;

    setLoading(true);
    try {
      const logs = await getLogsByTracker(trackerId);
      const sums: Record<string, AttributeOptionSum[]> = {};

      // Process each attribute that has options
      trackerAttributes.forEach((attribute) => {
        if (attribute.type !== "options") return;

        const options = attributeOptionsMap[attribute.id] || [];
        if (options.length === 0) return;

        const optionSums: Record<string, number> = {};
        const optionCounts: Record<string, number> = {};

        // Initialize all options with 0
        options.forEach((option) => {
          optionSums[option.id] = 0;
          optionCounts[option.id] = 0;
        });

        // Calculate sums from logs
        logs.forEach((log) => {
          if (!log.attributes || !log.attributes[attribute.id]) return;

          const attributeValue = log.attributes[attribute.id];
          if (
            typeof attributeValue !== "string" ||
            optionSums[attributeValue] === undefined
          )
            return;

          optionSums[attributeValue] += Number(log.value);
          optionCounts[attributeValue]++;
        });

        // Convert to array format
        sums[attribute.name] = options.map((option) => ({
          option: option.name,
          sum: optionSums[option.id],
          count: optionCounts[option.id],
        }));
      });

      setAttributeSums(sums);
    } catch (error) {
      console.error("Failed to calculate attribute sums:", error);
    } finally {
      setLoading(false);
    }
  };

  if (trackerError || !tracker) {
    return (
      <Page>
        <Navbar title="Tracker Details" />
        <div className="flex items-center justify-center py-8">
          <div className="text-red-600 dark:text-red-400">
            {trackerError || "Tracker not found"}
          </div>
        </div>
      </Page>
    );
  }

  const hasOptionsAttributes = trackerAttributes.some(
    (attr) =>
      attr.type === "options" &&
      attributeOptionsMap[attr.id] &&
      attributeOptionsMap[attr.id].length > 0,
  );

  return (
    <Page>
      <Navbar title="Tracker Details" />
      <div className="p-4">
        {/* Tracker Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {tracker.name}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Unit: {tracker.unit}</span>
            <span>Baseline: {tracker.baseline}</span>
          </div>
        </div>

        {/* Attribute Options with Sum Values */}
        {hasOptionsAttributes ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 size={20} />
              Attributes
            </h2>
            {trackerAttributes
              .filter(
                (attr) =>
                  attr.type === "options" &&
                  attributeOptionsMap[attr.id] &&
                  attributeOptionsMap[attr.id].length > 0,
              )
              .map((attribute) => (
                <div
                  key={attribute.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    {attribute.name}
                    {attribute.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </h3>
                  {attribute.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {attribute.description}
                    </p>
                  )}
                  <div className="space-y-2">
                    {attributeSums[attribute.name]?.map((item) => (
                      <div
                        key={item.option}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {item.option}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-right">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {item.sum.toLocaleString()}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                              {tracker.unit}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-600 dark:text-gray-400">
                              {item.count}{" "}
                              {item.count === 1 ? "entry" : "entries"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!attributeSums[attribute.name] ||
                      attributeSums[attribute.name].length === 0) && (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        No data available for this attribute
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
            <BarChart3 size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Options Attributes
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              This tracker doesn't have any attributes with options to display
              summaries.
            </p>
          </div>
        )}

        {/* Other Attributes (non-options) */}
        {trackerAttributes.filter((attr) => attr.type !== "options").length >
          0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Other Attributes
            </h2>
            <div className="space-y-2">
              {trackerAttributes
                .filter((attr) => attr.type !== "options")
                .map((attribute) => (
                  <div
                    key={attribute.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {attribute.name}
                        </span>
                        {attribute.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 capitalize">
                          ({attribute.type})
                        </span>
                      </div>
                      {attribute.defaultValue !== undefined && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Default: {attribute.defaultValue.toString()}
                        </span>
                      )}
                    </div>
                    {attribute.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {attribute.description}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
