# CheckRow store graphics

Everything needed for the image sections of the Chrome Web Store listing. All screenshots show the real extension (version 0.9.6) with sample tasks.

## Chrome Web Store (Developer Dashboard → Store listing)

| Slot | File | Size |
| --- | --- | --- |
| Store icon | Comes from the extension package (`app/icons/checkrow-128.png`, same as `store-icon-128.png` here) | 128×128, 96×96 artwork + transparent padding |
| Screenshots (up to 5) | `screenshots/screenshot-1-side-panel` … `screenshot-5-private-dark` | 1280×800 |
| Small promo tile | `promo/promo-small-440x280.png` | 440×280 |
| Marquee promo tile (optional) | `promo/promo-marquee-1400x560.png` | 1400×560 |

Chrome allows five screenshots. Upload them in order:

1. Side panel + right-click “Add to CheckRow” + Alt+Shift+K
2. Sub-tasks with the green progress bar
3. Reminders: Once/Repeating, Snooze and Mark complete, Add to calendar
4. AI Brief
5. Dark theme, list switcher, privacy (no account, no tracking, backups, sync)

The store description is in `DESCRIPTION.txt`.

## Notes

- The promo tiles have no text, as Google recommends (they aren't translated), so they work in every language.
- Screenshots are full-bleed with square corners and no transparency, as the store requires.
- If the app's look changes, re-capture before the next listing update so the screenshots stay accurate.
