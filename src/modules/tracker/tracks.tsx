import { useLanguageContext } from "../i18n/LanguageContext";
import { useTrackers } from "./use-trackers";
import { TrackerProvider, useTrackerContext } from "./tracker-context";
import { TrackerCard } from "./tracker-card";
import { TrackerForm } from "./tracker-form";
import { Navbar } from "../navigation/navbar";
import { Modal } from "../navigation/modal";
import { Page } from "../navigation";
import { NavActionButton } from "../components/nav-action-button";
import { HvPlus } from "../icons";

function formatBalance(amount: number): string {
  return amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}


function TracksPage() {
  const { t } = useLanguageContext();
  const { data: trackers = [], isLoading } = useTrackers();
  const { formOpen, editingTrackerId, openCreateForm, closeForm } = useTrackerContext();
  return (
    <Page
      navbar={
        <Navbar
          title={t("tracks") || "Tracks"}
          showBackButton={false}
          rightAction={
            <NavActionButton
              variant="neutral"
              onClick={openCreateForm}
              aria-label={t("new_tracker") || "New Tracker"}
            >
              <HvPlus size={20} />
            </NavActionButton>
          }
        />
      }
    >
      <div className="flex-1 overflow-y-auto pb-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-[var(--hvsna-primary-color)] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="px-4 pt-4">
            {/* Card grid */}
            <div className="grid grid-cols-2 gap-3">
              {trackers.map((tracker) => (
                <TrackerCard
                  key={tracker.id}
                  tracker={tracker}
                  todayTimestamp={Date.now()}
                />
              ))}
              {/* Add new tracker card */}
              <button
                onClick={openCreateForm}
                className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-[var(--hvsna-primary-color)] hover:text-[var(--hvsna-primary-color)] transition-colors min-h-[120px]"
              >
                <HvPlus size={24} />
                <span className="text-xs mt-1">{t("new_tracker") || "New Tracker"}</span>
              </button>
            </div>

            {trackers.length === 0 && (
              <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
                {t("no_trackers_description") || "Create a tracker to start logging data"}
              </p>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={formOpen} onClose={closeForm} noPadding>
        <TrackerForm editingId={editingTrackerId} onClose={closeForm} />
      </Modal>
    </Page>
  );
}

export default function Tracks() {
  return (
    <TrackerProvider>
      <TracksPage />
    </TrackerProvider>
  );
}
