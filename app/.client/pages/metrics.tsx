import { useEffect, useRef, useState } from "react";
import { Icon, List, ListItem, Navbar, NavTitle, Page, Preloader, Block, Button, Popup, NavRight, Link, f7 } from "framework7-react";
import { useMetric } from "../hooks/useMetric";
import { TrendingUp, TrendingDown, Minus, Plus, Edit, Trash2, BarChart, BarChart2 } from "lucide-react";
import type { Metric } from "~/lib/tracker/types";
import MetricForm from "../components/metric-form";

export default function Metrics() {
  const { loading, error, deleteMetric, getMetrics, refreshMetrics } = useMetric();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [popupOpened, setPopupOpened] = useState(false);
  const [editingMetricId, setEditingMetricId] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const metricsData = await getMetrics();
      setMetrics(metricsData);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
  };

  const resetForm = () => {
    setEditingMetricId(null);
  };

  const openAddPopup = () => {
    setEditingMetricId(null);
    setTimeout(() => setPopupOpened(true), 0);
  };

  const openEditPopup = (metric: Metric) => {
    setEditingMetricId(metric.id);
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

  const handleMetricSuccess = () => {
    setPopupOpened(false);
    loadMetrics();
  };

  const handleMetricError = (errorMessage: string) => {
    f7.dialog.alert(errorMessage);
  };

  const handleMetricCancel = () => {
    setPopupOpened(false);
  };

  const handleDeleteMetric = async (metric: Metric) => {
    f7.dialog.confirm(
      `Are you sure you want to delete "${metric.name}"? This action cannot be undone.`,
      'Delete Metric',
      async () => {
        try {
          await deleteMetric(metric.id);
          loadMetrics();
        } catch (err) {
          console.error('Failed to delete metric:', err);
          f7.dialog.alert('Failed to delete metric. Please try again.');
        }
      }
    );
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'increase':
        return <TrendingUp size={24} className="text-green-500" />;
      case 'decrease':
        return <TrendingDown size={24} className="text-red-500" />;
      default:
        return <Minus size={24} className="text-gray-500" />;
    }
  };

  const getReducerLabel = (reducer: string) => {
    switch (reducer) {
      case 'sum':
        return 'Sum';
      case 'count':
        return 'Count';
      case 'last':
        return 'Last';
      case 'avg':
        return 'Average';
      case 'min':
        return 'Minimum';
      case 'max':
        return 'Maximum';
      default:
        return reducer;
    }
  };

  const getDirectionLabel = (direction: string) => {
    switch (direction) {
      case 'increase':
        return 'Increase (good when up)';
      case 'decrease':
        return 'Decrease (good when down)';
      case 'neutral':
        return 'Neutral';
      default:
        return direction;
    }
  };

  return (
    <Page>
      <Navbar backLink>
        <NavTitle>Metrics</NavTitle>
        <NavRight>
          <Link onClick={openAddPopup}>
            <Plus />
          </Link>
        </NavRight>
      </Navbar>
      
      {loading && (
        <Block className="text-center">
          <Preloader />
          <div>Loading metrics...</div>
        </Block>
      )}

      {error && (
        <Block className="text-center">
          <div style={{ color: 'red' }}>Error: {error}</div>
          <Button fill onClick={loadMetrics}>
            <Icon ios="f7:arrow_clockwise" md="material:refresh" />
            Retry
          </Button>
        </Block>
      )}

      {!loading && !error && metrics.length === 0 && (
        <Block className="text-center">
          <BarChart2 size={48} />
          <p>No metrics yet</p>
          <p>Create your first metric to start tracking!</p>
          <Button fill onClick={openAddPopup}>
            <Plus size={16} />
            Create Metric
          </Button>
        </Block>
      )}

      {!loading && !error && metrics.length > 0 && (
        <List mediaList>
          {metrics.map((metric) => (
            <ListItem
              key={metric.id}
              title={metric.name}
              subtitle={`${metric.baseline} ${metric.unit}`}
              swipeout
            >
              <div slot="root-end" className="swipeout-actions-right">
                <a 
                  href="#" 
                  className="swipeout-delete"
                  onClick={() => handleDeleteMetric(metric)}
                >
                  Delete
                </a>
              </div>
              <div slot="media">
                {getDirectionIcon(metric.direction)}
              </div>
              <div slot="after">
                <div className="text-xs text-gray-600">
                  {getReducerLabel(metric.reducer)}
                </div>
              </div>
              <div slot="root" onClick={() => openEditPopup(metric)} style={{ cursor: 'pointer' }}>
                <div className="text-xs text-gray-500 margin-top">
                  {getDirectionLabel(metric.direction)}
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
        <Page>
          <Navbar>
            <NavTitle>{editingMetricId ? "Edit Metric" : "New Metric"}</NavTitle>
            <NavRight>
              <Link onClick={closePopup}>Done</Link>
            </NavRight>
          </Navbar>
          
          <MetricForm
            metricId={editingMetricId}
            onSuccess={handleMetricSuccess}
            onError={handleMetricError}
            onCancel={handleMetricCancel}
          />
        </Page>
      </Popup>
    </Page>
  );
}
