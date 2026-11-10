// CheckRow background service worker.
// - Opens the side panel from the toolbar icon.
// - Runs the optional daily reminder: on the chosen days and time it shows a
//   notification; clicking it opens CheckRow with the AI Brief window.
// - Keeps a daily backup of the tasks in chrome.storage.local (last 7 days).
// - Shows the number of overdue + due-today tasks on the toolbar icon.
// - Shows reminders set on single tasks ("Remind me" in a task's details).
// - Adds "Add to CheckRow" to the right-click menu.
// Everything stays in the browser; nothing is sent anywhere.

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.error('CheckRow: could not set side panel behavior', err));

const ALARM = 'checkrow-brief';
const DAILY = 'checkrow-daily'; // just after midnight: backup + refresh the count
const KEEP_BACKUPS = 7;
const NOTE_PREFIX = 'checkrow-brief';
const DEFAULT_REMINDER = { on: false, days: [1, 2, 3, 4, 5], time: '08:30' };
const TASK_ALARM = 'checkrow-task:'; // + task id
const TASK_NOTE = 'checkrow-task-'; // + task id + '-' + time
const CATCH_UP_MS = 24 * 3600000; // show a missed task reminder up to a day late
const MENU_ID = 'checkrow-add';

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
  // "<day> <time>": today's reminder for this time was shown (or skipped because the time
  // had already passed when it was set). Changing the time to later today reminds again.
  const mark = `${dayKey(now)} ${r.time}`;
  const { reminderLast } = await chrome.storage.sync.get('reminderLast');
  if (reminderLast === mark) return;
  await chrome.storage.sync.set({ reminderLast: mark });
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
  const stay = await keepOnScreen();
  const c = await taskCounts();
  const parts = [];
  if (c.overdue) parts.push(`${c.overdue} overdue`);
  if (c.dueToday) parts.push(`${c.dueToday} due today`);
  if (c.high) parts.push(`${c.high} high priority`);
  const summary = parts.length ? parts.join(' · ') : `${c.open} open task${c.open === 1 ? '' : 's'}`;
  // Standard notification unless "keep on screen" is on: on macOS, notifications that stay
  // on screen go through a separate "Alerts" setting that is often switched off.
  const id = `${NOTE_PREFIX}-${Date.now()}`;
  await chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: 'icons/checkrow-128.png',
    title: 'Time for your CheckRow brief',
    message: `${summary}. Click to send your brief to Claude, ChatGPT, Teams and more.`,
    priority: 2,
    ...(stay ? { requireInteraction: true } : {}),
  });
  return id;
}

// ---------- Small date helpers (match the page's) ----------
const pad2 = (n) => String(n).padStart(2, '0');
const toKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const localStamp = (d) => `${toKey(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
// Edit times, as the page records them (seconds since 2026, base 36), so a change made
// from a notification wins over older edits when computers merge.
const EPOCH = Date.UTC(2026, 0, 1);
const stamp36 = () => Math.max(1, Math.floor((Date.now() - EPOCH) / 1000)).toString(36);

// Repeating tasks (same rules as the page): next due date after today.
function stepDate(d, rule, anchorDay) {
  const n = new Date(d);
  const daysIn = (y, m) => new Date(y, m + 1, 0).getDate();
  if (rule === 'daily') n.setDate(n.getDate() + 1);
  else if (rule === 'weekdays') { do n.setDate(n.getDate() + 1); while (n.getDay() === 0 || n.getDay() === 6); }
  else if (rule === 'weekly') n.setDate(n.getDate() + 7);
  else if (rule === 'monthly') {
    const y = n.getFullYear() + (n.getMonth() === 11 ? 1 : 0);
    const m = (n.getMonth() + 1) % 12;
    return new Date(y, m, Math.min(anchorDay, daysIn(y, m)));
  } else if (rule === 'yearly') {
    const y = n.getFullYear() + 1;
    return new Date(y, n.getMonth(), Math.min(anchorDay, daysIn(y, n.getMonth())));
  }
  return n;
}
function nextDue(rule, due) {
  const base = due || toKey(new Date());
  const anchor = parseKey(base).getDate();
  const today = toKey(new Date());
  let d = stepDate(parseKey(base), rule, anchor);
  if (base <= today) while (toKey(d) <= today) d = stepDate(d, rule, anchor);
  return toKey(d);
}
function shiftRemind(remind, oldDue, newDue) {
  if (!remind || !oldDue || !newDue) return undefined;
  const [day, time] = remind.split('T');
  const d = parseKey(day);
  d.setDate(d.getDate() + Math.round((parseKey(newDue) - parseKey(oldDue)) / 86400000));
  return `${toKey(d)}T${time}`;
}

// ---------- Reminder schedules on tasks ("Mon, Wed at 9:00") ----------
// "w": { d: [days 0-6], t: 'HH:MM', s: ms when set }. Only times after it was set count,
// so setting a schedule at 10:00 for 9:00 doesn't fire straight away.
const validSchedule = (w) => w && Array.isArray(w.d) && w.d.length && /^\d{2}:\d{2}$/.test(w.t);
function nextScheduled(w, from = new Date()) {
  return validSchedule(w) ? nextOccurrence({ days: w.d, time: w.t }, from) : null;
}
function lastScheduled(w, now = new Date()) {
  if (!validSchedule(w)) return null;
  for (let i = 0; i < 8; i += 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (!w.d.includes(d.getDay())) continue;
    const t = at(d, w.t);
    if (t <= now) return t.getTime() >= (w.s || 0) ? t : null;
  }
  return null;
}

// ---------- Reminders on single tasks ----------
// A task's reminder is "YYYY-MM-DDTHH:MM" (local time) in its "m" field. Each upcoming
// one gets its own alarm. "remShown" (synced) records which were shown, so only one
// computer shows each, and a computer that was off catches up when it next starts.
async function syncTaskAlarms() {
  const all = await chrome.storage.sync.get(null);
  const shown = all.remShown || {};
  const now = Date.now();
  const want = new Map();
  for (const [k, v] of Object.entries(all)) {
    if (!k.startsWith('t:') || !v || v.x) continue;
    const id = k.slice(2);
    const times = [];
    if (typeof v.m === 'string') {
      const when = new Date(v.m).getTime();
      if (when > now && shown[id] !== v.m) times.push(when);
    }
    const sched = nextScheduled(v.w);
    if (sched) times.push(sched.getTime());
    if (times.length) want.set(TASK_ALARM + id, Math.min(...times));
  }
  for (const a of await chrome.alarms.getAll()) {
    if (!a.name.startsWith(TASK_ALARM)) continue;
    if (want.get(a.name) === a.scheduledTime) want.delete(a.name);
    else if (!want.has(a.name)) await chrome.alarms.clear(a.name);
  }
  for (const [name, when] of want) await chrome.alarms.create(name, { when });
}

// Show every task reminder whose time has come (and not more than a day ago).
async function showDueTaskReminders() {
  const all = await chrome.storage.sync.get(null);
  const shown = { ...(all.remShown || {}) };
  const now = Date.now();
  const due = [];
  for (const [k, v] of Object.entries(all)) {
    if (!k.startsWith('t:') || !v || v.x) continue;
    const id = k.slice(2);
    let hit = false;
    if (typeof v.m === 'string') {
      const when = new Date(v.m).getTime();
      if (when <= now && when > now - CATCH_UP_MS && shown[id] !== v.m) { hit = true; shown[id] = v.m; }
    }
    // Schedule: the latest scheduled time that has passed (within a day), once each.
    const last = lastScheduled(v.w, new Date(now));
    if (last && last.getTime() > now - CATCH_UP_MS) {
      const key = `${toKey(last)} ${v.w.t}`;
      if (shown[`${id}~w`] !== key) { hit = true; shown[`${id}~w`] = key; }
    }
    if (hit) due.push([id, v]);
  }
  // Forget tasks that no longer exist.
  for (const key of Object.keys(shown)) if (!all[`t:${key.split('~')[0]}`]) delete shown[key];
  if (due.length || Object.keys(shown).length !== Object.keys(all.remShown || {}).length) {
    await chrome.storage.sync.set({ remShown: shown });
  }
  for (const [id, v] of due) await showTaskReminder(id, v);
  return due.length;
}

async function showTaskReminder(id, v) {
  const today = dayKey(new Date());
  const dueText = !v.d ? '' : v.d < today ? 'Overdue' : v.d === today ? 'Due today' : `Due ${new Date(`${v.d}T00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`;
  const steps = Array.isArray(v.k) && v.k.length ? `${v.k.filter((s) => s && s[1]).length} of ${v.k.length} steps done` : '';
  await chrome.notifications.create(`${TASK_NOTE}${id}-${Date.now()}`, {
    type: 'basic',
    iconUrl: 'icons/checkrow-128.png',
    title: String(v.t || 'Reminder').slice(0, 120),
    message: [dueText, steps].filter(Boolean).join(' · ') || 'CheckRow reminder',
    contextMessage: 'CheckRow reminder · Click to open',
    priority: 2,
    buttons: [{ title: 'Snooze 1 hour' }, { title: 'Mark complete' }],
    ...((await keepOnScreen()) ? { requireInteraction: true } : {}),
  });
}

// Setting: keep reminders on screen until closed (off by default; on a Mac this needs
// Chrome's notification style set to "Alerts" in System Settings).
async function keepOnScreen() {
  const { notify } = await chrome.storage.sync.get('notify');
  return !!(notify && notify.stay);
}

// Buttons on a task reminder: Snooze 1 hour, or Mark complete. Both edit the task in
// sync directly, so it works even when CheckRow isn't open.
async function snoozeTask(id) {
  const key = `t:${id}`;
  const { [key]: v } = await chrome.storage.sync.get(key);
  if (!v || v.x) return;
  const m = localStamp(new Date(Date.now() + 3600000));
  await chrome.storage.sync.set({ [key]: { ...v, m, u: { ...(v.u || {}), m: stamp36() } } });
}
async function completeTask(id) {
  const key = `t:${id}`;
  const { [key]: v } = await chrome.storage.sync.get(key);
  if (!v || v.x) return;
  const now = Date.now();
  const u = { ...(v.u || {}), x: stamp36() };
  const done = { ...v, x: 1, c: now, u };
  const out = { [key]: done };
  if (v.r && v.d) {
    // Repeating: the next copy, like completing it in CheckRow.
    const due = nextDue(v.r, v.d);
    const next = { ...v, d: due, a: now };
    delete next.x; delete next.c; delete next.u;
    const m = shiftRemind(v.m, v.d, due);
    if (m) next.m = m; else delete next.m;
    if (Array.isArray(v.k)) next.k = v.k.map((s) => [s[0]]);
    out[`t:${now.toString(36)}${Math.random().toString(36).slice(2, 8)}`] = next;
    delete done.r;
    u.r = u.x;
  }
  await chrome.storage.sync.set(out);
}

chrome.notifications.onButtonClicked.addListener((noteId, index) => {
  if (!noteId.startsWith(TASK_NOTE)) return;
  chrome.notifications.clear(noteId);
  const id = noteId.slice(TASK_NOTE.length).replace(/-\d+$/, '');
  (index === 0 ? snoozeTask(id) : completeTask(id)).catch((e) => console.error('CheckRow: notification action failed', e));
});

// ---------- Right-click "Add to CheckRow" ----------
let menuReady = null; // once per worker start, however many callers ask
function setUpMenu() {
  if (menuReady) return menuReady;
  const quiet = () => void chrome.runtime.lastError;
  menuReady = new Promise((resolve) => {
    chrome.contextMenus.removeAll(() => {
      quiet();
      chrome.contextMenus.create({ id: MENU_ID, title: 'Add “%s” to CheckRow', contexts: ['selection'] }, quiet);
      chrome.contextMenus.create({ id: `${MENU_ID}-link`, title: 'Add link to CheckRow', contexts: ['link'] }, quiet);
      chrome.contextMenus.create({ id: `${MENU_ID}-page`, title: 'Add this page to CheckRow', contexts: ['page'] }, quiet);
      resolve();
    });
  });
  return menuReady;
}

const tidy = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
async function addFromMenu(info, tab) {
  const { meta } = await chrome.storage.sync.get('meta');
  const listId = meta && Array.isArray(meta.lists) && meta.lists[0] && meta.lists[0].id;
  let title;
  let notes;
  if (info.menuItemId === MENU_ID) {
    title = tidy(info.selectionText, 500);
    notes = info.pageUrl || '';
  } else if (info.menuItemId === `${MENU_ID}-link`) {
    title = tidy(info.selectionText, 500) || tidy(info.linkUrl.replace(/^https?:\/\/(www\.)?/, ''), 200);
    notes = info.linkUrl;
  } else {
    title = tidy(tab && tab.title, 500) || tidy(info.pageUrl, 200);
    notes = info.pageUrl || '';
  }
  if (!title) return;
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const now = Date.now();
  const task = { l: listId || 'pending', t: title, a: now, o: -Math.floor(now / 1000) };
  if (notes && !/^chrome(-extension)?:/.test(notes)) task.n = notes.slice(0, 2000);
  if (listId) {
    await chrome.storage.sync.set({ [`t:${id}`]: task });
  } else {
    // No lists synced yet (CheckRow never opened): hand it to the page to add on open.
    const { pendingAdds } = await chrome.storage.local.get('pendingAdds');
    await chrome.storage.local.set({ pendingAdds: [...(pendingAdds || []), { id, ...task }] });
  }
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!String(info.menuItemId).startsWith(MENU_ID)) return;
  // Open the panel right away (it must happen during the click), then add the task.
  if (tab && tab.windowId !== undefined && chrome.sidePanel.open) {
    chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
  }
  addFromMenu(info, tab).catch((e) => console.error('CheckRow: could not add from menu', e));
});

// ---------- Keyboard shortcut ----------
// "Open CheckRow" (Alt+Shift+K by default; people can change it at chrome://extensions/shortcuts).
chrome.commands.onCommand.addListener((command, tab) => {
  if (command !== 'open-checkrow') return;
  const open = (windowId) => chrome.sidePanel.open({ windowId }).catch((e) => console.error('CheckRow: could not open the panel', e));
  if (tab && tab.windowId !== undefined) open(tab.windowId);
  else chrome.windows.getCurrent().then((w) => open(w.id));
});

// ---------- Daily backup ----------
// One copy per day of everything CheckRow keeps in sync, stored on this computer.
async function backupIfDue() {
  const today = dayKey(new Date());
  const { backups } = await chrome.storage.local.get('backups');
  const list = Array.isArray(backups) ? backups : [];
  if (list.length && list[list.length - 1].day === today) return false;
  const all = await chrome.storage.sync.get(null);
  const items = {};
  for (const [k, v] of Object.entries(all)) if (k === 'meta' || k.startsWith('t:')) items[k] = v;
  if (!items.meta) return false; // nothing saved yet
  list.push({ day: today, at: Date.now(), items });
  await chrome.storage.local.set({ backups: list.slice(-KEEP_BACKUPS) });
  return true;
}

// ---------- Toolbar count ----------
async function updateBadge() {
  const { badge } = await chrome.storage.sync.get('badge');
  const on = !badge || badge.on !== false;
  const c = on ? await taskCounts() : { overdue: 0, dueToday: 0 };
  const n = c.overdue + c.dueToday;
  await chrome.action.setBadgeText({ text: n ? (n > 99 ? '99+' : String(n)) : '' });
  if (n) {
    await chrome.action.setBadgeBackgroundColor({ color: c.overdue ? '#D93025' : '#1A73E8' });
    if (chrome.action.setBadgeTextColor) await chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
  }
  await chrome.action.setTitle({
    title: !n ? 'Open CheckRow' : `CheckRow: ${[c.overdue && `${c.overdue} overdue`, c.dueToday && `${c.dueToday} due today`].filter(Boolean).join(', ')}`,
  });
}

async function scheduleDaily() {
  const next = new Date();
  next.setHours(24, 0, 30, 0); // 30 seconds after midnight
  await chrome.alarms.create(DAILY, { when: next.getTime() });
}

let choresQueue = Promise.resolve(); // one at a time, so two callers can't make two backups
function dailyChores() {
  choresQueue = choresQueue.then(async () => {
    try { await backupIfDue(); } catch (e) { console.error('CheckRow: backup failed', e); }
    try { await updateBadge(); } catch (e) { console.error('CheckRow: badge failed', e); }
  });
  return choresQueue;
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM) {
    await remindIfDue();
    await schedule();
  } else if (alarm.name.startsWith(TASK_ALARM)) {
    await showDueTaskReminders();
    await syncTaskAlarms();
  } else if (alarm.name === DAILY) {
    await dailyChores();
    await scheduleDaily();
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  setUpMenu();
  await schedule();
  await syncTaskAlarms();
  await scheduleDaily();
  await dailyChores();
});
chrome.runtime.onStartup.addListener(async () => {
  await remindIfDue();
  await schedule();
  await showDueTaskReminders();
  await syncTaskAlarms();
  await scheduleDaily();
  await dailyChores();
});

// Every time the worker starts, make sure the setup exists. onInstalled / onStartup
// don't always fire (for example after some updates), and the menus and the midnight
// job must never go missing.
async function ensureSetup() {
  setUpMenu();
  if (!(await chrome.alarms.get(DAILY))) {
    await scheduleDaily();
    await dailyChores();
  }
  if ((await getReminder()).on && !(await chrome.alarms.get(ALARM))) await schedule();
  await syncTaskAlarms();
}
ensureSetup().catch((e) => console.error('CheckRow: setup check failed', e));

let badgeTimer = 0;
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  if (changes.reminder) schedule();
  const tasksChanged = Object.keys(changes).some((k) => k.startsWith('t:'));
  if (changes.badge || tasksChanged) {
    clearTimeout(badgeTimer);
    badgeTimer = setTimeout(() => {
      updateBadge().catch(() => {});
      if (tasksChanged) syncTaskAlarms().catch(() => {});
    }, 300);
  }
});

chrome.notifications.onClicked.addListener((id) => {
  if (id.startsWith(TASK_NOTE)) {
    chrome.notifications.clear(id);
    const taskId = id.slice(TASK_NOTE.length).replace(/-\d+$/, '');
    chrome.tabs.create({ url: chrome.runtime.getURL(`index.html#task=${encodeURIComponent(taskId)}`) });
    return;
  }
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
