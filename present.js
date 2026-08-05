/*! present.js — โหมดนำเสนออัตโนมัติ (ศูนย์บัญชาการน้ำ หนองบัวลำภู)
 *  หยอดไฟล์เดียว: <script src="present.js?v=1" defer></script>
 *  - ไม่แตะข้อมูล/เกณฑ์เดิม สั่งสลับมุมมองที่มีอยู่แล้ว (setMode/setWatch) + เดินสปอตไลต์ทีละแผง
 *  - แผงควบคุมลอยขอบซ้าย กึ่งกลางแนวตั้ง ไม่เบียดแดชบอร์ด
 */
(function(){
"use strict";

/* ---------- ฝัง CSS ---------- */
var CSS = `
:root{--pv-gold:#c9a24b;--pv-navy:#0a1e3c;--pv-cyan:#0891b2;}
/* แผงควบคุมแนวตั้ง ขอบซ้ายกลาง */
#pvDock{position:fixed;top:50%;transform:translateY(-50%);z-index:1200;
  display:flex;flex-direction:column;align-items:center;gap:7px;
  background:rgba(10,30,60,.94);backdrop-filter:blur(10px);
  border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:9px 8px;
  box-shadow:0 14px 40px rgba(6,20,45,.45);transition:left .25s,opacity .2s;
  font-family:'Kanit',system-ui,sans-serif;color:#eaf2ff;}
#pvDock.pv-hidden{opacity:0;pointer-events:none}
#pvDock .pv-b{width:40px;height:40px;border-radius:12px;border:1px solid rgba(255,255,255,.14);
  background:#0e3b6b;color:#eaf2ff;font-size:16px;cursor:pointer;display:grid;place-items:center;
  transition:.15s;position:relative;padding:0}
#pvDock .pv-b:hover{background:#134f8f;transform:translateY(-1px)}
#pvDock .pv-b:disabled{opacity:.4;cursor:not-allowed;transform:none}
#pvDock .pv-b.pv-on{background:var(--pv-gold);color:#20140a;border-color:var(--pv-gold)}
#pvDock .pv-play{width:46px;height:46px;font-size:19px;background:var(--pv-cyan);border-color:var(--pv-cyan);color:#fff}
#pvDock .pv-play:hover{background:#0aa0c0}
#pvDock .pv-ring{position:absolute;inset:-4px;pointer-events:none}
#pvDock .pv-ring circle{fill:none;stroke-width:3}
#pvDock .pv-ring .bg{stroke:rgba(255,255,255,.18)}
#pvDock .pv-ring .fg{stroke:#fff;stroke-linecap:round}
#pvDock .pv-spd{font-family:'Kanit',sans-serif;font-size:12px;font-weight:600;line-height:1;
  display:flex;flex-direction:column;gap:2px;align-items:center}
#pvDock .pv-spd small{font-size:8px;opacity:.6;letter-spacing:1px}
#pvDock .pv-sep{width:24px;height:1px;background:rgba(255,255,255,.14);margin:1px 0}
#pvDock .pv-tag{writing-mode:vertical-rl;text-orientation:mixed;font-size:9px;letter-spacing:2px;
  color:var(--pv-gold);text-transform:uppercase;font-weight:600;margin-bottom:2px}
/* แถบบรรยายด้านล่างจอ (auto-narration) */
#pvCaption{position:fixed;left:50%;bottom:16px;transform:translateX(-50%) translateY(20px);z-index:1150;
  background:rgba(10,30,60,.94);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.14);
  color:#eaf2ff;border-radius:999px;padding:9px 20px;font-family:'Kanit',sans-serif;font-size:14px;
  font-weight:500;box-shadow:0 12px 34px rgba(6,20,45,.4);opacity:0;transition:.35s;max-width:80vw;text-align:center}
#pvCaption.pv-show{opacity:1;transform:translateX(-50%) translateY(0)}
#pvCaption b{color:var(--pv-gold);font-weight:600}
#pvCaption small{opacity:.6;font-weight:400;margin-left:8px;font-size:11px}
/* สปอตไลต์ทีละแผง */
.content.pv-run .panel{transition:opacity .4s,filter .4s,transform .35s,box-shadow .35s}
.content.pv-run .panel:not(.pv-spot){opacity:.5;filter:saturate(.65)}
.content.pv-run .panel.pv-spot{opacity:1;filter:none;transform:translateY(-2px);
  box-shadow:0 0 0 2px var(--pv-gold),0 16px 40px rgba(10,30,60,.28);z-index:5}
.content .panel.pv-pin{opacity:1 !important;filter:none !important;
  box-shadow:0 0 0 2px var(--pv-cyan),0 16px 40px rgba(8,145,178,.3) !important}
@media print{#pvDock,#pvCaption{display:none !important}}
`;
var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

/* ---------- สร้างแผงควบคุม ---------- */
var CIRC = 2*Math.PI*23;
var dock = document.createElement('div'); dock.id='pvDock';
dock.innerHTML =
  '<div class="pv-tag">นำเสนอ</div>'+
  '<button class="pv-b pv-on" id="pvMaster" title="เปิด/ปิดโหมดนำเสนอ">◉</button>'+
  '<button class="pv-b" id="pvNext" title="แผงถัดไป">⏭</button>'+
  '<button class="pv-b pv-play" id="pvPlay" title="เล่น / หยุดชั่วคราว (Space)">'+
    '<svg class="pv-ring" viewBox="0 0 52 52"><circle class="bg" cx="26" cy="26" r="23"/>'+
    '<circle class="fg" cx="26" cy="26" r="23" transform="rotate(-90 26 26)"/></svg>'+
    '<span id="pvPlayIco" style="position:relative">⏸</span></button>'+
  '<button class="pv-b" id="pvStop" title="หยุด &amp; กลับค่าเริ่มต้น (Esc)">⏹</button>'+
  '<div class="pv-sep"></div>'+
  '<button class="pv-b" id="pvSpeed" title="ความเร็วสลับ"><span class="pv-spd" id="pvSpdT">10<small>วิ</small></span></button>'+
  '<button class="pv-b" id="pvFull" title="โหมดจอเต็ม (Kiosk)">⛶</button>';
document.body.appendChild(dock);

var cap = document.createElement('div'); cap.id='pvCaption'; document.body.appendChild(cap);

/* ---------- อ้างอิง element ---------- */
var content = document.querySelector('.content');
var mainEl  = document.querySelector('.main');
var panels  = content ? Array.prototype.slice.call(content.querySelectorAll('.panel')) : [];
var mapSeg  = Array.prototype.slice.call(document.querySelectorAll('.seg button'));
var watchSeg= Array.prototype.slice.call(document.querySelectorAll('.wtabs button'));

var fg  = dock.querySelector('.pv-ring .fg');
fg.style.strokeDasharray = CIRC;

/* ---------- ตำแหน่ง dock ให้ชิดขอบซ้ายของเนื้อหา (ไม่ทับเมนู) ---------- */
function placeDock(){
  var ref = mainEl || content;
  if(!ref){ dock.style.left='8px'; return; }
  var r = ref.getBoundingClientRect();
  var left = (window.innerWidth<=820) ? 8 : Math.max(8, r.left + 10);
  dock.style.left = left+'px';
}
placeDock();
window.addEventListener('resize', placeDock);
setTimeout(placeDock,350); setTimeout(placeDock,900);
var app = document.getElementById('app');
if(app && window.MutationObserver){
  new MutationObserver(function(){ setTimeout(placeDock,300); })
    .observe(app,{attributes:true,attributeFilter:['class']});
}

/* ---------- สถานะ ---------- */
var playing=true, autoOn=true, sec=10, elapsed=0, last=0, spotIdx=-1, pinned=null;
var SPEEDS=[5,10,15], si=1;

function setCap(html){
  if(!html){ cap.classList.remove('pv-show'); return; }
  cap.innerHTML = html; cap.classList.add('pv-show');
}

/* คลิกปุ่มถัดไปในกลุ่มปุ่มสลับ (ให้ handler จริงทำงาน) */
function advanceSeg(btns){
  if(!btns.length) return;
  var cur = btns.findIndex(function(b){ return b.classList.contains('on'); });
  var nx = btns[(cur+1+btns.length)%btns.length] || btns[0];
  nx.click();
}
function resetSeg(btns){ if(btns.length) btns[0].click(); }

/* เดินสปอตไลต์ไปแผงถัดไป + สลับมุมมองภายในทุกแผงที่มีปุ่ม */
function tick(){
  if(pinned!==null) return;                 // ปักหมุดอยู่ → ไม่เดิน
  panels.forEach(function(p){ p.classList.remove('pv-spot'); });
  spotIdx = (spotIdx+1) % (panels.length||1);
  var p = panels[spotIdx];
  if(p){
    p.classList.add('pv-spot');
    var h2 = p.querySelector('.ph h2'); var sub = p.querySelector('.ph .sub');
    setCap((h2?('<b>'+h2.textContent.trim()+'</b>'):'') + (sub?('<small>'+sub.textContent.trim()+'</small>'):''));
  }
  advanceSeg(mapSeg);
  advanceSeg(watchSeg);
}

/* ---------- นาฬิกากลาง ---------- */
function loop(ts){
  if(playing && autoOn){
    if(!last) last=ts;
    elapsed += (ts-last)/1000; last=ts;
    if(elapsed>=sec){ elapsed=0; tick(); }
  } else last=0;
  var frac = (playing && autoOn && pinned===null) ? elapsed/sec : 0;
  fg.style.strokeDashoffset = (CIRC*(1-frac)).toFixed(2);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ---------- ปุ่มควบคุม ---------- */
var playIco=document.getElementById('pvPlayIco');
function setPlay(p){ playing=p; playIco.textContent=p?'⏸':'▶'; }
function setAuto(on){
  autoOn=on;
  document.getElementById('pvMaster').classList.toggle('pv-on',on);
  ['pvPlay','pvStop','pvNext','pvSpeed'].forEach(function(id){ document.getElementById(id).disabled=!on; });
  if(on){ content&&content.classList.add('pv-run'); elapsed=0; setPlay(true); if(spotIdx<0) tick(); }
  else { content&&content.classList.remove('pv-run');
         panels.forEach(function(p){ p.classList.remove('pv-spot','pv-pin'); });
         pinned=null; setCap(''); fg.style.strokeDashoffset=CIRC; }
}
document.getElementById('pvMaster').onclick=function(){ setAuto(!autoOn); };
document.getElementById('pvPlay').onclick  =function(){ if(autoOn) setPlay(!playing); };
document.getElementById('pvNext').onclick  =function(){ if(autoOn){ elapsed=0; tick(); } };
document.getElementById('pvStop').onclick  =function(){
  setPlay(false); elapsed=0; spotIdx=-1; pinned=null;
  panels.forEach(function(p){ p.classList.remove('pv-spot','pv-pin'); });
  content&&content.classList.remove('pv-run');
  resetSeg(mapSeg); resetSeg(watchSeg);
  setCap(''); fg.style.strokeDashoffset=CIRC;
};
document.getElementById('pvSpeed').onclick =function(){
  si=(si+1)%SPEEDS.length; sec=SPEEDS[si]; elapsed=0;
  document.getElementById('pvSpdT').innerHTML=sec+'<small>วิ</small>';
};

/* ---------- คลิกแผงเพื่อ "หยุดโฟกัส" จุดนั้น ---------- */
panels.forEach(function(p){
  p.addEventListener('click', function(e){
    if(!autoOn) return;
    if(e.target.closest('button,a,input,select,.seg,.wtabs,canvas,.leaflet-container,#map')) return;
    if(pinned===p){                          // ปล่อยหมุด
      pinned=null; p.classList.remove('pv-pin'); setPlay(true);
      content&&content.classList.add('pv-run');
    } else {                                 // ปักหมุดที่แผงนี้
      panels.forEach(function(x){ x.classList.remove('pv-spot','pv-pin'); });
      pinned=p; p.classList.add('pv-pin'); setPlay(false);
      content&&content.classList.remove('pv-run');
      var h2=p.querySelector('.ph h2');
      setCap('📌 '+(h2?('<b>'+h2.textContent.trim()+'</b>'):'โฟกัสอยู่')+' <small>คลิกซ้ำเพื่อนำเสนอต่อ</small>');
    }
  });
});

/* ---------- โหมดจอเต็ม (Kiosk) ---------- */
document.getElementById('pvFull').onclick=function(){
  var el=document.documentElement;
  if(!document.fullscreenElement){
    (el.requestFullscreen||el.webkitRequestFullscreen||function(){}).call(el);
    if(app){ app.classList.add('collapsed'); }        // ยุบเมนูให้จอโล่ง
  } else {
    (document.exitFullscreen||document.webkitExitFullscreen||function(){}).call(document);
  }
  setTimeout(function(){ window._map&&window._map.invalidateSize&&window._map.invalidateSize(); placeDock(); },300);
};

/* ---------- คีย์ลัด (รีโมท/พรีเซนต์) ---------- */
document.addEventListener('keydown',function(e){
  if(e.target.matches&&e.target.matches('input,textarea,select')) return;
  if(e.code==='Space'){ e.preventDefault(); if(autoOn) setPlay(!playing); }
  else if(e.code==='ArrowRight'){ if(autoOn){ elapsed=0; tick(); } }
  else if(e.code==='Escape'){ document.getElementById('pvStop').click(); }
});

/* เริ่มต้น: เปิดโหมดนำเสนอหลังข้อมูลโหลด (หน่วงเล็กน้อยให้แผงเรนเดอร์ก่อน) */
setTimeout(function(){ setAuto(true); }, 1200);

})();
