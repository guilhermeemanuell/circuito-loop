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
      headers = ['Matéria', 'Pergunta', 'Alternativa correta', 'Resposta correta'];
      rows = bySubject(data.cadernoErradas).map(c => [c.subject, c.question, c.correct, c.options?.[c.correct] ?? c.answer ?? '']);
      filename = 'caderno-de-erradas.csv';
    } else {
      throw new Error('Selecione o conteúdo para exportar.');
    }
    return { filename, count: rows.length, csv: '\uFEFF' + [headers, ...rows].map(row => row.map(cell).join(',')).join('\r\n') + '\r\n' };
  }
  root.CircuitoCsv = { build };
})(globalThis);