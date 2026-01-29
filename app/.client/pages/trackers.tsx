import { useEffect, useRef, useState } from "react";
import { Icon, List, ListItem, Navbar, NavTitle, Page, Preloader, Block, Button, Popup, NavRight, Link, f7 } from "framework7-react";
import { TrendingUp, TrendingDown, Minus, Plus, Edit, Trash2, BarChart, BarChart2 } from "lucide-react";
import type { Tracker } from "~/lib/tracker/types";
import TrackerForm from "../components/tracker-form";

export default function Trackers() {
  const { loading, error, deleteTracker, getTrackers, refreshTrackers } = useTrack();
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
  
  return (
    <Page >
      <Navbar backLink>
        <NavTitle>Trackers</NavTitle>
        <NavRight>
          <Link onClick={openAddPopup}>
            <Plus />
          </Link>
        </NavRight>
      </Navbar>
      <Block className="text-center">
      {loading && (
        <>
          <Preloader />
          <div>Loading trackers...</div>
        </>
      )}


      {error && (
        <>
          <div style={{ color: 'red' }}>Error: {error}</div>
          <Button fill onClick={loadTrackers}>
            <Icon ios="f7:arrow_clockwise" md="material:refresh" />
            Retry
          </Button>
        </>
      )}

      {!loading && !error && trackers.length === 0 && (
        <>
          <BarChart2 size={48} />
          <p>No trackers yet</p>
          <p>Create your first tracker to start tracking!</p>
          <Button fill onClick={openAddPopup}>
            <Plus size={16} />
            Create Tracker
          </Button>
        </>
      )}

      </Block>

    {/* https://forum.framework7.io/t/react-sheet-crashes-app/15326 */}
      {trackers.length > 0 && (
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
          <TrackerForm
            trackerId={editingTrackerId}
            onSuccess={handleTrackerSuccess}
            onError={handleTrackerError}
            onCancel={handleTrackerCancel}
          />
      </Popup>
    </Page>
  );
}
