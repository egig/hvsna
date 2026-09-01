package com.hvsna.app.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.vectorResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hvsna.app.R

/**
 * Collapsible list-section header shared by every task list that groups its rows — the Today
 * screen (Overdue / per-prayer / Completed), the Upcoming screen's date buckets, and a tag's
 * detail screen. Mirrors the web app's `TaskGroupCollapsible` + `TaskGroupLabel`
 * (packages/app/src/modules/task/): a leading chevron, a bold label, and an optional muted
 * count, so the grouping UX reads the same across platforms.
 *
 * Pass [background] (usually `MaterialTheme.colorScheme.surface`) when the header is used as a
 * `stickyHeader` so scrolled content doesn't show through the pinned row.
 */
@Composable
fun SectionHeader(
    label: String,
    isExpanded: Boolean,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier,
    color: Color = MaterialTheme.colorScheme.onSurface,
    count: Int? = null,
    background: Color? = null,
) {
    val chevronRotation by animateFloatAsState(
        targetValue = if (isExpanded) 0f else -90f,
        label = "chevron",
    )
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier
            .fillMaxWidth()
            .then(if (background != null) Modifier.background(background) else Modifier)
            .clickable { onToggle() }
            .padding(start = 20.dp, end = 20.dp, top = 16.dp, bottom = 6.dp),
    ) {
        Icon(
            imageVector = ImageVector.vectorResource(id = R.drawable.ic_chevron_down),
            contentDescription = if (isExpanded) "Collapse" else "Expand",
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier
                .rotate(chevronRotation)
                .size(14.dp),
        )
        Spacer(Modifier.width(6.dp))
        Text(
            label,
            fontWeight = FontWeight.Bold,
            fontSize = 14.sp,
            color = color,
        )
        if (count != null) {
            Text(
                " ($count)",
                fontWeight = FontWeight.Normal,
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Preview
@Composable
private fun SectionHeaderPreview() {
    MaterialTheme {
        Surface {
            Column {
                SectionHeader("Overdue", isExpanded = true, onToggle = {}, color = MaterialTheme.colorScheme.error)
                SectionHeader("Fajr (04:38)", isExpanded = true, onToggle = {})
                SectionHeader("Dhuhr (11:52)", isExpanded = false, onToggle = {})
                SectionHeader("This Week", isExpanded = true, onToggle = {})
                SectionHeader(
                    "Completed",
                    isExpanded = false,
                    onToggle = {},
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    count = 3,
                )
            }
        }
    }
}
