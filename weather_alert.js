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
   + '#wxBar{margin:0 0 13px;border-radius:16px;overflow:hidden;border:2px solid #fcd34d;'
   +   'background:linear-gradient(135deg,#fffbeb,#fff);box-shadow:0 5px 20px rgba(217,119,6,.14);'
   +   'animation:wxIn .5s cubic-bezier(.2,.8,.25,1)}'
   + '#wxBar.lv3{border-color:#f87171;background:linear-gradient(135deg,#fef2f2,#fff);box-shadow:0 5px 22px rgba(220,38,38,.18)}'
   + '#wxBar.lv1{border-color:#93c5fd;background:linear-gradient(135deg,#eff6ff,#fff);box-shadow:0 4px 16px rgba(37,99,235,.1)}'
   + '@keyframes wxIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}'
   + '#wxBar .wh{display:flex;align-items:center;gap:9px;padding:10px 15px;font-family:"Kanit",sans-serif;'
   +   'font-weight:700;font-size:12.5px;background:#fef3c7;color:#92400e;cursor:pointer}'
   + '#wxBar.lv3 .wh{background:#fee2e2;color:#991b1b}'
   + '#wxBar.lv1 .wh{background:#dbeafe;color:#1e40af}'
   + '#wxBar .wh .dot{width:9px;height:9px;border-radius:50%;background:currentColor;flex:0 0 9px;'
   +   'animation:wxPulse 1.9s ease-out infinite}'
   + '@keyframes wxPulse{0%{box-shadow:0 0 0 0 rgba(220,38,38,.5)}70%{box-shadow:0 0 0 9px rgba(220,38,38,0)}100%{box-shadow:0 0 0 0 rgba(220,38,38,0)}}'
   + '#wxBar .wh .ttl{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
   + '#wxBar .wh .tg{font-size:11px;font-weight:600;opacity:.85;white-space:nowrap}'
   + '#wxBar .wb{padding:12px 15px 13px}'
   + '.wxgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:9px}'
   + '.wxc{border:1px solid #e6edf5;border-radius:12px;background:#fff;padding:10px 12px;min-width:0}'
   + '.wxc.a2{border-color:#fcd34d;background:linear-gradient(150deg,#fffbeb,#fff)}'
   + '.wxc.a3{border-color:#fca5a5;background:linear-gradient(150deg,#fef2f2,#fff)}'
   + '.wxc .h{display:flex;align-items:center;gap:7px;margin-bottom:6px}'
   + '.wxc .h b{font-family:"Kanit",sans-serif;font-weight:700;font-size:12.5px;color:#0f172a;'
   +   'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
   + '.wxc .h .lv{font-family:"Kanit",sans-serif;font-size:9.5px;font-weight:700;padding:2px 8px;'
   +   'border-radius:99px;color:#fff;white-space:nowrap}'
   + '.wxc .msg{font-size:11.5px;line-height:1.55;color:#334155}'
   + '.wxc .msg b{font-family:"Kanit",sans-serif;font-weight:700}'
   + '.wxc .mt{display:flex;gap:7px;margin-top:7px;flex-wrap:wrap}'
   + '.wxc .mt span{font-size:9.5px;background:#f1f5f9;border-radius:99px;padding:2px 8px;color:#475569;white-space:nowrap}'
   + '.wxnote{margin-top:10px;font-size:10px;color:#7c8ba1;line-height:1.6}'
   + '#wxBar.collapsed .wb{display:none}'
   + 'html[data-theme="dark"] #wxBar{background:linear-gradient(135deg,#2a2313,#161f31);border-color:#6b5518}'
   + 'html[data-theme="dark"] #wxBar.lv3{background:linear-gradient(135deg,#2e1717,#161f31);border-color:#7f2323}'
   + 'html[data-theme="dark"] #wxBar.lv1{background:linear-gradient(135deg,#16233d,#161f31);border-color:#1e3a6b}'
   + 'html[data-theme="dark"] .wxc{background:#1a2437;border-color:#2b3a52}'
   + 'html[data-theme="dark"] .wxc .h b{color:#e8eef7}'
   + 'html[data-theme="dark"] .wxc .msg{color:#c8d5e6}'
   + 'html[data-theme="dark"] .wxc .mt span{background:#131c2c;color:#8fa0b6}'
   + '@media(max-width:640px){.wxgrid{grid-template-columns:1fr}#wxBar .wh{font-size:11.5px;padding:9px 12px}}';

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

  function render(rows){
    var bar = document.getElementById('wxBar'); if (!bar) return;
    var top = rows.reduce(function(a,b){ return b.r.lv > a.r.lv ? b : a; }, rows[0]);
    var hot = rows.filter(function(x){ return x.r.lv >= 2; });
    var lv  = top.r.lv;
    bar.className = 'lv' + lv;
    var head = lv >= 3
      ? '🚨 เตือนภัยสภาพอากาศ — ' + hot.length + ' อำเภอเสี่ยงสูงใน 24 ชม.'
      : (lv === 2 ? '⚠️ เฝ้าระวังสภาพอากาศ — ' + hot.length + ' อำเภอ'
                  : (lv === 1 ? '🌦️ มีฝนเล็กน้อยในพื้นที่' : '✅ สภาพอากาศปกติทั้งจังหวัด'));
    var LB = {0:{t:'ปกติ',c:'#16a34a'},1:{t:'ฝนเล็กน้อย',c:'#0891b2'},
              2:{t:'เฝ้าระวัง',c:'#f59e0b'},3:{t:'เสี่ยงสูง',c:'#dc2626'}};
    bar.innerHTML =
      '<div class="wh" onclick="document.getElementById(\'wxBar\').classList.toggle(\'collapsed\')">'
      + '<span class="dot"></span><span class="ttl">' + head + '</span>'
      + '<span class="tg">พยากรณ์ 24 ชม. · แตะเพื่อย่อ/ขยาย ▾</span></div>'
      + '<div class="wb"><div class="wxgrid">'
      + rows.sort(function(a,b){ return b.r.lv - a.r.lv; }).map(function(x){
          var L = LB[x.r.lv];
          return '<div class="wxc a' + x.r.lv + '"><div class="h"><b>อ.' + x.n + '</b>'
               + '<span class="lv" style="background:' + L.c + '">' + L.t + '</span></div>'
               + '<div class="msg">' + msgOf(x.r) + '</div>'
               + (x.r.tags.length ? '<div class="mt">' + x.r.tags.map(function(t){ return '<span>' + t + '</span>'; }).join('') + '</div>' : '')
               + '</div>';
        }).join('')
      + '</div><div class="wxnote">พยากรณ์อัตโนมัติจาก Open-Meteo · อัปเดตทุกชั่วโมง · '
      + 'เกณฑ์อ้างอิงกรมอุตุนิยมวิทยา (ฝนหนัก ≥35 มม./วัน · ลมกระโชก ≥50 กม./ชม.) · '
      + 'ใช้ประกอบการตัดสินใจ ไม่ใช่ประกาศเตือนภัยทางการ · แจ้งเหตุ <b>1784</b></div></div>';
  }

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

  async function boot(){
    inject();
    /* วางแถบไว้บนสุดของเนื้อหา */
    var host = document.querySelector('.main-col > .content') || document.querySelector('.content')
            || document.querySelector('.wrap') || document.body;
    if (document.getElementById('wxBar')) return;
    var bar = document.createElement('div'); bar.id = 'wxBar';
    bar.innerHTML = '<div class="wh"><span class="dot"></span>'
                  + '<span class="ttl">⏳ กำลังตรวจสอบพยากรณ์อากาศ…</span></div>';
    host.insertBefore(bar, host.firstChild);
    try {
      var rows = await load();
      render(rows);
    } catch (e) {
      bar.className = 'lv1';
      bar.innerHTML = '<div class="wh"><span class="ttl">🌐 ดึงพยากรณ์อากาศไม่ได้ในขณะนี้</span></div>';
      console.warn('wx', e);
    }
    /* รีเฟรชทุก 30 นาที */
    setInterval(async function(){
      try { render(await load()); } catch(e){}
    }, 1800000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
