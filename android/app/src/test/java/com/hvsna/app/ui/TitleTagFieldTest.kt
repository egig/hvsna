package com.hvsna.app.ui

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class TitleTagFieldTest {

    /** Type [insert] at the current caret (assumes caret == selectionEnd, no selection). */
    private fun TitleTagFieldState.type(insert: String): TitleTagFieldState {
        val at = selectionEnd
        val newText = text.substring(0, at) + insert + text.substring(at)
        return onTextChanged(newText, at + insert.length, at + insert.length)
    }

    /** Backspace [n] times from the current caret. */
    private fun TitleTagFieldState.backspace(n: Int = 1): TitleTagFieldState {
        var s = this
        repeat(n) {
            val at = s.selectionEnd
            if (at == 0) return@repeat
            s = s.onTextChanged(s.text.removeRange(at - 1, at), at - 1, at - 1)
        }
        return s
    }

    private fun blank() = TitleTagFieldState.initial("", emptyList())

    @Test
    fun `active query is exposed while typing a hash run`() {
        val s = blank().type("Buy #gro")
        val q = s.activeQuery()
        assertEquals("gro", q?.query)
        assertTrue(s.tokens.isEmpty())
        assertEquals(emptyList<String>(), s.effectiveTagIds)
    }

    @Test
    fun `no active query without a preceding space`() {
        assertNull(blank().type("Buy#gro").activeQuery())
    }

    @Test
    fun `no active query for a bare hash`() {
        assertNull(blank().type("Buy #").activeQuery())
    }

    @Test
    fun `commit inserts the token, links the tag and adds a trailing space`() {
        val s = blank().type("Buy #gro").commitSuggestion("t1", "groceries")
        assertEquals("Buy #groceries ", s.text)
        assertEquals(listOf("t1"), s.effectiveTagIds)
        assertEquals(1, s.tokens.size)
        assertEquals(4, s.tokens[0].start)
        assertNull(s.activeQuery())
    }

    @Test
    fun `commit in the middle keeps later text and later tokens aligned`() {
        var s = blank().type("a #one").commitSuggestion("t1", "one")
        s = s.type("b #two").commitSuggestion("t2", "two")
        s = s.type("tail")
        // caret now at end; go type a new hash run before "tail"
        assertEquals("a #one b #two tail", s.text)
        assertEquals(listOf("t1", "t2"), s.effectiveTagIds)
        s.tokens.forEach { assertEquals(it.displayText, s.text.substring(it.start, it.end)) }
    }

    @Test
    fun `atomic backspace at token edge removes the whole token and unlinks the tag`() {
        var s = blank().type("Buy #gro").commitSuggestion("t1", "groceries")
        // caret is after the trailing space -> one backspace kills the space, next hits token
        s = s.backspace(1) // removes trailing space
        assertEquals("Buy #groceries", s.text)
        s = s.backspace(1) // touches token
        assertEquals("Buy", s.text)
        assertEquals(emptyList<String>(), s.effectiveTagIds)
        assertTrue(s.tokens.isEmpty())
    }

    @Test
    fun `editing inside a token drops it entirely`() {
        var s = blank().type("#gro").commitSuggestion("t1", "groceries")
        // put caret inside "groceries" and type
        s = s.copy(selectionStart = 5, selectionEnd = 5).type("X")
        assertFalse(s.effectiveTagIds.contains("t1"))
        assertTrue(s.tokens.isEmpty())
    }

    @Test
    fun `select-all delete clears text and every token`() {
        var s = blank().type("Buy #a").commitSuggestion("t1", "alpha")
        s = s.type("and #b").commitSuggestion("t2", "beta")
        s = s.onTextChanged("", 0, 0)
        assertEquals("", s.text)
        assertEquals(emptyList<String>(), s.effectiveTagIds)
    }

    @Test
    fun `committing a picker tag promotes it out of the picker set`() {
        var s = TitleTagFieldState.initial("Buy milk", listOf("t1"))
        assertEquals(listOf("t1"), s.effectiveTagIds)
        s = s.copy(selectionStart = s.text.length, selectionEnd = s.text.length)
            .type(" #mi").commitSuggestion("t1", "milk")
        assertEquals(listOf("t1"), s.effectiveTagIds)
        assertEquals(emptyList<String>(), s.pickerTagIds)
        assertEquals(1, s.tokens.size)
    }

    @Test
    fun `committing an already-committed tag does not duplicate`() {
        var s = blank().type("#a").commitSuggestion("t1", "alpha")
        s = s.type("#a").commitSuggestion("t1", "alpha")
        assertEquals(listOf("t1"), s.effectiveTagIds)
        assertEquals(1, s.tokens.size)
    }

    @Test
    fun `stripped title removes tokens at start middle and end with clean whitespace`() {
        var s = blank().type("#a").commitSuggestion("t1", "alpha")
        s = s.type("buy #b").commitSuggestion("t2", "beta")
        s = s.type("milk #c").commitSuggestion("t3", "gamma")
        assertEquals("buy milk", s.strippedTitle)
        assertEquals(listOf("t1", "t2", "t3"), s.effectiveTagIds)
    }

    @Test
    fun `editing an existing task keeps the title clean and tags in the picker set`() {
        val s = TitleTagFieldState.initial("Call the bank", listOf("t1", "t2"))
        assertEquals("Call the bank", s.strippedTitle)
        assertEquals(listOf("t1", "t2"), s.effectiveTagIds)
        assertTrue(s.tokens.isEmpty())
    }

    @Test
    fun `removeTag splices a token out of the text`() {
        var s = blank().type("Buy #gro").commitSuggestion("t1", "groceries")
        s = s.type("today")
        s = s.removeTag("t1")
        assertEquals("Buy today", s.text)
        assertEquals(emptyList<String>(), s.effectiveTagIds)
    }

    @Test
    fun `removeTag on a picker tag just drops it`() {
        val s = TitleTagFieldState.initial("x", listOf("t1", "t2")).removeTag("t1")
        assertEquals(listOf("t2"), s.effectiveTagIds)
        assertEquals("x", s.text)
    }

    @Test
    fun `newlines are collapsed to spaces`() {
        val s = blank().onTextChanged("a\nb", 3, 3)
        assertEquals("a b", s.text)
    }

    @Test
    fun `hasTitle is false when only a token is present`() {
        val s = blank().type("#a").commitSuggestion("t1", "alpha")
        assertFalse(s.hasTitle)
    }
}
