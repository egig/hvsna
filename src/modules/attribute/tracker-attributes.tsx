import { useEffect, useRef, useState } from "react";
import { Plus, Settings, RefreshCw } from "lucide-react";
import type { TrackerAttribute } from "./trackerAttributeStore";
import TrackerAttributeForm from "./tracker-attribute-form";
import { Modal } from "../navigation/modal";
import { Navbar, Page } from "../navigation";
import { useTrackerAttributes } from "./use-tracker-attributes";
import { useTrackers } from "../tracker/use-trackers";

export default function TrackerAttributes() {
  const {
    trackerAttributes,
    loading,
    error,
    getTrackerAttributes: loadTrackerAttributes,
    deleteTrackerAttribute,
  } = useTrackerAttributes();
  const { trackers } = useTrackers();
  const [popupOpened, setPopupOpened] = useState(false);
  const [editingTrackerAttributeId, setEditingTrackerAttributeId] = useState<
    string | null
  >(null);

  const resetForm = () => {
    setEditingTrackerAttributeId(null);
  };

  const openAddPopup = () => {
    setEditingTrackerAttributeId(null);
    setPopupOpened(true);
  };

  const openEditPopup = (trackerAttribute: TrackerAttribute) => {
    setEditingTrackerAttributeId(trackerAttribute.id);
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

  const handleTrackerAttributeSuccess = () => {
    setPopupOpened(false);
    loadTrackerAttributes();
  };

  const handleTrackerAttributeError = (errorMessage: string) => {
    alert(errorMessage);
  };

  const handleTrackerAttributeCancel = () => {
    setPopupOpened(false);
  };

  const handleDeleteTrackerAttribute = async (
    trackerAttribute: TrackerAttribute,
  ) => {
    if (
      confirm(
        `Are you sure you want to delete "${trackerAttribute.name}"? This action cannot be undone.`,
      )
    ) {
      try {
        await deleteTrackerAttribute(trackerAttribute.id);
        loadTrackerAttributes();
      } catch (err) {
        console.error("Failed to delete tracker attribute:", err);
        alert("Failed to delete tracker attribute. Please try again.");
      }
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "text":
        return "Text";
      case "number":
        return "Number";
      case "boolean":
        return "Boolean";
      case "date":
        return "Date";
      case "options":
        return "Options";
      default:
        return type;
    }
  };

  const getTrackerName = (trackerId: string) => {
    const tracker = trackers.find((t) => t.id === trackerId);
    return tracker?.name || "Unknown Tracker";
  };

  return (
    <Page>
      <Navbar
        title="Tracker Attributes"
        rightAction={
          <button
            onClick={openAddPopup}
            className="flex items-center justify-center w-10 h-10 bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] text-white rounded-full transition-colors"
            aria-label="Add tracker attribute"
          >
            <Plus size={20} />
          </button>
        }
      />
      <div className="p-4">
        {/* {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-600 dark:text-gray-400">
              Loading tracker attributes...
            </div>
          </div>
        )} */}

        {error && (
          <div className="space-y-4">
            <div className="text-red-600 dark:text-red-400">Error: {error}</div>
            <button
              onClick={() => {
                loadTrackerAttributes;
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        )}

        {!loading && !error && trackerAttributes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Settings size={48} className="text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              No tracker attributes yet
            </p>
            <p className="text-gray-500 dark:text-gray-500 mb-6">
              Create your first tracker attribute to customize your trackers!
            </p>
            <button
              onClick={openAddPopup}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Create Attribute
            </button>
          </div>
        )}

        {trackerAttributes.length > 0 && (
          <div className="space-y-2">
            {trackerAttributes.map((trackerAttribute) => (
              <div
                key={trackerAttribute.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between group hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {trackerAttribute.name}
                    </h3>
                    {trackerAttribute.required && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Type: {getTypeLabel(trackerAttribute.type)}</span>
                    <span>
                      Tracker: {getTrackerName(trackerAttribute.trackerId)}
                    </span>
                    {trackerAttribute.defaultValue !== undefined && (
                      <span>
                        Default: {trackerAttribute.defaultValue.toString()}
                      </span>
                    )}
                  </div>
                  {trackerAttribute.options &&
                    trackerAttribute.options.length > 0 && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium">Options:</span>{" "}
                        {trackerAttribute.options.join(", ")}
                      </div>
                    )}
                  {trackerAttribute.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {trackerAttribute.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditPopup(trackerAttribute)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteTrackerAttribute(trackerAttribute)
                    }
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
        title={
          editingTrackerAttributeId
            ? "Edit Tracker Attribute"
            : "Create Tracker Attribute"
        }
      >
        <TrackerAttributeForm
          trackerAttributeId={editingTrackerAttributeId}
          onSuccess={handleTrackerAttributeSuccess}
          onError={handleTrackerAttributeError}
          onCancel={handleTrackerAttributeCancel}
        />
      </Modal>
    </Page>
  );
}
