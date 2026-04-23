'use strict';

const dropzone = document.getElementById('dropzone');
const urlsEl = document.getElementById('urls');
const logEl = document.getElementById('log');
const btnFiles = document.getElementById('btn-files');
const fileInput = document.getElementById('file-input');
const btnClear = document.getElementById('btn-clear');
const btnRun = document.getElementById('btn-run');
const pathsHint = document.getElementById('paths-hint');

function log(msg) {
  logEl.textContent = typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2);
}

function parseUrlsFromText(text) {
  const re = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  const m = text.match(re);
  return m ? [...new Set(m)] : [];
}

function mergeUrlsIntoTextarea(newUrls) {
  const existing = urlsEl.value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const set = new Set([...existing, ...newUrls]);
  urlsEl.value = [...set].join('\n');
}

function bufToBase64(buf) {
  let binary = '';
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function extractFromFile(file) {
  const buf = await file.arrayBuffer();
  const dataBase64 = bufToBase64(buf);
  const res = await fetch('/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name || 'file.bin', dataBase64 }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data.urls || [];
}

async function appendFromFiles(fileList) {
  const all = [];
  for (const file of fileList) {
    try {
      const urls = await extractFromFile(file);
      all.push(...urls);
    } catch (e) {
      log(`${file.name}: ${e.message || e}`);
    }
  }
  mergeUrlsIntoTextarea(all);
  if (all.length) log(`Extraídas ${all.length} URL(s) de archivo(s).`);
}

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropzone.classList.add('dragover');
});
dropzone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
});
dropzone.addEventListener('drop', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropzone.classList.remove('dragover');

  const uriList = e.dataTransfer.getData('text/uri-list');
  const plain = e.dataTransfer.getData('text/plain');
  const fromUri = uriList
    ? uriList
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.startsWith('http://') || line.startsWith('https://'))
    : [];
  const fromPlain = plain ? parseUrlsFromText(plain) : [];
  let urls = fromUri.length ? fromUri : fromPlain;

  const files = e.dataTransfer.files;
  if (files && files.length) {
    await appendFromFiles(files);
  }

  if (urls.length) mergeUrlsIntoTextarea(urls);
  if (!urls.length && (!files || !files.length)) log('No se detectaron URLs ni archivos.');
  else if (urls.length) log(`Añadidas ${urls.length} URL(s) (arrastre).`);
});

btnFiles.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async () => {
  const files = fileInput.files;
  if (files && files.length) await appendFromFiles(files);
  fileInput.value = '';
});

btnClear.addEventListener('click', () => {
  urlsEl.value = '';
  log('');
});

btnRun.addEventListener('click', async () => {
  const lines = urlsEl.value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith('http://') || s.startsWith('https://'));
  log('Ejecutando…');
  const res = await fetch('/api/benchmark', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls: lines }),
  });
  const data = await res.json();
  const parts = [];
  if (data.stderr) parts.push(data.stderr);
  if (data.stdout) parts.push(data.stdout);
  log(parts.join('\n---\n') || JSON.stringify(data));
});

(async () => {
  try {
    const res = await fetch('/api/paths', { method: 'POST' });
    const p = await res.json();
    pathsHint.textContent = `Motor: ${p.distIndex}`;
  } catch {
    pathsHint.textContent = '';
  }
})();
