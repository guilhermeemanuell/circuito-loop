(function (root) {
  function cell(value) {
    let text = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function duration(seconds) {
    const n = Math.max(0, Math.floor(Number(seconds) || 0));
    return [Math.floor(n / 3600), Math.floor(n % 3600 / 60), n % 60].map(x => String(x).padStart(2, '0')).join(':');
  }
  function build(kind, data) {
    let headers, rows, filename;
    const bySubject = items => [...items].sort((a, b) => String(a.subject || '').localeCompare(String(b.subject || ''), 'pt-BR'));
    if (kind === 'history') {
      headers = ['Data e hora', 'Matéria', 'Tempo de estudo', 'Tempo em segundos', 'Questões respondidas', 'Acertos', 'Erros', 'Aproveitamento (%)', 'Anotações'];
      rows = [...data.records].sort((a, b) => String(b.date).localeCompare(String(a.date))).map(r => [r.date, r.subject, duration(r.sec), r.sec, r.q, r.c, Number(r.q) - Number(r.c), r.q ? (100 * r.c / r.q).toFixed(2) : '0.00', r.notes]);
      filename = 'historico-de-estudo.csv';
    } else if (kind === 'flashcards') {
      headers = ['Matéria', 'Pergunta', 'Resposta'];
      rows = bySubject(data.flashcards).map(c => [c.subject, c.question, c.answer]);
      filename = 'flashcards.csv';
    } else if (kind === 'errors') {
      headers = ['Matéria', 'Pergunta', 'Alternativa correta', 'Resposta correta', 'Alternativa A', 'Alternativa B', 'Alternativa C', 'Alternativa D', 'Alternativa E'];
      rows = bySubject(data.cadernoErradas).map(c => [c.subject, c.question, c.correct, c.options?.[c.correct] ?? c.answer ?? '', ...['A', 'B', 'C', 'D', 'E'].map(k => c.options?.[k] ?? '')]);
      filename = 'caderno-de-erradas.csv';
    } else {
      throw new Error('Selecione o conteúdo para exportar.');
    }
    return { filename, count: rows.length, csv: '﻿' + [headers, ...rows].map(row => row.map(cell).join(',')).join('\r\n') + '\r\n' };
  }

  /* ===== Importação ===== */
  const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  // desfaz a proteção contra fórmulas aplicada na exportação e normaliza quebras de linha
  const clean = s => String(s ?? '').replace(/^'(?=\s*[=+@-])/, '').replace(/\r\n?/g, '\n').trim();

  function parse(text) {
    text = String(text ?? '').replace(/^﻿/, '');
    let delim = ',';
    { // vírgula (padrão) ou ponto e vírgula (Excel em português), conforme a primeira linha
      let q = false, commas = 0, semis = 0;
      for (const ch of text) {
        if (ch === '"') q = !q;
        else if (!q) { if (ch === '\n' || ch === '\r') break; if (ch === ',') commas++; else if (ch === ';') semis++; }
      }
      if (semis > commas) delim = ';';
    }
    const rows = []; let row = [], field = '', q = false;
    const endField = () => { row.push(field); field = ''; };
    const endRow = () => { endField(); if (row.some(x => x.trim() !== '')) rows.push(row); row = []; };
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
        else field += ch;
      } else if (ch === '"' && field === '') q = true;
      else if (ch === delim) endField();
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; endRow(); }
      else field += ch;
    }
    if (field !== '' || row.length) endRow();
    return rows;
  }

  // existing: { subjects: [...nomes do circuito], flashcards: [...], cadernoErradas: [...] }
  function planImport(text, existing) {
    const rows = parse(text);
    if (rows.length < 2) throw new Error('O arquivo CSV está vazio ou só tem o cabeçalho.');
    const head = rows[0].map(norm), col = n => head.indexOf(n);
    const iS = col('materia'), iQ = col('pergunta');
    let kind;
    if (col('alternativa correta') >= 0) kind = 'errors';
    else if (col('data e hora') >= 0) throw new Error('Este CSV é do Histórico de estudo, que não pode ser importado aqui. Use um CSV de Flashcards ou do Caderno de Erradas.');
    else if (col('resposta') >= 0) kind = 'flashcards';
    else throw new Error('Não reconheci o formato do CSV. Flashcards precisam das colunas Matéria, Pergunta e Resposta; Caderno de Erradas, de Matéria, Pergunta, Alternativa correta e Alternativa A a E.');
    if (iS < 0 || iQ < 0) throw new Error('O CSV precisa ter as colunas “Matéria” e “Pergunta”.');
    const iA = col('resposta'), iC = col('alternativa correta'), iR = col('resposta correta');
    const iOpt = ['a', 'b', 'c', 'd', 'e'].map(l => col('alternativa ' + l));
    if (kind === 'errors' && iOpt.some(i => i < 0)) throw new Error('Este CSV de Caderno de Erradas não tem as colunas Alternativa A a E, então não dá para recriar as questões. Exporte o CSV novamente por esta versão do app (a exportação agora inclui as cinco alternativas).');

    const list = (kind === 'flashcards' ? existing.flashcards : existing.cadernoErradas) || [];
    const canon = new Map();
    [...(existing.subjects || []), ...list.map(c => c.subject)].forEach(s => { const t = String(s || '').trim(); if (t && !canon.has(norm(t))) canon.set(norm(t), t); });
    const known = new Set(canon.keys());
    const seen = new Set(list.map(c => norm(c.subject) + '\u0000' + norm(c.question)));
    const cards = [], invalid = [], newSubjects = new Set(), touched = new Set();
    let duplicates = 0;
    rows.slice(1).forEach((r, k) => {
      const line = k + 2, v = i => i < 0 ? '' : clean(r[i]);
      let subject = v(iS), question = v(iQ), item;
      if (!subject || !question) { invalid.push(line); return; }
      if (kind === 'flashcards') {
        const answer = v(iA);
        if (!answer) { invalid.push(line); return; }
        item = { subject, question, answer };
      } else {
        const correct = v(iC).toUpperCase(), options = {};
        ['A', 'B', 'C', 'D', 'E'].forEach((l, n) => { options[l] = v(iOpt[n]); });
        if (!/^[A-E]$/.test(correct)) { invalid.push(line); return; }
        if (!options[correct] && iR >= 0) options[correct] = v(iR);
        if (Object.values(options).some(x => !x)) { invalid.push(line); return; }
        item = { subject, question, options, correct };
      }
      const key = norm(subject);
      const dupKey = key + '\u0000' + norm(question);
      if (seen.has(dupKey)) { duplicates++; return; }
      seen.add(dupKey);
      if (!canon.has(key)) { canon.set(key, subject); newSubjects.add(subject); }
      else if (known.has(key)) touched.add(canon.get(key));
      item.subject = canon.get(key);
      cards.push(item);
    });
    return { kind, cards, total: rows.length - 1, added: cards.length, duplicates, invalid, newSubjects: [...newSubjects], existingSubjects: [...touched] };
  }

  root.CircuitoCsv = { build, parse, planImport };
})(globalThis);
