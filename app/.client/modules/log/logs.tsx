import { useEffect, useState } from "react";
import { useLogs } from "./useLogs";
import { useLog } from "./use-log";
import { Plus, FileText } from "lucide-react";
import type { Log, Tracker } from "~/lib/tracker/types";
import LogForm from "./log-form";
import { LogItem } from "../../components/log-item";
import { Navbar } from "../navigation/navbar";
import { Modal } from "../navigation/modal";
import { useTrackers } from "../tracker/use-trackers";
import { Page } from "../navigation";
import { useAttributeOptions } from "../option/use-options";
import { useTrackerAttributes } from "../attribute/use-tracker-attributes";

export default function Logs() {
  const { loading, error, getLogs, refreshLogs, logs } = useLogs();
  const { deleteLog } = useLog();
  const { getTrackers } = useTrackers();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [popupOpened, setPopupOpened] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const { attributeOptions } = useAttributeOptions();
  const { trackerAttributes } = useTrackerAttributes();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [trackersData] = await Promise.all([getTrackers()]);
      setTrackers(trackersData);
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  };

  const resetForm = () => {
    setEditingLogId(null);
  };

  const openAddPopup = () => {
    setEditingLogId(null);
    setTimeout(() => setPopupOpened(true), 0);
  };

  const openEditPopup = (log: Log) => {
    setEditingLogId(log.id);
    setPopupOpened(true);
  };

  const closePopup = () => {
    setPopupOpened(false);
  };

  useEffect(() => {
    if (!popupOpened) {
      resetForm();
    }
  }, [popupOpened]);

  const handleLogSuccess = () => {
    setPopupOpened(false);
    loadData();
  };

  const handleLogError = (errorMessage: string) => {
    alert(errorMessage);
  };

  const handleLogCancel = () => {
    setPopupOpened(false);
  };

  const handleDeleteLog = async (log: Log) => {
    const tracker = trackers.find((t) => t.id === log.trackerId);
    const trackerName = tracker
      ? `${tracker.name} (${tracker.unit})`
      : "Unknown tracker";

    if (
      confirm(
        `Are you sure you want to delete this log entry for "${trackerName}"? This action cannot be undone.`,
      )
    ) {
      try {
        await deleteLog(log.id);
        loadData();
      } catch (err) {
        console.error("Failed to delete log:", err);
        alert("Failed to delete log entry. Please try again.");
      }
    }
  };

  const getTrackerName = (trackerId: string) => {
    const tracker = trackers.find((t) => t.id === trackerId);
    return tracker ? tracker.name : "Unknown tracker";
  };

  const formatLogValue = (log: Log) => {
    return `${log.value}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Page>
      <Navbar
        title="Logs"
        rightAction={
          <button
            onClick={openAddPopup}
            className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            aria-label="Add log entry"
          >
            <Plus size={20} />
          </button>
        }
      />

      <div className="p-4">
        {!loading && !error && logs.length === 0 && (
          <div className="text-center py-8">
            <FileText size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              No log entries yet
            </p>
            <p className="text-gray-500 dark:text-gray-500 mb-4">
              Create your first log entry to start tracking!
            </p>
            <button
              onClick={openAddPopup}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus size={16} />
              Create Log Entry
            </button>
          </div>
        )}

        {logs.length > 0 && (
          <div className="space-y-2">
            {logs.map((log) => (
              <LogItem
                key={log.id}
                log={log}
                trackers={trackers}
                onEdit={openEditPopup}
                onDelete={handleDeleteLog}
                getTrackerName={getTrackerName}
                formatLogValue={formatLogValue}
                formatTimestamp={formatTimestamp}
                attributeOptions={attributeOptions}
                trackerAttributes={trackerAttributes}
              />
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={popupOpened} onClose={closePopup}>
        <LogForm
          logId={editingLogId}
          onSuccess={handleLogSuccess}
          onError={handleLogError}
          onCancel={handleLogCancel}
        />
      </Modal>
    </Page>
  );
}
