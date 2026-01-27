import { useState, useEffect } from "react";
import { Block, BlockTitle, ListInput, List, ListButton, Preloader } from "framework7-react";
import { useMetric } from "../hooks/useMetric";
import { useEvaluation } from "../hooks/useEvaluation";
import type { Metric, Evaluation, EvaluationType, EvaluationPeriod } from "~/lib/tracker/types";

interface EvaluationFormProps {
  evaluationId?: string | null;
  onSuccess?: (evaluation: Evaluation) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export default function EvaluationForm({
  evaluationId,
  onSuccess,
  onError,
  onCancel,
}: EvaluationFormProps) {
  const { loading: metricLoading, getMetrics } = useMetric();
  const { loading, error, createEvaluation, updateEvaluation, getEvaluation } = useEvaluation();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [selectedMetricId, setSelectedMetricId] = useState('');
  const [type, setType] = useState<EvaluationType>('target');
  const [value, setValue] = useState('0');
  const [valueMax, setValueMax] = useState('');
  const [period, setPeriod] = useState<EvaluationPeriod>('monthly');
  const [soft, setSoft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load available metrics
    getMetrics().then(setMetrics).catch(() => {
      // Handle error silently
    });
  }, [getMetrics]);

  useEffect(() => {
    if (evaluationId) {
      getEvaluation(evaluationId).then(fetchedEvaluation => {
        if (fetchedEvaluation) {
          setSelectedMetricId(fetchedEvaluation.metricId);
          setType(fetchedEvaluation.type);
          setValue(fetchedEvaluation.value.toString());
          setValueMax(fetchedEvaluation.valueMax?.toString() || '');
          setPeriod(fetchedEvaluation.period || 'monthly');
          setSoft(fetchedEvaluation.soft);
        }
      }).catch(() => {
        // Handle error silently
      });
    } else {
      setSelectedMetricId('');
      setType('target');
      setValue('0');
      setValueMax('');
      setPeriod('monthly');
      setSoft(false);
    }
  }, [evaluationId, getEvaluation]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleSubmit = async () => {
    if (!selectedMetricId || !value.trim()) return;

    try {
      setIsSubmitting(true);
      
      let result: Evaluation;
      const evaluationData = {
        metricId: selectedMetricId,
        type,
        value: parseFloat(value) || 0,
        valueMax: type === 'range' ? (parseFloat(valueMax) || undefined) : undefined,
        period,
        soft
      };
      
      if (evaluationId) {
        result = await updateEvaluation(evaluationId, evaluationData);
      } else {
        result = await createEvaluation(evaluationData);
      }

      // Reset form
      setSelectedMetricId('');
      setType('target');
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
    setSelectedMetricId('');
    setType('target');
    setValue('0');
    setValueMax('');
    setPeriod('monthly');
    setSoft(false);
    if (onCancel) {
      onCancel();
    }
  };

  const selectedMetric = metrics.find(m => m.id === selectedMetricId);

  return (
    <Block>
      <BlockTitle color="primary">{evaluationId ? "Edit Budget / Target" : "New Budget / Target"}</BlockTitle>
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
          type="select"
          value={type}
          onChange={(e: any) => setType(e.target.value)}
          readonly={isSubmitting}
          label="Type"
        >
          <option value="target">Target</option>
          <option value="range">Range</option>
          <option value="threshold">Threshold</option>
        </ListInput>

        <ListInput 
          outline 
          type="number" 
          value={value} 
          placeholder="0" 
          onChange={(e: any) => setValue(e.target.value)} 
          readonly={isSubmitting}
          label={type === 'threshold' ? 'Threshold' : 'Target'}
          info={selectedMetric ? `Value in ${selectedMetric.unit}` : ''}
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
            info={selectedMetric ? `Maximum in ${selectedMetric.unit}` : ''}
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
          <ListButton color="primary" onClick={handleSubmit} className={(isSubmitting || !selectedMetricId || !value.trim()) ? 'disabled' : ''}>
            {isSubmitting ? (
              <><Preloader size={16} /> {evaluationId ? "UPDATING..." : "CREATING..."}</>
            ) : (
              evaluationId ? "UPDATE" : "CREATE"
            )}
          </ListButton>
        </div>
      </List>
    </Block>
  );
}
