import { useCallback, useEffect, useRef, useState } from "react";
import {
  effectiveTags,
  initialTitleTagField,
  setPickerSelection,
  type TitleTagFieldState,
} from "./title-tag-field";

interface UseTitleTagFieldOptions {
  /** Initial title text (e.g. an existing task's name). */
  seedText: string;
  /** Initial tag set (e.g. an existing task's tags, or a tag-page prefill). */
  seedTags: string[];
  /**
   * Re-seed the field when this changes — e.g. `task?.id` in an edit form, so switching the
   * edited task (or the task finishing its async load) resets the input.
   */
  resetKey?: unknown;
  /** Called with the reconciled effective tag list whenever tokens / picker tags change. */
  onEffectiveTagsChange: (tags: string[]) => void;
}

export interface UseTitleTagFieldReturn {
  state: TitleTagFieldState;
  /** Pass to `<TitleTagInput onStateChange>`. */
  onStateChange: (next: TitleTagFieldState) => void;
  /** Pass to the Tags picker's `onTagsChange` — reconciles it against inline tokens. */
  setPickerTags: (tags: string[]) => void;
}

/**
 * Owns the {@link TitleTagFieldState} for a task form and keeps `formData.tags` mirrored to
 * it. The state machine is the single source of truth for tags; the separate Tags picker is
 * just another way to edit the same set (see {@link setPickerSelection}).
 */
export function useTitleTagField({
  seedText,
  seedTags,
  resetKey,
  onEffectiveTagsChange,
}: UseTitleTagFieldOptions): UseTitleTagFieldReturn {
  const [state, setState] = useState<TitleTagFieldState>(() =>
    initialTitleTagField(seedText, seedTags)
  );

  // Re-seed on resetKey change, or when the seed text first arrives (async task load).
  const seedRef = useRef({ key: resetKey, text: seedText });
  useEffect(() => {
    const changedKey = seedRef.current.key !== resetKey;
    const lateText = seedRef.current.text === "" && seedText !== "";
    if (changedKey || lateText) {
      seedRef.current = { key: resetKey, text: seedText };
      setState(initialTitleTagField(seedText, seedTags));
      onEffectiveTagsChange(seedTags);
    }
    // seedTags omitted on purpose — arrays are re-created each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, seedText]);

  const onStateChange = useCallback(
    (next: TitleTagFieldState) => {
      setState(next);
      onEffectiveTagsChange(effectiveTags(next));
    },
    [onEffectiveTagsChange]
  );

  const setPickerTags = useCallback(
    (tags: string[]) => {
      const next = setPickerSelection(state, tags);
      setState(next);
      onEffectiveTagsChange(effectiveTags(next));
    },
    [state, onEffectiveTagsChange]
  );

  return { state, onStateChange, setPickerTags };
}
