import { usePouchDB } from "../../pouchdb";
import { Modal, Navbar, Page } from "../navigation";
import Block from "../../ui/block";
import { useEffect, useState } from "react";
import type { Goal } from "src/modules/tracker/types";
import GoalForm from "src/modules/goal/goal-form";
import { useGoals } from "src/modules/goal/use-goals";
import { useGoal } from "src/modules/goal/use-goal";
import { useTrackers } from "src/modules/tracker/use-trackers";
import { Plus } from "lucide-react";
import {
  useTargetResults,
  type TargetResult,
  type TargetResultData,
} from "./useTargetResults";
import BlockTitle from "../../ui/block-title";
import { GoalResultItem } from "src/modules/goal/goal-result-item";
import { GoalResultsSummary } from "src/modules/goal/goal-result-summary";

export function Goals() {
  const { db } = usePouchDB();
  const {
    loading: goalsLoading,
    error: goalsError,
    goals,
    getGoals,
  } = useGoals();
  const { deleteGoal } = useGoal("");
  const { getTrackers } = useTrackers();
  const [popupOpened, setPopupOpened] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const { getTargetResults } = useTargetResults();
  const [results, setResults] = useState<TargetResultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        setError(null);

        const targetResults = await getTargetResults(
          {
            // TODO
            // trackerId,
            // targetIds,
            // from,
            // to,
          },
          db,
        );

        setResults(targetResults);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load target results",
        );
      } finally {
        setLoading(false);
      }
    };

    if (db) {
      loadResults();
    }
  }, [getTargetResults, db]);

  const openAddPopup = () => {
    setEditingGoalId(null);
    setTimeout(() => setPopupOpened(true), 0);
  };

  const openEditPopup = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setPopupOpened(true);
  };

  const closePopup = () => {
    setPopupOpened(false);
  };

  const resetForm = () => {
    setEditingGoalId(null);
  };

  useEffect(() => {
    if (!popupOpened) {
      resetForm();
    }
  }, [popupOpened]);

  const handleGoalSuccess = () => {
    setPopupOpened(false);
  };

  const handleGoalError = (errorMessage: string) => {
    alert(errorMessage);
  };

  const handleGoalCancel = () => {
    setPopupOpened(false);
  };

  const handleDeleteGoal = async (goal: Goal) => {
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

      {loading && (
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-gray-600">Loading target results...</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800 font-medium">Error</div>
            <div className="text-red-600 text-sm mt-1">{error}</div>
          </div>
        </div>
      )}

      {results.length === 0 && (
        <div className="p-6">
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No targets found</div>
            <div className="text-gray-500 text-sm">
              Try adjusting your filters or create some targets first
            </div>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <Block>
          <BlockTitle>Summary</BlockTitle>
          <GoalResultsSummary results={results} />
          <BlockTitle>Goals</BlockTitle>

          <div className="space-y-2">
            {results.map((result) => (
              <GoalResultItem
                key={result.targetId}
                result={result}
                onItemClick={(goal: Goal) => openEditPopup(goal)}
              />
            ))}
          </div>
        </Block>
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
