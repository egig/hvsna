import { useState, useEffect } from "react";
import { Block, BlockTitle, ListInput, List, ListButton, Preloader } from "framework7-react";
import { useMetric } from "../hooks/useMetric";
import type { Metric, MetricReducer, MetricDirection } from "~/lib/tracker/types";

interface MetricFormProps {
  metricId?: string | null;
  onSuccess?: (metric: Metric) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export default function MetricForm({
  metricId,
  onSuccess,
  onError,
  onCancel,
}: MetricFormProps) {
  const { loading, error, createMetric, updateMetric, getMetric } = useMetric();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [reducer, setReducer] = useState<MetricReducer>('sum');
  const [direction, setDirection] = useState<MetricDirection>('increase');
  const [baseline, setBaseline] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (metricId) {
      getMetric(metricId).then(fetchedMetric => {
        if (fetchedMetric) {
          setName(fetchedMetric.name);
          setUnit(fetchedMetric.unit);
          setReducer(fetchedMetric.reducer);
          setDirection(fetchedMetric.direction);
          setBaseline(fetchedMetric.baseline.toString());
        }
      }).catch(() => {
        // Handle error silently or show error
      });
    } else {
      setName('');
      setUnit('');
      setReducer('sum');
      setDirection('increase');
      setBaseline('0');
    }
  }, [metricId, getMetric]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleSubmit = async () => {
    if (!name.trim() || !unit.trim()) return;

    try {
      setIsSubmitting(true);
      
      let result: Metric;
      if (metricId) {
        result = await updateMetric(metricId, {
          name: name.trim(),
          unit: unit.trim(),
          reducer,
          direction,
          baseline: parseFloat(baseline) || 0
        });
      } else {
        result = await createMetric({
          name: name.trim(),
          unit: unit.trim(),
          reducer,
          direction,
          baseline: parseFloat(baseline) || 0
        });
      }

      // Reset form
      setName('');
      setUnit('');
      setReducer('sum');
      setDirection('increase');
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
    setReducer('sum');
    setDirection('increase');
    setBaseline('0');
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Block>
      <BlockTitle color="primary">{metricId ? "Edit Metric" : "New Metric"}</BlockTitle>
      {loading && <div className="text-center"><Preloader /></div>}
      <List strong dividers>
        <ListInput 
          outline 
          type="text" 
          value={name} 
          placeholder="Enter metric name" 
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
          type="select"
          value={reducer}
          onChange={(e: any) => setReducer(e.target.value)}
          readonly={isSubmitting}
          label="Reducer"
        >
          <option value="sum">Sum</option>
          <option value="count">Count</option>
          <option value="last">Last</option>
          <option value="avg">Average</option>
          <option value="min">Minimum</option>
          <option value="max">Maximum</option>
        </ListInput>
        <ListInput
          outline
          type="select"
          value={direction}
          onChange={(e: any) => setDirection(e.target.value)}
          readonly={isSubmitting}
          label="Direction"
        >
          <option value="increase">Increase (good when up)</option>
          <option value="decrease">Decrease (good when down)</option>
          <option value="neutral">Neutral</option>
        </ListInput>
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
              <><Preloader size={16} /> {metricId ? "UPDATING..." : "CREATING..."}</>
            ) : (
              metricId ? "UPDATE" : "CREATE"
            )}
          </ListButton>
        </div>
      </List>
    </Block>
  );
}
