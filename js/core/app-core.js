/* Circuito Loop — código extraído do bloco inline 1 do index.html. */
(()=>{const $=id=>document.getElementById(id),KEY='circuitoLoop.v1',SUBKEY='circuitoLoop.subjects.v1',INDEXKEY='circuitoLoop.index.v1',DRAFTKEY='circuitoLoop.sessionDraft.v1';let records=[],subjects=[],currentIndex=0,circuits=[],selectedCircuit='',historyPage=0,continuedSubject='';try{records=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){}try{subjects=JSON.parse(localStorage.getItem(SUBKEY)||'[]')}catch(e){}try{currentIndex=Number(localStorage.getItem(INDEXKEY)||0)}catch(e){}try{circuits=JSON.parse(localStorage.getItem('circuitoLoop.circuits.v1')||'[]')}catch(e){}if(!Array.isArray(subjects))subjects=[];if(!Array.isArray(circuits))circuits=[];currentIndex=subjects.length?((currentIndex%subjects.length)+subjects.length)%subjects.length:0;selectedCircuit=(circuits.find(c=>Array.isArray(c.subjects)&&JSON.stringify(c.subjects)===JSON.stringify(subjects)&&Number(c.index)===currentIndex)||{}).id||'';let mode='idle',base=0,started=0,interval=null,sessionNotes='',activeNoteRecord=null,lastDraftSave=0;
const elapsed=()=>base+(mode==='run'?(Date.now()-started)/1000:0),fmt=n=>{n=Math.floor(n);return [Math.floor(n/3600),Math.floor(n%3600/60),n%60].map(x=>String(x).padStart(2,'0')).join(':')},fmtView=n=>matchMedia('(max-width:760px)').matches?[Math.floor(n/3600),Math.floor(n%3600/60)].map(x=>String(Math.floor(x)).padStart(2,'0')).join(':'):fmt(n);
function clock(){ $('clock').textContent=fmt(elapsed());if(mode!=='idle'&&Date.now()-lastDraftSave>=1000)saveDraft() }
function saveDraft(){if(mode==='idle')return;try{const noteModal=$('notesModal');const notes=(!noteModal.hidden&&noteModal.style.display==='flex'&&!activeNoteRecord)?$('notesText').value:sessionNotes;const draft={subject:activeSubject(),continuedSubject,sec:Math.max(0,Math.floor(elapsed())),q:$('q').value,c:$('c').value,notes,mode,updatedAt:Date.now()};localStorage.setItem(DRAFTKEY,JSON.stringify(draft));lastDraftSave=Date.now()}catch(e){}}
function clearDraft(){try{localStorage.removeItem(DRAFTKEY)}catch(e){}}
function restoreDraft(){try{const d=JSON.parse(localStorage.getItem(DRAFTKEY)||'null');if(!d||!d.subject||!Number.isFinite(Number(d.sec)))return;const ok=confirm('Foi encontrada uma sessão não salva de “'+d.subject+'” ('+fmt(Number(d.sec))+'). Deseja recuperá-la?');if(!ok){clearDraft();return}base=Math.max(0,Number(d.sec)||0);started=0;mode='pause';sessionNotes=String(d.notes||'');$('q').value=d.q??'0';$('c').value=d.c??'0';continuedSubject=String(d.continuedSubject||'');if(!continuedSubject&&(!subjects.length||subjects[currentIndex]!==d.subject))continuedSubject=String(d.subject);controls();clock();updateNotesState();$('status').textContent='Sessão recuperada — pausada. Clique em Continuar para retomar.'}catch(e){}}
function activeSubject(){return continuedSubject||(subjects.length?subjects[currentIndex]:'')}
function saveSubjects(){localStorage.setItem(SUBKEY,JSON.stringify(subjects));localStorage.setItem(INDEXKEY,String(currentIndex));renderSubjects();autoSaveCurrentCircuit()}
function autoSaveCurrentCircuit(){const name=$('circuitName').value.trim();let c=circuits.find(x=>x.id===selectedCircuit);if(c){c.name=name||c.name;c.subjects=[...subjects];c.index=currentIndex;saveCircuits()}else if(name&&subjects.length){c={id:'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),name,subjects:[...subjects],index:currentIndex};circuits.push(c);selectedCircuit=c.id;saveCircuits()}}
function renderCircuitChoices(){const sel=$('circuitSelect'),keep=selectedCircuit;sel.innerHTML='<option value="">Selecione um circuito salvo</option>';circuits.forEach(c=>{let o=document.createElement('option');o.value=c.id;o.textContent=c.name;sel.appendChild(o)});sel.value=circuits.some(c=>c.id===keep)?keep:'';selectedCircuit=sel.value;renderKnownSubjects()}
function saveCircuits(){localStorage.setItem('circuitoLoop.circuits.v1',JSON.stringify(circuits));renderCircuitChoices()}
function renderKnownSubjects(){const sel=$('knownSubject');if(!sel)return;const keep=sel.value,all=[...subjects,...circuits.flatMap(c=>Array.isArray(c.subjects)?c.subjects:[])].map(x=>String(x).trim()).filter(Boolean),unique=new Map();all.forEach(n=>{const key=n.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLocaleLowerCase('pt-BR');if(!unique.has(key))unique.set(key,n)});const collator=new Intl.Collator('pt-BR',{sensitivity:'base',numeric:true});const names=[...unique.values()].sort((a,b)=>collator.compare(a,b)||a.localeCompare(b));sel.innerHTML='<option value="">Selecione uma matéria</option>';names.forEach(n=>{const o=document.createElement('option');o.value=n;o.textContent=n;sel.appendChild(o)});sel.value=names.includes(keep)?keep:''}
$('knownSubject')?.addEventListener('focus',renderKnownSubjects);function renderSubjects(){renderKnownSubjects();$('clearSubjects').hidden=!selectedCircuit;$('subject').textContent=activeSubject()||'Nenhuma matéria cadastrada';$('start').disabled=mode!=='idle'||!subjects.length;$('subjectList').innerHTML='';subjects.forEach((s,i)=>{let chip=document.createElement('div');chip.style.cssText='display:flex;align-items:center;gap:5px;padding:5px 6px 5px 10px;border-radius:8px;background:'+(i===currentIndex?'#dbeafe':'#f1f5f9')+';color:#24364b;font-weight:'+(i===currentIndex?'700':'500');let label=document.createElement('span');label.textContent=(i===currentIndex?'▶ ':'')+(i+1)+'. '+s;chip.appendChild(label);[['↑',-1,'Mover para cima'],['↓',1,'Mover para baixo']].forEach(([symbol,delta,title])=>{let b=document.createElement('button');b.textContent=symbol;b.title=title;b.className='alt';b.style.cssText='padding:3px 7px';b.disabled=mode!=='idle'||i+delta<0||i+delta>=subjects.length;b.onclick=()=>{const target=i+delta;[subjects[i],subjects[target]]=[subjects[target],subjects[i]];if(currentIndex===i)currentIndex=target;else if(currentIndex===target)currentIndex=i;saveSubjects()};chip.appendChild(b)});let dup=document.createElement('button');dup.textContent='⧉';dup.title='Duplicar matéria';dup.className='alt';dup.style.cssText='padding:3px 7px';dup.disabled=mode!=='idle';dup.onclick=()=>{subjects.push(s);saveSubjects()};chip.appendChild(dup);let del=document.createElement('button');del.textContent='×';del.title='Remover matéria';del.className='red';del.style.cssText='padding:3px 7px';del.disabled=mode!=='idle';del.onclick=()=>{if(!confirm('Remover esta ocorrência de “'+s+'” do circuito?'))return;undoable('Matéria removida do circuito',()=>{subjects.splice(i,1);if(i<currentIndex)currentIndex--;if(currentIndex>=subjects.length)currentIndex=0;saveSubjects()})};chip.appendChild(del);$('subjectList').appendChild(chip)});$('loopStatus').textContent=subjects.length?'Matéria '+(currentIndex+1)+' de '+subjects.length+' — ao salvar, avançará para a próxima.':'Cadastre ao menos uma matéria para iniciar.'}
function updateNotesState(){$('notesState').textContent=sessionNotes.trim()?'Anotações adicionadas':'Nenhuma anotação'}
$('openNotes').onclick=()=>{activeNoteRecord=null;$('notesHeading').textContent='Anotações da sessão';$('notesText').readOnly=false;$('saveNotes').hidden=false;$('closeNotes').textContent='Fechar sem salvar';$('notesText').value=sessionNotes;$('notesModal').hidden=false;$('notesModal').style.display='flex';$('notesText').focus()};
$('saveNotes').onclick=()=>{if(activeNoteRecord){activeNoteRecord.notes=$('notesText').value;save()}else{sessionNotes=$('notesText').value;updateNotesState();saveDraft()}$('notesModal').hidden=true;$('notesModal').style.display='none';activeNoteRecord=null};
$('closeNotes').onclick=()=>{$('notesModal').hidden=true;$('notesModal').style.display='none';activeNoteRecord=null};
$('notesModal').addEventListener('click',e=>{if(e.target===$('notesModal'))e.stopPropagation()});
function controls(){ $('start').hidden=mode!=='idle';$('start').disabled=mode!=='idle'||!subjects.length;$('pause').hidden=mode!=='run';$('pause').disabled=mode!=='run';$('resume').hidden=mode!=='pause';$('resume').disabled=mode!=='pause';$('stop').hidden=mode==='idle';$('stop').disabled=mode==='idle';$('discard').hidden=mode==='idle';$('discard').disabled=mode==='idle';$('status').textContent=mode==='run'?'Cronômetro em andamento':mode==='pause'?'Pausado':'Pronto para começar'}
function reset(){clearInterval(interval);interval=null;base=0;started=0;mode='idle';continuedSubject='';clearDraft();controls();clock();renderSubjects()}
/* Origem do registro: Flashcards (🃏), Caderno de Erradas (📕) ou sessão comum (📝). Registros antigos são reconhecidos pelo texto da anotação. */
function recSource(r){if(r&&(r.source==='flashcards'||r.source==='errors'))return r.source;const n=String((r&&r.notes)||'').trim();return n==='Caderno de Erradas'?'errors':/^Flashcards\b/.test(n)?'flashcards':''}
function render(){let secs=0,qs=0,cs=0;$('rows').innerHTML='';records.forEach(r=>{secs+=r.sec;qs+=r.q;cs+=r.c});const sortedRecords=[...records].sort((a,b)=>new Date(b.date)-new Date(a.date));const pageCount=Math.max(1,Math.ceil(sortedRecords.length/10));historyPage=Math.min(historyPage,pageCount-1);sortedRecords.slice(historyPage*10,historyPage*10+10).forEach((r)=>{let tr=document.createElement('tr');[new Date(r.date).toLocaleString('pt-BR'),r.subject,fmtView(r.sec),r.q,r.c,r.q-r.c,r.q?(100*r.c/r.q).toFixed(1).replace('.',',')+'%':'—'].forEach((v,j)=>{let td=document.createElement('td');td.textContent=v;
if(j===1){
  td.textContent='';
  let subjectLink=document.createElement('span');
  subjectLink.textContent=(v==='__SIMULADAO__'||v==='__**SIMULADAO__**')?'Simuladão':(v==='__TODAS_MENOS__'||v==='__**TODAS_MENOS__**')?'Todas menos...':v;
  subjectLink.title='Clique para continuar estudando esta matéria';
  subjectLink.style.cssText='cursor:pointer;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:3px';
  subjectLink.onclick=()=>{if(mode!=='idle'){alert('Finalize ou descarte a sessão atual antes de continuar outra matéria.');return}continuedSubject=r.subject;$('q').value='0';$('c').value='0';$('subject').textContent=continuedSubject;$('start').disabled=false;$('status').textContent='Pronto para começar — continuação de '+continuedSubject;$('q').focus()};
  td.appendChild(subjectLink);
}
if(j===1&&r.notes&&r.notes.trim()){const src=recSource(r),ico={errors:'📕',flashcards:'🃏'}[src]||'📝',lbl={errors:'Caderno de Erradas',flashcards:'Flashcards'}[src];let mark=document.createElement('span');mark.textContent=' '+ico;mark.setAttribute('aria-label',(lbl?lbl+' — ':'')+'abrir anotações');mark.title=(lbl?lbl+' — ':'')+'abrir anotações';mark.setAttribute('role','button');mark.tabIndex=0;mark.style.cursor='pointer';mark.onclick=()=>noteBtn.click();mark.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();noteBtn.click()}};td.appendChild(mark)}tr.appendChild(td)});let td=document.createElement('td'),noteBtn=document.createElement('button');noteBtn.textContent='Anotações';noteBtn.className='alt';noteBtn.title='Anotações';noteBtn.setAttribute('aria-label','Anotações');noteBtn.style.marginRight='6px';noteBtn.disabled=false;noteBtn.onclick=()=>{activeNoteRecord=r;$('notesHeading').textContent='Anotações — '+r.subject; $('notesText').value=r.notes||''; $('notesText').readOnly=false; $('saveNotes').hidden=false; $('saveNotes').textContent='Salvar anotações'; $('closeNotes').textContent='Cancelar'; $('notesModal').hidden=false;$('notesModal').style.display='flex'};td.appendChild(noteBtn);let edit=document.createElement('button');edit.textContent='Editar';edit.className='alt';edit.title='Editar';edit.setAttribute('aria-label','Editar');edit.style.marginRight='6px';edit.onclick=()=>{const choice=prompt('Qual informação deseja editar?\n1 - Matéria\n2 - Anotações\n3 - Questões realizadas\n4 - Acertos\n5 - Tempo estudado\n\nDigite o número da opção:');if(choice===null)return;const fields={'1':{label:'Matéria',key:'subject',value:r.subject},'2':{label:'Anotações',key:'notes',value:r.notes||''},'3':{label:'Questões realizadas',key:'q',value:String(r.q)},'4':{label:'Acertos',key:'c',value:String(r.c)},'5':{label:'Tempo (HH:MM:SS)',key:'sec',value:fmt(r.sec)}};const f=fields[choice];if(!f){alert('Opção inválida.');return}const value=prompt('Editar '+f.label+':',f.value);if(value===null)return;if(f.key==='subject'){if(!value.trim()){alert('A matéria não pode ficar vazia.');return}r.subject=value.trim()}else if(f.key==='notes'){r.notes=value}else if(f.key==='q'||f.key==='c'){const n=Number(value);if(!Number.isInteger(n)||n<0||(f.key==='c'&&n>r.q)||(f.key==='q'&&n<r.c)){alert(f.key==='q'?'Informe um número inteiro não negativo e igual ou maior que os acertos.':'Informe um número inteiro entre zero e o total de questões.');return}r[f.key]=n}else{const m=value.trim().match(/^(\d+):([0-5]\d):([0-5]\d)$/);if(!m){alert('Use o formato HH:MM:SS.');return}r.sec=Number(m[1])*3600+Number(m[2])*60+Number(m[3])}save()};td.appendChild(edit);let b=document.createElement('button');b.textContent='Excluir';b.className='red';b.title='Excluir';b.setAttribute('aria-label','Excluir');b.onclick=()=>{undoable('Registro de estudo excluído',()=>{records.splice(records.indexOf(r),1);save()})};td.appendChild(b);tr.appendChild(td);$('rows').appendChild(tr)});const pager=$('historyPagination');pager.innerHTML='';if(pageCount>1){const prev=document.createElement('button');prev.className='alt';prev.textContent='Anterior';prev.disabled=historyPage===0;prev.onclick=()=>{historyPage--;render()};pager.appendChild(prev);const label=document.createElement('span');label.textContent=`Página ${historyPage+1} de ${pageCount}`;label.style.alignSelf='center';pager.appendChild(label);const next=document.createElement('button');next.className='alt';next.textContent='Próxima';next.disabled=historyPage>=pageCount-1;next.onclick=()=>{historyPage++;render()};pager.appendChild(next)}if(!records.length)$('rows').innerHTML='<tr><td colspan="8" class="muted" style="text-align:center;padding:22px">Nenhuma sessão registrada ainda.</td></tr>';$('timeTotal').textContent=Math.floor(secs/3600)+'h '+String(Math.floor(secs%3600/60)).padStart(2,'0')+'m';$('sessTotal').textContent=records.length;$('qTotal').textContent=qs;const overallRate=qs?100*cs/qs:null;$('rateTotal').textContent=overallRate!==null?overallRate.toFixed(1).replace('.',',')+'%':'—';$('rateTotal').style.color=overallRate===null?'':overallRate<=70?'#B60020':overallRate<=85?'#E9CC00':'#009B00';const subjectStats=$('subjectStats');subjectStats.innerHTML='';subjectStats.style.display='flex';subjectStats.style.flexDirection='column';subjectStats.style.gap='10px';const bySubject=new Map();records.forEach(r=>{const name=(r.subject||'Sem matéria').trim()||'Sem matéria';if(!bySubject.has(name))bySubject.set(name,{sec:0,q:0,c:0});const item=bySubject.get(name);item.sec+=Number(r.sec)||0;item.q+=Number(r.q)||0;item.c+=Number(r.c)||0});[...bySubject.entries()].sort((a,b)=>a[0].localeCompare(b[0],'pt-BR',{sensitivity:'base'})).forEach(([name,item])=>{const line=document.createElement('div');line.style.cssText='display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;width:100%';const values=[[name,'Matéria'],[fmtView(item.sec),'Tempo estudado'],[String(item.q),'Questões resolvidas'],[item.q?(100*item.c/item.q).toFixed(1).replace('.',',')+'%':'—','Aproveitamento']];values.forEach(([value,label],i)=>{const card=document.createElement('div');card.className='stat';card.style.cssText='min-width:0;box-sizing:border-box';const strong=document.createElement('b');strong.textContent=value;strong.style.cssText='display:block;overflow-wrap:anywhere;font-size:'+(i===0?'16px':'18px');if(i===3&&item.q){const rate=100*item.c/item.q;strong.style.color=rate<=70?'#B60020':rate<=85?'#E9CC00':'#009B00'}const caption=document.createElement('span');caption.textContent=label;caption.style.cssText='display:block;margin-top:4px';card.appendChild(strong);card.appendChild(caption);line.appendChild(card)});subjectStats.appendChild(line)});if(!bySubject.size){const empty=document.createElement('div');empty.className='muted';empty.textContent='Os totais por matéria aparecerão após os primeiros registros.';subjectStats.appendChild(empty)}}
function save(){localStorage.setItem(KEY,JSON.stringify(records));render();ceStatsRender()}
$('toggleCircuit').onclick=()=>{const body=$('circuitBody'),hide=!body.hidden;body.hidden=hide;$('toggleCircuit').textContent=hide?'Expandir':'Minimizar';$('circuitTitle').textContent=hide?'Circuito'+($('circuitName').value.trim()?' — '+$('circuitName').value.trim():''):'Matérias do circuito'};
$('circuitSelect').onchange=()=>{if(mode!=='idle'){alert('Pare ou salve a sessão antes de trocar de circuito.');renderCircuitChoices();return}selectedCircuit=$('circuitSelect').value;if(!selectedCircuit){$('circuitName').value='';subjects=[];currentIndex=0;saveSubjects();return}const c=circuits.find(x=>x.id===selectedCircuit);if(c){$('circuitName').value=c.name;if($('circuitBody').hidden)$('circuitTitle').textContent='Circuito — '+c.name;subjects=[...c.subjects];currentIndex=c.subjects.length?Math.max(0,Math.min(Number.isInteger(Number(c.index))?Number(c.index):0,c.subjects.length-1)):0;saveSubjects()}};
$('clearSubjects').onclick=()=>{if(mode!=='idle'){alert('Pare ou salve a sessão antes de excluir as matérias.');return}if(!subjects.length){alert('Não há matérias para excluir.');return}if(confirm('Excluir todas as '+subjects.length+' matérias deste circuito? O circuito salvo será atualizado e ficará sem matérias.')){undoable('Matérias do circuito excluídas',()=>{subjects=[];currentIndex=0;saveSubjects()})}};$('circuitName').addEventListener('change',()=>{if(mode==='idle')autoSaveCurrentCircuit()});$('saveCircuit').onclick=()=>{if(mode!=='idle'){alert('Pare ou salve a sessão antes de salvar o circuito.');return}const name=$('circuitName').value.trim();if(!name){alert('Informe um nome para o circuito.');return}if(!subjects.length){alert('Adicione ao menos uma matéria antes de salvar o circuito.');return}let c=circuits.find(x=>x.id===selectedCircuit);if(c){c.name=name;c.subjects=[...subjects];c.index=currentIndex}else{c={id:'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),name,subjects:[...subjects],index:currentIndex};circuits.push(c);selectedCircuit=c.id}saveCircuits();alert('Circuito salvo!')};
$('deleteCircuit').onclick=()=>{if(mode!=='idle'){alert('Pare ou salve a sessão antes de excluir um circuito.');return}const c=circuits.find(x=>x.id===selectedCircuit);if(!c){alert('Selecione um circuito salvo para excluir.');return}if(confirm('Excluir o circuito “'+c.name+'”?')){undoable('Circuito excluído',()=>{circuits=circuits.filter(x=>x.id!==selectedCircuit);selectedCircuit='';saveCircuits();$('circuitName').value=''})}};
$('addKnownSubject').onclick=()=>{if(mode!=='idle'){alert('Pare ou salve a sessão antes de alterar o circuito.');return}const name=$('knownSubject').value;if(!name){alert('Selecione uma matéria da lista.');return}subjects.push(name);saveSubjects()};$('addSubject').onclick=()=>{if(mode!=='idle'){alert('Pare ou salve a sessão antes de alterar o circuito.');return}let s=$('newSubject').value.trim();if(!s){alert('Digite o nome da matéria.');return}subjects.push(s);$('newSubject').value='';saveSubjects()};$('newSubject').addEventListener('keydown',e=>{if(e.key==='Enter')$('addSubject').click()});$('start').onclick=()=>{if(!activeSubject()){alert('Cadastre ao menos uma matéria no circuito.');return}base=0;started=Date.now();mode='run';interval=setInterval(clock,250);controls();saveDraft();clock()};
$('pause').onclick=()=>{base=elapsed();mode='pause';clearInterval(interval);controls();saveDraft();clock()};
$('resume').onclick=()=>{started=Date.now();mode='run';interval=setInterval(clock,250);controls();saveDraft()};
$('discard').onclick=()=>{if(confirm('Descartar esta sessão?'))reset()};
$('q').addEventListener('input',saveDraft);$('c').addEventListener('input',saveDraft);$('notesText').addEventListener('input',()=>{if(!activeNoteRecord)saveDraft()});
$('stop').onclick=()=>{if(Number($('q').value)===0){if(mode==='run'){base=elapsed();clearInterval(interval);interval=null;mode='pause';controls();clock()}if(!confirm('O campo “Questões realizadas” está zerado. Deseja salvar a sessão assim mesmo? Clique em Cancelar para voltar e resolver questões antes de salvar.')){if(mode==='pause'){started=Date.now();mode='run';interval=setInterval(clock,250);controls()}return}}if(mode==='run')base=elapsed();let q=Number($('q').value),c=Number($('c').value);if(!Number.isInteger(q)||!Number.isInteger(c)||q<0||c<0||c>q){alert('Confira: acertos deve ser inteiro entre zero e o total de questões.');return}records.unshift({date:new Date().toISOString(),subject:activeSubject(),notes:sessionNotes,sec:Math.round(base),q,c});save();$('q').value=0;$('c').value=0;sessionNotes='';updateNotesState();if(subjects.length&&!continuedSubject){currentIndex=(currentIndex+1)%subjects.length;saveSubjects()}reset()};
$('toggleSummary').onclick=()=>{const content=$('subjectSummaryContent'),hide=!content.hidden;content.hidden=hide;$('toggleSummary').textContent=hide?'Maximizar':'Minimizar'};$('toggleHistory').onclick=()=>{const content=$('historyContent'),isOpen=!content.hidden;content.hidden=isOpen;$('toggleHistory').textContent=isOpen?'Maximizar':'Minimizar';$('clear').hidden=isOpen;$('insertRecord').hidden=isOpen};const arrangeHistoryButtons=()=>{const top=document.querySelector('.history-head-top'),actions=document.querySelector('.history-head-actions'),desktop=window.matchMedia('(min-width:641px)').matches;if(desktop){top.appendChild($('clear'));top.appendChild($('insertRecord'));top.appendChild($('toggleHistory'));actions.replaceChildren()}else{top.appendChild($('toggleHistory'));actions.appendChild($('clear'));actions.appendChild($('insertRecord'))}};arrangeHistoryButtons();window.addEventListener('resize',arrangeHistoryButtons);$('insertRecord').onclick=()=>{const now=new Date();const local=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,16);$('manualDate').value=local;const subjectSelect=$('manualSubject');subjectSelect.innerHTML='<option value="">Selecione uma matéria</option>';[...new Set(subjects)].sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'})).forEach(name=>{const option=document.createElement('option');option.value=name;option.textContent=name;subjectSelect.appendChild(option)});$('manualMinutes').value=0;$('manualQuestions').value=0;$('manualCorrect').value=0;$('manualNotes').value='';$('recordModal').hidden=false;$('recordModal').style.display='flex';$('manualSubject').focus()};$('cancelManual').onclick=()=>{$('recordModal').hidden=true;$('recordModal').style.display='none'};$('saveManual').onclick=()=>{const subject=$('manualSubject').value.trim(),dateValue=$('manualDate').value,minutes=Number($('manualMinutes').value),q=Number($('manualQuestions').value),c=Number($('manualCorrect').value);if(!subject||!dateValue){alert('Preencha a matéria/tarefa e a data e hora.');return}if(![minutes,q,c].every(Number.isFinite)||minutes<0||q<0||c<0||!Number.isInteger(q)||!Number.isInteger(c)||c>q){alert('Confira o tempo e as quantidades: acertos não podem superar questões feitas.');return}const date=new Date(dateValue);if(Number.isNaN(date.getTime())){alert('Data e hora inválidas.');return}records.push({date:date.toISOString(),subject,sec:Math.round(minutes*60),q,c,notes:$('manualNotes').value});save();$('recordModal').hidden=true;$('recordModal').style.display='none'};$('clear').onclick=()=>{if(confirm('Apagar todo o histórico? Esta ação também reiniciará o circuito atual: a próxima matéria de estudo será a primeira matéria do circuito selecionado.')){undoable('Histórico apagado',()=>{records=[];currentIndex=0;saveSubjects();save()})}};// Flashcards
const FCKEY='circuitoLoop.flashcards.v1';let flashcards=[];let fcStats={again:0,hard:0,easy:0};let fcSavedNote='',fcRecorded=false,fcTimeAcc=0,fcTimeStart=0;
function fcTimerReset(){fcTimeAcc=0;fcTimeStart=document.hidden?0:Date.now()}
function fcElapsed(){return Math.max(0,Math.round((fcTimeAcc+(fcTimeStart?Date.now()-fcTimeStart:0))/1000))}
document.addEventListener('visibilitychange',()=>{if(fcReviewDone||!fcActiveSubject)return;if(document.hidden){if(fcTimeStart){fcTimeAcc+=Date.now()-fcTimeStart;fcTimeStart=0}}else if(!fcTimeStart)fcTimeStart=Date.now()});
function fcResultHtml(){const a=fcStats.again,h=fcStats.hard,e=fcStats.easy,n=a+h+e,total=fcQueue.length,pa=n?Math.round(a/n*100):0,ph=n?Math.round(h/n*100):0,pe=n?100-pa-ph:0;
const row=(c,l,k,p)=>'<div style="display:flex;justify-content:space-between"><span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:'+c+';margin-right:8px"></span>'+l+'</span><strong>'+k+' ('+p+'%)</strong></div>';
const bg=n?'conic-gradient(#B60020 0% '+pa+'%, #D98E04 '+pa+'% '+(pa+ph)+'%, #009B00 '+(pa+ph)+'% 100%)':'#e5e7eb';
return '<h3 style="margin:0 0 16px">Resultado</h3><div style="display:flex;flex-direction:column;align-items:center;gap:16px"><div role="img" aria-label="Gráfico de cartões resolvidos ('+n+' de '+total+'): '+pa+'% difícil, '+ph+'% médio, '+pe+'% fácil" style="width:190px;height:190px;border-radius:50%;position:relative;background:'+bg+'"><div style="position:absolute;inset:42px;border-radius:50%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1"><b style="font-size:26px">'+n+'</b><span style="font-size:12px;color:#64748b">resolvido'+(n===1?'':'s')+'</span></div></div><div style="display:grid;gap:8px;width:100%;max-width:280px"><div style="display:flex;justify-content:space-between;padding-bottom:8px;border-bottom:1px solid #e5e7eb"><span>Cartões resolvidos</span><strong>'+n+' de '+total+'</strong></div>'+row('#B60020','Difícil',a,pa)+row('#D98E04','Médio',h,ph)+row('#009B00','Fácil',e,pe)+(fcPendSaved?'<div style="display:flex;justify-content:space-between;color:#64748b"><span>Virado sem nível escolhido</span><strong>'+fcPendSaved+'</strong></div>':'')+'</div>'+(fcSavedNote?'<p class="note" style="text-align:center;margin:6px 0 0">'+fcSavedNote+'</p>':'')+'</div>'}
let fcPendSaved=0;
function fcRecordSession(pend){if(fcRecorded)return;fcRecorded=true;fcSavedNote='';fcPendSaved=pend||0;const a=fcStats.again,h=fcStats.hard,e=fcStats.easy,n=a+h+e+fcPendSaved;if(!n)return;const sec=fcElapsed();fcTimeAcc=sec*1000;fcTimeStart=0;
records.unshift({date:new Date().toISOString(),subject:ceCanonSubject(fcActiveSubject),sec,q:0,c:0,source:'flashcards',notes:'Flashcards: '+n+' '+(n===1?'cartão virado':'cartões virados')+' — Difícil: '+a+' · Médio: '+h+' · Fácil: '+e+(fcPendSaved?' · Sem nível: '+fcPendSaved:'')+(fcCatName?' · Categoria: '+fcCatName:'')});save();
fcSavedNote='Estudo registrado no Histórico ('+n+' de '+fcQueue.length+' '+(fcQueue.length===1?'cartão':'cartões')+', tempo '+fmt(sec)+').'}
function fcFinishEarly(){if(fcReviewDone)return;const g=fcStats.again+fcStats.hard+fcStats.easy,pend=fcRevealed?1:0,n=g+pend;
if(!n){$('fcStudyClose').click();return}   /* nenhum cartão virado: nada é registrado */
if(!confirm('Encerrar o estudo agora?\n\n• '+n+' de '+fcQueue.length+' cartões virados (Difícil: '+fcStats.again+', Médio: '+fcStats.hard+', Fácil: '+fcStats.easy+(pend?', 1 sem nível escolhido':'')+')\n• O estudo será registrado no Histórico'))return;
fcReviewDone=true;fcRecordSession(pend);fcRevealed=false;fcRender()}
let fcIndex=0,fcRevealed=false,fcEditId=null,fcActiveSubject="",fcQueue=[],fcReviewDone=false;
try{flashcards=JSON.parse(localStorage.getItem(FCKEY)||'[]');if(!Array.isArray(flashcards))flashcards=[]}catch(e){flashcards=[]}
const fcSave=()=>{localStorage.setItem(FCKEY,JSON.stringify(flashcards));fcRender()};
const fcEsc=x=>String(x??'');
const APP_PAGE_KEY='circuitoLoop.activePage.v1';
function showAppPage(page){if(!['study','flash','errors','dashboard'].includes(page))page='study';try{localStorage.setItem(APP_PAGE_KEY,page)}catch(e){}document.querySelectorAll('main>section.card').forEach(el=>{if(el.id==='flashPage')el.hidden=page!=='flash';else if(el.id==='errorsPage')el.hidden=page!=='errors';else if(el.id==='dashboardPage')el.hidden=page!=='dashboard';else el.hidden=page!=='study'});$('studyTab').className=page==='study'?'':'alt';$('flashTab').className=page==='flash'?'':'alt';$('errorsTab').className=page==='errors'?'':'alt';$('dashboardTab').className=page==='dashboard'?'':'alt';$('appTitle').textContent=page==='flash'?'🃏 Flashcards':page==='errors'?'📕 Caderno de Erradas':page==='dashboard'?'📊 Painel de desempenho':'📚 Circuito Loop';if(page==='flash')fcRender();if(page==='dashboard')renderDashboard()}
function fcShowPage(show){showAppPage(show?'flash':'study')}
$('studyTab').onclick=()=>showAppPage('study');$('flashTab').onclick=()=>showAppPage('flash');$('errorsTab').onclick=()=>showAppPage('errors');$('dashboardTab').onclick=()=>showAppPage('dashboard');
// Restaura a última página após recarga (inclusive o gesto de atualizar do navegador/celular).
let savedAppPage='study';try{savedAppPage=localStorage.getItem(APP_PAGE_KEY)||'study'}catch(e){}showAppPage(savedAppPage);

function renderDashboard(){
  const safeRead=(key)=>{try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:[]}catch(e){return []}};
  const sessions=safeRead('circuitoLoop.v1'),cards=safeRead('circuitoLoop.flashcards.v1'),questions=safeRead('circuitoLoop.cadernoErradas.v1');
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
  const totalSec=sessions.reduce((a,r)=>a+Math.max(0,num(r.sec)),0);
  const totalQ=sessions.reduce((a,r)=>a+Math.max(0,num(r.q)),0);
  const totalC=sessions.reduce((a,r)=>a+Math.max(0,num(r.c)),0);
  const pct=totalQ?Math.round(totalC/totalQ*100):0;
  const duration=sec=>{sec=Math.max(0,Math.floor(sec));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60);return h?`${h}h ${m}min`:`${m} min`};
  const box=(value,label)=>`<div class="stat"><b>${value}</b><span>${label}</span></div>`;
  $('dashboardSummary').innerHTML=box(sessions.length,'Sessões registradas')+box(duration(totalSec),'Tempo total estudado')+box(totalQ.toLocaleString('pt-BR'),'Questões respondidas')+box(totalQ?pct+'%':'—','Aproveitamento geral');

  // Dias consecutivos: considera dias locais com ao menos uma sessão salva.
  const dayKey=date=>{const d=new Date(date);if(Number.isNaN(d.getTime()))return '';return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const studiedDays=[...new Set(sessions.map(r=>dayKey(r.date)).filter(Boolean))].sort();
  const dayOrdinal=key=>{const [y,m,d]=key.split('-').map(Number);return Math.floor(Date.UTC(y,m-1,d)/86400000)};
  let recordStreak=0,run=0,previous=null;
  studiedDays.forEach(key=>{const ordinal=dayOrdinal(key);run=previous!==null&&ordinal===previous+1?run+1:1;recordStreak=Math.max(recordStreak,run);previous=ordinal});
  const todayKey=dayKey(new Date()),todayOrdinal=dayOrdinal(todayKey);
  const lastOrdinal=studiedDays.length?dayOrdinal(studiedDays[studiedDays.length-1]):null;
  let currentStreak=0;
  if(lastOrdinal!==null&&(lastOrdinal===todayOrdinal||lastOrdinal===todayOrdinal-1)){
    currentStreak=1;let cursor=lastOrdinal;
    for(let i=studiedDays.length-2;i>=0;i--){const ordinal=dayOrdinal(studiedDays[i]);if(ordinal===cursor-1){currentStreak++;cursor=ordinal}else if(ordinal<cursor-1)break}
  }
  const streakEmoji=currentStreak<=5?'🥶':currentStreak<=10?'🤓':currentStreak<=15?'🥵':'🔥';
  $('dashboardStreakIcon').textContent=streakEmoji;
  $('dashboardStreakDays').textContent=currentStreak;$('dashboardStreakUnit').textContent=currentStreak===1?'dia':'dias';
  $('dashboardStreakRecord').innerHTML=`Recorde: <strong>${recordStreak} ${recordStreak===1?'dia':'dias'}</strong>`;
  const studiedToday=lastOrdinal===todayOrdinal;
  $('dashboardStreakHint').textContent=currentStreak===0?'O streak foi interrompido. Estude hoje para começar um novo.':studiedToday?'Você já estudou hoje. Continue assim!':'Estude hoje para manter sua sequência.';
  const nextEl=$('dashboardStreakNext');
  if(currentStreak>=16)nextEl.textContent='🔥 Você alcançou o nível máximo!';
  else {const nextLevel=currentStreak<6?6:currentStreak<11?11:16;const remaining=Math.max(0,nextLevel-currentStreak);nextEl.textContent=`Desbloqueie o próximo nível em: ${remaining} ${remaining===1?'dia':'dias'}.`;}

  // Meta semanal: semana civil de domingo a sábado (datas locais).
  const weeklyGoalKey='circuitoLoop.weeklyGoalHours.v1';
  let weeklyGoal=0;try{weeklyGoal=Math.max(0,Math.min(168,Number(localStorage.getItem(weeklyGoalKey))||0))}catch(e){}
  const goalInput=$('dashboardGoalHours'),goalSave=$('dashboardGoalSave'),goalStatus=$('dashboardGoalSaveStatus');
  const weekStart=new Date();weekStart.setHours(0,0,0,0);weekStart.setDate(weekStart.getDate()-weekStart.getDay());
  const weekEnd=new Date(weekStart);weekEnd.setDate(weekStart.getDate()+6);weekEnd.setHours(23,59,59,999);
  const dateLabel=d=>d.toLocaleDateString('pt-BR');
  $('dashboardGoalWeekRange').textContent=`Semana contabilizada: ${dateLabel(weekStart)} a ${dateLabel(weekEnd)}`;
  const weeklySec=sessions.reduce((sum,r)=>{const d=new Date(r.date);return sum+(!Number.isNaN(d.getTime())&&d>=weekStart&&d<=weekEnd?Math.max(0,num(r.sec)):0)},0);
  const weeklyHours=weeklySec/3600;
  if(goalInput){goalInput.value=weeklyGoal||'';goalInput.oninput=()=>{if(goalStatus)goalStatus.textContent='Alteração não salva';};}
  if(goalSave&&goalInput){goalSave.onclick=()=>{const raw=goalInput.value.trim();const value=raw===''?0:Math.max(0,Math.min(168,Number(raw)||0));weeklyGoal=value;goalInput.value=value||'';try{localStorage.setItem(weeklyGoalKey,String(value));if(goalStatus)goalStatus.textContent='Meta salva. Será compartilhada na próxima sincronização com o GitHub.';}catch(e){if(goalStatus)goalStatus.textContent='Não foi possível salvar a meta.';}updateWeeklyGoal();};}
  function updateWeeklyGoal(){
    const done=$('dashboardGoalDone'),pctEl=$('dashboardGoalPct'),fill=$('dashboardGoalFill'),hint=$('dashboardGoalHint');
    done.textContent=(weeklyHours>=10?Math.round(weeklyHours):weeklyHours.toFixed(1).replace('.',','))+'h';
    if(!weeklyGoal){pctEl.textContent='—';fill.className='goal-fill empty';fill.style.width='0%';hint.textContent='Defina uma meta para acompanhar sua semana (domingo a sábado).';return}
    const percent=Math.min(100,Math.round(weeklyHours/weeklyGoal*100));pctEl.textContent=percent+'%';fill.className='goal-fill '+(percent<50?'low':percent<100?'mid':'high');fill.style.width=percent+'%';
    const remaining=Math.max(0,weeklyGoal-weeklyHours);hint.textContent=remaining>0?`Faltam ${remaining.toFixed(1).replace('.',',')}h para bater a meta desta semana.`:`Meta batida! 🎉 Você estudou ${weeklyHours.toFixed(1).replace('.',',')}h nesta semana.`;
  }
  updateWeeklyGoal();
  // Ao abrir a semana seguinte, registra no Histórico o resumo da semana encerrada (uma única vez).
  const completedEnd=new Date(weekStart);completedEnd.setMilliseconds(-1);
  const prevStart=new Date(weekStart);prevStart.setDate(prevStart.getDate()-7);
  const prevRows=sessions.filter(r=>{const d=new Date(r.date);return !Number.isNaN(d.getTime())&&d>=prevStart&&d<=completedEnd});
  const weekTag=`[resumo-semanal:${prevStart.getFullYear()}-${String(prevStart.getMonth()+1).padStart(2,'0')}-${String(prevStart.getDate()).padStart(2,'0')}]`;
  if(prevRows.length&&!sessions.some(r=>String(r.notes||'').includes(weekTag))){
    const sec=prevRows.reduce((a,r)=>a+Math.max(0,num(r.sec)),0),q=prevRows.reduce((a,r)=>a+Math.max(0,num(r.q)),0),c=prevRows.reduce((a,r)=>a+Math.max(0,num(r.c)),0);
    const startTxt=dateLabel(prevStart),endTxt=dateLabel(completedEnd);
    records.unshift({date:completedEnd.toISOString(),subject:'Resumo semanal',sec,q,c,notes:`Resumo da semana ${startTxt} a ${endTxt}: ${prevRows.length} sessões, ${q} questões, ${c} acertos e ${(sec/3600).toFixed(1).replace('.',',')} horas estudadas. ${weeklyGoal?`Meta configurada: ${weeklyGoal}h.`:''} ${weekTag}`});
    localStorage.setItem('circuitoLoop.v1',JSON.stringify(records));
  }
  const today=new Date();today.setHours(0,0,0,0);
  const days=Array.from({length:7},(_,i)=>{const d=new Date(today);d.setDate(today.getDate()-(6-i));return d});
  const daily=days.map(d=>{const key=d.toDateString();const rows=sessions.filter(r=>{const x=new Date(r.date);return !isNaN(x)&&x.toDateString()===key});return {d,q:rows.reduce((a,r)=>a+num(r.q),0),sec:rows.reduce((a,r)=>a+num(r.sec),0)}});
  const maxQ=Math.max(1,...daily.map(x=>x.q));
  $('dashboardDaily').innerHTML=daily.map(x=>`<div class="daily-bar"><b class="daily-value">${x.q}</b><div class="daily-track">${x.q?`<div class="daily-fill" style="height:${Math.max(5,Math.round(x.q/maxQ*100))}%"></div>`:''}</div><span class="daily-label">${x.d.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','')}</span></div>`).join('')+`<div class="daily-total note">Total: ${daily.reduce((a,x)=>a+x.q,0)} questões · ${duration(daily.reduce((a,x)=>a+x.sec,0))}</div>`;
  const bySubject=new Map();
  sessions.forEach(r=>{const name=String(r.subject||'Sem matéria');const v=bySubject.get(name)||{q:0,c:0,sec:0};v.q+=num(r.q);v.c+=num(r.c);v.sec+=num(r.sec);bySubject.set(name,v)});
  const subjectRows=[...bySubject.entries()].sort((a,b)=>b[1].q-a[1].q).slice(0,8);
  const maxSubject=Math.max(1,...subjectRows.map(x=>x[1].q));
  $('dashboardSubjects').innerHTML=subjectRows.length?subjectRows.map(([name,v])=>`<div><div class="subject-line"><strong>${name.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}</strong><span>${v.q} questões · ${v.q?Math.round(v.c/v.q*100):0}% acertos</span></div><div class="subject-track"><div class="subject-fill" style="width:${Math.round(v.q/maxSubject*100)}%"></div></div></div>`).join(''):'<span class="muted">Ainda não há sessões registradas.</span>';
  const cardSubjects=new Set(cards.map(x=>String(x.subject||'').trim()).filter(Boolean)).size;
  const questionSubjects=new Set(questions.map(x=>String(x.subject||'').trim()).filter(Boolean)).size;
  $('dashboardMaterials').innerHTML=`<div class="dashboard-metric"><strong>${cards.length}</strong><span>Flashcards · ${cardSubjects} matérias</span></div><div class="dashboard-metric"><strong>${questions.length}</strong><span>Questões no Caderno de Erradas · ${questionSubjects} matérias</span></div><div class="dashboard-metric"><strong>${bySubject.size}</strong><span>Matérias com sessões registradas</span></div>`;
  const avgSec=sessions.length?Math.round(totalSec/sessions.length):0;
  const last=sessions.map(r=>new Date(r.date)).filter(d=>!isNaN(d)).sort((a,b)=>b-a)[0];
  $('dashboardInsights').innerHTML=`<div class="dashboard-metric"><strong>${totalQ-totalC}</strong><span>Respostas incorretas</span></div><div class="dashboard-metric"><strong>${duration(avgSec)}</strong><span>Tempo médio por sessão</span></div><div class="dashboard-metric"><strong>${last?last.toLocaleDateString('pt-BR'):'—'}</strong><span>Último registro</span></div>`;

  // Caderno de Erradas: métricas por questão, alimentadas a cada resposta a partir desta versão.
  const attempted=questions.filter(q=>num(q.attempts)>0);
  const repeated=questions.filter(q=>num(q.wrongAttempts)>=2);
  const errAttempts=attempted.reduce((s,q)=>s+num(q.attempts),0);
  const errCorrect=attempted.reduce((s,q)=>s+num(q.correctAttempts),0);
  const errPct=errAttempts?Math.round(errCorrect/errAttempts*100):0;
  $('dashboardErrorsSummary').innerHTML=
    `<div class="dashboard-metric"><strong>${questions.length}</strong><span>Questões cadastradas</span></div>`+
    `<div class="dashboard-metric"><strong>${attempted.length}</strong><span>Questões já respondidas</span></div>`+
    `<div class="dashboard-metric"><strong>${repeated.length}</strong><span>Questões erradas 2 vezes ou mais</span></div>`+
    `<div class="dashboard-metric"><strong>${errAttempts?errPct+'%':'—'}</strong><span>Aproveitamento nas tentativas registradas</span></div>`;
  const errBySubject=new Map();
  questions.forEach(q=>{const name=String(q.subject||'Matéria sem nome');const v=errBySubject.get(name)||{attempts:0,correct:0,wrong:0,questions:0,repeated:0};v.questions++;v.attempts+=num(q.attempts);v.correct+=num(q.correctAttempts);v.wrong+=num(q.wrongAttempts);if(num(q.wrongAttempts)>=2)v.repeated++;errBySubject.set(name,v)});
  const classify=p=>p<=75?'low':p<90?'mid':'high';
  const renderErrorSubjects=()=>{
    const filter=$('dashboardErrorsFilter').value;
    const rows=[...errBySubject.entries()].map(([name,v])=>({name,...v,pct:v.attempts?Math.round(v.correct/v.attempts*100):null})).filter(v=>filter==='all'||(filter==='none'&&v.pct===null)||(filter!=='none'&&v.pct!==null&&classify(v.pct)===filter)).sort((a,b)=>(b.attempts-a.attempts)||a.name.localeCompare(b.name,'pt-BR'));
    $('dashboardErrorsSubjects').innerHTML=rows.length?rows.map(v=>{const cls=v.pct===null?'none':classify(v.pct);const label=v.pct===null?'Sem tentativas':v.pct+'%';return `<div><div class="dashboard-filter-row"><strong>${String(v.name).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}</strong><span class="performance-pill ${cls}">${label}</span></div><div class="dashboard-filter-row" style="margin-top:3px;color:#64748b"><span>${v.questions} questões · ${v.attempts} tentativas · ${v.repeated} reincidentes</span><span>${v.wrong} erros</span></div>${v.pct!==null?`<div class="dashboard-filter-track"><div class="dashboard-filter-fill ${cls}" style="width:${v.pct}%"></div></div>`:''}</div>`}).join(''):'<p class="muted" style="margin:0">Nenhuma matéria corresponde a esse filtro.</p>';
  };
  $('dashboardErrorsFilter').onchange=renderErrorSubjects;renderErrorSubjects();

  // Flashcards: o campo due/stage já é atualizado pelo fluxo de revisão do aplicativo.
  const now=Date.now(),dueCards=cards.filter(c=>num(c.due)>0&&num(c.due)<=now),neverReviewed=cards.filter(c=>!num(c.due)),scheduled=cards.filter(c=>num(c.due)>now);
  const flashSessions=sessions.filter(r=>r.source==='flashcards').sort((a,b)=>new Date(b.date)-new Date(a.date));
  const flash7=flashSessions.filter(r=>{const d=new Date(r.date);return !isNaN(d)&&now-d.getTime()<=7*86400000}).length;
  $('dashboardFlashSummary').innerHTML=
    `<div class="dashboard-metric"><strong>${cards.length}</strong><span>Cartões cadastrados</span></div>`+
    `<div class="dashboard-metric"><strong style="color:#b42332">${dueCards.length}</strong><span>Precisam ser revisados</span></div>`+
    `<div class="dashboard-metric"><strong>${neverReviewed.length}</strong><span>Ainda não revisados</span></div>`+
    `<div class="dashboard-metric"><strong>${scheduled.length}</strong><span>Com revisão agendada</span></div>`+
    `<div class="dashboard-metric"><strong>${flash7}</strong><span>Sessões de revisão nos últimos 7 dias</span></div>`;
  $('dashboardFlashHistory').innerHTML=flashSessions.length?flashSessions.slice(0,6).map(r=>{const d=new Date(r.date);return `<div class="dashboard-history-item"><strong style="color:#344b68">${d.toLocaleDateString('pt-BR')} · ${String(r.subject||'Flashcards')}</strong><br>${String(r.notes||'Revisão registrada')} · ${duration(num(r.sec))}</div>`}).join(''):'<p class="muted" style="margin:0">Ainda não há revisões registradas no Histórico.</p>';
}
$('dashboardRefresh')?.addEventListener('click',renderDashboard);
function fcFiltered(){const term=$('fcSearch').value.trim().toLocaleLowerCase('pt-BR');return flashcards.filter(c=>(!fcActiveSubject||fcActiveSubject===FC_ALL||c.subject===fcActiveSubject)&&fcCatMatch(c)&&(!term||(c.question+' '+c.answer+' '+c.subject).toLocaleLowerCase('pt-BR').includes(term))).sort((a,b)=>(a.due||0)-(b.due||0))}
const FC_ALL='Todas as matérias';
let fcActiveCategory='',fcCatName='';const FC_NONE='__sem_categoria__';
function cardCatKey(c){const t=c&&String(c.category||'').trim();return t?cardSubjectKey(t):''}
function fcInScope(c){return !fcActiveSubject||fcActiveSubject===FC_ALL||c.subject===fcActiveSubject}
function fcCatMatch(c){if(!fcActiveCategory)return true;const k=cardCatKey(c);return fcActiveCategory===FC_NONE?!k:k===fcActiveCategory}
function fcHeading(){$('fcStudyHeading').textContent='Revisar: '+fcActiveSubject+(fcCatName?' — '+fcCatName:'')}
function fcCatRefresh(){
 const row=$('fcCatRow'),sel=$('fcCategory');if(!row||!sel)return;
 const scope=fcActiveSubject&&fcActiveSubject!==FC_ALL?flashcards.filter(fcInScope):[],cats=new Map();let none=0;
 scope.forEach(c=>{const k=cardCatKey(c);if(!k){none++;return}const o=cats.get(k)||{name:String(c.category).trim(),n:0};o.n++;cats.set(k,o)});
 if(!cats.size){row.hidden=true;fcActiveCategory='';fcCatName='';sel.innerHTML='';return}
 if(fcActiveCategory===FC_NONE&&!none)fcActiveCategory='';
 if(fcActiveCategory&&fcActiveCategory!==FC_NONE&&!cats.has(fcActiveCategory))fcActiveCategory='';
 fcCatName=!fcActiveCategory?'':fcActiveCategory===FC_NONE?'Sem categoria':cats.get(fcActiveCategory).name;
 const opts=[['','Todas as categorias ('+scope.length+')'],...[...cats.entries()].sort((a,b)=>a[1].name.localeCompare(b[1].name,'pt-BR',{numeric:true})).map(([k,o])=>[k,o.name+' ('+o.n+')'])];
 if(none)opts.push([FC_NONE,'Sem categoria ('+none+')']);
 sel.innerHTML='';opts.forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;sel.appendChild(o)});sel.value=fcActiveCategory;row.hidden=false;
}
function fcTag(c){const parts=[];if(fcActiveSubject===FC_ALL)parts.push(String(c.subject||'').trim());const cat=String(c.category||'').trim();if(cat&&(!fcActiveCategory||fcActiveCategory===FC_NONE))parts.push(cat);return parts.length?'<div class="fc-face-tag">'+parts.map(richEsc).join(' › ')+'</div>':''}
function fcCatOptions(){const dl=$('fcCategoryOptions');if(!dl)return;const k=cardSubjectKey($('fcSubject').value),seen=new Map();flashcards.forEach(c=>{const ck=cardCatKey(c);if(ck&&cardSubjectKey(c.subject)===k&&!seen.has(ck))seen.set(ck,String(c.category).trim())});dl.innerHTML='';[...seen.values()].sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true})).forEach(n=>{const o=document.createElement('option');o.value=n;dl.appendChild(o)})}
function fcInterleave(ids){const by=new Map();ids.forEach(id=>{const c=flashcards.find(x=>x.id===id);if(!c)return;const k=cardSubjectKey(c.subject);if(!by.has(k))by.set(k,[]);by.get(k).push(id)});const rnd=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};by.forEach(rnd);const out=[];let last=null,left=ids.length;while(left>0){const cand=[...by.entries()].filter(([k,a])=>a.length&&k!==last);let pick;if(!cand.length){pick=[...by.entries()].find(([k,a])=>a.length)}else{const forced=cand.filter(([k,a])=>a.length*2-1>=left).sort((x,y)=>y[1].length-x[1].length)[0];if(forced)pick=forced;else{let r=Math.random()*cand.reduce((n,[k,a])=>n+a.length,0);pick=cand.find(([k,a])=>(r-=a.length)<0)||cand[cand.length-1]}}out.push(pick[1].pop());last=pick[0];left--}return out}
function fcPaintReview(c){const box=$('fcReview');if(fcReviewDone){box.innerHTML=fcResultHtml();return}if(!c){box.innerHTML='<p class="muted">Nenhum cartão encontrado.</p>';return}const key=c.id+'|'+fcIndex+'|'+String(c.question).length+':'+String(c.answer).length,cur=box.querySelector('.fc-flip');if(cur&&cur.dataset.key===key){cur.querySelector('.fc-flip-inner').classList.toggle('is-flipped',fcRevealed);cur.querySelector('.fc-flip-front').setAttribute('aria-hidden',String(fcRevealed));cur.querySelector('.fc-flip-back').setAttribute('aria-hidden',String(!fcRevealed));return}box.innerHTML='<div class="fc-flip" data-key="'+key.replace(/"/g,'&quot;')+'"><div class="fc-flip-inner'+(fcRevealed?' is-flipped':'')+'"><div class="fc-flip-face fc-flip-front fc-face" aria-hidden="'+fcRevealed+'">'+fcTag(c)+richHtml(c.question)+'</div><div class="fc-flip-face fc-flip-back fc-answer" aria-hidden="'+!fcRevealed+'">'+richHtml(c.answer)+'</div></div></div>'}
function fcRender(){const catalog=$('fcCatalogGrid');catalog.innerHTML='';const groupedMap=new Map();flashcards.forEach(c=>{const name=String(c.subject||'Matéria sem nome').trim()||'Matéria sem nome',key=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');if(key===cardSubjectKey(FC_ALL))return;if(!groupedMap.has(key))groupedMap.set(key,{name,count:0,cats:new Set()});const g=groupedMap.get(key);g.count++;if(cardCatKey(c))g.cats.add(cardCatKey(c))});const groupedSubjects=[...groupedMap.values()];if(flashcards.length)groupedSubjects.push({name:FC_ALL,count:flashcards.length,all:true});const gridStyle=getComputedStyle(catalog);const columns=Math.max(1,gridStyle.gridTemplateColumns.split(/\s+/).filter(Boolean).length);const tileCount=Math.max(columns,Math.ceil(groupedSubjects.length/columns)*columns);for(let i=0;i<tileCount;i++){const group=groupedSubjects[i];const tile=document.createElement('div');tile.className='fc-catalog-tile'+(group?' is-filled':'')+(group&&group.all?' is-all':'');tile.tabIndex=group?0:-1;if(group){tile.setAttribute('role','button');tile.setAttribute('aria-label','Estudar '+group.name);tile.addEventListener('click',()=>fcOpenStudy(group.name));tile.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fcOpenStudy(group.name)}});const name=document.createElement('strong');name.textContent=group.name;const count=document.createElement('span');count.className='fc-tile-count';count.textContent=group.all?String(group.count).padStart(2,'0')+' flashcard'+(group.count===1?'':'s')+' · revisão geral':String(group.count).padStart(2,'0')+' flashcard'+(group.count===1?' cadastrado':'s cadastrados')+(group.cats&&group.cats.size?' · '+group.cats.size+(group.cats.size===1?' categoria':' categorias'):'');tile.append(name,count);tile.title=group.name+' — '+count.textContent}else tile.textContent='Vazio';catalog.appendChild(tile)}$('fcWorkspace').hidden=flashcards.length===0||$('fcWorkspace').parentElement!==$('fcStudyMount');fcCatRefresh();const list=fcFiltered();if(!fcActiveSubject){fcIndex=Math.min(fcIndex,Math.max(0,list.length-1))}const c=fcActiveSubject&&fcQueue.length&&!fcReviewDone?flashcards.find(card=>card.id===fcQueue[fcIndex]):null;$('fcCount').textContent='';$('fcDue').textContent='';fcPaintReview(c);$('fcFinish').hidden=fcReviewDone;$('fcReveal').style.flex=fcReviewDone?'0 0 33.333%':'2 1 0';$('fcReveal').style.minWidth='0';$('fcReveal').textContent=fcReviewDone?'Fechar resultado':'Virar o cartão';$('fcReveal').hidden=!fcReviewDone&&fcRevealed;$('fcReveal').disabled=!fcReviewDone&&(!c||fcRevealed);$('fcPrev').hidden=true;$('fcNext').hidden=true;$('fcPrev').disabled=true;$('fcNext').disabled=true;$('fcGradeRow').hidden=fcReviewDone||!c||!fcRevealed;$('fcRestart').hidden=true;['fcAgain','fcHard','fcEasy'].forEach(id=>$(id).disabled=!c||!fcRevealed||fcReviewDone);$('fcList').innerHTML='';list.forEach(card=>{const el=document.createElement('div');el.className='fc-card';const line=document.createElement('div');line.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap';const info=document.createElement('div');info.style.cssText='min-width:0;flex:1 1 220px';const title=document.createElement('strong');title.textContent=card.subject+' — '+richPlain(card.question);info.appendChild(title);const meta=document.createElement('p');meta.className='note';meta.style.margin='5px 0 0';meta.textContent=(card.category?'Categoria: '+card.category+' · ':'')+'Próxima revisão: '+(card.due?new Date(card.due).toLocaleString('pt-BR'):'agora');info.appendChild(meta);line.appendChild(info);const actions=document.createElement('div');actions.style.cssText='display:flex;gap:6px;flex:0 0 auto';[['Editar',()=>fcEdit(card.id)],['Excluir',()=>{if(confirm('Excluir este cartão?')){undoable('Cartão excluído',()=>{flashcards=flashcards.filter(x=>x.id!==card.id);fcSave()})}}]].forEach(([label,fn])=>{const b=document.createElement('button');b.className='alt';b.textContent=label;b.onclick=fn;actions.appendChild(b)});line.appendChild(actions);el.appendChild(line);$('fcList').appendChild(el)})}
function fcOpenStudy(subjectName){fcStats={again:0,hard:0,easy:0};fcRecorded=false;fcSavedNote='';fcPendSaved=0;fcTimerReset();fcActiveSubject=subjectName;fcActiveCategory='';fcCatRefresh();fcHeading();$('fcSearch').value='';fcIndex=0;fcRevealed=false;fcReviewDone=false;fcQueue=fcFiltered().map(c=>c.id);if(subjectName===FC_ALL)fcQueue=fcInterleave(fcQueue);$('fcWorkspace').hidden=false;$('fcStudyMount').appendChild($('fcWorkspace'));$('fcStudyModal').hidden=false;fcRender()}
$('toggleFcRules').onclick=()=>{const body=$('fcRulesBody'),hide=!body.hidden;body.hidden=hide;$('toggleFcRules').textContent=hide?'Maximizar':'Minimizar';$('toggleFcRules').setAttribute('aria-expanded',String(!hide))};
$('fcStudyClose').onclick=()=>{$('fcStudyModal').hidden=true;fcActiveSubject='';fcActiveCategory='';fcCatName='';$('fcCatRow').hidden=true;fcQueue=[];fcIndex=0;fcRevealed=false;fcReviewDone=false;$('flashPage').appendChild($('fcWorkspace'));fcRender()};

const CEKEY='circuitoLoop.cadernoErradas.v1';const CE_ALL='__SIMULADAO__';const CE_EXCEPT='__TODAS_MENOS__';let ceExcludedSubjects=[];let cadernoErradas=[];try{cadernoErradas=JSON.parse(localStorage.getItem(CEKEY)||'[]')}catch(e){}if(!Array.isArray(cadernoErradas))cadernoErradas=[];let ceEditId=null;let ceActiveSubject='';let ceQueue=[];let ceIndex=0;let ceRevealed=false;let ceOptionOrder=[];let ceSelectedAnswer='';let ceCorrectCount=0;let ceWrongCount=0;let ceAnsweredCount=0;let ceShowingResult=false;function ceSave(){localStorage.setItem(CEKEY,JSON.stringify(cadernoErradas));ceRender();if(ceActiveSubject&&!$('ceWorkspace').hidden)ceRenderReview()}function ceSubjectNames(){return [...new Set([...subjects,...cadernoErradas.map(c=>c.subject)].map(x=>String(x||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base',numeric:true}))}function ceSubjectMenu(open=true,filterText=null){const menu=$('ceSubjectOptions'),input=$('ceSubject'),term=(filterText===null?input.value:filterText).trim().toLocaleLowerCase('pt-BR');menu.innerHTML='';const matches=ceSubjectNames().filter(name=>name.toLocaleLowerCase('pt-BR').includes(term));if(matches.length){matches.forEach(name=>{const option=document.createElement('button');option.type='button';option.className='fc-subject-option';option.setAttribute('role','option');option.textContent=name;option.addEventListener('pointerdown',e=>e.preventDefault());option.onclick=()=>{input.value=name;ceSubjectMenu(false);input.focus()};menu.appendChild(option)})}else{const empty=document.createElement('div');empty.className='fc-subject-empty';empty.textContent=term?'Nenhuma matéria encontrada. Você pode usar o texto digitado.':'Nenhuma matéria cadastrada ainda. Digite para criar uma.';menu.appendChild(empty)}menu.hidden=!open;input.setAttribute('aria-expanded',String(open));$('ceSubjectToggle').setAttribute('aria-expanded',String(open))}/* ---------- Texto formatado: **negrito**  *itálico*  __sublinhado__ ---------- */
function richEsc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function richHtml(text){
 const re=/\\([*_\\])|\*\*\*(\S(?:[\s\S]*?\S)?)\*\*\*|\*\*(\S(?:[\s\S]*?\S)?)\*\*|__(\S(?:[\s\S]*?\S)?)__|~~(\S(?:[\s\S]*?\S)?)~~|\*(\S(?:[^*\n]*?\S)?)\*/g;
 let t=String(text==null?'':text);
 // Asteriscos precedidos por barra invertida são literais, não delimitadores de itálico/negrito.
 const literalStar='\uE000';
 t=t.replace(/\\\*/g,literalStar);
 // Tags HTML simples aceitas nos CSVs são convertidas para a marcação já suportada.
 t=t.replace(/<(\/?)\s*(b|strong|i|em|u|s|del)\s*>/gi,(tag,close,name)=>{
   const n=name.toLowerCase(),mark=(n==='b'||n==='strong')?'**':(n==='i'||n==='em')?'*':(n==='s'||n==='del')?'~~':'__';
   return close?mark:mark;
 });
 let out='',last=0,m;
 while((m=re.exec(t))){
  out+=richEsc(t.slice(last,m.index));
  if(m[1]!==undefined)out+=richEsc(m[1]);
  else if(m[2]!==undefined)out+='<b><i>'+richHtml(m[2])+'</i></b>';
  else if(m[3]!==undefined)out+='<b>'+richHtml(m[3])+'</b>';
  else if(m[4]!==undefined)out+='<u>'+richHtml(m[4])+'</u>';
  else if(m[5]!==undefined)out+='<s>'+richHtml(m[5])+'</s>';
  else out+='<i>'+richHtml(m[6])+'</i>';
  last=re.lastIndex;
 }
 return (out+richEsc(t.slice(last))).replace(/\n/g,'<br>').replaceAll(literalStar,'*');
}
function richPlain(text){const d=document.createElement('div');d.innerHTML=richHtml(text).replace(/<br>/g,' ');return d.textContent}
const richUndoState=new WeakMap();
let richActivePreview='';
function richState(ta){let st=richUndoState.get(ta);if(!st){st={last:ta.value,stack:[]};richUndoState.set(ta,st)}return st}
function richCommit(ta,before){
 const st=richState(ta);
 if(before!==ta.value){st.stack.push(before);if(st.stack.length>100)st.stack.shift()}
 st.last=ta.value;
}
function richToggle(ta,mark){
 if(!ta)return;
 const before=ta.value;
 let s=ta.selectionStart,e=ta.selectionEnd,v=before;const ch=mark[0],L=mark.length;
 const run=(from,dir)=>{let n=0;while((dir<0?v[from-1-n]:v[from+n])===ch)n++;return n};
 if(s===e){v=v.slice(0,s)+mark+mark+v.slice(e);s=e=s+L}
 else{
  const m=Math.min(run(s,-1),run(e,1)),present=L===2?m>=2:m%2===1;
  const sel=v.slice(s,e);
  if(present){v=v.slice(0,s-L)+sel+v.slice(e+L);s-=L;e-=L}
  else{
   const lead=sel.match(/^\s*/)[0],trail=sel.match(/\s*$/)[0],core=sel.slice(lead.length,sel.length-trail.length);
   if(!core){v=v.slice(0,s)+mark+mark+v.slice(e);s=e=s+L}
   else{v=v.slice(0,s)+lead+mark+core+mark+trail+v.slice(e);s=s+lead.length+L;e=s+core.length}
  }
 }
 ta.value=v;ta.focus();ta.setSelectionRange(s,e);richCommit(ta,before);ta.dispatchEvent(new Event('input',{bubbles:true}));
}
function richLiteralStar(ta){
 if(!ta)return;
 const before=ta.value,s=ta.selectionStart,e=ta.selectionEnd,selected=before.slice(s,e);
 const insert=selected?'\\*'+selected+'\\*':'\\*';
 ta.value=before.slice(0,s)+insert+before.slice(e);ta.focus();
 const a=selected?s+2+selected.length:s+2;
 ta.setSelectionRange(a,a);richCommit(ta,before);ta.dispatchEvent(new Event('input',{bubbles:true}));
}
function richRefresh(id){
 const ta=$(id),pv=document.querySelector('.rich-preview[data-for="'+id+'"]');if(!ta||!pv)return;
 if(richActivePreview!==id){pv.hidden=true;return}
 pv.hidden=false;pv.innerHTML=richHtml(ta.value);
}
function richRefreshAll(){richIds.forEach(richRefresh)}
const richIds=['fcQuestion','fcAnswer','ceQuestion','ceOptionA','ceOptionB','ceOptionC','ceOptionD','ceOptionE','ceComment'];
function richHideBars(){document.querySelectorAll('.rich-bar').forEach(bar=>{bar.hidden=true;bar.style.setProperty('display','none','important')})}
function richHidePreviews(){richActivePreview='';richRefreshAll()}
function richActivatePreview(id){
 const ta=$(id);if(!ta||!richIds.includes(id))return;
 richActivePreview=id;richRefreshAll();
}
function richTrack(ta){
 if(!ta)return;
 const state=richState(ta);
 if(state.last!==ta.value){state.stack.push(state.last);if(state.stack.length>100)state.stack.shift();state.last=ta.value;}
}
function richUndo(ta){
 if(!ta)return;
 const state=richState(ta);
 if(!state.stack.length)return;
 ta.value=state.stack.pop();state.last=ta.value;ta.focus();
 ta.setSelectionRange(ta.value.length,ta.value.length);
 ta.dispatchEvent(new Event('input',{bubbles:true}));
}
document.querySelectorAll('.rich-bar').forEach(bar=>{
 const ta=$(bar.dataset.for);if(!ta)return;
 richUndoState.set(ta,{last:ta.value,stack:[]});
 bar.querySelectorAll('button').forEach(b=>{
  b.addEventListener('pointerdown',e=>e.preventDefault());
  b.addEventListener('mousedown',e=>e.preventDefault());
  b.onclick=()=>b.dataset.undoRich?richUndo(ta):(b.dataset.literalStar?richLiteralStar(ta):richToggle(ta,b.dataset.mark));
 });
 ta.addEventListener('focus',()=>{document.querySelectorAll('.rich-bar').forEach(x=>{const active=x===bar;x.hidden=!active;x.style.setProperty('display',active?'flex':'none','important')});const st=richState(ta);st.last=ta.value;richActivatePreview(ta.id)});ta.addEventListener('blur',()=>{bar.hidden=true;bar.style.setProperty('display','none','important')});bar.hidden=true;bar.style.setProperty('display','none','important');
 ta.addEventListener('input',()=>{richTrack(ta);richRefresh(bar.dataset.for)});
 ta.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&!e.altKey&&!e.shiftKey&&String(e.key).toLowerCase()==='z'){
   e.preventDefault();richUndo(ta);return;
  }
  if(!(e.ctrlKey||e.metaKey)||e.altKey)return;
  const mark={b:'**',i:'*',u:'__',x:'~~'}[String(e.key).toLowerCase()];
  if(mark){e.preventDefault();richToggle(ta,mark)}
 });
});
['ceModal','fcModal'].forEach(id=>{
 const modal=$(id);
 new MutationObserver(()=>{richHideBars();richHidePreviews()}).observe(modal,{attributes:true,attributeFilter:['hidden']});
 modal.addEventListener('focusin',e=>{
  const target=e.target;
  if(target&&richIds.includes(target.id))return;
  if(target&&target.matches('input,textarea,select,button')){if(!richIds.includes(target.id))richHideBars();richHidePreviews();}
 });
 modal.addEventListener('click',e=>{const target=e.target;if(target&&richIds.includes(target.id))richActivatePreview(target.id)});
});
const studyScrollLock=()=>document.documentElement.classList.toggle('study-open',!$('fcStudyModal').hidden||!$('ceStudyModal').hidden);['fcStudyModal','ceStudyModal'].forEach(id=>new MutationObserver(studyScrollLock).observe($(id),{attributes:true,attributeFilter:['hidden']}));

/* ---------- Desfazer exclusões ---------- */
let undoTimer=null;
function undoHide(){$('undoToast').hidden=true;clearTimeout(undoTimer)}
function undoShow(msg,fn,ms){
 $('undoMsg').textContent=fn?'Item excluído':msg;$('undoBtn').hidden=!fn;$('undoBtn').onclick=()=>{undoHide();if(fn)fn()};
 $('undoToast').hidden=false;clearTimeout(undoTimer);undoTimer=setTimeout(undoHide,ms||5000);
}
function undoSnap(){return{records:records.slice(),subjects:subjects.slice(),index:currentIndex,circuits:circuits.slice(),flashcards:flashcards.slice(),caderno:cadernoErradas.slice()}}
function undoable(label,fn){
 const b=undoSnap();fn();const a=undoSnap();
 const gone=(bs,as)=>{const S=new Set(as);return bs.map((x,i)=>({x,i})).filter(o=>!S.has(o.x))};
 const rm={records:gone(b.records,a.records),circuits:gone(b.circuits,a.circuits),flashcards:gone(b.flashcards,a.flashcards),caderno:gone(b.caderno,a.caderno)};
 const subjChanged=JSON.stringify(b.subjects)!==JSON.stringify(a.subjects)||b.index!==a.index;
 if(!rm.records.length&&!rm.circuits.length&&!rm.flashcards.length&&!rm.caderno.length&&!subjChanged)return;
 undoShow(label,()=>{
  const byId=(y,x)=>y&&x&&y.id===x.id;
  const back=(arr,list,same)=>{let n=0;list.slice().sort((p,q)=>p.i-q.i).forEach(o=>{if(arr.includes(o.x)||(same&&arr.some(y=>same(y,o.x))))return;arr.splice(Math.min(o.i,arr.length),0,o.x);n++});return n};
  const nR=back(records,rm.records),nC=back(circuits,rm.circuits,byId),nF=back(flashcards,rm.flashcards,byId),nE=back(cadernoErradas,rm.caderno,byId);
  const restoreSubj=subjChanged&&JSON.stringify(subjects)===JSON.stringify(a.subjects)&&currentIndex===a.index;
  if(restoreSubj){subjects=b.subjects.slice();currentIndex=b.index}
  if(nR)save();
  if(nC)saveCircuits();
  if(restoreSubj)saveSubjects();
  if(nF)fcSave();
  if(nE)ceSave();
  undoShow('Restaurado.',null,2500);
 });
}

let ceImageId='',ceImageBusy=false;
function ceImageRefresh(){
 const wrap=$('cePreviewWrap'),img=$('cePreview');
 if(!ceImageId){wrap.hidden=true;img.removeAttribute('src');return}
 const id=ceImageId;
 CircuitoImg.url(id).then(u=>{
  if(id!==ceImageId)return;
  wrap.hidden=false;
  if(u)img.src=u;
  else{img.removeAttribute('src');$('ceImageMsg').textContent='A imagem desta questão ainda não foi baixada neste aparelho. Sincronize para baixá-la; se você salvar sem trocá-la, ela é mantida.'}
 }).catch(()=>{});
}
async function ceUseImage(file){
 const msg=$('ceImageMsg');ceImageBusy=true;msg.textContent='Processando a imagem…';
 try{
  if(!/^image\//.test(file.type)&&!/\.(png|jpe?g|gif|webp|bmp|heic|heif)$/i.test(file.name||''))throw new Error('escolha um arquivo de imagem.');
  const r=await CircuitoImg.compress(file);
  await CircuitoImg.putBuffer(r.id,r.buf,'image/jpeg');
  ceImageId=r.id;msg.textContent='Imagem pronta ('+r.width+'×'+r.height+', '+Math.max(1,Math.round(r.size/1024))+' KB).';ceImageRefresh();
 }catch(err){msg.textContent='Não foi possível usar esta imagem: '+(err&&err.message||err)}
 finally{ceImageBusy=false}
}
$('ceImageFile').onchange=e=>{const f=e.target.files&&e.target.files[0];e.target.value='';if(f)ceUseImage(f)};
$('cePreview').onclick=()=>{if($('cePreview').getAttribute('src'))CircuitoImg.view($('cePreview').src)};$('cePreview').style.cursor='zoom-in';
$('ceImageRemove').onclick=()=>{ceImageId='';$('ceImageMsg').textContent='Imagem removida (vale ao salvar).';ceImageRefresh()};
document.addEventListener('paste',e=>{
 if($('ceModal').hidden)return;
 const f=[...((e.clipboardData&&e.clipboardData.files)||[])].find(x=>/^image\//.test(x.type));
 if(f){e.preventDefault();ceUseImage(f)}
});
function ceRichWithImages(target,text,c){const token=/\{\{imagem:([^{}]+)\}\}/gi;target.innerHTML=richHtml(text).replace(token,(all,name)=>'<img class="ce-inline-image" data-image-name="'+name.trim().replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'" alt="Imagem '+name.trim().replace(/"/g,'')+'">');target.querySelectorAll('.ce-inline-image').forEach(img=>{const name=(img.dataset.imageName||'').trim(),id=c&&c.images&&c.images[name];img.style.cssText='display:inline-block;max-width:min(100%,420px);max-height:260px;object-fit:contain;vertical-align:middle;margin:4px 6px;border-radius:8px;cursor:zoom-in';if(id){img.onclick=()=>CircuitoImg.view(img.currentSrc||img.src);ceImgInto(img,id)}else{img.alt='Imagem não vinculada: '+name;img.title='Imagem não vinculada: '+name;img.style.border='1px dashed #b45309'}})}
function ceImgInto(img,id){
 const c=CircuitoImg.cachedUrl(id);if(c){img.src=c;return}
 CircuitoImg.url(id).then(u=>{
  if(u){img.src=u;return}
  const n=document.createElement('p');n.className='note';n.style.textAlign='center';
  n.textContent='🖼️ A imagem desta questão ainda não está neste aparelho. Ela será baixada na próxima sincronização.';
  const nx=img.nextElementSibling;if(nx&&nx.dataset&&nx.dataset.hint)nx.remove();img.replaceWith(n);
 }).catch(()=>{});
}
function ceGc(){ /* remove do aparelho imagens que nenhuma questão usa mais (com folga de 5 min) */
 if(!window.CircuitoImg)return;
 const refs=new Set(cadernoErradas.flatMap(c=>[c&&c.image,...Object.values(c&&c.images||{})]).filter(Boolean));
 CircuitoImg.list().then(a=>a.filter(x=>!refs.has(x.id)&&Date.now()-x.ts>300000).forEach(x=>CircuitoImg.remove(x.id))).catch(()=>{});
}
setTimeout(ceGc,10000);
function ceResetModal(){ceImageId='';$('ceImageMsg').textContent='';ceImageRefresh();ceEditId=null;$('ceSubject').value='';$('ceQuestion').value='';['A','B','C','D','E'].forEach(l=>$('ceOption'+l).value='');$('ceCorrect').value='A';$('ceComment').value='';$('ceMsg').textContent='';$('ceAdd').textContent='Adicionar questão';$('ceModalHeading').textContent='Adicionar questão errada';ceSubjectMenu(false)}function ceOpen(){ceResetModal();$('ceModal').hidden=false;ceSubjectMenu(false);$('ceSubject').focus()}function ceFiltered(){return cadernoErradas.filter(c=>!ceActiveSubject||ceActiveSubject===CE_ALL||(ceActiveSubject===CE_EXCEPT?!ceExcludedSubjects.includes(c.subject):c.subject===ceActiveSubject))}const CEQUEUEKEY='circuitoLoop.cadernoErradas.recentQueues.v1';let ceRecentQueues={};try{ceRecentQueues=JSON.parse(localStorage.getItem(CEQUEUEKEY)||'{}')}catch(e){}if(!ceRecentQueues||typeof ceRecentQueues!=='object'||Array.isArray(ceRecentQueues))ceRecentQueues={};
let ceSimCycleCompleted=false;
function ceSimuladoNormalizeCycle(){
 const pool=cadernoErradas;
 if(pool.length&&pool.every(c=>c.simuladoCycleCorrect===true)){
  pool.forEach(c=>{delete c.simuladoCycleCorrect});
  localStorage.setItem(CEKEY,JSON.stringify(cadernoErradas));
  return true;
 }
 return false;
}
function ceSimuladoMarkCorrect(card){
 if(ceActiveSubject!==CE_ALL||!card)return;
 card.simuladoCycleCorrect=true;
 if(cadernoErradas.length&&cadernoErradas.every(c=>c.simuladoCycleCorrect===true)){
  cadernoErradas.forEach(c=>{delete c.simuladoCycleCorrect});
  ceSimCycleCompleted=true;
 }
}
function ceBuildQueue(){
  const allMode=ceActiveSubject===CE_ALL||ceActiveSubject===CE_EXCEPT;
  let pool=ceActiveSubject===CE_EXCEPT?cadernoErradas.filter(c=>!ceExcludedSubjects.includes(c.subject)):(allMode?cadernoErradas:cadernoErradas.filter(c=>c.subject===ceActiveSubject));
  /* No Simuladão, questões acertadas ficam fora do ciclo atual. O estado é salvo no próprio cadastro
   da questão para acompanhar a sincronização e não interfere nas revisões por matéria/Todas menos. */
  if(ceActiveSubject===CE_ALL){ceSimuladoNormalizeCycle();pool=pool.filter(c=>!c.simuladoCycleCorrect)}
  if(ceActiveSubject===CE_ALL&&ceRequestedCount>0&&pool.length>ceRequestedCount){
    const groups=new Map();pool.forEach(q=>{const k=String(q.subject||'Sem matéria');if(!groups.has(k))groups.set(k,[]);groups.get(k).push(q)});
    const shuffleItems=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
    groups.forEach(a=>shuffleItems(a));
    const chosen=[];let remaining=Math.min(ceRequestedCount,pool.length);
    while(remaining>0){const available=[...groups.entries()].filter(([,a])=>a.length);if(!available.length)break;const base=Math.floor(remaining/available.length);let allocated=0;
      if(base>0){available.forEach(([,a])=>{const take=Math.min(base,a.length);for(let i=0;i<take;i++)chosen.push(a.pop());allocated+=take});remaining-=allocated;}
      if(remaining>0){const next=[...groups.entries()].filter(([,a])=>a.length).sort((a,b)=>b[1].length-a[1].length);if(!next.length)break;for(let i=0;i<next.length&&remaining>0;i++){chosen.push(next[i][1].pop());remaining--;}}
    }
    pool=chosen;
  }
  const ids=pool.map(c=>c.id);
  if(ids.length<=1){ceQueue=ids.slice();ceRecentQueues[ceActiveSubject]=ceQueue.slice();localStorage.setItem(CEQUEUEKEY,JSON.stringify(ceRecentQueues));return}
  const previous=Array.isArray(ceRecentQueues[ceActiveSubject])?ceRecentQueues[ceActiveSubject]:[];
  const previousValid=previous.length===ids.length&&previous.every(id=>ids.includes(id));
  const shuffle=arr=>{for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr};
  let next;
  if(allMode){
    const bySubject=new Map();pool.forEach(c=>{const key=String(c.subject||'').trim();if(!bySubject.has(key))bySubject.set(key,[]);bySubject.get(key).push(c.id)});bySubject.forEach(shuffle);
    next=[];let last=null,left=ids.length;
    while(left>0){const candidates=[...bySubject.entries()].filter(([subject,queue])=>queue.length&&subject!==last);let pick;
      if(!candidates.length)pick=[...bySubject.entries()].find(([,queue])=>queue.length);
      else{const forced=candidates.filter(([,queue])=>queue.length*2-1>=left).sort((a,b)=>b[1].length-a[1].length)[0];if(forced)pick=forced;else{let n=Math.random()*candidates.reduce((sum,[,queue])=>sum+queue.length,0);pick=candidates.find(([,queue])=>(n-=queue.length)<0)||candidates[candidates.length-1]}}
      next.push(pick[1].pop());last=pick[0];left--;}
    if(previousValid&&next.length>1&&next.every((id,i)=>id===previous[i])){const swap=next.findIndex((id,i)=>i>0&&pool.find(c=>c.id===id)?.subject!==pool.find(c=>c.id===next[i-1])?.subject);if(swap>0)[next[0],next[swap]]=[next[swap],next[0]];}
  }else{next=ids.slice();if(previousValid&&ids.length===2)next=[previous[1],previous[0]];else if(previousValid){do{shuffle(next)}while(next.every((id,i)=>id===previous[i]));}else shuffle(next);}
  ceQueue=next;ceRecentQueues[ceActiveSubject]=next.slice();localStorage.setItem(CEQUEUEKEY,JSON.stringify(ceRecentQueues));
}function ceReviewItems(){return ceQueue.map(id=>cadernoErradas.find(c=>c.id===id)).filter(Boolean)}
function ceRenderReview(){
 const review=$('ceReview'); if(!review)return;
 const items=ceReviewItems();
 $('ceCount').textContent=items.length+' '+(items.length===1?'questão':'questões')+(ceTimeLimitSec&&!ceShowingResult?' · Tempo restante '+String(Math.floor(Math.max(0,ceTimeLimitSec-ceElapsed())/60)).padStart(2,'0')+':'+String(Math.max(0,ceTimeLimitSec-ceElapsed())%60).padStart(2,'0'):'');
 if(!items.length){review.innerHTML='<p class="muted">Nenhuma questão cadastrada nesta matéria.</p>';$('ceReveal').hidden=true;$('ceFinish').hidden=false;return}
 if(ceShowingResult){
  const total=ceCorrectCount+ceWrongCount;
  const correctPct=total?Math.round(ceCorrectCount/total*100):0;
  const wrongPct=total?100-correctPct:0;
  review.innerHTML='';
  const title=document.createElement('h3');title.className='ce-result-title';title.textContent='Resultado';title.style.margin='0 0 16px';review.appendChild(title);
  const chartWrap=document.createElement('div');chartWrap.style.display='flex';chartWrap.style.flexDirection='column';chartWrap.style.alignItems='center';chartWrap.style.gap='16px';
  const chart=document.createElement('div');chart.style.width='190px';chart.style.height='190px';chart.style.borderRadius='50%';chart.style.background='conic-gradient(#009B00 0% '+correctPct+'%, #B60020 '+correctPct+'% 100%)';chart.style.position='relative';chart.setAttribute('aria-label','Gráfico de respostas ('+total+' '+(total===1?'questão':'questões')+'): '+correctPct+'% certas e '+wrongPct+'% erradas');
  const hole=document.createElement('div');hole.style.position='absolute';hole.style.inset='42px';hole.style.borderRadius='50%';hole.style.background='var(--card-bg, #fff)';hole.style.display='flex';hole.style.alignItems='center';hole.style.justifyContent='center';hole.style.fontWeight='700';hole.style.fontSize='24px';hole.className='ce-hole-count';hole.textContent=String(total);chart.appendChild(hole);chartWrap.appendChild(chart);
  const legend=document.createElement('div');legend.style.display='grid';legend.style.gap='8px';legend.style.width='100%';legend.style.maxWidth='280px';
  const correct=document.createElement('div');correct.style.display='flex';correct.style.justifyContent='space-between';correct.innerHTML='<span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#009B00;margin-right:8px"></span>Certas</span><strong>'+ceCorrectCount+' ('+correctPct+'%)</strong>';
  const wrong=document.createElement('div');wrong.style.display='flex';wrong.style.justifyContent='space-between';wrong.innerHTML='<span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#B60020;margin-right:8px"></span>Erradas</span><strong>'+ceWrongCount+' ('+wrongPct+'%)</strong>';
  legend.append(correct,wrong);chartWrap.appendChild(legend);review.appendChild(chartWrap);if(ceSavedNote){const sn=document.createElement('p');sn.className='note';sn.style.textAlign='center';sn.style.marginTop='14px';sn.textContent=ceSavedNote;review.appendChild(sn)}
  $('ceFinish').hidden=true;$('ceReveal').hidden=false;$('ceReveal').textContent='Fechar resultado';$('ceReveal').style.flex='0 0 33.333%';$('ceReveal').style.minWidth='0';
  return;
 }
 const c=items[Math.min(ceIndex,items.length-1)]; ceIndex=Math.min(ceIndex,items.length-1);
 review.innerHTML='';
 const head=document.createElement('div');head.className='fc-row';head.style.marginBottom='10px';
 const title=document.createElement('strong');title.textContent='Pergunta '+(ceIndex+1)+' de '+items.length;head.appendChild(title);review.appendChild(head);
 const q=document.createElement('p');q.className='ce-question';q.style.fontWeight='400';q.style.margin='0 0 14px';ceRichWithImages(q,c.question,c);review.appendChild(q);if(c.image){const im=document.createElement('img');im.alt='Imagem da questão';im.style.cssText='display:block;max-width:100%;max-height:45vh;margin:0 auto 14px;border-radius:8px;cursor:zoom-in;object-fit:contain';im.onclick=()=>CircuitoImg.view(im.currentSrc||im.src);ceImgInto(im,c.image);review.appendChild(im);{const hn=document.createElement('p');hn.className='note';hn.dataset.hint='1';hn.style.cssText='text-align:center;margin:-6px 0 14px';hn.textContent=CircuitoImg.isTouch()?'🔍 Toque na imagem para ampliar':'🔍 Clique na imagem para ampliar';review.appendChild(hn)}}
 const opts=document.createElement('div');opts.style.display='grid';opts.style.gap='8px';
 if(ceOptionOrder.length!==5||ceOptionOrder.some(k=>!c.options[k])){ceOptionOrder=['A','B','C','D','E'].sort(()=>Math.random()-0.5)}
 ceOptionOrder.forEach((sourceKey,index)=>{
   const displayLetter=['A','B','C','D','E'][index];
   const label=document.createElement('label');label.className='ce-answer-option'+(ceRevealed&&sourceKey===c.correct?' is-correct':'')+(ceRevealed?' is-disabled':'');
   const radio=document.createElement('input');radio.type='radio';radio.name='ceAnswer';radio.value=sourceKey;radio.disabled=ceRevealed;radio.checked=ceSelectedAnswer===sourceKey;
   radio.addEventListener('change',()=>{if(!ceRevealed)ceSelectedAnswer=sourceKey});
   const text=document.createElement('span');ceRichWithImages(text,displayLetter+') '+c.options[sourceKey],c);
   label.appendChild(radio);label.appendChild(text);opts.appendChild(label);
 });
 review.appendChild(opts);
 if(ceRevealed&&c.comment&&String(c.comment).trim()){
   const comment=document.createElement('div');comment.className='ce-answer-comment';
   comment.style.cssText='margin-top:14px;padding:12px;border:1px solid rgba(128,128,128,.28);border-radius:8px;background:var(--surface-2,rgba(128,128,128,.07))';
   const heading=document.createElement('strong');heading.textContent='Comentário:';heading.style.display='block';heading.style.marginBottom='5px';
   const body=document.createElement('div');ceRichWithImages(body,c.comment,c);
   comment.append(heading,body);review.appendChild(comment);
 }
 $('ceFinish').hidden=false;$('ceReveal').hidden=false;$('ceReveal').textContent=ceRevealed?(ceIndex===items.length-1?'Mostrar resultado':'Próxima pergunta'):'Mostrar resposta';$('ceReveal').style.flex='2 1 0';$('ceReveal').style.minWidth='0';
}

let ceSavedNote='',ceTimeAcc=0,ceTimeStart=0,ceTimeLimitSec=0,ceDeadlineTimer=null,ceTimedOut=false,ceRequestedCount=0;
function ceTimerReset(limit=0){clearInterval(ceDeadlineTimer);ceTimeLimitSec=Math.max(0,Number(limit)||0);ceTimedOut=false;ceTimeAcc=0;ceTimeStart=document.hidden?0:Date.now();if(ceTimeLimitSec){ceDeadlineTimer=setInterval(()=>{const elapsed=ceElapsed();const left=Math.max(0,ceTimeLimitSec-elapsed);const label=$('ceCount');if(label)label.textContent=ceReviewItems().length+' questões · Tempo restante '+String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');if(!ceShowingResult&&ceActiveSubject&&elapsed>=ceTimeLimitSec){ceTimedOut=true;ceTimeAcc=ceTimeLimitSec*1000;ceTimeStart=0;clearInterval(ceDeadlineTimer);ceShowResult(true)}},250)}}
function ceElapsed(){return Math.max(0,Math.round((ceTimeAcc+(ceTimeStart?Date.now()-ceTimeStart:0))/1000))}
document.addEventListener('visibilitychange',()=>{
 if(ceShowingResult||!ceActiveSubject)return;
 if(document.hidden){if(ceTimeStart){ceTimeAcc+=Date.now()-ceTimeStart;ceTimeStart=0}}
 else if(!ceTimeStart)ceTimeStart=Date.now();
});
function ceCanonSubject(name){
 const n=String(name||'').trim();
 if(n===CE_ALL||n==='__**SIMULADAO__**'||n==='__SIMULADAO__')return 'Simuladão';
 if(n===CE_EXCEPT||n==='__**TODAS_MENOS__**'||n==='__TODAS_MENOS__')return 'Todas menos...';
 const key=x=>String(x||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\\s+/g,' ').trim().toLowerCase();
 const pool=[...records.map(r=>r&&r.subject),...subjects].map(x=>String(x||'').trim()).filter(Boolean);
 return pool.find(x=>x===n)||pool.find(x=>key(x)===key(n))||n;
}
function ceShowResult(){
 if(ceShowingResult)return;
 const total=ceCorrectCount+ceWrongCount;
 ceSavedNote='';
 if(total>0||ceTimedOut){
  const sec=ceElapsed();ceTimeAcc=sec*1000;ceTimeStart=0;
  records.unshift({date:new Date().toISOString(),subject:ceCanonSubject(ceActiveSubject),sec,q:total,c:ceCorrectCount,source:'errors',notes:'Caderno de Erradas'});
  save();
  const all=ceReviewItems().length;
  ceSavedNote='Resultado registrado no Resumo geral e no Histórico ('+total+' de '+all+' '+(all===1?'questão respondida':'questões respondidas')+', tempo '+fmt(sec)+').';
  if(ceActiveSubject===CE_ALL&&ceSimCycleCompleted)ceSavedNote+=' Ciclo concluído! Todas as questões foram acertadas e o Simuladão foi reiniciado.';
 }
 ceShowingResult=true;ceRenderReview();
}
function ceFinishEarly(){
 if(ceShowingResult)return;
 if(!ceAnsweredCount){$('ceStudyClose').click();return}   /* nenhuma pergunta respondida: nada é registrado */
 const all=ceReviewItems().length;
 if(!confirm('Encerrar o estudo agora?\n\n• '+ceAnsweredCount+' de '+all+' questões respondidas ('+ceCorrectCount+' certas e '+ceWrongCount+' erradas)'+(ceRevealed?'':'\n• A pergunta atual, sem resposta confirmada, não será contabilizada')+'\n• O resultado será somado ao Resumo geral'))return;
 ceShowResult();
}
$('ceFinish').onclick=ceFinishEarly;

function ceOpenStudy(subject){
 ceTimerReset();ceSimCycleCompleted=false;ceActiveSubject=subject;ceIndex=0;ceRevealed=false;ceSelectedAnswer='';ceCorrectCount=0;ceWrongCount=0;ceAnsweredCount=0;ceShowingResult=false;ceOptionOrder=[];ceBuildQueue();$('ceStudyHeading').textContent=subject===CE_ALL?'Simuladão — todas as matérias':subject===CE_EXCEPT?'Todas menos... — questões selecionadas':'Revisar: '+subject;$('ceWorkspace').hidden=false;
 $('ceStudyMount').appendChild($('ceWorkspace'));$('ceStudyModal').hidden=false;ceRenderReview();
}
$('ceStudyClose').onclick=()=>{$('ceStudyModal').hidden=true;ceQueue=[];ceActiveSubject='';ceIndex=0;ceRevealed=false;ceSelectedAnswer='';ceCorrectCount=0;ceWrongCount=0;ceAnsweredCount=0;ceShowingResult=false;$('errorsPage').appendChild($('ceWorkspace'));$('ceWorkspace').hidden=true;ceRender()};

function ceStatsRender(){
 const tot=$('ceStatTotal'),mon=$('ceStatMonths');if(!tot||!mon)return;
 const S=ceStatsRender.s||(ceStatsRender.s={end:null,sel:null});
 const AB=['jan.','fev.','mar.','abr.','mai.','jun.','jul.','ago.','set.','out.','nov.','dez.'],FULL=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
 const mk=d=>d.getFullYear()*12+d.getMonth(),byMonth=new Map();let q=0,c=0;
 records.forEach(r=>{
  if(!r||r.notes!=='Caderno de Erradas')return;
  const rq=Math.max(0,Math.floor(Number(r.q)||0)),rc=Math.min(rq,Math.max(0,Math.floor(Number(r.c)||0)));
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(r.date||'')),d=m?new Date(+m[1],+m[2]-1,+m[3]):new Date(r.date);
  if(isNaN(d.getTime()))return;
  const k=mk(d),o=byMonth.get(k)||{q:0,c:0};o.q+=rq;o.c+=rc;byMonth.set(k,o);q+=rq;c+=rc;
 });
 /* --- 1) resumo geral --- */
 const w=q-c,pct=q?Math.round(c*100/q):0,C=2*Math.PI*48,arcC=q?C*c/q:0,arcW=q?C*w/q:0;
 const ring=(col,dash,off)=>'<circle cx="60" cy="60" r="48" fill="none" stroke="'+col+'" stroke-width="14" stroke-dasharray="'+dash+' '+C+'"'+(off?' stroke-dashoffset="'+off+'"':'')+'/>';
 tot.innerHTML='<div class="ce-total"><div class="ce-donut" role="img" aria-label="'+(q?pct+'% de aproveitamento':'Sem questões resolvidas')+'"><svg viewBox="0 0 120 120" aria-hidden="true">'+ring('#e5e7eb',C,0)+(q?ring('#3b82f6',arcC,0)+ring('#ef4444',arcW,-arcC):'')+'</svg><b>'+(q?pct+'%':'—')+'</b></div>'
  +'<div class="ce-legend"><div><i style="border-color:#94a3b8"></i><span>Resolvidas</span><strong>'+q+'</strong></div><div><i style="border-color:#3b82f6"></i><span>Certas</span><strong>'+c+'</strong></div><div><i style="border-color:#ef4444"></i><span>Erradas</span><strong>'+w+'</strong></div></div></div>';
 /* --- 2) evolução mensal --- */
 const N=6,cur=mk(new Date());
 if(S.end===null||S.end>cur)S.end=cur;
 const keys=[...byMonth.keys()],minK=keys.length?Math.min(...keys):cur,start=S.end-N+1;
 if(S.sel===null||S.sel<start||S.sel>S.end)S.sel=S.end;
 let max=1;for(let k=start;k<=S.end;k++)max=Math.max(max,(byMonth.get(k)||{q:0}).q);
 let bars='';
 for(let k=start;k<=S.end;k++){
  const o=byMonth.get(k)||{q:0,c:0},on=k===S.sel,y=Math.floor(k/12),mo=k%12;
  const h=o.q?Math.max(12,Math.round(o.q/max*160)):6,cH=o.q?Math.round(h*o.c/o.q):0,wH=h-cH;
  const cc=on?'#3b82f6':'#9d96d3',wc=on?'#ef4444':'#f4a7a7';
  const col=o.q?'<i style="height:'+wH+'px;background:'+wc+'"></i><i style="height:'+cH+'px;background:'+cc+'"></i>':'<i style="height:6px;background:#e5e7eb"></i>';
  bars+='<button type="button" class="ce-bar" data-k="'+k+'" aria-pressed="'+on+'" aria-label="'+FULL[mo]+' de '+y+': '+o.q+' resolvidas, '+o.c+' certas, '+(o.q-o.c)+' erradas"><span class="ce-bar-track"><span class="ce-bar-col">'+col+'</span></span><span class="ce-bar-label">'+AB[mo]+'<small>'+y+'</small></span><span class="ce-bar-dot"></span></button>';
 }
 const sel=byMonth.get(S.sel)||{q:0,c:0},sp=sel.q?Math.round(sel.c*100/sel.q):null,sy=Math.floor(S.sel/12),sm=S.sel%12;
 const spc=sp===null?'#94a3b8':sp>=70?'#16a34a':sp>=50?'#d97706':'#dc2626';
 mon.innerHTML='<div class="ce-evo-head"><div><h3>Sua evolução em <b>'+N+' meses</b></h3><div class="ce-evo-range">'+AB[start%12]+' '+Math.floor(start/12)+' – '+AB[S.end%12]+' '+Math.floor(S.end/12)+'</div></div>'
  +'<div class="ce-evo-nav"><button type="button" class="alt" data-nav="-1" aria-label="Meses anteriores"'+(start>minK?'':' disabled')+'>‹</button><button type="button" class="alt" data-nav="1" aria-label="Próximos meses"'+(S.end<cur?'':' disabled')+'>›</button></div></div>'
  +'<div class="ce-bars" role="group" aria-label="Questões por mês">'+bars+'</div>'
  +'<div class="ce-sum-title">Resumo de '+FULL[sm]+' de '+sy+'</div>'
  +'<div class="ce-sum"><div><span>Resolvidas</span><strong>'+sel.q+'</strong></div><div><span>Certas</span><strong>'+sel.c+'</strong></div><div><span>Erradas</span><strong>'+(sel.q-sel.c)+'</strong></div><div><span>Rendimento</span><strong style="color:'+spc+'">'+(sp===null?'—':sp+'%')+'</strong></div></div>';
 mon.querySelectorAll('.ce-bar').forEach(b=>b.onclick=()=>{S.sel=+b.dataset.k;ceStatsRender()});
 mon.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{S.end=Math.min(cur,S.end+N*(+b.dataset.nav));S.sel=S.end;ceStatsRender()});
}
function ceRender(){
 ceStatsRender();
 const catalog=$('ceCatalogGrid');if(!catalog)return;catalog.innerHTML='';
 const names=[...new Set(cadernoErradas.map(card=>String(card.subject||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
 const groups=names.map(name=>({name,count:cadernoErradas.filter(c=>c.subject===name).length}));
 groups.forEach(group=>{
  const tile=document.createElement('button');tile.type='button';tile.className='fc-catalog-tile is-filled';tile.style.textAlign='left';tile.style.cursor='pointer';
  const name=document.createElement('strong');name.textContent=group.name;
  const count=document.createElement('span');count.className='fc-tile-count';count.textContent=String(group.count).padStart(2,'0')+' '+(group.count===1?'questão cadastrada':'questões cadastradas');
  tile.append(name,count);tile.onclick=()=>{if(group.count)ceOpenStudy(group.name);else{ceOpen();$('ceSubject').value=group.name;$('ceModalHeading').textContent='Adicionar questão em '+group.name;$('ceQuestion').focus()}};catalog.appendChild(tile)
 });
 const exceptTile=document.createElement('button');exceptTile.type='button';exceptTile.className='fc-catalog-tile is-filled is-all';exceptTile.style.textAlign='left';exceptTile.style.cursor='pointer';const exceptName=document.createElement('strong');exceptName.textContent='Todas menos...';const exceptCount=document.createElement('span');exceptCount.className='fc-tile-count';exceptCount.textContent='Selecionar matérias para desconsiderar';exceptTile.append(exceptName,exceptCount);exceptTile.onclick=ceOpenExcept;catalog.appendChild(exceptTile);
 const simTile=document.createElement('button');simTile.type='button';simTile.className='fc-catalog-tile is-filled is-all';simTile.style.textAlign='left';simTile.style.cursor='pointer';const simName=document.createElement('strong');simName.textContent='Simuladão';const simCount=document.createElement('span');simCount.className='fc-tile-count';simCount.textContent=String(cadernoErradas.length).padStart(2,'0')+' '+(cadernoErradas.length===1?'questão':'questões')+' · todas as matérias';simTile.append(simName,simCount);simTile.onclick=()=>{if(!cadernoErradas.length)return;const active=cadernoErradas.filter(c=>!c.simuladoCycleCorrect);$('ceSimQuestionLimit').max=String(Math.max(1,active.length));$('ceSimQuestionLimit').value=String(Math.min(20,active.length));$('ceSimAvailable').textContent=active.length+' questões disponíveis no ciclo atual, distribuídas entre '+new Set(active.map(c=>c.subject)).size+' matérias.';$('ceSimConfigModal').hidden=false};catalog.appendChild(simTile);
 const columns=window.matchMedia('(max-width:640px)').matches?2:3;
 const totalTiles=groups.length+2;
 const emptySlots=(columns-(totalTiles%columns))%columns;
 for(let i=0;i<emptySlots;i++){const tile=document.createElement('div');tile.className='fc-catalog-tile fc-catalog-empty';tile.textContent='Vazio';tile.setAttribute('aria-hidden','true');catalog.appendChild(tile)}
 $('ceCount').textContent=cadernoErradas.length+' '+(cadernoErradas.length===1?'questão':'questões');
 const list=$('ceList');if(list){const filter=$('ceListSubjectFilter'),selected=filter?filter.value:'';if(filter){const names=[...new Set(cadernoErradas.map(card=>String(card.subject||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base',numeric:true}));filter.innerHTML='<option value="">Todas as matérias</option>';names.forEach(name=>{const option=document.createElement('option');option.value=name;option.textContent=name;filter.appendChild(option)});filter.value=names.includes(selected)?selected:''}const items=$('ceListItems');if(items){items.innerHTML='';const indexed=cadernoErradas.map((card,index)=>({card,index}));const visible=indexed.filter(({card})=>!filter||!filter.value||card.subject===filter.value).sort((a,b)=>{const at=Number(a.card.createdAt)||a.index+1,bt=Number(b.card.createdAt)||b.index+1;return bt-at||b.index-a.index});if($('ceListCount'))$('ceListCount').textContent=visible.length+' '+(visible.length===1?'pergunta':'perguntas');if(!visible.length){const empty=document.createElement('p');empty.className='note';empty.textContent=filter&&filter.value?'Nenhuma pergunta cadastrada nesta matéria.':'Nenhuma pergunta cadastrada.';items.appendChild(empty)}visible.forEach(({card})=>{
  const el=document.createElement('div');el.className='fc-card';el.innerHTML='<strong></strong><p class="note" style="margin:5px 0 0"></p><div class="fc-row" style="margin-top:10px"></div>';
  el.querySelector('strong').textContent=card.subject+' — '+richPlain(card.question)+(card.image?' 🖼️':'');el.querySelector('.note').textContent='Resposta correta: '+card.correct;
  const actions=el.querySelector('.fc-row');const edit=document.createElement('button');edit.className='alt';edit.textContent='Editar';edit.onclick=()=>ceEdit(card.id);
  const del=document.createElement('button');del.className='alt';del.textContent='Excluir';del.onclick=()=>{if(confirm('Excluir esta questão?')){undoable('Questão excluída',()=>{cadernoErradas=cadernoErradas.filter(x=>x.id!==card.id);if(ceActiveSubject&&ceFiltered().length===0){ceActiveSubject='';$('ceWorkspace').hidden=true}ceSave()})}};
  actions.append(del,edit);items.appendChild(el)
 })}}
}
function ceEdit(id){const c=cadernoErradas.find(x=>x.id===id);if(!c)return;if(!$('ceStudyModal').hidden){$('ceStudyModal').hidden=true;$('errorsPage').appendChild($('ceWorkspace'));$('ceWorkspace').hidden=false}ceEditId=id;ceImageId=c.image||'';$('ceImageMsg').textContent='';ceImageRefresh();$('ceSubject').value=c.subject;$('ceQuestion').value=c.question;['A','B','C','D','E'].forEach(l=>$('ceOption'+l).value=c.options[l]||'');$('ceCorrect').value=c.correct||'A';$('ceComment').value=c.comment||'';$('ceModalHeading').textContent='Editar questão errada';$('ceAdd').textContent='Salvar alterações';$('ceModal').hidden=false;ceSubjectMenu(false);$('ceSubject').focus()}$('ceOpenModal').onclick=ceOpen;$('ceCloseModal').onclick=()=>{$('ceModal').hidden=true;ceResetModal()};$('ceModal').addEventListener('click',e=>{if(e.target===$('ceModal'))$('ceCloseModal').click()});$('ceSubject').addEventListener('input',()=>ceSubjectMenu(true));$('ceSubjectToggle').onclick=()=>{const opening=$('ceSubjectOptions').hidden;ceSubjectMenu(opening,opening?'':null)};$('ceAdd').onclick=()=>{if(ceImageBusy){alert('Aguarde o processamento da imagem terminar.');return}const subject=$('ceSubject').value.trim(),question=$('ceQuestion').value.trim(),options={A:$('ceOptionA').value.trim(),B:$('ceOptionB').value.trim(),C:$('ceOptionC').value.trim(),D:$('ceOptionD').value.trim(),E:$('ceOptionE').value.trim()},correct=$('ceCorrect').value;if(!subject||!question||Object.values(options).some(v=>!v)){alert('Preencha matéria, pergunta e todas as alternativas de A a E.');return}if(ceEditId){const c=cadernoErradas.find(x=>x.id===ceEditId);if(c){Object.assign(c,{subject,question,options,correct,comment:$('ceComment').value.trim()});if(ceImageId)c.image=ceImageId;else delete c.image}}else cadernoErradas.push(Object.assign({id:'ce'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),subject,question,options,correct,...($('ceComment').value.trim()?{comment:$('ceComment').value.trim()}:{} )},ceImageId?{image:ceImageId}:{}));$('ceModal').hidden=true;ceResetModal();ceSave()};$('toggleCeList').onclick=()=>{const list=$('ceList'),hide=!list.hidden;list.hidden=hide;$('toggleCeList').textContent=hide?'Expandir':'Minimizar';$('toggleCeList').setAttribute('aria-expanded',String(!hide))};$('ceListSubjectFilter').onchange=()=>ceRender();
function ceExceptSubjectNames(){return [...new Set(cadernoErradas.map(c=>String(c&&c.subject||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base',numeric:true}))}function ceExceptRefresh(){const box=$('ceExceptSubjects');box.innerHTML='';const names=ceExceptSubjectNames();names.forEach((name,i)=>{const label=document.createElement('label');label.style.cssText='display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid rgba(128,128,128,.25);border-radius:8px;font-weight:500';const cb=document.createElement('input');cb.type='checkbox';cb.value=name;cb.checked=ceExcludedSubjects.includes(name);cb.style.cssText='width:auto;margin:0';cb.onchange=ceExceptUpdateCount;label.append(cb,document.createTextNode(name));box.appendChild(label)});ceExceptUpdateCount()}
function ceExceptUpdateCount(){const excluded=[...$('ceExceptSubjects').querySelectorAll('input:checked')].map(x=>x.value);const available=cadernoErradas.filter(c=>!excluded.includes(String(c.subject||'').trim())).length;$('ceExceptCount').textContent=available+' '+(available===1?'questão disponível':'questões disponíveis')+' em '+ceExceptSubjectNames().filter(x=>!excluded.includes(x)).length+' matérias.';$('ceExceptStart').disabled=available===0}
function ceOpenExcept(){ceExcludedSubjects=[];ceExceptRefresh();$('ceExceptModal').hidden=false}
$('ceSimCancel').onclick=()=>{$('ceSimConfigModal').hidden=true};$('ceSimConfigModal').addEventListener('click',e=>{if(e.target===$('ceSimConfigModal') )$('ceSimCancel').click()});$('ceSimStart').onclick=()=>{const count=Math.floor(Number($('ceSimQuestionLimit').value)),minutes=Math.floor(Number($('ceSimMinutes').value)),available=cadernoErradas.filter(c=>!c.simuladoCycleCorrect).length;if(!Number.isInteger(count)||count<1||count>available){alert('Informe uma quantidade entre 1 e '+available+' questões.');return}if(!Number.isInteger(minutes)||minutes<1){alert('Informe um tempo de pelo menos 1 minuto.');return}$('ceSimConfigModal').hidden=true;ceOpenStudy(CE_ALL,{count,minutes})};
$('ceExceptSelectAll').onclick=()=>{$('ceExceptSubjects').querySelectorAll('input').forEach(x=>x.checked=true);ceExceptUpdateCount()};$('ceExceptClear').onclick=()=>{$('ceExceptSubjects').querySelectorAll('input').forEach(x=>x.checked=false);ceExceptUpdateCount()};$('ceExceptCancel').onclick=()=>{$('ceExceptModal').hidden=true};$('ceExceptModal').addEventListener('click',e=>{if(e.target===$('ceExceptModal'))$('ceExceptCancel').click()});$('ceExceptStart').onclick=()=>{ceExcludedSubjects=[...$('ceExceptSubjects').querySelectorAll('input:checked')].map(x=>x.value);$('ceExceptModal').hidden=true;if(!cadernoErradas.some(c=>!ceExcludedSubjects.includes(c.subject))){alert('Não há questões disponíveis com essa seleção.');return}ceOpenStudy(CE_EXCEPT)};
$('ceReveal').onclick=()=>{if(ceShowingResult){$('ceStudyClose').click();return}const items=ceReviewItems();if(!items.length)return;if(!ceRevealed){if(!ceSelectedAnswer){alert('Selecione uma alternativa antes de mostrar a resposta.');return}const c=items[Math.min(ceIndex,items.length-1)];c.attempts=(Number(c.attempts)||0)+1;c.lastAttemptAt=new Date().toISOString();if(ceSelectedAnswer===c.correct){ceCorrectCount++;c.correctAttempts=(Number(c.correctAttempts)||0)+1;ceSimuladoMarkCorrect(c)}else{ceWrongCount++;c.wrongAttempts=(Number(c.wrongAttempts)||0)+1}localStorage.setItem(CEKEY,JSON.stringify(cadernoErradas));ceAnsweredCount++;ceRevealed=true;ceRenderReview();return}if(ceIndex===items.length-1){ceShowResult();return}ceIndex++;ceRevealed=false;ceSelectedAnswer='';ceOptionOrder=[];ceRenderReview()};
$('ceRestart').onclick=()=>{ceTimerReset();ceSimCycleCompleted=false;ceIndex=0;ceRevealed=false;ceSelectedAnswer='';ceCorrectCount=0;ceWrongCount=0;ceAnsweredCount=0;ceShowingResult=false;ceOptionOrder=[];ceBuildQueue();ceRenderReview()};
ceRender();function fcSubjectNames(){return [...new Set([...subjects,...flashcards.map(c=>c.subject)].map(x=>String(x||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base',numeric:true}))}
function fcSubjectMenu(open=true,filterText=null){const menu=$('fcSubjectOptions'),input=$('fcSubject'),term=(filterText===null?input.value:filterText).trim().toLocaleLowerCase('pt-BR');menu.innerHTML='';const matches=fcSubjectNames().filter(name=>name.toLocaleLowerCase('pt-BR').includes(term));if(matches.length){matches.forEach(name=>{const option=document.createElement('button');option.type='button';option.className='fc-subject-option';option.setAttribute('role','option');option.textContent=name;option.addEventListener('pointerdown',e=>e.preventDefault());option.onclick=()=>{input.value=name;fcSubjectMenu(false);input.focus()};menu.appendChild(option)})}else{const empty=document.createElement('div');empty.className='fc-subject-empty';empty.textContent=term?'Nenhuma matéria encontrada. Você pode usar o texto digitado.':'Nenhuma matéria cadastrada ainda. Digite para criar uma.';menu.appendChild(empty)}menu.hidden=!open;input.setAttribute('aria-expanded',String(open));$('fcSubjectToggle').setAttribute('aria-expanded',String(open))}
$('fcCategoryInput').addEventListener('focus',fcCatOptions);$('fcSubject').addEventListener('input',fcCatOptions);$('fcSubject').addEventListener('change',fcCatOptions);
function fcEdit(id){const c=flashcards.find(x=>x.id===id);if(!c)return;$('fcSubject').value=c.subject;$('fcQuestion').value=c.question;$('fcAnswer').value=c.answer;$('fcCategoryInput').value=c.category||'';fcEditId=id;$('fcAdd').textContent='Salvar alterações';$('fcModalHeading').textContent='Editar cartão';$('fcModal').hidden=false;fcSubjectMenu(false);$('fcSubject').focus()}
$('fcAdd').onclick=()=>{const subject=$('fcSubject').value.trim(),question=$('fcQuestion').value.trim(),answer=$('fcAnswer').value.trim(),category=$('fcCategoryInput').value.trim();if(!subject||!question||!answer){alert('Preencha matéria, pergunta e resposta.');return}if(cardSubjectKey(subject)===cardSubjectKey(FC_ALL)){alert('"'+FC_ALL+'" é uma revisão geral automática e não aceita cartões manuais. Escolha outra matéria.');return}if(fcEditId){const c=flashcards.find(x=>x.id===fcEditId);if(c){Object.assign(c,{subject,question,answer});if(category)c.category=category;else delete c.category}fcEditId=null;$('fcAdd').textContent='Adicionar cartão'}else flashcards.push(Object.assign({id:'fc'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),subject,question,answer,due:0,stage:0},category?{category}:{}));$('fcQuestion').value='';$('fcAnswer').value='';$('fcMsg').textContent='Cartão salvo.';$('fcModal').hidden=true;$('fcModalHeading').textContent='Adicionar cartão';fcIndex=0;fcRevealed=false;fcSave()};
$('toggleFcList').onclick=()=>{const list=$('fcList'),hide=!list.hidden;list.hidden=hide;$('toggleFcList').textContent=hide?'Expandir':'Minimizar'};$('fcOpenModal').onclick=()=>{fcEditId=null;$('fcSubject').value='';$('fcCategoryInput').value='';fcCatOptions();$('fcQuestion').value='';$('fcAnswer').value='';$('fcAdd').textContent='Adicionar cartão';$('fcModalHeading').textContent='Adicionar cartão';$('fcModal').hidden=false;fcSubjectMenu(false);$('fcSubject').focus()};$('fcSubject').addEventListener('input',()=>fcSubjectMenu(true));$('fcSubjectToggle').onclick=()=>{const opening=$('fcSubjectOptions').hidden;fcSubjectMenu(opening,opening?'':null)};document.addEventListener('pointerdown',e=>{if(!e.target.closest('.fc-subject-picker'))fcSubjectMenu(false)});document.addEventListener('pointerdown',e=>{if(!e.target.closest('.fc-subject-picker')&&!$('ceSubjectOptions').hidden)ceSubjectMenu(false)});$('fcSubject').addEventListener('keydown',e=>{if(e.key==='Escape'){fcSubjectMenu(false)}else if(e.key==='ArrowDown'&&!$('fcSubjectOptions').hidden){e.preventDefault();$('fcSubjectOptions').querySelector('.fc-subject-option')?.focus()}});$('fcCloseModal').onclick=()=>{$('fcModal').hidden=true;fcSubjectMenu(false);fcEditId=null;$('fcAdd').textContent='Adicionar cartão';$('fcModalHeading').textContent='Adicionar cartão'};$('fcSearch').oninput=()=>{fcIndex=0;fcRevealed=false;fcRender()};$('fcReveal').onclick=()=>{if(fcReviewDone){$('fcStudyClose').click();return}if(!fcQueue.length)return;fcRevealed=true;fcRender()};$('fcPrev').onclick=()=>{};$('fcNext').onclick=()=>{};
function fcGrade(kind){const c=flashcards.find(card=>card.id===fcQueue[fcIndex]);if(!c||!fcRevealed||fcReviewDone)return;const intervals=kind==='hard'?[1,2,4,7,14,30,60]:[1,3,7,14,30,60];if(kind==='again'){c.due=Date.now()+10*60*1000;c.stage=0}else{c.stage=Math.min((c.stage||0)+1,intervals.length-1);c.due=Date.now()+intervals[c.stage]*86400000}fcStats[kind]=(fcStats[kind]||0)+1;fcIndex++;fcRevealed=false;if(fcIndex>=fcQueue.length){fcReviewDone=true;fcRecordSession()}fcSave()}
$('fcAgain').onclick=()=>fcGrade('again');$('fcHard').onclick=()=>fcGrade('hard');$('fcEasy').onclick=()=>fcGrade('easy');$('fcFinish').onclick=fcFinishEarly;$('fcCategory').onchange=()=>{
 const v=$('fcCategory').value,answered=fcStats.again+fcStats.hard+fcStats.easy+(fcRevealed?1:0);
 if(answered&&!fcReviewDone){if(!confirm('Trocar de categoria recomeça a revisão. O que você já respondeu será registrado no Histórico. Continuar?')){$('fcCategory').value=fcActiveCategory;return}fcRecordSession(fcRevealed?1:0)}
 fcActiveCategory=v;fcStats={again:0,hard:0,easy:0};fcRecorded=false;fcSavedNote='';fcPendSaved=0;fcTimerReset();fcIndex=0;fcRevealed=false;fcReviewDone=false;
 fcCatRefresh();fcQueue=fcFiltered().map(c=>c.id);if(fcActiveSubject===FC_ALL)fcQueue=fcInterleave(fcQueue);
 fcHeading();fcRender();
};
$('fcRestart').onclick=()=>{fcStats={again:0,hard:0,easy:0};fcRecorded=false;fcSavedNote='';fcPendSaved=0;fcTimerReset();fcQueue=fcFiltered().map(c=>c.id);fcIndex=0;fcRevealed=false;fcReviewDone=false;fcRender()};
/* Independent deletion actions share only presentation, never card collections. */
function setupCardDeletion(prefix,heading,getCards,deleteSubject,deleteItem){
 const opener=$(prefix+'DeleteOpen');
 const modal=document.createElement('div');modal.id=prefix+'DeleteModal';modal.className='fc-modal card-delete-modal';modal.hidden=true;
 modal.innerHTML='<div class="fc-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="'+prefix+'DeleteHeading"><h2 id="'+prefix+'DeleteHeading">'+heading+'</h2><div data-picker><fieldset data-mode style="border:0;margin:0 0 10px;padding:0"><label><input type="radio" name="'+prefix+'DelMode" value="all" checked> Card inteiro (todas as '+(prefix==='fc'?'cartões':'perguntas')+' da matéria)</label><label><input type="radio" name="'+prefix+'DelMode" value="one"> Apenas '+(prefix==='fc'?'um cartão':'uma pergunta')+'</label></fieldset><label for="'+prefix+'DeleteSubject">Matéria</label><select id="'+prefix+'DeleteSubject"><option value="">Selecione um card</option></select><div data-itemrow hidden style="margin-top:10px"><label for="'+prefix+'DeleteItem">'+(prefix==='fc'?'Cartão':'Pergunta')+'</label><select id="'+prefix+'DeleteItem"></select></div></div><div data-confirm hidden><h3 data-confirmtitle>Excluir este card inteiro?</h3><p class="card-delete-preview"></p><p data-confirmtext>Todas as perguntas, respostas e registros deste card serão apagados nesta página. Logo depois você terá alguns segundos para tocar em “Desfazer”.</p></div><p class="note" role="status"></p><div class="actions"><button class="alt" type="button" data-cancel>Cancelar</button><button class="red" type="button" data-next disabled>Continuar</button></div></div>';
 document.body.appendChild(modal);
 const select=$(prefix+'DeleteSubject'),picker=modal.querySelector('[data-picker]'),confirmation=modal.querySelector('[data-confirm]'),next=modal.querySelector('[data-next]'),message=modal.querySelector('[role=status]');
 let selectedSubject=null,confirming=false,mode='all',selectedItem=null;const itemRow=modal.querySelector('[data-itemrow]'),itemSel=$(prefix+'DeleteItem');
 function close(){selectedSubject=null;confirming=false;modal.hidden=true;opener.focus()}
 function itemLabel(c){const t=richPlain(c.question||'');return t.length>80?t.slice(0,77)+'…':t}
 function subjectCards(){return getCards().filter(card=>cardSubjectKey(card.subject)===selectedSubject)}
 function fillItems(){itemSel.innerHTML='<option value="">Selecione '+(prefix==='fc'?'um cartão':'uma pergunta')+'</option>';selectedItem=null;if(selectedSubject)subjectCards().forEach((c,i)=>{const o=document.createElement('option');o.value=c.id;o.textContent=(i+1)+'. '+itemLabel(c);itemSel.appendChild(o)})}
 function refresh(){const count=subjectCards().length;itemRow.hidden=mode!=='one'||!selectedSubject;next.disabled=mode==='one'?!selectedItem:!count;message.textContent=count?count+' '+(prefix==='fc'?'cartão(ões)':'pergunta(s)')+' neste card.':''}
 function selectSubject(){selectedSubject=select.value||null;fillItems();refresh()}
 itemSel.onchange=()=>{selectedItem=itemSel.value||null;refresh()};
 modal.querySelectorAll('input[name="'+prefix+'DelMode"]').forEach(r=>r.onchange=()=>{mode=r.value;refresh()});
 opener.onclick=()=>{selectedSubject=null;confirming=false;mode='all';selectedItem=null;itemRow.hidden=true;modal.querySelector('input[value=all]').checked=true;picker.hidden=false;confirmation.hidden=true;next.disabled=true;message.textContent='';select.innerHTML='<option value="">Selecione um card</option>';const groups=new Map();getCards().forEach(card=>{const key=cardSubjectKey(card.subject);if(!groups.has(key))groups.set(key,String(card.subject||'Sem matéria').trim()||'Sem matéria')});[...groups].sort((a,b)=>a[1].localeCompare(b[1],'pt-BR')).forEach(([key,subject])=>{const option=document.createElement('option');option.value=key;option.textContent=subject;select.appendChild(option)});select.disabled=!groups.size;if(!groups.size)message.textContent='Nenhum card cadastrado.';modal.hidden=false;(select.disabled?modal.querySelector('[data-cancel]'):select).focus()};
 select.onchange=selectSubject;
 modal.querySelector('[data-cancel]').onclick=close;
 modal.onclick=e=>{if(e.target===modal)close()};
 modal.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();close();return}if(e.key==='Tab'){const controls=[...modal.querySelectorAll('button:not(:disabled),select:not(:disabled)')].filter(el=>el.getClientRects().length);const first=controls[0],last=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};
 next.onclick=()=>{if(mode==='one'){const item=getCards().find(c=>c.id===selectedItem);if(!item)return;const subj=select.selectedOptions[0].textContent;
  if(!confirming){confirming=true;picker.hidden=true;confirmation.hidden=false;confirmation.querySelector('[data-confirmtitle]').textContent=prefix==='fc'?'Excluir este cartão?':'Excluir esta pergunta?';confirmation.querySelector('[data-confirmtext]').textContent='Somente este item será apagado; o restante do card continua. Logo depois você terá alguns segundos para tocar em “Desfazer”.';modal.querySelector('.card-delete-preview').textContent=subj+' — '+itemLabel(item);message.textContent='';modal.querySelector('[data-cancel]').focus();return}
  undoable(prefix==='fc'?'Cartão excluído':'Pergunta excluída',()=>deleteItem(item.id));close();return}
  if(!selectedSubject)return;const cards=getCards().filter(card=>cardSubjectKey(card.subject)===selectedSubject);if(!cards.length)return;if(!confirming){confirming=true;picker.hidden=true;confirmation.hidden=false;confirmation.querySelector('[data-confirmtitle]').textContent='Excluir este card inteiro?';confirmation.querySelector('[data-confirmtext]').textContent='Todas as perguntas, respostas e registros deste card serão apagados nesta página. Logo depois você terá alguns segundos para tocar em “Desfazer”.';modal.querySelector('.card-delete-preview').textContent=select.selectedOptions[0].textContent+' — '+cards.length+' '+(prefix==='fc'?'cartão(ões)':'pergunta(s)');message.textContent='';modal.querySelector('[data-cancel]').focus();return}undoable('Card “'+select.selectedOptions[0].textContent+'” excluído ('+cards.length+' '+(prefix==='fc'?(cards.length===1?'cartão':'cartões'):(cards.length===1?'pergunta':'perguntas'))+')',()=>deleteSubject(selectedSubject));close()};
}
function cardSubjectKey(subject){return String(subject||'Sem matéria').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR')||'sem matéria'}
function fcDeleteSubject(key){if(cardSubjectKey(fcActiveSubject)===key&&!$('fcStudyModal').hidden)$('fcStudyClose').click();flashcards=flashcards.filter(card=>cardSubjectKey(card.subject)!==key);fcSave()}
function ceDeleteSubject(key){if(cardSubjectKey(ceActiveSubject)===key&&!$('ceStudyModal').hidden)$('ceStudyClose').click();cadernoErradas=cadernoErradas.filter(card=>cardSubjectKey(card.subject)!==key);Object.keys(ceRecentQueues).forEach(subject=>{if(cardSubjectKey(subject)===key)delete ceRecentQueues[subject]});localStorage.setItem(CEQUEUEKEY,JSON.stringify(ceRecentQueues));ceSave()}
function fcDeleteItem(id){const c=flashcards.find(x=>x.id===id);if(c&&cardSubjectKey(fcActiveSubject)===cardSubjectKey(c.subject)&&!$('fcStudyModal').hidden)$('fcStudyClose').click();flashcards=flashcards.filter(x=>x.id!==id);fcSave()}
function ceDeleteItem(id){const c=cadernoErradas.find(x=>x.id===id);if(c&&cardSubjectKey(ceActiveSubject)===cardSubjectKey(c.subject)&&!$('ceStudyModal').hidden)$('ceStudyClose').click();cadernoErradas=cadernoErradas.filter(x=>x.id!==id);ceSave()}
setupCardDeletion('fc','Excluir — Flashcards',()=>flashcards,fcDeleteSubject,fcDeleteItem);
setupCardDeletion('ce','Excluir — Caderno de Erradas',()=>cadernoErradas,ceDeleteSubject,ceDeleteItem);
render();renderCircuitChoices();if(selectedCircuit){const activeSaved=circuits.find(c=>c.id===selectedCircuit);if(activeSaved)$('circuitName').value=activeSaved.name||''}renderSubjects();restoreDraft();$('circuitBody').hidden=true;$('toggleCircuit').textContent='Expandir';$('circuitTitle').textContent='Circuito'+($('circuitName').value.trim()?' — '+$('circuitName').value.trim():'');controls();clock();fcRender();
/* ===== Sincronização entre dispositivos (arquivo JSON em um repositório do GitHub) ===== */
(()=>{
const CFG_KEY='circuitoLoop.sync.config.v1',ST_KEY='circuitoLoop.sync.state.v1',CIRCUITS_KEY='circuitoLoop.circuits.v1';
const WEEKLY_GOAL_KEY='circuitoLoop.weeklyGoalHours.v1';
const COLS=['records','subjects','circuits','flashcards','caderno','settings'];
const WATCH={[KEY]:'records',[SUBKEY]:'subjects',[INDEXKEY]:'subjects',[CIRCUITS_KEY]:'circuits',[FCKEY]:'flashcards',[CEKEY]:'caderno',[WEEKLY_GOAL_KEY]:'settings'};
const J=JSON.stringify,same=(a,b)=>J(a)===J(b);
const emptyData=()=>({records:[],subjects:{list:[],index:0},circuits:[],flashcards:[],caderno:[],settings:{weeklyGoalHours:0}});
const readJSON=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v}catch(e){return d}};
let cfg=readJSON(CFG_KEY,null),st=readJSON(ST_KEY,null)||{};
if(!st.base)st.base=emptyData();
if(!st.changedAt)st.changedAt={};
/* Migração v63: a meta semanal era local. Se já havia uma meta neste aparelho, marca-a como alteração local para enviá-la na próxima sincronização. */
if(!st.base.settings){st.base.settings={weeklyGoalHours:0};const legacyGoal=Math.max(0,Math.min(168,Number(localStorage.getItem(WEEKLY_GOAL_KEY))||0));if(legacyGoal>0){st.changedAt.settings=Date.now();st.dirty=true}}
/* Tombstones: exclusões persistentes, compartilhadas entre dispositivos. */
if(!st.tombstones||typeof st.tombstones!=='object')st.tombstones={};
let applying=false,busy=false,again=false,timer=null,lastError='',authFail=false;
const persist=()=>{try{localStorage.setItem(ST_KEY,J(st))}catch(e){}};

/* ---------- Estado local ---------- */
const normRecords=a=>a.filter(r=>r&&typeof r==='object').map(r=>({...r,notes:r.notes||''}));
const snap=()=>JSON.parse(J({records:normRecords(records),subjects:{list:subjects,index:currentIndex},circuits,flashcards,caderno:cadernoErradas,settings:{weeklyGoalHours:Math.max(0,Math.min(168,Number(localStorage.getItem(WEEKLY_GOAL_KEY))||0))}}));

/* ---------- Interface ---------- */
const btn=$('syncOpen');
function refreshBadge(){
  let t='☁️ Sincronizar',tip='Sincronizar com o GitHub';
  if(cfg){
    if(busy)t='☁️ Sincronizando…';
    else if(lastError){t='⚠️ Sincronização';tip=lastError}
    else if(!navigator.onLine||st.dirty){t='☁️ Pendente';tip='Há alterações ainda não enviadas ao GitHub'}
    else{t='☁️ Sincronizado';tip=st.lastSync?'Última sincronização: '+new Date(st.lastSync).toLocaleString('pt-BR'):''}
  }
  {const ti=cfg&&!lastError?tokenInfo():null;if(ti&&ti.soon){t='⚠️ Token expira';tip='O token do GitHub '+ti.text+'. Gere outro e atualize em Sincronizar.'}}
  const sp=t.indexOf(' ');btn.innerHTML=sp>0?'<span class="sync-ico">'+t.slice(0,sp)+'</span><span class="sync-label">'+t.slice(sp+1)+'</span>':t;btn.title=tip;footerRefresh();
}
function setMsg(text,bad){const el=$('syncMsg');el.textContent=text||'';el.style.color=bad?'#b42318':''}

/* ---------- Detecta alterações nos dados (qualquer gravação nas chaves do app) ---------- */
const rawSet=Storage.prototype.setItem;
Storage.prototype.setItem=function(k,v){
  rawSet.call(this,k,v);
  if(this===localStorage&&!applying&&WATCH[k]){st.changedAt[WATCH[k]]=Date.now();st.dirty=true;persist();refreshBadge();scheduleSync(4000)}
};
function scheduleSync(ms){if(!cfg||!cfg.auto)return;clearTimeout(timer);timer=setTimeout(()=>syncNow(false),ms)}

/* ---------- API do GitHub (Contents API) ---------- */
const b64dec=s=>new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g,'')),c=>c.charCodeAt(0)));
const b64enc=s=>{const bytes=new TextEncoder().encode(s);let bin='';for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));return btoa(bin)};
const api=async(p,o={})=>{
  const res=await fetch('https://api.github.com'+p,{cache:'no-store',...o,headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+cfg.token,'X-GitHub-Api-Version':'2022-11-28',...(o.headers||{})}});
  try{const x=res.headers.get('github-authentication-token-expiration');if(x){const t=Date.parse(x.replace(' UTC','Z').replace(' ','T'));if(Number.isFinite(t)&&st.tokenExp!==t){st.tokenExp=t;persist();footerRefresh()}}}catch(e){}
  return res;
};
const fileUrl=()=>'/repos/'+cfg.repo+'/contents/'+cfg.path.split('/').map(encodeURIComponent).join('/');
function httpErr(status,what){
  const m={401:'Token inválido ou expirado.',403:'Acesso negado ou limite de requisições atingido. Confira se o token tem a permissão “Contents: Read and write” neste repositório.',404:what==='repo'?'Repositório não encontrado, ou o token não tem acesso a ele.':'Arquivo ou repositório não encontrado.',409:'Conflito de versão no GitHub.',422:'Conflito de versão ou dados recusados pelo GitHub.'};
  const e=new Error(m[status]||('Erro do GitHub (HTTP '+status+').'));e.status=status;return e;
}
async function ghGet(){
  const q=cfg.branch?'?ref='+encodeURIComponent(cfg.branch):'';
  const res=await api(fileUrl()+q);
  if(res.status===404){const rr=await api('/repos/'+cfg.repo);if(!rr.ok)throw httpErr(rr.status===404?404:rr.status,'repo');return{sha:null,text:null}}
  if(!res.ok)throw httpErr(res.status);
  const j=await res.json();
  if(Array.isArray(j))throw new Error('O caminho informado é uma pasta, não um arquivo.');
  let text;
  if(j.encoding==='base64'&&j.content)text=b64dec(j.content);
  else{const raw=await api(fileUrl()+q,{headers:{'Accept':'application/vnd.github.raw+json'}});if(!raw.ok)throw httpErr(raw.status);text=await raw.text()}
  return{sha:j.sha,text};
}
async function ghPut(obj,sha){
  const body={message:'Circuito Loop: sincronização '+new Date().toLocaleString('pt-BR'),content:b64enc(J(obj,null,1))};
  if(sha)body.sha=sha;if(cfg.branch)body.branch=cfg.branch;
  const res=await api(fileUrl(),{method:'PUT',headers:{'Content-Type':'application/json'},body:J(body)});
  if(!res.ok)throw httpErr(res.status);
}

/* ---------- Formato do arquivo (compatível com o "Backup JSON") ---------- */
function toRemote(m,ts,tombstones){return{app:'circuito-loop',version:7,records:m.records,subjects:m.subjects.list,currentIndex:m.subjects.index,circuits:m.circuits,flashcards:m.flashcards,cadernoErradas:m.caderno,settings:{weeklyGoalHours:m.settings?.weeklyGoalHours||0},sync:{updatedAt:new Date().toISOString(),changedAt:ts,tombstones:tombstones||{}}}}
function fromRemote(d){
  if(!d||typeof d!=='object'||Array.isArray(d)||!(d.app==='circuito-loop'||Array.isArray(d.records)))throw new Error('O arquivo “'+cfg.path+'” não parece ser dos dados do Circuito Loop. Escolha outro nome de arquivo para não sobrescrevê-lo.');
  const arr=x=>Array.isArray(x)?x:[];
  const list=arr(d.subjects).filter(s=>typeof s==='string'&&s.trim());
  const index=list.length?Math.max(0,Math.min(Math.floor(Number(d.currentIndex))||0,list.length-1)):0;
  return{data:{records:normRecords(arr(d.records)),subjects:{list,index},circuits:arr(d.circuits).filter(x=>x&&x.id&&Array.isArray(x.subjects)),flashcards:arr(d.flashcards).filter(x=>x&&x.id),caderno:arr(d.cadernoErradas).filter(x=>x&&x.id),settings:{weeklyGoalHours:Math.max(0,Math.min(168,Number(d.settings&&d.settings.weeklyGoalHours)||0))}},changedAt:(d.sync&&d.sync.changedAt)||{},tombstones:(d.sync&&d.sync.tombstones)||{}};
}

/* ---------- Mesclagem em três vias: último estado sincronizado × local × remoto ---------- */
function keyed(col,arr){
  const m=new Map();
  if(col==='records'){const seen={};arr.forEach(r=>{const k=J([r.date,r.subject,r.sec,r.q,r.c,r.notes||'']);seen[k]=(seen[k]||0)+1;m.set(k+'#'+seen[k],r)})}
  else arr.forEach(x=>{if(x&&x.id!=null)m.set(String(x.id),x)});
  return m;
}
function mergeKeyed(col,b0,l0,r0,pick){
  const mb=keyed(col,b0),ml=keyed(col,l0),mr=keyed(col,r0),out=[];
  new Set([...mb.keys(),...ml.keys(),...mr.keys()]).forEach(k=>{
    const b=mb.get(k),l=ml.get(k),r=mr.get(k),lc=!same(b,l),rc=!same(b,r);
    let v;
    if(!lc&&!rc)v=b;
    else if(lc&&!rc)v=l;                 /* só mudou aqui (inclusive exclusão) */
    else if(!lc&&rc)v=r;                 /* só mudou no outro aparelho */
    else if(same(l,r))v=l;
    else if(l===undefined)v=r;           /* excluído aqui, editado lá: preserva a edição */
    else if(r===undefined)v=l;
    else v=pick(l,r);                    /* editado nos dois: escolhe um */
    if(v!==undefined)out.push(v);
  });
  return out;
}
function mergeScalar(b,l,r,localNewer){
  const lc=!same(b,l),rc=!same(b,r);
  if(!rc)return l;if(!lc)return r;if(same(l,r))return l;
  return localNewer?l:r;
}
function mergeAll(b0,l0,r0,rts,remoteTombstones){
  /* Registra exclusões locais comparando a última base comum com o estado atual. */
  const tombstones=JSON.parse(J(st.tombstones||{}));
  COLS.filter(c=>c!=='subjects'&&c!=='settings').forEach(col=>{
    const before=keyed(col,b0[col]||[]),now=keyed(col,l0[col]||[]);
    if(!tombstones[col])tombstones[col]={};
    before.forEach((value,key)=>{if(!now.has(key))tombstones[col][key]=Math.max(tombstones[col][key]||0,Date.now())});
    Object.assign(tombstones[col],remoteTombstones&&remoteTombstones[col]||{});
  });
  st.tombstones=tombstones;persist();
  const newer=col=>(st.changedAt[col]||0)>=(rts[col]||0);
  const pick=col=>(l,r)=>(col==='flashcards'&&Number.isFinite(l.due)&&Number.isFinite(r.due)&&l.due!==r.due)?(l.due>r.due?l:r):(newer(col)?l:r);
  const m={records:null,subjects:null,circuits:null,flashcards:null,caderno:null,settings:null}; /* mesma ordem de chaves de snap()/fromRemote(), pois same() compara JSON */
  ['records','circuits','flashcards','caderno'].forEach(col=>{m[col]=mergeKeyed(col,b0[col],l0[col],r0[col],pick(col))});
  m.subjects=mergeScalar(b0.subjects,l0.subjects,r0.subjects,newer('subjects'));
  m.settings=mergeScalar(b0.settings||{weeklyGoalHours:0},l0.settings||{weeklyGoalHours:0},r0.settings||{weeklyGoalHours:0},newer('settings'));
  /* Uma exclusão explícita prevalece sobre cópias antigas em qualquer aparelho. */
  ['records','circuits','flashcards','caderno'].forEach(col=>{
    const deleted=tombstones[col]||{},kept=[];
    keyed(col,m[col]).forEach((item,key)=>{if(!deleted[key])kept.push(item)});
    m[col]=kept;
  });
  return m;
}

/* ---------- Aplica o resultado nos dados do app ---------- */
function apply(m){
  applying=true;
  try{
    const cur=snap();
    if(!same(cur.records,m.records)){records=m.records;save()}
    if(!same(cur.subjects,m.subjects)){
      subjects=m.subjects.list.slice();
      currentIndex=subjects.length?Math.max(0,Math.min(m.subjects.index|0,subjects.length-1)):0;
      localStorage.setItem(SUBKEY,J(subjects));localStorage.setItem(INDEXKEY,String(currentIndex));renderSubjects();
    }
    if(!same(cur.circuits,m.circuits)){circuits=m.circuits;localStorage.setItem(CIRCUITS_KEY,J(circuits));renderCircuitChoices()}
    if(!same(cur.flashcards,m.flashcards)){flashcards=m.flashcards;fcSave()}
    if(!same(cur.caderno,m.caderno)){cadernoErradas=m.caderno;ceSave()}
    if(!same(cur.settings,m.settings)){localStorage.setItem(WEEKLY_GOAL_KEY,String(Math.max(0,Math.min(168,Number(m.settings?.weeklyGoalHours)||0))));if(typeof renderDashboard==='function'&&$('dashboardPage')&&!$('dashboardPage').hidden)renderDashboard()}
  }finally{applying=false}
}

/* ---------- Sincronização ---------- */
/* ---------- Imagens: um arquivo por imagem, na pasta circuito-loop-imagens ---------- */
const imgDir=()=>{const i=cfg.path.lastIndexOf('/');return (i>=0?cfg.path.slice(0,i+1):'')+'circuito-loop-imagens'};
const imgApi=name=>'/repos/'+cfg.repo+'/contents/'+(imgDir()+(name?'/'+name:'')).split('/').map(encodeURIComponent).join('/');
async function ghPutImage(id,buf){
  const body={message:'Circuito Loop: imagem '+id,content:CircuitoImg.bufToBase64(buf)};if(cfg.branch)body.branch=cfg.branch;
  for(let i=0;i<3;i++){
    const res=await api(imgApi(id+'.jpg'),{method:'PUT',headers:{'Content-Type':'application/json'},body:J(body)});
    if(res.ok||res.status===422)return;           /* 422 = já existe no repositório */
    if(res.status===409&&i<2){await new Promise(r=>setTimeout(r,600));continue}
    throw httpErr(res.status);
  }
}
const imgUnusedDir=()=>{const i=cfg.path.lastIndexOf('/');return (i>=0?cfg.path.slice(0,i+1):'')+'circuito-loop-imagens-nao-utilizadas'};
const imgUnusedApi=name=>'/repos/'+cfg.repo+'/contents/'+(imgUnusedDir()+(name?'/'+name:'')).split('/').map(encodeURIComponent).join('/');
async function syncImages(m){
  const ids=[...new Set(m.caderno.flatMap(c=>[c&&c.image,...Object.values(c&&c.images||{})]).filter(Boolean))];
  if(!ids.length)return;
  const q=cfg.branch?'?ref='+encodeURIComponent(cfg.branch):'';
  const remoteSet=new Set(),lr=await api(imgApi('')+q);
  if(lr.ok){const arr=await lr.json();if(Array.isArray(arr))arr.forEach(f=>{if(f&&f.name)remoteSet.add(String(f.name).replace(/\.jpg$/,''))})}
  else if(lr.status!==404)throw httpErr(lr.status);
  for(const id of ids){                                   /* 1º envia (antes de publicar o JSON que as cita) */
    if(remoteSet.has(id))continue;
    let buf=await CircuitoImg.getBuffer(id).catch(()=>null);
    if(!buf){                                            /* questão restaurada (ex.: "Desfazer"): busca a imagem na pasta de não utilizadas */
      try{const r=await api(imgUnusedApi(id+'.jpg')+q,{headers:{'Accept':'application/vnd.github.raw+json'}});if(r.ok){const b=await r.arrayBuffer();if(b.byteLength){await CircuitoImg.putBuffer(id,b);buf=b}}}catch(e){}
    }
    if(buf)await ghPutImage(id,buf);
  }
  for(const id of ids){                                   /* 2º baixa as que faltam neste aparelho */
    if(!remoteSet.has(id)||await CircuitoImg.has(id))continue;
    try{const r=await api(imgApi(id+'.jpg')+q,{headers:{'Accept':'application/vnd.github.raw+json'}});if(r.ok){const b=await r.arrayBuffer();if(b.byteLength)await CircuitoImg.putBuffer(id,b)}}catch(e){}
  }
}

/* Move para circuito-loop-imagens-nao-utilizadas as imagens que estavam em uso e deixaram de ser citadas por qualquer questão.
   Só considera imagens que já foram citadas em dados sincronizados (base/remoto/local), então nunca mexe numa imagem
   que outro aparelho acabou de enviar e ainda não publicou. Usa a Git Data API: um único commit move todas. */
async function archiveUnusedImages(merged,sources){
  const refs=new Set((merged.caderno||[]).flatMap(c=>[c&&c.image,...Object.values(c&&c.images||{})]).filter(Boolean));
  const cand=new Set();
  sources.forEach(d=>{if(d&&Array.isArray(d.caderno))d.caderno.forEach(c=>{[c&&c.image,...Object.values(c&&c.images||{})].filter(Boolean).forEach(id=>{if(!refs.has(id))cand.add(id)})})});
  if(!cand.size)return;
  const q=cfg.branch?'?ref='+encodeURIComponent(cfg.branch):'';
  const lr=await api(imgApi('')+q);if(!lr.ok)return;
  const arr=await lr.json();if(!Array.isArray(arr))return;
  const files=arr.filter(f=>f&&f.type==='file'&&f.sha&&cand.has(String(f.name).replace(/\.jpg$/,'')));
  if(!files.length)return;
  const enc=x=>x.split('/').map(encodeURIComponent).join('/');
  let br=cfg.branch;
  if(!br){const rr=await api('/repos/'+cfg.repo);if(!rr.ok)return;br=(await rr.json()).default_branch}
  const refR=await api('/repos/'+cfg.repo+'/git/ref/heads/'+enc(br));if(!refR.ok)return;
  const head=(await refR.json()).object.sha;
  const cR=await api('/repos/'+cfg.repo+'/git/commits/'+head);if(!cR.ok)return;
  const baseTree=(await cR.json()).tree.sha;
  const from=imgDir(),to=imgUnusedDir(),tree=[];
  files.forEach(f=>{tree.push({path:to+'/'+f.name,mode:'100644',type:'blob',sha:f.sha});tree.push({path:from+'/'+f.name,mode:'100644',type:'blob',sha:null})});
  const hdr={'Content-Type':'application/json'};
  const tR=await api('/repos/'+cfg.repo+'/git/trees',{method:'POST',headers:hdr,body:J({base_tree:baseTree,tree})});if(!tR.ok)return;
  const tSha=(await tR.json()).sha;
  const mR=await api('/repos/'+cfg.repo+'/git/commits',{method:'POST',headers:hdr,body:J({message:'Circuito Loop: '+files.length+(files.length===1?' imagem movida':' imagens movidas')+' para não utilizadas',tree:tSha,parents:[head]})});if(!mR.ok)return;
  const cSha=(await mR.json()).sha;
  await api('/repos/'+cfg.repo+'/git/refs/heads/'+enc(br),{method:'PATCH',headers:hdr,body:J({sha:cSha})});
}

async function syncNow(manual){
  if(!cfg)return;
  if(busy){again=true;return}
  if(mode!=='idle'){if(manual)setMsg('Finalize ou descarte a sessão de estudo em andamento antes de sincronizar.',true);else scheduleSync(15000);return}
  if(!navigator.onLine){refreshBadge();if(manual)setMsg('Sem conexão com a internet. As alterações serão enviadas quando ela voltar.',true);return}
  busy=true;lastError='';authFail=false;refreshBadge();if(manual)setMsg('Sincronizando…');
  try{
    for(let i=0;i<3;i++){
      const rem=await ghGet();
      let remote=null,rts={},remoteTombstones={};
      if(rem.text&&rem.text.trim()){
        let d;try{d=JSON.parse(rem.text)}catch(e){throw new Error('O arquivo no GitHub não é um JSON válido; nada foi alterado.')}
        const p=fromRemote(d);remote=p.data;rts=p.changedAt;remoteTombstones=p.tombstones||{};
      }
      const local=snap(),prevBase=st.base,merged=remote?mergeAll(st.base,local,remote,rts,remoteTombstones):mergeAll(st.base,local,local,rts,remoteTombstones);
      if(window.CircuitoImg)await syncImages(merged);
      const ts={};COLS.forEach(c=>{ts[c]=Math.max(st.changedAt[c]||0,rts[c]||0)});
      if(!remote||!same(remote,merged)||!same(remoteTombstones,st.tombstones)){
        try{await ghPut(toRemote(merged,ts,st.tombstones),rem.sha)}catch(e){if((e.status===409||e.status===422)&&i<2)continue;throw e}
      }
      if(window.CircuitoImg)await archiveUnusedImages(merged,[prevBase,remote,local]).catch(()=>{});   /* depois de publicar o JSON; falha aqui não quebra a sincronização */
      if(same(snap(),local)){apply(merged);st.base=snap();st.changedAt=ts;st.dirty=false}
      else again=true; /* algo mudou durante a sincronização: roda de novo em seguida */
      st.lastSync=Date.now();persist();break;
    }
    if(manual)setMsg('Sincronizado em '+new Date(st.lastSync).toLocaleString('pt-BR')+'.');
  }catch(e){
    authFail=!!(e&&e.status===401);lastError=(e instanceof TypeError)?'Falha de rede. Verifique sua conexão.':(e.message||String(e));
    if(manual||!$('syncModal').hidden)setMsg(lastError,true);
  }finally{
    busy=false;refreshBadge();
    if(again){again=false;setTimeout(()=>syncNow(false),2000)}
  }
}

/* ---------- Janela de configuração ---------- */
function openModal(){
  $('syncRepo').value=cfg?cfg.repo:'';
  $('syncToken').value=cfg?cfg.token:'';
  $('syncPath').value=cfg?cfg.path:'circuito-loop-dados.json';
  $('syncBranch').value=cfg?(cfg.branch||''):'';
  $('syncAuto').checked=cfg?cfg.auto!==false:true;$('syncExpires').value=cfg?(cfg.expires||''):'';
  $('syncDisconnect').hidden=!cfg;
  setMsg(cfg&&st.lastSync?'Última sincronização: '+new Date(st.lastSync).toLocaleString('pt-BR')+'.':'');
  $('syncModal').hidden=false;
  $('syncRepo').focus();
}
async function saveAndSync(){
  const repo=$('syncRepo').value.trim().replace(/^https?:\/\/github\.com\//i,'').replace(/\.git$/i,'').replace(/\/+$/,'');
  const token=$('syncToken').value.trim();
  const path=($('syncPath').value.trim()||'circuito-loop-dados.json').replace(/^\/+/,'');
  const branch=$('syncBranch').value.trim();
  if(!/^[\w.-]+\/[\w.-]+$/.test(repo)){setMsg('Informe o repositório no formato usuario/repositorio.',true);return}
  if(!token){setMsg('Informe o token de acesso do GitHub.',true);return}
  const moved=!cfg||cfg.repo!==repo||cfg.path!==path||(cfg.branch||'')!==branch;
  if(moved){st.base=emptyData();st.dirty=true;delete st.lastSync}   /* novo destino: une tudo na primeira vez */
  const tokenChanged=!cfg||cfg.token!==token;cfg={repo,token,path,branch,auto:$('syncAuto').checked,expires:$('syncExpires').value||''};if(tokenChanged){st.tokenExp=0;authFail=false}
  try{localStorage.setItem(CFG_KEY,J(cfg))}catch(e){}
  persist();lastError='';refreshBadge();
  $('syncDisconnect').hidden=false;
  await syncNow(true);
}
btn.onclick=openModal;
$('syncSave').onclick=saveAndSync;
$('syncClose').onclick=()=>{$('syncModal').hidden=true};
$('syncModal').addEventListener('click',e=>{if(e.target===$('syncModal'))$('syncModal').hidden=true});
$('syncDisconnect').onclick=()=>{
  if(!confirm('Desconectar do GitHub neste aparelho? Seus dados locais e o arquivo no GitHub serão mantidos; apenas o token e a configuração serão apagados daqui.'))return;
  clearTimeout(timer);cfg=null;st={base:emptyData(),changedAt:st.changedAt||{}};
  try{localStorage.removeItem(CFG_KEY);localStorage.removeItem(ST_KEY)}catch(e){}
  lastError='';refreshBadge();$('syncModal').hidden=true;
};

/* ---------- Backup JSON completo e importação de CSV ---------- */
function saveFile(blob,name){
  const a=document.createElement('a'),url=URL.createObjectURL(blob);
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
}
async function shareOrSave(blob,name){
  try{
    const file=new File([blob],name,{type:blob.type});
    if(matchMedia('(pointer:coarse)').matches&&navigator.canShare&&navigator.canShare({files:[file]})){
      try{await navigator.share({files:[file],title:name});return 'shared'}catch(e){if(e.name==='AbortError')return 'cancel'}
    }
  }catch(e){}
  saveFile(blob,name);return 'saved';
}
$('syncExportJson').onclick=async()=>{
  try{
    const m=snap(),d=new Date(),p=n=>String(n).padStart(2,'0');setMsg('Gerando o backup…');
    const data={app:'circuito-loop',version:6,exportedAt:d.toISOString(),records:m.records,subjects:m.subjects.list,currentIndex:m.subjects.index,circuits:m.circuits,flashcards:m.flashcards,cadernoErradas:m.caderno};
    const imgIds=[...new Set(m.caderno.flatMap(c=>[c&&c.image,...Object.values(c&&c.images||{})]).filter(Boolean))];data.images={};let imgMissing=0;
    for(const id of imgIds){const u=window.CircuitoImg?await CircuitoImg.toDataURL(id).catch(()=>null):null;if(u)data.images[id]=u;else imgMissing++}
    const imgNote=imgIds.length?', '+(imgIds.length-imgMissing)+' imagens'+(imgMissing?' ('+imgMissing+' ainda não baixadas neste aparelho: sincronize e gere o backup de novo)':''):'';
    const name=p(d.getDate())+'-'+p(d.getMonth()+1)+'-'+d.getFullYear()+'-'+p(d.getHours())+'-'+p(d.getMinutes())+'-circuito-loop-backup.json';
    const r=await shareOrSave(new Blob([J(data,null,1)],{type:'application/json'}),name);
    if(r!=='cancel')setMsg('Backup gerado: '+m.records.length+' registros de estudo, '+m.subjects.list.length+' matérias do circuito, '+m.circuits.length+' circuitos, '+m.flashcards.length+' flashcards e '+m.caderno.length+' questões erradas'+imgNote+'.');
  }catch(e){setMsg('Não foi possível gerar o backup: '+(e.message||e),true)}
};
const syncNames=a=>{const l=a.slice(0,8).join(', ');return l+(a.length>8?' e mais '+(a.length-8):'')};
/* ---------- Importação de CSV: resumo, itens repetidos e escolha do que importar ---------- */
let csvPlan=null,csvLabel='',csvImageFiles=[],csvSourceName='';
const CSV_IMPORT_LOG_KEY='circuito_loop_csv_import_log_v1';
function csvImportLogRead(){try{const a=JSON.parse(localStorage.getItem(CSV_IMPORT_LOG_KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return []}}
function csvImportLogAdd(name,count){const a=csvImportLogRead();a.unshift({at:Date.now(),name:String(name||'Arquivo CSV'),count:Number(count)||0});try{localStorage.setItem(CSV_IMPORT_LOG_KEY,JSON.stringify(a.slice(0,100)))}catch(e){}}
function csvImportLogRender(){const a=csvImportLogRead(),box=$('syncLastImportsList');if(!a.length){box.innerHTML='<p class="note">Nenhuma importação CSV registrada neste aparelho.</p>';return}box.innerHTML='<div style="display:grid;gap:8px">'+a.map(x=>'<div style="padding:10px;border:1px solid var(--line,#cbd5e1);border-radius:8px"><b>'+csvEsc(new Date(x.at).toLocaleString('pt-BR'))+'</b><div>'+csvEsc(x.name)+'</div><small class="note">'+Number(x.count||0)+' '+(Number(x.count)===1?'pergunta importada':'perguntas importadas')+'</small></div>').join('')+'</div>'}
$('syncLastImportsOpen').onclick=()=>{csvImportLogRender();$('syncLastImportsModal').hidden=false};$('syncLastImportsClose').onclick=()=>{$('syncLastImportsModal').hidden=true};$('syncLastImportsModal').addEventListener('click',e=>{if(e.target===$('syncLastImportsModal'))$('syncLastImportsModal').hidden=true});
const csvEsc=t=>String(t).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const csvCut=(t,n)=>{t=String(t).replace(/\s+/g,' ').trim();return t.length>n?t.slice(0,n-1)+'…':t};
function csvDupReason(d,kind){const what=kind==='flashcards'?'resposta':'alternativas';
 const base=d.reason==='app'?'Já existe no app':'Repetida no próprio arquivo (primeira vez na linha '+d.firstLine+')';
 return base+(kind==='flashcards'?' — matéria, pergunta, resposta e categoria iguais':' — matéria, pergunta e alternativas iguais')}
function csvImportUpdate(){const extra=$('csvDupList').querySelectorAll('input:checked').length,total=csvPlan.added+extra;
 $('csvImportGo').textContent=total?'Importar '+total+(total===1?' item':' itens'):'Nada a importar';$('csvImportGo').disabled=!total;
 const all=[...$('csvDupList').querySelectorAll('input')].every(i=>i.checked);$('csvDupToggle').textContent=all?'Desmarcar todos':'Marcar todos'}
function csvImportOpen(fname,plan,label){csvPlan=plan;csvLabel=label;csvSourceName=fname;csvImageFiles=[];
 $('csvImportHeading').textContent='Importar “'+csvCut(fname,40)+'”';
 const L=[plan.added+' '+(plan.added===1?'item novo':'itens novos')+' ('+label+')'];
 if(plan.dupItems.length)L.push(plan.dupItems.length+' repetido'+(plan.dupItems.length>1?'s':'')+' (serão ignorados, a menos que você marque abaixo)');
 if(plan.invalid.length)L.push(plan.invalid.length+' linha'+(plan.invalid.length>1?'s':'')+' incompleta'+(plan.invalid.length>1?'s':'')+' ou inválida'+(plan.invalid.length>1?'s':'')+' (ignorada'+(plan.invalid.length>1?'s':'')+'; linhas '+plan.invalid.slice(0,10).join(', ')+(plan.invalid.length>10?'…':'')+')');
 if(plan.newSubjects.length)L.push('Matérias novas: '+syncNames(plan.newSubjects));
 if(plan.existingSubjects.length)L.push('Matérias existentes que receberão itens: '+syncNames(plan.existingSubjects));
 $('csvImportSummary').innerHTML='<ul class="csv-sum">'+L.map(x=>'<li>'+csvEsc(x)+'</li>').join('')+'</ul>';const imageBox=$('csvImageImport');imageBox.hidden=(plan.kind!=='errors'||!plan.hasImages);$('csvImagesStatus').textContent='Nenhuma imagem selecionada.';$('csvImagesWarnings').textContent='';
 $('csvImportDupBox').hidden=!plan.dupItems.length;$('csvDupCount').textContent=plan.dupItems.length;
 $('csvDupList').innerHTML=plan.dupItems.map((d,k)=>'<label class="csv-dup"><input type="checkbox" data-k="'+k+'"><span><b>Linha '+d.line+'</b> · '+csvEsc(d.subject)+'<br>'+csvEsc(csvCut(d.question,160))+'<br><small>'+csvEsc(csvDupReason(d,plan.kind))+'</small>'+(d.differs&&plan.kind==='flashcards'?'<br><small>No CSV: '+csvEsc(csvCut(d.answer,90))+'<br>'+(d.reason==='app'?'Já cadastrada':'Primeira ocorrência')+': '+csvEsc(csvCut(d.other,90))+'</small>':'')+'</span></label>').join('');
 csvImportUpdate();$('csvImportModal').hidden=false;const dlg=$('csvImportModal').querySelector('.fc-modal-dialog');dlg.scrollTop=0;$('csvImportGo').focus({preventScroll:true})}
$('csvImagesPick').onclick=()=>$('csvImagesInput').click();
$('csvImagesInput').onchange=e=>{csvImageFiles=[...(e.target.files||[])];$('csvImagesStatus').textContent=csvImageFiles.length+' arquivo(s) selecionado(s).';$('csvImagesWarnings').textContent='';};
$('csvDupList').addEventListener('change',csvImportUpdate);
$('csvDupToggle').onclick=()=>{const cs=[...$('csvDupList').querySelectorAll('input')],all=cs.every(i=>i.checked);cs.forEach(i=>i.checked=!all);csvImportUpdate()};
$('csvImportCancel').onclick=()=>{$('csvImportModal').hidden=true;csvPlan=null};
$('csvImportGo').onclick=async()=>{if(!csvPlan)return;const plan=csvPlan,label=csvLabel;
 const extra=[...$('csvDupList').querySelectorAll('input:checked')].map(i=>plan.dupItems[+i.dataset.k].item),items=plan.cards.concat(extra),ignored=plan.dupItems.length-extra.length;
 const imageWarnings=[], imageMap=new Map();
 csvImageFiles.forEach(f=>{const key=f.name.toLocaleLowerCase('pt-BR');if(!imageMap.has(key))imageMap.set(key,f);else imageWarnings.push('Arquivo duplicado selecionado: '+f.name)});
 const referenced=new Set(items.flatMap(c=>[c.imageName,...(c.imageNames||[])].filter(Boolean)).map(n=>n.toLocaleLowerCase('pt-BR')));
 for(const name of referenced){if(!imageMap.has(name))imageWarnings.push('Imagem não selecionada: '+name)}for(const name of imageMap.keys()){if(!referenced.has(name))imageWarnings.push('Imagem selecionada sem referência no CSV: '+name)}
 for(const c of items){const names=[...new Set([c.imageName,...(c.imageNames||[])].filter(Boolean))];for(const name of names){const f=imageMap.get(name.toLocaleLowerCase('pt-BR'));if(!f)continue;try{const packed=await CircuitoImg.compress(f);await CircuitoImg.putBuffer(packed.id,packed.buf,'image/jpeg');c.images=c.images||{};c.images[name]=packed.id;if(c.imageName===name)c.image=packed.id}catch(err){imageWarnings.push('Falha ao processar '+name+': '+(err&&err.message||err))}}}
 if(imageWarnings.length){$('csvImagesWarnings').textContent=imageWarnings.join(' | ');if(!confirm('Ocorreram avisos no vínculo das imagens. Deseja importar as questões mesmo assim?'))return}
 if(!items.length)return;
 const stamp=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
 if(plan.kind==='flashcards'){
  items.forEach(c=>flashcards.push(Object.assign({id:'fc'+stamp(),subject:c.subject,question:c.question,answer:c.answer,due:0,stage:0},c.category?{category:c.category}:{})));fcSave();
 }else{
  items.forEach((c,i)=>cadernoErradas.push({id:'ce'+stamp(),createdAt:Date.now()+i,subject:c.subject,question:c.question,options:c.options,correct:c.correct,...(c.image?{image:c.image}:{}),...(c.images?{images:c.images}:{}),...(c.comment?{comment:c.comment}:{})}));ceSave();
 }
 csvImportLogAdd(csvSourceName,items.length);csvPlan=null;csvImageFiles=[];$('csvImagesInput').value='';$('csvImportModal').hidden=true;$('syncModal').hidden=true;
 undoShow('Importação concluída: '+items.length+' '+label+' adicionados'+(extra.length?' (incluindo '+extra.length+' repetido'+(extra.length>1?'s':'')+')':'')+(ignored?', '+ignored+' repetido'+(ignored>1?'s':'')+' ignorado'+(ignored>1?'s':''):'')+'.',null,6000)};
$('syncImportCsv').onclick=()=>{$('syncCsvFile').click()};$('ceImportCsv').onclick=()=>{$('syncCsvFile').click()};$('fcImportCsv').onclick=()=>{$('syncCsvFile').click()};
$('syncCsvFile').onchange=async ev=>{
  const f=ev.target.files&&ev.target.files[0];ev.target.value='';
  if(!f)return;
  try{
    const buf=await f.arrayBuffer();let text;
    try{text=new TextDecoder('utf-8',{fatal:true}).decode(buf)}catch(_){text=new TextDecoder('windows-1252').decode(buf)}
    const plan=CircuitoCsv.planImport(text,{subjects,flashcards,cadernoErradas});
    if(plan.kind==='errors'){
      const all=[...plan.cards,...plan.dupItems.map(d=>d.item)];
      all.forEach(c=>{
        const names=[...(c.imageNames||[])];
        const addName=name=>{name=String(name||'').trim();if(name&&!names.some(n=>String(n).toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR')))names.push(name)};
        // A coluna Imagem passa a usar o mesmo marcador dos demais campos.
        // Mantém compatibilidade com CSVs antigos que informavam apenas o nome do arquivo.
        if(c.imageName){const marker=String(c.imageName).match(/^\s*\{\{imagem:([^{}]+)\}\}\s*$/i);if(marker)c.imageName=marker[1].trim();addName(c.imageName)}
        const re=/\{\{imagem:([^{}]+)\}\}/gi;
        const fields=[c.question,c.comment,...Object.values(c.options||{})];
        fields.forEach(value=>{let m;re.lastIndex=0;while((m=re.exec(String(value||'')))!==null)addName(m[1])});
        if(names.length)c.imageNames=names;
      });
    }
    const label=plan.kind==='flashcards'?'flashcards':'questões do Caderno de Erradas';
    plan.hasImages=plan.kind==='errors'&&[...plan.cards,...plan.dupItems.map(d=>d.item)].some(c=>[c.imageName,...(c.imageNames||[])].some(Boolean));
    if(!plan.added&&!plan.dupItems.length){setMsg('Nada novo para importar de “'+f.name+'”.'+(plan.invalid.length?' '+plan.invalid.length+' linha(s) incompleta(s) ou inválida(s).':''),!!plan.invalid.length);return}
    if(!$('ceModal').hidden)$('ceModal').hidden=true;if(!$('fcModal').hidden)$('fcModal').hidden=true;csvImportOpen(f.name,plan,label);
    if(!plan.hasImages&&!plan.dupItems.length&&!plan.invalid.length){$('csvImportGo').click()}
  }catch(e){setMsg(e.message||'Não foi possível ler o arquivo CSV.',true)}
};

/* ---------- Rodapé: estado da sincronização ---------- */
/* ---------- Validade do token ---------- */
function tokenInfo(){
  let ts=st.tokenExp||0;
  if(!ts&&cfg&&cfg.expires){const t=new Date(cfg.expires+'T23:59:59').getTime();ts=Number.isFinite(t)?t:0}
  if(!ts)return null;
  const day=x=>{const d=new Date(x);return new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime()};
  const days=Math.round((day(ts)-day(Date.now()))/864e5),expired=ts<=Date.now();
  const text=expired?'expirou':days<=0?'expira hoje':days===1?'expira amanhã':'expira em '+days+' dias';
  return{ts,days,expired,soon:!expired&&days<=14,text};
}
function footerRefresh(){
  const t=$('syncFooterText'),b=$('syncFooterBtn');if(!t||!b)return;
  let label,color='',title='Abrir configurações de sincronização';
  const ti=cfg?tokenInfo():null;
  if(!cfg){label='Sincronização não configurada'}
  else if(authFail){label='Token inválido ou expirado — toque para corrigir';color='#B60020';title='O GitHub recusou o token. Gere um novo e atualize em Sincronizar.'}
  else if(ti&&ti.expired){label='Token expirado — gere outro e atualize aqui';color='#B60020';title='O token do GitHub expirou.'}
  else if(lastError){label='Falha ao sincronizar';color='#B60020';title=lastError}
  else if(busy){label='Sincronizando…'}
  else if(!navigator.onLine){label='Sem conexão — alterações pendentes'}
  else if(st.dirty){label='Alterações pendentes'}
  else if(st.lastSync){
    const d=new Date(st.lastSync),hm=d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    label=d.toDateString()===new Date().toDateString()?'Sincronizado às '+hm:'Sincronizado em '+d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+' às '+hm;
  }else label='Sincronizado';
  if(!color&&ti&&ti.soon){label+=' · token '+ti.text;color='#B45309';title='O token do GitHub '+ti.text+'. Gere outro e atualize em Sincronizar.'}
  t.textContent=label;b.style.setProperty('color',color||'inherit','important');b.title=title;b.setAttribute('aria-label',label);
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshBadge()});
$('syncFooterBtn').onclick=()=>{$('syncOpen').click()};

/* ---------- Importar backup JSON ---------- */
let pendingBackup=null;
function parseBackup(text){
  let d;try{d=JSON.parse(text)}catch(e){throw new Error('Este arquivo não é um JSON válido.')}
  if(Array.isArray(d))d={records:d};                       /* formato antigo: só o histórico */
  const arr=x=>Array.isArray(x)?x:[],num=x=>{x=Math.round(Number(x));return Number.isFinite(x)&&x>0?x:0};
  if(!d||typeof d!=='object'||!(d.app==='circuito-loop'||['records','subjects','flashcards','cadernoErradas','circuits'].some(k=>Array.isArray(d[k]))))throw new Error('Este arquivo não parece ser um backup do Circuito Loop.');
  const str=x=>typeof x==='string'&&x.trim()!=='';
  const records=arr(d.records).filter(r=>r&&typeof r==='object'&&r.date&&r.subject!=null).map(r=>{const q=num(r.q);return{...r,date:String(r.date),subject:String(r.subject),sec:num(r.sec),q,c:Math.min(num(r.c),q),notes:r.notes?String(r.notes):''}});
  const list=arr(d.subjects).filter(str).map(x=>x.trim());
  const idx=list.length?Math.max(0,Math.min(Math.floor(Number(d.currentIndex))||0,list.length-1)):0;
  const circuitsIn=arr(d.circuits).filter(x=>x&&x.id&&Array.isArray(x.subjects));
  const cards=arr(d.flashcards).filter(x=>x&&x.id&&str(x.subject)&&str(x.question)&&str(x.answer));
  const errs=arr(d.cadernoErradas).filter(x=>x&&x.id&&str(x.subject)&&str(x.question)&&x.options&&typeof x.options==='object'&&['A','B','C','D','E'].every(l=>str(x.options[l]))&&/^[A-E]$/.test(x.correct));
  const images={};if(d.images&&typeof d.images==='object')Object.keys(d.images).forEach(id=>{const v=d.images[id];if(/^[\w-]{6,64}$/.test(id)&&typeof v==='string'&&/^data:image\/[\w.+-]+;base64,/.test(v))images[id]=v});
  return{records,subjects:list,currentIndex:idx,circuits:circuitsIn,flashcards:cards,caderno:errs,images,exportedAt:d.exportedAt||''};
}
async function importImages(b){
  let n=0;
  for(const id of Object.keys(b.images)){
    try{if(await CircuitoImg.has(id))continue;const v=b.images[id],i=v.indexOf(',');await CircuitoImg.putBuffer(id,CircuitoImg.base64ToBuf(v.slice(i+1)),v.slice(5,v.indexOf(';')));n++}catch(e){}
  }
  return n;
}
const recKey=r=>J([r.date,r.subject,r.sec,r.q,r.c,r.notes||'']);
async function importMerge(b){
  const have=new Map();records.forEach(r=>have.set(recKey(r),(have.get(recKey(r))||0)+1));
  const seen=new Map();let addR=0;
  b.records.forEach(r=>{const k=recKey(r);seen.set(k,(seen.get(k)||0)+1);if(seen.get(k)>(have.get(k)||0)){records.push(r);addR++}});
  const addById=(target,src)=>{const ids=new Set(target.map(x=>x&&x.id));let n=0;src.forEach(x=>{if(!ids.has(x.id)){target.push(x);ids.add(x.id);n++}});return n};
  const addC=addById(circuits,b.circuits),addF=addById(flashcards,b.flashcards),addE=addById(cadernoErradas,b.caderno);
  let subjChanged=false;
  if(!subjects.length&&b.subjects.length){subjects=b.subjects.slice();currentIndex=b.currentIndex;subjChanged=true}
  const addI=await importImages(b);
  if(addR)save();
  if(subjChanged){localStorage.setItem(SUBKEY,J(subjects));localStorage.setItem(INDEXKEY,String(currentIndex));renderSubjects()}
  if(addC){localStorage.setItem(CIRCUITS_KEY,J(circuits));renderCircuitChoices()}
  if(addF)fcSave();
  if(addE)ceSave();
  const parts=[];if(addR)parts.push(addR+' registros de estudo');if(addF)parts.push(addF+' flashcards');if(addE)parts.push(addE+' questões erradas');if(addC)parts.push(addC+' circuitos');if(subjChanged)parts.push('matérias do circuito');if(addI)parts.push(addI+' imagens');
  return parts.length?'Backup mesclado. Adicionado: '+parts.join(', ')+'.':'Nada novo: tudo o que está no backup já existe neste aparelho.';
}
async function importReplace(b){
  records=b.records;subjects=b.subjects.slice();currentIndex=b.currentIndex;circuits=b.circuits;flashcards=b.flashcards;cadernoErradas=b.caderno;
  const addI=await importImages(b);
  localStorage.setItem(SUBKEY,J(subjects));localStorage.setItem(INDEXKEY,String(currentIndex));
  localStorage.setItem(CIRCUITS_KEY,J(circuits));renderSubjects();renderCircuitChoices();
  save();fcSave();ceSave();
  return 'Backup restaurado: '+records.length+' registros de estudo, '+flashcards.length+' flashcards, '+cadernoErradas.length+' questões erradas e '+circuits.length+' circuitos'+(addI?', '+addI+' imagens novas':'')+'.';
}
$('syncImportJson').onclick=()=>{
  if(mode!=='idle'){setMsg('Finalize ou descarte a sessão de estudo em andamento antes de importar.',true);return}
  $('syncJsonFile').click();
};
$('syncJsonFile').onchange=async ev=>{
  const f=ev.target.files&&ev.target.files[0];ev.target.value='';if(!f)return;
  try{
    const b=parseBackup(await f.text());pendingBackup=b;
    const info=[b.records.length+' registros de estudo',b.flashcards.length+' flashcards',b.caderno.length+' questões erradas',b.circuits.length+' circuitos',b.subjects.length+' matérias do circuito',Object.keys(b.images).length+' imagens'];
    $('syncImportInfo').textContent='“'+f.name+'”'+(b.exportedAt?' (gerado em '+new Date(b.exportedAt).toLocaleString('pt-BR')+')':'')+' contém: '+info.join(', ')+'.';
    $('syncImportModal').hidden=false;
  }catch(e){pendingBackup=null;setMsg(e.message||'Não foi possível ler o backup.',true)}
};
$('syncImportCancel').onclick=()=>{pendingBackup=null;$('syncImportModal').hidden=true};
$('syncImportModal').addEventListener('click',e=>{if(e.target===$('syncImportModal'))$('syncImportCancel').click()});
$('syncImportMerge').onclick=async()=>{
  const b=pendingBackup;if(!b)return;$('syncImportModal').hidden=true;pendingBackup=null;
  try{setMsg(await importMerge(b))}catch(e){setMsg('Falha ao importar: '+(e.message||e),true)}
};
$('syncImportReplace').onclick=async()=>{
  const b=pendingBackup;if(!b)return;
  if(!confirm('Substituir TODOS os dados deste aparelho pelo conteúdo do backup?\n\nO que você tem agora será apagado. Se não tiver certeza, cancele e gere antes um backup dos dados atuais.'))return;
  $('syncImportModal').hidden=true;pendingBackup=null;
  try{setMsg(await importReplace(b))}catch(e){setMsg('Falha ao importar: '+(e.message||e),true)}
};

/* ---------- Gatilhos automáticos ---------- */
document.addEventListener('visibilitychange',()=>{
  if(!cfg||!cfg.auto)return;
  if(document.visibilityState==='hidden'){if(st.dirty)syncNow(false)}
  else if(Date.now()-(st.lastSync||0)>60000)syncNow(false);
});
window.addEventListener('online',()=>{refreshBadge();scheduleSync(1500)});
window.addEventListener('offline',refreshBadge);
refreshBadge();
if(cfg&&cfg.auto)setTimeout(()=>syncNow(false),1500);
})();

})();
