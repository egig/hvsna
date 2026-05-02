import React, { useState, useEffect } from "react";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useTrackers } from "./use-trackers";
import type { TrackerType } from "../../domain/tracker/ITrackerRepository";
import { HvX } from "../icons";

const TRACKER_EMOJIS = ["💧", "🏃", "📚", "💊", "🧘", "🌙", "☕", "🍎", "💪", "🎯", "🌿", "⚡"];

const TRACKER_COLORS = [
  { name: "blue", label: "Blue", bg: "#3b82f6" },
  { name: "green", label: "Green", bg: "#22c55e" },
  { name: "purple", label: "Purple", bg: "#a855f7" },
  { name: "orange", label: "Orange", bg: "#f97316" },
  { name: "red", label: "Red", bg: "#ef4444" },
  { name: "pink", label: "Pink", bg: "#ec4899" },
  { name: "teal", label: "Teal", bg: "#14b8a6" },
  { name: "yellow", label: "Yellow", bg: "#eab308" },
];

interface TrackerFormProps {
  editingId?: string | null;
  onClose: () => void;
}

export function TrackerForm({ editingId, onClose }: TrackerFormProps) {
  const { t } = useLanguageContext();
  const { data: trackers, createTracker, updateTracker } = useTrackers();

  const existing = editingId ? trackers?.find((tr) => tr.id === editingId) : null;

  const [name, setName] = useState(existing?.name ?? "");
  const [type, setType] = useState<TrackerType>(existing?.type ?? "tally");
  const [unit, setUnit] = useState(existing?.unit ?? "");
  const [emoji, setEmoji] = useState(existing?.emoji ?? "");
  const [color, setColor] = useState(existing?.color ?? "blue");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name ?? "");
      setType(existing.type ?? "tally");
      setUnit(existing.unit ?? "");
      setEmoji(existing.emoji ?? "");
      setColor(existing.color ?? "blue");
    }
  }, [editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("tracker_name_required") || "Name is required");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (editingId) {
        await updateTracker(editingId, {
          name: trimmed,
          type,
          unit: unit.trim() || undefined,
          emoji: emoji || undefined,
          color,
        });
      } else {
        await createTracker({
          name: trimmed,
          type,
          unit: unit.trim() || undefined,
          emoji: emoji || undefined,
          color,
        });
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const typeOptions: { value: TrackerType; label: string; desc: string; icon: string }[] = [
    { value: "tally", label: t("tracker_tally") || "Tally", desc: t("tracker_tally_desc") || "Count occurrences", icon: "🔢" },
    { value: "numeric", label: t("tracker_numeric") || "Numeric", desc: t("tracker_numeric_desc") || "Track any number", icon: "📊" },
    { value: "binary", label: t("tracker_binary") || "Yes / No", desc: t("tracker_binary_desc") || "Done or not done", icon: "✅" },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {editingId ? t("edit_tracker") || "Edit Tracker" : t("new_tracker") || "New Tracker"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <HvX size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {error && <p className="text-sm text-[var(--hvsna-danger-color)]">{error}</p>}

        {/* Emoji picker */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            {t("tracker_emoji") || "Icon"}
          </p>
          <div className="flex flex-wrap gap-2">
            {TRACKER_EMOJIS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setEmoji(emoji === em ? "" : em)}
                className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center border transition-colors ${
                  emoji === em
                    ? "border-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/10"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
            {t("tracker_name") || "Name"}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("tracker_name_placeholder") || "e.g. Water intake, Exercise..."}
            autoFocus={!editingId}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)] text-sm"
          />
        </div>

        {/* Type */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            {t("tracker_type") || "Type"}
          </p>
          <div className="space-y-2">
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                disabled={!!editingId}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                  type === opt.value
                    ? "border-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/10"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <span className="text-xl">{opt.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Unit (only for numeric) */}
        {type === "numeric" && (
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
              {t("tracker_unit") || "Unit (optional)"}
            </label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder={t("tracker_unit_placeholder") || "e.g. cups, km, minutes..."}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)] text-sm"
            />
          </div>
        )}

        {/* Color */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            {t("tracker_color") || "Color"}
          </p>
          <div className="flex flex-wrap gap-2">
            {TRACKER_COLORS.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setColor(c.name)}
                title={c.label}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  color === c.name ? "border-gray-900 dark:border-white scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c.bg }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-lg bg-[var(--hvsna-primary-color)] text-white text-sm font-medium disabled:opacity-50 transition-opacity"
        >
          {submitting ? "..." : t("save") || "Save"}
        </button>
      </div>
    </form>
  );
}
