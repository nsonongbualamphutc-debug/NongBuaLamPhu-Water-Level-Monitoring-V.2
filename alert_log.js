/* ══════════════════════════════════════════════════════════════════════
   บันทึกประวัติการแจ้งเตือน — จ.หนองบัวลำภู
   ─────────────────────────────────────────────────────────────────────
   ทำอะไร: ทุกครั้งที่เปิดหน้าลำน้ำ/ภาพรวม ระบบจะตรวจว่ามีสถานีใด
           เข้าเกณฑ์ธงเหลือง/แดง แล้วบันทึกไว้ในเครื่อง (localStorage)
           พร้อมวันเวลา ระดับน้ำ และเกณฑ์ที่ใช้
   ใช้ทำอะไร: ดูย้อนหลังว่าจุดไหนเคยเตือนบ่อย · ทำรายงานสรุป ·
              ส่งออก CSV แนบหนังสือราชการ
   หมายเหตุ: เก็บในเครื่องผู้ใช้เท่านั้น ไม่ส่งข้อมูลออกไปไหน
             ไม่แตะฐานข้อมูลหลังบ้าน (ปลอดภัย ไม่กระทบข้อมูลเจ้าหน้าที่)
   ══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if (window.__ALERT_LOG__) return;  window.__ALERT_LOG__ = true;

  var KEY = 'wnb_alert_log';
  var MAX = 800;                 /* เก็บสูงสุด 800 รายการ ตัดของเก่าออก */

  function get(){ try{ return JSON.parse(localStorage.getItem(KEY)||'[]'); }catch(e){ return []; } }
  function put(a){ try{ localStorage.setItem(KEY, JSON.stringify(a.slice(-MAX))); }catch(e){} }
  function pad(n){ return String(n).padStart(2,'0'); }
  function dstr(d){ return d.getFullYear()+543 + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()); }
  function tstr(d){ return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function nfx(v,d){ return (v==null||isNaN(v))?'—':Number(v).toFixed(d); }

  /* ── บันทึกเหตุการณ์ — กันซ้ำวันละครั้งต่อจุดต่อระดับ ── */
  window.logAlert = function(items){
    if (!items || !items.length) return;
    var log = get(), now = new Date(), day = dstr(now), added = 0;
    items.forEach(function(it){
      if (!it || !it.name || !it.level) return;
      var dup = log.some(function(x){
        return x.d===day && x.name===it.name && x.lv===it.level;
      });
      if (dup) return;
      log.push({ d:day, t:tstr(now), name:it.name, river:it.river||'', amp:it.amphoe||'',
                 lv:it.level, cur:it.cur, y:it.warn, r:it.crit, ts:now.getTime() });
      added++;
    });
    if (added) put(log);
    paintBadge();
  };

  function paintBadge(){
    var b = document.getElementById('logBtn'); if (!b) return;
    var day = dstr(new Date());
    var n = get().filter(function(x){ return x.d===day; }).length;
    var bd = b.querySelector('.bdg');
    if (bd){ bd.textContent = n||''; bd.style.display = n?'flex':'none'; }
    b.title = n ? 'ประวัติแจ้งเตือน — วันนี้ '+n+' รายการ' : 'ประวัติการแจ้งเตือน';
  }

  var CSS = ''
   + '#logBtn{position:relative;background:linear-gradient(145deg,#4338ca,#6366f1);color:#fff}'
   + '#logBtn .bdg{position:absolute;top:-3px;right:-3px;min-width:18px;height:18px;border-radius:99px;'
   +   'background:#fff;color:#4338ca;font-family:"Kanit",sans-serif;font-weight:800;font-size:10px;'
   +   'display:none;align-items:center;justify-content:center;padding:0 4px;box-shadow:0 2px 6px rgba(0,0,0,.3)}'
   + '#logSheet{position:fixed;inset:0;z-index:9999;background:rgba(8,20,38,.55);backdrop-filter:blur(4px);'
   +   '-webkit-backdrop-filter:blur(4px);display:none;align-items:flex-end;justify-content:center}'
   + '#logSheet.on{display:flex;animation:lgFade .2s ease}'
   + '@keyframes lgFade{from{opacity:0}to{opacity:1}}'
   + '#logCard{width:100%;max-width:600px;background:#fff;border-radius:22px 22px 0 0;max-height:88vh;'
   +   'display:flex;flex-direction:column;box-shadow:0 -10px 40px rgba(10,30,60,.3);'
   +   'animation:lgUp .32s cubic-bezier(.2,.8,.25,1);padding-bottom:env(safe-area-inset-bottom)}'
   + '@keyframes lgUp{from{transform:translateY(100%)}to{transform:none}}'
   + '@media(min-width:640px){#logSheet{align-items:center}#logCard{border-radius:22px;max-height:84vh}}'
   + '#logCard .lh{padding:15px 18px;color:#fff;background:linear-gradient(135deg,#4338ca,#6366f1);flex:0 0 auto;position:relative}'
   + '#logCard .lh b{display:block;font-family:"Kanit",sans-serif;font-weight:700;font-size:16px}'
   + '#logCard .lh span{display:block;font-size:11px;opacity:.92;margin-top:3px}'
   + '#logCard .lh .x{position:absolute;right:13px;top:13px;width:34px;height:34px;border-radius:50%;'
   +   'background:rgba(255,255,255,.2);border:0;color:#fff;font-size:17px;cursor:pointer}'
   + '#logCard .lstat{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px 16px 0;flex:0 0 auto}'
   + '#logCard .lstat div{background:#f8fafc;border:1px solid #eef2f7;border-radius:11px;padding:8px 10px;text-align:center}'
   + '#logCard .lstat em{display:block;font-style:normal;font-size:9px;color:#94a3b8}'
   + '#logCard .lstat b{display:block;font-family:"Kanit",sans-serif;font-weight:800;font-size:17px;margin-top:2px}'
   + '#logCard .lbody{flex:1 1 auto;min-height:0;overflow-y:auto;padding:12px 16px 8px}'
   + '.lgday{font-family:"Kanit",sans-serif;font-weight:700;font-size:10.5px;color:#8798ad;'
   +   'margin:10px 0 6px;letter-spacing:.4px}'
   + '.lgday:first-child{margin-top:0}'
   + '.lgrow{display:flex;align-items:center;gap:9px;padding:9px 11px;border:1px solid #e6edf5;'
   +   'border-radius:11px;margin-bottom:6px;font-size:12px;background:#fff}'
   + '.lgrow.crit{border-color:#fecaca;background:linear-gradient(150deg,#fef2f2,#fff)}'
   + '.lgrow.warn{border-color:#fde68a;background:linear-gradient(150deg,#fffbeb,#fff)}'
   + '.lgrow .tm{flex:0 0 auto;font-family:"Kanit",sans-serif;font-size:10.5px;color:#94a3b8;min-width:36px}'
   + '.lgrow .nm{flex:1;min-width:0}'
   + '.lgrow .nm b{display:block;font-family:"Kanit",sans-serif;font-weight:600;font-size:12.5px;color:#0f172a;'
   +   'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
   + '.lgrow .nm span{display:block;font-size:10px;color:#8798ad;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
   + '.lgrow .vv{flex:0 0 auto;text-align:right}'
   + '.lgrow .vv u{text-decoration:none;display:block;font-family:"Kanit",sans-serif;font-weight:700;font-size:12.5px;'
   +   'font-variant-numeric:tabular-nums}'
   + '.lgrow .fg{flex:0 0 auto;font-family:"Kanit",sans-serif;font-size:9.5px;font-weight:700;'
   +   'padding:3px 8px;border-radius:99px;color:#fff;white-space:nowrap}'
   + '#logCard .lfoot{flex:0 0 auto;padding:11px 16px 15px;border-top:1px solid #eef2f7;display:flex;gap:9px}'
   + '#logCard .lfoot button{flex:1;height:42px;border-radius:12px;border:1px solid #e6edf5;background:#fff;'
   +   'cursor:pointer;font-family:"Kanit",sans-serif;font-weight:600;font-size:12.5px;color:#0f172a}'
   + '#logCard .lfoot .dl{background:#4338ca;border-color:#4338ca;color:#fff}'
   + '.lgempty{text-align:center;padding:34px 16px;color:#94a3b8;font-size:12.5px;line-height:1.7}'
   + '.lgempty .e{font-size:34px;display:block;margin-bottom:9px;opacity:.6}'
   + 'html[data-theme="dark"] #logCard{background:#161f31;color:#dbe4f0}'
   + 'html[data-theme="dark"] #logCard .lstat div{background:#131c2c;border-color:#243247}'
   + 'html[data-theme="dark"] .lgrow{background:#1a2437;border-color:#2b3a52}'
   + 'html[data-theme="dark"] .lgrow .nm b{color:#e8eef7}'
   + 'html[data-theme="dark"] #logCard .lfoot{border-top-color:#243247}'
   + 'html[data-theme="dark"] #logCard .lfoot button{background:#1a2437;border-color:#2b3a52;color:#dbe4f0}'
   + 'html[data-theme="dark"] #logCard .lfoot .dl{background:#4338ca;color:#fff}';

  function paint(){
    var log = get().slice().reverse();
    var day = dstr(new Date());
    var nToday = log.filter(function(x){ return x.d===day; }).length;
    var nCrit  = log.filter(function(x){ return x.lv==='crit'; }).length;
    var days   = new Set(log.map(function(x){ return x.d; })).size;
    var card = document.getElementById('logCard');
    var groups = {};
    log.forEach(function(x){ (groups[x.d] = groups[x.d] || []).push(x); });
    var body = Object.keys(groups).length
      ? Object.keys(groups).map(function(d){
          return '<div class="lgday">📅 ' + d + ' · ' + groups[d].length + ' รายการ</div>'
            + groups[d].map(function(x){
                var c = x.lv==='crit' ? '#dc2626' : '#f59e0b';
                var f = x.lv==='crit' ? '🔴 วิกฤติ' : '🟡 แจ้งเตือน';
                return '<div class="lgrow ' + x.lv + '"><span class="tm">' + x.t + '</span>'
                  + '<span class="nm"><b>' + x.name + '</b><span>' + (x.river||'') 
                  + (x.amp?' · อ.'+x.amp.replace('อ.',''):'') + '</span></span>'
                  + '<span class="vv"><u style="color:' + c + '">' + nfx(x.cur,2) + '</u></span>'
                  + '<span class="fg" style="background:' + c + '">' + f + '</span></div>';
              }).join('');
        }).join('')
      : '<div class="lgempty"><span class="e">📋</span>ยังไม่มีประวัติการแจ้งเตือน<br>'
        + '<small>ระบบจะบันทึกอัตโนมัติเมื่อมีสถานีเข้าเกณฑ์ธงเหลืองหรือธงแดง</small></div>';
    card.innerHTML =
      '<div class="lh"><b>📋 ประวัติการแจ้งเตือน</b>'
      + '<span>บันทึกอัตโนมัติในเครื่องนี้ · ใช้ทำรายงานย้อนหลัง</span>'
      + '<button class="x" onclick="wnbLog(false)" aria-label="ปิด">✕</button></div>'
      + '<div class="lstat">'
      + '<div><em>วันนี้</em><b style="color:#4338ca">' + nToday + '</b></div>'
      + '<div><em>วิกฤติสะสม</em><b style="color:#dc2626">' + nCrit + '</b></div>'
      + '<div><em>จำนวนวันที่มีเหตุ</em><b style="color:#0f172a">' + days + '</b></div></div>'
      + '<div class="lbody">' + body + '</div>'
      + '<div class="lfoot"><button onclick="wnbLogClear()">🗑 ล้างประวัติ</button>'
      + '<button class="dl" onclick="wnbLogCSV()">⬇ ส่งออก CSV</button></div>';
  }

  window.wnbLog = function(open){
    var el = document.getElementById('logSheet'); if (!el) return;
    if (open){ paint(); el.classList.add('on'); document.body.style.overflow='hidden'; }
    else { el.classList.remove('on'); document.body.style.overflow=''; }
  };

  window.wnbLogClear = function(){
    if (!confirm('ล้างประวัติการแจ้งเตือนทั้งหมดในเครื่องนี้?\n(ข้อมูลระดับน้ำในระบบไม่ถูกลบ)')) return;
    try{ localStorage.removeItem(KEY); }catch(e){}
    paint(); paintBadge();
  };

  window.wnbLogCSV = function(){
    var log = get();
    if (!log.length) return alert('ยังไม่มีประวัติให้ส่งออก');
    var hd = ['วันที่','เวลา','สถานี','ลำน้ำ','อำเภอ','ระดับธง','ระดับน้ำ(ม.รทก.)','เกณฑ์เหลือง','เกณฑ์แดง'];
    var body = log.map(function(x){
      return [x.d, x.t, x.name, x.river||'', x.amp||'',
              x.lv==='crit'?'ธงแดง (วิกฤติ)':'ธงเหลือง (แจ้งเตือน)',
              nfx(x.cur,2), nfx(x.y,2), nfx(x.r,2)];
    });
    var csv = '\uFEFF' + [hd].concat(body).map(function(r){
      return r.map(function(c){ var v=String(c); return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; }).join(',');
    }).join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    a.download = 'ประวัติแจ้งเตือนน้ำ_' + dstr(new Date()) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1500);
  };

  /* หาแถบบนของหน้า แล้ววางชุดปุ่มไว้ท้ายแถบ (ไม่บังเนื้อหา)
     ถ้าหน้าไหนไม่มีแถบบน ค่อยกลับไปเป็นปุ่มลอยมุมขวาล่าง */
  function mountHost(){
    var bar = document.querySelector('.topbar') || document.querySelector('header.top')
           || document.querySelector('.top');
    if(!bar) return null;
    var right = bar.querySelector('.top-right');
    return right || bar;
  }
  function makeWrap(){
    var w = document.createElement('div'); w.id='fabWrap';
    var host = mountHost();
    if(host){ host.appendChild(w); }
    else { w.className='floating'; document.body.appendChild(w); }
    return w;
  }
  function waitFab(){
    return new Promise(function(resolve){
      var n = 0;
      (function look(){
        var w = document.getElementById('fabWrap');
        if (w && w.querySelector('button')) return resolve(w);
        if (++n > 45){
          if (w) return resolve(w);
          var e = document.createElement('div'); e.id='fabWrap';
          e.style.cssText='position:fixed;right:16px;bottom:16px;z-index:9998;'
                        + 'display:flex;flex-direction:column;gap:10px;align-items:center';
          document.body.appendChild(e); return resolve(e);
        }
        setTimeout(look, 100);
      })();
    });
  }

  async function boot(){
    if (!document.getElementById('alertLogCSS')){
      var st = document.createElement('style'); st.id='alertLogCSS'; st.textContent=CSS;
      document.head.appendChild(st);
    }
    if (document.getElementById('logBtn')) return;
    var wrap = await waitFab();
    var b = document.createElement('button');
    b.id='logBtn'; b.type='button'; b.title='ประวัติการแจ้งเตือน';
    b.innerHTML='📋<span class="bdg"></span>';
    b.onclick=function(){ wnbLog(true); };
    wrap.appendChild(b);
    var sh = document.createElement('div'); sh.id='logSheet';
    sh.innerHTML='<div id="logCard"></div>';
    sh.onclick=function(e){ if(e.target===sh) wnbLog(false); };
    document.body.appendChild(sh);
    document.addEventListener('keydown',function(e){ if(e.key==='Escape') wnbLog(false); });
    paintBadge();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
