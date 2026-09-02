package com.hvsna.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.graphics.toArgb
import androidx.core.graphics.ColorUtils
import com.hvsna.app.data.Tag

/**
 * User-picked tag colors are chosen against the light theme's white canvas and
 * are frequently far too dark to read on the dark theme's near-black surface.
 *
 * In dark mode every tag color is lifted toward a readable band — raising its
 * HSL lightness (and easing extreme saturation) step by step until it clears
 * WCAG AA contrast (4.5:1, tag labels are small text) against [surface]. Hue is
 * preserved, so "the red tag" still reads as red, just a lighter red. In light
 * mode the stored color is returned untouched.
 */
fun accessibleTagColor(color: Color, surface: Color, isDarkTheme: Boolean): Color {
    if (!isDarkTheme) return color

    val hsl = FloatArray(3)
    ColorUtils.colorToHSL(color.toArgb(), hsl)
    hsl[1] = hsl[1].coerceAtMost(0.9f)

    var lightness = hsl[2].coerceAtLeast(0.6f)
    var result = color
    repeat(12) {
        hsl[2] = lightness
        result = Color(ColorUtils.HSLToColor(hsl))
        if (contrastRatio(result, surface) >= 4.5) return result
        lightness = (lightness + 0.04f).coerceAtMost(1f)
    }
    return result
}

private fun contrastRatio(a: Color, b: Color): Double {
    val la = a.luminance() + 0.05
    val lb = b.luminance() + 0.05
    return if (la > lb) la / lb else lb / la
}

/** The tag's display color for the current theme — see [accessibleTagColor]. */
@Composable
@ReadOnlyComposable
fun Tag.accessibleColor(): Color {
    val surface = MaterialTheme.colorScheme.surface
    return accessibleTagColor(Color(color.toInt()), surface, surface.luminance() < 0.5f)
}
