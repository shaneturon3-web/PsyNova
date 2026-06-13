import {
  fetchJaneSchedule,
  launchJaneSession,
  syncJaneFeed,
} from '../lib/jane-zoom-client.js';

let _state = {
  schedule: null,
  selectedId: null,
  banner: null,
  loading: false,
  embedUrl: null,
  embedMode: null,
};

export function viewJaneDashboard() {
  const appts = _state.schedule?.appointments ?? [];
  const selected = appts.find((a) => a.id === _state.selectedId);
  return `
    <div class="main app-page jane-dashboard">
      <header class="page-header">
        <h1>Jane + Zoom wrapper</h1>
        <p class="muted">Operational schedule from Jane WebCal with Zoom room linking. Dual fallback: API → mock/Jitsi.</p>
        ${_state.banner ? `<p class="banner">${esc(_state.banner)}</p>` : ''}
      </header>
      <div class="jane-dashboard__grid">
        <section class="jane-dashboard__timeline" aria-label="Today appointments">
          <div class="jane-dashboard__toolbar">
            <button type="button" class="btn" id="jane-sync-btn" ${_state.loading ? 'disabled' : ''}>Sync Jane feed</button>
            <span class="muted">${esc(_state.schedule?.date ?? '')} · ${_state.schedule?.source ?? '—'}</span>
          </div>
          <ul class="jane-timeline">
            ${appts.length
              ? appts
                  .map(
                    (a) => `
              <li>
                <button type="button" class="jane-timeline__item${a.id === _state.selectedId ? ' is-active' : ''}" data-jane-id="${esc(a.id)}">
                  <time>${esc(formatTime(a.startAt))}</time>
                  <strong>${esc(a.patientLabel)}</strong>
                  <span class="muted">${esc(a.mode)}</span>
                </button>
              </li>`,
                  )
                  .join('')
              : '<li class="muted">No appointments — sync or wait for fallback mock.</li>'}
          </ul>
        </section>
        <section class="jane-dashboard__session" aria-label="Session panel">
          ${selected
            ? `<div class="jane-patient-card">
                <h2>${esc(selected.patientLabel)}</h2>
                <p>${esc(formatTime(selected.startAt))}</p>
                <button type="button" class="btn btn-primary" id="jane-start-btn" data-id="${esc(selected.id)}">Start session</button>
              </div>
              <div class="jane-zoom-embed" id="jane-zoom-mount">
                ${_state.embedUrl
                  ? `<iframe title="Zoom meeting" src="${esc(_state.embedUrl)}" allow="camera; microphone; fullscreen" referrerpolicy="no-referrer"></iframe>
                     <p class="muted">${esc(_state.embedMode ?? '')} · <a href="${esc(_state.embedUrl)}" target="_blank" rel="noopener">Open in new tab</a></p>`
                  : '<p class="muted">Click Start session to load video (iframe or external tab fallback).</p>'}
              </div>`
            : '<p class="muted">Select an appointment from the timeline.</p>'}
        </section>
      </div>
      <footer class="muted" style="margin-top:1rem;font-size:0.75rem;">
        Clinical judgment always remains with the licensed professional. MOCKUP-PURPOSE-ONLY.
      </footer>
    </div>
  `;
}

export function bindJaneDashboard(render) {
  document.getElementById('jane-sync-btn')?.addEventListener('click', async () => {
    _state.loading = true;
    _state.banner = 'Syncing Jane calendar…';
    render();
    const res = await syncJaneFeed();
    _state.schedule = {
      date: res.date ?? new Date().toISOString().slice(0, 10),
      appointments: res.appointments ?? [],
      source: res.source ?? 'live',
    };
    _state.loading = false;
    _state.banner = `Imported ${res.imported ?? _state.schedule.appointments.length} appointments (${_state.schedule.source}).`;
    render();
  });

  document.querySelectorAll('[data-jane-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      _state.selectedId = btn.getAttribute('data-jane-id');
      _state.embedUrl = null;
      _state.banner = null;
      render();
    });
  });

  document.getElementById('jane-start-btn')?.addEventListener('click', async () => {
    const id = document.getElementById('jane-start-btn')?.getAttribute('data-id');
    const appt = _state.schedule?.appointments?.find((a) => a.id === id);
    if (!appt) return;
    _state.banner = 'Starting session…';
    render();
    const launch = await launchJaneSession(appt);
    _state.embedUrl = launch.joinUrl;
    _state.embedMode = `${launch.source} · ${launch.mode}${launch.notice ? ` — ${launch.notice}` : ''}`;
    _state.banner = 'Session ready.';
    if (!String(launch.joinUrl).includes('meet.jit.si')) {
      window.open(launch.joinUrl, '_blank', 'noopener,noreferrer');
    }
    render();
  });
}

export async function refreshJaneDashboard(render) {
  _state.schedule = await fetchJaneSchedule();
  if (_state.schedule.appointments?.length && !_state.selectedId) {
    _state.selectedId = _state.schedule.appointments[0].id;
  }
  render();
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}
