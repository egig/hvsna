import React from "react";
import { Database, Merge, Trash2 } from "lucide-react";
import { Modal } from "src/modules/navigation/modal";

export interface SyncInitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMerge: () => void;
  onDeleteLocal: () => void;
  localDocCount: number;
}

export const SyncInitDialog: React.FC<SyncInitDialogProps> = ({
  isOpen,
  onClose,
  onMerge,
  onDeleteLocal,
  localDocCount,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sync Setup Required"
      className="max-w-md"
      noPadding={false}
    >
      <div className="p-6">
        {/* Content */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-blue-600" />
            <p className="text-gray-700">
              Your local database contains <strong>{localDocCount}</strong>{" "}
              items that need to be synced with the cloud.
            </p>
          </div>
          <p className="text-gray-600 text-sm">
            Choose how you want to handle your existing local data:
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {/* Merge Option */}
          <button
            onClick={onMerge}
            className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex-shrink-0">
              <Merge className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Merge Data</div>
              <div className="text-sm text-gray-600">
                Combine local and cloud data, keeping all items
              </div>
            </div>
          </button>

          {/* Delete Local Option */}
          <button
            onClick={onDeleteLocal}
            className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-red-50 transition-colors text-left"
          >
            <div className="flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Delete Local Data</div>
              <div className="text-sm text-gray-600">
                Remove all local data and start fresh from cloud
              </div>
            </div>
          </button>
        </div>

        {/* Warning */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This is a one-time setup. Your choice will be
            remembered for future sync operations.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};
