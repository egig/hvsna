import { useState, useEffect } from "react";
import { Block, BlockTitle, ListInput, List, ListButton, Preloader } from "framework7-react";
import { useTracker } from "../hooks/useTracker";
import { useTarget } from "../hooks/useTarget";
import type { Tracker, Target as TargetType, TargetType as TargetTypeEnum, TargetPeriod } from "~/lib/tracker/types";

interface TargetFormProps {
  targetId?: string | null;
  onSuccess?: (target: TargetType) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export default function TargetForm({
  targetId,
  onSuccess,
  onError,
  onCancel,
}: TargetFormProps) {
  const { loading: trackerLoading, getTrackers } = useTracker();
  const { loading, error, createTarget, updateTarget, getTarget } = useTarget();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [selectedTrackerId, setSelectedTrackerId] = useState('');
  const [type, setType] = useState<TargetTypeEnum>('static');
  const [value, setValue] = useState('0');
  const [valueMax, setValueMax] = useState('');
  const [period, setPeriod] = useState<TargetPeriod>('monthly');
  const [soft, setSoft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load available trackers
    getTrackers().then(setTrackers).catch(() => {
      // Handle error silently
    });
  }, [getTrackers]);

  useEffect(() => {
    if (targetId) {
      getTarget(targetId).then(fetchedTarget => {
        if (fetchedTarget) {
          setSelectedTrackerId(fetchedTarget.trackerId);
          setType(fetchedTarget.type);
          setValue(fetchedTarget.value.toString());
          setValueMax(fetchedTarget.valueMax?.toString() || '');
          setPeriod(fetchedTarget.period || 'monthly');
          setSoft(fetchedTarget.soft);
        }
      }).catch(() => {
        // Handle error silently
      });
    } else {
      setSelectedTrackerId('');
      setType('static');
      setValue('0');
      setValueMax('');
      setPeriod('monthly');
      setSoft(false);
    }
  }, [targetId, getTarget]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleSubmit = async () => {
    if (!selectedTrackerId || !value.trim()) return;

    try {
      setIsSubmitting(true);
      
      let result: TargetType;
      const targetData = {
        trackerId: selectedTrackerId,
        type,
        value: parseFloat(value) || 0,
        valueMax: type === 'range' ? (parseFloat(valueMax) || undefined) : undefined,
        period,
        soft
      };
      
      if (targetId) {
        result = await updateTarget(targetId, targetData);
      } else {
        result = await createTarget(targetData);
      }

      // Reset form
      setSelectedTrackerId('');
      setType('static');
      setValue('0');
      setValueMax('');
      setPeriod('monthly');
      setSoft(false);
      
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
    setSelectedTrackerId('');
    setType('static');
    setValue('0');
    setValueMax('');
    setPeriod('monthly');
    setSoft(false);
    if (onCancel) {
      onCancel();
    }
  };

  const selectedTracker = trackers.find(t => t.id === selectedTrackerId);

  return (
    <Block>
      <BlockTitle color="primary">{targetId ? "Edit Target" : "New Target"}</BlockTitle>
      {(loading || trackerLoading) && <div className="text-center"><Preloader /></div>}
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
              Current baseline: {selectedTracker.baseline} {selectedTracker.unit}
            </small>
          </div>
        )}

        <ListInput
          outline
          type="select"
          value={type}
          onChange={(e: any) => setType(e.target.value)}
          readonly={isSubmitting}
          label="Type"
        >
          <option value="static">Static</option>
          <option value="range">Range</option>
        </ListInput>

        <ListInput 
          outline 
          type="number" 
          value={value} 
          placeholder="0" 
          onChange={(e: any) => setValue(e.target.value)} 
          readonly={isSubmitting}
          label={type === 'range' ? 'Target' : 'Value'}
          info={selectedTracker ? `Value in ${selectedTracker.unit}` : ''}
        />

        {type === 'range' && (
          <ListInput 
            outline 
            type="number" 
            value={valueMax} 
            placeholder="Maximum value" 
            onChange={(e: any) => setValueMax(e.target.value)} 
            readonly={isSubmitting}
            label="Maximum"
            info={selectedTracker ? `Maximum in ${selectedTracker.unit}` : ''}
          />
        )}

        <ListInput
          outline
          type="select"
          value={period}
          onChange={(e: any) => setPeriod(e.target.value)}
          readonly={isSubmitting}
          label="Period"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="total">Total</option>
        </ListInput>

        <ListInput
          outline
          type="checkbox"
          value={soft ? 'yes' : 'no'}
          onChange={(e: any) => setSoft(e.target.checked)}
          readonly={isSubmitting}
          label="Soft limit"
          info="Allow going over/under without strict enforcement"
        />

        <div className="display-flex justify-content-space-between padding-horizontal">
          <ListButton onClick={handleCancel} className={isSubmitting ? 'disabled' : ''}>CANCEL</ListButton>
          <ListButton color="primary" onClick={handleSubmit} className={(isSubmitting || !selectedTrackerId || !value.trim()) ? 'disabled' : ''}>
            {isSubmitting ? (
              <><Preloader size={16} /> {targetId ? "UPDATING..." : "CREATING..."}</>
            ) : (
              targetId ? "UPDATE" : "CREATE"
            )}
          </ListButton>
        </div>
      </List>
    </Block>
  );
}
