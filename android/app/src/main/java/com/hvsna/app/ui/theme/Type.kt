package com.hvsna.app.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.font.FontFamily

// Material's default type scale, with every style set to the serif font family.
private val defaultTypography = Typography()

val Typography = defaultTypography.copy(
    displayLarge = defaultTypography.displayLarge.copy(fontFamily = FontFamily.Serif),
    displayMedium = defaultTypography.displayMedium.copy(fontFamily = FontFamily.Serif),
    displaySmall = defaultTypography.displaySmall.copy(fontFamily = FontFamily.Serif),
    headlineLarge = defaultTypography.headlineLarge.copy(fontFamily = FontFamily.Serif),
    headlineMedium = defaultTypography.headlineMedium.copy(fontFamily = FontFamily.Serif),
    headlineSmall = defaultTypography.headlineSmall.copy(fontFamily = FontFamily.Serif),
    titleLarge = defaultTypography.titleLarge.copy(fontFamily = FontFamily.Serif),
    titleMedium = defaultTypography.titleMedium.copy(fontFamily = FontFamily.Serif),
    titleSmall = defaultTypography.titleSmall.copy(fontFamily = FontFamily.Serif),
    bodyLarge = defaultTypography.bodyLarge.copy(fontFamily = FontFamily.Serif),
    bodyMedium = defaultTypography.bodyMedium.copy(fontFamily = FontFamily.Serif),
    bodySmall = defaultTypography.bodySmall.copy(fontFamily = FontFamily.Serif),
    labelLarge = defaultTypography.labelLarge.copy(fontFamily = FontFamily.Serif),
    labelMedium = defaultTypography.labelMedium.copy(fontFamily = FontFamily.Serif),
    labelSmall = defaultTypography.labelSmall.copy(fontFamily = FontFamily.Serif),
)
