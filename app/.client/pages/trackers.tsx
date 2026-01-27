import { useEffect, useRef, useState } from "react";
import { Icon, List, ListItem, Navbar, NavTitle, Page, Preloader, Block, Button, Popup, NavRight, Link, f7 } from "framework7-react";
import { useTracker } from "../hooks/useTracker";
import { TrendingUp, TrendingDown, Minus, Plus, Edit, Trash2, BarChart, BarChart2 } from "lucide-react";
import type { Tracker } from "~/lib/tracker/types";
import TrackerForm from "../components/tracker-form";

export default function Trackers() {
  const { loading, error, deleteTracker, getTrackers, refreshTrackers } = useTracker();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [popupOpened, setPopupOpened] = useState(false);
  const [editingTrackerId, setEditingTrackerId] = useState<string | null>(null);

  useEffect(() => {
    loadTrackers();
  }, []);

  const loadTrackers = async () => {
    try {
      const trackersData = await getTrackers();
      setTrackers(trackersData);
    } catch (err) {
      console.error('Failed to load trackers:', err);
    }
  };

  const resetForm = () => {
    setEditingTrackerId(null);
  };

  const openAddPopup = () => {
    setEditingTrackerId(null);
    setTimeout(() => setPopupOpened(true), 0);
  };

  const openEditPopup = (tracker: Tracker) => {
    setEditingTrackerId(tracker.id);
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

  const handleTrackerSuccess = () => {
    setPopupOpened(false);
    loadTrackers();
  };

  const handleTrackerError = (errorMessage: string) => {
    f7.dialog.alert(errorMessage);
  };

  const handleTrackerCancel = () => {
    setPopupOpened(false);
  };

  const handleDeleteTracker = async (tracker: Tracker) => {
    f7.dialog.confirm(
      `Are you sure you want to delete "${tracker.name}"? This action cannot be undone.`,
      'Delete Tracker',
      async () => {
        try {
          await deleteTracker(tracker.id);
          loadTrackers();
        } catch (err) {
          console.error('Failed to delete tracker:', err);
          f7.dialog.alert('Failed to delete tracker. Please try again.');
        }
      }
    );
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'increase':
        return <TrendingUp size={24} className="text-green-500" />;
      case 'decrease':
        return <TrendingDown size={24} className="text-red-500" />;
      default:
        return <Minus size={24} className="text-gray-500" />;
    }
  };

  const getReducerLabel = (reducer: string) => {
    switch (reducer) {
      case 'sum':
        return 'Sum';
      case 'count':
        return 'Count';
      case 'last':
        return 'Last';
      case 'avg':
        return 'Average';
      case 'min':
        return 'Minimum';
      case 'max':
        return 'Maximum';
      default:
        return reducer;
    }
  };

  const getDirectionLabel = (direction: string) => {
    switch (direction) {
      case 'increase':
        return 'Increase (good when up)';
      case 'decrease':
        return 'Decrease (good when down)';
      case 'neutral':
        return 'Neutral';
      default:
        return direction;
    }
  };

  return (
    <Page>
      <Navbar backLink>
        <NavTitle>Trackers</NavTitle>
        <NavRight>
          <Link onClick={openAddPopup}>
            <Plus />
          </Link>
        </NavRight>
      </Navbar>
      
      {loading && (
        <Block className="text-center">
          <Preloader />
          <div>Loading trackers...</div>
        </Block>
      )}

      {error && (
        <Block className="text-center">
          <div style={{ color: 'red' }}>Error: {error}</div>
          <Button fill onClick={loadTrackers}>
            <Icon ios="f7:arrow_clockwise" md="material:refresh" />
            Retry
          </Button>
        </Block>
      )}

      {!loading && !error && trackers.length === 0 && (
        <Block className="text-center">
          <BarChart2 size={48} />
          <p>No trackers yet</p>
          <p>Create your first tracker to start tracking!</p>
          <Button fill onClick={openAddPopup}>
            <Plus size={16} />
            Create Tracker
          </Button>
        </Block>
      )}

      {!loading && !error && trackers.length > 0 && (
        <List mediaList>
          {trackers.map((tracker) => (
            <ListItem
              key={tracker.id}
              title={tracker.name}
              subtitle={`${tracker.baseline} ${tracker.unit}`}
              swipeout
            >
              <div slot="root-end" className="swipeout-actions-right">
                <a 
                  href="#" 
                  className="swipeout-delete"
                  onClick={() => handleDeleteTracker(tracker)}
                >
                  Delete
                </a>
              </div>
              <div slot="media">
                {getDirectionIcon(tracker.direction)}
              </div>
              <div slot="after">
                <div className="text-xs text-gray-600">
                  {getReducerLabel(tracker.reducer)}
                </div>
              </div>
              <div slot="root" onClick={() => openEditPopup(tracker)} style={{ cursor: 'pointer' }}>
                <div className="text-xs text-gray-500 margin-top">
                  {getDirectionLabel(tracker.direction)}
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
            <NavTitle>{editingTrackerId ? "Edit Tracker" : "New Tracker"}</NavTitle>
            <NavRight>
              <Link onClick={closePopup}>Done</Link>
            </NavRight>
          </Navbar>
          
          <TrackerForm
            trackerId={editingTrackerId}
            onSuccess={handleTrackerSuccess}
            onError={handleTrackerError}
            onCancel={handleTrackerCancel}
          />
        </Page>
      </Popup>
    </Page>
  );
}
