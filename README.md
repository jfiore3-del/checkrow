# CheckRow

A clean, Google Workspace–style to-do list that lives in the Chrome or Edge side panel. It's a browser extension built with plain HTML, CSS and JavaScript, with no build step, no dependencies and no server.

## Features

- **Lists**: create, rename and delete lists. The list menu also clears completed tasks.
- **Smart views**: All tasks, Today (due today or overdue) and Starred.
- **Tasks**: add with Enter, edit titles inline, check off, and star.
- **Inline due dates and priorities**: set them while adding a task, and change them right on the row (click the chip, or the calendar and flag icons that appear on hover).
- **Details panel**: notes, due date, priority (Low / Medium / High) and moving a task to another list.
- **Sorting**: My order (drag to reorder), Date, or Priority.
- **Search** across titles and notes.
- **Undo** for completing, deleting and clearing tasks.
- **Light and dark themes**, following the system by default.
- **Sync across computers** through your Chrome or Edge account, with no server.
- **Backups**: export everything to a JSON file and import it back.
- **Side panel or full tab**: single column in the side panel; the ↗ button opens a full three-pane view in a tab.

## Where your tasks are saved

There's no CheckRow server. Every change is saved on your computer right away, then synced through your browser account, so your tasks show up on every computer where you're signed in to that browser with sync turned on. Changes from another computer appear live. It's free and there's nothing to host.

Chrome and Edge each sync within their own accounts; they don't sync with each other. If browser sync is off, tasks stay on that computer; Export backup / Import backup moves them by hand.

The bottom of the sidebar shows the current status, e.g. "Synced with your browser account".

**Sync limits (set by the browser):** about 100 KB in total and 511 tasks, counting completed ones. That's plenty for everyday use. The status line warns you when you pass 60%, and *Delete all completed tasks* in a list's ⋮ menu frees space. Task details are capped at 2,000 characters so each task fits in a sync item.

If you were already using CheckRow on a computer before sync, your existing tasks are merged in the first time you open the new version, and lists with the same name are combined.

## Install it (for testing)

1. Go to `chrome://extensions` (or `edge://extensions`).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and choose the `app` folder.
4. Click the CheckRow icon in the toolbar to open it in the side panel. In the side panel, the ↗ button opens CheckRow in a full tab.

The side panel and a full tab share the same data and stay in sync. To sync between computers, install the extension on each one while signed in to the same Chrome (or Edge) account with sync turned on.

## Publishing

Zip the **contents** of the `app` folder (with `manifest.json` at the top level of the zip) and upload it to the
[Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) and the
[Microsoft Edge Add-ons Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview).

```sh
cd app && zip -r ../checkrow-extension.zip . -x '.*'
```

## Project structure

```
app/
  index.html      the screen shown in the side panel or tab
  styles.css      all styles and light/dark theme tokens
  app.js          state, rendering, interactions and browser-account sync
  manifest.json   extension manifest (Manifest V3, side panel)
  background.js   opens the side panel from the toolbar icon
  icons/          app icons (16, 32, 48, 128 px + SVG)
brand/
  checkrow-icon.svg, checkrow-icon-dark.svg, checkrow-favicon.svg
  png/            icon exports
  design/         logo canvas source
```

## Brand

- Row blue `#2F6FEB`
- Done green `#22A06B`
- Row amber `#F2A900`
- Ink `#1F2328`

Wordmark: "CheckRow" in [Outfit](https://fonts.google.com/specimen/Outfit) Medium, −1.5 px tracking.
