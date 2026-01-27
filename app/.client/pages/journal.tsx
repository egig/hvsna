import { useEffect, useState } from "react";
import { Icon, List, ListItem, Navbar, NavTitle, Page, Preloader, Block, Button, Popup, NavRight, Link, f7 } from "framework7-react";
import { useLog } from "../hooks/useLog";
import { useTracker } from "../hooks/useTracker";
import { Plus, Edit, Trash2, FileText } from "lucide-react";
import type { Log, Tracker } from "~/lib/tracker/types";
import LogForm from "../components/log-form";

export default function Journal() {
  const { loading, error, deleteLog, getLogs, refreshLogs } = useLog();
  const { getTrackers } = useTracker();
  const [logs, setLogs] = useState<Log[]>([]);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [popupOpened, setPopupOpened] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [logsData, trackersData] = await Promise.all([
        getLogs(),
        getTrackers()
      ]);
      setLogs(logsData);
      setTrackers(trackersData);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const resetForm = () => {
    setEditingLogId(null);
  };

  const openAddPopup = () => {
    setEditingLogId(null);
    setTimeout(() => setPopupOpened(true), 0);
  };

  const openEditPopup = (log: Log) => {
    setEditingLogId(log.id);
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

  const handleLogSuccess = () => {
    setPopupOpened(false);
    loadData();
  };

  const handleLogError = (errorMessage: string) => {
    f7.dialog.alert(errorMessage);
  };

  const handleLogCancel = () => {
    setPopupOpened(false);
  };

  const handleDeleteLog = async (log: Log) => {
    const tracker = trackers.find(t => t.id === log.trackerId);
    const trackerName = tracker ? `${tracker.name} (${tracker.unit})` : 'Unknown tracker';
    
    f7.dialog.confirm(
      `Are you sure you want to delete this journal entry for "${trackerName}"? This action cannot be undone.`,
      'Delete Journal Entry',
      async () => {
        try {
          await deleteLog(log.id);
          loadData();
        } catch (err) {
          console.error('Failed to delete log:', err);
          f7.dialog.alert('Failed to delete journal entry. Please try again.');
        }
      }
    );
  };

  const getTrackerName = (trackerId: string) => {
    const tracker = trackers.find(t => t.id === trackerId);
    return tracker ? tracker.name : 'Unknown tracker';
  };

  const formatLogValue = (log: Log) => {
    const tracker = trackers.find(t => t.id === log.trackerId);
    const unit = tracker ? tracker.unit : '';
    return `${log.value} ${unit}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Page>
      <Navbar backLink>
        <NavTitle>Journal</NavTitle>
        <NavRight>
          <Link onClick={openAddPopup}>
            <Plus />
          </Link>
        </NavRight>
      </Navbar>
      
      {loading && (
        <Block className="text-center">
          <Preloader />
          <div>Loading journal entries...</div>
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

      {!loading && !error && logs.length === 0 && (
        <Block className="text-center">
          <FileText size={48} />
          <p>No journal entries yet</p>
          <p>Create your first journal entry to start tracking!</p>
          <Button fill onClick={openAddPopup}>
            <Plus size={16} />
            Create Journal Entry
          </Button>
        </Block>
      )}

      {!loading && !error && logs.length > 0 && (
        <List mediaList>
          {logs.map((log) => (
            <ListItem
              key={log.id}
              title={getTrackerName(log.trackerId)}
              subtitle={`${formatLogValue(log)} • ${formatTimestamp(log.timestamp)}`}
              swipeout
            >
              <div slot="root-end" className="swipeout-actions-right">
                <a 
                  href="#" 
                  className="swipeout-delete"
                  onClick={() => handleDeleteLog(log)}
                >
                  Delete
                </a>
              </div>
              <div slot="media">
                <FileText size={24} className="text-green-500" />
              </div>
              <div slot="root" onClick={() => openEditPopup(log)} style={{ cursor: 'pointer' }}>
                <div className="text-xs text-gray-500 margin-top">
                  Created: {new Date(log.createdAt).toLocaleDateString()}
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
          
          <LogForm
            logId={editingLogId}
            onSuccess={handleLogSuccess}
            onError={handleLogError}
            onCancel={handleLogCancel}
          />
      </Popup>
    </Page>
  );
}
