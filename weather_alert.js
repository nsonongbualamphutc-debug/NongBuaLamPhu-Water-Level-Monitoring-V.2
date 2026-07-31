/* ══════════════════════════════════════════════════════════════════════
   ระบบเตือนภัยล่วงหน้าจากพยากรณ์อากาศ — จ.หนองบัวลำภู
   ─────────────────────────────────────────────────────────────────────
   ทำอะไร: ดึงพยากรณ์รายชั่วโมง 6 อำเภอ แล้วประเมินว่า "อีกกี่ชั่วโมง
           จะเกิดอะไร" — ฝนหนัก · ฝนฟ้าคะนอง · ลมกระโชกแรง
   แสดงเป็นแถบเตือนบนสุดของหน้า กดดูรายละเอียดรายอำเภอได้
   แหล่งข้อมูล: Open-Meteo (ฟรี ไม่ต้องใช้ API key) เรียกจากเบราว์เซอร์
   ══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if (window.__WX_ALERT__) return;  window.__WX_ALERT__ = true;

  /* จุดศูนย์กลางอำเภอ — คำนวณจากขอบเขตตำบลจริง */
  var AMP = [
    {n:'เมืองหนองบัวลำภู', la:17.1656, lo:102.3953},
    {n:'ศรีบุญเรือง',      la:16.9978, lo:102.2147},
    {n:'นากลาง',           la:17.3278, lo:102.1994},
    {n:'โนนสัง',           la:16.9061, lo:102.5300},
    {n:'สุวรรณคูหา',       la:17.5482, lo:102.2397},
    {n:'นาวัง',            la:17.3509, lo:102.0645}
  ];

  /* ── เกณฑ์เตือน (อิงกรมอุตุนิยมวิทยา) ── */
  var TH = {
    rainHeavy: 35,   /* มม./24ชม. = ฝนหนัก */
    rainVery : 90,   /* มม./24ชม. = ฝนหนักมาก */
    rainHr   : 10,   /* มม./ชม.   = ฝนตกหนักในชั่วโมงนั้น */
    gust     : 50,   /* กม./ชม.   = ลมกระโชกแรง */
    gustHigh : 70    /* กม./ชม.   = ลมแรงอันตราย */
  };
  /* รหัสสภาพอากาศ WMO ที่ถือว่าเป็นพายุฝนฟ้าคะนอง */
  function isStorm(c){ return c>=95 && c<=99; }
  function wxName(c){
    if (c>=95) return 'พายุฝนฟ้าคะนอง';
    if (c>=80) return 'ฝนตกหนักเป็นช่วง';
    if (c>=61) return 'ฝนตก';
    if (c>=51) return 'ฝนปรอย';
    if (c>=45) return 'หมอก';
    if (c>=2)  return 'เมฆมาก';
    return 'ท้องฟ้าโปร่ง';
  }

  var CSS = ''
   /* ปุ่มไอคอนลอย — อยู่ในชุดเดียวกับปุ่มแจ้งเหตุ/สลับโหมด */
   + '#wxBtn{position:relative;background:linear-gradient(145deg,#0369a1,#0ea5e9);color:#fff}'
   + '#wxBtn.lv2{background:linear-gradient(145deg,#b45309,#f59e0b)}'
   + '#wxBtn.lv3{background:linear-gradient(145deg,#b91c1c,#ef4444);animation:wxAlarm 2s ease-in-out infinite}'
   + '@keyframes wxAlarm{0%,100%{box-shadow:0 6px 20px rgba(185,28,28,.45)}'
   +   '50%{box-shadow:0 6px 26px rgba(185,28,28,.8),0 0 0 6px rgba(239,68,68,.16)}}'
   + '#wxBtn .bdg{position:absolute;top:-3px;right:-3px;min-width:18px;height:18px;border-radius:99px;'
   +   'background:#fff;color:#b91c1c;font-family:"Kanit",sans-serif;font-weight:800;font-size:10px;'
   +   'display:none;align-items:center;justify-content:center;padding:0 4px;'
   +   'box-shadow:0 2px 6px rgba(0,0,0,.3)}'
   + '#wxBtn.lv2 .bdg,#wxBtn.lv3 .bdg{display:flex}'
   + '#wxBtn.lv2 .bdg{color:#b45309}'
   /* แผ่นข้อมูล — ใช้โครงเดียวกับแผ่นแจ้งเหตุ */
   + '#wxSheet{position:fixed;inset:0;z-index:9999;background:rgba(8,20,38,.55);'
   +   'backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:none;'
   +   'align-items:flex-end;justify-content:center}'
   + '#wxSheet.on{display:flex;animation:wxFade .2s ease}'
   + '@keyframes wxFade{from{opacity:0}to{opacity:1}}'
   + '#wxCard{width:100%;max-width:560px;background:#fff;border-radius:22px 22px 0 0;max-height:88vh;'
   +   'overflow-y:auto;box-shadow:0 -10px 40px rgba(10,30,60,.3);'
   +   'animation:wxUp .32s cubic-bezier(.2,.8,.25,1);padding-bottom:env(safe-area-inset-bottom)}'
   + '@keyframes wxUp{from{transform:translateY(100%)}to{transform:none}}'
   + '@media(min-width:640px){#wxSheet{align-items:center}#wxCard{border-radius:22px;max-height:84vh}}'
   + '#wxCard .wh{position:sticky;top:0;z-index:2;padding:15px 18px;color:#fff;'
   +   'background:linear-gradient(135deg,#0369a1,#0ea5e9)}'
   + '#wxCard.lv2 .wh{background:linear-gradient(135deg,#b45309,#f59e0b)}'
   + '#wxCard.lv3 .wh{background:linear-gradient(135deg,#b91c1c,#ef4444)}'
   + '#wxCard .wh b{display:block;font-family:"Kanit",sans-serif;font-weight:700;font-size:16px;line-height:1.35}'
   + '#wxCard .wh span{display:block;font-size:11px;opacity:.92;margin-top:3px}'
   + '#wxCard .wh .x{position:absolute;right:13px;top:13px;width:34px;height:34px;border-radius:50%;'
   +   'background:rgba(255,255,255,.2);border:0;color:#fff;font-size:17px;cursor:pointer}'
   + '#wxCard .wb{padding:14px 16px 18px}'
   + '.wxgrid{display:grid;grid-template-columns:1fr;gap:9px}'
   + '@media(min-width:520px){.wxgrid{grid-template-columns:1fr 1fr}}'
   + '.wxc{border:1px solid #e6edf5;border-radius:13px;background:#fff;padding:11px 13px;min-width:0}'
   + '.wxc.a2{border-color:#fcd34d;background:linear-gradient(150deg,#fffbeb,#fff)}'
   + '.wxc.a3{border-color:#fca5a5;background:linear-gradient(150deg,#fef2f2,#fff)}'
   + '.wxc .h{display:flex;align-items:center;gap:7px;margin-bottom:6px}'
   + '.wxc .h b{font-family:"Kanit",sans-serif;font-weight:700;font-size:13px;color:#0f172a;'
   +   'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
   + '.wxc .h .lv{font-family:"Kanit",sans-serif;font-size:9.5px;font-weight:700;padding:2px 8px;'
   +   'border-radius:99px;color:#fff;white-space:nowrap}'
   + '.wxc .msg{font-size:11.5px;line-height:1.55;color:#334155}'
   + '.wxc .msg b{font-family:"Kanit",sans-serif;font-weight:700}'
   + '.wxc .mt{display:flex;gap:6px;margin-top:7px;flex-wrap:wrap}'
   + '.wxc .mt span{font-size:9.5px;background:#f1f5f9;border-radius:99px;padding:2px 8px;color:#475569}'
   + '.wxnote{margin-top:12px;font-size:10px;color:#7c8ba1;line-height:1.65;background:#f8fafc;'
   +   'border:1px solid #eef2f7;border-radius:11px;padding:10px 12px}'
   + 'html[data-theme="dark"] #wxCard{background:#161f31;color:#dbe4f0}'
   + 'html[data-theme="dark"] .wxc{background:#1a2437;border-color:#2b3a52}'
   + 'html[data-theme="dark"] .wxc .h b{color:#e8eef7}'
   + 'html[data-theme="dark"] .wxc .msg{color:#c8d5e6}'
   + 'html[data-theme="dark"] .wxc .mt span{background:#131c2c;color:#8fa0b6}'
   + 'html[data-theme="dark"] .wxnote{background:#131c2c;border-color:#243247;color:#8fa0b6}';

  function inject(){
    if (document.getElementById('wxAlertCSS')) return;
    var st = document.createElement('style'); st.id='wxAlertCSS'; st.textContent=CSS;
    document.head.appendChild(st);
  }

  /* ── ประเมินความเสี่ยงจากพยากรณ์รายชั่วโมง 24 ชม. ข้างหน้า ── */
  function assess(h){
    var now = new Date(), best = null, lv = 0, tags = [];
    var maxRain=0, maxGust=0, storm=null, rain24=0;
    for (var i=0; i<h.time.length && i<30; i++){
      var t = new Date(h.time[i]);
      if (t < now) continue;
      var hrs = Math.round((t - now)/3600000);
      if (hrs > 24) break;
      var pr = h.precipitation[i]||0, gu = h.wind_gusts_10m[i]||0, cd = h.weather_code[i];
      rain24 += pr;
      if (pr > maxRain) maxRain = pr;
      if (gu > maxGust) maxGust = gu;
      if (isStorm(cd) && storm===null) storm = hrs;
      var l = 0;
      if (pr >= TH.rainHr || gu >= TH.gustHigh || isStorm(cd)) l = 3;
      else if (pr >= 4 || gu >= TH.gust) l = 2;
      else if (pr >= 1) l = 1;
      if (l > lv){ lv = l; best = {hrs:hrs, pr:pr, gu:gu, cd:cd}; }
    }
    if (rain24 >= TH.rainVery) lv = 3;
    else if (rain24 >= TH.rainHeavy && lv < 3) lv = Math.max(lv,2);
    if (maxRain > 0) tags.push('ฝนสูงสุด ' + maxRain.toFixed(1) + ' มม./ชม.');
    if (rain24 > 0)  tags.push('รวม 24 ชม. ' + rain24.toFixed(0) + ' มม.');
    if (maxGust > 0) tags.push('ลมกระโชก ' + Math.round(maxGust) + ' กม./ชม.');
    return {lv:lv, best:best, storm:storm, rain24:rain24, maxGust:maxGust, tags:tags};
  }

  function msgOf(r){
    if (!r.best || r.lv === 0) return '✅ ไม่มีสัญญาณอันตรายใน 24 ชม. ข้างหน้า';
    var when = r.best.hrs <= 0 ? '<b>ขณะนี้</b>'
             : (r.best.hrs === 1 ? 'อีก <b>1 ชั่วโมง</b>' : 'อีก <b>' + r.best.hrs + ' ชั่วโมง</b>');
    var what = [];
    if (r.storm !== null) what.push('พายุฝนฟ้าคะนอง');
    if (r.best.pr >= TH.rainHr) what.push('ฝนตกหนัก');
    else if (r.best.pr >= 4) what.push('ฝนปานกลาง');
    if (r.maxGust >= TH.gustHigh) what.push('ลมแรงอันตราย');
    else if (r.maxGust >= TH.gust) what.push('ลมกระโชกแรง');
    if (!what.length) what.push(wxName(r.best.cd));
    var act = r.lv === 3
      ? ' — <b>เตรียมรับสถานการณ์</b> ตรวจทางระบายน้ำ แจ้งเตือนพื้นที่เสี่ยง'
      : (r.lv === 2 ? ' — เฝ้าติดตามใกล้ชิด' : '');
    return when + ' คาดมี<b>' + what.join(' + ') + '</b>' + act;
  }

  var LB={0:{t:'ปกติ',c:'#16a34a'},1:{t:'ฝนเล็กน้อย',c:'#0891b2'},
           2:{t:'เฝ้าระวัง',c:'#f59e0b'},3:{t:'เสี่ยงสูง',c:'#dc2626'}};
  var ROWS=[], TOPLV=0;

  function render(rows){
    ROWS=rows.sort(function(a,b){return b.r.lv-a.r.lv;});
    TOPLV=ROWS.length?ROWS[0].r.lv:0;
    var hot=ROWS.filter(function(x){return x.r.lv>=2;});
    var b=document.getElementById('wxBtn'); if(!b) return;
    b.className=(TOPLV>=3?'lv3':(TOPLV===2?'lv2':''));
    b.title = TOPLV>=3 ? 'เตือนภัยสภาพอากาศ — '+hot.length+' อำเภอเสี่ยงสูง'
            : (TOPLV===2 ? 'เฝ้าระวังสภาพอากาศ — '+hot.length+' อำเภอ' : 'พยากรณ์อากาศ 24 ชม.');
    b.setAttribute('aria-label',b.title);
    var bd=b.querySelector('.bdg'); if(bd) bd.textContent=hot.length||'';
    if(document.getElementById('wxSheet').classList.contains('on')) paint();
  }

  function paint(){
    var hot=ROWS.filter(function(x){return x.r.lv>=2;});
    var head = TOPLV>=3 ? '🚨 เตือนภัยสภาพอากาศ'
             : (TOPLV===2 ? '⚠️ เฝ้าระวังสภาพอากาศ'
             : (TOPLV===1 ? '🌦️ มีฝนเล็กน้อยในพื้นที่' : '✅ สภาพอากาศปกติทั้งจังหวัด'));
    var sub  = TOPLV>=2 ? hot.length+' อำเภอเข้าเกณฑ์เตือนใน 24 ชม. ข้างหน้า'
                        : 'ไม่มีอำเภอใดเข้าเกณฑ์เตือนใน 24 ชม. ข้างหน้า';
    var card=document.getElementById('wxCard');
    card.className=(TOPLV>=3?'lv3':(TOPLV===2?'lv2':''));
    card.innerHTML =
      '<div class="wh"><b>'+head+'</b><span>'+sub+' · พยากรณ์รายชั่วโมง 6 อำเภอ</span>'
      + '<button class="x" onclick="wnbWX(false)" aria-label="ปิด">✕</button></div>'
      + '<div class="wb"><div class="wxgrid">'
      + ROWS.map(function(x){
          var L=LB[x.r.lv];
          return '<div class="wxc a'+x.r.lv+'"><div class="h"><b>อ.'+x.n+'</b>'
               + '<span class="lv" style="background:'+L.c+'">'+L.t+'</span></div>'
               + '<div class="msg">'+msgOf(x.r)+'</div>'
               + (x.r.tags.length?'<div class="mt">'+x.r.tags.map(function(t){return '<span>'+t+'</span>';}).join('')+'</div>':'')
               + '</div>';
        }).join('')
      + '</div><div class="wxnote">พยากรณ์อัตโนมัติจาก Open-Meteo · อัปเดตทุก 30 นาที<br>'
      + 'เกณฑ์อ้างอิงกรมอุตุนิยมวิทยา — ฝนหนัก ≥35 มม./วัน · ลมกระโชกแรง ≥50 กม./ชม.<br>'
      + '<b>ใช้ประกอบการตัดสินใจ ไม่ใช่ประกาศเตือนภัยทางการ</b> · แจ้งเหตุ <b>1784</b> ตลอด 24 ชม.</div></div>';
  }

  window.wnbWX=function(open){
    var el=document.getElementById('wxSheet'); if(!el) return;
    if(open){ paint(); el.classList.add('on'); document.body.style.overflow='hidden'; }
    else{ el.classList.remove('on'); document.body.style.overflow=''; }
  };

  async function load(){
    var qs = 'latitude=' + AMP.map(function(a){return a.la;}).join(',')
           + '&longitude=' + AMP.map(function(a){return a.lo;}).join(',')
           + '&hourly=precipitation,weather_code,wind_gusts_10m'
           + '&forecast_days=2&timezone=Asia%2FBangkok';
    var res = await fetch('https://api.open-meteo.com/v1/forecast?' + qs);
    var data = await res.json();
    var arr = Array.isArray(data) ? data : [data];
    return AMP.map(function(a,i){
      return { n:a.n, r: arr[i] && arr[i].hourly ? assess(arr[i].hourly)
                                                 : {lv:0,best:null,storm:null,rain24:0,maxGust:0,tags:[]} };
    });
  }

  function waitFab(){
    return new Promise(function(resolve){
      var tries = 0;
      (function look(){
        var w = document.getElementById('fabWrap');
        /* ต้องมีปุ่มอย่างน้อย 1 ตัวอยู่แล้ว = ชุดเดิมสร้างเสร็จจริง */
        if (w && w.querySelector('button')) return resolve(w);
        if (++tries > 40) {          /* ~4 วินาที — หน้าไหนไม่มีชุดเดิม ค่อยสร้างเอง */
          if (w) return resolve(w);
          var n = document.createElement('div'); n.id = 'fabWrap';
          n.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:9998;'
                          + 'display:flex;flex-direction:column;gap:10px;align-items:center';
          document.body.appendChild(n);
          return resolve(n);
        }
        setTimeout(look, 100);
      })();
    });
  }

  async function boot(){
    inject();
    if(document.getElementById('wxBtn')) return;
    /* แทรกปุ่มเข้าไปในชุดปุ่มลอยเดิม ถ้าไม่มีก็สร้างชุดใหม่ */
    /* ── รอชุดปุ่มลอยเดิม (แจ้งเหตุ/แชร์/โหมด) สร้างเสร็จก่อน ──
       เหตุผล: สคริปต์นี้โหลดแบบ defer จึงทำงานก่อน DOMContentLoaded
       ถ้าเราสร้าง #fabWrap ขึ้นเอง สคริปต์ชุดปุ่มเดิมจะเห็นว่ามีแล้ว
       แล้ว return ออก → ปุ่มแจ้งเหตุ/แชร์/โหมด จะหายไปทั้งหมด        */
    var wrap = await waitFab();
    var b=document.createElement('button');
    b.id='wxBtn'; b.type='button'; b.title='พยากรณ์อากาศ 24 ชม.';
    b.innerHTML='⛈️<span class="bdg"></span>';
    b.onclick=function(){ wnbWX(true); };
    wrap.insertBefore(b, wrap.firstChild);
    var sh=document.createElement('div'); sh.id='wxSheet';
    sh.innerHTML='<div id="wxCard"></div>';
    sh.onclick=function(e){ if(e.target===sh) wnbWX(false); };
    document.body.appendChild(sh);
    document.addEventListener('keydown',function(e){ if(e.key==='Escape') wnbWX(false); });

    try{ render(await load()); }
    catch(e){
      ROWS=[]; TOPLV=0;
      b.title='ดึงพยากรณ์อากาศไม่ได้';
      console.warn('wx',e);
    }
    setInterval(async function(){ try{ render(await load()); }catch(e){} },1800000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
