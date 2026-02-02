import { useEffect, useState } from "react";
import {
  Target as GoalIcon,
  Plus,
  Edit,
  Trash2,
  Target,
  MoreHorizontal,
} from "lucide-react";
import { formatValue } from "src/lib/format";
import type { Goal as GoalType } from "src/lib/tracker/types";
import GoalForm from "./goal-form";
import { Page } from "../navigation/page";
import { Navbar } from "../navigation/navbar";
import { Modal } from "../navigation/modal";
import { useTrackers } from "../tracker/use-trackers";
import { useGoals } from "./use-goals";
import { useGoal } from "./use-goal";
import type { Tracker } from "../tracker/trackerStore";
import { LoadingSpinner } from "src/components/loader";

export default function Goals() {
  const { loading, error, goals, getGoals } = useGoals();
  const { deleteGoal } = useGoal("");
  const { getTrackers } = useTrackers();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [popupOpened, setPopupOpened] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [goalsData, trackersData] = await Promise.all([
        getGoals(),
        getTrackers(),
      ]);
      setTrackers(trackersData);
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  };

  const resetForm = () => {
    setEditingGoalId(null);
  };

  const openAddPopup = () => {
    setEditingGoalId(null);
    setTimeout(() => setPopupOpened(true), 0);
  };

  const openEditPopup = (goal: GoalType) => {
    setEditingGoalId(goal.id);
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

  const handleGoalSuccess = () => {
    setPopupOpened(false);
    getGoals();
  };

  const handleGoalError = (errorMessage: string) => {
    alert(errorMessage);
  };

  const handleGoalCancel = () => {
    setPopupOpened(false);
  };

  const handleDeleteGoal = async (goal: GoalType) => {
    const tracker = trackers.find((t) => t.id === goal.trackerId);
    const trackerName = tracker
      ? `${tracker.name}`
      : "Unknown tracker";

    if (
      confirm(
        `Are you sure you want to delete this goal for "${trackerName}"? This action cannot be undone.`,
      )
    ) {
      try {
        await deleteGoal(goal.id);
      } catch (err) {
        console.error("Failed to delete goal:", err);
        alert("Failed to delete goal. Please try again.");
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

  const formatGoalValue = (goal: GoalType) => {
    const tracker = trackers.find((t) => t.id === goal.trackerId);

    if (goal.type === "range" && goal.valueMax) {
      const minValue = formatValue(goal.value, tracker?.format);
      const maxValue = formatValue(goal.valueMax, tracker?.format);
      return `${minValue} - ${maxValue}`;
    }
    return formatValue(goal.value, tracker?.format);
  };

  interface GoalItemProps {
    goal: GoalType;
    trackers: Tracker[];
    onEdit: (goal: GoalType) => void;
    onDelete: (goal: GoalType) => void;
    getTypeLabel: (type: string) => string;
    getPeriodLabel: (period?: string) => string;
    formatGoalValue: (goal: GoalType) => string;
    getTrackerName: (trackerId: string) => string;
  }

  function GoalItem({
    goal,
    trackers,
    onEdit,
    onDelete,
    getTypeLabel,
    getPeriodLabel,
    formatGoalValue,
    getTrackerName,
  }: GoalItemProps) {
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
          {/* Goal Icon */}
          <div className="flex-shrink-0 mt-1">
            <GoalIcon size={24} className="text-blue-500" />
          </div>

          {/* Goal Content */}
          <div className="flex-1 min-w-0">
            <h3
              className="font-medium text-gray-900 dark:text-white truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
              onClick={() => onEdit(goal)}
            >
              {getTrackerName(goal.trackerId)} - {goal.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {formatGoalValue(goal)} • {getPeriodLabel(goal.period)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Created: {new Date(goal.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Status and Actions */}
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {getTypeLabel(goal.type)}
              </div>
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
                      onEdit(goal);
                      setShowActions(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(goal);
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
        title="Goals"
        rightAction={
          <button
            onClick={openAddPopup}
            className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            aria-label="Add goal"
          >
            <Plus size={20} />
          </button>
        }
      />

      <div className="p-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <LoadingSpinner size="lg" text="Loading goals..." />
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">Error: {error}</div>
            <button
              onClick={() => getGoals()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="rotate-45" size={16} />
              Retry
            </button>
          </div>
        )}

        {!loading && goals.length === 0 && (
          <div className="text-center py-8">
            <GoalIcon size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              No goals yet
            </p>
            <p className="text-gray-500 dark:text-gray-500 mb-4">
              Create your first goal to start tracking!
            </p>
            <button
              onClick={openAddPopup}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus size={16} />
              Create Goal
            </button>
          </div>
        )}

        {goals.length > 0 && (
          <div className="space-y-2">
            {goals.map((goal) => (
              <GoalItem
                key={goal.id}
                goal={goal}
                trackers={trackers}
                onEdit={openEditPopup}
                onDelete={handleDeleteGoal}
                getTypeLabel={getTypeLabel}
                getPeriodLabel={getPeriodLabel}
                formatGoalValue={formatGoalValue}
                getTrackerName={getTrackerName}
              />
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={popupOpened} onClose={closePopup}>
        <GoalForm
          goalId={editingGoalId}
          onSuccess={handleGoalSuccess}
          onError={handleGoalError}
          onCancel={handleGoalCancel}
        />
      </Modal>
    </Page>
  );
}
