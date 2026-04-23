'use strict';

const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const PORT = Number(process.env.ARMYK_DESKTOP_PORT || 18742);
const PUBLIC_DIR = path.join(__dirname, 'public');
const TOOLKIT_ROOT = path.join(__dirname, '..');
const DIST_INDEX = path.join(TOOLKIT_ROOT, 'dist', 'index.js');

function toolkitRoot() {
  return TOOLKIT_ROOT;
}

function distIndexJs() {
  return DIST_INDEX;
}

function extractUrlsFromText(text) {
  if (!text || typeof text !== 'string') return [];
  const re = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  const found = text.match(re);
  return found ? [...new Set(found)] : [];
}

async function readUrlsFromBuffer(filename, buf) {
  const ext = path.extname(filename || '').toLowerCase();
  const textEnc = async () => buf.toString('utf8');

  if (['.txt', '.md', '.json', '.csv', '.html', '.htm', '.xml'].includes(ext)) {
    return extractUrlsFromText(await textEnc());
  }
  if (ext === '.pdf') {
    try {
      const pdfParse = require('pdf-parse');
      const res = await pdfParse(buf);
      return extractUrlsFromText(res.text || '');
    } catch {
      return [];
    }
  }
  if (ext === '.docx') {
    try {
      const mammoth = require('mammoth');
      const res = await mammoth.extractRawText({ buffer: buf });
      return extractUrlsFromText(res.value || '');
    } catch {
      return [];
    }
  }
  try {
    return extractUrlsFromText(await textEnc());
  } catch {
    return [];
  }
}

function runBenchmarkCli(urls) {
  return new Promise((resolve, reject) => {
    const script = distIndexJs();
    if (!fs.existsSync(script)) {
      reject(new Error(`Falta build del motor: ${script}`));
      return;
    }
    const child = spawn('node', [script, ...urls], {
      cwd: toolkitRoot(),
      env: { ...process.env },
    });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => {
      out += d.toString();
    });
    child.stderr.on('data', (d) => {
      err += d.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ code, stdout: out, stderr: err });
    });
  });
}

function readBodyJson(req, limit = 12 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let n = 0;
    req.on('data', (c) => {
      n += c.length;
      if (n > limit) {
        reject(new Error('Body demasiado grande'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function contentType(p) {
  if (p.endsWith('.html')) return 'text/html; charset=utf-8';
  if (p.endsWith('.css')) return 'text/css; charset=utf-8';
  if (p.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (p.endsWith('.svg')) return 'image/svg+xml';
  if (p.endsWith('.png')) return 'image/png';
  return 'application/octet-stream';
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);

  if (req.method === 'POST' && u.pathname === '/api/paths') {
    sendJson(res, 200, { toolkitRoot: toolkitRoot(), distIndex: distIndexJs() });
    return;
  }

  if (req.method === 'POST' && u.pathname === '/api/extract') {
    try {
      const body = await readBodyJson(req);
      const name = typeof body.filename === 'string' ? body.filename : 'file.bin';
      const b64 = body.dataBase64;
      if (typeof b64 !== 'string') {
        sendJson(res, 400, { error: 'dataBase64 requerido' });
        return;
      }
      const buf = Buffer.from(b64, 'base64');
      const urls = await readUrlsFromBuffer(name, buf);
      sendJson(res, 200, { urls, error: null });
    } catch (e) {
      sendJson(res, 500, { urls: [], error: String(e && e.message ? e.message : e) });
    }
    return;
  }

  if (req.method === 'POST' && u.pathname === '/api/benchmark') {
    try {
      const body = await readBodyJson(req, 256 * 1024);
      const urls = Array.isArray(body.urls) ? body.urls.filter((x) => typeof x === 'string' && /^https?:\/\//i.test(x)) : [];
      if (urls.length === 0) {
        sendJson(res, 400, { ok: false, stderr: 'Sin URLs http(s) válidas.' });
        return;
      }
      const result = await runBenchmarkCli(urls);
      sendJson(res, 200, { ok: result.code === 0, ...result });
    } catch (e) {
      sendJson(res, 500, { ok: false, code: -1, stdout: '', stderr: String(e && e.message ? e.message : e) });
    }
    return;
  }

  let filePath = path.join(PUBLIC_DIR, u.pathname === '/' ? 'index.html' : u.pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end();
    return;
  }
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType(filePath) });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${PORT}/`;
  console.error(`[benchmark-armyknife-desktop] ${url}`);
  if (process.env.ARMYK_OPEN_BROWSER !== '0') {
    const open = { darwin: 'open', win32: 'start' }[process.platform] || 'xdg-open';
    spawn(open, process.platform === 'win32' ? [url] : [url], {
      detached: true,
      stdio: 'ignore',
      shell: process.platform === 'win32',
    }).unref();
  }
});
