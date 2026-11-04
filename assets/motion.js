/* EPC Radar motion layer: GSAP + ScrollTrigger, Lenis as the only smooth-scroll engine.
   Everything here is additive: without JS, or with reduced motion, the page shows its final state. */
(function(){
'use strict';
if(!window.gsap) return;
var gsap=window.gsap, ST=window.ScrollTrigger;
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
if(ST) gsap.registerPlugin(ST);

/* split headings into words, keep one accessible copy */
function split(el){
  if(el.dataset.done) return []; el.dataset.done='1';
  var txt=el.textContent.replace(/\s+/g,' ').trim();
  var sr=document.createElement('span'); sr.className='sr'; sr.textContent=txt;
  var vis=document.createElement('span'); vis.setAttribute('aria-hidden','true');
  var words=[];
  Array.prototype.slice.call(el.childNodes).forEach(function(n){
    var em=n.nodeType===1?n.tagName.toLowerCase():null;
    var parts=(n.textContent||'').split(/(\s+)/);
    parts.forEach(function(p){ if(!p) return; if(/^\s+$/.test(p)){vis.appendChild(document.createTextNode(' '));return}
      var w=document.createElement('span'); w.className='sw'; var i=document.createElement(em||'span'); i.textContent=p; w.appendChild(i); vis.appendChild(w); words.push(i)});
  });
  el.textContent=''; el.appendChild(sr); el.appendChild(vis);
  return words;
}

if(reduce){ return; } /* final states are the default CSS; nothing to animate */

/* ---------- Lenis, wired to ScrollTrigger ---------- */
var lenis=null;
if(window.Lenis && matchMedia('(pointer:fine)').matches){
  lenis=new window.Lenis({lerp:.11,smoothWheel:true});
  if(ST){ lenis.on('scroll',ST.update); }
  gsap.ticker.add(function(t){lenis.raf(t*1000)}); gsap.ticker.lagSmoothing(0);
  document.addEventListener('click',function(e){var a=e.target.closest('a[href^="#"]'); if(!a)return; var id=a.getAttribute('href'); if(id.length<2)return; var el=document.getElementById(id.slice(1)); if(!el)return; lenis.scrollTo(el,{offset:-90}); });
  var dlg=$('#sdlg'); if(dlg){ new MutationObserver(function(){dlg.open?lenis.stop():lenis.start()}).observe(dlg,{attributes:true,attributeFilter:['open']}); }
  window.addEventListener('pagehide',function(){lenis.destroy()});
}
if(ST){ document.fonts&&document.fonts.ready.then(function(){ST.refresh()}); window.addEventListener('load',function(){ST.refresh()}); }

/* ---------- split-flap ---------- */
var GLYPHS='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function flap(el,delay){
  var final=el.textContent; if(!final.trim()) return;
  el.setAttribute('aria-label',final);
  var chars=final.split(''), spans=chars.map(function(ch){var s=document.createElement('span');s.className='fl';s.setAttribute('aria-hidden','true');s.textContent=ch===' '?' ':GLYPHS[Math.floor(Math.random()*GLYPHS.length)];return s});
  el.textContent=''; spans.forEach(function(s){el.appendChild(s)}); el.classList.add('flap-on');
  spans.forEach(function(s,i){var ch=chars[i]; if(ch===' ')return; var n=6+Math.floor(Math.random()*6), k=0;
    setTimeout(function tick(){ if(k++<n){s.textContent=GLYPHS[Math.floor(Math.random()*GLYPHS.length)];setTimeout(tick,45)} else {s.textContent=ch; if(i===spans.length-1)el.classList.remove('flap-on')} }, delay*1000+i*28);
  });
}

/* ---------- hero intro ---------- */
var heroH=$('[data-hero]');
var intro=gsap.timeline({defaults:{ease:'expo.out'}});
if(heroH){ var w=split(heroH); intro.from(w,{yPercent:110,duration:1.1,stagger:.06},0.05); }
var rise=$$('[data-rise]'); if(rise.length) intro.from(rise,{y:24,opacity:0,duration:.9,stagger:.1},0.35);

var map=$('#map');
if(map){
  var marks=$$('[data-loc]',map), scan=$('.scan',map);
  gsap.set(marks,{opacity:0});
  var sweep=gsap.timeline({paused:true});
  sweep.fromTo(scan,{attr:{x:-80},opacity:1},{attr:{x:980},duration:2.2,ease:'none'},0).to(scan,{opacity:0,duration:.3},2.0);
  marks.forEach(function(m){var x=parseFloat(getComputedStyle(m).getPropertyValue('--x'))||500; var t=Math.max(0,(x-40)/940*2.2);
    sweep.to(m,{opacity:1,duration:.25},t);
    var ping=$('.ping',m); if(ping) sweep.fromTo(ping,{attr:{r:4},opacity:.9},{attr:{r:28},opacity:0,duration:1.1,ease:'power2.out'},t);
  });
  var rows=$$('.board [data-flap]');
  var started=false;
  function go(){ if(started)return; started=true; sweep.play(); rows.forEach(function(el,i){flap(el,0.15+Math.floor(i/2)*0.06)}); gsap.from('.rows li:not(.more), .rows li',{opacity:0,x:-10,duration:.5,stagger:.04,ease:'power2.out',delay:.1}); }
  if(ST){ ST.create({trigger:map,start:'top 85%',once:true,onEnter:go}); } else go();
  /* quiet repeating ping on the busiest place while visible */
  var top=marks.slice().sort(function(a,b){return (b.querySelector('.dot').getAttribute('r'))-(a.querySelector('.dot').getAttribute('r'))})[0];
  if(top&&ST){ var tp=$('.ping',top), loop=gsap.fromTo(tp,{attr:{r:6},opacity:.8},{attr:{r:34},opacity:0,duration:1.8,ease:'power2.out',repeat:-1,repeatDelay:1.2,paused:true,delay:3});
    ST.create({trigger:map,start:'top bottom',end:'bottom top',onToggle:function(s){s.isActive?loop.play():loop.pause()}});
    document.addEventListener('visibilitychange',function(){document.hidden?loop.pause():loop.play()}); }
}

if(!ST) return;

/* ---------- section headings: word reveal ---------- */
$$('[data-split]').forEach(function(h){ if(h.hasAttribute('data-hero')) return; var w=split(h);
  gsap.from(w,{yPercent:110,duration:1,ease:'expo.out',stagger:.045,scrollTrigger:{trigger:h,start:'top 88%',once:true}}); });
$$('.sec-h p, .sec-h .more, .kick').forEach(function(el){ if(el.closest('[data-hero]')) return;
  gsap.from(el,{y:16,opacity:0,duration:.8,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 92%',once:true}}); });

/* ---------- bars draw in, numbers flap ---------- */
$$('[data-bars]').forEach(function(b){ var f=$$('.fl2',b);
  gsap.from(f,{scaleX:0,duration:1.1,ease:'expo.out',stagger:.05,scrollTrigger:{trigger:b,start:'top 85%',once:true,onEnter:function(){$$('[data-flap]',b).forEach(function(el,i){flap(el,i*.04)})}}}); });
$$('.stats [data-flap]').forEach(function(el,i){flap(el,.5+i*.12)});
$$('.prog .t span').forEach(function(s){ gsap.from(s,{scaleX:0,duration:1.2,ease:'expo.out',scrollTrigger:{trigger:s,start:'top 92%',once:true}}); });

/* ---------- Top 10: horizontal ride, pinned on wide screens only ---------- */
var ride=$('[data-ride]');
if(ride){
  var mm=gsap.matchMedia();
  mm.add('(min-width:1020px)',function(){
    var track=$('.ride-track',ride);
    ride.classList.add('pinned');
    var dist=function(){return Math.max(0,track.scrollWidth-window.innerWidth+parseFloat(getComputedStyle(document.documentElement).fontSize)*3)};
    var tw=gsap.to(track,{x:function(){return -dist()},ease:'none',scrollTrigger:{trigger:ride.closest('section'),start:'top top',end:function(){return '+='+dist()},pin:ride.closest('section'),scrub:.6,invalidateOnRefresh:true,anticipatePin:1}});
    gsap.set(track,{paddingLeft:'max(48px, calc((100vw - 1320px)/2 + 48px))',paddingRight:'48px'});
    return function(){ride.classList.remove('pinned');gsap.set(track,{clearProps:'all'})};
  });
  gsap.from($$('.pcard',ride),{y:40,opacity:0,duration:.9,ease:'power3.out',stagger:.07,scrollTrigger:{trigger:ride,start:'top 85%',once:true,onEnter:function(){$$('[data-flap]',ride).forEach(function(el,i){flap(el,.3+i*.06)})}}});
}

/* ---------- media: gentle parallax on page-header photos ---------- */
$$('.phead>img, .hero .bg img').forEach(function(img){ gsap.to(img,{yPercent:8,ease:'none',scrollTrigger:{trigger:img.parentElement,start:'top top',end:'bottom top',scrub:true}}); });

/* ---------- rows enter ---------- */
$$('.nlist li, .tlist li, .follow a, .fmt, .tier').forEach(function(el){ gsap.from(el,{y:20,opacity:0,duration:.7,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 94%',once:true}}); });
})();
