/* Configurazione: cambia INITIAL_LP per i nuovi duelli. Nessuna dipendenza. */
(() => {
  'use strict';
  const INITIAL_LP = 8000;
  const MAX_LP = 999999;
  const VERSION = 1;
  // Isola anche lo storage tra repository diversi sullo stesso dominio Pages.
  const STORAGE_KEY = `duel-counter:v1:${new URL('.', location.href).pathname}`;
  const $ = (selector) => document.querySelector(selector);
  const all = (selector) => [...document.querySelectorAll(selector)];
  const defaults = () => ({ version: VERSION, names: ['Player 1', 'Player 2'], lp: [INITIAL_LP, INITIAL_LP], audio: false, rotate: false, history: [] });
  const validLP = (value) => Number.isSafeInteger(value) && value >= 0 && value <= MAX_LP;
  const cleanName = (value, fallback) => typeof value === 'string' ? value.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 24) || fallback : fallback;
  let storageAvailable = true;
  let offlineReady = false;
  let state = loadState();
  let selectedPlayer = 0;
  let mode = 'subtract';
  let digits = '';
  let audioContext;
  let announcementTimer;
  const calculator = $('#calculator');

  function loadState() {
    const fresh = defaults();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || saved.version !== VERSION) return fresh;
      fresh.names = fresh.names.map((name, i) => cleanName(saved.names?.[i], name));
      fresh.audio = saved.audio === true;
      fresh.rotate = saved.rotate === true;
      if (Array.isArray(saved.lp) && saved.lp.length === 2 && saved.lp.every(validLP)) fresh.lp = [...saved.lp];
      // Validate the undo chain backwards against the restored score. A damaged
      // history is discarded without losing valid names, preferences or LP.
      if (Array.isArray(saved.history)) {
        const expected = [...fresh.lp];
        const valid = saved.history.every((entry) => entry && [0, 1].includes(entry.player) && validLP(entry.before) && validLP(entry.after) && entry.before !== entry.after && typeof entry.name === 'string' && Number.isFinite(entry.time) && entry.time >= 0 && entry.time <= 8640000000000000);
        if (valid) {
          for (let i = saved.history.length - 1; i >= 0; i--) {
            const entry = saved.history[i];
            if (expected[entry.player] !== entry.after) return fresh;
            expected[entry.player] = entry.before;
          }
          fresh.history = saved.history.map(({ player, before, after, name, time }) => ({ player, before, after, name: cleanName(name, fresh.names[player]), time }));
        }
      }
    } catch { storageAvailable = false; }
    return fresh;
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageAvailable = true; }
    catch { storageAvailable = false; }
    renderSaveStatus();
  }

  function renderSaveStatus() {
    const label = !storageAvailable ? 'Salvataggio non disponibile' : offlineReady ? 'Pronto offline' : 'Salvato sul dispositivo';
    $('#save-status').textContent = label;
    $('#save-status').title = label;
    // Storage problems remain visible on small screens as well.
    $('#save-status').style.display = storageAvailable ? '' : 'block';
  }

  function announce(message) {
    clearTimeout(announcementTimer);
    $('#announcer').textContent = '';
    announcementTimer = setTimeout(() => { $('#announcer').textContent = message; }, 30);
  }

  const duelEnded = () => state.lp.some((lp) => lp === 0);
  function resultMessage() {
    if (state.lp.every((lp) => lp === 0)) return 'Pareggio';
    return `${state.names[state.lp[0] === 0 ? 1 : 0]} vince!`;
  }

  function render() {
    const ended = duelEnded();
    document.body.classList.toggle('rotate-p1', state.rotate);
    state.lp.forEach((lp, i) => {
      const panel = $(`[data-player="${i}"]`);
      const won = ended && lp > 0;
      panel.classList.toggle('winner', won);
      panel.classList.toggle('defeated', lp === 0);
      $(`#name-${i}`).textContent = state.names[i];
      $(`[data-name="${i}"]`).setAttribute('aria-label', `Modifica nome ${state.names[i]}`);
      $(`#lp-${i}`).textContent = String(lp);
      $(`[data-edit="${i}"]`).setAttribute('aria-label', `${state.names[i]}: ${lp} Life Points. Tocca per modificare`);
      $(`[data-edit="${i}"]`).classList.toggle('long-score', lp >= 100000);
      $(`#bar-${i}`).style.width = `${Math.min(100, lp / INITIAL_LP * 100)}%`;
      const last = state.history.findLast ? state.history.findLast((entry) => entry.player === i) : [...state.history].reverse().find((entry) => entry.player === i);
      $(`#status-${i}`).textContent = won ? `${state.names[i]} vince!` : lp === 0 ? 'Duello concluso · 0 LP' : last ? `${last.after - last.before > 0 ? '+' : '−'}${Math.abs(last.after - last.before)} LP · Ultima variazione` : 'Pronto al duello';
      all(`[data-for="${i}"], [data-edit="${i}"]`).forEach((button) => { button.disabled = ended; });
      $(`[data-player="${i}"] .quick-actions`).setAttribute('aria-label', `Sottrazioni rapide ${state.names[i]}`);
    });
    $('#undo').disabled = state.history.length === 0;
    $('#history-count').textContent = state.history.length > 99 ? '99+' : String(state.history.length);
    $('#history-count').hidden = state.history.length === 0;
    $('#rotate').setAttribute('aria-pressed', String(state.rotate));
    $('#audio-toggle').setAttribute('aria-pressed', String(state.audio));
    $('#audio-toggle').setAttribute('aria-label', state.audio ? 'Disattiva audio' : 'Attiva audio');
    $('#audio-label').textContent = state.audio ? 'Audio on' : 'Audio off';
    renderSaveStatus();
  }

  // Sound is generated only after a gesture; unsupported/blocked audio is harmless.
  function sound(kind) {
    if (!state.audio) return;
    try {
      const AudioAPI = window.AudioContext || window.webkitAudioContext;
      if (!AudioAPI) return;
      audioContext ||= new AudioAPI();
      const play = () => {
        const now = audioContext.currentTime;
        const notes = kind === 'win' ? [440, 554, 660] : kind === 'add' ? [480, 660] : [330, 180];
        notes.forEach((frequency, i) => {
          const oscillator = audioContext.createOscillator();
          const gain = audioContext.createGain();
          const start = now + i * .085;
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(frequency, start);
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(.06, start + .012);
          gain.gain.exponentialRampToValueAtTime(.001, start + .15);
          oscillator.connect(gain).connect(audioContext.destination);
          oscillator.start(start);
          oscillator.stop(start + .16);
          oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        });
      };
      if (audioContext.state === 'suspended') audioContext.resume().then(play).catch(() => {});
      else play();
    } catch { /* Audio must never interrupt a duel. */ }
  }

  function changeLP(player, delta) {
    if (duelEnded() || ![0, 1].includes(player) || !Number.isSafeInteger(delta) || delta === 0) return;
    const before = state.lp[player];
    const after = Math.max(0, Math.min(MAX_LP, before + delta));
    if (before === after) return;
    state.history.push({ player, name: state.names[player], before, after, time: Date.now() });
    state.lp[player] = after;
    saveState();
    render();
    const score = $(`[data-edit="${player}"]`);
    score.classList.remove('changed');
    void score.offsetWidth;
    score.classList.add('changed');
    sound(duelEnded() ? 'win' : delta > 0 ? 'add' : 'subtract');
    announce(`${state.names[player]}: ${after} Life Points.${duelEnded() ? ` ${resultMessage()} Usa Undo per correggere o avvia un nuovo duello.` : ''}`);
  }

  function openDialog(dialog, player = null) {
    dialog.classList.toggle('for-p1', player === 0);
    dialog.style.setProperty('--accent', player === 1 ? 'var(--blue)' : 'var(--gold)');
    dialog.showModal();
  }

  function openCalculator(player, operation) {
    if (duelEnded()) return;
    selectedPlayer = player;
    mode = operation;
    digits = '';
    $('#calc-player').textContent = state.names[player];
    updateCalculator();
    openDialog(calculator, player);
  }

  function updateCalculator() {
    const amount = Number(digits || 0);
    const before = state.lp[selectedPlayer];
    const after = Math.max(0, Math.min(MAX_LP, before + (mode === 'add' ? amount : -amount)));
    $('#calc-title').textContent = mode === 'add' ? 'Aggiungi Life Points' : 'Sottrai Life Points';
    $('#mode-subtract').setAttribute('aria-pressed', String(mode === 'subtract'));
    $('#mode-add').setAttribute('aria-pressed', String(mode === 'add'));
    $('#amount').textContent = digits || '0';
    $('#halve-amount').disabled = duelEnded();
    $('#preview').textContent = `${before} → ${after} LP`;
    $('#calc-error').textContent = mode === 'add' && before + amount > MAX_LP ? `Limite massimo: ${MAX_LP} LP` : mode === 'subtract' && amount > before ? 'I Life Points si fermeranno a 0.' : '';
    $('#apply').disabled = amount === 0 || before === after;
    $('#apply').textContent = amount === 0 ? 'Inserisci un importo' : `${mode === 'add' ? '+' : '−'}${amount} LP · Conferma`;
  }

  function inputDigit(key) {
    if (key === 'clear') digits = '';
    else if (key === 'backspace') digits = digits.slice(0, -1);
    else if (key === 'halve') {
      mode = 'subtract';
      digits = String(Math.ceil(state.lp[selectedPlayer] / 2));
    }
    else if (/^\d$/.test(key) && digits.length < 6) digits = (digits + key).replace(/^0+/, '');
    updateCalculator();
  }

  function renderHistory() {
    const list = $('#history-list');
    list.replaceChildren();
    $('#history-empty').hidden = state.history.length !== 0;
    const fragment = document.createDocumentFragment();
    [...state.history].reverse().forEach((entry) => {
      const row = document.createElement('li');
      row.className = entry.player === 1 ? 'p2' : 'p1';
      const name = document.createElement('span');
      name.className = 'history-name';
      name.textContent = entry.name;
      const result = document.createElement('span');
      result.className = 'history-result';
      const delta = entry.after - entry.before;
      result.textContent = `${delta > 0 ? '+' : '−'}${Math.abs(delta)} → ${entry.after}`;
      const detail = document.createElement('small');
      detail.textContent = `${new Date(entry.time).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} · da ${entry.before} LP`;
      row.append(name, result, detail);
      fragment.append(row);
    });
    list.append(fragment);
  }

  all('[data-quick]').forEach((button) => button.addEventListener('click', () => changeLP(Number(button.dataset.for), -Number(button.dataset.quick))));
  all('[data-operation]').forEach((button) => button.addEventListener('click', () => openCalculator(Number(button.dataset.for), button.dataset.operation)));
  all('[data-edit]').forEach((button) => button.addEventListener('click', () => openCalculator(Number(button.dataset.edit), 'subtract')));
  all('[data-key]').forEach((button) => button.addEventListener('click', () => inputDigit(button.dataset.key)));
  $('#mode-subtract').addEventListener('click', () => { mode = 'subtract'; updateCalculator(); });
  $('#mode-add').addEventListener('click', () => { mode = 'add'; updateCalculator(); });
  $('#apply').addEventListener('click', () => {
    if ($('#apply').disabled) return;
    const delta = Number(digits) * (mode === 'add' ? 1 : -1);
    calculator.close();
    changeLP(selectedPlayer, delta);
  });
  calculator.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (/^\d$/.test(event.key)) { event.preventDefault(); inputDigit(event.key); }
    else if (event.key === 'Backspace' || event.key === 'Delete') { event.preventDefault(); inputDigit(event.key === 'Backspace' ? 'backspace' : 'clear'); }
    else if (event.key === '/') { event.preventDefault(); inputDigit('halve'); }
    else if (event.key === 'Enter') { event.preventDefault(); $('#apply').click(); }
    else if (event.key === '+' || event.key === '-') { event.preventDefault(); mode = event.key === '+' ? 'add' : 'subtract'; updateCalculator(); }
  });
  $('#undo').addEventListener('click', () => {
    const last = state.history.pop();
    if (!last) return;
    state.lp[last.player] = last.before;
    saveState(); render();
    announce(`Annullata l'ultima variazione. ${state.names[last.player]}: ${last.before} Life Points.`);
  });
  $('#history').addEventListener('click', () => { renderHistory(); openDialog($('#history-dialog')); });
  $('#rotate').addEventListener('click', () => {
    state.rotate = !state.rotate;
    saveState(); render();
    announce(state.rotate ? 'Player 1 ruotato di 180 gradi in modalità verticale.' : 'Rotazione Player 1 disattivata.');
  });
  $('#audio-toggle').addEventListener('click', () => { state.audio = !state.audio; saveState(); render(); if (state.audio) sound('add'); });
  all('[data-name]').forEach((button) => button.addEventListener('click', () => {
    selectedPlayer = Number(button.dataset.name);
    $('#name-input').value = state.names[selectedPlayer];
    openDialog($('#name-dialog'), selectedPlayer);
    $('#name-input').focus();
    $('#name-input').select();
  }));
  $('#name-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = cleanName($('#name-input').value, `Player ${selectedPlayer + 1}`);
    state.names[selectedPlayer] = name;
    saveState(); render();
    $('#name-dialog').close();
    announce(`Nome salvato: ${name}.`);
  });
  $('#initial-lp').textContent = `${INITIAL_LP} LP`;
  $('#reset').addEventListener('click', () => openDialog($('#reset-dialog')));
  $('#confirm-reset').addEventListener('click', () => {
    state.lp = [INITIAL_LP, INITIAL_LP];
    state.history = [];
    saveState(); render();
    $('#reset-dialog').close();
    announce(`Nuovo duello. Entrambi i giocatori hanno ${INITIAL_LP} Life Points.`);
  });
  all('[data-close]').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
  // Native dialogs provide focus trapping, Escape and focus restoration.
  all('dialog').forEach((dialog) => dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  }));
  all('.score').forEach((score) => score.addEventListener('animationend', () => score.classList.remove('changed')));
  render();
  saveState();

  // Classic scripts keep file:// usable. Only the optional PWA needs HTTPS/localhost.
  if ('serviceWorker' in navigator && ['https:', 'http:'].includes(location.protocol) && window.isSecureContext) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' })
        .then(() => navigator.serviceWorker.ready)
        .then(() => { offlineReady = true; renderSaveStatus(); })
        .catch(() => { offlineReady = false; renderSaveStatus(); });
    });
  }
})();
