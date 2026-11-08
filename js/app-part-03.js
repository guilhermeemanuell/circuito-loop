/* Circuito Loop — código extraído do bloco inline 3 do index.html. */
(function(){
const modal=document.getElementById('exportModal'),msg=document.getElementById('exportMsg'),open=document.getElementById('exportOpen');
function close(){modal.hidden=true;open.focus()}
const kindSel=()=>modal.querySelector('input[name=exportKind]:checked');
const box=document.getElementById('exportSubjects'),list=document.getElementById('exportSubjectList'),toggle=document.getElementById('exportToggleAll');
function esc(t){return String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function refreshSubjects(){const k=kindSel()&&kindSel().value;if(k!=='flashcards'&&k!=='errors'){box.hidden=true;return}
try{const d={flashcards:read('circuitoLoop.flashcards.v1'),cadernoErradas:read('circuitoLoop.cadernoErradas.v1')},subs=CircuitoCsv.subjects(k,d);
list.innerHTML=subs.length?subs.map(s=>'<label><input type="checkbox" name="exportSubject" value="'+esc(s.key)+'" checked><span>'+esc(s.name)+' <small>('+s.count+')</small></span></label>').join(''):'<p class="note" style="margin:0">Nenhuma matéria cadastrada.</p>';
box.hidden=false;toggle.hidden=!subs.length;toggle.textContent='Desmarcar todas'}catch(e){box.hidden=true}}
toggle.onclick=()=>{const cs=[...list.querySelectorAll('input')],all=cs.every(c=>c.checked);cs.forEach(c=>c.checked=!all);toggle.textContent=all?'Marcar todas':'Desmarcar todas'};
list.addEventListener('change',()=>{toggle.textContent=[...list.querySelectorAll('input')].every(c=>c.checked)?'Desmarcar todas':'Marcar todas'});
modal.querySelectorAll('input[name=exportKind]').forEach(r=>r.addEventListener('change',()=>{msg.textContent='';refreshSubjects()}));
open.onclick=()=>{modal.hidden=false;msg.textContent='';refreshSubjects();kindSel().focus()};
document.getElementById('exportClose').onclick=close;
modal.addEventListener('click',e=>{if(e.target===modal)close()});
modal.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
function read(key){const data=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(data))throw new Error('Não foi possível ler os dados salvos.');return data}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
document.getElementById('exportDownload').onclick=async()=>{
try{const selected=kindSel();if(!selected)return;
const exportData={records:read('circuitoLoop.v1'),flashcards:read('circuitoLoop.flashcards.v1'),cadernoErradas:read('circuitoLoop.cadernoErradas.v1')};let result;if(selected.value==='all')result=CircuitoCsv.buildAll(exportData);
else if(selected.value==='flashcards'||selected.value==='errors'){const keys=[...list.querySelectorAll('input[name=exportSubject]:checked')].map(i=>i.value);if(!keys.length){msg.textContent='Selecione ao menos uma matéria.';return}result=CircuitoCsv.buildBySubject(selected.value,exportData,keys,document.getElementById('exportMerge').checked)}
else result=CircuitoCsv.build(selected.value,exportData);
if(!result.count){msg.textContent=selected.value==='all'?'Não há nenhum dado cadastrado para exportar.':'Nenhum dado cadastrado nesta categoria.';return}
const blob=result.bytes?new Blob([result.bytes],{type:'application/zip'}):new Blob([result.csv],{type:'text/csv;charset=utf-8'}),file=new File([blob],result.filename,{type:blob.type});
if(matchMedia('(pointer:coarse)').matches&&navigator.canShare?.({files:[file]})){
try{await navigator.share({files:[file],title:result.filename});msg.textContent='Arquivo compartilhado.';return}catch(e){if(e.name==='AbortError')return}
}
download(blob,result.filename);msg.textContent=result.bytes?'Arquivo gerado com '+result.files.length+' CSV(s): '+result.files.join(', ')+'.':'Arquivo CSV gerado.';
}catch(e){msg.textContent='Não foi possível exportar os dados. Tente novamente.'}
};
})();
