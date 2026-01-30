import { useEffect, useState } from "react";
import { useLog } from "../hooks/useLog";
import { useTracker } from "../hooks/use-tracker";
import { Plus, Edit, Trash2, FileText, MoreHorizontal } from "lucide-react";
import type { Log, Tracker } from "~/lib/tracker/types";
import LogForm from "../components/log-form";
import { Navbar } from "../navigation/components/Navbar";
import { Modal } from "../navigation/components/Modal";
import { useTrackers } from "../hooks/use-trackers";

export default function Journal() {
  const { loading, error, deleteLog, getLogs, refreshLogs } = useLog();
  const { getTrackers } = useTrackers();
  const [logs, setLogs] = useState<Log[]>([]);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [popupOpened, setPopupOpened] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [logsData, trackersData] = await Promise.all([
        getLogs(),
        getTrackers(),
      ]);
      setLogs(logsData);
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
        `Are you sure you want to delete this journal entry for "${trackerName}"? This action cannot be undone.`,
      )
    ) {
      try {
        await deleteLog(log.id);
        loadData();
      } catch (err) {
        console.error("Failed to delete log:", err);
        alert("Failed to delete journal entry. Please try again.");
      }
    }
  };

  const getTrackerName = (trackerId: string) => {
    const tracker = trackers.find((t) => t.id === trackerId);
    return tracker ? tracker.name : "Unknown tracker";
  };

  const formatLogValue = (log: Log) => {
    const tracker = trackers.find((t) => t.id === log.trackerId);
    const unit = tracker ? tracker.unit : "";
    return `${log.value} ${unit}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  interface LogItemProps {
    log: Log;
    trackers: Tracker[];
    onEdit: (log: Log) => void;
    onDelete: (log: Log) => void;
    getTrackerName: (trackerId: string) => string;
    formatLogValue: (log: Log) => string;
    formatTimestamp: (timestamp: number) => string;
  }

  function LogItem({
    log,
    trackers,
    onEdit,
    onDelete,
    getTrackerName,
    formatLogValue,
    formatTimestamp,
  }: LogItemProps) {
    const [showActions, setShowActions] = useState(false);

    useEffect(() => {
      const handleClickOutside = () => setShowActions(false);
      if (showActions) {
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
      }
    }, [showActions]);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          {/* Log Icon */}
          <div className="flex-shrink-0 mt-1">
            <FileText size={24} className="text-green-500" />
          </div>

          {/* Log Content */}
          <div className="flex-1 min-w-0">
            <h3
              className="font-medium text-gray-900 dark:text-white truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
              onClick={() => onEdit(log)}
            >
              {getTrackerName(log.trackerId)}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {formatLogValue(log)} • {formatTimestamp(log.timestamp)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Created: {new Date(log.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Actions */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreHorizontal size={16} className="text-gray-500" />
            </button>

            {showActions && (
              <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-[120px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(log);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(log);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar
        title="Journal"
        rightAction={
          <button
            onClick={openAddPopup}
            className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            aria-label="Add journal entry"
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
              No journal entries yet
            </p>
            <p className="text-gray-500 dark:text-gray-500 mb-4">
              Create your first journal entry to start tracking!
            </p>
            <button
              onClick={openAddPopup}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus size={16} />
              Create Journal Entry
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
    </div>
  );
}
