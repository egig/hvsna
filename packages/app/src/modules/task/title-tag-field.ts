/**
 * Pure state machine behind the task form's title input. The title field doubles as a fast
 * tag-entry path: typing `#name` opens an autosuggest popup, and picking a suggestion commits
 * a *token* — a colored `#name` span that stays inline while editing but is stripped back out
 * of the saved title. Tags added through the separate Tags picker live in {@link pickerTags}
 * and never appear in the text.
 *
 * Web counterpart of android's `com.hvsna.app.ui.TitleTagFieldState` (`ui/TitleTagField.kt`).
 * The one structural difference: web identifies tags by their normalized name (there is no
 * separate id), so a token *is* its tag name and there is no id/name split.
 *
 * Design decisions (kept in lockstep with android — see the grilling session that produced it):
 * - A token commits **only** on suggestion tap, never on space/enter. Untapped `#word` text is
 *   just text and survives to the saved title verbatim.
 * - Tokens are **atomic**: any edit touching a token's characters deletes the whole token and
 *   unlinks its tag. No partial editing.
 * - token <-> tag is 1:1 and so is pickerTag <-> tag. Committing a suggestion for a tag that is
 *   currently a picker tag **promotes** it (drops it from {@link pickerTags}); committing one
 *   that is already a token is a no-op beyond clearing the typed query.
 * - Removing a tag (atomic delete in the text, or unchecking it in the Tags picker) always
 *   reconciles both sides.
 *
 * Deliberately free of React / DOM types so it can be unit-tested directly. The component layer
 * converts to/from the textarea's value + selection and renders {@link activeQuery} as a popup.
 */

/** A committed `#name` span. `start` is the index of `#` in the title text. */
export interface CommittedTag {
  /** Index of the `#` character in {@link TitleTagFieldState.text}. */
  start: number;
  /** Tag name without the leading `#` (already normalized). */
  name: string;
}

/** The `#…` run under the caret. `hashIndex` is the `#`; `caret` is where typing stops. */
export interface ActiveQuery {
  hashIndex: number;
  caret: number;
  query: string;
}

export interface TitleTagFieldState {
  text: string;
  selectionStart: number;
  selectionEnd: number;
  /** Committed `#name` spans, kept sorted by `start`, non-overlapping. */
  tokens: CommittedTag[];
  /** Tags added via the Tags picker; never present in `text`. Order = insertion order. */
  pickerTags: string[];
}

const WHITESPACE_RUN = /\s+/g;
const NEWLINES = /[\r\n]+/g;

/** Exclusive end index of a token (past the last char of `name`). */
export function tokenEnd(token: CommittedTag): number {
  return token.start + 1 + token.name.length;
}

/** `#name` as it appears in the text. */
export function tokenText(token: CommittedTag): string {
  return `#${token.name}`;
}

export function initialTitleTagField(
  text: string,
  pickerTags: string[]
): TitleTagFieldState {
  return {
    text,
    selectionStart: text.length,
    selectionEnd: text.length,
    tokens: [],
    pickerTags: [...pickerTags],
  };
}

/** Effective tag set for saving: token tags in text order, then picker tags. Deduped. */
export function effectiveTags(state: TitleTagFieldState): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of [...state.tokens.map((t) => t.name), ...state.pickerTags]) {
    if (!seen.has(name)) {
      seen.add(name);
      out.push(name);
    }
  }
  return out;
}

/** `text` with every committed token spliced out, whitespace collapsed and trimmed. */
export function strippedTitle(state: TitleTagFieldState): string {
  const [removed] = removeRanges(
    state.text,
    state.tokens.map((t) => [t.start, tokenEnd(t)] as const)
  );
  return removed.replace(WHITESPACE_RUN, " ").trim();
}

/** True once there is a non-blank title after tokens are stripped. */
export function hasTitle(state: TitleTagFieldState): boolean {
  return strippedTitle(state).length > 0;
}

const isWs = (ch: string): boolean => /\s/.test(ch);

/**
 * The `#…` run the caret currently sits at the end of, or null. Only reported when there is a
 * plain caret (no selection), the run is preceded by whitespace or start-of-text, and the `#`
 * does not belong to an existing committed token.
 */
export function activeQuery(state: TitleTagFieldState): ActiveQuery | null {
  const { text, selectionStart, selectionEnd } = state;
  if (selectionStart !== selectionEnd) return null;
  const caret = selectionEnd;
  if (caret > text.length) return null;
  let i = caret;
  while (i > 0 && !isWs(text[i - 1]) && text[i - 1] !== "#") i--;
  if (i === 0 || text[i - 1] !== "#") return null;
  const hashIndex = i - 1;
  if (hashIndex !== 0 && !isWs(text[hashIndex - 1])) return null;
  if (state.tokens.some((t) => t.start === hashIndex)) return null;
  if (i === caret) return null; // bare "#", nothing typed yet
  return { hashIndex, caret, query: text.substring(i, caret) };
}

// --- transitions -------------------------------------------------------------------------

/** Fold a raw edit from the textarea (newlines collapsed to spaces). */
export function onTextChanged(
  state: TitleTagFieldState,
  newText: string,
  newSelStart: number,
  newSelEnd: number
): TitleTagFieldState {
  const filtered = newText.replace(NEWLINES, " ");
  const selS = clamp(newSelStart, 0, filtered.length);
  const selE = clamp(newSelEnd, 0, filtered.length);

  if (filtered === state.text) {
    return { ...state, selectionStart: selS, selectionEnd: selE };
  }

  // Clearing the whole field (select-all + delete) drops every token.
  if (filtered.trim() === "") {
    return {
      text: filtered,
      selectionStart: selS,
      selectionEnd: selE,
      tokens: [],
      pickerTags: state.pickerTags,
    };
  }

  const prefix = commonPrefixLen(state.text, filtered);
  const suffix = commonSuffixLen(state.text, filtered, prefix);
  const changeStart = prefix;
  const changeEnd = Math.max(state.text.length - suffix, prefix);
  const delta = filtered.length - state.text.length;

  const touched = state.tokens.filter(
    (t) => t.start < changeEnd && tokenEnd(t) > changeStart
  );

  if (touched.length === 0) {
    const shifted = state.tokens.map((t) =>
      t.start >= changeEnd ? { ...t, start: t.start + delta } : t
    );
    return {
      ...state,
      text: filtered,
      tokens: shifted,
      selectionStart: selS,
      selectionEnd: selE,
    };
  }

  // An edit touched a token -> that touch is interpreted purely as "delete the token".
  // The raw keystroke is discarded; we rebuild from the previous text minus touched tokens.
  const touchedSet = new Set(touched);
  const [rebuilt] = removeRanges(
    state.text,
    touched.map((t) => [t.start, tokenEnd(t)] as const)
  );
  const survivors = state.tokens
    .filter((t) => !touchedSet.has(t))
    .map((tok) => {
      const removedBefore = touched
        .filter((t) => tokenEnd(t) <= tok.start)
        .reduce((sum, t) => sum + (tokenEnd(t) - t.start), 0);
      return { ...tok, start: tok.start - removedBefore };
    });
  const [collapsedText, collapsedCaret] = collapseWhitespace(
    rebuilt,
    touched[0].start
  );
  return {
    ...state,
    text: collapsedText,
    tokens: shiftForCollapse(survivors, rebuilt, collapsedText),
    selectionStart: collapsedCaret,
    selectionEnd: collapsedCaret,
  };
}

/** Commit the currently-typed `#…` run as [name]. No-op if there is no active query. */
export function commitSuggestion(
  state: TitleTagFieldState,
  name: string
): TitleTagFieldState {
  const active = activeQuery(state);
  if (!active) return state;

  // Already a token: just clear the typed query, keep a single token.
  if (state.tokens.some((t) => t.name === name)) {
    const rebuilt =
      state.text.slice(0, active.hashIndex) + state.text.slice(active.caret);
    const shift = active.caret - active.hashIndex;
    const shifted = state.tokens.map((t) =>
      t.start >= active.caret ? { ...t, start: t.start - shift } : t
    );
    return {
      ...state,
      text: rebuilt,
      tokens: shifted,
      selectionStart: active.hashIndex,
      selectionEnd: active.hashIndex,
    };
  }

  const literal = `#${name}`;
  const needsSpace =
    active.caret >= state.text.length || !isWs(state.text[active.caret]);
  const insert = needsSpace ? `${literal} ` : literal;
  const rebuilt =
    state.text.slice(0, active.hashIndex) +
    insert +
    state.text.slice(active.caret);
  const lengthDelta = insert.length - (active.caret - active.hashIndex);
  const caret = active.hashIndex + insert.length;

  const newToken: CommittedTag = { start: active.hashIndex, name };
  const shifted = state.tokens.map((t) =>
    t.start >= active.caret ? { ...t, start: t.start + lengthDelta } : t
  );
  return {
    ...state,
    text: rebuilt,
    tokens: [...shifted, newToken].sort((a, b) => a.start - b.start),
    pickerTags: state.pickerTags.filter((p) => p !== name),
    selectionStart: caret,
    selectionEnd: caret,
  };
}

/** Add [name] via the Tags picker (no token in the text). No-op if already effective. */
export function addPickerTag(
  state: TitleTagFieldState,
  name: string
): TitleTagFieldState {
  if (effectiveTags(state).includes(name)) return state;
  return { ...state, pickerTags: [...state.pickerTags, name] };
}

/** Remove [name] from wherever it lives — token (splice the text) or picker set. */
export function removeTag(
  state: TitleTagFieldState,
  name: string
): TitleTagFieldState {
  const token = state.tokens.find((t) => t.name === name);
  if (token) {
    const end = tokenEnd(token);
    const [rebuilt] = removeRanges(state.text, [[token.start, end] as const]);
    const [collapsedText, collapsedCaret] = collapseWhitespace(
      rebuilt,
      token.start
    );
    const survivors = state.tokens
      .filter((t) => t !== token)
      .map((t) =>
        t.start >= end ? { ...t, start: t.start - (end - token.start) } : t
      );
    return {
      ...state,
      text: collapsedText,
      tokens: shiftForCollapse(survivors, rebuilt, collapsedText),
      selectionStart: collapsedCaret,
      selectionEnd: collapsedCaret,
    };
  }
  return { ...state, pickerTags: state.pickerTags.filter((p) => p !== name) };
}

/**
 * Reconcile the picker's full selected-tag list into the state: additions become picker tags,
 * removals splice tokens or drop picker tags. Order of [next] wins for picker-tag ordering.
 */
export function setPickerSelection(
  state: TitleTagFieldState,
  next: string[]
): TitleTagFieldState {
  const nextSet = new Set(next);
  let s = state;
  for (const name of effectiveTags(state)) {
    if (!nextSet.has(name)) s = removeTag(s, name);
  }
  for (const name of next) {
    if (!effectiveTags(s).includes(name)) s = addPickerTag(s, name);
  }
  return s;
}

// --- helpers ---------------------------------------------------------------------------------

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(Math.max(n, lo), hi);
}

function commonPrefixLen(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i++;
  return i;
}

function commonSuffixLen(a: string, b: string, prefixLen: number): number {
  const max = Math.min(a.length, b.length) - prefixLen;
  let i = 0;
  while (i < max && a[a.length - 1 - i] === b[b.length - 1 - i]) i++;
  return i;
}

/** Remove [ranges] (half-open `[start, end)`) from [s]; returns the new string and a caret at the first cut. */
function removeRanges(
  s: string,
  ranges: ReadonlyArray<readonly [number, number]>
): [string, number] {
  if (ranges.length === 0) return [s, s.length];
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  let out = "";
  let cursor = 0;
  const caret = sorted[0][0];
  for (const [start, end] of sorted) {
    if (start > cursor) out += s.slice(cursor, start);
    cursor = end;
  }
  if (cursor < s.length) out += s.slice(cursor);
  return [out, clamp(caret, 0, out.length)];
}

/** Collapse runs of whitespace to a single space and trim; keep [caret] pointing at the same spot. */
function collapseWhitespace(s: string, caret: number): [string, number] {
  let out = "";
  let newCaret = caret;
  let prevSpace = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (isWs(c)) {
      if (prevSpace || out.length === 0) {
        if (i < caret) newCaret--;
      } else {
        out += " ";
      }
      prevSpace = true;
    } else {
      out += c;
      prevSpace = false;
    }
  }
  if (out.length > 0 && out[out.length - 1] === " ") {
    out = out.slice(0, -1);
    if (caret >= out.length + 1) newCaret--;
  }
  return [out, clamp(newCaret, 0, out.length)];
}

/** Re-map token starts after [collapseWhitespace] rewrote [before] into [after]. */
function shiftForCollapse(
  tokens: CommittedTag[],
  before: string,
  after: string
): CommittedTag[] {
  if (before === after) return tokens;
  return tokens
    .map((tok) => {
      const idx = after.indexOf(tokenText(tok));
      return idx < 0 ? null : { ...tok, start: idx };
    })
    .filter((t): t is CommittedTag => t !== null)
    .sort((a, b) => a.start - b.start);
}
