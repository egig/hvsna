import { describe, it, expect } from "vitest";
import {
  activeQuery,
  addPickerTag,
  commitSuggestion,
  effectiveTags,
  hasTitle,
  initialTitleTagField,
  onTextChanged,
  removeTag,
  setPickerSelection,
  strippedTitle,
  tokenEnd,
  tokenText,
  type TitleTagFieldState,
} from "../title-tag-field";

/** Type [insert] at the current caret (assumes caret == selectionEnd, no selection). */
function type(s: TitleTagFieldState, insert: string): TitleTagFieldState {
  const at = s.selectionEnd;
  const next = s.text.slice(0, at) + insert + s.text.slice(at);
  return onTextChanged(s, next, at + insert.length, at + insert.length);
}

/** Backspace [n] times from the current caret. */
function backspace(s: TitleTagFieldState, n = 1): TitleTagFieldState {
  let cur = s;
  for (let k = 0; k < n; k++) {
    const at = cur.selectionEnd;
    if (at === 0) continue;
    cur = onTextChanged(cur, cur.text.slice(0, at - 1) + cur.text.slice(at), at - 1, at - 1);
  }
  return cur;
}

/** Move the plain caret to [pos]. */
function caretAt(s: TitleTagFieldState, pos: number): TitleTagFieldState {
  return { ...s, selectionStart: pos, selectionEnd: pos };
}

const blank = () => initialTitleTagField("", []);

describe("title-tag-field", () => {
  it("exposes the active query while typing a hash run", () => {
    const s = type(blank(), "Buy #gro");
    expect(activeQuery(s)?.query).toBe("gro");
    expect(s.tokens).toEqual([]);
    expect(effectiveTags(s)).toEqual([]);
  });

  it("has no active query without a preceding space", () => {
    expect(activeQuery(type(blank(), "Buy#gro"))).toBeNull();
  });

  it("has no active query for a bare hash", () => {
    expect(activeQuery(type(blank(), "Buy #"))).toBeNull();
  });

  it("commit inserts the token, links the tag and adds a trailing space", () => {
    const s = commitSuggestion(type(blank(), "Buy #gro"), "groceries");
    expect(s.text).toBe("Buy #groceries ");
    expect(effectiveTags(s)).toEqual(["groceries"]);
    expect(s.tokens).toHaveLength(1);
    expect(s.tokens[0].start).toBe(4);
    expect(activeQuery(s)).toBeNull();
  });

  it("commit in the middle keeps later text and later tokens aligned", () => {
    let s = commitSuggestion(type(blank(), "a #one"), "one");
    s = commitSuggestion(type(s, "b #two"), "two");
    s = type(s, "tail");
    expect(s.text).toBe("a #one b #two tail");
    expect(effectiveTags(s)).toEqual(["one", "two"]);
    for (const tok of s.tokens) {
      expect(s.text.slice(tok.start, tokenEnd(tok))).toBe(tokenText(tok));
    }
  });

  it("atomic backspace at a token edge removes the whole token and unlinks the tag", () => {
    let s = commitSuggestion(type(blank(), "Buy #gro"), "groceries");
    s = backspace(s, 1); // removes trailing space
    expect(s.text).toBe("Buy #groceries");
    s = backspace(s, 1); // touches token
    expect(s.text).toBe("Buy");
    expect(effectiveTags(s)).toEqual([]);
    expect(s.tokens).toEqual([]);
  });

  it("editing inside a token drops it entirely", () => {
    let s = commitSuggestion(type(blank(), "#gro"), "groceries");
    s = type(caretAt(s, 5), "X");
    expect(effectiveTags(s)).not.toContain("groceries");
    expect(s.tokens).toEqual([]);
  });

  it("select-all delete clears text and every token", () => {
    let s = commitSuggestion(type(blank(), "Buy #a"), "alpha");
    s = commitSuggestion(type(s, "and #b"), "beta");
    s = onTextChanged(s, "", 0, 0);
    expect(s.text).toBe("");
    expect(effectiveTags(s)).toEqual([]);
  });

  it("committing a picker tag promotes it out of the picker set", () => {
    let s = initialTitleTagField("Buy milk", ["milk"]);
    expect(effectiveTags(s)).toEqual(["milk"]);
    s = caretAt(s, s.text.length);
    s = commitSuggestion(type(s, " #mi"), "milk");
    expect(effectiveTags(s)).toEqual(["milk"]);
    expect(s.pickerTags).toEqual([]);
    expect(s.tokens).toHaveLength(1);
  });

  it("committing an already-committed tag does not duplicate", () => {
    let s = commitSuggestion(type(blank(), "#a"), "alpha");
    s = commitSuggestion(type(s, "#a"), "alpha");
    expect(effectiveTags(s)).toEqual(["alpha"]);
    expect(s.tokens).toHaveLength(1);
  });

  it("stripped title removes tokens at start, middle and end with clean whitespace", () => {
    let s = commitSuggestion(type(blank(), "#a"), "alpha");
    s = commitSuggestion(type(s, "buy #b"), "beta");
    s = commitSuggestion(type(s, "milk #c"), "gamma");
    expect(strippedTitle(s)).toBe("buy milk");
    expect(effectiveTags(s)).toEqual(["alpha", "beta", "gamma"]);
  });

  it("editing an existing task keeps the title clean and tags in the picker set", () => {
    const s = initialTitleTagField("Call the bank", ["bank", "errand"]);
    expect(strippedTitle(s)).toBe("Call the bank");
    expect(effectiveTags(s)).toEqual(["bank", "errand"]);
    expect(s.tokens).toEqual([]);
  });

  it("removeTag splices a token out of the text", () => {
    let s = commitSuggestion(type(blank(), "Buy #gro"), "groceries");
    s = type(s, "today");
    s = removeTag(s, "groceries");
    expect(s.text).toBe("Buy today");
    expect(effectiveTags(s)).toEqual([]);
  });

  it("removeTag on a picker tag just drops it", () => {
    const s = removeTag(initialTitleTagField("x", ["a", "b"]), "a");
    expect(effectiveTags(s)).toEqual(["b"]);
    expect(s.text).toBe("x");
  });

  it("newlines are collapsed to spaces", () => {
    const s = onTextChanged(blank(), "a\nb", 3, 3);
    expect(s.text).toBe("a b");
  });

  it("hasTitle is false when only a token is present", () => {
    const s = commitSuggestion(type(blank(), "#a"), "alpha");
    expect(hasTitle(s)).toBe(false);
  });

  it("setPickerSelection reconciles additions and token removals", () => {
    let s = commitSuggestion(type(blank(), "Buy #gro"), "groceries");
    s = addPickerTag(s, "home");
    expect(effectiveTags(s)).toEqual(["groceries", "home"]);
    // picker now unchecks the token tag and adds a new one
    s = setPickerSelection(s, ["home", "urgent"]);
    expect(effectiveTags(s)).toEqual(["home", "urgent"]);
    expect(s.tokens).toEqual([]);
    expect(s.text.trim()).toBe("Buy");
  });
});
