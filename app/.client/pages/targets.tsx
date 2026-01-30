import { useEffect, useState } from "react";
import { useTargets } from "../hooks/use-targets";
import { useTracker } from "../hooks/use-tracker";
import {
  Target,
  Plus,
  Edit,
  Trash2,
  TargetIcon,
  MoreHorizontal,
} from "lucide-react";
import type { Target as TargetType, Tracker } from "~/lib/tracker/types";
import TargetForm from "../components/target-form";
import { useTarget } from "../hooks/use-target";
import { Page } from "../navigation/components/Page";
import { Navbar } from "../navigation/components/Navbar";
import { Modal } from "../navigation/components/Modal";
import { LoadingSpinner } from "../components/loading";
import Block from "../components/block";
import { useTrackers } from "../hooks/use-trackers";

export default function Targets() {
  const { loading, error, targets, getTargets } = useTargets();
  const { deleteTarget } = useTarget();
  const { getTrackers } = useTrackers();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [popupOpened, setPopupOpened] = useState(false);
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [targetsData, trackersData] = await Promise.all([
        getTargets(),
        getTrackers(),
      ]);
      setTrackers(trackersData);
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  };

  const resetForm = () => {
    setEditingTargetId(null);
  };

  const openAddPopup = () => {
    setEditingTargetId(null);
    setTimeout(() => setPopupOpened(true), 0);
  };

  const openEditPopup = (target: TargetType) => {
    setEditingTargetId(target.id);
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

  const handleTargetSuccess = () => {
    setPopupOpened(false);
    getTargets();
  };

  const handleTargetError = (errorMessage: string) => {
    alert(errorMessage);
  };

  const handleTargetCancel = () => {
    setPopupOpened(false);
  };

  const handleDeleteTarget = async (target: TargetType) => {
    const tracker = trackers.find((t) => t.id === target.trackerId);
    const trackerName = tracker
      ? `${tracker.name} (${tracker.unit})`
      : "Unknown tracker";

    if (
      confirm(
        `Are you sure you want to delete this target for "${trackerName}"? This action cannot be undone.`,
      )
    ) {
      try {
        await deleteTarget(target.id);
      } catch (err) {
        console.error("Failed to delete target:", err);
        alert("Failed to delete target. Please try again.");
      }
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "static":
        return "Static";
      case "range":
        return "Range";
      default:
        return type;
    }
  };

  const getPeriodLabel = (period?: string) => {
    if (!period) return "No period";
    switch (period) {
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      case "monthly":
        return "Monthly";
      case "yearly":
        return "Yearly";
      case "total":
        return "Total";
      default:
        return period;
    }
  };

  const formatTargetValue = (target: TargetType) => {
    const tracker = trackers.find((t) => t.id === target.trackerId);
    const unit = tracker ? tracker.unit : "";

    if (target.type === "range" && target.valueMax) {
      return `${target.value} - ${target.valueMax} ${unit}`;
    }
    return `${target.value} ${unit}`;
  };

  interface TargetItemProps {
    target: TargetType;
    trackers: Tracker[];
    onEdit: (target: TargetType) => void;
    onDelete: (target: TargetType) => void;
    getTypeLabel: (type: string) => string;
    getPeriodLabel: (period?: string) => string;
    formatTargetValue: (target: TargetType) => string;
    getTrackerName: (trackerId: string) => string;
  }

  function TargetItem({
    target,
    trackers,
    onEdit,
    onDelete,
    getTypeLabel,
    getPeriodLabel,
    formatTargetValue,
    getTrackerName,
  }: TargetItemProps) {
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
          {/* Target Icon */}
          <div className="flex-shrink-0 mt-1">
            <Target size={24} className="text-blue-500" />
          </div>

          {/* Target Content */}
          <div className="flex-1 min-w-0">
            <h3
              className="font-medium text-gray-900 dark:text-white truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
              onClick={() => onEdit(target)}
            >
              {getTrackerName(target.trackerId)}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {formatTargetValue(target)} • {getPeriodLabel(target.period)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Created: {new Date(target.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Status and Actions */}
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {getTypeLabel(target.type)}
              </div>
              {target.soft && (
                <div className="text-xs text-orange-600">Soft</div>
              )}
            </div>

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
                      onEdit(target);
                      setShowActions(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(target);
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
      </div>
    );
  }

  const getTrackerName = (trackerId: string) => {
    const tracker = trackers.find((t) => t.id === trackerId);
    return tracker ? tracker.name : "Unknown tracker";
  };

  return (
    <Page>
      <Navbar
        title="Targets"
        rightAction={
          <button
            onClick={openAddPopup}
            className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            aria-label="Add target"
          >
            <Plus size={20} />
          </button>
        }
      />

      <div className="p-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <LoadingSpinner size="lg" text="Loading targets..." />
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">Error: {error}</div>
            <button
              onClick={() => getTargets()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="rotate-45" size={16} />
              Retry
            </button>
          </div>
        )}

        {!loading && targets.length === 0 && (
          <div className="text-center py-8">
            <TargetIcon size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              No targets yet
            </p>
            <p className="text-gray-500 dark:text-gray-500 mb-4">
              Create your first target to start tracking!
            </p>
            <button
              onClick={openAddPopup}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus size={16} />
              Create Target
            </button>
          </div>
        )}

        {targets.length > 0 && (
          <div className="space-y-2">
            {targets.map((target) => (
              <TargetItem
                key={target.id}
                target={target}
                trackers={trackers}
                onEdit={openEditPopup}
                onDelete={handleDeleteTarget}
                getTypeLabel={getTypeLabel}
                getPeriodLabel={getPeriodLabel}
                formatTargetValue={formatTargetValue}
                getTrackerName={getTrackerName}
              />
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={popupOpened} onClose={closePopup}>
        <TargetForm
          targetId={editingTargetId}
          onSuccess={handleTargetSuccess}
          onError={handleTargetError}
          onCancel={handleTargetCancel}
        />
      </Modal>
    </Page>
  );
}
