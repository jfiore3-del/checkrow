# CheckRow

A clean, Google Workspace–style to-do list that lives in the Chrome side panel. It's a browser extension built with plain HTML, CSS and JavaScript, with no build step, no dependencies and no server.

## Features

- **Lists**: create, rename and delete lists. The list menu also clears completed tasks.
- **Smart views**: All tasks, Today (due today or overdue) and Starred.
- **Tasks**: add with Enter, edit titles inline, check off, star and delete. Long names wrap to two lines and expand on hover. The ⋮ on each row slides out the task's options.
- **Inline due dates and priorities**: set them while adding a task, and change them right on the row (click the chip, or the calendar and flag in the ⋮ options).
- **Repeating tasks**: daily, every weekday, weekly, monthly or yearly, from the date menu or the details panel. Completing one creates the next.
- **Details panel**: notes, a checklist of steps, due date, repeat, a reminder, priority (Low / Medium / High) and moving a task to another list.
- **Checklists**: break a task into steps; the row shows progress (2/5).
- **Reminder schedules**: "Remind me every" Mon, Wed… at a time, until the task is done.
- **Reminder buttons**: notifications have *Snooze 1 hour* and *Mark complete*, and can stay on screen until closed (Settings → Notifications).
- **Add to calendar**: send a task's reminder or due date to Google Calendar, Outlook, or any calendar app (.ics), so your phone can remind you even when your computer is off.
- **Reminders on a task**: pick a date and time and a notification pops up then (or when you next open your browser, up to a day late). Click it to open the task. Only one of your computers shows it.
- **Sorting**: Priority (the default), Date, or My order (drag to reorder). Change the default for every list in **Settings**, or sort one list differently from the menu at the top of that list.
- **AI Brief**: one click sends your open tasks (overdue, due today, coming up, by priority) to Claude, ChatGPT, Gemini or Grok for a morning brief. The brief is copied to your clipboard and the assistant opens in a new tab, pre-filled where the site supports it. You can edit the brief first or limit it to one list.
- **Send to chat**: from AI Brief, send your task list to Teams, Slack or Google Chat. It's copied for a quick paste, Add your work email in Settings and Teams opens a chat with yourself with the list already typed, while Google Chat and Gemini open in your work Google account rather than a personal one.
- **Daily reminder**: pick your work days and a time. A notification pops up with a quick summary (overdue, due today, high priority); click it to open AI Brief. If your browser is closed at that time, it reminds you when you next open it that day. Only one of your computers shows it.
- **Toolbar count**: the CheckRow icon shows how many tasks are overdue or due today (red when something is overdue). Can be turned off in Settings.
- **Settings**: daily reminder, toolbar count, backups and archive, default sort order, work email and theme. The default sort syncs to your other computers.
- **Right-click to add**: highlight text, or right-click a link or page, and choose *Add to CheckRow*. The page link goes in the task's details.
- **Keyboard shortcut**: Alt+Shift+K opens CheckRow (change it at chrome://extensions/shortcuts).
- **Safe with two computers**: each part of a task remembers when it last changed, so editing the name on one computer and the date on another keeps both, even if they sync late.
- **Search** across titles and notes.
- **Undo** for completing, deleting and clearing tasks.
- **Light and dark themes**, following the system by default.
- **Sync across computers** through your Chrome account, with no server.
- **Daily backups**: a copy of your tasks is saved on your computer every day (last 7 kept) and can be restored from Settings. You can also export everything to a JSON file and import it back.
- **Archive**: completed tasks move to an archive on your computer 30 days after you finish them, so sync never fills up. View, restore or delete them in Settings.
- **Side panel or full tab**: single column in the side panel; the ↗ button opens a full three-pane view in a tab.

## Where your tasks are saved

There's no CheckRow server. Every change is saved on your computer right away, then synced through your browser account, so your tasks show up on every computer where you're signed in to that browser with sync turned on. Changes from another computer appear live. It's free and there's nothing to host.

Tasks only leave your browser when you use **AI Brief**, and only to the assistant or chat app you pick.

If Chrome sync is off, tasks stay on that computer; Export backup / Import backup moves them by hand.

The bottom of the sidebar shows the current status, e.g. "Synced with your browser account".

**Sync limits (set by the browser):** about 100 KB in total and 511 tasks, counting completed ones. That's plenty for everyday use. The status line warns you when you pass 60%. Completed tasks move to an archive on your computer after 30 days, and *Archive all completed* in Settings frees space right away. Task details are capped at 2,000 characters so each task fits in a sync item.

If you were already using CheckRow on a computer before sync, your existing tasks are merged in the first time you open the new version, and lists with the same name are combined.

## Install it (for testing)

1. Go to `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and choose the `app` folder.
4. Click the CheckRow icon in the toolbar to open it in the side panel. In the side panel, the ↗ button opens CheckRow in a full tab.

The side panel and a full tab share the same data and stay in sync. To sync between computers, install the extension on each one while signed in to the same Chrome account with sync turned on.

## Publishing

Zip the **contents** of the `app` folder (with `manifest.json` at the top level of the zip) and upload it to the
[Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

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
  background.js   opens the side panel; schedules the daily reminder
  icons/          app icons (16, 32, 48, 128 px + SVG)
store-assets/     Chrome Web Store screenshots, promo tiles and icon (see its README)
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
