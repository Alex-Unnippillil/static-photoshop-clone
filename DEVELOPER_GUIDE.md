# Developer Guide

## Accessibility

- Tool buttons should expose their toggle state via the `aria-pressed` attribute.
- `src/editor.ts` initializes each toolbar button with `aria-pressed="false"` and updates the value as tools become active so screen readers receive accurate state changes.
- The styling in `style.css` responds to `[aria-pressed="true"]`, so ensure any new toolbar buttons keep the attribute in sync to preserve both visual and assistive feedback.
