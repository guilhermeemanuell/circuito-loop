/* Circuito Loop — código extraído do bloco inline 4 do index.html. */
if("serviceWorker"in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").catch(e=>console.warn("Service worker não registrado:",e))});}try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
// Recalcula os cartões vazios quando o layout muda entre desktop e celular.
if(!window.__ceCatalogColumnsListener){
 window.__ceCatalogColumnsListener=true;
 const ceColumnsQuery=window.matchMedia('(max-width:640px)');
 const ceRefreshCatalog=()=>{if(!$('errorsPage').hidden)ceRender()};
 if(ceColumnsQuery.addEventListener)ceColumnsQuery.addEventListener('change',ceRefreshCatalog);
 else ceColumnsQuery.addListener(ceRefreshCatalog);
}
