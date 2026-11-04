// Floating livechat: picks online / offline / WhatsApp from site.config.js and
// keeps the status current while the page stays open. Other "contact admin" links
// ([data-chat-link], with an optional [data-chat-status]) follow the same mode.
import site from '../../site.config.js';

const RECHECK = 60_000; // ms
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const STATES = {
  online: { link: 'chatAdmin', text: 'Admin online', short: 'Online', label: 'Chat admin: admin online' },
  offline: { link: 'chatLeaveMessage', text: 'Tinggalkan pesan', short: 'Offline', label: 'Chat admin: tinggalkan pesan' },
  whatsapp: { link: 'chatWhatsapp', text: 'Via WhatsApp', short: 'WhatsApp', label: 'Chat admin via WhatsApp' },
};

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// The day and minute of the day in the admin's time zone.
function now(timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type).value;
  return {
    day: DAYS.indexOf(get('weekday').toLowerCase()),
    minute: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

function isOpen({ hours, timeZone }) {
  const { day, minute } = now(timeZone);
  const today = hours[DAYS[day]];
  const yesterday = hours[DAYS[(day + 6) % 7]];

  if (today) {
    const open = toMinutes(today[0]);
    const close = toMinutes(today[1]);
    if (close > open ? minute >= open && minute < close : minute >= open) return true;
  }
  // Yesterday's hours that run past midnight.
  if (yesterday) {
    const open = toMinutes(yesterday[0]);
    const close = toMinutes(yesterday[1]);
    if (close <= open && minute < close) return true;
  }
  return false;
}

function currentState(config) {
  if (config.mode !== 'auto') return config.mode;
  return isOpen(config) ? 'online' : 'offline';
}

export function initLivechat() {
  const el = document.querySelector('[data-livechat]');
  const config = site.livechat;
  if (!el || !config) return;

  const text = el.querySelector('[data-livechat-text]');

  function update() {
    const state = currentState(config);
    const { link, text: status, short, label } = STATES[state] ?? STATES.offline;
    el.dataset.state = state;
    el.href = site.links[link];
    el.setAttribute('aria-label', label);
    text.textContent = status;

    for (const other of document.querySelectorAll('[data-chat-link]')) {
      other.href = site.links[link];
      const meta = other.querySelector('[data-chat-status]');
      if (meta) {
        meta.textContent = short;
        meta.dataset.state = state;
      }
    }
  }

  update();
  if (config.mode === 'auto') setInterval(update, RECHECK);
}
