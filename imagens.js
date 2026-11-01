/* Imagens das questões do Caderno de Erradas.
   - Redimensiona/comprime a foto (JPEG, até 1600 px) antes de guardar.
   - Guarda no IndexedDB do navegador (não no localStorage, que é pequeno demais para imagens).
   - O identificador da imagem é o hash do conteúdo: a mesma imagem nunca é guardada duas vezes
     e o nome do arquivo no GitHub nunca muda, o que evita conflitos de sincronização. */
(function (root) {
  const DB = 'circuito-loop-imagens', STORE = 'imgs', MAX_SIDE = 1600, QUALITY = 0.85;
  let dbp = null;
  const urls = new Map();

  const db = () => dbp || (dbp = new Promise((resolve, reject) => {
    if (!root.indexedDB) return reject(new Error('Este navegador não permite guardar imagens.'));
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id' });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => { dbp = null; reject(r.error || new Error('Falha ao abrir o armazenamento de imagens.')); };
  }));
  const run = (mode, fn) => db().then(d => new Promise((resolve, reject) => {
    const t = d.transaction(STORE, mode), rq = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(rq ? rq.result : undefined);
    t.onerror = t.onabort = () => reject(t.error || new Error('Falha ao acessar o armazenamento de imagens.'));
  }));

  async function sha(buf) {
    if (root.crypto && crypto.subtle && crypto.subtle.digest) {
      const d = new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
      return Array.from(d.slice(0, 12), b => b.toString(16).padStart(2, '0')).join('');
    }
    // alternativa quando o navegador não oferece crypto.subtle (páginas sem HTTPS)
    const u = new Uint8Array(buf); let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < u.length; i++) { h1 = Math.imul(h1 ^ u[i], 2654435761); h2 = Math.imul(h2 ^ u[i], 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 'x' + (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0') + u.length.toString(16);
  }

  async function bitmap(file) {
    if (root.createImageBitmap) {
      try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { /* tenta o método clássico */ }
    }
    return await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não consegui abrir esta imagem.')); };
      img.src = url;
    });
  }

  async function compress(file) {
    const bmp = await bitmap(file), w0 = bmp.width, h0 = bmp.height;
    if (!w0 || !h0) throw new Error('Imagem inválida.');
    const k = Math.min(1, MAX_SIDE / Math.max(w0, h0)), w = Math.max(1, Math.round(w0 * k)), h = Math.max(1, Math.round(h0 * k));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(bmp, 0, 0, w, h);
    if (bmp.close) bmp.close();
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', QUALITY));
    if (!blob) throw new Error('Não consegui processar esta imagem.');
    const buf = await blob.arrayBuffer();
    return { id: await sha(buf), buf, blob, width: w, height: h, size: buf.byteLength };
  }

  const putBuffer = (id, buf, type) => run('readwrite', s => s.put({ id, buf, type: type || 'image/jpeg', ts: Date.now() })).then(() => id);
  const put = (id, blob) => blob.arrayBuffer().then(buf => putBuffer(id, buf, blob.type));
  const getRecord = id => run('readonly', s => s.get(id));
  const has = id => getRecord(id).then(r => !!r).catch(() => false);
  const getBuffer = id => getRecord(id).then(r => r ? r.buf : null);
  async function url(id) {
    if (urls.has(id)) return urls.get(id);
    const r = await getRecord(id);
    if (!r) return null;
    const u = URL.createObjectURL(new Blob([r.buf], { type: r.type || 'image/jpeg' }));
    urls.set(id, u); return u;
  }
  const cachedUrl = id => urls.get(id) || null;
  const remove = id => { const u = urls.get(id); if (u) { URL.revokeObjectURL(u); urls.delete(id); } return run('readwrite', s => s.delete(id)); };
  const list = () => run('readonly', s => s.getAll()).then(a => (a || []).map(r => ({ id: r.id, ts: r.ts || 0, size: r.buf ? r.buf.byteLength : 0 })));
  const keys = () => list().then(a => a.map(r => r.id));

  function bufToBase64(buf) {
    const u = new Uint8Array(buf); let s = '';
    for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function base64ToBuf(b64) { const s = atob(String(b64).replace(/\s/g, '')), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; }
  async function toDataURL(id) { const r = await getRecord(id); return r ? 'data:' + (r.type || 'image/jpeg') + ';base64,' + bufToBase64(r.buf) : null; }

  root.CircuitoImg = { compress, put, putBuffer, has, getBuffer, url, cachedUrl, remove, list, keys, toDataURL, bufToBase64, base64ToBuf };
})(globalThis);
