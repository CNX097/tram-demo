/* Trạm · trang cuộn. JS riêng của trang, đọc --sc-p do engine ghi lên từng
   chặng. Engine không bị sửa. Mọi trạng thái tính từ TRAM (data.js). */
(function () {
  'use strict';
  var T = window.TRAM;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp01 = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = matchMedia('(max-width: 860px)');
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var vnd = function (n) { return Math.round(n).toLocaleString('vi-VN').replace(/,/g, '.'); };
  function pOf(el) { var v = parseFloat(el.style.getPropertyValue('--sc-p')); return isNaN(v) ? 0 : v; }

  var acts = { hero: $('#ca-dem'), lanes: $('#sa-hinh'), stop: $('#vach-dung'), limits: $('#gioi-han'), close: $('#vao-tram') };

  /* ------------------------------------------------------------------ state */
  var S = {
    held: false,          // nháp #8KX2 đã bị giữ (đèn đỏ) chưa
    outcome: 'cho',       // cho | sending | sua | sualech | duyet | tuchoi
    reason: null,
    stopped: null,        // phạm vi đang dừng khẩn
    opened: false,        // đã mở trang duyệt trên điện thoại
    formTouched: false
  };

  /* ---------------------------------------------------------- 1 · ca đêm -- */
  var feed = $('#feed');
  var turns = T.NIGHT.map(function (n, i) {
    var el = document.createElement('div');
    el.className = 'turn';
    var html = '<div class="who"><span>' + esc(n.who) + ' · ' + esc(n.chan) + '</span><span class="mono">' + n.t + '</span></div>' +
      '<div class="msg msg--c">' + esc(n.q) + '</div>';
    if (n.held) {
      html += '<div class="held" role="note"><b>◇ Giữ lại chờ duyệt</b> · số tiền không khớp KB cơ sở</div>' +
        '<div class="who who--r"><span>K1 · trả lời mẫu, rủi ro thấp</span></div>' +
        '<div class="msg msg--ai">' + esc(T.HELD.holding) + '</div>';
    } else {
      var src = T.kb(n.kb);
      html += '<div class="who who--r"><span>K1 · ' + n.ms + ' giây · KB: ' + esc(src ? src.topic : '') + ' · tự gửi</span></div>' +
        '<div class="msg msg--ai">' + esc(n.a) + '</div>';
    }
    el.innerHTML = html;
    feed.appendChild(el);
    return el;
  });
  var heroAt = [0, 0.2, 0.4, 0.62];
  var heroClock = $('#heroClock'), inboxClock = $('#inboxClock');
  function drawHero(p) {
    var last = 0;
    turns.forEach(function (el, i) {
      var on = p >= heroAt[i] - 0.0001;
      el.classList.toggle('is-on', on);
      if (on) last = i;
    });
    // Chỉ giữ 3 lượt mới nhất trong khung để panel không tràn trên điện thoại.
    turns.forEach(function (el, i) { el.classList.toggle('is-gone', i < last - (small.matches ? 1 : 2)); });
    var t = T.NIGHT[last].t;
    if (heroClock.textContent !== t) { heroClock.textContent = t; inboxClock.textContent = t; }
    if (p >= heroAt[3]) setHeld();
  }

  /* --------------------------------------------------------- 2 · sa hình -- */
  var rail = $('#rail');
  var legend = $('#legend');
  ['live', 'shadow', 'fallback', 'off', 'plan'].forEach(function (k) {
    var s = T.STATUS[k];
    var li = document.createElement('li');
    li.innerHTML = '<b style="color:var(--' + s.tok + ')">' + s.sym + '</b>' + s.label;
    legend.appendChild(li);
  });
  var lanes = [];
  function groupLabel(txt) {
    var d = document.createElement('div');
    d.className = 'grouplabel'; d.setAttribute('aria-hidden', 'true');
    d.innerHTML = '<span>' + txt + '</span>';
    rail.appendChild(d);
  }
  groupLabel('Kinh doanh');
  T.AGENTS.forEach(function (a, idx) {
    if (a.code === 'V1') groupLabel('Vận hành');
    var plan = a.phase > 1;
    var art = document.createElement('article');
    art.className = 'lane';
    if (plan) art.setAttribute('data-plan', '');
    var cells = ['td', 'gv', 'bh'].map(function (b) {
      var st = T.STATUS[a.st[b]];
      var br = T.branch(b);
      return '<div><dt>' + br.short + '</dt><dd class="st" style="--c:var(--' + st.tok + ')"><i aria-hidden="true">' + st.sym + '</i>' + (plan ? 'GĐ' + a.phase : st.label) + '</dd></div>';
    }).join('');
    var n = plan ? 0 : Math.max(1, Math.min(6, Math.round(Math.log10(a.runs + 1) * 1.5)));
    var dots = '';
    for (var i = 0; i < n; i++) dots += '<span class="dot"></span>';
    art.innerHTML = '<header><span class="plate">' + a.code + '</span><h3>' + esc(a.name) + '</h3>' +
      (plan ? '<span class="phase">Giai đoạn ' + a.phase + ' · chưa triển khai</span>' : '') + '</header>' +
      '<div class="road" aria-hidden="true">' + dots + '</div>' +
      '<dl class="cs" aria-label="Trạng thái theo cơ sở">' + cells + '</dl>' +
      '<p class="kpi">' + esc(a.kpi[0]) + (a.kpi[1] ? '<b>' + esc(a.kpi[1]) + '</b>' : '<b>chưa có số</b>') + '</p>';
    rail.appendChild(art);
    lanes.push({ el: art, road: art.querySelector('.road'), dots: $$('.dot', art), speed: 0.6 + Math.log10(a.runs + 10) * 0.35, off: idx * 0.13 });
  });
  var end = document.createElement('div'); end.className = 'rail__end'; rail.appendChild(end);
  function drawLanes(p) {
    lanes.forEach(function (L) {
      if (!L.dots.length) return;
      var H = L.road.clientHeight + 14;
      L.dots.forEach(function (d, i) {
        var u = (p * L.speed * 3 + L.off + i / L.dots.length) % 1;
        d.style.transform = 'translateY(' + (u * H - 12).toFixed(1) + 'px)';
      });
    });
  }

  /* -------------------------------------------------- 3 · vạch dừng (đỉnh) -- */
  var H = T.HELD;
  var used = T.kb(H.used), should = T.kbFor(used.topic, H.branch), promo = T.kb('kb5');
  var gap = used.price - should.price;
  $('#gQ').textContent = '"' + H.question + '"';
  $('#gUsed').innerHTML = 'KB chung · ' + esc(used.topic) + ': <span class="price strike">' + vnd(used.price) + 'đ</span>';
  $('#gShould').innerHTML = 'Ghi đè CS Biên Hòa, hiệu lực từ ' + should.valid + ': <span class="price"><b>' + vnd(should.price) + 'đ</b></span>';
  $('#gVerdict').textContent = '✕ Không khớp, chênh ' + vnd(gap) + 'đ. Giữ ở hàng duyệt · rủi ro TB · hạn ' + H.sla + '.';
  $('#gHolding').textContent = 'Khách đã nhận trả lời mẫu: "' + H.holding + '"';

  function markWrong(s) {
    return esc(s).replace(/18\.500\.000đ|18\.000\.000đ/g, function (m) { return '<span class="bad-num">' + m + '</span>'; });
  }
  $('#apQ').textContent = H.question;
  $('#apHold').textContent = H.holding;
  $('#apDraft').innerHTML = markWrong(H.draft);
  $('#apSrc').innerHTML =
    '<li>' + esc(used.topic) + ' (KB chung): ' + vnd(used.price) + 'đ · hiệu lực ' + used.valid + '. <b>Nháp đã dùng.</b></li>' +
    '<li>' + esc(promo.topic) + ': giảm ' + vnd(promo.discount) + 'đ/người, nhóm từ 2 người · đến ' + promo.validTo + '.</li>' +
    '<li>Không dùng: ghi đè CS Biên Hòa ' + vnd(should.price) + 'đ · hiệu lực ' + should.valid + '.</li>';
  $('#apReason').textContent = H.reason + ': nháp ghi ' + vnd(used.price) + 'đ, KB CS Biên Hòa ghi ' + vnd(should.price) + 'đ.';

  var car = $('#car'), carLabel = $('#carLabel'), street = $('.street'), post = $('#post'), staff = $('#streetStaff');
  var phoneWrap = $('#phoneWrap'), phone = $('.phone'), botMsg = $('#botMsg');
  var vChat = $('#vChat'), vAp = $('#vAp');
  var stopX = 0;
  function measure() { stopX = Math.max(0, street.clientWidth * 0.72 - car.offsetWidth - 14); }

  function showView(v) {
    [vChat, vAp].forEach(function (x) { x.classList.toggle('is-on', x === v); x.inert = x !== v; });
  }
  function openAp() { S.opened = true; showView(vAp); }
  $('#openLink').addEventListener('click', function () { openAp(); var b = $('#bEdit'); if (b) b.focus(); });

  function drawStop(p) {
    // Xe chạy tới vạch dừng trong 0.04–0.18, rồi đứng yên (khoảng lặng có chủ đích tới 0.30).
    var k = clamp01((p - 0.04) / 0.14);
    var ease = 1 - Math.pow(1 - k, 3);
    if (S.outcome === 'cho') {
      car.classList.remove('is-go');
      car.style.transform = 'translateX(' + (ease * stopX).toFixed(1) + 'px)';
      post.setAttribute('data-state', k < 0.92 ? 'amber' : 'red');
    }
    if (p > 0.02) setHeld();
    // Tin Zalo tới ở 0.50, trang duyệt tự mở ở 0.64 nếu người xem chưa bấm.
    botMsg.classList.toggle('is-on', p >= 0.5);
    var live = p >= 0.5;
    phone.inert = !live;
    if (p >= 0.64 && !S.opened && S.outcome === 'cho') openAp();
    if (small.matches) {
      var m = clamp01((p - 0.5) / 0.1);
      var y = reduce ? (m > 0 ? 0 : 110) : (1 - (1 - Math.pow(1 - m, 3))) * 110;
      phoneWrap.style.transform = 'translateY(' + y.toFixed(1) + '%)';
      phoneWrap.style.visibility = m <= 0 ? 'hidden' : 'visible';
    } else {
      phoneWrap.style.transform = ''; phoneWrap.style.visibility = '';
    }
  }

  /* Trang duyệt: thao tác thật. Thanh đáy đổi theo chế độ. */
  var bar = $('#apBar'), body = $('#apBody'), edit = $('#apEdit'), rej = $('#apReject'), done = $('#apDone');
  var toast = $('#toast'), toastTxt = $('#toastTxt'), undoTimer = null;
  function mode(m) {
    body.hidden = m !== 'review'; edit.hidden = m !== 'edit'; rej.hidden = m !== 'reject'; done.hidden = m !== 'done';
    bar.hidden = m === 'done';
    if (m === 'review') bar.innerHTML = '<button type="button" class="btn wide" data-a="edit">Sửa</button><button type="button" class="btn btn--no" data-a="reject">Từ chối</button><button type="button" class="btn btn--go" data-a="approve">Duyệt</button>';
    if (m === 'edit') bar.innerHTML = '<button type="button" class="btn" data-a="back">Hủy</button><button type="button" class="btn btn--go" data-a="send">Gửi bản đã sửa</button>';
    if (m === 'reject') bar.innerHTML = '<button type="button" class="btn" data-a="back">Hủy</button><button type="button" class="btn btn--no" data-a="dorej" disabled>Từ chối</button>';
  }
  bar.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || b.disabled) return;
    var a = b.getAttribute('data-a');
    if (a === 'edit') { $('#editText').value = H.draft; mode('edit'); $('#editText').focus(); }
    if (a === 'reject') { mode('reject'); var r = $('input[name=rj]'); if (r) r.focus(); }
    if (a === 'back') { mode('review'); $('[data-a=edit]', bar).focus(); }
    if (a === 'approve') approve();
    if (a === 'send') {
      var txt = $('#editText').value.trim();
      finish(/17\.900\.000/.test(txt) && !/18\.500\.000/.test(txt) ? 'sua' : 'sualech', txt);
    }
    if (a === 'dorej') { var c = $('input[name=rj]:checked'); S.reason = c ? c.value : 'Khác'; finish('tuchoi'); }
  });
  $('#useKb').addEventListener('click', function () { $('#editText').value = H.fixed; $('#editText').focus(); });
  $$('input[name=rj]').forEach(function (r) { r.addEventListener('change', function () { var d = $('[data-a=dorej]', bar); if (d) d.disabled = false; }); });

  function approve() {
    var left = 10;
    S.outcome = 'sending'; sync();
    toast.hidden = false;
    toastTxt.textContent = 'Đã gửi · hoàn tác trong ' + left + ' giây';
    $('#undo').focus();
    bar.hidden = true;
    clearInterval(undoTimer);
    undoTimer = setInterval(function () {
      left--;
      toastTxt.textContent = 'Đã gửi · hoàn tác trong ' + left + ' giây';
      if (left <= 0) { clearInterval(undoTimer); toast.hidden = true; finish('duyet'); }
    }, 1000);
  }
  $('#undo').addEventListener('click', function () {
    clearInterval(undoTimer); toast.hidden = true; S.outcome = 'cho'; mode('review'); sync();
    $('[data-a=approve]', bar).focus();
  });

  var DONE = {
    sua: ['ok', '✓', 'Đã gửi bản đã sửa', 'Khách nhận giá 17.900.000đ của CS Biên Hòa. Bot báo trong nhóm: "✓ Đã duyệt bởi Lan · 07:12". Nháp gốc vào ca eval.'],
    sualech: ['warn', '!', 'Đã gửi, nhưng vẫn lệch KB', 'Bản đã sửa không dùng giá 17.900.000đ của CS Biên Hòa. Ca eval mới được tạo từ nháp này.'],
    duyet: ['warn', '!', 'Đã gửi nguyên văn', 'Khách nhận giá 18.500.000đ, chênh 600.000đ so với KB CS Biên Hòa. Hệ thống tạo sự cố P3 và ca eval bắt buộc.'],
    tuchoi: ['neutral', '↷', 'Đã từ chối, chuyển tư vấn viên', 'Lý do: {r}. Tư vấn viên CS Biên Hòa nhận hội thoại, hạn gọi lại 08:30.']
  };
  function finish(o, txt) {
    S.outcome = o;
    var d = DONE[o];
    done.className = 'done done--' + d[0];
    done.innerHTML = '<div class="done__mark" aria-hidden="true">' + d[1] + '</div><h3>' + d[2] + '</h3><p>' + esc(d[3].replace('{r}', S.reason || '')) + '</p>' +
      (txt ? '<div class="bub bub--ai">' + esc(txt) + '</div>' : '') +
      '<button type="button" class="btn" id="redo">Thử cách khác</button>';
    mode('done');
    $('#redo').addEventListener('click', function () { S.outcome = 'cho'; S.reason = null; mode('review'); sync(); $('[data-a=edit]', bar).focus(); });
    $('#redo').focus();
    sync();
  }

  /* ------------------------------------------- đèn duyệt: trạng thái chung -- */
  var light = $('#light'), lightTxt = $('#lightTxt');
  function setHeld() { if (!S.held) { S.held = true; sync(); } }
  function sync() {
    var st = 'green', a = 'Đèn xanh', b = 'Không có nháp chờ';
    if (S.held) {
      if (S.outcome === 'cho') { st = 'red'; a = 'Đèn đỏ'; b = 'Nháp #8KX2 chờ duyệt'; }
      else if (S.outcome === 'sending') { st = 'amber'; a = 'Đèn vàng'; b = 'Đang gửi, còn hoàn tác'; }
      else if (S.outcome === 'sua') { st = 'green'; a = 'Đèn xanh'; b = '#8KX2 đã sửa và gửi'; }
      else if (S.outcome === 'tuchoi') { st = 'green'; a = 'Đèn xanh'; b = '#8KX2 chuyển người'; }
      else { st = 'amber'; a = 'Đèn vàng'; b = '#8KX2 gửi lệch KB'; }
    }
    if (S.stopped) { st = 'red'; a = 'Dừng khẩn'; b = S.stopped; }
    light.setAttribute('data-state', st);
    lightTxt.innerHTML = '<b>' + a + '</b><span>' + esc(b) + '</span>';

    // xe trên phố
    if (S.outcome === 'sua' || S.outcome === 'duyet' || S.outcome === 'sualech') {
      car.classList.add('is-go'); car.style.transform = 'translateX(' + (street.clientWidth + 40) + 'px)';
      post.setAttribute('data-state', S.outcome === 'sua' ? 'green' : 'amber'); staff.textContent = '';
    } else if (S.outcome === 'tuchoi') {
      car.classList.add('is-go'); car.style.transform = 'translate(' + stopX + 'px, 44px)';
      carLabel.textContent = 'Chuyển tư vấn viên'; post.setAttribute('data-state', 'green'); staff.textContent = 'Làn tư vấn viên ↓';
    } else {
      carLabel.textContent = 'Báo giá → Lê T. Mai'; staff.textContent = '';
    }
    drawOutcome();
  }

  /* ---------------------------------------------------------- 4 · giới hạn -- */
  var budget = $('#budget');
  var CAP = { K1: 'Khi chạm trần: hạ model rồi chuyển người (luồng hướng khách, không được tạm dừng)', K4: 'Khi chạm trần: tạm dừng · dự báo chạm trần 14/11' };
  var meters = [];
  T.AGENTS.filter(function (a) { return a.spent > 0; }).forEach(function (a) {
    var pct = a.spent / a.budget;
    var li = document.createElement('li');
    var warn = a.code === 'K4';
    li.innerHTML = '<span class="plate">' + a.code + '</span><span class="nm">' + esc(a.name) + '</span>' +
      '<span class="num"><span data-n="' + a.spent + '">0</span> / ' + vnd(a.budget) + ' đ</span>' +
      '<span class="meter' + (warn ? ' is-warn' : '') + '" role="img" aria-label="Đã dùng ' + Math.round(pct * 100) + '% trần tháng"><i style="--w:' + pct.toFixed(3) + '"></i></span>' +
      '<span class="cap">' + Math.round(pct * 100) + '% · ' + esc(CAP[a.code] || 'Khi chạm trần: chỉ cảnh báo') + '</span>';
    budget.appendChild(li);
    meters.push(li);
  });
  function runCounts() {
    meters.forEach(function (li) {
      var i = li.querySelector('.meter i'); i.style.transform = 'scaleX(' + i.style.getPropertyValue('--w') + ')';
      var n = li.querySelector('[data-n]'), to = +n.getAttribute('data-n');
      if (reduce) { n.textContent = vnd(to); return; }
      var t0 = performance.now();
      (function step(t) {
        var k = clamp01((t - t0) / 1200), e = 1 - Math.pow(1 - k, 3);
        n.textContent = vnd(to * e);
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { runCounts(); io.disconnect(); } }); }, { threshold: 0.3 });
    io.observe(budget);
  } else runCounts();

  var ev = T.EVAL.K1;
  $('#facts').innerHTML =
    '<div><dt>Ca bắt buộc</dt><dd class="tnum">' + ev.must[0] + '/' + ev.must[1] + ' · 100%</dd></div>' +
    '<div><dt>Ca chất lượng (ngưỡng 85%)</dt><dd class="tnum">' + Math.round(ev.quality * 100) + '%</dd></div>' +
    '<div><dt>Shadow tại CS Biên Hòa</dt><dd class="tnum">' + ev.shadow.runs + '/' + ev.shadow.need + ' lượt · ' + ev.shadow.hours + '/' + ev.shadow.needH + ' giờ</dd></div>' +
    '<div><dt>Khớp với bản live</dt><dd class="tnum">' + Math.round(ev.shadow.agree * 100) + '%</dd></div>';

  var auditBody = $('#audit'), extra = [];
  function renderAudit() {
    var rows = extra.concat(T.AUDIT);
    auditBody.innerHTML = rows.map(function (r) {
      return '<tr' + (r.you ? ' class="is-you"' : '') + '><td>' + r.t + '</td><td>' + esc(r.who) + '</td><td>' + esc(r.what) + '</td><td>' + esc(T.branch(r.br).name) + '</td><td class="ch">' + r.ch + '</td></tr>';
    }).join('');
  }
  var NOTE = {
    cho: ['callout--warn', 'Nháp #8KX2 vẫn chờ ở vạch dừng, hạn trước 08:00. <a href="#vach-dung">Quay lại Vạch dừng</a> để xử lý.'],
    sending: ['callout--warn', 'Tin đang trong outbox. Bạn còn vài giây để hoàn tác trên điện thoại.'],
    sua: ['callout--ok', 'Ca eval mới chờ xác nhận: "Báo giá hạng B tại CS Biên Hòa phải là 17.900.000đ", sinh từ nháp bạn vừa sửa. K1 v5 phải qua ca này mới được phát hành.'],
    sualech: ['callout--warn', 'Bản đã gửi vẫn lệch KB CS Biên Hòa. Hệ thống tạo ca eval bắt buộc mới từ nháp này.'],
    duyet: ['callout--warn', 'Đã gửi giá chênh 600.000đ. Hệ thống tạo sự cố P3 và một ca eval bắt buộc mới. Bản thật: trước khi tin rời outbox, nút Hoàn tác có 10 giây.'],
    tuchoi: ['', 'Tư vấn viên CS Biên Hòa nhận hội thoại, hạn gọi lại 08:30. Nháp bị từ chối được đề nghị thêm vào ca eval.']
  };
  var YOU = {
    sua: 'Sửa rồi gửi nháp #8KX2 (17.900.000đ), thêm vào ca eval',
    sualech: 'Sửa rồi gửi nháp #8KX2 (vẫn lệch KB cơ sở)',
    duyet: 'Duyệt nguyên văn nháp #8KX2 (18.500.000đ, lệch KB 600.000đ)',
    tuchoi: 'Từ chối nháp #8KX2 (lý do: {r}) → chuyển tư vấn viên'
  };
  var CARRY = {
    cho: 'Nháp #8KX2 vẫn chờ. Vào với vai Trưởng BP Kinh doanh để xử lý nó trong Hàng duyệt.',
    sending: 'Tin đang gửi. Trong app, Hàng duyệt sẽ ghi lại thao tác này.',
    sua: 'Bạn đã sửa và gửi nháp #8KX2. Nhật ký và ca eval trong app đã có dòng của bạn.',
    sualech: 'Bạn đã gửi bản sửa còn lệch KB. Trong app có sự cố và ca eval để xem lại.',
    duyet: 'Bạn đã duyệt nguyên văn. Trong app, mục Sự cố có P3 vừa tạo.',
    tuchoi: 'Bạn đã từ chối và chuyển người. Trong app, Hộp thư cho thấy hội thoại đã chuyển tư vấn viên.'
  };
  function drawOutcome() {
    var o = S.outcome;
    var n = NOTE[o];
    var note = $('#outcomeNote');
    note.className = 'callout ' + n[0];
    note.innerHTML = n[1];
    extra = extra.filter(function (r) { return !r.decision; });
    if (YOU[o]) extra.unshift({ t: '07:12', who: 'Chị Lan (bạn)', what: YOU[o].replace('{r}', S.reason || ''), br: 'bh', ch: 'zalo_link', you: true, decision: true });
    renderAudit();
    $('#carry').textContent = CARRY[o];
    $('#tramOut').value = o === 'sending' ? 'duyet' : o;
    if (!S.formTouched) {
      var want = o === 'cho' ? 'kd' : 'bgd';
      var r = $('input[name=vai][value=' + want + ']'); if (r) r.checked = true;
    }
  }
  $$('#enterForm input, #enterForm select').forEach(function (x) { x.addEventListener('change', function () { S.formTouched = true; }); });

  /* ------------------------------------------------------------- dừng khẩn -- */
  var dlg = $('#stopDlg'), scope = $('#stopScope'), word = $('#stopWord'), conf = $('#stopConfirm'), why = $('#stopReason'), err = $('#stopErr');
  function needWord() { return scope.value === 'Toàn hệ thống' ? 'TOÀN HỆ THỐNG' : 'K1'; }
  scope.addEventListener('change', function () { word.textContent = needWord(); err.textContent = ''; });
  $('#openStop').addEventListener('click', function () {
    conf.value = ''; why.value = ''; err.textContent = ''; word.textContent = needWord();
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    conf.focus();
  });
  $('#stopCancel').addEventListener('click', function () { dlg.close(); $('#openStop').focus(); });
  $('#stopForm').addEventListener('submit', function (e) {
    if (conf.value.trim().toUpperCase() !== needWord()) { e.preventDefault(); err.textContent = 'Gõ đúng "' + needWord() + '" để xác nhận.'; conf.focus(); return; }
    if (!why.value.trim()) { e.preventDefault(); err.textContent = 'Cần ghi lý do.'; why.focus(); return; }
    S.stopped = scope.value;
    $('#stopText').textContent = '■ ' + scope.value + ' đang tắt khẩn · hội thoại chuyển người · sự cố P1 đã tạo · lý do: ' + why.value.trim();
    $('#stopbanner').classList.add('is-on');
    $('#bar').classList.add('is-stopped');
    extra.unshift({ t: '07:15', who: 'Bạn', what: 'Dừng khẩn: ' + scope.value + ' (lý do: ' + why.value.trim() + ')', br: scope.value.indexOf('Biên Hòa') > -1 ? 'bh' : 'all', ch: 'web', you: true });
    sync();
    setTimeout(function () { $('#unstop').focus(); }, 0);
  });
  $('#unstop').addEventListener('click', function () {
    extra.unshift({ t: '07:18', who: 'Minh (admin)', what: 'Bật lại sau dừng khẩn: ' + S.stopped + ' · ghi chú: đã kiểm tra', br: 'all', ch: 'web', you: true });
    S.stopped = null;
    $('#stopbanner').classList.remove('is-on');
    $('#bar').classList.remove('is-stopped');
    sync();
    $('#openStop').focus();
  });

  /* ----------------------------------------------------- chrome: chặng + nền -- */
  var barEl = $('#bar'), links = $$('#chapters a');
  var order = ['ca-dem', 'sa-hinh', 'vach-dung', 'gioi-han', 'vao-tram'];
  function drawChrome() {
    var mid = innerHeight * 0.4, cur = order[0];
    order.forEach(function (id) { if (document.getElementById(id).getBoundingClientRect().top <= mid) cur = id; });
    links.forEach(function (a) { if (a.getAttribute('href') === '#' + cur) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
    var day = acts.stop.getBoundingClientRect().top <= barEl.offsetHeight;
    barEl.classList.toggle('g-day', day); barEl.classList.toggle('g-night', !day);
    if (acts.stop.getBoundingClientRect().top < innerHeight * 0.2) setHeld();
  }

  /* -------------------------------------------------------------- vòng lặp -- */
  function frame() {
    drawHero(pOf(acts.hero));
    var rl = acts.lanes.getBoundingClientRect();
    if (rl.bottom > 0 && rl.top < innerHeight) drawLanes(pOf(acts.lanes));
    var rs = acts.stop.getBoundingClientRect();
    if (rs.bottom > 0 && rs.top < innerHeight * 1.2) drawStop(pOf(acts.stop));
    drawChrome();
    requestAnimationFrame(frame);
  }

  showView(vChat);
  mode('review');
  sync();
  ScrollCraft.mount(document.body);
  function ready() { measure(); drawStop(pOf(acts.stop)); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ready); else ready();
  addEventListener('resize', ready);
  requestAnimationFrame(frame);
})();
