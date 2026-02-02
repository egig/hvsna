import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, BarChart2, RefreshCw } from "lucide-react";
import { formatValue } from "src/lib/format";
import type { Tracker } from "./trackerStore";
import TrackerForm from "./tracker-form";
import { Modal } from "../navigation/modal";
import { Button, Navbar, Page } from "../navigation";
import { useTrackers } from "./use-trackers";

export default function Trackers() {
  const {
    trackers,
    loading,
    error,
    getTrackers: loadTrackers,
    deleteTracker,
  } = useTrackers();
  const [popupOpened, setPopupOpened] = useState(false);
  const [editingTrackerId, setEditingTrackerId] = useState<string | null>(null);

  const resetForm = () => {
    setEditingTrackerId(null);
  };

  const openAddPopup = () => {
    setEditingTrackerId(null);
    setPopupOpened(true);
  };

  const openEditPopup = (tracker: Tracker) => {
    setEditingTrackerId(tracker.id);
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

  const handleTrackerSuccess = () => {
    setPopupOpened(false);
    loadTrackers();
  };

  const handleTrackerError = (errorMessage: string) => {
    alert(errorMessage);
  };

  const handleTrackerCancel = () => {
    setPopupOpened(false);
  };

  const handleDeleteTracker = async (tracker: Tracker) => {
    if (
      confirm(
        `Are you sure you want to delete "${tracker.name}"? This action cannot be undone.`,
      )
    ) {
      try {
        await deleteTracker(tracker.id);
        loadTrackers();
      } catch (err) {
        console.error("Failed to delete tracker:", err);
        alert("Failed to delete tracker. Please try again.");
      }
    }
  };

  return (
    <Page>
      <Navbar
        title="Trackers"
        rightAction={
          <button
            onClick={openAddPopup}
            className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            aria-label="Add task"
          >
            <Plus size={20} />
          </button>
        }
      />
      <div className="p-4">
        {/* {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-600 dark:text-gray-400">
              Loading trackers...
            </div>
          </div>
        )} */}

        {error && (
          <div className="space-y-4">
            <div className="text-red-600 dark:text-red-400">Error: {error}</div>
            <button
              onClick={() => {
                loadTrackers;
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        )}

        {!loading && !error && trackers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart2 size={48} className="text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              No trackers yet
            </p>
            <p className="text-gray-500 dark:text-gray-500 mb-6">
              Create your first tracker to start tracking!
            </p>
            <button
              onClick={openAddPopup}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Create Tracker
            </button>
          </div>
        )}

        {trackers.length > 0 && (
          <div className="space-y-2">
            {trackers.map((tracker) => (
              <div
                key={tracker.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between group hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {tracker.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Baseline: {formatValue(tracker.baseline, tracker.format)}{tracker.format !== "idr" && tracker.unit ? ` ${tracker.unit}` : ""}
                  </p>
                </div>
                <div className="flex gap-2 group-hover:opacity-100 transition-opacity">
                  <Button to={`/trackers/${tracker.id}`}>Detail</Button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditPopup(tracker);
                    }}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTracker(tracker);
                    }}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={popupOpened}
        onClose={closePopup}
        title={editingTrackerId ? "Edit Tracker" : "Create Tracker"}
      >
        <TrackerForm
          trackerId={editingTrackerId}
          onSuccess={handleTrackerSuccess}
          onError={handleTrackerError}
          onCancel={handleTrackerCancel}
        />
      </Modal>
    </Page>
  );
}
