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


  /* ===== Visualizador em tela cheia (celular): pinça para ampliar, arrastar, toque duplo e girar ===== */
  const isTouch = () => !!(root.matchMedia && matchMedia('(pointer:coarse)').matches);
  function view(src) {
    if (!src || document.getElementById('imgViewer')) return;
    const ov = document.createElement('div'); ov.id = 'imgViewer';
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Imagem ampliada');
    ov.style.cssText = 'position:fixed;inset:0;z-index:300;background:#000;touch-action:none;overflow:hidden;display:flex;align-items:center;justify-content:center;-webkit-user-select:none;user-select:none';
    const img = document.createElement('img'); img.alt = 'Imagem ampliada'; img.draggable = false; img.src = src;
    img.style.cssText = 'position:absolute;left:50%;top:50%;transform-origin:center center;max-width:none;max-height:none;pointer-events:none;will-change:transform';
    const btn = (txt, label, pos) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = txt; b.setAttribute('aria-label', label); b.title = label; b.style.cssText = 'position:absolute;top:calc(12px + env(safe-area-inset-top));' + pos + ';width:48px;height:48px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:rgba(30,30,30,.72);color:#fff;font-size:22px;line-height:1;padding:0;display:flex;align-items:center;justify-content:center;touch-action:manipulation;cursor:pointer'; return b; };
    const close = btn('✕', 'Fechar imagem', 'right:12px'), rotate = btn('↻', 'Girar imagem', 'left:12px');
    const hint = document.createElement('div'); hint.textContent = 'Pince para ampliar • toque duas vezes para aproximar • ↻ gira a imagem';
    hint.style.cssText = 'position:absolute;left:12px;right:12px;bottom:calc(14px + env(safe-area-inset-bottom));text-align:center;color:#fff;font:14px system-ui,sans-serif;background:rgba(30,30,30,.72);border-radius:10px;padding:8px 10px;transition:opacity .6s;pointer-events:none';
    ov.append(img, rotate, close, hint); document.body.appendChild(ov);
    const prevOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    setTimeout(() => { hint.style.opacity = '0'; }, 3500);

    let s = 1, x = 0, y = 0, rot = 0, w = 0, h = 0;
    const vw = () => ov.clientWidth, vh = () => ov.clientHeight, clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    function layout() {
      const nw = img.naturalWidth || 1, nh = img.naturalHeight || 1, a = nw / nh, odd = rot % 180 !== 0;
      if (!odd) { w = Math.min(vw(), vh() * a); h = w / a; } else { w = Math.min(vh(), vw() * a); h = w / a; }
      img.style.width = w + 'px'; img.style.height = h + 'px';
      s = 1; x = 0; y = 0; paint();
    }
    function bounds() { const odd = rot % 180 !== 0, bw = (odd ? h : w) * s, bh = (odd ? w : h) * s; return { mx: Math.max(0, (bw - vw()) / 2), my: Math.max(0, (bh - vh()) / 2) }; }
    function paint() { const b = bounds(); x = clamp(x, -b.mx, b.mx); y = clamp(y, -b.my, b.my); img.style.transform = 'translate(-50%,-50%) translate(' + x + 'px,' + y + 'px) rotate(' + rot + 'deg) scale(' + s + ')'; }
    img.onload = layout; if (img.complete && img.naturalWidth) layout();
    const onResize = () => layout(); window.addEventListener('resize', onResize);
    rotate.onclick = e => { e.stopPropagation(); rot = (rot + 90) % 360; layout(); };

    const ptrs = new Map(); let g = null, lastTap = 0, moved = 0;
    const center = () => [vw() / 2, vh() / 2];
    const mid = () => { const p = [...ptrs.values()]; return p.length > 1 ? [(p[0][0] + p[1][0]) / 2, (p[0][1] + p[1][1]) / 2] : p[0]; };
    const dist = () => { const p = [...ptrs.values()]; return Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]) || 1; };
    function begin() { const m = mid(), c = center(); g = { s0: s, x0: x, y0: y, m0: m, d0: ptrs.size > 1 ? dist() : 0, vx: (m[0] - c[0] - x) / s, vy: (m[1] - c[1] - y) / s }; }
    ov.addEventListener('pointerdown', e => {
      if (e.target === close || e.target === rotate) return;
      ptrs.set(e.pointerId, [e.clientX, e.clientY]); try { ov.setPointerCapture(e.pointerId); } catch (_) { }
      if (ptrs.size === 1) moved = 0; begin();
    });
    ov.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId) || !g) return;
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      const m = mid(), c = center();
      moved = Math.max(moved, Math.hypot(m[0] - g.m0[0], m[1] - g.m0[1]));
      if (ptrs.size > 1) { s = clamp(g.s0 * dist() / g.d0, 1, 8); x = m[0] - c[0] - s * g.vx; y = m[1] - c[1] - s * g.vy; }
      else { x = g.x0 + (m[0] - g.m0[0]); y = g.y0 + (m[1] - g.m0[1]); }
      paint();
    });
    const up = e => {
      if (!ptrs.has(e.pointerId)) return;
      const single = ptrs.size === 1; ptrs.delete(e.pointerId);
      if (single && moved < 10 && e.type === 'pointerup') {
        const now = Date.now();
        if (now - lastTap < 320) { // toque duplo: aproxima no ponto tocado, ou volta ao tamanho inicial
          const c = center();
          if (s > 1.05) { s = 1; x = 0; y = 0; } else { const k = 2.5, vx = (e.clientX - c[0] - x) / s, vy = (e.clientY - c[1] - y) / s; s = k; x = e.clientX - c[0] - s * vx; y = e.clientY - c[1] - s * vy; }
          paint(); lastTap = 0;
        } else lastTap = now;
      }
      if (ptrs.size) begin(); else g = null;
      if (s < 1.02) { s = 1; paint(); }
    };
    ov.addEventListener('pointerup', up); ov.addEventListener('pointercancel', up);
    ov.addEventListener('wheel', e => { e.preventDefault(); s = clamp(s * (e.deltaY < 0 ? 1.15 : 0.87), 1, 8); paint(); }, { passive: false });

    let closed = false, pushed = false;
    function cleanup() { if (closed) return; closed = true; window.removeEventListener('resize', onResize); window.removeEventListener('popstate', onPop); document.removeEventListener('keydown', onKey, true); document.body.style.overflow = prevOverflow; ov.remove(); }
    function onPop() { cleanup(); }                     // botão "voltar" do celular fecha só o visualizador
    function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); closeViewer(); } }
    function closeViewer() { if (pushed && history.state && history.state.imgViewer) { history.back(); } else cleanup(); }
    close.onclick = e => { e.stopPropagation(); closeViewer(); };
    window.addEventListener('popstate', onPop); document.addEventListener('keydown', onKey, true);
    try { history.pushState({ imgViewer: 1 }, ''); pushed = true; } catch (_) { }
  }

  root.CircuitoImg = { isTouch, view, compress, put, putBuffer, has, getBuffer, url, cachedUrl, remove, list, keys, toDataURL, bufToBase64, base64ToBuf };
})(globalThis);
