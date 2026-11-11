/* CheckRow — a Workspace-style to-do list.
 * Plain JavaScript, no build step. Data lives in localStorage on this device.
 * Runs as a normal web page or as a Chrome/Edge extension (side panel).
 */
(() => {
  'use strict';

  const STORE_KEY = 'checkrow:v1';
  const PRI = ['None', 'Low', 'Medium', 'High'];
  const SORTS = [['priority', 'Priority'], ['due', 'Date'], ['order', 'My order']];
  const SORT_HELP = {
    priority: 'High priority first, then by due date',
    due: 'Soonest due date first',
    order: 'Your own order. Drag tasks to rearrange',
  };
  const isSort = (k) => SORTS.some(([s]) => s === k);
  const VIEWS = [
    ['all', 'All tasks', 'inbox'],
    ['today', 'Today', 'calendar'],
    ['starred', 'Starred', 'star'],
  ];

  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const ICONS = {
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    star: '<path d="M12 3.6l2.6 5.2 5.8.9-4.2 4.1 1 5.7L12 16.8l-5.2 2.7 1-5.7-4.2-4.1 5.8-.9z"/>',
    inbox: '<path d="M3.5 13h4.5l1.5 3h5l1.5-3h4.5"/><path d="M5.5 5h13l2 8v5.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5V13z"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    list: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" stroke-width="2.6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6L6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
    moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
    more: '<circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="19" r="1.7"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    details: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    flag: '<path d="M5.5 21V4M5.5 4.5h11l-2.2 4.2 2.2 4.3h-11"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7M9 7V4h6v3"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    grip: '<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" stroke-width="3"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    upload: '<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>',
    sparkle: '<path d="M11 3.5l1.8 4.9 4.9 1.8-4.9 1.8L11 16.9l-1.8-4.9-4.9-1.8 4.9-1.8z"/><path d="M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
    copy: '<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2"/><path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    cloud: '<path d="M7 18.5h10.5a4 4 0 0 0 .7-7.94A6 6 0 0 0 6.6 9.1 4.7 4.7 0 0 0 7 18.5z"/>',
    device: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2.5 19h19"/>',
    warn: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
    repeat: '<path d="M16.5 3l3 3-3 3"/><path d="M4.5 11.5V10a4 4 0 0 1 4-4h11"/><path d="M7.5 21l-3-3 3-3"/><path d="M19.5 12.5V14a4 4 0 0 1-4 4h-11"/>',
    archive: '<rect x="3.5" y="4.5" width="17" height="4.5" rx="1"/><path d="M5 9v9.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V9M10 13h4"/>',
    history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><path d="M3.5 4v4h4M12 7.5V12l3 2"/>',
    bell: '<path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    steps: '<path d="M4 6.5l1.5 1.5L8.5 5M4 12.5l1.5 1.5 3-3M4 18.5l1.5 1.5 3-3M11.5 6.5H20M11.5 12.5H20M11.5 18.5H20"/>',
    party: '<path d="M4 20l4.5-12 7.5 7.5z"/><path d="M14 4.5c0 1.5 1 2 2 2M19.5 9.5c-1.5 0-2 1-2 2M15 9l4-4M10.5 3.5l.5 1.5M20.5 13.5l-1.5-.5"/>',
  };
  const icon = (name, cls = '') => (
    `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" ` +
    `stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`
  );

  // ---------- Dates ----------
  const pad = (n) => String(n).padStart(2, '0');
  const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayKey = () => toKey(new Date());
  const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  // "Today 2:00 PM", "Tue, Nov 17 9:30 AM"
  function fmtRemind(r) {
    const [day, time] = r.split('T');
    const [h, m] = time.split(':').map(Number);
    const at = new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return `${fmtDue(day)} ${at}`;
  }
  const remindPast = (r) => !!r && new Date(r) <= new Date();
  function fmtDue(k) {
    const d = parseKey(k);
    const t = parseKey(todayKey());
    const diff = Math.round((d - t) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    const opts = { weekday: 'short', month: 'short', day: 'numeric' };
    if (d.getFullYear() !== t.getFullYear()) opts.year = 'numeric';
    return d.toLocaleDateString(undefined, opts);
  }
  function dueClass(t) {
    if (!t.due || t.done) return '';
    const k = todayKey();
    return t.due < k ? 'overdue' : t.due === k ? 'due-today' : '';
  }

  const WEEK = [[1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [0, 'Sun']];
  const STEPS_MAX = 30;   // checklist steps per task
  const STEP_MAX = 120;   // characters per step (keeps a task inside one 8 KB sync item)

  // ---------- Repeating tasks ----------
  // A repeating task has a due date. Completing it creates the next one, due on the
  // next matching day after today (or after its due date, if that's still ahead).
  const REPEATS = ['daily', 'weekdays', 'weekly', 'monthly', 'yearly'];
  const ordinal = (n) => n + (['th', 'st', 'nd', 'rd'][(n % 100 - 20) % 10] || ['th', 'st', 'nd', 'rd'][n % 100] || 'th');
  function repeatLabel(rule, due) {
    const d = parseKey(due || todayKey());
    switch (rule) {
      case 'daily': return 'Daily';
      case 'weekdays': return 'Every weekday';
      case 'weekly': return `Weekly on ${d.toLocaleDateString(undefined, { weekday: 'long' })}`;
      case 'monthly': return `Monthly on the ${ordinal(d.getDate())}`;
      case 'yearly': return `Yearly on ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
      default: return 'Doesn’t repeat';
    }
  }
  const daysIn = (y, m) => new Date(y, m + 1, 0).getDate();
  function stepDate(d, rule, anchorDay) {
    const n = new Date(d);
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
    const base = due || todayKey();
    const anchor = parseKey(base).getDate();
    const today = todayKey();
    let d = stepDate(parseKey(base), rule, anchor);
    if (base <= today) while (toKey(d) <= today) d = stepDate(d, rule, anchor);
    return toKey(d);
  }

  // Reminder schedule on a task: { days: [0-6], time: 'HH:MM', since: ms } or null.
  // "since" is when it was set; the background only fires for times after that.
  function cleanSchedule(x) {
    if (!x || !Array.isArray(x.days) || typeof x.time !== 'string' || !/^\d{2}:\d{2}$/.test(x.time)) return null;
    const days = [...new Set(x.days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort();
    return days.length ? { days, time: x.time, since: Number(x.since) || 0 } : null;
  }
  // Which reminder the task uses; a mode picked but not filled in yet is remembered in ui.
  function remindMode(t) {
    if (t.schedule) return 'repeat';
    if (t.remind) return 'once';
    return ui.remindMode && ui.remindMode.id === t.id ? ui.remindMode.mode : 'off';
  }
  const fmtTime = (hm) => { const [h, m] = hm.split(':').map(Number); return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); };
  function scheduleLabel(sc) {
    const d = sc.days.join();
    const days = d === '0,1,2,3,4,5,6' ? 'Every day' : d === '1,2,3,4,5' ? 'Weekdays' : d === '0,6' ? 'Weekends'
      : WEEK.filter(([n]) => sc.days.includes(n)).map(([, l]) => l).join(', ');
    return `${days} ${fmtTime(sc.time)}`;
  }

  // A reminder on a repeating task moves with it: same time, same days before the due date.
  function shiftRemind(remind, oldDue, newDue) {
    if (!remind || !oldDue || !newDue) return '';
    const [day, time] = remind.split('T');
    const shift = Math.round((parseKey(newDue) - parseKey(oldDue)) / 86400000);
    const d = parseKey(day);
    d.setDate(d.getDate() + shift);
    return `${toKey(d)}T${time}`;
  }

  // ---------- State ----------
  function freshState() {
    const id = uid();
    return { version: 1, lists: [{ id, name: 'My Tasks' }], tasks: [], view: id, defaultSort: 'priority', sortBy: {}, theme: 'system', showCompleted: {} };
  }
  const isValid = (s) => !!s && Array.isArray(s.lists) && s.lists.length > 0 && Array.isArray(s.tasks);
  function normalize(s) {
    const lists = s.lists
      .filter((l) => l && typeof l.id === 'string')
      .map((l) => ({ id: l.id, name: String(l.name || 'Untitled list').slice(0, 80) }));
    if (!lists.length) return freshState();
    const listIds = new Set(lists.map((l) => l.id));
    const tasks = s.tasks
      .filter((t) => t && typeof t.id === 'string' && listIds.has(t.listId))
      .map((t) => ({
        id: t.id,
        listId: t.listId,
        title: String(t.title ?? ''),
        notes: String(t.notes ?? ''),
        due: /^\d{4}-\d{2}-\d{2}$/.test(t.due) ? t.due : '',
        priority: [0, 1, 2, 3].includes(t.priority) ? t.priority : 0,
        starred: !!t.starred,
        repeat: REPEATS.includes(t.repeat) && /^\d{4}-\d{2}-\d{2}$/.test(t.due) ? t.repeat : '',
        remind: typeof t.remind === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(t.remind) ? t.remind : '',
        schedule: cleanSchedule(t.schedule),
        steps: Array.isArray(t.steps)
          ? t.steps.filter((x) => x && typeof x.text === 'string').slice(0, STEPS_MAX)
            .map((x) => ({ text: x.text.slice(0, STEP_MAX), done: !!x.done }))
          : [],
        edits: t.edits && typeof t.edits === 'object'
          ? Object.fromEntries(Object.entries(t.edits).filter(([f, v]) => FIELDS[f] && Number.isFinite(v) && v > 0))
          : {},
        done: !!t.done,
        completedAt: Number(t.completedAt) || 0,
        createdAt: Number(t.createdAt) || Date.now(),
        order: Number(t.order) || 0,
      }));
    const views = new Set(['all', 'today', 'starred', ...listIds]);
    return {
      version: 1,
      lists,
      tasks,
      view: views.has(s.view) ? s.view : lists[0].id,
      defaultSort: isSort(s.defaultSort) ? s.defaultSort : 'priority',
      sortBy: Object.fromEntries(Object.entries(s.sortBy && typeof s.sortBy === 'object' ? s.sortBy : {}).filter(([, v]) => isSort(v))),
      theme: ['system', 'light', 'dark'].includes(s.theme) ? s.theme : 'system',
      chatEmail: typeof s.chatEmail === 'string' ? s.chatEmail.trim().slice(0, 200) : '',
      showCompleted: s.showCompleted && typeof s.showCompleted === 'object' ? s.showCompleted : {},
    };
  }
  function loadLocal() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (isValid(s)) return normalize(s);
      }
    } catch (e) { /* storage unavailable or corrupt */ }
    return null;
  }
  const load = () => loadLocal() || freshState();
  function saveLocal() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {
      toast('Couldn’t save. Browser storage is unavailable.');
    }
  }
  // Every change is written to this device right away, then synced (extension only).
  function save() {
    stampEdits();
    saveLocal();
    if (syncArea) {
      try { localStorage.setItem(DIRTY_KEY, '1'); } catch (e) { /* ignore */ }
      scheduleSync();
    }
  }

  let state = freshState(); // replaced in init()
  const ui = { search: '', drawerId: null, openTaskId: null, dragId: null, draft: { due: '', priority: 0 } };

  // ---------- Sync (Chrome/Edge account sync via chrome.storage.sync) ----------
  // No server: the browser syncs this storage across every computer signed in to the
  // same browser account. Lists live in one "meta" item and each task in its own
  // "t:<id>" item, so edits only rewrite what changed and stay inside Chrome's limits
  // (100 KB total, 8 KB per item, 512 items, 120 writes a minute).
  const DIRTY_KEY = 'checkrow:unsynced';
  const SYNCED_KEY = 'checkrow:synced';
  const syncArea = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) ? chrome.storage.sync : null;
  const SYNC_QUOTA = (syncArea && syncArea.QUOTA_BYTES) || 102400;
  const SYNC_MAX_ITEMS = (syncArea && syncArea.MAX_ITEMS) || 512;
  const Sync = { last: new Map(), inflight: new Map(), timer: 0, retry: 0, busy: false, again: false, status: syncArea ? 'synced' : 'local', usage: 0 };

  const isSyncKey = (k) => k === 'meta' || k.startsWith('t:');
  const packTask = (t) => ({
    l: t.listId, t: t.title,
    n: t.notes || undefined, d: t.due || undefined, p: t.priority || undefined,
    s: t.starred ? 1 : undefined, x: t.done ? 1 : undefined, c: t.completedAt || undefined,
    r: t.repeat || undefined, m: t.remind || undefined,
    w: t.schedule ? { d: t.schedule.days, t: t.schedule.time, s: t.schedule.since } : undefined,
    k: t.steps && t.steps.length ? t.steps.map((x) => (x.done ? [x.text, 1] : [x.text])) : undefined,
    u: t.edits && Object.keys(t.edits).length ? Object.fromEntries(Object.entries(t.edits).map(([f, v]) => [f, v.toString(36)])) : undefined,
    a: t.createdAt, o: t.order,
  });
  const unpackTask = (id, v) => ({
    id, listId: v.l, title: v.t || '', notes: v.n || '', due: v.d || '',
    priority: v.p || 0, starred: !!v.s, done: !!v.x, completedAt: v.c || 0,
    repeat: REPEATS.includes(v.r) && v.d ? v.r : '',
    remind: typeof v.m === 'string' ? v.m : '',
    schedule: v.w ? cleanSchedule({ days: v.w.d, time: v.w.t, since: v.w.s }) : null,
    steps: Array.isArray(v.k) ? v.k.filter(Array.isArray).map(([text, done]) => ({ text: String(text || ''), done: !!done })) : [],
    edits: v.u && typeof v.u === 'object'
      ? Object.fromEntries(Object.entries(v.u).map(([f, x]) => [f, parseInt(x, 36)]).filter(([f, x]) => FIELDS[f] && x > 0))
      : {},
    createdAt: v.a || Date.now(), order: v.o || 0,
  });

  // ---------- Merging edits from two computers ----------
  // Each task remembers when each part of it was last changed (seconds since 2026,
  // only for parts that have been edited). When two computers change the same task
  // before syncing, each part keeps whichever change is newer, so editing the name on
  // one computer and the date on another keeps both.
  const FIELDS = {
    l: ['listId'], t: ['title'], n: ['notes'], d: ['due'], p: ['priority'], s: ['starred'],
    x: ['done', 'completedAt'], r: ['repeat'], m: ['remind'], w: ['schedule'], k: ['steps'], o: ['order'],
  };
  const EPOCH = Date.UTC(2026, 0, 1);
  const stampNow = () => Math.max(1, Math.floor((Date.now() - EPOCH) / 1000));
  const fieldsOf = (t) => Object.fromEntries(Object.entries(FIELDS).map(([f, props]) => [f, canon(props.map((p) => t[p] ?? null))]));
  const known = new Map(); // task id -> fieldsOf() as last saved or received
  function rememberAll() { known.clear(); for (const t of state.tasks) known.set(t.id, fieldsOf(t)); }
  // Note the time of every part changed since the last save.
  function stampEdits() {
    const now = stampNow();
    const ids = new Set();
    for (const t of state.tasks) {
      ids.add(t.id);
      const cur = fieldsOf(t);
      const prev = known.get(t.id);
      if (prev) for (const f in FIELDS) if (cur[f] !== prev[f]) (t.edits ||= {})[f] = now;
      known.set(t.id, cur);
    }
    for (const id of known.keys()) if (!ids.has(id)) known.delete(id);
  }
  // Combine two versions of one task, part by part. Returns the merged task.
  function mergeTask(local, remote) {
    const out = { ...remote, edits: { ...(remote.edits || {}) } };
    for (const [f, props] of Object.entries(FIELDS)) {
      const lt = (local.edits && local.edits[f]) || 0;
      const rt = (remote.edits && remote.edits[f]) || 0;
      if (lt > rt) { for (const p of props) out[p] = local[p]; out.edits[f] = lt; }
    }
    return out;
  }
  const newerLocally = (local, remote) => Object.keys(FIELDS).some((f) => ((local.edits && local.edits[f]) || 0) > ((remote.edits && remote.edits[f]) || 0));
  // Stable text form of a synced value. Chrome hands values back with their fields in
  // alphabetical order, so compare with sorted keys or our own saves look like changes
  // from another computer (and re-draw the list mid-edit).
  function canon(v) {
    if (Array.isArray(v)) return `[${v.map(canon).join(',')}]`;
    if (v && typeof v === 'object') {
      return `{${Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`;
    }
    return JSON.stringify(v);
  }
  function syncSnapshot() {
    const m = new Map();
    m.set('meta', canon({ v: 1, lists: state.lists.map((l) => ({ id: l.id, name: l.name })), defaultSort: state.defaultSort }));
    for (const t of state.tasks) m.set(`t:${t.id}`, canon(packTask(t)));
    return m;
  }
  function fromSyncItems(items) {
    const meta = items.meta;
    if (!meta || !Array.isArray(meta.lists) || !meta.lists.length) return null;
    return {
      lists: meta.lists.map((l) => ({ id: l.id, name: l.name })),
      defaultSort: isSort(meta.defaultSort) ? meta.defaultSort : null,
      tasks: Object.entries(items).filter(([k]) => k.startsWith('t:')).map(([k, v]) => unpackTask(k.slice(2), v)),
    };
  }
  // Combine what's in sync with what's on this device. Local copies win for tasks that
  // exist in both. With matchNames, a local list with the same name as a synced one is
  // folded into it (so a second computer's empty "My Tasks" doesn't become a duplicate).
  function mergeData(remote, local, matchNames) {
    const lists = remote.lists.map((l) => ({ ...l }));
    const idMap = new Map();
    for (const l of local.lists) {
      const same = lists.find((r) => r.id === l.id);
      if (same) { same.name = l.name; continue; }
      const byName = matchNames && lists.find((r) => r.name.trim().toLowerCase() === l.name.trim().toLowerCase());
      if (byName) { idMap.set(l.id, byName.id); continue; }
      lists.push({ ...l });
    }
    const tasks = new Map(remote.tasks.map((t) => [t.id, t]));
    for (const t of local.tasks) tasks.set(t.id, { ...t, listId: idMap.get(t.listId) || t.listId });
    return { lists, tasks: [...tasks.values()] };
  }

  function scheduleSync() {
    clearTimeout(Sync.timer);
    if (Sync.status !== 'full' && Sync.status !== 'too-big') setSyncStatus('saving');
    Sync.timer = setTimeout(flushSync, 1500);
  }
  async function flushSync() {
    clearTimeout(Sync.timer);
    clearTimeout(Sync.retry);
    if (!syncArea) return;
    if (Sync.busy) { Sync.again = true; return; }
    Sync.busy = true;
    const snap = syncSnapshot();
    const toSet = {};
    const toRemove = [];
    for (const [k, v] of snap) if (Sync.last.get(k) !== v) toSet[k] = JSON.parse(v);
    for (const k of Sync.last.keys()) if (!snap.has(k)) toRemove.push(k);
    const setKeys = Object.keys(toSet);
    try {
      for (const k of setKeys) Sync.inflight.set(k, snap.get(k));
      for (const k of toRemove) Sync.inflight.set(k, undefined);
      if (toRemove.length) await syncArea.remove(toRemove);
      if (setKeys.length) await syncArea.set(toSet);
      for (const k of toRemove) Sync.last.delete(k);
      for (const k of setKeys) Sync.last.set(k, snap.get(k));
      try { localStorage.removeItem(DIRTY_KEY); } catch (e) { /* ignore */ }
      setSyncStatus('synced');
      updateUsage();
    } catch (e) {
      const msg = String((e && e.message) || e);
      if (/PER_ITEM/.test(msg)) setSyncStatus('too-big');
      else if (/QUOTA_BYTES|MAX_ITEMS/.test(msg)) {
        if (Sync.status !== 'full') {
          toast('Sync storage is full.', async () => {
            const n = await archiveCompleted(true);
            toast(n ? `Archived ${n} completed task${n === 1 ? '' : 's'}` : 'No completed tasks to archive');
          }, 'Archive completed');
        }
        setSyncStatus('full');
      } else if (/MAX_WRITE_OPERATIONS/.test(msg)) { setSyncStatus('waiting'); Sync.retry = setTimeout(flushSync, 60000); }
      else { setSyncStatus('error'); Sync.retry = setTimeout(flushSync, 30000); }
    } finally {
      Sync.inflight.clear();
      Sync.busy = false;
      if (Sync.again) { Sync.again = false; scheduleSync(); }
    }
  }
  async function updateUsage() {
    if (!syncArea || !syncArea.getBytesInUse) return;
    try {
      const bytes = await syncArea.getBytesInUse(null);
      Sync.usage = Math.max(bytes / SYNC_QUOTA, Sync.last.size / SYNC_MAX_ITEMS);
      paintSyncStatus();
    } catch (e) { /* ignore */ }
  }

  // Apply changes made on another computer (or in another CheckRow window).
  function onSyncChanged(changes, area) {
    if (area !== 'sync') return;
    let touched = false;
    let writeBack = false;
    for (const [k, change] of Object.entries(changes)) {
      if (!isSyncKey(k)) continue;
      const nv = change.newValue === undefined ? undefined : canon(change.newValue);
      if (Sync.last.get(k) === nv || (Sync.inflight.has(k) && Sync.inflight.get(k) === nv)) continue; // our own write
      if (nv === undefined) Sync.last.delete(k); else Sync.last.set(k, nv);
      if (k === 'meta') {
        const lists = change.newValue && change.newValue.lists;
        if (Array.isArray(lists) && lists.length) { state.lists = lists.map((l) => ({ id: l.id, name: l.name })); touched = true; }
        const ds = change.newValue && change.newValue.defaultSort;
        if (isSort(ds) && ds !== state.defaultSort) { state.defaultSort = ds; state.sortBy = {}; touched = true; }
      } else {
        const id = k.slice(2);
        const i = state.tasks.findIndex((t) => t.id === id);
        if (change.newValue === undefined) {
          if (i >= 0) {
            const gone = state.tasks.splice(i, 1)[0];
            known.delete(id);
            // Another computer archived it: keep a copy in this computer's archive too.
            if (gone.done && gone.completedAt && gone.completedAt < archiveCutoff()) putInArchive([gone]);
            touched = true;
          }
        }
        else {
          let t = unpackTask(id, change.newValue);
          // This computer changed some part more recently (e.g. not synced yet): keep it.
          if (i >= 0 && newerLocally(state.tasks[i], t)) { t = mergeTask(state.tasks[i], t); writeBack = true; }
          if (i >= 0) state.tasks[i] = t; else state.tasks.push(t);
          known.set(id, fieldsOf(t));
          touched = true;
        }
      }
    }
    if (!touched) return;
    if (!['all', 'today', 'starred'].includes(state.view) && !listById(state.view)) state.view = state.lists[0].id;
    if (ui.openTaskId && !taskById(ui.openTaskId)) ui.openTaskId = null;
    saveLocal();
    if (writeBack) scheduleSync(); // send the merged version back so both computers agree
    render();
    updateUsage();
  }

  const SYNC_TEXT = {
    local: ['device', 'Saved on this device'],
    synced: ['cloud', 'Synced with your browser account'],
    saving: ['cloud', 'Saving…'],
    waiting: ['cloud', 'Syncing shortly…'],
    error: ['warn', 'Can’t sync right now. Saved on this device.'],
    full: ['warn', 'Sync storage full. Archive completed tasks in Settings.'],
    'too-big': ['warn', 'A task’s details are too long to sync. Shorten them.'],
  };
  function syncStatusHTML() {
    const [ic, text] = SYNC_TEXT[Sync.status] || SYNC_TEXT.local;
    const warn = ic === 'warn';
    const pct = Math.round(Sync.usage * 100);
    const usage = syncArea && pct >= 60 && !warn ? ` · ${pct}% of sync space used` : '';
    return `<p class="sync-status${warn ? ' warn' : ''}" id="syncStatus">${icon(ic)}<span>${esc(text + usage)}</span></p>`;
  }
  function paintSyncStatus() {
    const el = document.getElementById('syncStatus');
    if (el) el.outerHTML = syncStatusHTML();
  }
  function setSyncStatus(s) {
    if (Sync.status === s) return;
    Sync.status = s;
    paintSyncStatus();
  }

  async function init() {
    const local = loadLocal();
    if (!syncArea) { state = local || freshState(); rememberAll(); return; }
    let items;
    try {
      items = await syncArea.get(null);
    } catch (e) {
      state = local || freshState();
      rememberAll();
      Sync.status = 'error';
      return;
    }
    for (const [k, v] of Object.entries(items)) if (isSyncKey(k)) Sync.last.set(k, canon(v));
    const remote = fromSyncItems(items);
    const prefs = local || freshState();
    let data;
    if (!remote) data = prefs; // first computer: upload what's here
    else if (!local) data = remote; // new computer: take what's synced
    else if (localStorage.getItem(SYNCED_KEY) !== '1') data = mergeData(remote, local, true); // first sync on this computer
    else {
      // Usual case. Merge each task part by part with this computer's copy, so changes
      // that lost a sync race (or weren't synced before closing) aren't dropped.
      const dirty = localStorage.getItem(DIRTY_KEY) === '1';
      const mine = new Map(local.tasks.map((t) => [t.id, t]));
      const tasks = remote.tasks.map((r) => (mine.has(r.id) ? mergeTask(mine.get(r.id), r) : r));
      // Tasks only here: new and not yet synced (keep) or deleted elsewhere (drop).
      if (dirty) { const ids = new Set(remote.tasks.map((t) => t.id)); for (const t of local.tasks) if (!ids.has(t.id)) tasks.push(t); }
      data = dirty ? { lists: mergeData(remote, local, false).lists, tasks } : { lists: remote.lists, tasks };
    }
    state = normalize({ ...prefs, lists: data.lists, tasks: data.tasks });
    // The default sort follows the account, unless this computer has unsynced changes.
    if (remote && remote.defaultSort && localStorage.getItem(DIRTY_KEY) !== '1') state.defaultSort = remote.defaultSort;
    try { localStorage.setItem(SYNCED_KEY, '1'); } catch (e) { /* ignore */ }
    rememberAll();
    save();
    await flushSync();
    chrome.storage.onChanged.addListener(onSyncChanged);
  }

  // ---------- Archive (this computer only) ----------
  // Completed tasks move out of sync 30 days after they're finished, into
  // chrome.storage.local on this computer. Sync has a small size limit; this keeps it
  // from filling up. Nothing leaves the computer.
  const localArea = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) ? chrome.storage.local : null;
  const ARCHIVE_DAYS = 30;
  const archiveCutoff = () => Date.now() - ARCHIVE_DAYS * 86400000;
  async function getArchive() {
    if (!localArea) return [];
    try { const { archive } = await localArea.get('archive'); return Array.isArray(archive) ? archive : []; } catch (e) { return []; }
  }
  async function putInArchive(tasks) {
    if (!localArea || !tasks.length) return false;
    const archive = await getArchive();
    const have = new Set(archive.map((a) => a.id));
    for (const t of tasks) if (!have.has(t.id)) archive.push({ id: t.id, ...packTask(t) });
    try { await localArea.set({ archive }); return true; } catch (e) { return false; }
  }
  async function setArchive(archive) {
    if (!localArea) return;
    try { await localArea.set({ archive }); } catch (e) { /* ignore */ }
  }
  // Moves completed tasks to the archive: those finished 30+ days ago, or all of them.
  async function archiveCompleted(all = false) {
    const cutoff = archiveCutoff();
    const old = state.tasks.filter((t) => t.done && (all || (t.completedAt && t.completedAt < cutoff)));
    if (!old.length || !(await putInArchive(old))) return 0;
    const ids = new Set(old.map((t) => t.id));
    state.tasks = state.tasks.filter((t) => !ids.has(t.id));
    save();
    render();
    return old.length;
  }

  // ---------- Queries ----------
  const listById = (id) => state.lists.find((l) => l.id === id);
  const taskById = (id) => state.tasks.find((t) => t.id === id);
  const listIndex = (id) => state.lists.findIndex((l) => l.id === id);

  function inView(t, view) {
    if (view === 'all') return true;
    if (view === 'starred') return t.starred;
    if (view === 'today') return !!t.due && t.due <= todayKey();
    return t.listId === view;
  }
  function matches(t, q) {
    if (!q) return true;
    q = q.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q);
  }
  function viewInfo() {
    const builtIn = VIEWS.find(([id]) => id === state.view);
    if (builtIn) return { id: state.view, title: builtIn[1], list: null };
    const l = listById(state.view);
    return { id: state.view, title: l ? l.name : '', list: l || null };
  }
  const currentSort = () => state.sortBy[state.view] || state.defaultSort;
  const openCount = (view) => state.tasks.filter((t) => !t.done && inView(t, view)).length;
  const dueCmp = (a, b) => (a.due === b.due ? 0 : !a.due ? 1 : !b.due ? -1 : a.due < b.due ? -1 : 1);
  function compare(a, b) {
    switch (currentSort()) {
      case 'due': return dueCmp(a, b) || b.priority - a.priority || a.order - b.order;
      case 'priority': return b.priority - a.priority || dueCmp(a, b) || a.order - b.order;
      default: return listIndex(a.listId) - listIndex(b.listId) || a.order - b.order;
    }
  }
  function visibleTasks() {
    const ts = state.tasks.filter((t) => inView(t, state.view) && matches(t, ui.search));
    return {
      active: ts.filter((t) => !t.done).sort(compare),
      done: ts.filter((t) => t.done).sort((a, b) => b.completedAt - a.completedAt),
    };
  }
  const doneOpen = () => !!ui.search || !!state.showCompleted[state.view];

  // ---------- Mutations ----------
  function topOrder(listId) {
    return Math.min(0, ...state.tasks.filter((t) => t.listId === listId).map((t) => t.order)) - 1;
  }
  function addTask(title, { due = '', priority = 0 } = {}) {
    const listId = listById(state.view) ? state.view : state.lists[0].id;
    const t = {
      id: uid(), listId, title, notes: '',
      due: due || (state.view === 'today' ? todayKey() : ''),
      priority,
      starred: state.view === 'starred',
      repeat: '', remind: '', schedule: null, steps: [], edits: {},
      done: false, completedAt: 0, createdAt: Date.now(),
      order: topOrder(listId),
    };
    state.tasks.push(t);
    save();
    return t;
  }
  // Completing a repeating task creates the next one (remembered so Undo can take it back).
  const spawned = new Map(); // completed task id -> { id, repeat }
  function setDone(t, done) {
    t.done = done;
    t.completedAt = done ? Date.now() : 0;
    if (done && t.repeat) {
      const due = nextDue(t.repeat, t.due);
      const next = {
        ...t, id: uid(), due, done: false, completedAt: 0, createdAt: Date.now(), edits: {},
        steps: (t.steps || []).map((x) => ({ text: x.text, done: false })), // checklist starts fresh
        schedule: t.schedule ? { ...t.schedule, days: [...t.schedule.days] } : null,
        remind: shiftRemind(t.remind, t.due, due), // same time, same distance from the due date
      };
      state.tasks.push(next);
      spawned.set(t.id, { id: next.id, repeat: t.repeat });
      t.repeat = ''; // the finished copy doesn't repeat again
    } else if (!done && spawned.has(t.id)) {
      const s = spawned.get(t.id);
      spawned.delete(t.id);
      const n = taskById(s.id);
      if (n && !n.done) state.tasks.splice(state.tasks.indexOf(n), 1);
      t.repeat = s.repeat;
    }
    save();
  }
  function removeTask(t) {
    const i = state.tasks.indexOf(t);
    if (i < 0) return () => {};
    state.tasks.splice(i, 1);
    if (ui.openTaskId === t.id) ui.openTaskId = null;
    save();
    return () => {
      state.tasks.splice(Math.min(i, state.tasks.length), 0, t);
      save();
      render();
    };
  }

  // ---------- DOM refs ----------
  const sidebar = $('#sidebar');
  const main = $('#main');
  const details = $('#details');
  const scrim = $('#scrim');
  const toastEl = $('#toast');
  const modal = $('#modal');
  const importFile = $('#importFile');
  const searchInput = $('#search');
  const themeBtn = $('#themeBtn');
  const menuBtn = $('#menuBtn');
  const openTabBtn = $('#openTabBtn');

  const narrowMQ = matchMedia('(max-width: 860px)');
  const overlayDetailsMQ = matchMedia('(max-width: 1180px)');
  const darkMQ = matchMedia('(prefers-color-scheme: dark)');

  // ---------- Rendering ----------
  function render() {
    applyTheme();
    renderSidebar();
    renderMain();
    renderDetails();
  }

  function navItem(id, label, ic) {
    const active = state.view === id;
    const n = openCount(id);
    return `<li><button type="button" class="nav-item${active ? ' active' : ''}" data-view="${esc(id)}"${active ? ' aria-current="page"' : ''}>` +
      `${icon(ic)}<span class="nav-label">${esc(label)}</span>${n ? `<span class="count" aria-label="${n} open">${n}</span>` : ''}</button></li>`;
  }

  function renderSidebar() {
    sidebar.innerHTML =
      `<button type="button" class="create-btn" data-action="create">${icon('plus')}<span>Create</span></button>` +
      `<ul class="nav">${VIEWS.map(([id, label, ic]) => navItem(id, label, ic)).join('')}</ul>` +
      `<div class="nav-heading"><span>Lists</span>` +
      `<button type="button" class="icon-btn sm" data-action="new-list" aria-label="Create new list">${icon('plus')}</button></div>` +
      `<ul class="nav">${state.lists.map((l) => navItem(l.id, l.name, 'list')).join('')}</ul>` +
      `<div class="sidebar-foot">` +
      syncStatusHTML() +
      `<button type="button" class="text-btn" data-action="settings">${icon('settings')}Settings</button>` +
      `<button type="button" class="text-btn" data-action="export">${icon('download')}Export backup</button>` +
      `<button type="button" class="text-btn" data-action="import">${icon('upload')}Import backup</button>` +
      `</div>`;
  }

  function taskRow(t, v, canDrag) {
    const meta = [];
    if (t.due) {
      meta.push(t.done
        ? `<span class="chip">${icon('calendar')}${esc(fmtDue(t.due))}</span>`
        : `<button type="button" class="chip chip-btn ${dueClass(t)}" data-action="pick-due"${t.repeat ? ` title="${esc(repeatLabel(t.repeat, t.due))}"` : ''} aria-label="Due ${esc(fmtDue(t.due))}${t.repeat ? `, repeats ${esc(repeatLabel(t.repeat, t.due).toLowerCase())}` : ''}. Change due date">${icon('calendar')}${esc(fmtDue(t.due))}${t.repeat ? icon('repeat', 'chip-repeat') : ''}</button>`);
    }
    if (t.priority) {
      meta.push(t.done
        ? `<span class="chip">${icon('flag')}${PRI[t.priority]}</span>`
        : `<button type="button" class="chip chip-btn pri-${t.priority}" data-action="pick-pri" aria-label="${PRI[t.priority]} priority. Change priority">${icon('flag')}${PRI[t.priority]}</button>`);
    }
    if (t.schedule && !t.done && !(t.remind && !remindPast(t.remind))) {
      meta.push(`<button type="button" class="chip chip-btn" data-action="open-remind" aria-label="Reminder ${esc(scheduleLabel(t.schedule))}. Change reminder">${icon('bell')}${esc(scheduleLabel(t.schedule))}${icon('repeat', 'chip-repeat')}</button>`);
    } else if (t.remind && !t.done) {
      meta.push(`<button type="button" class="chip chip-btn${remindPast(t.remind) ? ' chip-muted' : ''}" data-action="open-remind" aria-label="Reminder ${esc(fmtRemind(t.remind))}. Change reminder">${icon('bell')}${esc(fmtRemind(t.remind))}</button>`);
    }
    if (t.steps && t.steps.length) {
      const n = t.steps.filter((x) => x.done).length;
      meta.push(`<button type="button" class="chip chip-btn${n === t.steps.length ? ' chip-done' : ''}" data-action="open-steps" aria-label="${n} of ${t.steps.length} steps done. Show steps">${icon('steps')}${n}/${t.steps.length}</button>`);
    }
    if (!v.list) {
      const l = listById(t.listId);
      if (l) meta.push(`<span class="chip">${esc(l.name)}</span>`);
    }
    if (t.notes.trim()) meta.push(`<span class="notes-preview">${esc(t.notes.trim().split('\n')[0])}</span>`);
    const label = esc(t.title || 'Untitled task');
    return `<li class="task${t.done ? ' is-done' : ''}${ui.openTaskId === t.id ? ' is-open' : ''}${ui.drawerId === t.id ? ' drawer-open' : ''}" data-id="${esc(t.id)}">` +
      (canDrag ? `<button type="button" class="grip" tabindex="-1" aria-hidden="true">${icon('grip')}</button>` : '') +
      `<button type="button" class="check" data-action="toggle" role="checkbox" aria-checked="${t.done}" ` +
      `aria-label="${t.done ? 'Mark not complete' : 'Mark complete'}: ${label}" title="${t.done ? 'Mark not complete' : 'Mark complete'}">` +
      `<span class="check-circle">${icon('check')}</span></button>` +
      `<div class="task-body">` +
      `<textarea class="task-title" rows="1" placeholder="Title" aria-label="Task title" spellcheck="false"${t.done ? ' readonly' : ''}>${esc(t.title)}</textarea>` +
      (meta.length ? `<div class="meta" data-action="open">${meta.join('')}</div>` : '') +
      `</div>` +
      (t.starred ? `<span class="star-badge" aria-hidden="true">${icon('star')}</span>` : '') +
      `<div class="row-actions" id="drawer-${esc(t.id)}">` +
      (t.done ? '' :
        `<button type="button" class="icon-btn${t.due ? ' set' : ''}" data-action="pick-due" title="${t.due ? 'Change due date' : 'Add due date'}" aria-label="${t.due ? 'Change' : 'Add'} due date: ${label}">${icon('calendar')}</button>` +
        `<button type="button" class="icon-btn pri-${t.priority}" data-action="pick-pri" title="${t.priority ? 'Change priority' : 'Set priority'}" aria-label="${t.priority ? 'Change' : 'Set'} priority: ${label}">${icon('flag')}</button>`) +
      `<button type="button" class="icon-btn star${t.starred ? ' on' : ''}" data-action="star" aria-pressed="${t.starred}" title="${t.starred ? 'Unstar' : 'Star'}" aria-label="Star: ${label}">${icon('star')}</button>` +
      `<button type="button" class="icon-btn" data-action="open" title="Details" aria-label="Details: ${label}">${icon('details')}</button>` +
      `<button type="button" class="icon-btn del" data-action="delete" title="Delete task" aria-label="Delete: ${label}">${icon('trash')}</button>` +
      `</div>` +
      `<button type="button" class="icon-btn more-btn" data-action="row-more" aria-controls="drawer-${esc(t.id)}" aria-expanded="${ui.drawerId === t.id}" title="${ui.drawerId === t.id ? 'Close options' : 'Options'}" aria-label="Options: ${label}">${icon('more', 'i-more')}${icon('close', 'i-close')}</button>` +
      `</li>`;
  }

  function emptyState(v, anyDone) {
    let ic = 'party';
    let title = 'No tasks yet';
    let text = 'Add a task above to get started.';
    if (ui.search) { ic = 'search'; title = 'No matching tasks'; text = 'Try a different search.'; }
    else if (anyDone) { title = 'All done'; text = 'Nice work. Everything here is checked off.'; }
    else if (v.id === 'starred') { ic = 'star'; title = 'No starred tasks'; text = 'Star a task to keep it here.'; }
    else if (v.id === 'today') { ic = 'calendar'; title = 'Nothing due today'; text = 'Tasks with a due date of today or earlier show up here.'; }
    return `<div class="empty">${icon(ic)}<p class="empty-title">${title}</p><p>${text}</p></div>`;
  }

  // ---------- Asking for a review (once, gently) ----------
  // After 20 tasks completed on this computer, a small card asks for a store review.
  // "Not now" asks once more after 60; closing it or reviewing never asks again.
  // Counted only on this computer; nothing is sent anywhere.
  const REVIEW_KEY = 'checkrow:review';
  const storeUrl = (medium) => `https://chromewebstore.google.com/detail/${chrome.runtime.id}${medium === 'review_prompt' || medium === 'settings_rate' ? '/reviews' : ''}?utm_source=app&utm_medium=${medium}`;
  function reviewState() {
    try { return { done: 0, ask: 'yes', at: 20, ...JSON.parse(localStorage.getItem(REVIEW_KEY) || '{}') }; } catch (e) { return { done: 0, ask: 'yes', at: 20 }; }
  }
  function setReviewState(r) { try { localStorage.setItem(REVIEW_KEY, JSON.stringify(r)); } catch (e) { /* ignore */ } }
  function countCompletion() { const r = reviewState(); r.done += 1; setReviewState(r); }
  const showReviewAsk = () => { const r = reviewState(); return isExtension && r.ask !== 'never' && r.done >= r.at; };
  function reviewAskHTML() {
    return `<div class="review-ask" role="region" aria-label="Review CheckRow">${icon('star')}` +
      `<p>Enjoying CheckRow? A quick review helps other people find it.</p>` +
      `<div class="review-actions"><button type="button" class="btn primary" data-action="review-yes">Leave a review</button>` +
      `<button type="button" class="text-btn" data-action="review-later">Not now</button></div>` +
      `<button type="button" class="icon-btn review-close" data-action="review-never" title="Don’t ask again" aria-label="Don’t ask again">${icon('close')}</button></div>`;
  }

  function renderMain() {
    const v = viewInfo();
    const { active, done } = visibleTasks();
    const canDrag = currentSort() === 'order' && !!v.list && !ui.search && active.length > 1;
    const open = doneOpen();
    const pendingText = $('#addInput')?.value || ''; // keep a half-typed task across re-renders
    main.innerHTML =
      `<div class="wrap">` +
      `<div class="main-head"><h1>${esc(v.title)}</h1><div class="head-actions">` +
      `<label class="sort"><span class="sort-label">Sort</span><span class="select-wrap">` +
      `<select id="sortSel" class="select pill" aria-label="Sort tasks by">` +
      SORTS.map(([k, label]) => `<option value="${k}"${currentSort() === k ? ' selected' : ''}>${label}${state.defaultSort === k ? ' (default)' : ''}</option>`).join('') +
      `</select>${icon('chevron', 'select-chev')}</span></label>` +
      `<button type="button" class="btn brief-btn" data-action="brief" aria-label="AI Brief">${icon('sparkle')}<span class="brief-label">AI Brief</span></button>` +
      (v.list ? `<button type="button" class="icon-btn" data-action="list-menu" aria-label="List options" aria-haspopup="menu" aria-expanded="false">${icon('more', 'fill')}</button>` : '') +
      `</div></div>` +
      `<form class="add-row" id="addForm" autocomplete="off"><span class="add-ico">${icon('plus')}</span>` +
      `<input id="addInput" placeholder="Add a task" aria-label="Add a task" maxlength="500">` +
      `<div class="add-opts">` +
      `<button type="button" class="opt-btn${ui.draft.due ? ` set ${dueClass({ due: ui.draft.due })}` : ''}" data-action="draft-due" ` +
      `aria-label="${ui.draft.due ? `Due ${esc(fmtDue(ui.draft.due))}. Change due date for new task` : 'Set due date for new task'}">` +
      `${icon('calendar')}${ui.draft.due ? `<span>${esc(fmtDue(ui.draft.due))}</span>` : ''}</button>` +
      `<button type="button" class="opt-btn pri-${ui.draft.priority}${ui.draft.priority ? ' set' : ''}" data-action="draft-pri" ` +
      `aria-label="${ui.draft.priority ? `${PRI[ui.draft.priority]} priority. Change priority for new task` : 'Set priority for new task'}">` +
      `${icon('flag')}${ui.draft.priority ? `<span>${PRI[ui.draft.priority]}</span>` : ''}</button>` +
      `</div></form>` +
      (ui.search ? `<p class="hint">Results for “${esc(ui.search)}”</p>` : '') +
      `<ul class="tasks" id="activeList">${active.map((t) => taskRow(t, v, canDrag)).join('')}</ul>` +
      (!active.length ? emptyState(v, done.length > 0) : '') +
      (done.length
        ? `<section class="done"><button type="button" class="done-toggle" data-action="toggle-done" aria-expanded="${open}">` +
          `${icon('chevron', open ? 'rot' : '')}Completed (${done.length})</button>` +
          (open ? `<ul class="tasks">${done.map((t) => taskRow(t, v, false)).join('')}</ul>` : '') +
          `</section>`
        : '') +
      `</div>`;
    if (pendingText) $('#addInput').value = pendingText;
    if (showReviewAsk() && !ui.search) main.insertAdjacentHTML('beforeend', reviewAskHTML());
    sizeTitles();
  }

  // Task names wrap. Long ones show two lines (fading out); hovering the task or clicking
  // in to edit grows the box to show the whole name.
  const TITLE_LINES = 2;
  function sizeTitle(el) {
    const from = el.style.height;
    el.style.height = 'auto';
    const cs = getComputedStyle(el);
    const line = parseFloat(cs.lineHeight) || 20;
    const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const full = el.scrollHeight;
    const max = line * TITLE_LINES + pad;
    const expanded = document.activeElement === el || el.closest('.task')?.classList.contains('expanded');
    const clamp = !expanded && full > max + 1;
    el.classList.toggle('clamped', clamp);
    const to = `${clamp ? max : full}px`;
    if (from && from !== to) { el.style.height = from; void el.offsetHeight; } // animate from where it was
    el.style.height = to;
  }
  function sizeTitles() {
    main.querySelectorAll('.task-title').forEach(sizeTitle);
    // After a re-draw, the row under the mouse stays expanded.
    main.querySelectorAll('.task:hover, .task.drawer-open').forEach((r) => setExpanded(r, true));
  }
  let titleWidth = 0;
  new ResizeObserver(() => {
    if (main.clientWidth !== titleWidth) { titleWidth = main.clientWidth; sizeTitles(); }
  }).observe(main);
  main.addEventListener('focusin', (e) => { if (e.target.matches('.task-title')) sizeTitle(e.target); });
  // Expand on hover, after a short pause so sweeping the mouse across the list
  // doesn't make rows jump. Only rows with a cut-off name change.
  let hoverTimer = 0;
  function setExpanded(row, on) {
    const ta = row && row.querySelector('.task-title');
    if (!ta || row.classList.contains('expanded') === on) return;
    if (on && !ta.classList.contains('clamped')) return;
    row.classList.toggle('expanded', on);
    sizeTitle(ta);
  }
  main.addEventListener('mouseover', (e) => {
    const row = e.target.closest('.task');
    if (!row || row.contains(e.relatedTarget)) return;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => { if (row.matches(':hover')) setExpanded(row, true); }, 180);
  });
  main.addEventListener('mouseout', (e) => {
    const row = e.target.closest('.task');
    if (!row || row.contains(e.relatedTarget)) return;
    clearTimeout(hoverTimer);
    if (!row.classList.contains('drawer-open')) setExpanded(row, false); // stays open while its drawer is
  });
  // When a drawer closes, its row shrinks back unless the mouse is still on it.
  new MutationObserver((muts) => {
    for (const m of muts) {
      const r = m.target;
      if (r.classList?.contains('task') && !r.classList.contains('drawer-open') && !r.matches(':hover') &&
          document.activeElement?.closest('.task') !== r) setExpanded(r, false);
    }
  }).observe(main, { subtree: true, attributes: true, attributeFilter: ['class'] });
  main.addEventListener('click', (e) => {
    const b = e.target.closest('[data-action="row-more"]');
    if (b) setExpanded(b.closest('.task'), true);
  });
  main.addEventListener('focusout', (e) => {
    if (e.target.matches('.task-title')) {
      e.target.scrollTop = 0;
      const row = e.target.closest('.task');
      if (row && !row.matches(':hover')) row.classList.remove('expanded');
      sizeTitle(e.target);
    }
  });
  main.addEventListener('input', (e) => {
    if (!e.target.matches('.task-title')) return;
    // Names are one paragraph: a pasted line break becomes a space.
    if (/[\r\n]/.test(e.target.value)) {
      const pos = e.target.selectionStart;
      e.target.value = e.target.value.replace(/\s*[\r\n]+\s*/g, ' ');
      e.target.setSelectionRange(pos, pos);
    }
    sizeTitle(e.target);
  });

  function renderDetails() {
    const t = taskById(ui.openTaskId);
    if (t && !Array.isArray(t.steps)) t.steps = [];
    if (!t) {
      ui.openTaskId = null;
      details.hidden = true;
      details.innerHTML = '';
      syncScrim();
      return;
    }
    // Remember what had focus inside the panel so a re-render doesn't steal it.
    const a = document.activeElement;
    let keep = null;
    if (a && details.contains(a)) {
      if (a.id) keep = `#${a.id}`;
      else if (a.name) keep = a.type === 'checkbox' ? `input[name="${a.name}"][value="${a.value}"]` : `input[name="${a.name}"]:checked`;
      else if (a.dataset && a.dataset.action) keep = `[data-action="${a.dataset.action}"]`;
    }
    const created = new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    details.hidden = false;
    details.innerHTML =
      `<div class="details-head"><h2>Task details</h2>` +
      `<button type="button" class="icon-btn" data-action="close-details" aria-label="Close details">${icon('close')}</button></div>` +
      `<div class="field"><label for="dTitle">Title</label>` +
      `<input id="dTitle" class="input title-input" value="${esc(t.title)}" placeholder="Title" maxlength="500"></div>` +
      `<div class="field"><label for="dNotes">Details</label>` +
      `<textarea id="dNotes" class="input" rows="4" placeholder="Add details" maxlength="2000">${esc(t.notes)}</textarea></div>` +
      `<div class="field"><span class="field-label" id="stepsLabel">Steps${t.steps.length ? ` <span class="steps-count">${t.steps.filter((x) => x.done).length} of ${t.steps.length}</span>` : ''}</span>` +
      (t.steps.length
        ? `<ul class="steps" aria-labelledby="stepsLabel">${t.steps.map((x, i) =>
          `<li class="step${x.done ? ' is-done' : ''}" data-i="${i}">` +
          `<button type="button" class="step-check" data-action="step-toggle" role="checkbox" aria-checked="${x.done}" aria-label="Done: ${esc(x.text || 'step')}">${icon('check')}</button>` +
          `<input id="dStep-${i}" class="step-text" value="${esc(x.text)}" maxlength="${STEP_MAX}" aria-label="Step ${i + 1}">` +
          `<button type="button" class="icon-btn step-del" data-action="step-del" title="Remove step" aria-label="Remove step: ${esc(x.text || 'step')}">${icon('close')}</button></li>`).join('')}</ul>`
        : '') +
      (t.steps.length < STEPS_MAX
        ? `<div class="step-add-row">${icon('plus')}<input id="dStepAdd" class="step-add" placeholder="Add a step" maxlength="${STEP_MAX}" aria-label="Add a step"></div>`
        : `<p class="field-help">That’s the most steps a task can have (${STEPS_MAX}).</p>`) +
      `</div>` +
      `<div class="field"><label for="dDue">Due date</label><div class="row">` +
      `<input id="dDue" class="input" type="date" value="${esc(t.due)}">` +
      (t.due ? `<button type="button" class="text-btn" data-action="clear-due">Clear</button>` : '') +
      `</div></div>` +
      (t.done ? '' : `<div class="field"><label for="dRepeat">Repeat</label><span class="select-wrap block"><select id="dRepeat" class="input select">` +
        ['', ...REPEATS].map((r) => `<option value="${r}"${(t.repeat || '') === r ? ' selected' : ''}>${esc(repeatLabel(r, t.due))}</option>`).join('') +
        `</select>${icon('chevron', 'select-chev')}</span></div>`) +
      (t.done ? '' : (() => {
        // One Reminder control: Off, Once (a date and time) or Repeating (days and a time).
        const mode = remindMode(t);
        const opts = [['off', 'Off'], ['once', 'Once'], ['repeat', 'Repeating']];
        return `<fieldset class="field remind"><legend>Reminder</legend><div class="seg">` +
          opts.map(([v, l]) => `<label class="seg-opt"><input type="radio" name="dRemindMode" value="${v}"${mode === v ? ' checked' : ''}><span>${v === 'off' ? '' : icon(v === 'once' ? 'bell' : 'repeat')}${l}</span></label>`).join('') +
          `</div>` +
          (mode === 'once'
            ? `<div class="row remind-row"><label class="sr-only" for="dRemind">Date and time</label><input id="dRemind" class="input" type="datetime-local" value="${esc(t.remind)}"></div>` +
              `<p class="field-help">${t.remind && remindPast(t.remind) ? 'This time has passed.' : 'A notification pops up at this time. Your browser needs to be open; if it isn’t, it shows when you next open it.'}</p>`
            : '') +
          (mode === 'repeat'
            ? `<div class="day-row compact remind-row" role="group" aria-label="Days">` +
              WEEK.map(([d, label]) => `<label class="day"><input type="checkbox" name="schedDay" value="${d}"${t.schedule && t.schedule.days.includes(d) ? ' checked' : ''}><span>${label}</span></label>`).join('') +
              `</div><div class="row"><label class="sr-only" for="dSchedTime">Time</label>` +
              `<input id="dSchedTime" class="input" type="time" value="${esc(t.schedule ? t.schedule.time : (ui.schedTime && ui.schedTime.id === t.id ? ui.schedTime.time : '09:00'))}"></div>` +
              `<p class="field-help">${t.schedule ? `${esc(scheduleLabel(t.schedule))}, until the task is done.` : 'Pick the days. It repeats until the task is done.'}</p>`
            : '') +
          `</fieldset>`;
      })() +
        `<div class="field"><button type="button" class="btn cal-btn" data-action="add-calendar"${calendarEvent(t) ? '' : ' disabled'}>${icon('calendar')}Add to calendar</button>` +
        `<p class="field-help">${calendarEvent(t) ? 'Your calendar can remind you on your phone, even when your computer is off.' : 'Set a due date or a reminder first.'}</p></div>`) +
      `<fieldset class="field"><legend>Priority</legend><div class="seg">` +
      PRI.map((p, i) => `<label class="seg-opt pri-${i}"><input type="radio" name="dPri" value="${i}"${t.priority === i ? ' checked' : ''}>` +
        `<span>${i ? icon('flag') : ''}${p}</span></label>`).join('') +
      `</div></fieldset>` +
      `<div class="field"><label for="dList">List</label><span class="select-wrap block"><select id="dList" class="input select">` +
      state.lists.map((l) => `<option value="${esc(l.id)}"${l.id === t.listId ? ' selected' : ''}>${esc(l.name)}</option>`).join('') +
      `</select>${icon('chevron', 'select-chev')}</span></div>` +
      (t.createdAt > 1577836800000 ? `<p class="created">Created ${esc(created)}</p>` : '') + // hide if the date is missing
      `<div class="details-foot">` +
      `<button type="button" class="btn" data-action="details-done">${icon('check')}${t.done ? 'Mark not complete' : 'Mark complete'}</button>` +
      `<button type="button" class="btn danger" data-action="delete-task">${icon('trash')}Delete</button>` +
      `</div>`;
    if (keep) details.querySelector(keep)?.focus();
    syncScrim();
  }

  function syncScrim() {
    const sidebarOverlay = narrowMQ.matches && document.body.classList.contains('sidebar-open');
    const detailsOverlay = overlayDetailsMQ.matches && !details.hidden;
    scrim.hidden = !(sidebarOverlay || detailsOverlay);
    openTabBtn.hidden = !(isExtension && narrowMQ.matches);
    searchInput.placeholder = narrowMQ.matches ? 'Search' : 'Search tasks';
  }

  // ---------- Theme ----------
  const isDark = () => state.theme === 'dark' || (state.theme === 'system' && darkMQ.matches);
  function applyTheme() {
    const root = document.documentElement;
    if (state.theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = state.theme;
    themeBtn.innerHTML = icon(isDark() ? 'sun' : 'moon');
    themeBtn.setAttribute('aria-label', isDark() ? 'Switch to light theme' : 'Switch to dark theme');
  }

  // ---------- Toast ----------
  let toastTimer = 0;
  function hideToast() { toastEl.hidden = true; clearTimeout(toastTimer); }
  function toast(message, undo, label = 'Undo') {
    clearTimeout(toastTimer);
    toastEl.innerHTML = `<span>${esc(message)}</span>${undo ? `<button type="button" class="toast-btn">${esc(label)}</button>` : ''}`;
    toastEl.hidden = false;
    if (undo) {
      toastEl.querySelector('.toast-btn').addEventListener('click', () => { hideToast(); undo(); });
    }
    toastTimer = setTimeout(hideToast, undo ? 6000 : 4000);
  }

  // ---------- Modal ----------
  function ask({ title, message = '', value = null, confirm = 'OK', danger = false }) {
    return new Promise((resolve) => {
      modal.returnValue = '';
      modal.innerHTML =
        `<form method="dialog" class="modal-form"><h2 id="modalTitle">${esc(title)}</h2>` +
        (message ? `<p>${esc(message)}</p>` : '') +
        (value !== null ? `<input id="modalInput" class="input" value="${esc(value)}" aria-labelledby="modalTitle" required maxlength="80" autocomplete="off">` : '') +
        `<div class="modal-actions">` +
        `<button value="ok" class="btn ${danger ? 'danger solid' : 'primary'}">${esc(confirm)}</button>` +
        `<button value="cancel" class="btn" formnovalidate>Cancel</button>` +
        `</div></form>`;
      modal.showModal();
      const input = $('#modalInput', modal);
      if (input) input.select();
      modal.addEventListener('close', () => {
        if (modal.returnValue !== 'ok') return resolve(null);
        resolve(input ? input.value.trim() || null : true);
      }, { once: true });
    });
  }

  // ---------- AI Brief ----------
  // Builds a plain-text summary of open tasks and hands it to the AI assistant the
  // person picks. Nothing is sent anywhere until they click a button; the brief is
  // copied to the clipboard and the assistant opens in a new tab (pre-filled where
  // the site supports it, otherwise the person pastes).
  const AI_TARGETS = [
    { id: 'claude', name: 'Claude', url: 'https://claude.ai/new', param: 'q' },
    { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/', param: 'q' },
    { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app', param: null },
    { id: 'grok', name: 'Grok', url: 'https://grok.com/', param: 'q' },
  ];
  // Chat apps can't take a message in a link (except Teams, for a chat with yourself),
  // so these copy the brief and open the app for a quick paste.
  const CHAT_TARGETS = [
    { id: 'teams', name: 'Teams', url: 'https://teams.microsoft.com/' },
    { id: 'slack', name: 'Slack', url: 'https://app.slack.com/client' },
    { id: 'gchat', name: 'Google Chat', url: 'https://chat.google.com/' },
  ];
  // With a work email saved: Teams opens a chat with yourself, pre-filled; Google
  // apps open in that Google account (authuser) when several are signed in.
  const withGoogleAccount = (url) => (state.chatEmail ? `${url}${url.includes('?') ? '&' : '?'}authuser=${encodeURIComponent(state.chatEmail)}` : url);
  function chatUrl(target, text) {
    if (target.id === 'teams' && state.chatEmail && text.length <= 3000) {
      return `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(state.chatEmail)}&message=${encodeURIComponent(text)}`;
    }
    if (target.id === 'gchat') return withGoogleAccount(target.url);
    return target.url;
  }
  const BRIEF_PROMPT =
    'Here is my to-do list from CheckRow. Give me a short morning brief: what’s overdue, what’s due today, ' +
    'the three things I should focus on first and why, and anything worth rescheduling. Keep it concise.';

  function buildBrief(scope) {
    const today = todayKey();
    const weekOut = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return toKey(d); })();
    const open = state.tasks
      .filter((t) => !t.done && (scope === 'all' || t.listId === scope))
      .sort((a, b) => b.priority - a.priority || dueCmp(a, b) || a.order - b.order);
    const doneToday = state.tasks.filter((t) => t.done && (scope === 'all' || t.listId === scope) &&
      t.completedAt && toKey(new Date(t.completedAt)) === today).length;
    const groups = [
      ['Overdue', (t) => t.due && t.due < today],
      ['Due today', (t) => t.due === today],
      ['Coming up (next 7 days)', (t) => t.due > today && t.due <= weekOut],
      ['Later', (t) => t.due > weekOut],
      ['No due date', (t) => !t.due],
    ];
    const line = (t) => {
      const bits = [];
      if (t.priority) bits.push(`${PRI[t.priority]} priority`);
      if (t.due && t.due !== today) bits.push(`due ${fmtDue(t.due)}`);
      if (t.starred) bits.push('starred');
      if (scope === 'all') { const l = listById(t.listId); if (l) bits.push(`list: ${l.name}`); }
      let s = `- ${t.title.trim() || 'Untitled task'}${bits.length ? ` (${bits.join(', ')})` : ''}`;
      const notes = t.notes.trim().replace(/\s*\n+\s*/g, ' / ');
      if (notes) s += `\n  Notes: ${notes.length > 240 ? `${notes.slice(0, 237)}...` : notes}`;
      return s;
    };
    const dateText = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const scopeText = scope === 'all' ? 'all lists' : `the "${listById(scope)?.name || ''}" list`;
    const overdue = open.filter(groups[0][1]).length;
    const dueToday = open.filter(groups[1][1]).length;
    const out = [
      BRIEF_PROMPT,
      '',
      `My tasks as of ${dateText} (${scopeText}): ${open.length} open, ${overdue} overdue, ${dueToday} due today` +
        (doneToday ? `, ${doneToday} already completed today` : '') + '.',
    ];
    if (!open.length) out.push('', 'No open tasks right now.');
    for (const [title, test] of groups) {
      const ts = open.filter(test);
      if (!ts.length) continue;
      out.push('', `${title}:`, ...ts.map(line));
    }
    return out.join('\n');
  }

  async function copyText(text, fallbackEl) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      if (!fallbackEl) return false;
      fallbackEl.select();
      try { return document.execCommand('copy'); } catch (err) { return false; }
    }
  }
  // ---------- Add to calendar ----------
  // The event: at the reminder time (15 minutes), or the next scheduled reminder (repeating
  // weekly), or all day on the due date. Opens in the person's own calendar; nothing is
  // sent anywhere else.
  function calendarEvent(t) {
    if (t.done) return null;
    const notes = [t.notes, t.steps && t.steps.length ? t.steps.map((x) => `${x.done ? '☑' : '☐'} ${x.text}`).join('\n') : '', 'Added from CheckRow'].filter(Boolean).join('\n\n');
    const base = { title: t.title || 'Untitled task', notes, id: t.id };
    if (t.remind && !remindPast(t.remind)) return { ...base, start: new Date(t.remind) };
    if (t.schedule) {
      const now = new Date();
      for (let i = 0; i < 8; i += 1) {
        const d = new Date(now); d.setDate(d.getDate() + i);
        if (!t.schedule.days.includes(d.getDay())) continue;
        const [h, m] = t.schedule.time.split(':').map(Number);
        d.setHours(h, m, 0, 0);
        if (d > now) return { ...base, start: d, weekly: t.schedule.days };
      }
    }
    if (t.remind) return { ...base, start: new Date(t.remind) };
    if (t.due) return { ...base, allDay: t.due };
    return null;
  }
  const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const icsLocal = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const icsDate = (k) => k.replace(/-/g, '');
  const nextDayKey = (k) => { const d = parseKey(k); d.setDate(d.getDate() + 1); return toKey(d); };
  const isoOffset = (d) => {
    const o = -d.getTimezoneOffset();
    return `${toKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:00${o >= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(o) / 60))}:${pad(Math.abs(o) % 60)}`;
  };
  function googleCalendarUrl(ev) {
    const end = ev.start && new Date(ev.start.getTime() + 15 * 60000);
    const q = new URLSearchParams({
      action: 'TEMPLATE', text: ev.title, details: ev.notes,
      dates: ev.allDay ? `${icsDate(ev.allDay)}/${icsDate(nextDayKey(ev.allDay))}` : `${icsLocal(ev.start)}/${icsLocal(end)}`,
    });
    if (!ev.allDay) q.set('ctz', Intl.DateTimeFormat().resolvedOptions().timeZone);
    if (ev.weekly) q.set('recur', `RRULE:FREQ=WEEKLY;BYDAY=${ev.weekly.map((d) => BYDAY[d]).join(',')}`);
    if (state.chatEmail) q.set('authuser', state.chatEmail);
    return `https://calendar.google.com/calendar/render?${q}`;
  }
  function outlookUrl(ev, host) {
    const q = new URLSearchParams({ path: '/calendar/action/compose', rru: 'addevent', subject: ev.title, body: ev.notes });
    if (ev.allDay) { q.set('startdt', ev.allDay); q.set('enddt', nextDayKey(ev.allDay)); q.set('allday', 'true'); }
    else { q.set('startdt', isoOffset(ev.start)); q.set('enddt', isoOffset(new Date(ev.start.getTime() + 15 * 60000))); q.set('allday', 'false'); }
    return `https://${host}/calendar/0/deeplink/compose?${q}`;
  }
  const icsText = (s) => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
  function icsFile(ev) {
    const now = new Date();
    const utc = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CheckRow//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      `UID:${ev.id}-${Date.now()}@checkrow`, `DTSTAMP:${utc}`];
    if (ev.allDay) lines.push(`DTSTART;VALUE=DATE:${icsDate(ev.allDay)}`, `DTEND;VALUE=DATE:${icsDate(nextDayKey(ev.allDay))}`);
    else lines.push(`DTSTART:${icsLocal(ev.start)}`, `DTEND:${icsLocal(new Date(ev.start.getTime() + 15 * 60000))}`);
    if (ev.weekly) lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${ev.weekly.map((d) => BYDAY[d]).join(',')}`);
    lines.push(`SUMMARY:${icsText(ev.title)}`, `DESCRIPTION:${icsText(ev.notes)}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsText(ev.title)}`, `TRIGGER:${ev.allDay ? 'PT9H' : 'PT0M'}`, 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR');
    return lines.join('\r\n') + '\r\n';
  }
  function calendarMenu(anchor, t) {
    const ev = calendarEvent(t);
    if (!ev) return;
    const once = ev.weekly ? () => toast('Outlook adds it once. To repeat it, open the event in Outlook and choose Repeat.') : () => {};
    openMenu(anchor, [
      { label: 'Google Calendar', run: () => openUrl(googleCalendarUrl(ev)) },
      { label: 'Outlook (work or school)', run: () => { openUrl(outlookUrl(ev, 'outlook.office.com')); once(); } },
      { label: 'Outlook.com', run: () => { openUrl(outlookUrl(ev, 'outlook.live.com')); once(); } },
      { type: 'sep' },
      {
        label: 'Apple Calendar or other (.ics file)', run: () => {
          const url = URL.createObjectURL(new Blob([icsFile(ev)], { type: 'text/calendar' }));
          const a = document.createElement('a');
          a.href = url;
          a.download = `${(t.title || 'task').replace(/[^\w\- ]+/g, '').trim().slice(0, 40) || 'task'}.ics`;
          document.body.append(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          toast('Calendar file downloaded. Open it to add the event.');
        },
      },
    ]);
  }

  function openUrl(url) {
    if (isExtension) chrome.tabs.create({ url });
    else window.open(url, '_blank', 'noopener');
  }

  function openBrief() {
    const pasteKey = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘V' : 'Ctrl+V';
    modal.returnValue = '';
    modal.classList.add('wide');
    modal.innerHTML =
      `<form method="dialog" class="modal-form brief-form">` +
      `<div class="brief-head">${icon('sparkle')}<h2 id="briefTitle">AI Brief</h2></div>` +
      `<p>Send your tasks to an AI assistant for a morning brief or a plan for the day. Edit the text below first if you like.</p>` +
      `<div class="field"><label for="briefScope">Include</label><span class="select-wrap block">` +
      `<select id="briefScope" class="input select"><option value="all">All lists</option>` +
      state.lists.map((l) => `<option value="${esc(l.id)}">${esc(l.name)}</option>`).join('') +
      `</select>${icon('chevron', 'select-chev')}</span></div>` +
      `<div class="field"><label for="briefText">Brief</label>` +
      `<textarea id="briefText" class="input brief-text" rows="11" spellcheck="false"></textarea></div>` +
      `<div class="field"><span class="field-label" id="aiLabel">Open in</span>` +
      `<div class="ai-grid" role="group" aria-labelledby="aiLabel">` +
      AI_TARGETS.map((a) => `<button type="button" class="btn ai-btn" data-ai="${a.id}">${esc(a.name)}</button>`).join('') +
      `</div></div>` +
      `<div class="field"><span class="field-label" id="chatLabel">Send to my chat</span>` +
      `<div class="ai-grid chat-grid" role="group" aria-labelledby="chatLabel">` +
      CHAT_TARGETS.map((c) => `<button type="button" class="btn ai-btn" data-chat="${c.id}">${esc(c.name)}</button>`).join('') +
      `</div><p class="choices-note">The brief is copied for you. If the message box isn’t filled in, press ${pasteKey} to paste.` +
      (state.chatEmail ? '' : ' Add your work email in Settings so Teams, Google Chat and Gemini open in your work account. Teams also opens a chat with yourself with the brief typed in.') +
      `</p></div>` +
      `<div class="modal-actions"><button value="ok" class="btn">Close</button>` +
      `<button type="button" class="btn" data-ai="copy">${icon('copy')}Copy brief</button></div>` +
      `</form>`;
    const scopeSel = $('#briefScope', modal);
    const textEl = $('#briefText', modal);
    textEl.value = buildBrief('all');
    scopeSel.addEventListener('change', () => { textEl.value = buildBrief(scopeSel.value); });
    modal.querySelector('form').addEventListener('click', async (e) => {
      const c = e.target.closest('[data-chat]');
      if (c) {
        const target = CHAT_TARGETS.find((x) => x.id === c.dataset.chat);
        // In a chat the AI instructions are noise, so drop them unless the person edited them.
        let text = textEl.value;
        if (text.startsWith(BRIEF_PROMPT)) text = text.slice(BRIEF_PROMPT.length).replace(/^\s+/, '');
        const copied = await copyText(text, textEl);
        const url = chatUrl(target, text);
        openUrl(url);
        modal.close();
        const prefilled = target.id === 'teams' && url !== target.url;
        toast(prefilled
          ? 'Opening a Teams chat with yourself. Press Enter to send.'
          : copied
            ? `Brief copied. In ${target.name}, open your own chat and press ${pasteKey}.`
            : `Opened ${target.name}. Copy the brief from CheckRow and paste it in.`);
        return;
      }
      const b = e.target.closest('[data-ai]');
      if (!b) return;
      const text = textEl.value;
      const copied = await copyText(text, textEl);
      if (b.dataset.ai === 'copy') {
        toast(copied ? 'Brief copied' : 'Couldn’t copy. Select the text and copy it yourself.');
        return;
      }
      const target = AI_TARGETS.find((a) => a.id === b.dataset.ai);
      if (!target) return;
      // Very long briefs make URLs unreliable, so those rely on paste only.
      let url = target.param && text.length <= 6000
        ? `${target.url}?${target.param}=${encodeURIComponent(text)}`
        : target.url;
      if (target.id === 'gemini') url = withGoogleAccount(url);
      openUrl(url);
      modal.close();
      toast(copied
        ? `Brief copied. If ${target.name} isn’t filled in, press ${pasteKey} to paste.`
        : `Opened ${target.name}. Copy the brief from CheckRow and paste it in.`);
    });
    modal.addEventListener('close', () => modal.classList.remove('wide'), { once: true });
    modal.showModal();
    scopeSel.focus();
  }

  // ---------- Settings ----------
  function setDefaultSort(k) {
    if (!isSort(k) || k === state.defaultSort) return;
    state.defaultSort = k;
    state.sortBy = {}; // every list follows the new default
    save();
    render();
  }
  // Reminder settings live in chrome.storage.sync so the background worker can read
  // them and they follow the user to other computers.
  const canRemind = !!(syncArea && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage);
  const REMINDER_DEFAULT = { on: false, days: [1, 2, 3, 4, 5], time: '08:30' };
  async function getReminder() {
    try {
      const { reminder } = await syncArea.get('reminder');
      return { ...REMINDER_DEFAULT, ...(reminder || {}) };
    } catch (e) { return { ...REMINDER_DEFAULT }; }
  }
  async function setReminder(r) {
    const now = new Date();
    const [h, m] = r.time.split(':').map(Number);
    const passed = now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
    const items = { reminder: r };
    // Setting a time that has already passed today shouldn't fire a reminder right away.
    // The mark names the time too, so changing it to later today still reminds you.
    if (r.on && passed) items.reminderLast = `${todayKey()} ${r.time}`;
    try { await syncArea.set(items); } catch (e) { toast('Couldn’t save the reminder.'); }
  }

  // Toolbar count setting (read by the background worker, follows the account).
  async function getBadge() {
    try { const { badge } = await syncArea.get('badge'); return { on: true, ...(badge || {}) }; } catch (e) { return { on: true }; }
  }
  // Daily backups are written by the background worker into chrome.storage.local.
  async function getBackups() {
    if (!localArea) return [];
    try { const { backups } = await localArea.get('backups'); return Array.isArray(backups) ? backups : []; } catch (e) { return []; }
  }
  const backupTasks = (b) => Object.keys((b && b.items) || {}).filter((k) => k.startsWith('t:')).length;
  const dayLabel = (k) => parseKey(k).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  async function restoreBackup(day) {
    const b = (await getBackups()).find((x) => x.day === day);
    const remote = b && fromSyncItems(b.items);
    if (!remote) { toast('That backup couldn’t be read.'); return; }
    const n = remote.tasks.length;
    const ok = await ask({
      title: 'Restore this backup?',
      message: `Your tasks will be replaced with the ${n} task${n === 1 ? '' : 's'} saved on ${dayLabel(day)}. You can undo this right after.`,
      confirm: 'Restore',
      danger: true,
    });
    if (!ok) return;
    const previous = state;
    state = normalize({ ...state, lists: remote.lists, tasks: remote.tasks });
    ui.openTaskId = null;
    save();
    render();
    toast('Backup restored', () => { state = previous; save(); render(); });
  }

  // Archive view (inside the Settings window).
  async function showArchive() {
    const archive = (await getArchive()).slice().sort((a, b) => (b.c || 0) - (a.c || 0));
    const when = (ms) => (ms ? new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '');
    modal.innerHTML =
      `<form method="dialog" class="modal-form settings-form archive-view"><h2>Archive</h2>` +
      `<p class="choices-note">Tasks you completed more than ${ARCHIVE_DAYS} days ago. They’re kept on this computer only and don’t use sync space.</p>` +
      (archive.length
        ? `<ul class="archive-list">${archive.map((a) => {
          const l = listById(a.l);
          return `<li data-id="${esc(a.id)}"><div class="archive-text"><span class="archive-title">${esc(a.t || 'Untitled task')}</span>` +
            `<span class="archive-meta">Completed ${esc(when(a.c))}${l ? ` · ${esc(l.name)}` : ''}</span></div>` +
            `<button type="button" class="text-btn" data-action="archive-restore">Restore</button>` +
            `<button type="button" class="icon-btn del" data-action="archive-delete" title="Delete forever" aria-label="Delete forever: ${esc(a.t || 'Untitled task')}">${icon('trash')}</button></li>`;
        }).join('')}</ul>`
        : `<p class="empty-note">Nothing archived yet.</p>`) +
      `<div class="modal-actions">` +
      (archive.length ? `<button type="button" class="btn danger" data-action="archive-clear">Delete all</button>` : '') +
      `<button type="button" class="btn" data-action="archive-back">Back</button>` +
      `<button value="ok" class="btn primary">Done</button></div></form>`;
    const form = modal.querySelector('form');
    form.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-action]');
      if (!b) return;
      const id = b.closest('li')?.dataset.id;
      const all = await getArchive();
      if (b.dataset.action === 'archive-back') { openSettings(); return; }
      if (b.dataset.action === 'archive-clear') {
        if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Click again to delete all'; return; }
        await setArchive([]);
        toast('Archive emptied');
        showArchive();
        return;
      }
      const a = all.find((x) => x.id === id);
      if (!a) return;
      await setArchive(all.filter((x) => x.id !== id));
      if (b.dataset.action === 'archive-restore') {
        const t = unpackTask(a.id, a);
        if (!listById(t.listId)) t.listId = state.lists[0].id;
        Object.assign(t, { done: false, completedAt: 0, order: topOrder(t.listId) });
        if (!taskById(t.id)) state.tasks.push(normalize({ ...state, tasks: [t] }).tasks[0]);
        save();
        render();
        toast(`Task restored to ${listById(t.listId).name}`);
      }
      showArchive();
    });
  }

  // What to tell the person after "Send a test", including where their computer's
  // notification switch lives (the most common reason a notification doesn't appear).
  function testResultHTML(res) {
    const ua = navigator.userAgent;
    const browser = /Edg\//.test(ua) ? 'Microsoft Edge' : 'Google Chrome';
    const extPage = /Edg\//.test(ua) ? 'edge://extensions' : 'chrome://extensions';
    // userAgentData says "macOS" / "Windows"; older fields say "MacIntel" / "Win32".
    const plat = `${(navigator.userAgentData && navigator.userAgentData.platform) || ''} ${navigator.platform || ''} ${ua}`;
    const mac = /mac/i.test(plat) && !/win/i.test((navigator.userAgentData && navigator.userAgentData.platform) || '');
    const win = !mac && /win/i.test(plat);
    if (!res) {
      return `<strong>CheckRow’s background didn’t respond.</strong> Open <code>${extPage}</code>, click the reload button on CheckRow, then try again.`;
    }
    if (!res.ok) {
      return res.error === 'denied'
        ? `<strong>Notifications are turned off for CheckRow in ${browser}.</strong> Turn them back on in ${browser}’s settings, then try again.`
        : `<strong>The notification couldn’t be shown.</strong> ${esc(res.error)}`;
    }
    const steps = mac
      ? `Open <strong>System Settings › Notifications</strong>, choose <strong>${browser}</strong> and turn on <strong>Allow notifications</strong>. Also make sure <strong>Focus</strong> or Do Not Disturb is off.`
      : win
        ? `Open <strong>Settings › System › Notifications</strong>, turn notifications on for <strong>${browser}</strong>, and turn off <strong>Do not disturb</strong>.`
        : `Check that your computer allows notifications from ${browser} and that Do Not Disturb is off.`;
    return `<strong>Test notification sent.</strong> Didn’t see it? Your computer may be blocking notifications from ${browser}. ${steps}`;
  }

  async function openSettings() {
    const radio = (name, value, label, help, checked) =>
      `<label class="choice"><input type="radio" name="${name}" value="${value}"${checked ? ' checked' : ''}>` +
      `<span class="choice-text"><span class="choice-label">${esc(label)}</span>` +
      (help ? `<span class="choice-help">${esc(help)}</span>` : '') + `</span></label>`;
    const rem = canRemind ? await getReminder() : null;
    const badge = canRemind ? await getBadge() : null;
    let notify = { stay: false };
    if (canRemind) { try { notify = { stay: false, ...((await syncArea.get('notify')).notify || {}) }; } catch (e) { /* ignore */ } }
    const backups = localArea ? (await getBackups()).slice().reverse() : null;
    const archived = localArea ? (await getArchive()).length : 0;
    const doneCount = state.tasks.filter((t) => t.done).length;
    let shortcut = null;
    try {
      if (chrome.commands && chrome.commands.getAll) {
        const cmd = (await chrome.commands.getAll()).find((c) => c.name === 'open-checkrow');
        shortcut = cmd ? cmd.shortcut || '' : null;
      }
    } catch (e) { shortcut = null; }
    modal.returnValue = '';
    modal.classList.add('wide');
    modal.innerHTML =
      `<form method="dialog" class="modal-form settings-form">` +
      `<h2>Settings</h2>` +
      (rem
        ? `<fieldset class="choices"><legend>Daily reminder</legend>` +
          `<label class="switch-row"><input type="checkbox" id="remOn" role="switch"${rem.on ? ' checked' : ''}>` +
          `<span class="choice-text"><span class="choice-label">Remind me to send my AI Brief</span>` +
          `<span class="choice-help">A notification pops up at this time. Click it to send your tasks to Claude, ChatGPT, Teams, Slack and more.</span></span></label>` +
          `<div class="rem-detail"${rem.on ? '' : ' hidden'}>` +
          `<div class="day-row" role="group" aria-label="Days">` +
          WEEK.map(([d, label]) => `<label class="day"><input type="checkbox" name="remDay" value="${d}"${rem.days.includes(d) ? ' checked' : ''}><span>${label}</span></label>`).join('') +
          `</div>` +
          `<div class="row rem-time-row"><label for="remTime" class="field-label">Time</label>` +
          `<input id="remTime" class="input rem-time" type="time" value="${esc(rem.time)}" required>` +
          `<button type="button" class="text-btn" data-action="test-reminder">Send a test</button></div>` +
          `<div class="test-result" id="testResult" role="status" hidden></div>` +
          `<p class="choices-note">Your browser needs to be open. If it isn’t at that time, the reminder shows up when you next open it that day.</p>` +
          `</div></fieldset>`
        : '') +
      (canRemind
        ? `<fieldset class="choices"><legend>Notifications</legend>` +
          `<label class="switch-row"><input type="checkbox" id="notifyStay" role="switch"${notify.stay ? ' checked' : ''}>` +
          `<span class="choice-text"><span class="choice-label">Keep reminders on screen until I close them</span>` +
          `<span class="choice-help">On a Mac, also set Chrome’s notification style to Alerts in System Settings → Notifications.</span></span></label>` +
          `</fieldset>`
        : '') +
      (badge
        ? `<fieldset class="choices"><legend>Toolbar icon</legend>` +
          `<label class="switch-row"><input type="checkbox" id="badgeOn" role="switch"${badge.on ? ' checked' : ''}>` +
          `<span class="choice-text"><span class="choice-label">Show a count on the CheckRow icon</span>` +
          `<span class="choice-help">How many tasks are overdue or due today. Red when something is overdue.</span></span></label>` +
          `</fieldset>`
        : '') +
      (shortcut !== null
        ? `<fieldset class="choices"><legend>Shortcuts</legend>` +
          `<div class="shortcut-row"><span>Open CheckRow</span>` +
          (shortcut ? `<kbd>${esc(shortcut)}</kbd>` : `<span class="choice-help">Not set</span>`) +
          `<button type="button" class="text-btn" data-action="edit-shortcut">Change</button></div>` +
          `<p class="choices-note">To add something as a task, highlight text or right-click a link or page and choose <b>Add to CheckRow</b>.</p>` +
          `</fieldset>`
        : '') +
      (backups
        ? `<fieldset class="choices"><legend>Backups &amp; archive</legend>` +
          `<p class="choices-note flush">CheckRow saves a copy of your tasks on this computer once a day and keeps the last 7.</p>` +
          (backups.length
            ? `<ul class="backup-list">${backups.map((b) => `<li>${icon('history')}<span>${esc(dayLabel(b.day))} · ${backupTasks(b)} task${backupTasks(b) === 1 ? '' : 's'}</span>` +
              `<button type="button" class="text-btn" data-action="restore-backup" data-day="${esc(b.day)}">Restore</button></li>`).join('')}</ul>`
            : `<p class="empty-note">No backups yet. The first one is saved within a day.</p>`) +
          `<div class="archive-row">${icon('archive')}<span id="archiveCount">${archived} archived task${archived === 1 ? '' : 's'}</span>` +
          `<button type="button" class="text-btn" data-action="view-archive">View</button>` +
          `<button type="button" class="text-btn" data-action="archive-now"${doneCount ? '' : ' disabled'}>Archive all completed</button></div>` +
          `<p class="choices-note">Completed tasks move to the archive on this computer ${ARCHIVE_DAYS} days after you finish them, so sync never fills up.</p>` +
          `</fieldset>`
        : '') +
      (isExtension
        ? `<fieldset class="choices"><legend>Like CheckRow?</legend>` +
          `<div class="share-row"><button type="button" class="btn" data-action="rate">${icon('star')}Rate it</button>` +
          `<button type="button" class="btn" data-action="share">${icon('link')}Copy link to share</button></div>` +
          `<p class="choices-note">Reviews and word of mouth are how people find CheckRow.</p></fieldset>`
        : '') +
      `<fieldset class="choices"><legend>Default sort order</legend>` +
      SORTS.map(([k, label]) => radio('defaultSort', k, label, SORT_HELP[k], state.defaultSort === k)).join('') +
      `<p class="choices-note">Applies to every list. You can still sort one list differently from the menu at the top of that list.</p>` +
      `</fieldset>` +
      `<fieldset class="choices"><legend>AI Brief</legend>` +
      `<label for="chatEmail" class="choice-label">Your work email <span class="optional">(optional)</span></label>` +
      `<input id="chatEmail" class="input" type="email" autocomplete="email" placeholder="you@company.com" value="${esc(state.chatEmail)}">` +
      `<p class="choices-note">Opens Teams, Google Chat and Gemini in your work account, not a personal one. Teams also opens a chat with yourself with the brief typed in. Stays on this computer.</p>` +
      `</fieldset>` +
      `<fieldset class="choices"><legend>Theme</legend><div class="choice-row">` +
      [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']]
        .map(([k, label]) => radio('theme', k, label, '', state.theme === k)).join('') +
      `</div></fieldset>` +
      `<div class="modal-actions"><button value="ok" class="btn primary">Done</button></div>` +
      `</form>`;
    const form = modal.querySelector('form');
    const readReminder = () => ({
      on: $('#remOn', form).checked,
      days: [...form.querySelectorAll('input[name="remDay"]:checked')].map((i) => Number(i.value)),
      time: $('#remTime', form).value || REMINDER_DEFAULT.time,
    });
    form.addEventListener('change', (e) => {
      const n = e.target.name;
      const id = e.target.id;
      if (n === 'defaultSort') setDefaultSort(e.target.value);
      else if (n === 'theme') { state.theme = e.target.value; save(); applyTheme(); }
      else if (id === 'chatEmail') { state.chatEmail = e.target.value.trim(); save(); }
      else if (id === 'notifyStay') { syncArea.set({ notify: { stay: e.target.checked } }).catch(() => toast('Couldn’t save that setting.')); }
      else if (id === 'badgeOn') { syncArea.set({ badge: { on: e.target.checked } }).catch(() => toast('Couldn’t save that setting.')); }
      else if (id === 'remOn' || n === 'remDay' || id === 'remTime') {
        const r = readReminder();
        $('.rem-detail', form).hidden = !r.on;
        setReminder(r);
        if (id === 'remOn' && r.on && !r.days.length) toast('Pick at least one day for the reminder.');
      }
    });
    form.addEventListener('click', async (e) => {
      const act = e.target.closest('[data-action]');
      if (act && act.dataset.action === 'restore-backup') {
        // Wait for Settings to finish closing, or its close event would answer the next question.
        const day = act.dataset.day;
        modal.addEventListener('close', () => setTimeout(() => restoreBackup(day)), { once: true });
        modal.close();
        return;
      }
      if (act && act.dataset.action === 'view-archive') { showArchive(); return; }
      if (act && act.dataset.action === 'edit-shortcut') { chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }); return; }
      if (act && act.dataset.action === 'rate') { openUrl(storeUrl('settings_rate')); setReviewState({ ...reviewState(), ask: 'never' }); return; }
      if (act && act.dataset.action === 'share') {
        const ok = await copyText(`https://chromewebstore.google.com/detail/${chrome.runtime.id}?utm_source=share&utm_medium=app`);
        toast(ok ? 'Link copied. Paste it anywhere to share CheckRow.' : 'Couldn’t copy the link.');
        return;
      }
      if (act && act.dataset.action === 'archive-now') {
        act.disabled = true;
        const n = await archiveCompleted(true);
        const total = (await getArchive()).length;
        $('#archiveCount', form).textContent = `${total} archived task${total === 1 ? '' : 's'}`;
        toast(n ? `Archived ${n} completed task${n === 1 ? '' : 's'}` : 'No completed tasks to archive');
        return;
      }
      const btn = e.target.closest('[data-action="test-reminder"]');
      if (!btn) return;
      const out = $('#testResult', form);
      btn.disabled = true;
      let res = null;
      try { res = await chrome.runtime.sendMessage({ type: 'checkrow-test-reminder' }); } catch (err) { res = null; }
      btn.disabled = false;
      out.innerHTML = testResultHTML(res);
      out.className = `test-result${res && res.ok ? '' : ' warn'}`;
      out.hidden = false;
    });
    modal.addEventListener('close', () => modal.classList.remove('wide'), { once: true });
    if (!modal.open) modal.showModal();
    (form.querySelector('#remOn') || form.querySelector('input[name="defaultSort"]:checked'))?.focus();
  }

  // ---------- Menu ----------
  let menuEl = null;
  function closeMenu() {
    if (!menuEl) return;
    menuEl.anchor?.setAttribute('aria-expanded', 'false');
    menuEl.remove();
    menuEl = null;
  }
  // Items: { label, run, hint?, icon?, cls?, checked?, danger?, disabled? },
  // { type: 'date', label, value, run(value) } or { type: 'sep' }.
  function openMenu(anchor, items) {
    closeMenu();
    menuEl = document.createElement('div');
    menuEl.className = 'menu';
    menuEl.setAttribute('role', 'menu');
    menuEl.anchor = anchor;
    for (const it of items) {
      if (it.type === 'sep') {
        const sep = document.createElement('div');
        sep.className = 'menu-sep';
        sep.setAttribute('role', 'separator');
        menuEl.appendChild(sep);
        continue;
      }
      if (it.type === 'date') {
        const row = document.createElement('label');
        row.className = 'menu-date';
        row.innerHTML = `<span>${esc(it.label)}</span><input type="date" class="input" value="${esc(it.value || '')}">`;
        const input = row.querySelector('input');
        // The calendar picker applies right away; typing applies on Enter or when leaving
        // the box (applying on each keystroke would close the menu mid-edit).
        let typing = false;
        let done = false;
        const valid = () => input.value && Number(input.value.slice(0, 4)) >= 1970;
        const apply = () => { if (done || !valid()) return; done = true; closeMenu(); it.run(input.value); };
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); apply(); return; }
          if (e.key === 'Escape') { done = true; return; } // cancel
          if (e.key.length === 1 || e.key === 'Backspace' || e.key.startsWith('Arrow')) typing = true;
        });
        input.addEventListener('change', () => { if (!typing) apply(); });
        input.addEventListener('blur', () => { if (typing && input.value !== (it.value || '')) apply(); });
        menuEl.appendChild(row);
        continue;
      }
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'menu-item' + (it.danger ? ' danger' : '');
      const radio = it.checked !== undefined;
      b.setAttribute('role', radio ? 'menuitemradio' : 'menuitem');
      if (radio) b.setAttribute('aria-checked', String(!!it.checked));
      b.innerHTML =
        (it.icon ? `<span class="mi-ico ${it.cls || ''}">${icon(it.icon)}</span>` : '') +
        `<span class="mi-label">${esc(it.label)}</span>` +
        (it.hint ? `<span class="mi-hint">${esc(it.hint)}</span>` : '') +
        (radio ? `<span class="mi-check">${it.checked ? icon('check') : ''}</span>` : '');
      b.disabled = !!it.disabled;
      b.addEventListener('click', () => { closeMenu(); it.run(); });
      menuEl.appendChild(b);
    }
    menuEl.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const stops = [...menuEl.querySelectorAll('.menu-item:not(:disabled), .menu-date input')];
      const i = stops.indexOf(document.activeElement);
      const next = stops[(i + (e.key === 'ArrowDown' ? 1 : -1) + stops.length) % stops.length];
      if (next) { e.preventDefault(); next.focus(); }
    });
    document.body.appendChild(menuEl);
    const r = anchor.getBoundingClientRect();
    const w = menuEl.offsetWidth;
    const h = menuEl.offsetHeight;
    let top = r.bottom + 4;
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 4);
    const preferLeft = r.left + r.width / 2 < window.innerWidth / 2;
    const left = preferLeft ? r.left : r.right - w;
    menuEl.style.top = `${top}px`;
    menuEl.style.left = `${Math.max(8, Math.min(window.innerWidth - w - 8, left))}px`;
    anchor.setAttribute('aria-expanded', 'true');
    (menuEl.querySelector('.menu-item[aria-checked="true"]') || menuEl.querySelector('.menu-item:not(:disabled)'))?.focus();
  }

  // ---------- Inline due date & priority pickers ----------
  function dueMenu(anchor, current, apply, rep) {
    const plus = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return toKey(d); };
    const day = (k) => parseKey(k).toLocaleDateString(undefined, { weekday: 'short' });
    const full = (k) => parseKey(k).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const [today, tomorrow, nextWeek] = [plus(0), plus(1), plus(7)];
    openMenu(anchor, [
      { label: 'Today', hint: day(today), checked: current === today, run: () => apply(today) },
      { label: 'Tomorrow', hint: day(tomorrow), checked: current === tomorrow, run: () => apply(tomorrow) },
      { label: 'Next week', hint: full(nextWeek), checked: current === nextWeek, run: () => apply(nextWeek) },
      { type: 'date', label: 'Pick a date', value: current, run: (v) => apply(v) },
      ...(rep ? [{ type: 'sep' }, {
        label: 'Repeat', icon: 'repeat', hint: rep.value ? repeatLabel(rep.value, current).replace(/ on .*/, '') : 'Off',
        run: () => repeatMenu(anchor, rep.value, current, rep.apply),
      }, ...(rep.remind ? [{ label: 'Remind me', icon: 'bell', hint: rep.remindValue ? 'On' : 'Off', run: rep.remind }] : [])] : []),
      { type: 'sep' },
      { label: 'No due date', disabled: !current, run: () => apply('') },
    ]);
  }
  function repeatMenu(anchor, current, due, apply) {
    openMenu(anchor, ['', ...REPEATS].map((r) => ({
      label: repeatLabel(r, due), checked: (current || '') === r, run: () => apply(r),
    })));
  }
  function priorityMenu(anchor, current, apply) {
    openMenu(anchor, [3, 2, 1, 0].map((p) => ({
      label: p ? PRI[p] : 'No priority', icon: 'flag', cls: `pri-${p}`,
      checked: current === p, run: () => apply(p),
    })));
  }
  // After a pick with the keyboard, put focus back on the same control.
  function refocus(taskId, action, viaKeyboard) {
    if (!viaKeyboard) return;
    const sel = taskId
      ? `.task[data-id="${CSS.escape(taskId)}"] [data-action="${action}"]`
      : `[data-action="${action}"]`;
    main.querySelector(sel)?.focus();
  }

  // ---------- Actions ----------
  function selectView(id) {
    state.view = id;
    save();
    document.body.classList.remove('sidebar-open');
    render();
  }

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  // Where focus should go after a row leaves the list: the row now in its place,
  // else the one above, else the add box.
  function focusRowNear(listSel, index, part) {
    const rows = main.querySelectorAll(`${listSel} .task`);
    const row = rows[Math.min(index, rows.length - 1)];
    (row ? row.querySelector(part) : $('#addInput'))?.focus();
  }
  function rowIndex(li) {
    return li ? [...li.parentElement.children].indexOf(li) : -1;
  }

  // Completing saves at once; the row shows the check and fades for a moment before
  // moving to Completed, so it's clear what happened (skipped with reduced motion).
  function toggleTask(t, li) {
    const completing = !t.done;
    const fromActive = li && li.closest('#activeList');
    const index = rowIndex(li);
    const hadFocus = li && li.contains(document.activeElement);
    setDone(t, completing);
    const finish = () => {
      render();
      if (hadFocus && fromActive) focusRowNear('#activeList', index, '.check');
    };
    if (completing && fromActive && !reducedMotion.matches) {
      li.classList.add('is-done', 'completing');
      li.querySelector('.check')?.setAttribute('aria-checked', 'true');
      setTimeout(finish, 450);
    } else {
      finish();
    }
    const next = completing && spawned.has(t.id) ? taskById(spawned.get(t.id).id) : null;
    const when = next ? fmtDue(next.due) : '';
    const msg = next ? `Task completed. Next one ${/^(Today|Tomorrow)$/.test(when) ? when.toLowerCase() : `on ${when}`}` : 'Task completed';
    if (completing) { countCompletion(); toast(msg, () => { setDone(t, false); render(); }); }
    else toast('Task moved back to your list');
  }

  function openDetails(id, focus = '#dTitle') {
    ui.openTaskId = id;
    render();
    const el = $(focus);
    el?.focus();
    if (focus !== '#dTitle') el?.scrollIntoView({ block: 'center' });
  }
  function closeDetails() {
    const id = ui.openTaskId;
    ui.openTaskId = null;
    render();
    if (id) main.querySelector(`.task[data-id="${CSS.escape(id)}"] [data-action="open"].icon-btn`)?.focus();
  }

  function deleteTaskWithUndo(t, li) {
    const listSel = li && li.closest('#activeList') ? '#activeList' : '.done .tasks';
    const index = rowIndex(li);
    const hadFocus = li && li.contains(document.activeElement);
    const undo = removeTask(t);
    render();
    if (hadFocus) focusRowNear(listSel, index, '.check');
    toast('Task deleted', undo);
  }

  async function newList() {
    const name = await ask({ title: 'Create new list', value: '', confirm: 'Done' });
    if (!name) return;
    const l = { id: uid(), name };
    state.lists.push(l);
    selectView(l.id);
    $('#addInput')?.focus();
  }

  async function renameList(l) {
    const name = await ask({ title: 'Rename list', value: l.name, confirm: 'Save' });
    if (!name || name === l.name) return;
    l.name = name;
    save();
    render();
  }

  async function deleteList(l) {
    const n = state.tasks.filter((t) => t.listId === l.id).length;
    const ok = await ask({
      title: `Delete “${l.name}”?`,
      message: n ? `Its ${n} task${n === 1 ? '' : 's'} will be deleted too.` : 'This list is empty.',
      confirm: 'Delete',
      danger: true,
    });
    if (!ok) return;
    const li = state.lists.indexOf(l);
    const removed = state.tasks.filter((t) => t.listId === l.id);
    state.lists.splice(li, 1);
    state.tasks = state.tasks.filter((t) => t.listId !== l.id);
    if (removed.some((t) => t.id === ui.openTaskId)) ui.openTaskId = null;
    state.view = state.lists[Math.max(0, li - 1)].id;
    save();
    render();
    toast('List deleted', () => {
      state.lists.splice(Math.min(li, state.lists.length), 0, l);
      state.tasks.push(...removed);
      state.view = l.id;
      save();
      render();
    });
  }

  function deleteCompleted(l) {
    const removed = state.tasks.filter((t) => t.listId === l.id && t.done);
    if (!removed.length) return;
    state.tasks = state.tasks.filter((t) => !(t.listId === l.id && t.done));
    if (removed.some((t) => t.id === ui.openTaskId)) ui.openTaskId = null;
    save();
    render();
    toast(`${removed.length} completed task${removed.length === 1 ? '' : 's'} deleted`, () => {
      state.tasks.push(...removed);
      save();
      render();
    });
  }

  function openListMenu(anchor) {
    const l = listById(state.view);
    if (!l) return;
    const doneCount = state.tasks.filter((t) => t.listId === l.id && t.done).length;
    openMenu(anchor, [
      { label: 'Rename list', run: () => renameList(l) },
      { label: 'Delete all completed tasks', disabled: !doneCount, run: () => deleteCompleted(l) },
      { label: state.lists.length > 1 ? 'Delete list' : 'Delete list (need at least one)', danger: true, disabled: state.lists.length < 2, run: () => deleteList(l) },
    ]);
  }

  async function exportData() {
    const archive = await getArchive();
    const data = { app: 'CheckRow', exportedAt: new Date().toISOString(), ...state, ...(archive.length ? { archive } : {}) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checkrow-backup-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Backup downloaded');
  }

  async function importData(file) {
    let data;
    try {
      data = JSON.parse(await file.text());
      if (!isValid(data)) throw new Error('invalid');
    } catch (e) {
      toast('That file isn’t a CheckRow backup.');
      return;
    }
    const n = data.tasks.length;
    const ok = await ask({
      title: 'Replace your tasks?',
      message: `Everything here will be replaced with the ${data.lists.length} list${data.lists.length === 1 ? '' : 's'} and ${n} task${n === 1 ? '' : 's'} in “${file.name}”.`,
      confirm: 'Replace',
      danger: true,
    });
    if (!ok) return;
    const previous = state;
    state = normalize(data);
    ui.openTaskId = null;
    if (Array.isArray(data.archive) && data.archive.length) {
      const items = data.archive.filter((a) => a && typeof a.id === 'string' && a.l);
      await putInArchive(items.map((a) => unpackTask(a.id, a)));
    }
    save();
    render();
    toast('Backup imported', () => { state = previous; save(); render(); });
  }

  // ---------- Events: top bar ----------
  menuBtn.innerHTML = icon('menu');
  $('#searchIco').innerHTML = icon('search');
  openTabBtn.innerHTML = icon('external');

  menuBtn.addEventListener('click', () => {
    if (narrowMQ.matches) document.body.classList.toggle('sidebar-open');
    else document.body.classList.toggle('sidebar-collapsed');
    syncScrim();
  });
  themeBtn.addEventListener('click', () => {
    state.theme = isDark() ? 'light' : 'dark';
    save();
    applyTheme();
  });
  searchInput.addEventListener('input', () => {
    ui.search = searchInput.value.trim();
    renderMain();
  });
  scrim.addEventListener('click', () => {
    document.body.classList.remove('sidebar-open');
    if (overlayDetailsMQ.matches && ui.openTaskId) closeDetails();
    syncScrim();
  });

  // Extension only: open the full app in a tab from the side panel.
  const isExtension = typeof chrome !== 'undefined' && !!(chrome.runtime && chrome.runtime.id) && !!chrome.tabs;
  openTabBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  });

  // ---------- Events: sidebar ----------
  sidebar.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.view) { selectView(b.dataset.view); return; }
    switch (b.dataset.action) {
      case 'create':
        document.body.classList.remove('sidebar-open');
        syncScrim();
        $('#addInput')?.focus();
        break;
      case 'new-list': newList(); break;
      case 'settings':
        document.body.classList.remove('sidebar-open');
        syncScrim();
        openSettings();
        break;
      case 'export': exportData(); break;
      case 'import': importFile.click(); break;
    }
  });
  importFile.addEventListener('change', () => {
    const f = importFile.files && importFile.files[0];
    importFile.value = '';
    if (f) importData(f);
  });

  // ---------- Events: main ----------
  main.addEventListener('click', (e) => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    const li = b.closest('.task');
    const t = li ? taskById(li.dataset.id) : null;
    switch (b.dataset.action) {
      case 'toggle': if (t) toggleTask(t, li); break;
      case 'delete': if (t) deleteTaskWithUndo(t, li); break;
      case 'row-more': if (t) {
        const opening = ui.drawerId !== t.id;
        main.querySelectorAll('.task.drawer-open').forEach((r) => { r.classList.remove('drawer-open'); r.querySelector('.more-btn')?.setAttribute('aria-expanded', 'false'); });
        ui.drawerId = opening ? t.id : null;
        li.classList.toggle('drawer-open', opening);
        b.setAttribute('aria-expanded', String(opening));
        b.title = opening ? 'Close options' : 'Options';
      } break;
      case 'star': if (t) { t.starred = !t.starred; save(); render(); } break;
      case 'open': if (t) openDetails(t.id); break;
      case 'review-yes': openUrl(storeUrl('review_prompt')); setReviewState({ ...reviewState(), ask: 'never' }); renderMain(); break;
      case 'review-later': {
        const r = reviewState();
        setReviewState(r.ask === 'yes' ? { ...r, ask: 'later', at: Math.max(60, r.done + 40) } : { ...r, ask: 'never' });
        renderMain();
        break;
      }
      case 'review-never': setReviewState({ ...reviewState(), ask: 'never' }); renderMain(); break;
      case 'open-remind': if (t) openDetails(t.id, t.remind && !t.schedule ? '#dRemind' : t.schedule ? '#dSchedTime' : 'input[name="dRemindMode"]:checked'); break;
      case 'open-steps': if (t) openDetails(t.id, t.steps.length ? '#dStep-0' : '#dStepAdd'); break;
      case 'toggle-done':
        state.showCompleted[state.view] = !doneOpen();
        save();
        renderMain();
        $('.done-toggle')?.focus();
        break;
      case 'list-menu':
        if (menuEl) closeMenu(); else openListMenu(b);
        break;
      case 'brief':
        openBrief(b);
        break;
      case 'pick-due':
      case 'pick-pri':
      case 'draft-due':
      case 'draft-pri': {
        e.stopPropagation();
        if (menuEl && menuEl.anchor === b) { closeMenu(); break; }
        const kb = e.detail === 0;
        const action = b.dataset.action;
        if (action === 'pick-due' && t) {
          dueMenu(b, t.due, (v) => { t.due = v; if (!v) t.repeat = ''; save(); render(); refocus(t.id, action, kb); }, {
            value: t.repeat,
            apply: (r) => { t.repeat = r; if (r && !t.due) t.due = todayKey(); save(); render(); refocus(t.id, action, kb); },
            remindValue: t.remind || t.schedule,
            remind: () => openDetails(t.id, t.remind ? '#dRemind' : t.schedule ? '#dSchedTime' : 'input[name="dRemindMode"]:checked'),
          });
        } else if (action === 'pick-pri' && t) {
          priorityMenu(b, t.priority, (p) => { t.priority = p; save(); render(); refocus(t.id, action, kb); });
        } else if (action === 'draft-due') {
          dueMenu(b, ui.draft.due, (v) => { ui.draft.due = v; renderMain(); $('#addInput').focus(); });
        } else if (action === 'draft-pri') {
          priorityMenu(b, ui.draft.priority, (p) => { ui.draft.priority = p; renderMain(); $('#addInput').focus(); });
        }
        break;
      }
    }
  });
  main.addEventListener('submit', (e) => {
    if (e.target.id !== 'addForm') return;
    e.preventDefault();
    const input = $('#addInput');
    const title = input.value.trim();
    if (!title) return;
    const t = addTask(title, ui.draft);
    ui.draft = { due: '', priority: 0 };
    input.value = '';
    renderSidebar();
    renderMain();
    $('#addInput').focus();
    if (!inView(t, state.view)) toast(`Task added to ${listById(t.listId).name}`);
  });
  main.addEventListener('change', (e) => {
    if (e.target.id === 'sortSel') {
      // A list can keep its own sort; picking the default again clears that.
      if (e.target.value === state.defaultSort) delete state.sortBy[state.view];
      else state.sortBy[state.view] = e.target.value;
      save();
      renderMain();
      $('#sortSel')?.focus();
    } else if (e.target.matches('.task-title')) {
      const t = taskById(e.target.closest('.task').dataset.id);
      if (!t) return;
      t.title = e.target.value.trim();
      save();
      if (ui.openTaskId === t.id) renderDetails();
    }
  });
  main.addEventListener('keydown', (e) => {
    if (e.target.matches('.task-title') && e.key === 'Enter') {
      e.preventDefault();
      e.target.blur();
      return;
    }
    // Delete key on a selected row (its circle or one of its buttons) deletes the task.
    // Not while typing in the title, where Delete edits text.
    if (e.key === 'Delete' && !e.target.matches('input, textarea')) {
      const li = e.target.closest('.task');
      const t = li && taskById(li.dataset.id);
      if (t) { e.preventDefault(); deleteTaskWithUndo(t, li); }
    }
  });

  // Drag to reorder (list views, "My order" sort). Rows only become draggable from the grip.
  main.addEventListener('mousedown', (e) => {
    const g = e.target.closest('.grip');
    if (g) g.closest('.task').draggable = true;
  });
  document.addEventListener('mouseup', () => {
    if (!ui.dragId) main.querySelectorAll('.task[draggable="true"]').forEach((n) => { n.draggable = false; });
  });
  const clearDropMarks = () => main.querySelectorAll('.drop-before, .drop-after')
    .forEach((n) => n.classList.remove('drop-before', 'drop-after'));
  function endDrag() {
    ui.dragId = null;
    clearDropMarks();
    main.querySelectorAll('.task[draggable="true"]').forEach((n) => { n.draggable = false; n.classList.remove('dragging'); });
  }
  main.addEventListener('dragstart', (e) => {
    const li = e.target.closest && e.target.closest('.task');
    if (!li || !li.draggable) return;
    ui.dragId = li.dataset.id;
    li.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', li.dataset.id);
  });
  main.addEventListener('dragover', (e) => {
    if (!ui.dragId) return;
    const li = e.target.closest('#activeList .task');
    if (!li) return;
    e.preventDefault();
    clearDropMarks();
    if (li.dataset.id === ui.dragId) return;
    const r = li.getBoundingClientRect();
    li.classList.add(e.clientY < r.top + r.height / 2 ? 'drop-before' : 'drop-after');
  });
  main.addEventListener('drop', (e) => {
    if (!ui.dragId) return;
    e.preventDefault();
    const li = e.target.closest('#activeList .task');
    if (li && li.dataset.id !== ui.dragId) {
      const before = li.classList.contains('drop-before');
      const ids = [...main.querySelectorAll('#activeList .task')].map((n) => n.dataset.id).filter((id) => id !== ui.dragId);
      let idx = ids.indexOf(li.dataset.id);
      if (!before) idx += 1;
      ids.splice(idx, 0, ui.dragId);
      ids.forEach((id, i) => { const t = taskById(id); if (t) t.order = i; });
      save();
    }
    endDrag();
    renderMain();
  });
  main.addEventListener('dragend', () => { if (ui.dragId) { endDrag(); renderMain(); } });

  // ---------- Events: details panel ----------
  details.addEventListener('input', (e) => {
    const t = taskById(ui.openTaskId);
    if (!t) return;
    if (e.target.id === 'dTitle') t.title = e.target.value;
    else if (e.target.id === 'dNotes') t.notes = e.target.value;
    else if (e.target.matches('.step-text')) {
      const x = t.steps[Number(e.target.closest('.step').dataset.i)];
      if (!x) return;
      x.text = e.target.value;
    } else return;
    save();
    renderMain();
  });
  function addStep(t, input) {
    const text = input.value.trim().slice(0, STEP_MAX);
    input.value = ''; // cleared first, so the re-render's blur doesn't add it again
    if (!text || t.steps.length >= STEPS_MAX) return;
    t.steps = [...t.steps, { text, done: false }];
    save();
    renderMain();
    renderDetails();
    $('#dStepAdd')?.focus();
  }
  const TYPED_BOXES = ['dDue', 'dRemind', 'dSchedTime'];
  details.addEventListener('focusin', (e) => { if (TYPED_BOXES.includes(e.target.id)) ui.typingIn = e.target.id; });
  details.addEventListener('focusout', (e) => {
    if (!TYPED_BOXES.includes(e.target.id)) return;
    if (ui.typingIn === e.target.id) ui.typingIn = null;
    if (!ui.detailsStale) return;
    // After the browser has moved focus, redraw (focus is restored to where it went).
    setTimeout(() => {
      if (TYPED_BOXES.includes(document.activeElement && document.activeElement.id)) return;
      ui.detailsStale = false;
      renderDetails();
    });
  });
  details.addEventListener('keydown', (e) => {
    const t = taskById(ui.openTaskId);
    if (!t) return;
    if (e.target.id === 'dStepAdd' && e.key === 'Enter') { e.preventDefault(); addStep(t, e.target); return; }
    if (!e.target.matches('.step-text')) return;
    const i = Number(e.target.closest('.step').dataset.i);
    if (e.key === 'Enter') { e.preventDefault(); ($(`#dStep-${i + 1}`) || $('#dStepAdd'))?.focus(); }
    else if (e.key === 'Backspace' && !e.target.value) {
      // Backspace in an empty step removes it.
      e.preventDefault();
      t.steps = t.steps.filter((_, j) => j !== i);
      save(); renderMain(); renderDetails();
      ($(`#dStep-${Math.max(0, i - 1)}`) || $('#dStepAdd'))?.focus();
    }
  });
  details.addEventListener('change', (e) => {
    const t = taskById(ui.openTaskId);
    if (!t) return;
    if (e.target.id === 'dTitle') { t.title = t.title.trim(); }
    else if (e.target.id === 'dStepAdd') { addStep(t, e.target); return; }
    else if (e.target.matches('.step-text')) {
      const i = Number(e.target.closest('.step').dataset.i);
      const text = e.target.value.trim();
      t.steps = text ? t.steps.map((x, j) => (j === i ? { ...x, text } : x)) : t.steps.filter((_, j) => j !== i);
    }
    else if (e.target.name === 'dRemindMode') {
      const mode = e.target.value;
      ui.remindMode = { id: t.id, mode };
      if (mode !== 'once') t.remind = '';
      if (mode !== 'repeat') t.schedule = null;
      save(); renderMain(); renderDetails();
      (mode === 'once' ? $('#dRemind') : mode === 'repeat' ? details.querySelector('input[name="schedDay"]') : details.querySelector('input[name="dRemindMode"]:checked'))?.focus();
      return;
    }
    else if (e.target.name === 'schedDay' || e.target.id === 'dSchedTime') {
      const days = [...details.querySelectorAll('input[name="schedDay"]:checked')].map((x) => Number(x.value));
      const time = $('#dSchedTime').value || '09:00';
      ui.schedTime = { id: t.id, time }; // remembered while no day is picked yet
      t.schedule = days.length ? cleanSchedule({ days, time, since: Date.now() }) : null;
    }
    else if (e.target.id === 'dRemind') {
      const v = e.target.value;
      if (v && Number(v.slice(0, 4)) < 1970) return; // half-typed year
      t.remind = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) ? v : '';
    }
    else if (e.target.id === 'dDue') {
      const v = e.target.value;
      if (v && Number(v.slice(0, 4)) < 1970) return; // half-typed year
      t.due = v || ''; if (!t.due) t.repeat = '';
    }
    else if (e.target.id === 'dRepeat') {
      t.repeat = REPEATS.includes(e.target.value) ? e.target.value : '';
      if (t.repeat && !t.due) t.due = todayKey();
    }
    else if (e.target.name === 'dPri') { t.priority = Number(e.target.value); }
    else if (e.target.id === 'dList') {
      if (!listById(e.target.value)) return;
      t.listId = e.target.value;
      t.order = topOrder(t.listId);
    } else return;
    save();
    renderSidebar();
    renderMain();
    // Still typing in a date or time box: redrawing now would replace the box and lose
    // the rest of what's being typed. Redraw once focus leaves it.
    // (document.activeElement isn't reliable here: Chrome briefly reports nothing focused
    // while a date/time box moves between its parts, so track entering/leaving instead.)
    if (TYPED_BOXES.includes(e.target.id) && ui.typingIn === e.target.id) {
      ui.detailsStale = true;
      // Keep the Repeat choices' wording in step with the date ("Monthly on the 31st").
      if (e.target.id === 'dDue') for (const o of details.querySelectorAll('#dRepeat option')) o.textContent = repeatLabel(o.value, t.due);
      return;
    }
    renderDetails();
  });
  details.addEventListener('click', (e) => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    const t = taskById(ui.openTaskId);
    switch (b.dataset.action) {
      case 'close-details': closeDetails(); break;
      case 'clear-due':
        if (t) { t.due = ''; t.repeat = ''; save(); render(); $('#dDue')?.focus(); }
        break;
      case 'clear-remind':
        if (t) { t.remind = ''; save(); render(); $('#dRemind')?.focus(); }
        break;
      case 'clear-sched':
        if (t) { t.schedule = null; save(); render(); $('#dSchedTime')?.focus(); }
        break;
      case 'add-calendar':
        if (t) calendarMenu(b, t);
        break;
      case 'step-toggle': case 'step-del': {
        const i = Number(b.closest('.step').dataset.i);
        if (!t || !t.steps[i]) break;
        if (b.dataset.action === 'step-toggle') t.steps = t.steps.map((x, j) => (j === i ? { ...x, done: !x.done } : x));
        else t.steps = t.steps.filter((_, j) => j !== i);
        save(); renderMain(); renderDetails();
        ($(`.step[data-i="${i}"] [data-action="${b.dataset.action}"]`, details) || $('#dStepAdd'))?.focus();
        break;
      }
      case 'details-done':
        if (t) { toggleTask(t); $('[data-action="details-done"]')?.focus(); }
        break;
      case 'delete-task':
        if (t) deleteTaskWithUndo(t);
        break;
    }
  });

  // ---------- Global ----------
  document.addEventListener('mousedown', (e) => {
    if (menuEl && !menuEl.contains(e.target) && !(menuEl.anchor && menuEl.anchor.contains(e.target))) closeMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || modal.open) return;
    if (menuEl) { const a = menuEl.anchor; closeMenu(); a?.focus(); return; }
    if (ui.drawerId) { const r = main.querySelector('.task.drawer-open'); ui.drawerId = null; r?.classList.remove('drawer-open'); r?.querySelector('.more-btn')?.focus(); return; }
    if (document.body.classList.contains('sidebar-open')) { document.body.classList.remove('sidebar-open'); syncScrim(); return; }
    if (ui.openTaskId) closeDetails();
  });
  document.addEventListener('pointerdown', (e) => {
    if (!ui.drawerId || menuEl || e.target.closest('.task.drawer-open, .menu, .popover')) return;
    ui.drawerId = null;
    main.querySelectorAll('.task.drawer-open').forEach((r) => r.classList.remove('drawer-open'));
  });
  window.addEventListener('resize', closeMenu);
  narrowMQ.addEventListener('change', () => { document.body.classList.remove('sidebar-open'); syncScrim(); });
  overlayDetailsMQ.addEventListener('change', syncScrim);
  darkMQ.addEventListener('change', applyTheme);

  // Web version: keep two open tabs in step. (The extension uses chrome.storage events instead.)
  window.addEventListener('storage', (e) => {
    if (syncArea || e.key !== STORE_KEY) return;
    const fresh = load();
    state.lists = fresh.lists;
    state.tasks = fresh.tasks;
    if (!['all', 'today', 'starred'].includes(state.view) && !listById(state.view)) state.view = state.lists[0].id;
    if (ui.openTaskId && !taskById(ui.openTaskId)) ui.openTaskId = null;
    render();
  });

  // Push any pending changes when the panel or tab is closed or hidden.
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSync(); });
  window.addEventListener('pagehide', () => { flushSync(); });

  // Re-render at midnight so "Today" and overdue markers stay right.
  let lastDay = todayKey();
  setInterval(() => {
    const k = todayKey();
    if (k !== lastDay) { lastDay = k; render(); archiveCompleted(); }
  }, 60000);

  // Tasks added from the right-click menu before CheckRow had ever been opened.
  async function takePendingAdds() {
    if (!localArea) return;
    try {
      const { pendingAdds } = await localArea.get('pendingAdds');
      if (!Array.isArray(pendingAdds) || !pendingAdds.length) return;
      await localArea.remove('pendingAdds');
      for (const p of pendingAdds) {
        if (taskById(p.id)) continue;
        const t = unpackTask(p.id, { ...p, l: state.lists[0].id });
        t.order = topOrder(t.listId);
        state.tasks.push(normalize({ ...state, tasks: [t] }).tasks[0]);
      }
      save();
      render();
    } catch (e) { /* ignore */ }
  }

  init().then(() => {
    render();
    archiveCompleted();
    takePendingAdds();
    syncScrim();
    updateUsage();
    if (location.hash === '#brief') {
      history.replaceState(null, '', location.pathname);
      openBrief();
    }
    openTaskFromHash();
  });
  // A reminder notification opens CheckRow at its task: index.html#task=<id>.
  function openTaskFromHash() {
    const m = /^#task=(.+)$/.exec(location.hash);
    if (!m) return;
    history.replaceState(null, '', location.pathname);
    const t = taskById(decodeURIComponent(m[1]));
    if (!t) { toast('That task is no longer on your list.'); return; }
    if (state.view !== t.listId && !['all'].includes(state.view)) { state.view = t.listId; saveLocal(); }
    openDetails(t.id);
  }
  window.addEventListener('hashchange', openTaskFromHash);
})();
