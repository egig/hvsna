package com.hvsna.app.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class CityCatalogTest {
    @Test
    fun searchIsCaseInsensitiveAndPrefersPrefixMatches() {
        val results = CityCatalog.search("jak")
        assertTrue(results.isNotEmpty())
        assertTrue(results.first().name.startsWith("Jakarta"))
    }

    @Test
    fun blankQueryReturnsNothing() {
        assertTrue(CityCatalog.search("  ").isEmpty())
    }

    @Test
    fun nearestResolvesWithinRadiusAndNullOutsideIt() {
        assertEquals("Bandung, Indonesia", CityCatalog.nearest(-6.92, 107.62)?.name)
        assertNull(CityCatalog.nearest(-40.0, -140.0)) // open ocean
    }
}
