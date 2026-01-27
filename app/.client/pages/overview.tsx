import { useEffect, useState } from "react";
import { Navbar, NavTitle, Page, Block, BlockTitle, Progressbar, List, ListItem, Link, Preloader, f7 } from "framework7-react";
import { useEvaluation } from "../hooks/useEvaluation";
import { useLog } from "../hooks/useLog";
import { useTracker } from "../hooks/useTracker";
import { Target, FileText, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Evaluation, Log, Tracker } from "~/lib/tracker/types";

export default function Overview() {
  const { loading: evalLoading, getEvaluations } = useEvaluation();
  const { loading: logLoading, getLogs } = useLog();
  const { loading: trackerLoading, getTrackers } = useTracker();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [recentLogs, setRecentLogs] = useState<Log[]>([]);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get logs from the beginning of the current year to cover all evaluation periods
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
      
      const [evals, logs, trks] = await Promise.all([
        getEvaluations(),
        getLogs({ from: startOfYear, limit: 2000 }), // Get comprehensive logs for all periods
        getTrackers()
      ]);
      
      setEvaluations(evals);
      setRecentLogs(logs);
      setTrackers(trks);
    } catch (err) {
      console.error('Failed to load overview data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getTrackerById = (trackerId: string): Tracker | undefined => {
    return trackers.find(t => t.id === trackerId);
  };

  const calculateProgress = (evaluation: Evaluation, currentValue: number): number => {
    const tracker = getTrackerById(evaluation.trackerId);
    if (!tracker) return 0;

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
    const tracker = getTrackerById(evaluation.trackerId);
    if (!tracker) return 'gray';

    if (evaluation.type === 'threshold') {
      return progress === 100 ? 'green' : 'red';
    }

    if (tracker.direction === 'increase') {
      return progress >= 100 ? 'green' : progress >= 75 ? 'blue' : 'orange';
    } else if (tracker.direction === 'decrease') {
      return progress <= 100 ? 'green' : progress <= 125 ? 'blue' : 'orange';
    }

    return 'blue';
  };

  const formatProgressText = (evaluation: Evaluation, currentValue: number): string => {
    const tracker = getTrackerById(evaluation.trackerId);
    if (!tracker) return '';

    const unit = tracker.unit;
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
    const tracker = getTrackerById(evaluation.trackerId);
    if (!tracker) return <Minus size={16} className="text-gray-500" />;

    const progress = calculateProgress(evaluation, currentValue);
    const color = getProgressColor(evaluation, progress);

    if (tracker.direction === 'increase') {
      return progress >= 100 ? <TrendingUp size={16} className={`text-${color}-500`} /> : <TrendingDown size={16} className="text-orange-500" />;
    } else if (tracker.direction === 'decrease') {
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

  const getTrackerName = (trackerId: string) => {
    const tracker = trackers.find(t => t.id === trackerId);
    return tracker ? tracker.name : 'Unknown tracker';
  };

  const formatLogValue = (log: Log) => {
    const tracker = getTrackerById(log.trackerId);
    const unit = tracker ? tracker.unit : '';
    return `${log.value} ${unit}`;
  };

  // Calculate actual current values from log data based on evaluation period
  const getCurrentValueFromLogs = (evaluation: Evaluation): number => {
    const now = Date.now();
    let fromDate: number;
    
    // Determine the date range based on evaluation period
    switch (evaluation.period) {
      case 'daily':
        fromDate = now - (24 * 60 * 60 * 1000); // Last 24 hours
        break;
      case 'weekly':
        fromDate = now - (7 * 24 * 60 * 60 * 1000); // Last 7 days
        break;
      case 'monthly':
        fromDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime(); // Start of current month
        break;
      case 'yearly':
        fromDate = new Date(new Date().getFullYear(), 0, 1).getTime(); // Start of current year
        break;
      default:
        fromDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime(); // Default to monthly
    }
    
    const metricLogs = recentLogs.filter(log => 
      log.metricId === evaluation.metricId && log.timestamp >= fromDate
    );
    
    if (metricLogs.length === 0) return 0;
    
    // For different evaluation types, we might want different aggregations
    if (evaluation.type === 'threshold') {
      // For threshold, use the latest value
      const latestLog = metricLogs.reduce((latest, log) => 
        log.timestamp > latest.timestamp ? log : latest
      );
      return latestLog.value;
    } else {
      // For target and range, use the latest value as current progress
      const latestLog = metricLogs.reduce((latest, log) => 
        log.timestamp > latest.timestamp ? log : latest
      );
      return latestLog.value;
    }
  };

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
                  const currentValue = getCurrentValueFromLogs(evaluation);
                  const progress = calculateProgress(evaluation, currentValue);
                  const color = getProgressColor(evaluation, progress);
                  const tracker = getTrackerById(evaluation.trackerId);

                  return (
                    <ListItem key={evaluation.id} title={tracker?.name || 'Unknown Tracker'}>
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
                  <ListItem key={log.id} title={getTrackerName(log.trackerId)}>
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
