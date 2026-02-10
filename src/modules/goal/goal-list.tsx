import { useEffect, useState } from "react";
import { Target as GoalIcon, Plus, Target } from "lucide-react";
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
import { ListItem } from "../../components/list-item";

export default function GoalList() {
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
    try {
      await deleteGoal(goal.id);
      getGoals();
      setPopupOpened(false);
    } catch (err) {
      console.error("Failed to delete goal:", err);
      alert("Failed to delete goal. Please try again.");
    }
  };

  const handleDeleteGoalById = async (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      await handleDeleteGoal(goal);
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
            className="flex items-center justify-center w-10 h-10 bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] text-white rounded-full transition-colors"
            aria-label="Add goal"
          >
            <Plus size={20} />
          </button>
        }
      />

      {loading && (
        <div className="p-4">
          <div className="flex flex-col items-center justify-center py-8">
            <LoadingSpinner size="lg" text="Loading goals..." />
          </div>
        </div>
      )}

      {error && (
        <div className="p-4">
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
        </div>
      )}

      {!loading && goals.length === 0 && (
        <div className="p-4">
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
        </div>
      )}
      {goals.length > 0 && (
        <>
          {goals.map((goal) => (
            <ListItem
              key={goal.id}
              title={`${getTrackerName(goal.trackerId)} - ${goal.name}`}
              subtitle={`${formatGoalValue(goal)} • ${getPeriodLabel(goal.period)}`}
              description={`Created: ${new Date(goal.createdAt).toLocaleDateString()}`}
              leftIcon={<GoalIcon size={24} className="text-blue-500" />}
              onClick={() => openEditPopup(goal)}
              rightIcon={
                <div className="text-right">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {getTypeLabel(goal.type)}
                  </div>
                </div>
              }
            />
          ))}
        </>
      )}

      <Modal isOpen={popupOpened} onClose={closePopup}>
        <GoalForm
          goalId={editingGoalId}
          onSuccess={handleGoalSuccess}
          onError={handleGoalError}
          onCancel={handleGoalCancel}
          onDelete={handleDeleteGoalById}
        />
      </Modal>
    </Page>
  );
}
