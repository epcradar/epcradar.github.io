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
  if(!q){sres.innerHTML='<div class="grp">Popular</div><div class="sugg">'+['Welder','Scaffolder','QA/QC','Saudi Arabia','UAE','Mozambique LNG','Saipem','Commissioning'].map(function(s){return '<button class="chip" type="button" data-sugg="'+s+'">'+s+'</button>'}).join('')+'</div>';act=-1;return}
  var words=q.split(/\s+/), out={}, n=0;
  data.forEach(function(it){var hay=norm(it[4]+' '+it[1]); if(words.every(function(w){return hay.indexOf(w)>-1})){(out[it[0]]=out[it[0]]||[]).push(it);n++}});
  if(!n){sres.innerHTML='<div class="empty" style="margin:10px"><h3>Nothing found for "'+esc(qr)+'"</h3><p>Try a trade (welder, rigger), a country, a contractor (Saipem, McDermott) or a project name.</p></div>';return}
  var h='';['l','c','t','b','j','p','r','n'].forEach(function(k){var l=out[k];if(!l)return;h+='<div class="grp">'+GROUPS[k]+' <span style="font-weight:400">('+l.length+')</span></div>';
    l.slice(0,k==='j'?8:6).forEach(function(it){h+='<a class="it" role="option" href="'+it[3]+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="'+ICON[k]+'"/></svg><span><span class="t">'+hl(it[1],words[0])+'</span><br><span class="d">'+esc(it[2])+'</span></span></a>'});
    if(k==='j'&&l.length>8)h+='<a class="it" href="jobs.html" data-jq="'+esc(qr)+'"><span></span><span class="t">See all '+l.length+' matching adverts</span></a>';});
  sres.innerHTML=h;act=-1;
}
function openS(){if(!dlg)return; if(dlg.showModal){dlg.showModal()}else{dlg.setAttribute('open','')} sq.value='';render('');setTimeout(function(){sq.focus()},10)}
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

/* ---------- jobs filters ---------- */
var jl=$('#jobtools');
if(jl){
  var st={c:'',t:'',q:'',e:'',p:'',l:''}, cards=$$('.job'), LL=window.LOCLABEL||{}, groups=$$('.jgroup'), jq=$('#jq');
  var params=new URLSearchParams(location.search); var q0=params.get('q')||store.get('jq')||''; store.del('jq');
  var h=location.hash.slice(1);
  function fromHash(h){if(h.indexOf('trade-')===0)st.t=h.slice(6); else if(h.indexOf('in-')===0)st.c=h.slice(3); else if(h.indexOf('at-')===0)st.l=h.slice(3); else if(/^[a-z-]+$/.test(h)&&$('[data-fc="'+h+'"]'))st.c=h; else return false; return true}
  fromHash(h);
  // map a typed trade or country to a chip when the words match
  if(q0){var nq=norm(q0);
    var cc=$$('[data-fc]').filter(function(b){return norm(b.firstChild.textContent)===nq})[0];
    if(cc){st.c=cc.dataset.fc}else{st.q=q0}}
  jq.value=st.q;
  function apply(push){
    var words=norm(st.q).split(/\s+/).filter(Boolean), shown=0;
    cards.forEach(function(c){var ok=(!st.c||c.dataset.c===st.c)&&(!st.t||(' '+c.dataset.t+' ').indexOf(' '+st.t+' ')>-1)&&(!st.e||c.dataset.e===st.e)&&(!st.p||c.dataset.p===st.p)&&(!st.l||(' '+c.dataset.l+' ').indexOf(' '+st.l+' ')>-1)&&words.every(function(w){return norm(c.dataset.q).indexOf(w)>-1});
      c.classList.toggle('hide',!ok); if(ok)shown++});
    groups.forEach(function(g){g.classList.toggle('hide',!$$('.job:not(.hide)',g).length)});
    $('#jn').textContent=shown; $('#jempty').classList.toggle('hide',shown>0);
    $$('[data-fc]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.fc===st.c))});
    $$('[data-ft]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.ft===st.t))});
    var any=st.c||st.t||st.q||st.e||st.p||st.l; $('#jl').value=st.l;
    var af=$('#jactive'); af.innerHTML=st.l?'<button type="button" data-unl>Place: '+esc(LL[st.l]||st.l)+' <svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="m15 9-6 6m0-6 6 6"/></svg><span class="sr">remove</span></button>':''; $('#jreset').hidden=!any; $('[data-clear]',jl).hidden=!st.q;
    if(st.t||st.e||st.p||st.l){var mf=$('.more-f',jl); if(mf)mf.open=true}
    if(push){var nh=st.l?'#at-'+st.l:st.c?'#in-'+st.c:st.t?'#trade-'+st.t:''; if(nh!==location.hash){history.replaceState(null,'',nh||location.pathname)}}
  }
  jl.addEventListener('click',function(e){var b=e.target.closest('[data-fc]');if(b){st.c=st.c===b.dataset.fc?'':b.dataset.fc;apply(true);scrollToList()}
    b=e.target.closest('[data-ft]');if(b){st.t=st.t===b.dataset.ft?'':b.dataset.ft;apply(true)}
    if(e.target.closest('[data-clear]')){st.q='';jq.value='';apply();jq.focus()}});
  function reset(){st={c:'',t:'',q:'',e:'',p:'',l:''};$('#jl').value='';jq.value='';$('#je').value='';$('#jp').value='';apply(true)}
  $('#jreset').addEventListener('click',reset); $$('[data-reset]').forEach(function(b){b.addEventListener('click',reset)});
  var tm; jq.addEventListener('input',function(){clearTimeout(tm);tm=setTimeout(function(){st.q=jq.value;apply()},120)});
  $('#je').addEventListener('change',function(){st.e=this.value;apply()}); $('#jl').addEventListener('change',function(){st.l=this.value;apply(true)});
  jl.addEventListener('click',function(e){if(e.target.closest('[data-unl]')){st.l='';apply(true)}}); $('#jp').addEventListener('change',function(){st.p=this.value;apply()});
  function scrollToList(){var t=jl.getBoundingClientRect().bottom; var g=$('.jgroup:not(.hide)'); if(g&&g.getBoundingClientRect().top<t)window.scrollTo({top:window.scrollY+g.getBoundingClientRect().top-t-8,behavior:reduce?'auto':'smooth'})}
  apply(); if(st.c||st.t||st.q||st.l){setTimeout(function(){var y=jl.offsetTop;window.scrollTo(0,y)},30)}
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
