import { useEffect, useState } from "react";
import { Navbar, NavTitle, Page, Block, BlockTitle, Progressbar, List, ListItem, Link, Preloader, f7 } from "framework7-react";
import { useEvaluation } from "../hooks/useEvaluation";
import { useLog } from "../hooks/useLog";
import { useMetric } from "../hooks/useMetric";
import { Target, FileText, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Evaluation, Log, Metric } from "~/lib/tracker/types";

export default function Overview() {
  const { loading: evalLoading, getEvaluations } = useEvaluation();
  const { loading: logLoading, getLogs } = useLog();
  const { loading: metricLoading, getMetrics } = useMetric();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [recentLogs, setRecentLogs] = useState<Log[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [evals, logs, mets] = await Promise.all([
        getEvaluations(),
        getLogs({ limit: 10 }),
        getMetrics()
      ]);
      
      setEvaluations(evals);
      setRecentLogs(logs);
      setMetrics(mets);
    } catch (err) {
      console.error('Failed to load overview data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getMetricById = (metricId: string): Metric | undefined => {
    return metrics.find(m => m.id === metricId);
  };

  const calculateProgress = (evaluation: Evaluation, currentValue: number): number => {
    const metric = getMetricById(evaluation.metricId);
    if (!metric) return 0;

    const target = evaluation.value;
    const max = evaluation.valueMax;

    if (evaluation.type === 'range') {
      if (max !== undefined) {
        // For range, calculate progress within the range
        const range = max - target;
        const progress = ((currentValue - target) / range) * 100;
        return Math.max(0, Math.min(100, progress));
      }
    } else if (evaluation.type === 'target') {
      // For target, calculate progress towards the target
      const progress = (currentValue / target) * 100;
      return Math.max(0, Math.min(100, progress));
    } else if (evaluation.type === 'threshold') {
      // For threshold, show if we're within threshold
      return currentValue <= target ? 100 : 0;
    }

    return 0;
  };

  const getProgressColor = (evaluation: Evaluation, progress: number): string => {
    const metric = getMetricById(evaluation.metricId);
    if (!metric) return 'gray';

    if (evaluation.type === 'threshold') {
      return progress === 100 ? 'green' : 'red';
    }

    if (metric.direction === 'increase') {
      return progress >= 100 ? 'green' : progress >= 75 ? 'blue' : 'orange';
    } else if (metric.direction === 'decrease') {
      return progress <= 100 ? 'green' : progress <= 125 ? 'blue' : 'orange';
    }

    return 'blue';
  };

  const formatProgressText = (evaluation: Evaluation, currentValue: number): string => {
    const metric = getMetricById(evaluation.metricId);
    if (!metric) return '';

    const unit = metric.unit;
    const target = evaluation.value;
    const max = evaluation.valueMax;

    if (evaluation.type === 'range' && max !== undefined) {
      return `${currentValue} ${unit} / ${target}-${max} ${unit}`;
    } else if (evaluation.type === 'target') {
      return `${currentValue} ${unit} / ${target} ${unit}`;
    } else if (evaluation.type === 'threshold') {
      return `${currentValue} ${unit} (max: ${target} ${unit})`;
    }

    return `${currentValue} ${unit} / ${target} ${unit}`;
  };

  const getTrendIcon = (evaluation: Evaluation, currentValue: number) => {
    const metric = getMetricById(evaluation.metricId);
    if (!metric) return <Minus size={16} className="text-gray-500" />;

    const progress = calculateProgress(evaluation, currentValue);
    const color = getProgressColor(evaluation, progress);

    if (metric.direction === 'increase') {
      return progress >= 100 ? <TrendingUp size={16} className={`text-${color}-500`} /> : <TrendingDown size={16} className="text-orange-500" />;
    } else if (metric.direction === 'decrease') {
      return progress <= 100 ? <TrendingUp size={16} className={`text-${color}-500`} /> : <TrendingDown size={16} className="text-orange-500" />;
    }

    return <Minus size={16} className="text-gray-500" />;
  };

  const getEvaluationTypeLabel = (type: string) => {
    switch (type) {
      case 'target': return 'Target';
      case 'range': return 'Range';
      case 'threshold': return 'Threshold';
      default: return type;
    }
  };

  const formatLogTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getMetricName = (metricId: string) => {
    const metric = metrics.find(m => m.id === metricId);
    return metric ? metric.name : 'Unknown metric';
  };

  const formatLogValue = (log: Log) => {
    const metric = getMetricById(log.metricId);
    const unit = metric ? metric.unit : '';
    return `${log.value} ${unit}`;
  };

  // Mock current values for demonstration - in real app, this would come from aggregated data
  const mockCurrentValues: Record<string, number> = {};
  evaluations.forEach(evaluationData => {
    // Simple mock: use some percentage of target based on time of month
    const metric = getMetricById(evaluationData.metricId);
    if (metric) {
      const daysInMonth = 30;
      const currentDay = new Date().getDate();
      const progress = currentDay / daysInMonth;
      mockCurrentValues[evaluationData.id] = evaluationData.value * progress * (0.8 + Math.random() * 0.4); // 80-120% of expected progress
    }
  });

  return (
    <Page>
      <Navbar>
        <NavTitle>Overview</NavTitle>
      </Navbar>

      {loading && (
        <Block className="text-center">
          <Preloader />
          <div>Loading overview...</div>
        </Block>
      )}

      {error && (
        <Block className="text-center">
          <div style={{ color: 'red' }}>Error: {error}</div>
          <Link onClick={loadData}>Retry</Link>
        </Block>
      )}

      {!loading && !error && (
        <>
          {/* Quick Evaluation Overview */}
          <Block>
            <BlockTitle medium>Quick Evaluation Overview</BlockTitle>
            {evaluations.length === 0 ? (
              <Block className="text-center">
                <Target size={48} className="text-gray-400" />
                <p>No evaluations yet</p>
                <Link href="/evaluations/">Create your first evaluation</Link>
              </Block>
            ) : (
              <List mediaList>
                {evaluations.map((evaluation) => {
                  const currentValue = mockCurrentValues[evaluation.id] || 0;
                  const progress = calculateProgress(evaluation, currentValue);
                  const color = getProgressColor(evaluation, progress);
                  const metric = getMetricById(evaluation.metricId);

                  return (
                    <ListItem key={evaluation.id} title={metric?.name || 'Unknown Metric'}>
                      <div slot="media">
                        <Target size={24} className="text-blue-500" />
                      </div>
                      <div slot="subtitle">
                        {getEvaluationTypeLabel(evaluation.type)} • {evaluation.period || 'No period'}
                      </div>
                      <div slot="text">
                        <div className="margin-bottom-half">
                          {formatProgressText(evaluation, currentValue)}
                        </div>
                        <Progressbar
                          color={color}
                          progress={progress}
                          style={{ height: '8px' }}
                        />
                      </div>
                      <div slot="after">
                        {getTrendIcon(evaluation, currentValue)}
                      </div>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Block>

          {/* Recent Journal Logs */}
          <Block>
            <BlockTitle medium>Recent Journal Logs</BlockTitle>
            {recentLogs.length === 0 ? (
              <Block className="text-center">
                <FileText size={48} className="text-gray-400" />
                <p>No journal entries yet</p>
                <Link href="/journal/">Create your first journal entry</Link>
              </Block>
            ) : (
              <List mediaList>
                {recentLogs.map((log) => (
                  <ListItem key={log.id} title={getMetricName(log.metricId)}>
                    <div slot="media">
                      <FileText size={24} className="text-green-500" />
                    </div>
                    <div slot="subtitle">
                      {formatLogTimestamp(log.timestamp)}
                    </div>
                    <div slot="text">
                      {formatLogValue(log)}
                    </div>
                  </ListItem>
                ))}
              </List>
            )}
          </Block>
        </>
      )}
    </Page>
  );
}
