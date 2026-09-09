package com.hvsna.app.ui

/**
 * Pure state machine behind the task sheet's title input. The title field doubles as a fast
 * tag-entry path: typing `#name` opens an autosuggest popup, and picking a suggestion commits
 * a *token* — a colored `#name` span that stays inline while editing but is stripped back out
 * of `task.title` on save. Tags added through the separate Tags button live in [pickerTagIds]
 * and never appear in the text.
 *
 * Design decisions (see the grilling session that produced this):
 * - A token commits **only** on suggestion tap, never on space/enter. Untapped `#word` text is
 *   just text and survives to the saved title verbatim.
 * - Tokens are **atomic**: any edit touching a token's characters deletes the whole token and
 *   unlinks its tag. No partial editing.
 * - token <-> tag is 1:1 and so is pickerTag <-> tag. Committing a suggestion for a tag that is
 *   currently a picker tag **promotes** it (drops it from [pickerTagIds]); committing one that
 *   is already a token is a no-op beyond clearing the typed query.
 * - Removing a tag (atomic delete in the text, or unchecking it in the Tags picker) always
 *   reconciles both sides.
 *
 * Deliberately free of Android / Compose types so it can be unit-tested directly. The Compose
 * layer converts to/from `TextFieldValue` and renders [activeQuery] as a popup.
 */
data class TitleTagFieldState(
    val text: String = "",
    val selectionStart: Int = 0,
    val selectionEnd: Int = 0,
    /** Committed `#name` spans, kept sorted by [CommittedTag.start], non-overlapping. */
    val tokens: List<CommittedTag> = emptyList(),
    /** Tags added via the Tags button; never present in [text]. Order = insertion order. */
    val pickerTagIds: List<String> = emptyList(),
) {
    /** Effective tag set for saving: token tags in text order, then picker tags. Deduped. */
    val effectiveTagIds: List<String>
        get() = (tokens.map { it.tagId } + pickerTagIds).distinct()

    /** [text] with every committed token spliced out, whitespace collapsed and trimmed. */
    val strippedTitle: String
        get() = removeRanges(text, tokens.map { it.start until it.end }).first
            .replace(WHITESPACE_RUN, " ")
            .trim()

    /** True once there is a non-blank title after tokens are stripped. */
    val hasTitle: Boolean
        get() = strippedTitle.isNotBlank()

    /**
     * The `#…` run the caret currently sits at the end of, or null. Only reported when there is
     * a plain caret (no selection), the run is preceded by whitespace or start-of-text, and the
     * `#` does not belong to an existing committed token.
     */
    fun activeQuery(): ActiveQuery? {
        if (selectionStart != selectionEnd) return null
        val caret = selectionEnd
        if (caret > text.length) return null
        var i = caret
        while (i > 0 && !text[i - 1].isWhitespace() && text[i - 1] != '#') i--
        if (i == 0 || text[i - 1] != '#') return null
        val hashIndex = i - 1
        if (hashIndex != 0 && !text[hashIndex - 1].isWhitespace()) return null
        if (tokens.any { it.start == hashIndex }) return null
        if (i == caret) return null // bare "#", nothing typed yet
        return ActiveQuery(hashIndex = hashIndex, caret = caret, query = text.substring(i, caret))
    }

    // --- transitions -------------------------------------------------------------------------

    /** Fold a raw edit from the text field (newlines already collapsed to spaces by the caller). */
    fun onTextChanged(newText: String, newSelStart: Int, newSelEnd: Int): TitleTagFieldState {
        val filtered = newText.replace(NEWLINES, " ")
        val selS = newSelStart.coerceIn(0, filtered.length)
        val selE = newSelEnd.coerceIn(0, filtered.length)

        if (filtered == text) return copy(selectionStart = selS, selectionEnd = selE)

        // Clearing the whole field (select-all + delete) drops every token.
        if (filtered.isBlank()) {
            return TitleTagFieldState(
                text = filtered,
                selectionStart = selS,
                selectionEnd = selE,
                tokens = emptyList(),
                pickerTagIds = pickerTagIds,
            )
        }

        val prefix = commonPrefixLen(text, filtered)
        val suffix = commonSuffixLen(text, filtered, prefix)
        val changeStart = prefix
        val changeEnd = (text.length - suffix).coerceAtLeast(prefix)
        val delta = filtered.length - text.length

        val touched = tokens.filter { it.start < changeEnd && it.end > changeStart }

        if (touched.isEmpty()) {
            val shifted = tokens.map { if (it.start >= changeEnd) it.copy(start = it.start + delta) else it }
            return copy(text = filtered, tokens = shifted, selectionStart = selS, selectionEnd = selE)
        }

        // An edit touched a token -> that touch is interpreted purely as "delete the token".
        // The raw keystroke is discarded; we rebuild from the previous text minus touched tokens.
        val (rebuilt, caret) = removeRanges(text, touched.map { it.start until it.end })
        val survivors = (tokens - touched.toSet()).map { tok ->
            val removedBefore = touched.filter { it.end <= tok.start }.sumOf { it.end - it.start }
            tok.copy(start = tok.start - removedBefore)
        }
        val collapsed = collapseWhitespace(rebuilt, caret)
        return copy(
            text = collapsed.first,
            tokens = shiftForCollapse(survivors, rebuilt, collapsed.first),
            selectionStart = collapsed.second,
            selectionEnd = collapsed.second,
        )
    }

    /** Commit the currently-typed `#…` run as [tagId] / [name]. No-op if there is no active query. */
    fun commitSuggestion(tagId: String, name: String): TitleTagFieldState {
        val active = activeQuery() ?: return this

        // Already a token: just clear the typed query, keep a single token.
        if (tokens.any { it.tagId == tagId }) {
            val rebuilt = text.removeRange(active.hashIndex, active.caret)
            val shifted = tokens.map {
                if (it.start >= active.caret) it.copy(start = it.start - (active.caret - active.hashIndex)) else it
            }
            return copy(
                text = rebuilt,
                tokens = shifted,
                selectionStart = active.hashIndex,
                selectionEnd = active.hashIndex,
            )
        }

        val tokenText = "#$name"
        val needsSpace = active.caret >= text.length || !text[active.caret].isWhitespace()
        val insert = if (needsSpace) "$tokenText " else tokenText
        val rebuilt = text.replaceRange(active.hashIndex, active.caret, insert)
        val lengthDelta = insert.length - (active.caret - active.hashIndex)
        val caret = active.hashIndex + insert.length

        val newToken = CommittedTag(start = active.hashIndex, name = name, tagId = tagId)
        val shifted = tokens.map {
            if (it.start >= active.caret) it.copy(start = it.start + lengthDelta) else it
        }
        return copy(
            text = rebuilt,
            tokens = (shifted + newToken).sortedBy { it.start },
            pickerTagIds = pickerTagIds - tagId,
            selectionStart = caret,
            selectionEnd = caret,
        )
    }

    /** Add [tagId] via the Tags picker (no token in the text). No-op if already effective. */
    fun addPickerTag(tagId: String): TitleTagFieldState {
        if (tagId in effectiveTagIds) return this
        return copy(pickerTagIds = pickerTagIds + tagId)
    }

    /** Remove [tagId] from wherever it lives — token (splice the text) or picker set. */
    fun removeTag(tagId: String): TitleTagFieldState {
        val token = tokens.firstOrNull { it.tagId == tagId }
        if (token != null) {
            val (rebuilt, caret) = removeRanges(text, listOf(token.start until token.end))
            val collapsed = collapseWhitespace(rebuilt, caret)
            val survivors = (tokens - token).map { it.copy(start = if (it.start >= token.end) it.start - (token.end - token.start) else it.start) }
            return copy(
                text = collapsed.first,
                tokens = shiftForCollapse(survivors, rebuilt, collapsed.first),
                selectionStart = collapsed.second,
                selectionEnd = collapsed.second,
            )
        }
        return copy(pickerTagIds = pickerTagIds - tagId)
    }

    companion object {
        private val WHITESPACE_RUN = Regex("\\s+")
        private val NEWLINES = Regex("[\\r\\n]+")

        fun initial(text: String, pickerTagIds: List<String>): TitleTagFieldState =
            TitleTagFieldState(
                text = text,
                selectionStart = text.length,
                selectionEnd = text.length,
                tokens = emptyList(),
                pickerTagIds = pickerTagIds,
            )
    }
}

/** A committed `#name` span. [start] is the index of `#` in the title text. */
data class CommittedTag(val start: Int, val name: String, val tagId: String) {
    /** Exclusive end index (past the last char of `name`). */
    val end: Int get() = start + 1 + name.length
    val displayText: String get() = "#$name"
}

/** The `#…` run under the caret. [hashIndex] is the `#`; [caret] is where typing stops. */
data class ActiveQuery(val hashIndex: Int, val caret: Int, val query: String)

private fun commonPrefixLen(a: String, b: String): Int {
    val max = minOf(a.length, b.length)
    var i = 0
    while (i < max && a[i] == b[i]) i++
    return i
}

private fun commonSuffixLen(a: String, b: String, prefixLen: Int): Int {
    val max = minOf(a.length, b.length) - prefixLen
    var i = 0
    while (i < max && a[a.length - 1 - i] == b[b.length - 1 - i]) i++
    return i
}

/** Remove [ranges] (half-open) from [s]; returns the new string and a caret at the first cut. */
private fun removeRanges(s: String, ranges: List<IntRange>): Pair<String, Int> {
    if (ranges.isEmpty()) return s to s.length
    val sorted = ranges.sortedBy { it.first }
    val sb = StringBuilder()
    var cursor = 0
    var caret = sorted.first().first
    for (r in sorted) {
        if (r.first > cursor) sb.append(s, cursor, r.first)
        cursor = r.last + 1
    }
    if (cursor < s.length) sb.append(s, cursor, s.length)
    caret = caret.coerceIn(0, sb.length)
    return sb.toString() to caret
}

/** Collapse runs of whitespace to a single space and trim; keep [caret] pointing at the same spot. */
private fun collapseWhitespace(s: String, caret: Int): Pair<String, Int> {
    val sb = StringBuilder()
    var newCaret = caret
    var i = 0
    var prevSpace = false
    while (i < s.length) {
        val c = s[i]
        if (c.isWhitespace()) {
            if (prevSpace || sb.isEmpty()) {
                if (i < caret) newCaret--
            } else {
                sb.append(' ')
            }
            prevSpace = true
        } else {
            sb.append(c)
            prevSpace = false
        }
        i++
    }
    // trailing space
    if (sb.isNotEmpty() && sb.last() == ' ') {
        sb.setLength(sb.length - 1)
        if (caret >= sb.length + 1) newCaret--
    }
    newCaret = newCaret.coerceIn(0, sb.length)
    return sb.toString() to newCaret
}

/** Re-map token starts after [collapseWhitespace] rewrote [before] into [after]. */
private fun shiftForCollapse(tokens: List<CommittedTag>, before: String, after: String): List<CommittedTag> {
    if (before == after) return tokens
    return tokens.mapNotNull { tok ->
        val idx = after.indexOf(tok.displayText)
        if (idx < 0) null else tok.copy(start = idx)
    }.sortedBy { it.start }
}
