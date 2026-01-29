import { useEffect, useState } from "react";
import { Icon, List, ListItem, Navbar, NavTitle, Page, Preloader, Block, Button, Popup, NavRight, Link, f7 } from "framework7-react";
import { useTargets }  from "../hooks/use-targets";
import { useTracker } from "../hooks/useTracker";
import { Target, Plus, Edit, Trash2, TargetIcon } from "lucide-react";
import type { Target as TargetType, Tracker } from "~/lib/tracker/types";
import TargetForm from "../components/target-form";
import { useTarget } from "../hooks/use-target";

export default function Targets() {
  const { loading, error, targets, getTargets, } = useTargets();
  const {deleteTarget} = useTarget();
  const { getTrackers } = useTracker();
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
        getTrackers()
      ]);
      setTrackers(trackersData);
    } catch (err) {
      console.error('Failed to load data:', err);
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
    f7.dialog.alert(errorMessage);
  };

  const handleTargetCancel = () => {
    setPopupOpened(false);
  };

  const handleDeleteTarget = async (target: TargetType) => {
    const tracker = trackers.find(t => t.id === target.trackerId);
    const trackerName = tracker ? `${tracker.name} (${tracker.unit})` : 'Unknown tracker';
    
    f7.dialog.confirm(
      `Are you sure you want to delete this target for "${trackerName}"? This action cannot be undone.`,
      'Delete Target',
      async () => {
        try {
          await deleteTarget(target.id);
        } catch (err) {
          console.error('Failed to delete target:', err);
          f7.dialog.alert('Failed to delete target. Please try again.');
        }
      }
    );
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'static':
        return 'Static';
      case 'range':
        return 'Range';
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

  const formatTargetValue = (target: TargetType) => {
    const tracker = trackers.find(t => t.id === target.trackerId);
    const unit = tracker ? tracker.unit : '';
    
    if (target.type === 'range' && target.valueMax) {
      return `${target.value} - ${target.valueMax} ${unit}`;
    }
    return `${target.value} ${unit}`;
  };

  const getTrackerName = (trackerId: string) => {
    const tracker = trackers.find(t => t.id === trackerId);
    return tracker ? tracker.name : 'Unknown tracker';
  };

  return (
    <Page>
      <Navbar backLink>
        <NavTitle>Targets</NavTitle>
        <NavRight>
          <Link onClick={openAddPopup}>
            <Plus />
          </Link>
        </NavRight>
      </Navbar>
      <Block>
      {loading && (
        <div className="text-center">
          <Preloader />
          <div>Loading targets...</div>
        </div >
      )}
      
      {error && (
        <div className="text-center">
          <div style={{ color: 'red' }}>Error: {error}</div>
          <Button fill onClick={getTargets}>
            <Icon ios="f7:arrow_clockwise" md="material:refresh" />
            Retry
          </Button>
        </div>
      )}
      
      {!loading && targets.length === 0 && (
        <div className="text-center">
          <TargetIcon size={48} className="text-gray-400" />
          <p>No targets yet</p>
          <p>Create your first target to start tracking!</p>
          <Button fill onClick={openAddPopup}>
            <Plus size={16} />
            Create Target
          </Button>
        </div>
      )}
      </Block>
  

        <List mediaList dividersIos strong outline>
          {targets.map((target) => (
            <ListItem
              key={target.id}
              title={getTrackerName(target.trackerId)}
              subtitle={`${formatTargetValue(target)} • ${getPeriodLabel(target.period)}`}
              swipeout
            >
              <div slot="root-end" className="swipeout-actions-right">
                <a 
                  href="#" 
                  className="swipeout-delete"
                  onClick={() => handleDeleteTarget(target)}
                >
                  Delete
                </a>
              </div>
              <div slot="media">
                <Target size={24} className="text-blue-500" />
              </div>
              <div slot="after">
                <div className="text-xs text-gray-600">
                  {getTypeLabel(target.type)}
                </div>
                {target.soft && (
                  <div className="text-xs text-orange-600">
                    Soft
                  </div>
                )}
              </div>
              <div slot="root" onClick={() => openEditPopup(target)} style={{ cursor: 'pointer' }}>
                <div className="text-xs text-gray-500 margin-top">
                  Created: {new Date(target.createdAt).toLocaleDateString()}
                </div>
              </div>
            </ListItem>
          ))}
        </List>

      <Popup 
        opened={popupOpened} 
        onPopupClose={closePopup}
        backdrop
        closeOnEscape
      >
          <TargetForm
            targetId={editingTargetId}
            onSuccess={handleTargetSuccess}
            onError={handleTargetError}
            onCancel={handleTargetCancel}
          />
      </Popup>
    </Page>
  );
}
