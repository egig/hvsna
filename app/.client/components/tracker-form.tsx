import { useState, useEffect } from "react";
import { Block, BlockTitle, ListInput, List, ListButton, Preloader } from "framework7-react";
import { useTracker } from "../hooks/useTracker";
import type { Tracker } from "~/lib/tracker/types";

interface TrackerFormProps {
  trackerId?: string | null;
  onSuccess?: (tracker: Tracker) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export default function TrackerForm({
  trackerId,
  onSuccess,
  onError,
  onCancel,
}: TrackerFormProps) {
  const { loading, error, createTracker, updateTracker, getTracker } = useTracker();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [baseline, setBaseline] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (trackerId) {
      getTracker(trackerId).then(fetchedTracker => {
        if (fetchedTracker) {
          setName(fetchedTracker.name);
          setUnit(fetchedTracker.unit);
          setBaseline(fetchedTracker.baseline.toString());
        }
      }).catch(() => {
        // Handle error silently or show error
      });
    } else {
      setName('');
      setUnit('');
      setBaseline('0');
    }
  }, [trackerId, getTracker]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleSubmit = async () => {
    if (!name.trim() || !unit.trim()) return;

    try {
      setIsSubmitting(true);
      
      let result: Tracker;
      if (trackerId) {
        result = await updateTracker(trackerId, {
          name: name.trim(),
          unit: unit.trim(),
          baseline: parseFloat(baseline) || 0
        });
      } else {
        result = await createTracker({
          name: name.trim(),
          unit: unit.trim(),
          baseline: parseFloat(baseline) || 0
        });
      }

      // Reset form
      setName('');
      setUnit('');
      setBaseline('0');
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      // Error is handled by the hook and passed through onError
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setName('');
    setUnit('');
    setBaseline('0');
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Block>
      <BlockTitle color="primary">{trackerId ? "Edit Tracker" : "New Tracker"}</BlockTitle>
      {loading && <div className="text-center"><Preloader /></div>}
      <List strong dividers>
        <ListInput 
          outline 
          type="text" 
          value={name} 
          placeholder="Enter tracker name" 
          onChange={(e: any) => setName(e.target.value)} 
          readonly={isSubmitting}
          label="Name"
        />
        <ListInput 
          outline 
          type="text" 
          value={unit} 
          placeholder="e.g., kg, hours, IDR, count" 
          onChange={(e: any) => setUnit(e.target.value)} 
          readonly={isSubmitting}
          label="Unit"
        />
        <ListInput 
          outline 
          type="number" 
          value={baseline} 
          placeholder="0" 
          onChange={(e: any) => setBaseline(e.target.value)} 
          readonly={isSubmitting}
          label="Baseline"
        />
        <div className="display-flex justify-content-space-between padding-horizontal">
          <ListButton onClick={handleCancel} className={isSubmitting ? 'disabled' : ''}>CANCEL</ListButton>
          <ListButton color="primary" onClick={handleSubmit} className={(isSubmitting || !name.trim() || !unit.trim()) ? 'disabled' : ''}>
            {isSubmitting ? (
              <><Preloader size={16} /> {trackerId ? "UPDATING..." : "CREATING..."}</>
            ) : (
              trackerId ? "UPDATE" : "CREATE"
            )}
          </ListButton>
        </div>
      </List>
    </Block>
  );
}
