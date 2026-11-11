# CheckRow: tagged links for sharing

Use a different link for each place you post, so Google Analytics (Reports → Acquisition →
Traffic acquisition) shows which posts bring visitors and installs.

Replace `ITEM_ID` with your item ID from the Chrome Web Store Developer Dashboard
(the 32-letter ID shown under CheckRow's name).

| Where | Link |
| --- | --- |
| Instagram (bio or story) | `https://chromewebstore.google.com/detail/ITEM_ID?utm_source=instagram&utm_medium=social&utm_campaign=launch` |
| X | `https://chromewebstore.google.com/detail/ITEM_ID?utm_source=x&utm_medium=social&utm_campaign=launch` |
| LinkedIn | `https://chromewebstore.google.com/detail/ITEM_ID?utm_source=linkedin&utm_medium=social&utm_campaign=launch` |
| Facebook | `https://chromewebstore.google.com/detail/ITEM_ID?utm_source=facebook&utm_medium=social&utm_campaign=launch` |
| Reddit | `https://chromewebstore.google.com/detail/ITEM_ID?utm_source=reddit&utm_medium=community&utm_campaign=launch` |
| Product Hunt | `https://chromewebstore.google.com/detail/ITEM_ID?utm_source=producthunt&utm_medium=launch&utm_campaign=launch` |
| Hacker News | `https://chromewebstore.google.com/detail/ITEM_ID?utm_source=hackernews&utm_medium=community&utm_campaign=launch` |
| AlternativeTo | `https://chromewebstore.google.com/detail/ITEM_ID?utm_source=alternativeto&utm_medium=directory` |
| Email / text to friends | `https://chromewebstore.google.com/detail/ITEM_ID?utm_source=email&utm_medium=personal&utm_campaign=launch` |
| Email signature | `https://chromewebstore.google.com/detail/ITEM_ID?utm_source=signature&utm_medium=email` |
| Website / GitHub | `https://chromewebstore.google.com/detail/ITEM_ID?utm_source=website&utm_medium=referral` |
| Asking friends for a review (opens the Reviews tab) | `https://chromewebstore.google.com/detail/ITEM_ID/reviews?utm_source=email&utm_medium=personal&utm_campaign=reviews` |

Inside CheckRow (already built in, no setup):
- Review card after 20 completed tasks: `utm_source=app&utm_medium=review_prompt`
- Settings → Rate it: `utm_source=app&utm_medium=settings_rate`
- Settings → Copy link to share: `utm_source=share&utm_medium=app`

For a new campaign later (a newsletter, a video), copy any link and change `utm_campaign`.
