import { useState, useEffect } from "react";
import { useTracker } from "../hooks/use-tracker";
import type { Tracker, Target as TargetType, TargetType as TargetTypeEnum, TargetPeriod } from "~/lib/tracker/types";
import { useTarget, type TargetDirection, type TargetReducer } from "../hooks/use-target";
import { FormInput } from "./FormInput";
import { Card, CardHeader, CardTitle, CardContent } from "./Card";
import { LoadingSpinner } from "./Loading";
import { Button, Page, Navbar } from "../navigation/components";

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
  const [reducer, setReducer] = useState<TargetReducer>('sum');
  const [direction, setDirection] = useState<TargetDirection>('increase');
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
          setDirection(fetchedTarget.direction);
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
      setReducer('sum');
      setDirection('increase');
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
        reducer,
        direction,
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
      setReducer('sum');
      setDirection('increase');
      setValue('0');
      setValueMax('');
      setPeriod('monthly');
      setSoft(false);
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      if (onError) {
        onError(err instanceof Error ? err.message : 'Failed to save target');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedTrackerId('');
    setType('static');
    setReducer('sum');
    setDirection('increase');
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
    <Page>
      <Navbar 
        title={targetId ? "Edit Target" : "New Target"}
        showBackButton={true}
        customBackAction={onCancel}
      />
      
      <div className="
        flex-1
        overflow-y-auto
        scroll-area
        bg-gray-50
        safe-top
        safe-bottom
        safe-x
      ">
        <div className="
          max-w-lg
          mx-auto
          w-full
          py-4
          px-4
        ">
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle size="md" className="text-center">
                {targetId ? "Edit Target" : "New Target"}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0">
              {(loading || trackerLoading) && (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" text="Loading target data..." />
                </div>
              )}
              
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <div className="space-y-5">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tracker
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      value={selectedTrackerId}
                      onChange={(e) => setSelectedTrackerId(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      required
                    >
                      <option value="">Select a tracker</option>
                      {trackers.map(tracker => (
                        <option key={tracker.id} value={tracker.id}>
                          {tracker.name} ({tracker.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedTracker && (
                    <div className="text-sm text-gray-500 mb-4">
                      Tracker: {selectedTracker.name} ({selectedTracker.unit})
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as TargetTypeEnum)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    >
                      <option value="static">Static</option>
                      <option value="range">Range</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reducer
                    </label>
                    <select
                      value={reducer}
                      onChange={(e) => setReducer(e.target.value as TargetReducer)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    >
                      <option value="sum">Sum</option>
                      <option value="count">Count</option>
                      <option value="last">Last</option>
                      <option value="avg">Average</option>
                      <option value="min">Minimum</option>
                      <option value="max">Maximum</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Direction
                    </label>
                    <select
                      value={direction}
                      onChange={(e) => setDirection(e.target.value as TargetDirection)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    >
                      <option value="increase">Increase (good when up)</option>
                      <option value="decrease">Decrease (good when down)</option>
                      <option value="neutral">Neutral</option>
                    </select>
                  </div>

                  <FormInput 
                    label={type === 'range' ? 'Target' : 'Value'}
                    type="number" 
                    value={value} 
                    placeholder="0" 
                    onChange={setValue}
                    disabled={isSubmitting}
                    required={true}
                    className="text-base"
                  />
                  {selectedTracker && (
                    <p className="text-sm text-gray-500 -mt-2 mb-4">
                      Value in {selectedTracker.unit}
                    </p>
                  )}

                  {type === 'range' && (
                    <>
                      <FormInput 
                        label="Maximum"
                        type="number" 
                        value={valueMax} 
                        placeholder="Maximum value" 
                        onChange={setValueMax}
                        disabled={isSubmitting}
                        className="text-base"
                      />
                      {selectedTracker && (
                        <p className="text-sm text-gray-500 -mt-2 mb-4">
                          Maximum in {selectedTracker.unit}
                        </p>
                      )}
                    </>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Period
                    </label>
                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value as TargetPeriod)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="total">Total</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="soft"
                      checked={soft}
                      onChange={(e) => setSoft(e.target.checked)}
                      disabled={isSubmitting}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="soft" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Soft limit
                    </label>
                  </div>
                  {soft && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Allow going over/under without strict enforcement
                    </p>
                  )}
                </div>
                
                <div className="
                  flex
                  gap-4
                  mt-8
                  mb-4
                  safe-bottom
                ">
                  <Button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="
                      flex-1
                      min-h-[44px]
                      text-base
                      font-medium
                      py-3
                      px-4
                      bg-gray-200
                      hover:bg-gray-300
                      text-gray-800
                      rounded-lg
                      transition-colors
                      duration-200
                      active:scale-[0.98]
                      touch-action-manipulation
                    "
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting || !selectedTrackerId || !value.trim()}
                    className="
                      flex-1
                      min-h-[44px]
                      text-base
                      font-medium
                      py-3
                      px-4
                      bg-blue-500
                      hover:bg-blue-600
                      disabled:bg-gray-300
                      disabled:cursor-not-allowed
                      text-white
                      rounded-lg
                      transition-colors
                      duration-200
                      active:scale-[0.98]
                      touch-action-manipulation
                      shadow-sm
                    "
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">
                          {targetId ? "UPDATING..." : "CREATING..."}
                        </span>
                      </div>
                    ) : (
                      targetId ? "UPDATE" : "CREATE"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          {/* Mobile-friendly help text */}
          <div className="
            text-center
            text-sm
            text-gray-500
            mb-6
            px-2
          ">
            <p>
              Targets help you set goals and track progress.
            </p>
            <p className="mt-1">
              Define specific values to achieve within time periods.
            </p>
          </div>
        </div>
      </div>
    </Page>
  );
}
