# Offday design system

A light, restrained product interface for checking team availability during the workday. The calendar is the primary surface; approvals sit alongside it. Responsive layouts collapse the sidebar and move approvals below the calendar. The calendar retains a readable minimum width with local horizontal scrolling on phones.

## Visual language

- Self-hosted DM Sans, regular body and medium/semibold labels.
- Pure white panels on a very light neutral canvas.
- Crimson primary: `oklch(.49 .17 10)`; pale crimson selection states.
- Vacation: mint, sick leave: blue, personal leave: amber. Pending leave has an outlined treatment and clock icon so color is not the only indicator.
- 7px controls, 10px panels, 12px native dialogs; borders provide structure without decorative card shadows.
- Strong visible keyboard focus, native form controls and dialogs, reduced-motion support.

## Behavior

Forms show busy and error states. Successful actions show concise status feedback. Empty states describe the next useful action. Employee and manager capabilities are enforced on the server and reflected in the interface.
