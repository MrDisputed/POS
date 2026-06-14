// TorqueWorks key-value API for Netlify, backed by Netlify Blobs.
// Implements the same contract the app already uses:
//   GET  /api/kv/<key>   -> { "value": <data|null> }
//   PUT  /api/kv/<key>   <- { "value": <data> }    -> { "ok": true }
//   GET  /api/backup     -> { "<key>": <data>, ... }
// All shop data lives in a Netlify Blobs store called "torqueworks".
const { getStore } = require('@netlify/blobs');

// The seven datasets the app uses (used for /api/backup).
const KEYS = ['bbpos:settings','bbpos:emps','bbpos:parts','bbpos:tx','bbpos:ledger','bbpos:repairs','bbpos:shifts'];
const safe = k => k.replace(/:/g, '__');                    // colon isn't ideal in a blob key
const json = (code, obj) => ({ statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });

exports.handler = async (event) => {
  // optional shared secret — set TW_TOKEN in Netlify env vars to require it
  const TOKEN = process.env.TW_TOKEN || '';
  if (TOKEN && (event.headers['x-tw-token'] || event.headers['X-Tw-Token'] || '') !== TOKEN)
    return json(401, { error: 'unauthorized' });

  const store = getStore({ name: 'torqueworks', consistency: 'strong' });
  const path = (event.path || '');

  // ---- /api/backup : snapshot of everything ----
  if (/\/backup$/.test(path) && event.httpMethod === 'GET') {
    const out = {};
    for (const k of KEYS) {
      const v = await store.get(safe(k), { type: 'json' });
      if (v != null) out[k] = v;
    }
    return json(200, out);
  }

  // ---- /api/kv/<key> ----
  const m = path.match(/\/kv\/(.+)$/);
  if (m) {
    let key;
    try { key = decodeURIComponent(m[1]); } catch (e) { key = m[1]; }
    const bkey = safe(key);
    if (event.httpMethod === 'GET') {
      const value = await store.get(bkey, { type: 'json' });
      return json(200, { value: value == null ? null : value });
    }
    if (event.httpMethod === 'PUT') {
      let body;
      try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'bad json' }); }
      await store.setJSON(bkey, body.value);
      return json(200, { ok: true });
    }
  }
  return json(404, { error: 'not found' });
};
