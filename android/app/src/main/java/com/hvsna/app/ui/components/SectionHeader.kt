package com.hvsna.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.vectorResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hvsna.app.R
import com.hvsna.app.i18n.LocalStrings

/**
 * Collapsible list-section header shared by every task list that groups its rows — the Today
 * screen (Overdue / per-prayer / Completed), the Upcoming screen's date buckets, and a tag's
 * detail screen. Mirrors the web app's `TaskGroupCollapsible` + `TaskGroupLabel`
 * (packages/app/src/modules/task/): a bold label, an optional muted count, and a trailing
 * chevron. The chevron only appears while collapsed — a closed section reads as "tap to open",
 * while an expanded one doesn't need an affordance since its rows are already visible below it.
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
    color: Color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
    count: Int? = null,
    background: Color? = null,
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier
            .fillMaxWidth()
            .then(if (background != null) Modifier.background(background) else Modifier)
            .clickable { onToggle() }
            .padding(start = 14.dp, end = 14.dp, top = 14.dp, bottom = 14.dp),
    ) {
        Text(
            label,
            fontWeight = FontWeight.Bold,
            fontSize = 14.sp,
            color = color,
            style = TextStyle(
                lineHeight = 14.sp,
                lineHeightStyle = LineHeightStyle(
                    alignment = LineHeightStyle.Alignment.Center,
                    trim = LineHeightStyle.Trim.Both,
                ),
            ),
        )
        if (count != null) {
            Text(
                " ($count)",
                fontWeight = FontWeight.Normal,
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = TextStyle(
                    lineHeight = 14.sp,
                    lineHeightStyle = LineHeightStyle(
                        alignment = LineHeightStyle.Alignment.Center,
                        trim = LineHeightStyle.Trim.Both,
                    ),
                ),
            )
        }
        if (!isExpanded) {
            Spacer(Modifier.weight(1f))
            Icon(
                imageVector = ImageVector.vectorResource(id = R.drawable.ic_chevron_right),
                contentDescription = LocalStrings.current["a11y.expand"],
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(14.dp),
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
                    count = 3,
                )
            }
        }
    }
}
