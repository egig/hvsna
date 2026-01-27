import { useState, useEffect } from "react";
import { Block, BlockTitle, ListInput, List, Preloader } from "framework7-react";
import { useTracker } from "../hooks/useTracker";
import { useLog } from "../hooks/useLog";
import BaseForm from "./base-form";
import type { Tracker, Log } from "~/lib/tracker/types";

interface LogFormProps {
  logId?: string | null;
  onSuccess?: (log: Log) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export default function LogForm({
  logId,
  onSuccess,
  onError,
  onCancel,
}: LogFormProps) {
  const { loading: trackerLoading, getTrackers } = useTracker();
  const { loading, error, createLog, updateLog, getLog } = useLog();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [selectedTrackerId, setSelectedTrackerId] = useState('');
  const [value, setValue] = useState('0');
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [metadata, setMetadata] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load available trackers
    getTrackers().then(setTrackers).catch(() => {
      // Handle error silently
    });
  }, [getTrackers]);

  useEffect(() => {
    if (logId) {
      getLog(logId).then(fetchedLog => {
        if (fetchedLog) {
          setSelectedTrackerId(fetchedLog.trackerId);
          setValue(fetchedLog.value.toString());
          setTimestamp(new Date(fetchedLog.timestamp).toISOString().slice(0, 16));
          setMetadata(fetchedLog.metadata ? JSON.stringify(fetchedLog.metadata) : '');
        }
      }).catch(() => {
        // Handle error silently
      });
    } else {
      setSelectedTrackerId('');
      setValue('0');
      setTimestamp(new Date().toISOString().slice(0, 16));
      setMetadata('');
    }
  }, [logId, getLog]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleSubmit = async () => {
    if (!selectedTrackerId || !value.trim()) return;

    try {
      setIsSubmitting(true);
      
      let result: Log;
      const logData = {
        trackerId: selectedTrackerId,
        value: parseFloat(value) || 0,
        timestamp: new Date(timestamp).getTime(),
        metadata: metadata.trim() ? JSON.parse(metadata) : undefined
      };
      
      if (logId) {
        result = await updateLog(logId, logData);
      } else {
        result = await createLog(logData);
      }

      // Reset form
      setSelectedTrackerId('');
      setValue('0');
      setTimestamp(new Date().toISOString().slice(0, 16));
      setMetadata('');
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      if (onError) {
        onError(err instanceof Error ? err.message : 'Failed to save log');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedTrackerId('');
    setValue('0');
    setTimestamp(new Date().toISOString().slice(0, 16));
    setMetadata('');
    if (onCancel) {
      onCancel();
    }
  };

  const selectedTracker = trackers.find(t => t.id === selectedTrackerId);

  return (
    <BaseForm
      title={logId ? "Edit Log" : "New Log"}
      onSuccess={handleSubmit}
      onError={onError}
      onCancel={handleCancel}
      isSubmitting={isSubmitting}
    >
      <Block>
        <BlockTitle color="primary">
          {logId ? "Edit Log" : "New Log"}
        </BlockTitle>
        {(loading || trackerLoading) && (
          <div className="text-center">
            <Preloader />
          </div>
        )}
        <List strong dividers>
        <ListInput
          outline
          type="select"
          value={selectedTrackerId}
          onChange={(e: any) => setSelectedTrackerId(e.target.value)}
          readonly={isSubmitting}
          label="Tracker"
        >
          <option value="">Select a tracker</option>
          {trackers.map(tracker => (
            <option key={tracker.id} value={tracker.id}>
              {tracker.name} ({tracker.unit})
            </option>
          ))}
        </ListInput>

        {selectedTracker && (
          <div className="padding-horizontal margin-bottom">
            <small className="text-color-gray">
              Tracker: {selectedTracker.name} ({selectedTracker.unit})
            </small>
          </div>
        )}

        <ListInput 
          outline 
          type="number" 
          value={value} 
          placeholder="0" 
          onChange={(e: any) => setValue(e.target.value)} 
          readonly={isSubmitting}
          label="Value"
          info={selectedTracker ? `Value in ${selectedTracker.unit}` : ''}
        />

        <ListInput
          outline
          type="datetime-local"
          value={timestamp}
          onChange={(e: any) => setTimestamp(e.target.value)}
          readonly={isSubmitting}
          label="Timestamp"
        />

        <ListInput
          outline
          type="textarea"
          value={metadata}
          placeholder='{"key": "value"}'
          onChange={(e: any) => setMetadata(e.target.value)}
          readonly={isSubmitting}
          label="Metadata (JSON)"
          info="Optional JSON metadata"
        />

        </List>
      </Block>
    </BaseForm>
  );
}
