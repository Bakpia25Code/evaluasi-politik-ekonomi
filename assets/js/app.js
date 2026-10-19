(function () {
  'use strict';
  var stage=document.getElementById('stage'), viewport=document.getElementById('viewport');
  var slides=Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var bar=document.getElementById('progress'), elCnt=document.getElementById('cnt');
  var elSec=document.getElementById('sec'), overview=document.getElementById('overview');
  var ogrid=document.getElementById('ogrid'), notes=document.getElementById('notes');
  var notesBody=document.getElementById('notesBody');
  var cur=0, TOTAL=slides.length;

  /* Skala panggung agar pas di layar mana pun */
  function fit(){
    var s=Math.min(window.innerWidth/1600, window.innerHeight/900)*0.965;
    stage.style.transform='scale('+s+')';
  }
  window.addEventListener('resize', fit);

  /* Animasi angka: <span data-count="221" data-suf=" jt">  */
  function animateCounters(slide){
    slide.querySelectorAll('[data-count]').forEach(function(el){
      var end=parseFloat(el.getAttribute('data-count'));
      var dec=parseInt(el.getAttribute('data-dec')||'0',10);
      var pre=el.getAttribute('data-pre')||'', suf=el.getAttribute('data-suf')||'';
      var dur=1100, t0=null;
      function step(ts){
        if(t0===null) t0=ts;
        var p=Math.min((ts-t0)/dur,1), e=1-Math.pow(1-p,3);
        el.textContent=pre+Number((end*e).toFixed(dec)).toLocaleString('id-ID',
          {minimumFractionDigits:dec,maximumFractionDigits:dec})+suf;
        if(p<1) requestAnimationFrame(step);
      }
      el.textContent=pre+'0'+suf; requestAnimationFrame(step);
    });
  }

  /* Animasi bar: <div class="bar-fill" data-w="79.5"> */
  function animateBars(slide){
    slide.querySelectorAll('.bar-fill').forEach(function(el,i){
      var w=el.getAttribute('data-w')||'0';
      el.style.width='0%';
      setTimeout(function(){ el.style.width=w+'%'; }, 180+i*110);
    });
  }

  function show(i, push){
    i=Math.max(0, Math.min(TOTAL-1, i));
    if(slides[cur]) slides[cur].classList.remove('active');
    cur=i;
    var s=slides[cur];
    s.classList.add('active');
    s.querySelectorAll('.rv').forEach(function(el){          // paksa ulang animasi
      el.style.animation='none'; void el.offsetHeight; el.style.animation='';
    });
    animateCounters(s); animateBars(s);
    bar.style.width=((cur+1)/TOTAL*100)+'%';
    elCnt.textContent=(cur+1)+' / '+TOTAL;
    elSec.textContent=s.getAttribute('data-sec')||'';
    notesBody.innerHTML=s.getAttribute('data-notes')||'<i>Tidak ada catatan.</i>';
    ogrid.querySelectorAll('.othumb').forEach(function(t,k){ t.classList.toggle('cur',k===cur); });
    if(push!==false) history.replaceState(null,'','#/'+(cur+1));
    preload(cur); preload(cur+1); preload(cur+2);   // WAJIB termasuk cur — lihat jebakan.md
  }

  function preload(i){
    if(!slides[i]) return;
    slides[i].querySelectorAll('img[data-src]').forEach(function(img){
      img.src=img.getAttribute('data-src'); img.removeAttribute('data-src');
    });
  }

  var next=function(){ if(cur<TOTAL-1) show(cur+1); };
  var prev=function(){ if(cur>0) show(cur-1); };

  function buildOverview(){
    slides.forEach(function(s,i){
      var d=document.createElement('div');
      d.className='othumb';
      d.innerHTML='<span class="on">'+String(i+1).padStart(2,'0')+'</span>'+
                  '<div class="ot">'+(s.getAttribute('data-title')||'Slide '+(i+1))+'</div>'+
                  '<div class="os">'+(s.getAttribute('data-sec')||'')+'</div>';
      d.addEventListener('click',function(){ toggleOverview(false); show(i); });
      ogrid.appendChild(d);
    });
  }
  function toggleOverview(force){
    var on=(typeof force==='boolean')?force:!overview.classList.contains('on');
    overview.classList.toggle('on',on);
    if(on){ var c=ogrid.querySelector('.cur'); if(c) c.scrollIntoView({block:'center'}); }
  }

  document.addEventListener('keydown',function(e){
    if(e.metaKey||e.ctrlKey||e.altKey) return;
    var k=e.key;
    if(k==='Escape'){ toggleOverview(false); notes.classList.remove('on'); return; }
    if(overview.classList.contains('on') && k!=='o' && k!=='O'){
      if(k==='Enter') toggleOverview(false);
      return;
    }
    switch(k){
      case 'ArrowRight': case 'ArrowDown': case ' ': case 'PageDown': e.preventDefault(); next(); break;
      case 'ArrowLeft':  case 'ArrowUp':   case 'PageUp':             e.preventDefault(); prev(); break;
      case 'Home': e.preventDefault(); show(0); break;
      case 'End':  e.preventDefault(); show(TOTAL-1); break;
      case 'f': case 'F':
        document.fullscreenElement ? document.exitFullscreen()
                                   : document.documentElement.requestFullscreen(); break;
      case 'o': case 'O': e.preventDefault(); toggleOverview(); break;
      case 'n': case 'N': notes.classList.toggle('on'); break;
      case 'p': case 'P': window.print(); break;
    }
  });

  var tx=0, ty=0;
  document.addEventListener('touchstart',function(e){
    tx=e.changedTouches[0].clientX; ty=e.changedTouches[0].clientY;
  },{passive:true});
  document.addEventListener('touchend',function(e){
    var dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty;
    if(Math.abs(dx)>55 && Math.abs(dx)>Math.abs(dy)){ dx<0?next():prev(); }
  },{passive:true});

  viewport.addEventListener('click',function(e){
    if(e.target.closest('#hud')||e.target.closest('a')) return;
    var r=viewport.getBoundingClientRect();
    (e.clientX-r.left)/r.width>0.35 ? next() : prev();
  });
  document.getElementById('btnPrev').addEventListener('click',function(e){ e.stopPropagation(); prev(); });
  document.getElementById('btnNext').addEventListener('click',function(e){ e.stopPropagation(); next(); });
  document.getElementById('btnGrid').addEventListener('click',function(e){ e.stopPropagation(); toggleOverview(); });

  var idleT;
  function poke(){
    document.body.classList.remove('idle');
    clearTimeout(idleT);
    idleT=setTimeout(function(){ document.body.classList.add('idle'); },4000);
  }
  ['mousemove','keydown','touchstart','click'].forEach(function(ev){
    document.addEventListener(ev,poke,{passive:true});
  });

  buildOverview(); fit(); poke();
  var h=parseInt((location.hash||'').replace('#/',''),10);
  show(isNaN(h)?0:h-1, false);

  window.addEventListener('beforeprint',function(){     // muat semua gambar dulu
    document.querySelectorAll('img[data-src]').forEach(function(img){
      img.src=img.getAttribute('data-src'); img.removeAttribute('data-src');
    });
  });
})();
