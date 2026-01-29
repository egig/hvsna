import { useState, useEffect } from "react";
import { useTracker } from "../hooks/useTracker";
import { useLog } from "../hooks/useLog";
import type { Tracker, Log } from "~/lib/tracker/types";
import { FormInput } from "./FormInput";
import { Card, CardHeader, CardTitle, CardContent } from "./Card";
import { LoadingSpinner } from "./Loading";
import { Button, Page, Navbar } from "../navigation/components";

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
  const { loading: trackerLoading, getTrackers } = useTracker();
  const { loading, error, createLog, updateLog, getLog } = useLog();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [selectedTrackerId, setSelectedTrackerId] = useState('');
  const [value, setValue] = useState('0');
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [metadata, setMetadata] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load available trackers
    getTrackers().then(setTrackers).catch(() => {
      // Handle error silently
    });
  }, [getTrackers]);

  useEffect(() => {
    if (logId) {
      getLog(logId).then(fetchedLog => {
        if (fetchedLog) {
          setSelectedTrackerId(fetchedLog.trackerId);
          setValue(fetchedLog.value.toString());
          setTimestamp(new Date(fetchedLog.timestamp).toISOString().slice(0, 16));
          setMetadata(fetchedLog.metadata ? JSON.stringify(fetchedLog.metadata) : '');
        }
      }).catch(() => {
        // Handle error silently
      });
    } else {
      setSelectedTrackerId('');
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
    if (!selectedTrackerId || !value.trim()) return;

    try {
      setIsSubmitting(true);
      
      let result: Log;
      const logData = {
        trackerId: selectedTrackerId,
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
      setSelectedTrackerId('');
      setValue('0');
      setTimestamp(new Date().toISOString().slice(0, 16));
      setMetadata('');
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      if (onError) {
        onError(err instanceof Error ? err.message : 'Failed to save log');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedTrackerId('');
    setValue('0');
    setTimestamp(new Date().toISOString().slice(0, 16));
    setMetadata('');
    if (onCancel) {
      onCancel();
    }
  };

  const selectedTracker = trackers.find(t => t.id === selectedTrackerId);

  return (
    <Page>
      <Navbar 
        title={logId ? "Edit Log" : "New Log"}
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
                {logId ? "Edit Log" : "New Log"}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0">
              {(loading || trackerLoading) && (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" text="Loading log data..." />
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

                  <FormInput 
                    label="Value"
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

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timestamp
                    </label>
                    <input
                      type="datetime-local"
                      value={timestamp}
                      onChange={(e) => setTimestamp(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Metadata (JSON)
                    </label>
                    <textarea
                      value={metadata}
                      placeholder='{"key": "value"}'
                      onChange={(e) => setMetadata(e.target.value)}
                      disabled={isSubmitting}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Optional JSON metadata
                    </p>
                  </div>
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
                          {logId ? "UPDATING..." : "CREATING..."}
                        </span>
                      </div>
                    ) : (
                      logId ? "UPDATE" : "CREATE"
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
              Journal entries help you track daily activities and progress.
            </p>
            <p className="mt-1">
              Record values for your trackers to monitor trends over time.
            </p>
          </div>
        </div>
      </div>
    </Page>
  );
}
