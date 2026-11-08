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
    } else if (kind === 'all') {
      headers = ['Tipo de dado', 'Data e hora', 'Matéria', 'Tempo de estudo', 'Tempo em segundos', 'Questões respondidas', 'Acertos', 'Erros', 'Aproveitamento (%)', 'Pergunta', 'Resposta', 'Alternativa correta', 'Alternativa A', 'Alternativa B', 'Alternativa C', 'Alternativa D', 'Alternativa E', 'Anotações'];
      rows = [];
      [...(data.records || [])].sort((a,b)=>String(b.date).localeCompare(String(a.date))).forEach(r=>rows.push(['Histórico',r.date,r.subject,duration(r.sec),r.sec,r.q,r.c,Number(r.q)-Number(r.c),r.q?(100*r.c/r.q).toFixed(2):'0.00','','','','','','','','',r.notes]));
      bySubject(data.flashcards || []).forEach(c=>rows.push(['Flashcard','',''+c.subject,'','','','','','',''+c.question,c.answer,'','','','','','','']));
      bySubject(data.cadernoErradas || []).forEach(c=>rows.push(['Caderno de Erradas','',''+c.subject,'','','','','','',''+c.question,'',c.correct,...['A','B','C','D','E'].map(k=>c.options?.[k]??''),'']));
      filename = 'todos-os-dados.csv';
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

  // existing: { subjects, flashcards, cadernoErradas }
  function planImport(text, existing) {
    const rows = parse(text);
    if (rows.length < 2) throw new Error('O arquivo CSV está vazio ou só tem o cabeçalho.');
    const head = rows[0].map(norm), col = n => head.indexOf(norm(n));
    const iS=col('materia'), iQ=col('pergunta');
    let kind;
    if(col('alternativa correta')>=0) kind='errors';
    else if(col('data e hora')>=0) throw new Error('Este CSV é do Histórico de estudo, que não pode ser importado aqui.');
    else if(col('resposta')>=0) kind='flashcards';
    else throw new Error('Não reconheci o formato do CSV.');
    if(iS<0||iQ<0) throw new Error('O CSV precisa ter as colunas Matéria e Pergunta.');
    const iA=col('resposta'), iC=col('alternativa correta'), iR=col('resposta correta');
    const iOpt=['a','b','c','d','e'].map(l=>col('alternativa '+l));
    if(kind==='errors'&&iOpt.some(i=>i<0)) throw new Error('O CSV do Caderno de Erradas precisa conter as alternativas A a E.');
    const iComment=col('comentario'), iImage=col('imagem'), iCategory=col('categoria');
    const list=(kind==='flashcards'?existing.flashcards:existing.cadernoErradas)||[];
    const canon=new Map();
    [...(existing.subjects||[]),...list.map(c=>c.subject)].forEach(v=>{const t=String(v||'').trim(),k=norm(t);if(t&&!canon.has(k))canon.set(k,t)});
    const known=new Set(canon.keys()), seen=new Map();
    list.forEach(c=>seen.set(norm(c.subject)+'\u0000'+norm(c.question),{reason:'app',other:c}));
    const cards=[],dupItems=[],invalid=[],newSubjects=new Set(),touched=new Set();
    const get=(r,i)=>i<0?'':clean(r[i]);
    rows.slice(1).forEach((r,k)=>{
      const line=k+2,subject=get(r,iS),question=get(r,iQ); let item;
      if(!subject||!question){invalid.push(line);return}
      if(kind==='flashcards'){
        const answer=get(r,iA);if(!answer){invalid.push(line);return}
        item={subject,question,answer,...(iCategory>=0&&get(r,iCategory)?{category:get(r,iCategory)}:{})};
      }else{
        const correct=get(r,iC).toUpperCase(),options={};['A','B','C','D','E'].forEach((l,n)=>options[l]=get(r,iOpt[n]));
        if(!/^[A-E]$/.test(correct)){invalid.push(line);return}
        if(!options[correct]&&iR>=0)options[correct]=get(r,iR);
        if(Object.values(options).some(x=>!x)){invalid.push(line);return}
        item={subject,question,options,correct};
        if(iComment>=0&&get(r,iComment))item.comment=get(r,iComment);
        // A coluna Imagem aceita o marcador padronizado; nomes antigos continuam aceitos.
        if(iImage>=0&&get(r,iImage)){
          const raw=get(r,iImage),m=raw.match(/^\s*\{\{imagem:([^{}]+)\}\}\s*$/i);
          item.imageName=(m?m[1]:raw).trim();
        }
      }
      const key=norm(subject),dupKey=key+'\u0000'+norm(question),prior=seen.get(dupKey);
      if(prior){dupItems.push({line,subject,question,item,reason:prior.reason,firstLine:prior.line||0,differs:false});return}
      seen.set(dupKey,{reason:'file',line,item});
      if(!canon.has(key)){canon.set(key,subject);newSubjects.add(subject)}else if(known.has(key))touched.add(canon.get(key));
      item.subject=canon.get(key);cards.push(item);
    });
    return {kind,cards,dupItems,invalid,total:rows.length-1,added:cards.length,duplicates:dupItems.length,newSubjects:[...newSubjects],existingSubjects:[...touched]};
  }

  function subjects(kind,data){
    const arr=(kind==='flashcards'?data.flashcards:data.cadernoErradas)||[],m=new Map();
    arr.forEach(c=>{const name=String(c.subject||'').trim();if(!name)return;const key=norm(name);if(!m.has(key))m.set(key,{key,name,count:0});m.get(key).count++});
    return [...m.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  }
  function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
  function zipFiles(files){
    const enc=new TextEncoder(),locals=[],centrals=[];let offset=0;
    const u16=n=>[n&255,(n>>>8)&255],u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];
    for(const f of files){const name=enc.encode(f.name),data=typeof f.data==='string'?enc.encode(f.data):f.data,crc=crc32(data);
      const lh=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...name]);
      locals.push(lh,data);const ch=new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...name]);centrals.push(ch);offset+=lh.length+data.length;
    }
    const centralSize=centrals.reduce((n,x)=>n+x.length,0),end=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(centralSize),...u32(offset),...u16(0)]);
    const all=[...locals,...centrals,end],size=all.reduce((n,x)=>n+x.length,0),out=new Uint8Array(size);let pos=0;all.forEach(x=>{out.set(x,pos);pos+=x.length});return out;
  }
  function buildAll(data){const kinds=['history','flashcards','errors'],files=kinds.map(k=>{const r=build(k,data);return{name:r.filename,data:r.csv}}).filter((f,i)=>f.data.split('\r\n').length>2);return{filename:'circuito-loop-todos-os-dados.zip',count:files.length?files.reduce((n,f)=>n+Math.max(0,f.data.split('\r\n').length-2),0):0,bytes:zipFiles(files),files:files.map(f=>f.name)}}
  function buildBySubject(kind,data,keys,merge){
    const source=kind==='flashcards'?data.flashcards:data.cadernoErradas,selected=new Set(keys),items=(source||[]).filter(c=>selected.has(norm(c.subject)));
    if(merge)return build(kind,{...data,[kind==='flashcards'?'flashcards':'cadernoErradas']:items});
    const groups=subjects(kind,{...data,[kind==='flashcards'?'flashcards':'cadernoErradas']:items}).map(s=>({name:s.name,items:items.filter(c=>norm(c.subject)===s.key)}));
    const files=groups.map(g=>({name:g.name.replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')+'-'+(kind==='flashcards'?'flashcards':'caderno-de-erradas')+'.csv',data:build(kind,{...data,[kind==='flashcards'?'flashcards':'cadernoErradas']:g.items}).csv}));
    return{filename:'exportacao-por-materia.zip',count:items.length,bytes:zipFiles(files),files:files.map(f=>f.name)};
  }

  root.CircuitoCsv = { build, buildAll, buildBySubject, subjects, parse, planImport };
})(globalThis);
