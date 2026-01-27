import { useState, useEffect } from "react";
import { Block, BlockTitle, ListInput, List, ListButton, Preloader } from "framework7-react";
import { useMetric } from "../hooks/useMetric";
import { useLog } from "../hooks/useLog";
import type { Metric, Log } from "~/lib/tracker/types";

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
  const { loading: metricLoading, getMetrics } = useMetric();
  const { loading, error, createLog, updateLog, getLog } = useLog();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [selectedMetricId, setSelectedMetricId] = useState('');
  const [value, setValue] = useState('0');
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [metadata, setMetadata] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load available metrics
    getMetrics().then(setMetrics).catch(() => {
      // Handle error silently
    });
  }, [getMetrics]);

  useEffect(() => {
    if (logId) {
      getLog(logId).then(fetchedLog => {
        if (fetchedLog) {
          setSelectedMetricId(fetchedLog.metricId);
          setValue(fetchedLog.value.toString());
          setTimestamp(new Date(fetchedLog.timestamp).toISOString().slice(0, 16));
          setMetadata(fetchedLog.metadata ? JSON.stringify(fetchedLog.metadata) : '');
        }
      }).catch(() => {
        // Handle error silently
      });
    } else {
      setSelectedMetricId('');
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
    if (!selectedMetricId || !value.trim()) return;

    try {
      setIsSubmitting(true);
      
      let result: Log;
      const logData = {
        metricId: selectedMetricId,
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
      setSelectedMetricId('');
      setValue('0');
      setTimestamp(new Date().toISOString().slice(0, 16));
      setMetadata('');
      
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
    setSelectedMetricId('');
    setValue('0');
    setTimestamp(new Date().toISOString().slice(0, 16));
    setMetadata('');
    if (onCancel) {
      onCancel();
    }
  };

  const selectedMetric = metrics.find(m => m.id === selectedMetricId);

  return (
    <Block>
      <BlockTitle color="primary">{logId ? "Edit Log" : "New Log"}</BlockTitle>
      {(loading || metricLoading) && <div className="text-center"><Preloader /></div>}
      <List strong dividers>
        <ListInput
          outline
          type="select"
          value={selectedMetricId}
          onChange={(e: any) => setSelectedMetricId(e.target.value)}
          readonly={isSubmitting}
          label="Metric"
        >
          <option value="">Select a metric</option>
          {metrics.map(metric => (
            <option key={metric.id} value={metric.id}>
              {metric.name} ({metric.unit})
            </option>
          ))}
        </ListInput>

        {selectedMetric && (
          <div className="padding-horizontal margin-bottom">
            <small className="text-color-gray">
              Current baseline: {selectedMetric.baseline} {selectedMetric.unit}
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
          info={selectedMetric ? `Value in ${selectedMetric.unit}` : ''}
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

        <div className="display-flex justify-content-space-between padding-horizontal">
          <ListButton onClick={handleCancel} className={isSubmitting ? 'disabled' : ''}>CANCEL</ListButton>
          <ListButton color="primary" onClick={handleSubmit} className={(isSubmitting || !selectedMetricId || !value.trim()) ? 'disabled' : ''}>
            {isSubmitting ? (
              <><Preloader size={16} /> {logId ? "UPDATING..." : "CREATING..."}</>
            ) : (
              logId ? "UPDATE" : "CREATE"
            )}
          </ListButton>
        </div>
      </List>
    </Block>
  );
}
