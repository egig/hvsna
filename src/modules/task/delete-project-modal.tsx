import { useState } from "react";
import { HvAlertTriangle } from "@/modules/icons";
import { Modal } from "../navigation/modal";
import type { Task } from "./types";

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteTasks: boolean) => Promise<void>;
  projectName: string;
  tasks: Task[];
}

export function DeleteProjectModal({
  isOpen,
  onClose,
  onConfirm,
  projectName,
  tasks,
}: DeleteProjectModalProps) {
  const [deleteTasks, setDeleteTasks] = useState(tasks.length > 0);

  const handleConfirm = async () => {
    await onConfirm(deleteTasks);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Project"
      className="max-w-md"
    >
      <div className="p-6">
        {/* Warning */}
        <div className="flex items-start gap-3 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <HvAlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-900 mb-1">
              This action cannot be undone
            </h3>
            <p className="text-sm text-red-700">
              Once you delete "{projectName}", all its data cannot be recovered.
            </p>
          </div>
        </div>

        {/* Task Count */}
        {tasks.length > 0 && (
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              This project contains{" "}
              <span className="font-medium">{tasks.length}</span> task
              {tasks.length === 1 ? "" : "s"}.
            </p>

            {/* Toggle Option */}
            <div className="space-y-3">
              <label className="group flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="mt-1">
                  <input
                    type="checkbox"
                    checked={deleteTasks}
                    onChange={(e) => setDeleteTasks(e.target.checked)}
                    className="w-5 h-5 rounded border-2 text-red-600 focus:ring-red-600 focus:border-red-600 cursor-pointer"
                  />
                </div>

                <div className="flex-1">
                  <div className="font-medium text-gray-900 mb-1">
                    Delete all tasks
                  </div>
                  <div className="text-sm text-gray-600">
                    {deleteTasks
                      ? "All tasks in this project will be permanently deleted."
                      : "Tasks will be moved to inbox."}
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
          >
            Delete Project
          </button>
        </div>
      </div>
    </Modal>
  );
}
