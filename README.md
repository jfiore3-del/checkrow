# CheckRow

A clean, Google Workspace–style to-do list. Plain HTML, CSS and JavaScript with no build step and no dependencies. It runs as a normal web page or as a Chrome/Edge extension that opens in the browser's side panel.

## Features

- **Lists**: create, rename and delete lists. The list menu also clears completed tasks.
- **Smart views**: All tasks, Today (due today or overdue) and Starred.
- **Tasks**: add with Enter, edit titles inline, check off, and star.
- **Details panel**: notes, due date, priority (Low / Medium / High) and moving a task to another list.
- **Sorting**: My order (drag to reorder), Date, or Priority.
- **Search** across titles and notes.
- **Undo** for completing, deleting and clearing tasks.
- **Light and dark themes**, following the system by default.
- **Backups**: export everything to a JSON file and import it back.
- **Responsive**: full three-pane layout on desktop, single column in the side panel or on a phone.

Tasks are stored in the browser's local storage on your device. Nothing is sent to a server.

## Run it

### As a web page

Open `app/index.html` in a browser. To serve it locally instead:

```sh
cd app
python3 -m http.server 8080
# then visit http://localhost:8080
```

### As a Chrome or Edge extension

1. Go to `chrome://extensions` (or `edge://extensions`).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and choose the `app` folder.
4. Click the CheckRow icon in the toolbar to open it in the side panel. In the side panel, the ↗ button opens CheckRow in a full tab.

The side panel and a full tab share the same data and stay in sync.

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
  index.html      page shell
  styles.css      all styles and light/dark theme tokens
  app.js          state, rendering and interactions
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
