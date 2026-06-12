/**
 * JSON file-based data store for NXT Esports bot.
 * All data is persisted in ./data/*.json files.
 * Easy to edit and inspect — no database client needed.
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger.js');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// ─── Generic JSON store ───────────────────────────────────────────────────────

class JsonStore {
  constructor(filename) {
    this.file = path.join(dataDir, filename);
    this.data = this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.file)) {
        return JSON.parse(fs.readFileSync(this.file, 'utf-8'));
      }
    } catch { /* ignore parse errors */ }
    return {};
  }

  save() {
    fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
  }

  delete(key) {
    delete this.data[key];
    this.save();
  }
}

// ─── Stores ───────────────────────────────────────────────────────────────────

const configStore = new JsonStore('config.json');
const warningsStore = new JsonStore('warnings.json');
const vouchesStore = new JsonStore('vouches.json');
const applicationsStore = new JsonStore('applications.json');
const playersStore = new JsonStore('players.json');
const scrimsStore = new JsonStore('scrims.json');
const eventsStore = new JsonStore('events.json');
const ticketsStore = new JsonStore('tickets.json');
const modLogStore = new JsonStore('mod_log.json');

let nextId = new JsonStore('ids.json');
if (!nextId.get('scrim')) nextId.set('scrim', 1);
if (!nextId.get('event')) nextId.set('event', 1);

function getNextId(type) {
  const id = nextId.get(type) || 1;
  nextId.set(type, id + 1);
  return id;
}

logger.success('JSON data store initialized');

// ─── Config ───────────────────────────────────────────────────────────────────

function getConfig(guildId, key) {
  const guildData = configStore.get(guildId) || {};
  return guildData[key] || null;
}

function setConfig(guildId, key, value) {
  const guildData = configStore.get(guildId) || {};
  guildData[key] = value;
  configStore.set(guildId, guildData);
}

function deleteConfig(guildId, key) {
  const guildData = configStore.get(guildId) || {};
  delete guildData[key];
  configStore.set(guildId, guildData);
}

// ─── Warnings ─────────────────────────────────────────────────────────────────

function addWarning(guildId, userId, modId, reason) {
  const key = `${guildId}:${userId}`;
  const list = warningsStore.get(key) || [];
  list.push({ modId, reason, createdAt: Math.floor(Date.now() / 1000) });
  warningsStore.set(key, list);
}

function getWarnings(guildId, userId) {
  return (warningsStore.get(`${guildId}:${userId}`) || []).map((w, i) => ({
    ...w, id: i + 1, moderator_id: w.modId, created_at: w.createdAt,
  })).reverse();
}

function getWarningCount(guildId, userId) {
  return (warningsStore.get(`${guildId}:${userId}`) || []).length;
}

function clearWarnings(guildId, userId) {
  warningsStore.set(`${guildId}:${userId}`, []);
}

// ─── Vouches ──────────────────────────────────────────────────────────────────

function addVouch(guildId, targetId, authorId, comment) {
  const key = `${guildId}:${targetId}`;
  const list = vouchesStore.get(key) || [];
  list.push({ authorId, comment, createdAt: Math.floor(Date.now() / 1000) });
  vouchesStore.set(key, list);
}

function getVouches(guildId, targetId) {
  return (vouchesStore.get(`${guildId}:${targetId}`) || []).map(v => ({
    ...v, author_id: v.authorId, created_at: v.createdAt,
  })).reverse();
}

function getVouchCount(guildId, targetId) {
  return (vouchesStore.get(`${guildId}:${targetId}`) || []).length;
}

function hasVouched(guildId, targetId, authorId) {
  const list = vouchesStore.get(`${guildId}:${targetId}`) || [];
  return list.some(v => v.authorId === authorId);
}

// ─── Applications ─────────────────────────────────────────────────────────────

function saveApplication(guildId, userId, type, answers) {
  const key = `${guildId}:${userId}`;
  const list = applicationsStore.get(key) || [];
  list.push({ type, answers, status: 'pending', createdAt: Math.floor(Date.now() / 1000) });
  applicationsStore.set(key, list);
}

function getPendingApplication(guildId, userId) {
  const list = applicationsStore.get(`${guildId}:${userId}`) || [];
  return list.find(a => a.status === 'pending') || null;
}

function updateApplicationStatus(guildId, userId, status) {
  const key = `${guildId}:${userId}`;
  const list = applicationsStore.get(key) || [];
  const pending = list.find(a => a.status === 'pending');
  if (pending) pending.status = status;
  applicationsStore.set(key, list);
}

// ─── Players / Roster ─────────────────────────────────────────────────────────

function addPlayer(guildId, userId, role, addedBy) {
  const key = `${guildId}`;
  const roster = playersStore.get(key) || {};
  roster[userId] = { role, addedBy, addedAt: Math.floor(Date.now() / 1000) };
  playersStore.set(key, roster);
}

function removePlayer(guildId, userId) {
  const roster = playersStore.get(guildId) || {};
  delete roster[userId];
  playersStore.set(guildId, roster);
}

function getPlayer(guildId, userId) {
  return (playersStore.get(guildId) || {})[userId] || null;
}

function getAllPlayers(guildId) {
  const roster = playersStore.get(guildId) || {};
  return Object.entries(roster).map(([user_id, data]) => ({ user_id, ...data }));
}

function getPlayersByRole(guildId, role) {
  return getAllPlayers(guildId).filter(p => p.role === role);
}

function getPlayerCountByRole(guildId) {
  const players = getAllPlayers(guildId);
  const counts = {};
  for (const p of players) {
    counts[p.role] = (counts[p.role] || 0) + 1;
  }
  return Object.entries(counts).map(([role, count]) => ({ role, count }));
}

function getTotalPlayers(guildId) {
  return Object.keys(playersStore.get(guildId) || {}).length;
}

// ─── Scrims ───────────────────────────────────────────────────────────────────

function createScrim(guildId, date, time, region, teamSize, createdBy) {
  const id = getNextId('scrim');
  const allScrims = scrimsStore.get(guildId) || {};
  allScrims[id] = { id, date, time, region, teamSize, createdBy, active: true, attendance: {}, createdAt: Math.floor(Date.now() / 1000) };
  scrimsStore.set(guildId, allScrims);
  return id;
}

function setScrimMessage(guildId, id, messageId, channelId) {
  const allScrims = scrimsStore.get(guildId) || {};
  if (allScrims[id]) { allScrims[id].messageId = messageId; allScrims[id].channelId = channelId; }
  scrimsStore.set(guildId, allScrims);
}

function getScrim(guildId, id) {
  return (scrimsStore.get(guildId) || {})[id] || null;
}

function getActiveScrim(guildId) {
  const allScrims = scrimsStore.get(guildId) || {};
  const active = Object.values(allScrims).filter(s => s.active);
  return active.length ? active[active.length - 1] : null;
}

function endScrim(guildId, id) {
  const allScrims = scrimsStore.get(guildId) || {};
  if (allScrims[id]) allScrims[id].active = false;
  scrimsStore.set(guildId, allScrims);
}

function setAttendance(guildId, scrimId, userId, status) {
  const allScrims = scrimsStore.get(guildId) || {};
  if (allScrims[scrimId]) {
    if (!allScrims[scrimId].attendance) allScrims[scrimId].attendance = {};
    allScrims[scrimId].attendance[userId] = status;
  }
  scrimsStore.set(guildId, allScrims);
}

function getAttendance(guildId, scrimId, status) {
  const scrim = getScrim(guildId, scrimId);
  if (!scrim || !scrim.attendance) return [];
  return Object.entries(scrim.attendance)
    .filter(([, s]) => s === status)
    .map(([user_id]) => ({ user_id }));
}

// ─── Events / Tournaments ─────────────────────────────────────────────────────

function createEvent(guildId, name, description, prize, createdBy) {
  const id = getNextId('event');
  const allEvents = eventsStore.get(guildId) || {};
  allEvents[id] = { id, name, description, prize, createdBy, ended: false, results: [], createdAt: Math.floor(Date.now() / 1000) };
  eventsStore.set(guildId, allEvents);
  return id;
}

function setEventMessage(guildId, id, messageId, channelId) {
  const allEvents = eventsStore.get(guildId) || {};
  if (allEvents[id]) { allEvents[id].messageId = messageId; allEvents[id].channelId = channelId; }
  eventsStore.set(guildId, allEvents);
}

function endEvent(guildId, id) {
  const allEvents = eventsStore.get(guildId) || {};
  if (allEvents[id]) allEvents[id].ended = true;
  eventsStore.set(guildId, allEvents);
}

function getEvent(guildId, id) {
  return (eventsStore.get(guildId) || {})[id] || null;
}

function getActiveEvent(guildId) {
  const allEvents = eventsStore.get(guildId) || {};
  const active = Object.values(allEvents).filter(e => !e.ended);
  return active.length ? active[active.length - 1] : null;
}

function addEventResult(guildId, eventId, place, team, score) {
  const allEvents = eventsStore.get(guildId) || {};
  if (allEvents[eventId]) {
    allEvents[eventId].results = allEvents[eventId].results || [];
    allEvents[eventId].results.push({ place, team, score });
    allEvents[eventId].results.sort((a, b) => a.place - b.place);
  }
  eventsStore.set(guildId, allEvents);
}

function getEventResults(guildId, eventId) {
  const event = getEvent(guildId, eventId);
  return event ? (event.results || []) : [];
}

// ─── Tickets ──────────────────────────────────────────────────────────────────

function createTicket(guildId, channelId, userId, type) {
  const key = `${guildId}:${channelId}`;
  ticketsStore.set(key, { guildId, channelId, userId, type, closed: false, createdAt: Math.floor(Date.now() / 1000) });
}

function closeTicket(guildId, channelId) {
  const key = `${guildId}:${channelId}`;
  const ticket = ticketsStore.get(key);
  if (ticket) { ticket.closed = true; ticketsStore.set(key, ticket); }
}

function getTicket(guildId, channelId) {
  return ticketsStore.get(`${guildId}:${channelId}`) || null;
}

function getUserOpenTickets(guildId, userId) {
  return Object.values(ticketsStore.data)
    .filter(t => t.guildId === guildId && t.userId === userId && !t.closed);
}

// ─── Mod log ──────────────────────────────────────────────────────────────────

function logModAction(guildId, action, targetId, modId, reason, duration = null) {
  const guildLog = modLogStore.get(guildId) || [];
  guildLog.push({ action, targetId, modId, reason, duration, createdAt: Math.floor(Date.now() / 1000) });
  // Keep last 500 entries per guild
  if (guildLog.length > 500) guildLog.shift();
  modLogStore.set(guildId, guildLog);
}

module.exports = {
  getConfig, setConfig, deleteConfig,
  addWarning, getWarnings, getWarningCount, clearWarnings,
  addVouch, getVouches, getVouchCount, hasVouched,
  saveApplication, getPendingApplication, updateApplicationStatus,
  addPlayer, removePlayer, getPlayer, getAllPlayers, getPlayersByRole, getPlayerCountByRole, getTotalPlayers,
  createScrim, setScrimMessage, getScrim, getActiveScrim, endScrim, setAttendance, getAttendance,
  createEvent, setEventMessage, endEvent, getEvent, getActiveEvent, addEventResult, getEventResults,
  createTicket, closeTicket, getTicket, getUserOpenTickets,
  logModAction,
};
