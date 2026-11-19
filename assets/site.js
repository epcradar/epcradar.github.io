(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var store={get:function(k){try{return sessionStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{sessionStorage.setItem(k,v)}catch(e){}},del:function(k){try{sessionStorage.removeItem(k)}catch(e){}}};
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- search dialog ---------- */
var dlg=$('#sdlg'), sq=$('#sq'), sres=$('#sres');
var GROUPS={l:'Places',c:'Countries',t:'Type of work',b:'Top 10 projects',j:'Job adverts',p:'Projects',r:'Trades guide',n:'News'};
var ICON={l:'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z',c:'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z',t:'M4 15a8 8 0 0 1 16 0v2H4zM12 7V4',b:'M3 21h18M5 21V10l5 3V10l5 3V6h4v15',j:'M3 7h18v13H3zM9 7V4h6v3',p:'M8 6h13M8 12h13M8 18h13',r:'M4 15a8 8 0 0 1 16 0v2H4z',n:'M4 5h13v14H6a2 2 0 0 1-2-2z'};
function norm(s){return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
function hl(t,q){if(!q)return esc(t);var i=norm(t).indexOf(q);return i<0?esc(t):esc(t.slice(0,i))+'<mark>'+esc(t.slice(i,i+q.length))+'</mark>'+esc(t.slice(i+q.length))}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var act=-1;
function render(qr){
  var q=norm(qr.trim()); var data=window.SEARCH||[];
  if(q&&!window.SEARCH){sres.innerHTML='<div class="grp">Loading the search...</div>';act=-1;return}
  if(!q){sres.innerHTML='<div class="grp">Popular</div><div class="sugg">'+['Welder','Scaffolder','QA/QC','Saudi Arabia','UAE','Mozambique LNG','Saipem','Commissioning'].map(function(s){return '<button class="chip" type="button" data-sugg="'+s+'">'+s+'</button>'}).join('')+'</div>';act=-1;return}
  var words=q.split(/\s+/), out={}, n=0;
  data.forEach(function(it){var hay=norm(it[4]+' '+it[1]); if(words.every(function(w){return hay.indexOf(w)>-1})){(out[it[0]]=out[it[0]]||[]).push(it);n++}});
  if(!n){sres.innerHTML='<div class="empty" style="margin:10px"><h3>Nothing found for "'+esc(qr)+'"</h3><p>Try a trade (welder, rigger), a country, a contractor (Saipem, McDermott) or a project name.</p></div>';return}
  var h='';['l','c','t','b','j','p','r','n'].forEach(function(k){var l=out[k];if(!l)return;h+='<div class="grp">'+GROUPS[k]+' <span style="font-weight:400">('+l.length+')</span></div>';
    l.slice(0,k==='j'?8:6).forEach(function(it){h+='<a class="it" role="option" href="'+it[3]+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="'+ICON[k]+'"/></svg><span><span class="t">'+hl(it[1],words[0])+'</span><br><span class="d">'+esc(it[2])+'</span></span></a>'});
    if(k==='j'&&l.length>8)h+='<a class="it" href="jobs.html" data-jq="'+esc(qr)+'"><span></span><span class="t">See all '+l.length+' matching adverts</span></a>';});
  sres.innerHTML=h;act=-1;
}
// indice della ricerca globale (circa 95 KB): si scarica solo quando si apre la ricerca, non a ogni pagina (19/11, 3G)
var SBASE=(document.currentScript&&document.currentScript.src||'').replace(/site\.js.*$/,'')||'assets/', sload=false;
function needIndex(){if(window.SEARCH||sload)return; sload=true; var x=document.createElement('script'); x.src=SBASE+'search-index.js'; x.onload=function(){if(dlg&&dlg.open)render(sq.value)}; document.head.appendChild(x)}
function openS(){if(!dlg)return; needIndex(); if(dlg.showModal){dlg.showModal()}else{dlg.setAttribute('open','')} sq.value='';render('');setTimeout(function(){sq.focus()},10)}
function closeS(){dlg&&dlg.close?dlg.close():dlg.removeAttribute('open')}
$$('[data-search]').forEach(function(b){b.addEventListener('click',openS)});
if(dlg){
  sq.addEventListener('input',function(){render(sq.value)});
  dlg.addEventListener('click',function(e){
    if(e.target===dlg||e.target.closest('[data-close]'))closeS();
    var s=e.target.closest('[data-sugg]'); if(s){sq.value=s.getAttribute('data-sugg');render(sq.value);sq.focus()}
    var a=e.target.closest('a.it'); if(a){ if(a.dataset.jq) store.set('jq',a.dataset.jq); closeS(); }
  });
  sq.addEventListener('keydown',function(e){var its=$$('a.it',sres); if(!its.length)return;
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();act=(act+(e.key==='ArrowDown'?1:-1)+its.length)%its.length;its.forEach(function(x,i){x.classList.toggle('act',i===act)});its[act].scrollIntoView({block:'nearest'})}
    if(e.key==='Enter'){e.preventDefault();(its[act]||its[0]).click()}});
}
document.addEventListener('keydown',function(e){var t=e.target.tagName;
  if((e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(t))||((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k')){e.preventDefault();openS()}});

/* home finder: carry the query to the jobs page */
var fd=$('[data-finder]');
if(fd)fd.addEventListener('submit',function(e){var v=$('#fq').value.trim();store.set('jq',v)});

/* ---------- jobs filters (19/11: mestiere prima del paese, conteggi vivi, filtri insieme nell'indirizzo, condividi) ---------- */
var jl=$('#jobtools');
if(jl){
  var st={c:'',t:'',q:'',e:'',p:'',l:''}, cards=$$('.job'), LL=window.LOCLABEL||{}, TN=window.TRADENAME||{}, CN=window.CNAME||{}, NT=window.NOTRACK||[], groups=$$('.jgroup'), jq=$('#jq');
  var TA=window.TRADEALIAS||{}, W=[], sent={};
  function gc(p,t){try{if(window.goatcounter&&window.goatcounter.count)window.goatcounter.count({path:p,title:t||p,event:true})}catch(e){}}
  function once(p,t){if(sent[p])return;sent[p]=1;gc(p,t)}
  var params=new URLSearchParams(location.search); var q0=params.get('q')||store.get('jq')||''; store.del('jq');
  var h=location.hash.slice(1);
  // filtri nell'indirizzo, anche insieme: jobs.html#trade=welding&country=uae, #project=<id>, #place=ruwais, #q=rigger.
  // Vecchie forme ancora valide: #trade-welding, #in-uae, #at-ruwais, #uae. trade accetta anche il mestiere a parole (welder, qc).
  function fromHash(h){h=h||'';
    var n={c:'',t:'',q:'',e:'',p:'',l:''};
    if(h.indexOf('=')>0){var P=new URLSearchParams(h),ok=false;
      var tv=norm(P.get('trade')||'');if(tv){n.t=$('[data-ft="'+tv+'"]')?tv:(TA[tv]||'');ok=true}
      ['country:c','place:l','project:p','employer:e','q:q'].forEach(function(x){x=x.split(':');var v=P.get(x[0]);if(v){n[x[1]]=v;ok=true}});
      if(!ok)return false}
    else if(h.indexOf('trade-')===0)n.t=h.slice(6); else if(h.indexOf('in-')===0)n.c=h.slice(3); else if(h.indexOf('at-')===0)n.l=h.slice(3); else if(/^[a-z-]+$/.test(h)&&$('[data-fc="'+h+'"]'))n.c=h; else return false;
    st=n; return true}
  fromHash(h);
  // a typed country or trade (home finder, ?q=) becomes the chip
  if(q0){var nq=norm(q0).trim();
    var cc=$$('[data-fc]').filter(function(b){return norm(b.firstChild.textContent)===nq})[0];
    if(cc)st.c=cc.dataset.fc; else if(TA[nq]&&$('[data-ft="'+TA[nq]+'"]'))st.t=TA[nq]; else st.q=q0}
  jq.value=st.q;
  function ok(c,skip){var d=c.dataset;
    return (skip==='c'||!st.c||d.c===st.c)&&(skip==='t'||!st.t||(' '+d.t+' ').indexOf(' '+st.t+' ')>-1)&&(!st.e||d.e===st.e)&&(!st.p||d.p===st.p)
      &&(!st.l||(' '+d.l+' ').indexOf(' '+st.l+' ')>-1)&&W.every(function(w){return norm(d.q).indexOf(w)>-1})}
  function count(attr,key,skip){var n=0;cards.forEach(function(c){if(ok(c,skip)&&(attr==='t'?(' '+c.dataset.t+' ').indexOf(' '+key+' ')>-1:c.dataset.c===key))n++});return n}
  function label(){var a=[];if(st.t)a.push(TN[st.t]||st.t);if(st.c)a.push(CN[st.c]||st.c);if(st.l)a.push(LL[st.l]||st.l);if(st.e)a.push(st.e);if(st.q)a.push('"'+st.q+'"');return a}
  function emptyBox(){
    var hd=$('#jempty-h'), bd=$('#jempty-b'), nt=W.filter(function(w){return NT.indexOf(w)>-1||NT.indexOf(w.replace(/s$/,''))>-1});
    var tip='<p>New adverts are checked every morning. Comment your trade on any <a href="https://www.instagram.com/epcradar/">@epcradar</a> post on Instagram and we DM you the jobs for it.</p>';
    if(nt.length){hd.textContent='We do not track '+nt[0]+' adverts yet';
      bd.innerHTML='<p>We list site jobs that contractors advertise on their own careers pages: welders, fitters, electricians, QA/QC, riggers, scaffolders, supervisors and more. '+esc(nt[0])+' jobs are usually filled by agencies near the site. Never pay anyone for a job, a visa or a medical.</p>'+tip;
      once('jobs-notrack-'+nt[0].replace(/s$/,''));return}
    hd.textContent='No open '+(st.t?(TN[st.t]||'')+' ':'')+'advert'+(st.c?' in '+(CN[st.c]||st.c):'')+' today';
    var b='';
    if(st.t&&st.c){var a=count('t',st.t,'c'),m=count('c',st.c,'t');
      if(a)b+='<button class="btn btn-dark" type="button" data-drop="c">'+esc(TN[st.t]||'')+': every country ('+a+')</button>';
      if(m)b+='<button class="btn btn-b" type="button" data-drop="t">Every trade in '+esc(CN[st.c]||'')+' ('+m+')</button>'}
    bd.innerHTML=(b?'<div class="acts">'+b+'</div>':'<p>Try another trade or country, or clear the filters.</p>')+tip;
    once('jobs-none-'+(st.t||'any')+'-'+(st.c||'any'));
  }
  function apply(push){
    W=norm(st.q).split(/\s+/).filter(Boolean); var shown=0;
    cards.forEach(function(c){var y=ok(c); if(y&&c.classList.contains('hide')){c.classList.remove('enter');void c.offsetWidth;c.classList.add('enter')} c.classList.toggle('hide',!y); if(y)shown++});
    groups.forEach(function(g){g.classList.toggle('hide',!$$('.job:not(.hide)',g).length)});
    $$('[data-ft]').forEach(function(b){var n=count('t',b.dataset.ft,'t');b.querySelector('.n').textContent=n;b.classList.toggle('zero',!n);b.setAttribute('aria-pressed',String(b.dataset.ft===st.t))});
    $$('[data-fc]').forEach(function(b){var n=count('c',b.dataset.fc,'c');b.querySelector('.n').textContent=n;b.classList.toggle('zero',!n);b.setAttribute('aria-pressed',String(b.dataset.fc===st.c))});
    $('#jn').textContent=shown; var lb=label(); $('#jwhat').textContent=(shown===1?'advert':'adverts')+(lb.length?' · '+lb.join(' · '):'');
    $('#jempty').classList.toggle('hide',shown>0); if(!shown)emptyBox();
    var any=st.c||st.t||st.q||st.e||st.p||st.l; $('#jl').value=st.l; $('#je').value=st.e; $('#jp').value=st.p;
    if(document.activeElement!==jq&&jq.value!==st.q)jq.value=st.q;
    var af=$('#jactive'); af.innerHTML=st.l?'<button type="button" data-unl>Place: '+esc(LL[st.l]||st.l)+' <svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="m15 9-6 6m0-6 6 6"/></svg><span class="sr">remove</span></button>':'';
    $('#jreset').hidden=!any; $('#jshare').hidden=!any; $('[data-clear]',jl).hidden=!st.q;
    if(st.e||st.p||st.l){var mf=$('.more-f',jl); if(mf)mf.open=true}
    // chips: the chosen one comes into view on its scrolling row
    $$('.chips.scroll [aria-pressed=true]').forEach(function(b){var r=b.parentNode;if(r.scrollWidth>r.clientWidth)r.scrollLeft=Math.max(0,b.offsetLeft-r.offsetLeft-24)});
    if(push){var a=[];if(st.t)a.push('trade='+st.t);if(st.c)a.push('country='+st.c);if(st.l)a.push('place='+st.l);if(st.p)a.push('project='+st.p);if(st.e)a.push('employer='+encodeURIComponent(st.e));if(st.q)a.push('q='+encodeURIComponent(st.q));
      var nh=a.length?'#'+a.join('&'):''; if(nh!==location.hash){history.replaceState(null,'',nh||location.pathname+location.search)}}
    pill();
  }
  jl.addEventListener('click',function(e){var b=e.target.closest('[data-fc]');if(b){st.c=st.c===b.dataset.fc?'':b.dataset.fc;apply(true);scrollToList()}
    b=e.target.closest('[data-ft]');if(b){st.t=st.t===b.dataset.ft?'':b.dataset.ft;apply(true);if(st.c)scrollToList()}
    if(e.target.closest('[data-clear]')){st.q='';jq.value='';apply(true);jq.focus()}
    if(e.target.closest('[data-unl]')){st.l='';apply(true)}});
  function reset(){st={c:'',t:'',q:'',e:'',p:'',l:''};jq.value='';apply(true)}
  $('#jreset').addEventListener('click',reset); $$('[data-reset]').forEach(function(b){b.addEventListener('click',reset)});
  $('#jempty').addEventListener('click',function(e){var d=e.target.closest('[data-drop]');if(d){st[d.dataset.drop]='';apply(true);scrollToList()}});
  // search box: trade words work too (pipe fitter, QC, rigger...); GoatCounter gets only the trade or country it matches, never the text
  var tm,tq; jq.addEventListener('input',function(){clearTimeout(tm);clearTimeout(tq);tm=setTimeout(function(){st.q=jq.value;apply(true)},150);
    tq=setTimeout(function(){var ws=norm(jq.value).split(/\s+/).filter(Boolean);if(!ws.length)return;var k='other';
      ws.some(function(w){if(TA[w]){k=TA[w];return true}var c=$$('[data-fc]').filter(function(b){return norm(b.firstChild.textContent)===w})[0];if(c){k=c.dataset.fc;return true}});
      once('jobs-q-'+k,'Jobs search: '+k)},1500)});
  jq.addEventListener('keydown',function(e){if(e.key==='Enter'){jq.blur();scrollToList()}});
  $('#je').addEventListener('change',function(){st.e=this.value;apply(true)}); $('#jl').addEventListener('change',function(){st.l=this.value;apply(true)}); $('#jp').addEventListener('change',function(){st.p=this.value;apply(true)});
  // share the search (WhatsApp first: that is where friends send each other jobs)
  $('#jshare').addEventListener('click',function(){var lb=label(),url=location.origin+location.pathname+location.hash;
    var tx=(lb.length?lb.join(', ')+': ':'')+$('#jn').textContent+' open oil and gas site jobs, each with the employer\'s own link. Apply only there.';
    gc('jobs-share','Share: '+(st.t||'any')+'-'+(st.c||'any'));
    if(navigator.share){navigator.share({title:'EPC Radar jobs',text:tx,url:url}).catch(function(){})}else{window.open('https://wa.me/?text='+encodeURIComponent(tx+' '+url),'_blank','noopener')}});
  function scrollToList(){var t=0; var g=$('.jgroup:not(.hide)')||$('#jempty'); if(!g)return; var y=window.scrollY+g.getBoundingClientRect().top-80;
    if(y>window.scrollY+40||g.getBoundingClientRect().top<0)window.scrollTo({top:y,behavior:reduce?'auto':'smooth'})}
  // floating pill: when the filters are off screen it says what you are looking at and brings you back to change it
  var pl=document.createElement('button'); pl.type='button'; pl.className='fpill'; pl.hidden=true; document.body.appendChild(pl); var off=false;
  pl.addEventListener('click',function(){window.scrollTo({top:jl.getBoundingClientRect().top+window.scrollY-70,behavior:reduce?'auto':'smooth'})});
  function pill(){var lb=label();pl.innerHTML='<span class="l"><b>'+$('#jn').textContent+'</b> '+esc(lb.length?lb.join(' · '):'adverts')+'</span><span class="c">Change</span>';pl.hidden=!off}
  if('IntersectionObserver' in window){new IntersectionObserver(function(es){off=!es[0].isIntersecting&&es[0].boundingClientRect.top<0;pill()}).observe(jl)}
  // closing date: days left, from the date written in the advert
  var today=new Date(); today.setHours(0,0,0,0);
  cards.forEach(function(c){var d=c.dataset.close; if(!d)return; var n=Math.round((new Date(d+'T00:00:00')-today)/864e5); if(n>7)return;
    var tg=$('.tags',c); if(!tg){tg=document.createElement('div');tg.className='tags';var h3=$('h3',c);h3.parentNode.insertBefore(tg,h3)}
    var s=document.createElement('span'); s.className='tag '+(n<0?'gone':'soon'); s.textContent=n<0?'Closing date passed':n===0?'Closes today':n===1?'Closes tomorrow':n+' days left'; tg.appendChild(s)});
  apply(); if(st.c||st.t||st.q||st.l||st.p||st.e){setTimeout(function(){scrollToList()},60)}
  window.addEventListener('hashchange',function(){var x=location.hash.slice(1);if(fromHash(x))apply();else hit(x)});
  // link dal PDF (#j-xxxxxxxx): l'offerta si evidenzia e viene al centro dello schermo
  function hit(x){if(!/^j-[0-9a-f]{8}$/.test(x))return; var c=document.getElementById(x); if(!c)return;
    $$('.job.hit').forEach(function(o){o.classList.remove('hit')}); c.classList.add('hit');
    setTimeout(function(){window.scrollTo(0,window.scrollY+c.getBoundingClientRect().top-innerHeight/3)},80)}
  hit(h);
}

/* ---------- tracker filters ---------- */
var tt=$('#trtools');
if(tt){
  var ff=$('[data-ff]'); if(ff&&matchMedia('(min-width:980px)').matches)ff.open=true;
  var list=$('#tlist'), tc=$$('.tcard',list), tq=$('#tq');
  var F={country:$('#f-country'),sector:$('#f-sector'),phase:$('#f-phase'),status:$('#f-status'),size:$('#f-size'),sort:$('#f-sort'),jobs:$('#f-jobs'),off:$('#f-off')};
  var hh=location.hash.slice(1), HK={country:'country',plant:'sector',phase:'phase',status:'status',size:'size',sort:'sort'};
  function clearF(){tq.value='';['country','sector','phase','status','size'].forEach(function(k){F[k].value=''});F.jobs.checked=false;F.off.checked=false}
  function readT(h){
    if(h.indexOf('phase-')===0){clearF();F.phase.value=h.slice(6);return true}
    if(h.indexOf('=')<0)return false;
    clearF();
    h.split('&').forEach(function(kv){var i=kv.indexOf('=');if(i<0)return;var k=decodeURIComponent(kv.slice(0,i)),v=decodeURIComponent(kv.slice(i+1).replace(/\+/g,' '));
      if(HK[k])F[HK[k]].value=v; else if(k==='q')tq.value=v; else if(k==='jobs')F.jobs.checked=!!v; else if(k==='offshore')F.off.checked=!!v});
    return true;
  }
  function writeT(){var a=[];Object.keys(HK).forEach(function(k){var v=F[HK[k]].value;if(v&&!(k==='sort'&&v==='jobs'))a.push(k+'='+encodeURIComponent(v))});
    if(tq.value)a.push('q='+encodeURIComponent(tq.value));if(F.jobs.checked)a.push('jobs=1');if(F.off.checked)a.push('offshore=1');
    history.replaceState(null,'',a.length?'#'+a.join('&'):location.pathname+location.search)}
  readT(hh);
  function tapply(push){
    var w=norm(tq.value).split(/\s+/).filter(Boolean), n=0;
    tc.forEach(function(c){var d=c.dataset;var ok=(!F.country.value||(' '+d.c+' ').indexOf(' '+F.country.value+' ')>-1)&&(!F.sector.value||(' '+d.s+' ').indexOf(' '+F.sector.value+' ')>-1)&&(!F.phase.value||d.ph===F.phase.value)&&(!F.status.value||d.st===F.status.value)&&(!F.size.value||d.z===F.size.value)&&(!F.jobs.checked||+d.j>0)&&(!F.off.checked||d.of==='1')&&w.every(function(x){return norm(d.q).indexOf(x)>-1});
      c.classList.toggle('hide',!ok);if(ok)n++});
    var key=F.sort.value, arr=tc.slice();
    arr.sort(function(a,b){var A=a.dataset,B=b.dataset;
      if(key==='jobs')return (+B.j)-(+A.j)||(+A.o)-(+B.o);
      if(key==='value')return (+B.rv)-(+A.rv)||(+A.o)-(+B.o);
      if(key==='end')return (A.e||'9999').localeCompare(B.e||'9999')||(+A.o)-(+B.o);
      if(key==='progress')return (+B.rp)-(+A.rp)||(+A.o)-(+B.o);
      return (+A.o)-(+B.o)});
    arr.forEach(function(c){list.appendChild(c)});
    $('#tn').textContent=n; $('#tempty').classList.toggle('hide',n>0);
    var any=tq.value||F.country.value||F.sector.value||F.phase.value||F.status.value||F.size.value||F.jobs.checked||F.off.checked;
    $('#treset').hidden=!any; $('[data-clear]',tt).hidden=!tq.value;
    if(push===true)writeT();
  }
  Object.keys(F).forEach(function(k){F[k].addEventListener('change',function(){tapply(true)})});
  var tm2; tq.addEventListener('input',function(){clearTimeout(tm2);tm2=setTimeout(function(){tapply(true)},120)});
  $('[data-clear]',tt).addEventListener('click',function(){tq.value='';tapply(true);tq.focus()});
  function treset(){clearF();tapply(true)}
  $('#treset').addEventListener('click',treset); $$('[data-reset]').forEach(function(b){b.addEventListener('click',treset)});
  $$('[data-setc]').forEach(function(b){b.addEventListener('click',function(){F.country.value=b.dataset.setc;tapply(true);window.scrollTo({top:tt.offsetTop,behavior:reduce?'auto':'smooth'})})});
  $$('a[href^="#phase-"]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();F.phase.value=a.getAttribute('href').slice(7);tapply(true);window.scrollTo({top:tt.offsetTop,behavior:reduce?'auto':'smooth'})})});
  tapply();
  // deep link to a card: open its details
  function toCard(h){var c=h&&document.getElementById(h);if(!c||!c.classList.contains('tcard'))return false;
    if(c.classList.contains('hide')){clearF();tapply()} var d=$('details',c);if(d)d.open=true;setTimeout(function(){c.scrollIntoView()},40);return true}
  if(!toCard(hh)&&(hh.indexOf('phase-')===0||hh.indexOf('=')>-1)){setTimeout(function(){window.scrollTo(0,tt.offsetTop)},40)}
  window.addEventListener('hashchange',function(){var h=location.hash.slice(1);if(readT(h)){tapply();window.scrollTo(0,tt.offsetTop)}else{toCard(h)}});
}

/* ---------- news filter ---------- */
var nf=$$('[data-nf]');
if(nf.length){nf.forEach(function(b){b.addEventListener('click',function(){var v=b.dataset.nf;nf.forEach(function(x){var on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-pressed',String(on))});
  $$('.art').forEach(function(a){a.classList.toggle('hide',!!v&&a.dataset.fmt!==v)})})})}

/* console: link board rows and map dots */
var mapEl=$('#map'), boardEl=$('#board');
if(mapEl&&boardEl){function hot(slug,on){$$('[data-loc="'+slug+'"]').forEach(function(x){x.classList.toggle('hot',on)})}
  [mapEl,boardEl].forEach(function(root){['mouseover','focusin'].forEach(function(ev){root.addEventListener(ev,function(e){var a=e.target.closest('[data-loc]');if(a)hot(a.dataset.loc,true)})});['mouseout','focusout'].forEach(function(ev){root.addEventListener(ev,function(e){var a=e.target.closest('[data-loc]');if(a)hot(a.dataset.loc,false)})})});
  var sa=$('[data-showall]');if(sa)sa.addEventListener('click',function(){boardEl.classList.add('all');sa.remove()});}

/* open a folded story or card when linked to it */
function openTarget(){var id=location.hash.slice(1); if(!id)return; var el=document.getElementById(id); if(!el)return; $$('details.story',el).forEach(function(d){d.open=true})}
openTarget(); window.addEventListener('hashchange',openTarget);

/* close the language menu on outside click */
document.addEventListener('click',function(e){$$('.lang[open]').forEach(function(d){if(!d.contains(e.target))d.open=false})});
})();
