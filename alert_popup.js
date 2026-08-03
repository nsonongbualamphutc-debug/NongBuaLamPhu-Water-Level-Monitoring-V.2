/* ══════════════════════════════════════════════════════════════════════
   alert_popup.js — ป๊อปอัปแจ้งเตือนตอนเข้าหน้าแรก
   ─────────────────────────────────────────────────────────────────────
   เด้งขึ้นอัตโนมัติเมื่อเปิดหน้าปก / ภาพรวม ถ้ามี:
     • สถานีน้ำเกินตลิ่ง หรือเข้าเกณฑ์เฝ้าระวัง
     • อำเภอที่คาดมีฝนตกหนัก / พายุฝนฟ้าคะนอง ใน 24 ชม.
   พร้อมรายละเอียดสิ่งที่ต้องติดตามเฝ้าระวัง · กดปิดได้
   ไม่เด้งซ้ำภายในชั่วโมงเดียวกัน (กันรบกวน)
   ══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if (window.__ALERT_POP__) return;  window.__ALERT_POP__ = true;

  var GAS = (window.APP_CONFIG && window.APP_CONFIG.API_URL) || (typeof GAS!=='undefined'?GAS:'');
  var SEEN = 'wnb_pop_seen';
  var AMP = [
    {n:'เมืองหนองบัวลำภู', la:17.1656, lo:102.3953},
    {n:'ศรีบุญเรือง',      la:16.9978, lo:102.2147},
    {n:'นากลาง',           la:17.3278, lo:102.1994},
    {n:'โนนสัง',           la:16.9061, lo:102.5300},
    {n:'สุวรรณคูหา',       la:17.5482, lo:102.2397},
    {n:'นาวัง',            la:17.3509, lo:102.0645}
  ];
  var nf = function(v,d){ return (v==null||isNaN(v))?'—':Number(v).toFixed(d); };
  function hourKey(){ var d=new Date(); return d.toDateString()+'-'+d.getHours(); }

  var CSS = ''
   + '#popWrap{position:fixed;inset:0;z-index:10000;background:rgba(6,16,32,.62);'
   +  'backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);display:none;'
   +  'align-items:center;justify-content:center;padding:16px}'
   + '#popWrap.on{display:flex;animation:pwF .25s ease}'
   + '@keyframes pwF{from{opacity:0}to{opacity:1}}'
   + '#popCard{width:100%;max-width:640px;max-height:86vh;display:flex;flex-direction:column;'
   +  'background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 24px 60px rgba(6,16,32,.5);'
   +  'animation:pwU .38s cubic-bezier(.2,.8,.25,1)}'
   + '@keyframes pwU{from{transform:translateY(28px) scale(.97);opacity:0}to{transform:none;opacity:1}}'
   + '#popCard .ph{position:relative;padding:17px 20px;color:#fff;flex:0 0 auto;'
   +  'background:linear-gradient(135deg,#b91c1c,#ef4444)}'
   + '#popCard.lv2 .ph{background:linear-gradient(135deg,#b45309,#f59e0b)}'
   + '#popCard.lv0 .ph{background:linear-gradient(135deg,#15803d,#22c55e)}'
   + '#popCard .ph b{display:block;font-family:"Kanit",sans-serif;font-weight:700;font-size:18px;line-height:1.35}'
   + '#popCard .ph span{display:block;font-size:11.5px;opacity:.94;margin-top:4px}'
   + '#popCard .ph .x{position:absolute;right:14px;top:14px;width:34px;height:34px;border-radius:50%;'
   +  'background:rgba(255,255,255,.22);border:0;color:#fff;font-size:18px;cursor:pointer}'
   + '#popCard .pb{flex:1 1 auto;min-height:0;overflow-y:auto;padding:15px 18px 8px}'
   + '.pgrp{font-family:"Kanit",sans-serif;font-weight:700;font-size:11px;color:#8798ad;'
   +  'letter-spacing:.5px;margin:14px 0 8px}'
   + '.pgrp:first-child{margin-top:0}'
   + '.pitem{display:flex;align-items:flex-start;gap:11px;padding:11px 13px;border:1px solid #e6edf5;'
   +  'border-radius:13px;margin-bottom:8px;background:#fff}'
   + '.pitem.crit{border-color:#fca5a5;background:linear-gradient(150deg,#fef2f2,#fff)}'
   + '.pitem.warn{border-color:#fcd34d;background:linear-gradient(150deg,#fffbeb,#fff)}'
   + '.pitem .ic{flex:0 0 34px;height:34px;border-radius:11px;display:flex;align-items:center;'
   +  'justify-content:center;font-size:17px;background:#f1f5f9}'
   + '.pitem.crit .ic{background:#fee2e2}.pitem.warn .ic{background:#fef3c7}'
   + '.pitem .tx{flex:1;min-width:0}'
   + '.pitem .tx b{display:block;font-family:"Kanit",sans-serif;font-weight:700;font-size:13.5px;color:#0f172a}'
   + '.pitem .tx span{display:block;font-size:11.5px;color:#475569;line-height:1.6;margin-top:3px}'
   + '.pitem .tg{flex:0 0 auto;font-family:"Kanit",sans-serif;font-size:9.5px;font-weight:700;'
   +  'padding:3px 9px;border-radius:99px;color:#fff;white-space:nowrap}'
   + '.pnone{text-align:center;padding:26px 14px;color:#15803d;font-size:13px;line-height:1.8}'
   + '.pnone .e{font-size:38px;display:block;margin-bottom:8px}'
   + '.pact{background:#f8fafc;border:1px solid #eef2f7;border-radius:13px;padding:12px 14px;margin-top:6px}'
   + '.pact b{display:block;font-family:"Kanit",sans-serif;font-weight:700;font-size:12px;color:#0f172a;margin-bottom:7px}'
   + '.pact ul{margin:0;padding-left:18px;font-size:11.5px;color:#475569;line-height:1.85}'
   + '#popCard .pf{flex:0 0 auto;padding:12px 18px 16px;border-top:1px solid #eef2f7;display:flex;gap:9px}'
   + '#popCard .pf button{flex:1;height:46px;border-radius:13px;border:1px solid #e6edf5;background:#fff;'
   +  'cursor:pointer;font-family:"Kanit",sans-serif;font-weight:600;font-size:13.5px;color:#0f172a}'
   + '#popCard .pf .go{background:#b91c1c;border-color:#b91c1c;color:#fff}'
   + '#popCard.lv2 .pf .go{background:#b45309;border-color:#b45309}'
   + '#popCard.lv0 .pf .go{background:#15803d;border-color:#15803d}'
   + '@media(max-width:640px){#popWrap{padding:0;align-items:flex-end}'
   +  '#popCard{max-width:100%;border-radius:20px 20px 0 0;max-height:90vh}'
   +  '#popCard .ph b{font-size:16px}}'
   + 'html[data-theme="dark"] #popCard{background:#161f31;color:#dbe4f0}'
   + 'html[data-theme="dark"] .pitem{background:#1a2437;border-color:#2b3a52}'
   + 'html[data-theme="dark"] .pitem .tx b{color:#e8eef7}'
   + 'html[data-theme="dark"] .pitem .tx span{color:#a8b8cc}'
   + 'html[data-theme="dark"] .pact{background:#131c2c;border-color:#243247}'
   + 'html[data-theme="dark"] .pact b{color:#e8eef7}'
   + 'html[data-theme="dark"] .pact ul{color:#a8b8cc}'
   + 'html[data-theme="dark"] #popCard .pf{border-top-color:#243247}'
   + 'html[data-theme="dark"] #popCard .pf button{background:#1a2437;border-color:#2b3a52;color:#dbe4f0}';

  /* ── ดึงสถานีที่ผิดปกติ ── */
  async function loadWater(){
    if(!GAS) return [];
    var out = [];
    await Promise.all(['paneang','mong','mo','phuay'].map(async function(k){
      try{
        var c=new AbortController(); var t=setTimeout(function(){c.abort();},11000);
        var r=await fetch(GAS+'?action='+k+'&_t='+Date.now(),{cache:'no-store',signal:c.signal});
        clearTimeout(t);
        if(!r.ok) return;
        var d=await r.json(), arr=d.stations||d.data||[];
        arr.forEach(function(it){
          var lv=[it.cur,it.current,it.current_level,it.water_level,it.level].find(function(v){return v!=null&&v!==''&&!isNaN(v);});
          var cr=[it.crit,it.crit_level,it.bank,it.bank_level].find(function(v){return v!=null&&v!==''&&!isNaN(v);});
          var wn=[it.warn,it.warn_level].find(function(v){return v!=null&&v!==''&&!isNaN(v);});
          if(lv==null||cr==null) return;
          lv=+lv; cr=+cr; wn=wn!=null?+wn:cr-0.5;
          var st = lv>=cr ? 'crit' : (lv>=wn ? 'warn' : null);
          if(!st) return;
          out.push({name:it.name||it.station_id||'-', river:d.river||k, amphoe:it.amphoe||'',
                    cur:lv, warn:wn, crit:cr, st:st, gap:cr-lv});
        });
      }catch(e){}
    }));
    return out.sort(function(a,b){ return (a.st===b.st? a.gap-b.gap : (a.st==='crit'?-1:1)); });
  }

  /* ── ดึงอำเภอที่คาดฝนหนัก ── */
  async function loadRain(){
    try{
      var qs='latitude='+AMP.map(function(a){return a.la;}).join(',')
           +'&longitude='+AMP.map(function(a){return a.lo;}).join(',')
           +'&hourly=precipitation,weather_code,wind_gusts_10m&forecast_days=2&timezone=Asia%2FBangkok';
      var d=await (await fetch('https://api.open-meteo.com/v1/forecast?'+qs)).json();
      var arr=Array.isArray(d)?d:[d], out=[];
      AMP.forEach(function(a,i){
        var h=arr[i]&&arr[i].hourly; if(!h) return;
        var now=new Date(), rain=0, mx=0, gust=0, storm=null, when=null;
        for(var j=0;j<h.time.length&&j<30;j++){
          var t=new Date(h.time[j]); if(t<now) continue;
          var hr=Math.round((t-now)/3600000); if(hr>24) break;
          var pr=h.precipitation[j]||0, gu=h.wind_gusts_10m[j]||0, cd=h.weather_code[j];
          rain+=pr; if(pr>mx){mx=pr; when=hr;} if(gu>gust) gust=gu;
          if(cd>=95&&cd<=99&&storm===null) storm=hr;
        }
        var lv = (mx>=10||gust>=70||storm!==null||rain>=90) ? 'crit'
               : ((mx>=4||gust>=50||rain>=35) ? 'warn' : null);
        if(lv) out.push({amp:a.n, lv:lv, rain:rain, mx:mx, gust:gust, storm:storm, when:when});
      });
      return out.sort(function(a,b){ return a.lv===b.lv?0:(a.lv==='crit'?-1:1); });
    }catch(e){ return []; }
  }

  function render(W,R){
    var nC=W.filter(function(x){return x.st==='crit';}).length;
    var nW=W.filter(function(x){return x.st==='warn';}).length;
    var rC=R.filter(function(x){return x.lv==='crit';}).length;
    var lv = (nC||rC) ? 3 : ((nW||R.length) ? 2 : 0);
    var card=document.getElementById('popCard');
    card.className = lv===3?'':(lv===2?'lv2':'lv0');

    var head = lv===3 ? '🚨 แจ้งเตือนสถานการณ์น้ำ'
             : (lv===2 ? '⚠️ เฝ้าระวังสถานการณ์น้ำ' : '✅ สถานการณ์ปกติ');
    var sub  = lv===0 ? 'ไม่มีจุดเกินตลิ่ง และไม่มีพื้นที่คาดฝนหนักใน 24 ชม.'
             : [nC?nC+' จุดเกินตลิ่ง':'', nW?nW+' จุดเฝ้าระวัง':'',
                R.length?R.length+' อำเภอคาดฝนหนัก':''].filter(Boolean).join(' · ');

    var body='';
    if(W.length){
      body += '<div class="pgrp">💧 สถานีที่ต้องติดตาม</div>';
      body += W.slice(0,6).map(function(x){
        var c=x.st==='crit'?'#dc2626':'#f59e0b';
        return '<div class="pitem '+x.st+'"><span class="ic">'+(x.st==='crit'?'🔴':'🟡')+'</span>'
         + '<span class="tx"><b>'+x.name+'</b><span>'+x.river+(x.amphoe?' · อ.'+String(x.amphoe).replace('อ.',''):'')
         + '<br>ระดับน้ำ <b>'+nf(x.cur,2)+'</b> ม.รทก. · '
         + (x.gap<=0 ? 'เกินตลิ่งแล้ว <b>'+nf(-x.gap,2)+' ม.</b>' : 'เหลือถึงวิกฤติ <b>'+nf(x.gap,2)+' ม.</b>')
         + '</span></span>'
         + '<span class="tg" style="background:'+c+'">'+(x.st==='crit'?'วิกฤติ':'เฝ้าระวัง')+'</span></div>';
      }).join('');
      if(W.length>6) body += '<div style="font-size:11px;color:#8798ad;text-align:center;margin:-2px 0 8px">และอีก '+(W.length-6)+' จุด</div>';
    }
    if(R.length){
      body += '<div class="pgrp">🌧️ พื้นที่คาดฝนตกหนัก 24 ชม. ข้างหน้า</div>';
      body += R.map(function(x){
        var c=x.lv==='crit'?'#dc2626':'#f59e0b';
        var what=[]; if(x.storm!==null) what.push('พายุฝนฟ้าคะนอง');
        if(x.mx>=10) what.push('ฝนตกหนัก'); else if(x.mx>=4) what.push('ฝนปานกลาง');
        if(x.gust>=50) what.push('ลมกระโชกแรง');
        var when = x.storm!==null ? x.storm : (x.when||0);
        return '<div class="pitem '+x.lv+'"><span class="ic">'+(x.lv==='crit'?'⛈️':'🌦️')+'</span>'
         + '<span class="tx"><b>อ.'+x.amp+'</b><span>'
         + (when<=0?'<b>ขณะนี้</b>':'อีก <b>'+when+' ชั่วโมง</b>')+' คาดมี<b>'+(what.join(' + ')||'ฝน')+'</b>'
         + '<br>ฝนรวม 24 ชม. '+nf(x.rain,0)+' มม.'+(x.gust?' · ลมกระโชก '+Math.round(x.gust)+' กม./ชม.':'')
         + '</span></span>'
         + '<span class="tg" style="background:'+c+'">'+(x.lv==='crit'?'เสี่ยงสูง':'เฝ้าระวัง')+'</span></div>';
      }).join('');
    }
    if(!W.length && !R.length){
      body = '<div class="pnone"><span class="e">✅</span><b>ทุกสถานีอยู่ในเกณฑ์ปกติ</b><br>'
           + 'ไม่มีจุดน้ำเกินตลิ่ง และไม่มีพื้นที่คาดฝนตกหนักใน 24 ชม. ข้างหน้า</div>';
    }

    /* สิ่งที่ต้องติดตามเฝ้าระวัง */
    var acts=[];
    if(nC) acts.push('<b>ลงพื้นที่ทันที</b> จุดที่น้ำเกินตลิ่ง · แจ้งเตือนประชาชนริมน้ำ · เตรียมเส้นทางอพยพ');
    if(nW) acts.push('เพิ่มความถี่การอ่านค่าจุดเฝ้าระวัง · ตรวจทางระบายน้ำและประตูระบาย');
    if(rC) acts.push('พื้นที่คาดฝนหนัก — ตรวจจุดลุ่มต่ำ · เตรียมเครื่องสูบน้ำ · แจ้งท้องถิ่นล่วงหน้า');
    if(R.length && !rC) acts.push('ติดตามพยากรณ์ทุก 3 ชั่วโมง หากฝนต่อเนื่องให้ยกระดับการเฝ้าระวัง');
    if(!acts.length) acts.push('ติดตามสถานการณ์ตามปกติ · อ่านค่าระดับน้ำตามรอบที่กำหนด');
    acts.push('พบเหตุฉุกเฉิน แจ้งสายด่วน <b>1784</b> ตลอด 24 ชั่วโมง');
    body += '<div class="pgrp">📌 สิ่งที่ต้องติดตามเฝ้าระวัง</div>'
          + '<div class="pact"><b>ข้อเสนอแนะการปฏิบัติ</b><ul><li>'+acts.join('</li><li>')+'</li></ul></div>';

    card.innerHTML =
      '<div class="ph"><b>'+head+'</b><span>'+sub+' · ข้อมูล ณ '
      + new Date().toLocaleString('th-TH',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})+' น.</span>'
      + '<button class="x" onclick="wnbPop(false)" aria-label="ปิด">✕</button></div>'
      + '<div class="pb">'+body+'</div>'
      + '<div class="pf"><button onclick="wnbPop(false)">ปิดหน้าต่าง</button>'
      + '<button class="go" onclick="location.href=\'rivers.html\'">ดูรายละเอียดทุกสถานี</button></div>';
  }

  window.wnbPop = function(open){
    var el=document.getElementById('popWrap'); if(!el) return;
    if(open){ el.classList.add('on'); document.body.style.overflow='hidden'; }
    else{
      el.classList.remove('on'); document.body.style.overflow='';
      try{ sessionStorage.setItem(SEEN, hourKey()); }catch(e){}
    }
  };

  async function boot(){
    if(!document.getElementById('popCSS')){
      var st=document.createElement('style'); st.id='popCSS'; st.textContent=CSS;
      document.head.appendChild(st);
    }
    if(document.getElementById('popWrap')) return;
    var w=document.createElement('div'); w.id='popWrap';
    w.innerHTML='<div id="popCard"></div>';
    w.onclick=function(e){ if(e.target===w) wnbPop(false); };
    document.body.appendChild(w);
    document.addEventListener('keydown',function(e){ if(e.key==='Escape') wnbPop(false); });

    /* เด้งชั่วโมงละครั้ง — กันรบกวน */
    var seen=null; try{ seen=sessionStorage.getItem(SEEN); }catch(e){}
    if(seen===hourKey()) return;

    var res = await Promise.all([loadWater(), loadRain()]);
    render(res[0], res[1]);
    /* ไม่มีอะไรผิดปกติ = ไม่ต้องเด้งกวน */
    if(!res[0].length && !res[1].length){
      try{ sessionStorage.setItem(SEEN, hourKey()); }catch(e){}
      return;
    }
    wnbPop(true);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
