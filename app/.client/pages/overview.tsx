import { useEffect, useState } from "react";
import { Navbar, NavTitle, Page, Block, BlockTitle, Progressbar, List, ListItem, Link, Preloader, f7 } from "framework7-react";
import { useTarget } from "../hooks/useTarget";
import { useLog } from "../hooks/useLog";
import { useTracker } from "../hooks/useTracker";
import { Target, FileText, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Target as TargetType, Log, Tracker } from "~/lib/tracker/types";
import type { Target as TargetHookType } from "../hooks/useTarget";

export default function Overview() {
  const { loading: targetLoading, getTargets } = useTarget();
  const { loading: logLoading, getLogs } = useLog();
  const { loading: trackerLoading, getTrackers } = useTracker();
  const [targets, setTargets] = useState<TargetHookType[]>([]);
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
      
      const [tgts, logs, trks] = await Promise.all([
        getTargets(),
        getLogs({ from: startOfYear, limit: 2000 }), // Get comprehensive logs for all periods
        getTrackers()
      ]);
      
      setTargets(tgts);
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

  const calculateProgress = (target: TargetType, currentValue: number): number => {
    const tracker = getTrackerById(target.trackerId);
    if (!tracker) return 0;

    const targetValue = target.value;
    const max = target.valueMax;

    if (target.type === 'range') {
      if (max !== undefined) {
        // For range, calculate progress within the range
        const range = max - targetValue;
        const progress = ((currentValue - targetValue) / range) * 100;
        return Math.max(0, Math.min(100, progress));
      }
    } else if (target.type === 'static') {
      // For static, calculate progress towards the target
      const progress = (currentValue / targetValue) * 100;
      return Math.max(0, Math.min(100, progress));
    }

    return 0;
  };

  const getProgressColor = (target: TargetHookType, progress: number): string => {
    if (target.direction === 'increase') {
      return progress >= 100 ? 'green' : progress >= 75 ? 'blue' : 'orange';
    } else if (target.direction === 'decrease') {
      return progress <= 100 ? 'green' : progress <= 125 ? 'blue' : 'orange';
    }

    return 'blue';
  };

  const formatProgressText = (target: TargetType, currentValue: number): string => {
    const tracker = getTrackerById(target.trackerId);
    if (!tracker) return '';

    const unit = tracker.unit;
    const targetValue = target.value;
    const max = target.valueMax;

    if (target.type === 'range' && max !== undefined) {
      return `${currentValue} ${unit} / ${targetValue}-${max} ${unit}`;
    }

    return `${currentValue} ${unit} / ${targetValue} ${unit}`;
  };

  const getTrendIcon = (target: TargetHookType, currentValue: number) => {
    const progress = calculateProgress(target, currentValue);
    const color = getProgressColor(target, progress);

    if (target.direction === 'increase') {
      return progress >= 100 ? <TrendingUp size={16} className={`text-${color}-500`} /> : <TrendingDown size={16} className="text-orange-500" />;
    } else if (target.direction === 'decrease') {
      return progress <= 100 ? <TrendingUp size={16} className={`text-${color}-500`} /> : <TrendingDown size={16} className="text-orange-500" />;
    }

    return <Minus size={16} className="text-gray-500" />;
  };

  const getTargetTypeLabel = (type: string) => {
    switch (type) {
      case 'static': return 'Static';
      case 'range': return 'Range';
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

  // Calculate actual current values from log data based on target period
  const getCurrentValueFromLogs = (target: TargetType): number => {
    const now = Date.now();
    let fromDate: number;
    
    // Determine the date range based on target period
    switch (target.period) {
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
    
    const trackerLogs = recentLogs.filter(log => 
      log.trackerId === target.trackerId && log.timestamp >= fromDate
    );
    
    if (trackerLogs.length === 0) return 0;
    
    // For different target types, use the latest value as current progress
    const latestLog = trackerLogs.reduce((latest, log) => 
      log.timestamp > latest.timestamp ? log : latest
    );
    return latestLog.value;
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
          {/* Quick Target Overview */}
          <Block>
            <BlockTitle medium>Quick Target Overview</BlockTitle>
            {targets.length === 0 ? (
              <Block className="text-center">
                <Target size={48} className="text-gray-400" />
                <p>No targets yet</p>
                <Link href="/targets/">Create your first target</Link>
              </Block>
            ) : (
              <List mediaList>
                {targets.map((target) => {
                  const currentValue = getCurrentValueFromLogs(target);
                  const progress = calculateProgress(target, currentValue);
                  const color = getProgressColor(target, progress);
                  const tracker = getTrackerById(target.trackerId);

                  return (
                    <ListItem key={target.id} title={tracker?.name || 'Unknown Tracker'}>
                      <div slot="media">
                        <Target size={24} className="text-blue-500" />
                      </div>
                      <div slot="subtitle">
                        {getTargetTypeLabel(target.type)} • {target.period || 'No period'}
                      </div>
                      <div slot="text">
                        <div className="margin-bottom-half">
                          {formatProgressText(target, currentValue)}
                        </div>
                        <Progressbar
                          color={color}
                          progress={progress}
                          style={{ height: '8px' }}
                        />
                      </div>
                      <div slot="after">
                        {getTrendIcon(target, currentValue)}
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
