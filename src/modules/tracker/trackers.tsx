import { useEffect, useRef, useState } from "react";
import { Plus, BarChart2, RefreshCw } from "lucide-react";
import { formatValue } from "src/lib/format";
import type { Tracker } from "./trackerStore";
import TrackerForm from "./tracker-form";
import { Modal } from "../navigation/modal";
import { Navbar, Page } from "../navigation";
import { useTrackers } from "./use-trackers";
import { useFeatureFlag } from "src/hooks/useFeatureFlags";
import { ListItem } from "../../components/list-item";

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
  const attrEnabled = useFeatureFlag("TRACKER_ATTR");

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
    try {
      await deleteTracker(tracker.id);
      loadTrackers();
      setPopupOpened(false);
    } catch (err) {
      console.error("Failed to delete tracker:", err);
      alert("Failed to delete tracker. Please try again.");
    }
  };

  const handleDeleteTrackerById = async (trackerId: string) => {
    const tracker = trackers.find((t) => t.id === trackerId);
    if (tracker) {
      await handleDeleteTracker(tracker);
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
      {error && (
        <div className="p-4">
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
        </div>
      )}

      {!loading && !error && trackers.length === 0 && (
        <div>
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
        </div>
      )}

      {trackers.length > 0 && (
        <>
          {trackers.map((tracker) => (
            <ListItem
              key={tracker.id}
              title={tracker.name}
              subtitle={`Baseline: ${formatValue(tracker.baseline, tracker.format)}${tracker.format !== "idr" && tracker.unit ? ` ${tracker.unit}` : ""}`}
              leftIcon={<BarChart2 size={24} className="text-gray-400" />}
              onClick={() => openEditPopup(tracker)}
              rightIcon={
                attrEnabled ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/trackers/${tracker.id}`;
                    }}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Detail
                  </button>
                ) : undefined
              }
            />
          ))}
        </>
      )}

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
          onDelete={handleDeleteTrackerById}
        />
      </Modal>
    </Page>
  );
}
