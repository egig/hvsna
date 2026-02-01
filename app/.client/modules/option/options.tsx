import { useEffect, useRef, useState } from "react";
import { Plus, Settings, RefreshCw } from "lucide-react";
import type { AttributeOption } from "./optionStore";
import { Modal } from "../navigation/modal";
import { Navbar, Page } from "../navigation";
import { useAttributeOptions } from "./use-options";
import { useTrackerAttributes } from "../attribute/use-tracker-attributes";
import AttributeOptionForm from "./option-form";

export default function AttributeOptions() {
  const {
    attributeOptions,
    loading,
    error,
    getAttributeOptions: loadAttributeOptions,
    deleteAttributeOption,
  } = useAttributeOptions();
  const { trackerAttributes } = useTrackerAttributes();
  const [popupOpened, setPopupOpened] = useState(false);
  const [editingAttributeOptionId, setEditingAttributeOptionId] = useState<
    string | null
  >(null);

  const resetForm = () => {
    setEditingAttributeOptionId(null);
  };

  const openAddPopup = () => {
    setEditingAttributeOptionId(null);
    setPopupOpened(true);
  };

  const openEditPopup = (attributeOption: AttributeOption) => {
    setEditingAttributeOptionId(attributeOption.id);
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

  const handleAttributeOptionSuccess = () => {
    setPopupOpened(false);
    loadAttributeOptions();
  };

  const handleAttributeOptionError = (errorMessage: string) => {
    alert(errorMessage);
  };

  const handleAttributeOptionCancel = () => {
    setPopupOpened(false);
  };

  const handleDeleteAttributeOption = async (
    attributeOption: AttributeOption,
  ) => {
    if (
      confirm(
        `Are you sure you want to delete "${attributeOption.name}"? This action cannot be undone.`,
      )
    ) {
      try {
        await deleteAttributeOption(attributeOption.id);
        loadAttributeOptions();
      } catch (err) {
        console.error("Failed to delete attribute option:", err);
        alert("Failed to delete attribute option. Please try again.");
      }
    }
  };

  const getAttributeName = (attributeId: string) => {
    const attribute = trackerAttributes.find((attr) => attr.id === attributeId);
    return attribute?.name || "Unknown Attribute";
  };

  return (
    <Page>
      <Navbar
        title="Attribute Options"
        rightAction={
          <button
            onClick={openAddPopup}
            className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            aria-label="Add attribute option"
          >
            <Plus size={20} />
          </button>
        }
      />
      <div className="p-4">
        {/* {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-600 dark:text-gray-400">
              Loading attribute options...
            </div>
          </div>
        )} */}

        {error && (
          <div className="space-y-4">
            <div className="text-red-600 dark:text-red-400">Error: {error}</div>
            <button
              onClick={() => {
                loadAttributeOptions;
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        )}

        {!loading && !error && attributeOptions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Settings size={48} className="text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              No attribute options yet
            </p>
            <p className="text-gray-500 dark:text-gray-500 mb-6">
              Create your first attribute option to provide choices for your
              attributes!
            </p>
            <button
              onClick={openAddPopup}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Create Option
            </button>
          </div>
        )}

        {attributeOptions.length > 0 && (
          <div className="space-y-2">
            {attributeOptions.map((attributeOption) => (
              <div
                key={attributeOption.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between group hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {attributeOption.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>
                      Attribute: {getAttributeName(attributeOption.attributeId)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditPopup(attributeOption)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteAttributeOption(attributeOption)}
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
          editingAttributeOptionId
            ? "Edit Attribute Option"
            : "Create Attribute Option"
        }
      >
        <AttributeOptionForm
          attributeOptionId={editingAttributeOptionId}
          onSuccess={handleAttributeOptionSuccess}
          onError={handleAttributeOptionError}
          onCancel={handleAttributeOptionCancel}
        />
      </Modal>
    </Page>
  );
}
