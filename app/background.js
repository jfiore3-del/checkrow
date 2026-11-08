// CheckRow background service worker.
// - Opens the side panel from the toolbar icon.
// - Runs the optional daily reminder: on the chosen days and time it shows a
//   notification; clicking it opens CheckRow with the AI Brief window.

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.error('CheckRow: could not set side panel behavior', err));

const ALARM = 'checkrow-brief';
const NOTE_PREFIX = 'checkrow-brief';
const DEFAULT_REMINDER = { on: false, days: [1, 2, 3, 4, 5], time: '08:30' };

const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

async function getReminder() {
  const { reminder } = await chrome.storage.sync.get('reminder');
  const r = { ...DEFAULT_REMINDER, ...(reminder || {}) };
  if (!/^\d{2}:\d{2}$/.test(r.time)) r.time = DEFAULT_REMINDER.time;
  if (!Array.isArray(r.days)) r.days = DEFAULT_REMINDER.days;
  return r;
}

function at(date, time) {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

// Next reminder time strictly after `from`, on one of the chosen days.
function nextOccurrence(r, from = new Date()) {
  for (let i = 0; i < 8; i += 1) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    if (!r.days.includes(d.getDay())) continue;
    const t = at(d, r.time);
    if (t > from) return t;
  }
  return null;
}

async function schedule() {
  await chrome.alarms.clear(ALARM);
  const r = await getReminder();
  if (!r.on || !r.days.length) return;
  const next = nextOccurrence(r);
  if (next) await chrome.alarms.create(ALARM, { when: next.getTime() });
}

// Show today's reminder if it's a chosen day, the time has passed, and no computer
// signed in to this browser account has shown it yet today. Covers a computer that
// was asleep or had the browser closed at reminder time.
async function remindIfDue() {
  const r = await getReminder();
  if (!r.on) return;
  const now = new Date();
  if (!r.days.includes(now.getDay())) return;
  if (now < at(now, r.time)) return;
  const today = dayKey(now);
  const { reminderLast } = await chrome.storage.sync.get('reminderLast');
  if (reminderLast === today) return;
  await chrome.storage.sync.set({ reminderLast: today });
  await showReminder();
}

async function taskCounts() {
  const all = await chrome.storage.sync.get(null);
  const today = dayKey(new Date());
  const c = { open: 0, overdue: 0, dueToday: 0, high: 0 };
  for (const [k, v] of Object.entries(all)) {
    if (!k.startsWith('t:') || !v || v.x) continue;
    c.open += 1;
    if (v.d && v.d < today) c.overdue += 1;
    else if (v.d === today) c.dueToday += 1;
    if (v.p === 3) c.high += 1;
  }
  return c;
}

async function showReminder() {
  const c = await taskCounts();
  const parts = [];
  if (c.overdue) parts.push(`${c.overdue} overdue`);
  if (c.dueToday) parts.push(`${c.dueToday} due today`);
  if (c.high) parts.push(`${c.high} high priority`);
  const summary = parts.length ? parts.join(' · ') : `${c.open} open task${c.open === 1 ? '' : 's'}`;
  // A standard notification (no requireInteraction): on macOS, notifications that stay on
  // screen go through a separate "Alerts" helper that is often switched off.
  const id = `${NOTE_PREFIX}-${Date.now()}`;
  await chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: 'icons/checkrow-128.png',
    title: 'Time for your CheckRow brief',
    message: `${summary}. Click to send your brief to Claude, ChatGPT, Teams and more.`,
    priority: 2,
  });
  return id;
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM) return;
  await remindIfDue();
  await schedule();
});

chrome.runtime.onInstalled.addListener(() => { schedule(); });
chrome.runtime.onStartup.addListener(async () => {
  await remindIfDue();
  await schedule();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.reminder) schedule();
});

chrome.notifications.onClicked.addListener((id) => {
  if (!id.startsWith(NOTE_PREFIX)) return;
  chrome.notifications.clear(id);
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html#brief') });
});

// "Send a test" in Settings. Replies so the page can say what actually happened.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== 'checkrow-test-reminder') return undefined;
  (async () => {
    const level = await new Promise((r) => chrome.notifications.getPermissionLevel(r));
    if (level === 'denied') return { ok: false, error: 'denied' };
    const id = await showReminder();
    return { ok: true, id };
  })()
    .then(sendResponse)
    .catch((err) => sendResponse({ ok: false, error: String((err && err.message) || err) }));
  return true; // keep the channel open for the async reply
});
