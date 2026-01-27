import { useEffect, useState } from "react";
import { Icon, List, ListItem, Navbar, NavTitle, Page, Preloader, Block, Button, Popup, NavRight, Link, f7 } from "framework7-react";
import { useEvaluation } from "../hooks/useEvaluation";
import { useTracker } from "../hooks/useTracker";
import { Target, Plus, Edit, Trash2, TargetIcon } from "lucide-react";
import type { Evaluation, Tracker } from "~/lib/tracker/types";
import EvaluationForm from "../components/evaluation-form";

export default function EvaluationList() {
  const { loading, error, deleteEvaluation, getEvaluations, refreshEvaluations } = useEvaluation();
  const { getTrackers } = useTracker();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [popupOpened, setPopupOpened] = useState(false);
  const [editingEvaluationId, setEditingEvaluationId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [evaluationsData, trackersData] = await Promise.all([
        getEvaluations(),
        getTrackers()
      ]);
      setEvaluations(evaluationsData);
      setTrackers(trackersData);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const resetForm = () => {
    setEditingEvaluationId(null);
  };

  const openAddPopup = () => {
    setEditingEvaluationId(null);
    setTimeout(() => setPopupOpened(true), 0);
  };

  const openEditPopup = (evaluation: Evaluation) => {
    setEditingEvaluationId(evaluation.id);
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

  const handleEvaluationSuccess = () => {
    setPopupOpened(false);
    loadData();
  };

  const handleEvaluationError = (errorMessage: string) => {
    f7.dialog.alert(errorMessage);
  };

  const handleEvaluationCancel = () => {
    setPopupOpened(false);
  };

  const handleDeleteEvaluation = async (evaluation: Evaluation) => {
    const tracker = trackers.find(t => t.id === evaluation.trackerId);
    const trackerName = tracker ? `${tracker.name} (${tracker.unit})` : 'Unknown tracker';
    
    f7.dialog.confirm(
      `Are you sure you want to delete this evaluation for "${trackerName}"? This action cannot be undone.`,
      'Delete Evaluation',
      async () => {
        try {
          await deleteEvaluation(evaluation.id);
          loadData();
        } catch (err) {
          console.error('Failed to delete evaluation:', err);
          f7.dialog.alert('Failed to delete evaluation. Please try again.');
        }
      }
    );
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'target':
        return 'Target';
      case 'range':
        return 'Range';
      case 'threshold':
        return 'Threshold';
      default:
        return type;
    }
  };

  const getPeriodLabel = (period?: string) => {
    if (!period) return 'No period';
    switch (period) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      case 'total':
        return 'Total';
      default:
        return period;
    }
  };

  const formatEvaluationValue = (evaluation: Evaluation) => {
    const tracker = trackers.find(t => t.id === evaluation.trackerId);
    const unit = tracker ? tracker.unit : '';
    
    if (evaluation.type === 'range' && evaluation.valueMax) {
      return `${evaluation.value} - ${evaluation.valueMax} ${unit}`;
    }
    return `${evaluation.value} ${unit}`;
  };

  const getTrackerName = (trackerId: string) => {
    const tracker = trackers.find(t => t.id === trackerId);
    return tracker ? tracker.name : 'Unknown tracker';
  };

  return (
    <Page>
      <Navbar backLink>
        <NavTitle>Evaluations</NavTitle>
        <NavRight>
          <Link onClick={openAddPopup}>
            <Plus />
          </Link>
        </NavRight>
      </Navbar>
      
      {loading && (
        <Block className="text-center">
          <Preloader />
          <div>Loading evaluations...</div>
        </Block>
      )}

      {error && (
        <Block className="text-center">
          <div style={{ color: 'red' }}>Error: {error}</div>
          <Button fill onClick={loadData}>
            <Icon ios="f7:arrow_clockwise" md="material:refresh" />
            Retry
          </Button>
        </Block>
      )}

      {!loading && !error && evaluations.length === 0 && (
        <Block className="text-center">
          <TargetIcon size={48} />
          <p>No evaluations yet</p>
          <p>Create your first budget, target, or threshold to start tracking!</p>
          <Button fill onClick={openAddPopup}>
            <Plus size={16} />
            Create Evaluation
          </Button>
        </Block>
      )}

      {!loading && !error && evaluations.length > 0 && (
        <List mediaList>
          {evaluations.map((evaluation) => (
            <ListItem
              key={evaluation.id}
              title={getTrackerName(evaluation.trackerId)}
              subtitle={`${formatEvaluationValue(evaluation)} • ${getPeriodLabel(evaluation.period)}`}
              swipeout
            >
              <div slot="root-end" className="swipeout-actions-right">
                <a 
                  href="#" 
                  className="swipeout-delete"
                  onClick={() => handleDeleteEvaluation(evaluation)}
                >
                  Delete
                </a>
              </div>
              <div slot="media">
                <Target size={24} className="text-blue-500" />
              </div>
              <div slot="after">
                <div className="text-xs text-gray-600">
                  {getTypeLabel(evaluation.type)}
                </div>
                {evaluation.soft && (
                  <div className="text-xs text-orange-600">
                    Soft
                  </div>
                )}
              </div>
              <div slot="root" onClick={() => openEditPopup(evaluation)} style={{ cursor: 'pointer' }}>
                <div className="text-xs text-gray-500 margin-top">
                  Created: {new Date(evaluation.createdAt).toLocaleDateString()}
                </div>
              </div>
            </ListItem>
          ))}
        </List>
      )}

      <Popup 
        opened={popupOpened} 
        onPopupClose={closePopup}
        backdrop
        closeOnEscape
      >
        <Page>
          <Navbar>
            <NavTitle>{editingEvaluationId ? "Edit Evaluation" : "New Evaluation"}</NavTitle>
            <NavRight>
              <Link onClick={closePopup}>Done</Link>
            </NavRight>
          </Navbar>
          
          <EvaluationForm
            evaluationId={editingEvaluationId}
            onSuccess={handleEvaluationSuccess}
            onError={handleEvaluationError}
            onCancel={handleEvaluationCancel}
          />
        </Page>
      </Popup>
    </Page>
  );
}
