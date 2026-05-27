import { HijriDate, useHijriDate } from "../calendar/hijri";
import { useLanguageContext } from "../i18n/LanguageContext";
import type { Task } from "@/domain/task";

interface TaskPreviewProps {
  task: Task;
}

export default function TaskPreview({ task }: TaskPreviewProps) {
  const { t } = useLanguageContext();
  const { toHijriDate, formatDate } = useHijriDate();
  return (
    <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto text-sm">
      {/* Basic Information */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900">
          {t("basic_information")}
        </h3>
        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
          <div>
            <span className="font-medium text-gray-600">{t("task_name")}:</span>
            <p className="text-gray-900">{task.name}</p>
          </div>
          {task.description && (
            <div>
              <span className="font-medium text-gray-600">
                {t("description")}:
              </span>
              <p className="text-gray-900">{task.description}</p>
            </div>
          )}
          <div>
            <span className="font-medium text-gray-600">{t("status")}:</span>
            <p className="text-gray-900">
              {task.status === 1 ? t("completed") : t("pending")}
            </p>
          </div>
          {task.status === 1 && task.completedAt && (
            <div>
              <span className="font-medium text-gray-600">
                {t("completed_at")}:
              </span>
              <p className="text-gray-900">
                {new Date(task.completedAt).toLocaleDateString()}{" "}
                {new Date(task.completedAt).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Date Information */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900">{t("date_information")}</h3>
        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
          {task.atEpochMillis && (
            <>
              <div>
                <span className="font-medium text-gray-600">
                  {t("epoch_millis")}:
                </span>
                <p className="text-gray-900 font-mono text-sm">
                  {task.atEpochMillis}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">
                  {t("gregorian_date")}:
                </span>
                <p className="text-gray-900">
                  {new Date(task.atEpochMillis).toLocaleDateString()}{" "}
                  {new Date(task.atEpochMillis).toLocaleTimeString()}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">
                  {t("hijri_date")}:
                </span>
                <p className="text-gray-900">
                  {formatDate(
                    toHijriDate(new Date(task.atEpochMillis)),
                    "DD MMMM YYYY"
                  )}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">
                  {t("offset")}:
                </span>
                <p className="text-gray-900">{task.hijriDateOffset || 0}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">
                  {t("is_overdue")}:
                </span>
                <p className="text-gray-900">
                  {String(task.isOverdue())},{" "}
                  {task.atEpochMillis - new Date().valueOf()}
                </p>
              </div>
            </>
          )}
          {task.atEpochMillis && (
            <div>
              <span className="font-medium text-gray-600">
                {t("scheduled_hijri_date")}:
              </span>
              <p className="text-gray-900">
                {toHijriDate(new Date(task.atEpochMillis)).format(
                  "D MMMM YYYY"
                )}
              </p>
            </div>
          )}
          {task.atTime && (
            <div>
              <span className="font-medium text-gray-600">
                {t("scheduled_time")}:
              </span>
              <p className="text-gray-900">{task.atTime}</p>
            </div>
          )}
        </div>
      </div>

      {/* Location Information */}
      {(task.lat || task.long || task.timezone) && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900">
            {t("location_information")}
          </h3>
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            {task.lat && (
              <div>
                <span className="font-medium text-gray-600">
                  {t("latitude")}:
                </span>
                <p className="text-gray-900">{task.lat}</p>
              </div>
            )}
            {task.long && (
              <div>
                <span className="font-medium text-gray-600">
                  {t("longitude")}:
                </span>
                <p className="text-gray-900">{task.long}</p>
              </div>
            )}
            {task.timezone && (
              <div>
                <span className="font-medium text-gray-600">
                  {t("timezone")}:
                </span>
                <p className="text-gray-900">{task.timezone}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900">{t("timestamps")}</h3>
        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
          {task.createdAt && (
            <div>
              <span className="font-medium text-gray-600">
                {t("created_at")}:
              </span>
              <p className="text-gray-900">
                {new Date(task.createdAt).toLocaleDateString()}{" "}
                {new Date(task.createdAt).toLocaleTimeString()}
              </p>
            </div>
          )}
          {task.updatedAt && (
            <div>
              <span className="font-medium text-gray-600">
                {t("updated_at")}:
              </span>
              <p className="text-gray-900">
                {new Date(task.updatedAt).toLocaleDateString()}{" "}
                {new Date(task.updatedAt).toLocaleTimeString()}
              </p>
            </div>
          )}
          {task.completedAt && (
            <div>
              <span className="font-medium text-gray-600">
                {t("completed_at")}:
              </span>
              <p className="text-gray-900">
                {new Date(task.completedAt).toLocaleDateString()}{" "}
                {new Date(task.completedAt).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Information */}
      {task.recurringType && task.recurringType !== "none" && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900">
            {t("repeat_information")}
          </h3>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div>
              <span className="font-medium text-gray-600">{t("repeat")}:</span>
              <p className="text-gray-900">{task.recurringType}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
