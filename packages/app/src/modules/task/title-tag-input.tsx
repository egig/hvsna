import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { normalizeTagName } from "@/domain/tag";
import { useTags } from "./use-tags";
import { useTagColor } from "./tag-pill";
import {
  activeQuery,
  commitSuggestion,
  effectiveTags,
  onTextChanged,
  strippedTitle,
  tokenEnd,
  type TitleTagFieldState,
} from "./title-tag-field";

/**
 * Task title field that doubles as a fast tag-entry path. Typing `#name` opens an autosuggest
 * popup; picking a suggestion commits a colored inline `#token` that is stripped back out of the
 * saved title (see {@link TitleTagFieldState}). Web counterpart of android's `TitleTagInput`
 * (`TaskBottomSheet.kt`).
 *
 * The `<textarea>` carries transparent text with a visible caret; a pixel-aligned backdrop
 * renders the same text with tokens tinted in their tag color. A hidden `input[name]` exposes
 * the stripped title so the existing FormData-based submit flow is untouched.
 */

const TEXT_LAYER =
  "block w-full px-4 py-2 text-lg font-medium leading-normal tracking-normal " +
  "whitespace-pre-wrap [overflow-wrap:anywhere] font-[inherit]";

interface TitleTagInputProps {
  state: TitleTagFieldState;
  onStateChange: (next: TitleTagFieldState) => void;
  /** Name of the hidden input that carries the stripped title into FormData. */
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  ariaLabel?: string;
  /** Fired on any user-driven edit (typing, committing / removing a token). For dirty tracking. */
  onUserEdit?: () => void;
  onFocusChange?: (focused: boolean) => void;
}

type Suggestion =
  | { kind: "tag"; name: string }
  | { kind: "create"; name: string };

export function TitleTagInput({
  state,
  onStateChange,
  name = "taskName",
  placeholder = "",
  disabled = false,
  autoFocus = false,
  ariaLabel,
  onUserEdit,
  onFocusChange,
}: TitleTagInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const { tags } = useTags();
  const tagColor = useTagColor();

  const [focused, setFocused] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const dismissedQueryRef = useRef<string | null>(null);

  // --- autosuggest ------------------------------------------------------------------------
  const active = activeQuery(state);
  const rawQuery = active?.query.trim() ?? "";
  const normQuery = normalizeTagName(rawQuery);
  const committed = useMemo(() => new Set(effectiveTags(state)), [state]);

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!active || rawQuery === "") return [];
    const matching = tags
      .filter(
        (t) =>
          !committed.has(t.name) &&
          t.name.toLowerCase().includes(rawQuery.toLowerCase())
      )
      .slice(0, 5)
      .map<Suggestion>((t) => ({ kind: "tag", name: t.name }));
    const exists = tags.some(
      (t) => t.name.toLowerCase() === normQuery.toLowerCase()
    );
    if (!exists && normQuery && !committed.has(normQuery)) {
      matching.push({ kind: "create", name: normQuery });
    }
    return matching;
  }, [active, rawQuery, normQuery, tags, committed]);

  const dismissed =
    dismissedQueryRef.current !== null &&
    dismissedQueryRef.current === rawQuery;
  const open = focused && suggestions.length > 0 && !dismissed;

  useEffect(() => {
    setHighlight(0);
  }, [rawQuery]);

  // --- textarea <-> state selection sync -------------------------------------------------
  useLayoutEffect(() => {
    const ta = ref.current;
    if (!ta || document.activeElement !== ta) return;
    if (
      ta.selectionStart !== state.selectionStart ||
      ta.selectionEnd !== state.selectionEnd
    ) {
      ta.setSelectionRange(state.selectionStart, state.selectionEnd);
    }
  }, [state.selectionStart, state.selectionEnd, state.text]);

  // --- auto-grow + keep the backdrop the same height -----------------------------------
  useLayoutEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [state.text]);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = useCallback(
    (next: TitleTagFieldState) => {
      onStateChange(next);
      onUserEdit?.();
    },
    [onStateChange, onUserEdit]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    dismissedQueryRef.current = null;
    emit(
      onTextChanged(
        state,
        ta.value,
        ta.selectionStart ?? ta.value.length,
        ta.selectionEnd ?? ta.value.length
      )
    );
  };

  const syncSelection = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    if (ta.value !== state.text) return;
    const s = ta.selectionStart ?? 0;
    const en = ta.selectionEnd ?? 0;
    if (s === state.selectionStart && en === state.selectionEnd) return;
    onStateChange({ ...state, selectionStart: s, selectionEnd: en });
  };

  const pick = (s: Suggestion) => {
    emit(commitSuggestion(state, s.name));
    dismissedQueryRef.current = null;
    ref.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (open) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => (h + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const s = suggestions[highlight] ?? suggestions[0];
        if (s) pick(s);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        dismissedQueryRef.current = rawQuery;
        return;
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      // Preserve the single-line <input> behaviour: Enter submits the form.
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  const showPlaceholder = state.text.length === 0;

  return (
    <div className={`relative ${disabled ? "opacity-50" : ""}`}>
      {/* visually hidden but still a constraint-validation candidate (unlike type=hidden):
          carries the stripped title into FormData and enforces "title required". */}
      <input
        name={name}
        required
        value={strippedTitle(state)}
        onChange={() => {}}
        tabIndex={-1}
        aria-hidden
        className="sr-only"
      />

      {/* colored token backdrop */}
      <div
        aria-hidden
        className={`${TEXT_LAYER} pointer-events-none absolute inset-0 text-gray-900 dark:text-gray-100 select-none`}
      >
        {showPlaceholder ? (
          <span className="text-gray-400">{placeholder}</span>
        ) : (
          <>
            {renderTokens(state, tagColor)}
            {/* trailing sentinel so height tracks a trailing space / empty last line */}
            {"\u200B"}
          </>
        )}
      </div>

      <textarea
        ref={ref}
        rows={1}
        value={state.text}
        onChange={handleChange}
        onSelect={syncSelection}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          setFocused(true);
          onFocusChange?.(true);
        }}
        onBlur={() => {
          setFocused(false);
          onFocusChange?.(false);
        }}
        disabled={disabled}
        aria-label={ariaLabel}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className={`${TEXT_LAYER} relative resize-none overflow-hidden bg-transparent text-transparent outline-none caret-gray-900 dark:caret-gray-100 selection:bg-[var(--hvsna-primary-color)]/25 selection:text-transparent disabled:opacity-50`}
      />

      {open && (
        <ul className="absolute left-4 right-4 top-full z-[10001] mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {suggestions.map((s, i) => (
            <li key={`${s.kind}:${s.name}`}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  i === highlight
                    ? "bg-gray-50 dark:bg-gray-700"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {s.kind === "create" ? (
                  <>
                    <span className="text-base font-semibold leading-none text-[var(--hvsna-primary-color)]">
                      +
                    </span>
                    <span className="text-gray-700 dark:text-gray-200">
                      Create{" "}
                      <span
                        className="font-medium"
                        style={{ color: tagColor(s.name) }}
                      >
                        #{s.name}
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: tagColor(s.name) }}
                    />
                    <span
                      className="font-medium"
                      style={{ color: tagColor(s.name) }}
                    >
                      #{s.name}
                    </span>
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Split the title text into plain runs + colored `#token` spans for the backdrop. */
function renderTokens(
  state: TitleTagFieldState,
  tagColor: (name: string) => string
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const sorted = [...state.tokens].sort((a, b) => a.start - b.start);
  let cursor = 0;
  sorted.forEach((tok, idx) => {
    if (tok.start > cursor) {
      nodes.push(
        <span key={`t${idx}`}>{state.text.slice(cursor, tok.start)}</span>
      );
    }
    const end = Math.min(tokenEnd(tok), state.text.length);
    nodes.push(
      <span
        key={`k${idx}`}
        style={{ color: tagColor(tok.name), fontWeight: 600 }}
      >
        {state.text.slice(tok.start, end)}
      </span>
    );
    cursor = end;
  });
  if (cursor < state.text.length) {
    nodes.push(<span key="tail">{state.text.slice(cursor)}</span>);
  }
  return nodes;
}
