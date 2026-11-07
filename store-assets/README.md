# CheckRow store graphics

Everything needed for the image sections of the Chrome Web Store and Microsoft Edge Add-ons listings. All screenshots show the real extension (version 0.6.1) with sample tasks.

## Chrome Web Store (Developer Dashboard → Store listing)

| Slot | File | Size |
| --- | --- | --- |
| Store icon | Comes from the extension package (`app/icons/checkrow-128.png`, same as `store-icon-128.png` here) | 128×128, 96×96 artwork + transparent padding |
| Screenshots (up to 5) | `screenshots/screenshot-1` … `screenshot-5` | 1280×800 |
| Small promo tile | `promo/promo-small-440x280.png` | 440×280 |
| Marquee promo tile (optional) | `promo/promo-marquee-1400x560.png` | 1400×560 |

Chrome allows five screenshots. Use 1–5; `screenshot-6-full-tab.png` is for Edge, or swap it in if you prefer it over one of the others.

## Microsoft Edge Add-ons (Partner Center → Store listings)

| Slot | File | Size |
| --- | --- | --- |
| Extension logo | `edge-logo-300.png` | 300×300 |
| Screenshots (up to 6) | `screenshots/screenshot-1` … `screenshot-6` | 1280×800 |
| Small promotional tile (optional) | `promo/promo-small-440x280.png` | 440×280 |
| Large promotional tile (optional) | `promo/promo-marquee-1400x560.png` | 1400×560 |

## Notes

- The promo tiles have no text, as Google recommends (they aren't translated), so they work in every language.
- Screenshots are full-bleed with square corners and no transparency, as both stores require.
- If the app's look changes, re-capture before the next listing update so the screenshots stay accurate.
