import { useState, useEffect } from "react";
import { useTracker } from "../hooks/useTracker";
import type { Tracker } from "~/lib/tracker/types";
import { FormInput } from "./FormInput";
import { Card, CardHeader, CardTitle, CardContent } from "./Card";
import { LoadingSpinner } from "./Loading";
import { Button, Page, Navbar } from "../navigation/components";

interface TrackerFormProps {
  trackerId?: string | null;
  onSuccess?: (tracker: Tracker) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export default function TrackerForm({
  trackerId,
  onSuccess,
  onError,
  onCancel,
}: TrackerFormProps) {
  const { loading, error, createTracker, updateTracker, getTracker } = useTracker();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [baseline, setBaseline] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (trackerId) {
      getTracker(trackerId).then(fetchedTracker => {
        if (fetchedTracker) {
          setName(fetchedTracker.name);
          setUnit(fetchedTracker.unit);
          setBaseline(fetchedTracker.baseline.toString());
        }
      }).catch(() => {
        // Handle error silently or show error
      });
    } else {
      setName('');
      setUnit('');
      setBaseline('0');
    }
  }, [trackerId, getTracker]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleSubmit = async () => {
    if (!name.trim() || !unit.trim()) return;

    try {
      setIsSubmitting(true);
      
      let result: Tracker;
      if (trackerId) {
        result = await updateTracker(trackerId, {
          name: name.trim(),
          unit: unit.trim(),
          baseline: parseFloat(baseline) || 0
        });
      } else {
        result = await createTracker({
          name: name.trim(),
          unit: unit.trim(),
          baseline: parseFloat(baseline) || 0
        });
      }

      // Reset form
      setName('');
      setUnit('');
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
    setBaseline('0');
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Page>
      <Navbar 
        title={trackerId ? "Edit Tracker" : "New Tracker"}
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
                {trackerId ? "Edit Tracker" : "New Tracker"}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0">
              {loading && (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" text="Loading tracker data..." />
                </div>
              )}
              
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <div className="space-y-5">
                  <FormInput
                    label="Name"
                    value={name}
                    placeholder="Enter tracker name"
                    disabled={isSubmitting}
                    required={true}
                    onChange={setName}
                    className="text-base"
                  />
                  
                  <FormInput
                    label="Unit"
                    value={unit}
                    placeholder="e.g., kg, hours, IDR, count"
                    disabled={isSubmitting}
                    required={true}
                    onChange={setUnit}
                    className="text-base"
                  />
                  
                  <FormInput
                    label="Baseline"
                    type="number"
                    value={baseline}
                    placeholder="0"
                    disabled={isSubmitting}
                    onChange={setBaseline}
                    className="text-base"
                  />
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
                    disabled={isSubmitting || !name.trim() || !unit.trim()}
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
                          {trackerId ? "UPDATING..." : "SAVING..."}
                        </span>
                      </div>
                    ) : (
                      trackerId ? "UPDATE" : "SAVE"
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
              Trackers help you monitor daily activities and goals.
            </p>
            <p className="mt-1">
              Set a baseline to establish your starting point.
            </p>
          </div>
        </div>
      </div>
    </Page>
  );
}
