/* Trạm · app tương tác (demo). Mọi màn tính từ TRAM (data.js) + trạng thái S.
   Điều hướng bằng hash: #/home, #/flow, #/incidents, #/approvals/<id>, #/inbox/<id>,
   #/agent/<mã>/<tab>, #/kb, #/budget, #/connections, #/quality, #/audit, #/users,
   và hai trang ngoài shell cho điện thoại: #/d/<mã>, #/stop/<mã>. */
(function () {
  'use strict';
  var T = window.TRAM;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var vnd = function (n) { return Math.round(n).toLocaleString('vi-VN').replace(/,/g, '.'); };
  var clone = function (x) { return JSON.parse(JSON.stringify(x)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = matchMedia('(max-width: 900px)');
  var TODAY = new Date(2026, 10, 6);

  /* ---------------------------------------------------------------- icons -- */
  var IC = {
    home: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z', flow: 'M4 4h5v5H4zM15 15h5v5h-5zM15 4h5v5h-5zM9 6.5h6M17.5 9v6',
    alert: 'M12 3l10 18H2zM12 10v5M12 18h.01', check: 'M4 12l5 5L20 6', inbox: 'M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5',
    book: 'M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z', wallet: 'M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H3zM3 7l12-3v3M16 13.5h2',
    plug: 'M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0zM12 18v4', gauge: 'M4 18a8 8 0 1 1 16 0M12 18l4-6', log: 'M6 3h9l4 4v14H6zM9 12h7M9 16h7M9 8h3',
    users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M17 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-4-6.3', search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5',
    bell: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4', stop: 'M8 3h8l5 5v8l-5 5H8l-5-5V8zM9.5 9.5h5v5h-5z', menu: 'M4 6h16M4 12h16M4 18h16',
    chev: 'M6 9l6 6 6-6', x: 'M6 6l12 12M18 6L6 18', back: 'M15 18l-6-6 6-6', user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
    play: 'M7 4l13 8-13 8z', undo: 'M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3', agent: 'M5 8h14v11H5zM12 4v4M9 13h.01M15 13h.01M9 16h6',
    plus: 'M12 5v14M5 12h14', up: 'M12 19V5M6 11l6-6 6 6', down: 'M12 5v14M6 13l6 6 6-6', out: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6'
  };
  function ic(n) { return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="' + IC[n] + '"/></svg>'; }

  /* ---------------------------------------------------------------- state -- */
  var q = new URLSearchParams(location.search);
  var S = {
    role: T.ROLES[q.get('vai')] ? q.get('vai') : 'bgd',
    cs: q.get('cs') || 'all',
    tram: q.get('tram'),
    stopped: null,
    approvals: clone(T.APPROVALS), audit: clone(T.AUDIT), incidents: clone(T.INCIDENTS), convs: clone(T.CONVS), kb: clone(T.KB),
    agents: clone(T.AGENTS),
    evalCases: [{ id: 'ec1', from: 'Nháp K7 bị sửa (03/11)', text: 'Phản hồi đánh giá 1–2★ phải mời khách nhắn riêng, không nêu tên giáo viên', st: 'chờ' }],
    sel: {}, mode: {}, zoom: 1, flowSel: 'K1', flowTab: 'luong', menu: null, open: { kd: true, vh: true },
    cfg: {}, kbTab: 'docs', theme: 'system', faq: [{ q: '"Học xong có bao đậu không?"', n: 14, done: false }, { q: '"Có lớp học thứ Bảy, Chủ nhật không?"', n: 9, done: false }],
    sample: [{ id: 's1', ag: 'K1', br: 'td', q: 'Hồ sơ cần những gì?', a: 'Dạ gồm CCCD, 4 ảnh 3x4 nền xanh và giấy khám sức khỏe ạ.', v: null }, { id: 's2', ag: 'K1', br: 'gv', q: 'Có trả góp không em?', a: 'Dạ học phí đóng 3 đợt ạ, em gửi anh/chị lịch đóng nhé.', v: null }, { id: 's3', ag: 'K7', br: 'td', q: 'Đánh giá 5★ "Thầy dạy dễ hiểu"', a: 'Cảm ơn anh/chị đã tin tưởng trung tâm…', v: null }]
  };
  if (S.role === 'kd' && S.cs !== 'bh') S.cs = 'bh';
  try { S.theme = localStorage.getItem('tram-theme') || 'system'; } catch (e) { /* bỏ qua */ }
  applyTheme();

  /* Kết quả mang từ trang cuộn (?tram=sua|duyet|tuchoi|sualech) */
  var CARRIED = null;
  (function carry() {
    var o = S.tram, H = T.HELD;
    if (!o || o === 'cho') return;
    S.approvals = S.approvals.filter(function (a) { return a.id !== H.id; });
    var c1 = S.convs[0];
    var what = { sua: 'Sửa rồi gửi nháp #8KX2 (17.900.000đ), thêm vào ca eval', sualech: 'Sửa rồi gửi nháp #8KX2 (vẫn lệch KB cơ sở)', duyet: 'Duyệt nguyên văn nháp #8KX2 (lệch KB 600.000đ)', tuchoi: 'Từ chối nháp #8KX2 → chuyển tư vấn viên' }[o];
    if (!what) return;
    S.audit.unshift({ t: '07:12', who: 'Chị Lan', what: what, br: 'bh', ch: 'zalo_link', you: true });
    if (o === 'sua') { c1.msgs.push({ a: 'staff', t: H.fixed, time: '07:12', note: 'Duyệt bởi Chị Lan qua link Zalo' }); S.evalCases.unshift({ id: 'ec-bh', from: 'Nháp #8KX2 bị sửa (hôm nay)', text: 'Báo giá hạng B tại CS Biên Hòa phải là 17.900.000đ', st: 'chờ' }); }
    if (o === 'duyet' || o === 'sualech') {
      c1.msgs.push({ a: 'ai', t: H.draft, time: '07:12', note: 'Đã duyệt qua link Zalo' });
      S.incidents.unshift({ id: 'P3-0611c', lv: 'P3', state: 'Mở', title: 'K1 CS Biên Hòa đã gửi báo giá lệch KB 600.000đ (nháp #8KX2)', at: '07:12', flows: ['K1'], br: 'bh' });
      S.evalCases.unshift({ id: 'ec-bh', from: 'Sự cố P3-0611c', text: 'Báo giá hạng B tại CS Biên Hòa phải dùng KB ghi đè của cơ sở', st: 'chờ' });
    }
    if (o === 'tuchoi') { c1.state = 'human'; c1.msgs.push({ a: 'sys', t: 'Nháp #8KX2 bị từ chối bởi Chị Lan · chuyển tư vấn viên, hạn gọi lại 08:30' }); }
    CARRIED = { sua: 'Từ trang giới thiệu: bạn đã sửa và gửi nháp #8KX2. Nhật ký và Chất lượng đã có dòng của bạn.', sualech: 'Từ trang giới thiệu: bản sửa nháp #8KX2 còn lệch KB. Xem Sự cố và Chất lượng.', duyet: 'Từ trang giới thiệu: bạn đã duyệt nguyên văn nháp #8KX2. Xem sự cố P3 vừa tạo.', tuchoi: 'Từ trang giới thiệu: bạn đã từ chối nháp #8KX2. Xem Hộp thư, hội thoại đã chuyển tư vấn viên.' }[o];
  })();

  var ROLE = function () { return T.ROLES[S.role]; };
  var can = {
    admin: function () { return S.role === 'admin'; },
    stop: function () { return S.role !== 'kd'; },
    raise: function () { return S.role !== 'kd'; },
    approve: function () { return S.role !== 'bgd'; },
    see: function (a) { return S.role !== 'kd' || a.dept === 'kd'; },
    edit: function (a) { return S.role === 'admin' || (S.role === 'kd' && a.dept === 'kd'); }
  };
  function branchesForRole() { return S.role === 'kd' ? ['bh'] : ['all', 'td', 'gv', 'bh']; }
  function inScope(br) { return S.cs === 'all' || br === 'all' || br === S.cs; }
  function agent(c) { for (var i = 0; i < S.agents.length; i++) if (S.agents[i].code === c) return S.agents[i]; return null; }
  function stoppedFor(code, br) {
    if (!S.stopped) return false;
    if (S.stopped.scope === 'all') return true;
    return S.stopped.code === code && (S.stopped.br === 'all' || S.stopped.br === br);
  }
  function stAt(a, br) { return stoppedFor(a.code, br) ? 'stopped' : a.st[br]; }
  var PRI = ['stopped', 'error', 'fallback', 'live', 'shadow', 'draft', 'off', 'plan'];
  function stAgg(a) {
    if (S.cs !== 'all') return stAt(a, S.cs);
    var best = 'plan';
    ['td', 'gv', 'bh'].forEach(function (b) { var s = stAt(a, b); if (PRI.indexOf(s) < PRI.indexOf(best)) best = s; });
    return best;
  }
  function stBadge(st, opt) {
    var s = T.STATUS[st];
    return '<span class="st"><span class="dot' + (st === 'shadow' ? ' dot--ring' : '') + '" style="--c:var(--' + s.tok + ')"></span>' + (opt === 'nolabel' ? '<span class="sr">' + s.label + '</span>' : s.label) + '</span>';
  }
  function riskTag(r) { var x = T.RISK[r]; return '<span class="risk risk--' + r + '">' + x.sym + ' ' + x.label + '</span>'; }
  function brName(id) { return T.branch(id).name; }
  function slaTxt(m) {
    if (m < 0) return '<span class="sla sla--over">Quá hạn ' + (-m) + '′</span>';
    return '<span class="sla' + (m <= 10 ? ' sla--warn' : '') + '">Còn ' + m + '′</span>';
  }
  function approvalsScoped() {
    return S.approvals.filter(function (x) { var a = agent(x.agent); return inScope(x.branch) && can.see(a); })
      .sort(function (a, b) { return a.slaMin - b.slaMin; });
  }
  function incidentsOpen() { return S.incidents.filter(function (i) { return i.state !== 'Đóng' && inScope(i.br); }); }
  function spark(arr) {
    var mx = Math.max.apply(null, arr), mn = Math.min.apply(null, arr), w = 72, h = 22;
    var pts = arr.map(function (v, i) { return (i * (w / (arr.length - 1))).toFixed(1) + ',' + (mx === mn ? h / 2 : h - 2 - (v - mn) / (mx - mn) * (h - 4)).toFixed(1); }).join(' ');
    return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><polyline points="' + pts + '"/></svg>';
  }
  function meter(pct) { return '<span class="meter' + (pct >= 1 ? ' is-bad' : pct >= 0.8 ? ' is-warn' : '') + '" role="img" aria-label="' + Math.round(pct * 100) + '% trần"><i style="width:' + Math.min(100, pct * 100).toFixed(1) + '%"></i></span>'; }
  function audit(who, what, br, ch) {
    var d = new Date(); var t = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    S.audit.unshift({ t: t, who: who, what: what, br: br || S.cs, ch: ch || 'web', you: true });
  }
  function me() { return ROLE().person + ' (' + (S.role === 'admin' ? 'admin' : S.role === 'kd' ? 'Trưởng BP KD' : 'BGĐ') + ')'; }

  var DESC = {
    K1: 'Gom tin nhắn Fanpage, TikTok, Zalo vào một hộp thư; trả lời câu hỏi thường gặp theo KB của cơ sở, xin SĐT, chuyển tư vấn viên khi khách muốn đăng ký hoặc khiếu nại.',
    K2: 'Mỗi khách một hồ sơ, ghi nguồn; AI tóm tắt hội thoại, chấm mức quan tâm, nhắc lịch gọi lại.',
    K3: 'Đọc hội thoại và ghi âm cuộc gọi, chấm theo bộ tiêu chí, gợi ý câu trả lời tốt hơn.',
    K4: 'Viết kịch bản video ngắn, dàn ý livestream, chú thích, phụ đề. Luôn duyệt trước khi đăng.',
    K5: 'Lấy số liệu Facebook, TikTok, Google Ads mỗi sáng 7h; nhận xét mẫu hiệu quả; nối chi phí với lead/HV.',
    K6: 'Mỗi cộng tác viên có mã riêng; tự ghi HV giới thiệu, tự tính hoa hồng khi HV đóng tiền.',
    K7: 'Khi HV nhận bằng, gửi lời chúc, link đánh giá Google Maps và mã giới thiệu; soạn phản hồi cho mọi đánh giá.',
    V1: 'HV chụp CCCD, ảnh, giấy khám sức khỏe qua Zalo; AI đọc chữ, tự điền, báo thiếu giấy tờ.',
    V2: 'Mỗi HV một QR chuyển khoản riêng; tự khớp tiền về, xuất phiếu thu, nhắc trước hạn đợt 2, đợt 3.',
    V3: 'Gửi tin mẫu Zalo (ZNS) cho lịch khai giảng, lịch học, lịch thi, ngày nhận bằng.',
    V4: 'HV tự đặt giờ thực hành; hệ thống xếp giáo viên, xe, sân không trùng, đủ giờ theo quy định.',
    V5: 'Chatbot ôn bộ câu hỏi sát hạch, giải thích luật, mẹo sa hình; làm đề thử.',
    V6: 'Dựa trên điểm thi thử, số giờ, quãng đường; báo giáo viên HV cần kèm thêm.',
    V7: 'Gửi khảo sát ngắn sau mỗi giai đoạn; báo ngay phàn nàn nặng trong 15 phút.',
    V8: 'Lịch bảo dưỡng, nhiên liệu, quãng đường từ thiết bị giám sát; nhắc đăng kiểm, bảo hiểm.'
  };
  var NEED = { K3: 'Tổng đài cloud có API ghi âm (chưa chọn)', K6: 'V2 Học phí tự đối soát phải chạy trước', V1: 'Xác nhận nhà cung cấp OCR CCCD trong nước', V2: 'Chọn dịch vụ biến động số dư (Casso/SePay)', V4: 'Bộ xếp lịch ràng buộc và dữ liệu giáo viên, xe, sân', V5: 'Bộ câu hỏi sát hạch hiện hành nạp vào KB', V6: 'V4, V5 và dữ liệu thiết bị DAT', V7: 'Mẫu khảo sát được duyệt', V8: 'Chọn nhà cung cấp GPS/DAT' };
  var OWNER = { kd: 'Trưởng BP Kinh doanh', vh: 'Trưởng BP Vận hành' };

  /* --------------------------------------------------------------- theme -- */
  function applyTheme() {
    var r = document.documentElement;
    if (S.theme === 'system') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', S.theme);
  }

  /* --------------------------------------------------------------- toast -- */
  function toast(msg, undo, ms) {
    var box = $('#toasts'); if (!box) return;
    var el = document.createElement('div');
    el.className = 'toast'; el.setAttribute('role', 'status');
    el.innerHTML = '<span>' + esc(msg) + '</span>' + (undo ? '<button type="button">Hoàn tác</button>' : '');
    box.appendChild(el);
    var timer = setTimeout(function () { el.remove(); if (undo && undo.after) undo.after(); }, ms || (undo ? 10000 : 4000));
    if (undo) el.querySelector('button').addEventListener('click', function () { clearTimeout(timer); el.remove(); undo.fn(); });
  }

  /* ------------------------------------------------------------- routing -- */
  function route() {
    var h = (location.hash || '#/home').replace(/^#\/?/, '').split('/');
    return { name: h[0] || 'home', a: h[1], b: h[2] };
  }
  function go(h) { if (location.hash === h) render(); else location.hash = h; }
  function syncUrl() {
    var u = new URL(location.href);
    u.searchParams.set('vai', S.role); u.searchParams.set('cs', S.cs);
    history.replaceState(null, '', u.pathname + u.search + location.hash);
  }

  var TITLES = { home: 'Trang chủ', flow: 'Sơ đồ luồng', incidents: 'Sự cố', approvals: 'Hàng duyệt', inbox: 'Hộp thư hợp nhất', agent: 'Agent', kb: 'Kho tri thức', budget: 'Ngân sách', connections: 'Kết nối', quality: 'Chất lượng', audit: 'Nhật ký', users: 'Người dùng & quyền' };
  var REALTIME = { approvals: 1, flow: 1, incidents: 1, home: 1 };

  /* ---------------------------------------------------------------- shell -- */
  function navLink(href, icon, label, cur, cnt, soft) {
    return '<a href="' + href + '"' + (cur ? ' aria-current="page"' : '') + '>' + ic(icon) + '<span>' + label + '</span>' + (cnt ? '<span class="cnt' + (soft ? ' cnt--soft' : '') + '">' + cnt + '</span>' : '') + '</a>';
  }
  function rail(r) {
    var n = r.name;
    var ap = approvalsScoped().length, inc = incidentsOpen().length;
    var h = '<a class="brand" href="#/home"><span class="plate plate--lg">T</span><span><b>Trạm</b><small>Điều Phối Agent</small></span></a><nav class="nav" aria-label="Điều hướng chính">';
    h += '<div class="nav-h">Theo dõi</div>' + navLink('#/home', 'home', 'Trang chủ', n === 'home') + navLink('#/flow', 'flow', 'Sơ đồ luồng', n === 'flow') + navLink('#/incidents', 'alert', 'Sự cố', n === 'incidents', inc || '', true);
    h += '<div class="nav-h">Xử lý</div>' + navLink('#/approvals', 'check', 'Hàng duyệt', n === 'approvals', ap || '') + navLink('#/inbox', 'inbox', 'Hộp thư', n === 'inbox');
    h += '<div class="nav-h">Agent</div>';
    [['kd', 'Kinh doanh'], ['vh', 'Vận hành']].forEach(function (g) {
      var mine = S.role !== 'kd' || g[0] === 'kd';
      var open = S.open[g[0]] && mine;
      h += '<button type="button" class="navgrp" data-act="navgrp" data-arg="' + g[0] + '" aria-expanded="' + open + '">' + ic('agent') + '<span>' + g[1] + (mine ? '' : ' <small class="muted">(chỉ xem trên sơ đồ)</small>') + '</span>' + ic('chev').replace('class="i"', 'class="i chev"') + '</button>';
      if (open) {
        S.agents.filter(function (a) { return a.dept === g[0]; }).forEach(function (a) {
          var st = stAgg(a), s = T.STATUS[st];
          var pend = S.approvals.filter(function (x) { return x.agent === a.code && inScope(x.branch); }).length;
          h += '<a class="ag-row" href="#/agent/' + a.code + '"' + (a.phase > 1 ? ' data-plan' : '') + (n === 'agent' && r.a === a.code ? ' aria-current="page"' : '') + '>' +
            '<span class="dot' + (st === 'shadow' ? ' dot--ring' : '') + '" style="--c:var(--' + s.tok + ')" title="' + s.label + '"></span><span class="sr">' + s.label + '</span><span class="ag">' + a.code + '</span><span>' + esc(a.name) + '</span>' +
            (a.phase > 1 ? '<span class="phase-tag">GĐ' + a.phase + '</span>' : pend ? '<span class="cnt">' + pend + '</span>' : '') + '</a>';
        });
      }
    });
    h += '<div class="nav-h">Thiết lập</div>' + navLink('#/kb', 'book', 'Kho tri thức', n === 'kb') + navLink('#/budget', 'wallet', 'Ngân sách', n === 'budget') + (can.admin() ? navLink('#/connections', 'plug', 'Kết nối', n === 'connections') : '');
    h += '<div class="nav-h">Kiểm soát</div>' + navLink('#/quality', 'gauge', 'Chất lượng', n === 'quality') + navLink('#/audit', 'log', 'Nhật ký', n === 'audit') + (can.admin() ? navLink('#/users', 'users', 'Người dùng & quyền', n === 'users') : '');
    h += '<div class="nav-h">Demo</div><a href="index.html">' + ic('back') + '<span>Trang giới thiệu</span></a></nav>';
    return h;
  }
  function topbar(title, r) {
    var alerts = incidentsOpen().length + approvalsScoped().filter(function (x) { return x.slaMin < 0; }).length;
    var opts = branchesForRole().map(function (b) { return '<option value="' + b + '"' + (S.cs === b ? ' selected' : '') + '>' + brName(b) + '</option>'; }).join('');
    var fresh = REALTIME[r.name] ? '<span class="fresh hide-s"><span class="dot"></span>Trực tiếp</span>' : '<span class="fresh is-stale hide-s"><span class="dot"></span>Cập nhật 5 phút trước</span>';
    return '<button type="button" class="ib menu-btn" data-act="nav-open" aria-label="Mở menu" aria-controls="rail" aria-expanded="false">' + ic('menu') + '</button>' +
      '<h1 id="pageTitle" tabindex="-1">' + esc(title) + '</h1>' + fresh +
      '<label class="sr" for="csSel">Cơ sở</label><select id="csSel" class="sel" data-in="cs"' + (S.role === 'kd' ? ' title="Trưởng BP chỉ được giao CS Biên Hòa"' : '') + '>' + opts + '</select>' +
      '<button type="button" class="ib hide-s" data-act="pop" data-arg="search" aria-label="Tìm (phím /)">' + ic('search') + '</button>' +
      '<button type="button" class="ib" data-act="pop" data-arg="alerts" aria-label="Cảnh báo: ' + alerts + '">' + ic('bell') + (alerts ? '<span class="badge">' + alerts + '</span>' : '') + '</button>' +
      (can.stop() ? '<button type="button" class="ib ib--stop" data-act="stop-open" aria-label="Dừng khẩn">' + ic('stop') + '<span class="lbl">Dừng khẩn</span></button>' : '') +
      '<div class="acct"><button type="button" class="ib" data-act="pop" data-arg="acct" aria-haspopup="true" aria-label="Tài khoản: ' + esc(ROLE().person) + ', ' + esc(ROLE().name) + '">' + ic('user') + '<span class="lbl">' + esc(ROLE().person) + '</span></button>' + popHtml() + '</div>';
  }
  var POP = null;
  function popHtml() {
    if (POP === 'acct') {
      return '<div class="pop" role="menu" aria-label="Tài khoản"><h3>Xem với vai trò</h3>' +
        ['bgd', 'kd', 'admin'].map(function (k) { var R = T.ROLES[k]; return '<button type="button" role="menuitemradio" aria-checked="' + (S.role === k) + '" data-act="role" data-arg="' + k + '">' + esc(R.person) + ' · ' + esc(R.name) + '</button>'; }).join('') +
        '<hr><h3>Giao diện</h3>' + [['system', 'Theo hệ thống'], ['light', 'Sáng'], ['dark', 'Tối (ca đêm)']].map(function (t) { return '<button type="button" role="menuitemradio" aria-checked="' + (S.theme === t[0]) + '" data-act="theme" data-arg="' + t[0] + '">' + t[1] + '</button>'; }).join('') +
        '<hr><button type="button" role="menuitem" data-act="href" data-arg="index.html">' + ic('back') + 'Trang giới thiệu</button></div>';
    }
    if (POP === 'alerts') {
      var items = incidentsOpen().map(function (i) { return '<button type="button" role="menuitem" data-act="href" data-arg="#/incidents"><span class="lv lv--' + i.lv + '">' + i.lv + '</span><span>' + esc(i.title) + '</span></button>'; })
        .concat(approvalsScoped().filter(function (x) { return x.slaMin < 0; }).map(function (x) { return '<button type="button" role="menuitem" data-act="href" data-arg="#/approvals/' + x.id + '"><span class="sla sla--over">Quá hạn</span><span>' + esc(x.agent + ' · ' + x.kind) + '</span></button>'; }));
      return '<div class="pop" role="menu" aria-label="Cảnh báo"><h3>Cảnh báo</h3>' + (items.join('') || '<p class="muted" style="padding:8px">Không có cảnh báo.</p>') + '</div>';
    }
    if (POP === 'search') {
      return '<div class="pop" role="dialog" aria-label="Tìm"><h3>Tìm agent hoặc màn hình</h3><input class="input" id="searchIn" data-in="search" placeholder="Ví dụ: K1, ngân sách" autocomplete="off"><div id="searchRes"></div></div>';
    }
    return '';
  }
  function searchResults(v) {
    v = (v || '').trim().toLowerCase();
    var res = [];
    if (v) {
      S.agents.forEach(function (a) { if ((a.code + ' ' + a.name).toLowerCase().indexOf(v) > -1) res.push(['#/agent/' + a.code, a.code + ' · ' + a.name]); });
      Object.keys(TITLES).forEach(function (k) { if (k !== 'agent' && TITLES[k].toLowerCase().indexOf(v) > -1) res.push(['#/' + k, TITLES[k]]); });
    }
    return res.slice(0, 8).map(function (r) { return '<button type="button" data-act="href" data-arg="' + r[0] + '">' + esc(r[1]) + '</button>'; }).join('') || (v ? '<p class="muted" style="padding:8px">Không có kết quả.</p>' : '');
  }
  function stopBanner() {
    if (!S.stopped) return '';
    return '<div class="banner banner--stop" role="alert"><b>■ ' + esc(S.stopped.label) + ' đang tắt khẩn</b><span>hội thoại chuyển người · sự cố P1 đã tạo · lý do: ' + esc(S.stopped.reason) + '</span>' +
      '<button type="button" data-act="unstop"' + (can.admin() ? '' : ' disabled title="Chỉ admin được bật lại"') + '>Bật lại' + (can.admin() ? '' : ' (chỉ admin)') + '</button></div>';
  }

  /* ============================================================== VIEWS == */
  function card(title, body, extra, flush) {
    return '<section class="card"><div class="card__h"><h2>' + title + '</h2>' + (extra || '') + '</div><div class="card__b' + (flush ? ' card__b--flush' : '') + '">' + body + '</div></section>';
  }
  function empty(h, p, act) { return '<div class="empty"><h3>' + h + '</h3><p>' + p + '</p>' + (act || '') + '</div>'; }

  /* ---------------------------------------------------------- trang chủ -- */
  function vHome() {
    if (S.role === 'admin') return vFlow();
    return S.role === 'bgd' ? vOverview() : vMyWork();
  }
  function urgent() {
    var u = incidentsOpen().filter(function (i) { return i.lv === 'P1' || i.lv === 'P2'; });
    if (!u.length) return '';
    return '<div class="note note--bad" role="alert"><b>Việc gấp</b> · ' + u.map(function (i) { return '<span class="lv lv--' + i.lv + '">' + i.lv + '</span> ' + esc(i.title); }).join(' · ') + ' <a href="#/incidents">Mở sự cố</a></div>';
  }
  function carried() { return CARRIED ? '<div class="note" role="status">' + esc(CARRIED) + ' <button type="button" class="btn btn--sm btn--ghost" data-act="dismiss-carry">Ẩn</button></div>' : ''; }
  function vOverview() {
    var kpis = '<div class="kpis">' + T.KPI.map(function (k) {
      return '<div class="kpi"><span class="kpi__k">' + esc(k.k) + '</span><span class="kpi__v">' + esc(k.v) + '</span><span class="kpi__t"><span>Mục tiêu ' + esc(k.target) + ' · <span class="' + (k.ok ? 'kpi__ok">✓ Đạt' : 'kpi__no">✕ Chưa đạt') + '</span></span>' + spark(k.spark) + '</span></div>';
    }).join('') + '</div>';
    var cost = '<table class="tbl tbl--stack"><thead><tr><th>Agent</th><th>Đã dùng / trần tháng</th><th class="r">%</th></tr></thead><tbody>' +
      S.agents.filter(function (a) { return a.spent > 0; }).map(function (a) {
        var p = a.spent / a.budget;
        return '<tr><td><span class="plate">' + a.code + '</span> ' + esc(a.name) + '</td><td data-l="Đã dùng"><div class="row"><span class="mono">' + vnd(a.spent) + ' / ' + vnd(a.budget) + ' đ</span></div>' + meter(p) + '</td><td class="r" data-l="Tỉ lệ">' + Math.round(p * 100) + '%' + (a.code === 'K4' ? ' <span class="tag" style="color:var(--warn)">dự báo chạm trần 14/11</span>' : '') + '</td></tr>';
      }).join('') + '</tbody></table>';
    var inc = incidentsOpen().map(function (i) { return '<li class="row" style="padding:10px 0;border-bottom:1px solid var(--line)"><span class="lv lv--' + i.lv + '">' + i.lv + '</span><span style="flex:1 1 12rem">' + esc(i.title) + '</span><span class="muted">' + esc(i.state) + ' · ' + i.at + '</span></li>'; }).join('');
    var pend = function (b) { return S.approvals.filter(function (x) { return x.branch === b; }).length; };
    var cmp = [['Phản hồi tin đầu', '34 giây', '41 giây', '39 giây'], ['FAQ AI tự xử lý', '76%', '71%', '74%'], ['Lead có SĐT', '97%', '95%', '96%'], ['Nháp chờ duyệt', pend('td'), pend('gv'), pend('bh')], ['Chi phí AI tháng', '2,31 tr', '1,64 tr', '1,49 tr']];
    var cmpT = '<table class="tbl tbl--stack"><thead><tr><th>KPI</th><th>CS Thủ Đức</th><th>CS Gò Vấp</th><th>CS Biên Hòa</th></tr></thead><tbody>' +
      cmp.map(function (r) { return '<tr><td><b>' + r[0] + '</b></td><td data-l="Thủ Đức">' + r[1] + '</td><td data-l="Gò Vấp">' + r[2] + '</td><td data-l="Biên Hòa">' + r[3] + '</td></tr>'; }).join('') + '</tbody></table>';
    var impact = '<table class="tbl tbl--stack"><thead><tr><th>Agent</th><th>KPI tác động</th><th>Trạng thái</th></tr></thead><tbody>' + S.agents.filter(function (a) { return a.phase === 1; }).map(function (a) {
      return '<tr class="is-click" data-act="href" data-arg="#/agent/' + a.code + '"><td><span class="plate">' + a.code + '</span> ' + esc(a.name) + '</td><td data-l="KPI">' + esc(a.kpi[0]) + ': <b>' + esc(a.kpi[1]) + '</b></td><td data-l="Trạng thái">' + stBadge(stAgg(a)) + '</td></tr>';
    }).join('') + '</tbody></table>';
    return carried() + urgent() + kpis +
      '<div class="grid2">' + card('Chi phí tháng so với trần', cost, '<a href="#/budget">Ngân sách</a>', true) + card('Sự cố đang mở', inc ? '<ul style="list-style:none;margin:0;padding:0">' + inc + '</ul>' : empty('Không có sự cố', 'Mọi luồng chạy bình thường.')) + '</div>' +
      '<div class="grid2 grid2--even">' + card('So sánh cơ sở', cmpT, '<span class="muted">dữ liệu mẫu</span>', true) + card('KPI tác động theo agent', impact, '', true) + '</div>';
  }
  function vMyWork() {
    var list = approvalsScoped();
    var rows = list.map(function (x) {
      return '<tr class="is-click" data-act="href" data-arg="#/approvals/' + x.id + '"><td>' + riskTag(x.risk) + '</td><td data-l="Việc"><b>' + esc(x.agent) + ' · ' + esc(x.kind) + '</b><br><span class="muted">' + esc(x.who) + ' · ' + esc(x.reason) + '</span></td><td data-l="Cơ sở">' + brName(x.branch) + '</td><td class="r" data-l="Hạn">' + slaTxt(x.slaMin) + '</td></tr>';
    }).join('');
    var q1 = list.length ? '<table class="tbl tbl--stack"><thead><tr><th>Rủi ro</th><th>Nháp</th><th>Cơ sở</th><th class="r">Hạn SLA</th></tr></thead><tbody>' + rows + '</tbody></table>' : empty('Chưa có nháp chờ duyệt', 'AI đang tự xử lý tốt. Nháp mới sẽ hiện ở đây và trong nhóm Zalo của BP.');
    var alerts = incidentsOpen().filter(function (i) { return i.flows.some(function (f) { return f[0] === 'K'; }); }).map(function (i) { return '<li style="padding:8px 0;border-bottom:1px solid var(--line)"><span class="lv lv--' + i.lv + '">' + i.lv + '</span> ' + esc(i.title) + '</li>'; }).join('');
    var sh = T.EVAL.K1.shadow;
    var decide = '<div class="stack" style="gap:10px"><div class="row"><span class="plate">K1</span><b>Nháp v5 đang shadow tại CS Biên Hòa</b></div><p class="muted">So với live: khớp ' + Math.round(sh.agree * 100) + '% · ' + sh.runs + '/' + sh.need + ' lượt · ' + sh.hours + '/' + sh.needH + ' giờ</p>' +
      '<div class="row"><button type="button" class="btn" aria-disabled="true" data-act="noop" title="Cần đủ 50 lượt và 24 giờ">Chuyển Live</button><span class="why">Chưa đủ 50 lượt và 24 giờ shadow</span><a class="spacer" href="#/agent/K1/versions">Xem so sánh</a></div></div>';
    var faq = S.faq.map(function (f, i) { return '<li class="row" style="padding:8px 0;border-bottom:1px solid var(--line)"><span style="flex:1 1 12rem">' + esc(f.q) + ' <span class="muted">· ' + f.n + ' lần / 7 ngày</span></span>' + (f.done ? '<span class="tag tag--ov">Đã tạo nháp FAQ</span>' : '<button type="button" class="btn btn--sm" data-act="faq" data-arg="' + i + '">Tạo FAQ</button>') + '</li>'; }).join('');
    var kp = S.agents.filter(function (a) { return a.dept === 'kd' && a.phase === 1; }).map(function (a) { return '<div class="kpi"><span class="kpi__k">' + a.code + ' · ' + esc(a.kpi[0]) + '</span><span class="kpi__v">' + esc(a.kpi[1]) + '</span></div>'; }).join('');
    return carried() + urgent() + card('Nháp chờ duyệt · sắp theo hạn SLA', q1, '<a href="#/approvals">Mở Hàng duyệt</a>', true) +
      '<div class="grid2 grid2--even">' + card('Cảnh báo luồng của BP', alerts ? '<ul style="list-style:none;margin:0;padding:0">' + alerts + '</ul>' : empty('Không có cảnh báo', 'Các luồng Kinh doanh chạy bình thường.')) + card('Quyết định đang chờ', decide) + '</div>' +
      '<div class="grid2 grid2--even">' + card('Gợi ý FAQ mới từ lịch sử chat', '<ul style="list-style:none;margin:0;padding:0">' + faq + '</ul>') + card('KPI agent của BP', '<div class="kpis">' + kp + '</div>') + '</div>';
  }

  /* -------------------------------------------------------- sơ đồ luồng -- */
  function costToday(a) { return a.spent / 6; }
  function vFlow() {
    var ag = S.agents;
    var running = ag.filter(function (a) { var s = stAgg(a); return s === 'live' || s === 'shadow' || s === 'fallback'; }).length;
    var runsToday = Math.round(ag.reduce(function (s, a) { return s + a.runs; }, 0) / 6);
    var errs = ag.reduce(function (s, a) { return s + a.errors; }, 0);
    var costT = ag.reduce(function (s, a) { return s + costToday(a); }, 0);
    var kp = [['Luồng đang chạy', running + '/15'], ['Lượt chạy hôm nay', vnd(runsToday)], ['Tỉ lệ lỗi', (errs / runsToday * 100).toFixed(2).replace('.', ',') + '%'], ['Chờ duyệt', approvalsScoped().length], ['Chi phí hôm nay', vnd(costT) + ' đ']];
    var kpis = '<div class="kpis">' + kp.map(function (k) { return '<div class="kpi"><span class="kpi__k">' + k[0] + '</span><span class="kpi__v">' + k[1] + '</span></div>'; }).join('') + '</div>';
    var groups = T.GROUPS.map(function (g) {
      return '<div class="fgroup"><h3>' + esc(g[0]) + '</h3><p>' + esc(g[1]) + '</p>' + g[2].map(function (c) { return fcard(agent(c)); }).join('') + '</div>';
    }).join('');
    var canvas = '<div class="canvas" id="canvas"><div class="canvas__tools"><button type="button" class="ib" data-act="zoom" data-arg="out" aria-label="Thu nhỏ">−</button><button type="button" class="ib" data-act="zoom" data-arg="in" aria-label="Phóng to">+</button><button type="button" class="ib" data-act="zoom" data-arg="fit">Vừa màn</button></div>' +
      '<div class="canvas__inner" id="cinner" style="transform:scale(' + S.zoom + ')"><svg class="links" id="links" aria-hidden="true"></svg>' + groups + '</div></div>';
    return kpis + '<div class="flowwrap">' + canvas + flowPanel() + '</div>';
  }
  function fcard(a) {
    var st = stAgg(a), plan = a.phase > 1;
    var cells = S.cs === 'all' ? ['td', 'gv', 'bh'].map(function (b) { var s = stAt(a, b); return '<span title="' + brName(b) + ': ' + T.STATUS[s].label + '">' + T.branch(b).short + ' <span style="color:var(--' + T.STATUS[s].tok + ')">' + T.STATUS[s].sym + '</span></span>'; }).join(' ') : stBadge(st);
    var menu = S.menu === a.code ? flowMenu(a) : '';
    return '<div class="fcard' + (S.flowSel === a.code ? ' is-sel' : '') + '" id="fc-' + a.code + '"' + (plan ? ' data-plan' : '') + '>' +
      '<div class="fcard__top"><span class="plate">' + a.code + '</span>' + (plan ? '<span class="tag">GĐ' + a.phase + '</span>' : stBadge(st, S.cs === 'all' ? 'nolabel' : '')) +
      '<button type="button" class="more" data-act="fmenu" data-arg="' + a.code + '" aria-label="Thao tác với ' + a.code + '" aria-expanded="' + (S.menu === a.code) + '">⋯</button></div>' +
      '<button type="button" class="fcard__open" data-act="fsel" data-arg="' + a.code + '"><span class="fcard__name">' + esc(a.name) + '</span>' +
      (plan ? '<span class="muted" style="font-size:12px">Chưa triển khai · ' + esc(NEED[a.code] || '') + '</span>' :
        '<span class="fcard__meta"><span>Cơ sở</span><b>' + cells + '</b><span>Lượt gần nhất</span><b>' + esc(a.lastRun || '—') + '</b><span>Chi phí hôm nay</span><b>' + vnd(costToday(a)) + ' đ</b><span>Lỗi</span><b' + (a.errors ? ' style="color:var(--bad)"' : '') + '>' + a.errors + '</b></span>') +
      '</button>' + menu + '</div>';
  }
  function flowMenu(a) {
    var ok = can.edit(a) && a.phase === 1;
    var why = ok ? '' : ' disabled title="' + (a.phase > 1 ? 'Agent chưa triển khai' : 'Chỉ xem: agent của bộ phận khác') + '"';
    var st = S.cs === 'all' ? null : stAt(a, S.cs);
    return '<div class="menu" role="menu">' +
      '<button type="button" role="menuitem" data-act="href" data-arg="#/agent/' + a.code + '/config">Mở cấu hình</button>' +
      '<button type="button" role="menuitem" data-act="href" data-arg="#/agent/' + a.code + '/runs">Xem lượt chạy</button>' +
      '<button type="button" role="menuitem" data-act="frun" data-arg="' + a.code + '"' + why + '>Chạy ngay</button>' +
      '<button type="button" role="menuitem" data-act="fmode" data-arg="' + a.code + '"' + why + '>' + (st === 'shadow' ? 'Chuyển Live' : 'Chuyển Shadow') + (S.cs === 'all' ? ' (chọn cơ sở)' : '') + '</button>' +
      '<button type="button" role="menuitem" data-act="href" data-arg="#/agent/' + a.code + '/versions"' + why + '>Rollback…</button>' +
      '<button type="button" role="menuitem" class="is-danger" data-act="foff" data-arg="' + a.code + '"' + why + '>Tắt luồng này' + (S.cs === 'all' ? '' : ' (' + T.branch(S.cs).short + ')') + '</button></div>';
  }
  function flowPanel() {
    var a = agent(S.flowSel);
    var tabs = [['luong', 'Luồng'], ['canhbao', 'Cảnh báo'], ['nhatky', 'Nhật ký']];
    var h = '<section class="card"><div class="tabs" role="tablist">' + tabs.map(function (t) { return '<button type="button" role="tab" aria-selected="' + (S.flowTab === t[0]) + '" data-act="ftab" data-arg="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><div class="card__b">';
    if (S.flowTab === 'luong') {
      h += '<div class="stack" style="gap:12px"><div class="row"><span class="plate plate--lg">' + a.code + '</span><b style="font-size:15px">' + esc(a.name) + '</b></div><p class="muted">' + esc(DESC[a.code]) + '</p>' +
        '<table class="tbl"><tbody>' + ['td', 'gv', 'bh'].map(function (b) { return '<tr><td>' + brName(b) + '</td><td class="r">' + (a.phase > 1 ? 'GĐ' + a.phase : stBadge(stAt(a, b))) + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<dl class="fcard__meta" style="font-size:13px"><span>Kích hoạt</span><b>' + esc(a.mode) + '</b><span>Model</span><b>' + esc(a.model) + '</b><span>Rủi ro mặc định</span><b>' + riskTag(a.risk) + '</b></dl>' +
        '<div class="row"><a class="btn btn--sm" href="#/agent/' + a.code + '/config">Mở cấu hình</a><a class="btn btn--sm" href="#/agent/' + a.code + '/runs">Lượt chạy</a></div></div>';
    } else if (S.flowTab === 'canhbao') {
      var items = incidentsOpen().map(function (i) { return '<li style="padding:8px 0;border-bottom:1px solid var(--line)"><span class="lv lv--' + i.lv + '">' + i.lv + '</span> ' + esc(i.title) + '</li>'; });
      S.agents.forEach(function (x) { if (x.spent / x.budget >= 0.4 && x.code === 'K4') items.push('<li style="padding:8px 0">⚠ K4 đã dùng 44% trần sau 6 ngày</li>'); });
      h += '<ul style="list-style:none;margin:0;padding:0">' + items.join('') + '</ul>';
    } else {
      h += '<ul style="list-style:none;margin:0;padding:0">' + S.audit.slice(0, 8).map(function (r) { return '<li style="padding:8px 0;border-bottom:1px solid var(--line);font-size:13px"><span class="mono">' + r.t + '</span> <b>' + esc(r.who) + '</b> · ' + esc(r.what) + '</li>'; }).join('') + '</ul>';
    }
    return h + '</div></section>';
  }
  function drawLinks() {
    var svg = $('#links'), inner = $('#cinner');
    if (!svg || !inner || small.matches) return;
    var ib = inner.getBoundingClientRect(), z = S.zoom;
    svg.setAttribute('width', inner.scrollWidth); svg.setAttribute('height', inner.scrollHeight);
    svg.innerHTML = T.DEPS.map(function (d) {
      var A = $('#fc-' + d[0]), B = $('#fc-' + d[1]); if (!A || !B) return '';
      var a = A.getBoundingClientRect(), b = B.getBoundingClientRect();
      var x1 = (a.right - ib.left) / z, y1 = (a.top + a.height / 2 - ib.top) / z, x2 = (b.left - ib.left) / z, y2 = (b.top + b.height / 2 - ib.top) / z;
      if (x2 < x1) { x1 = (a.left + a.width / 2 - ib.left) / z; y1 = (a.bottom - ib.top) / z; x2 = (b.left + b.width / 2 - ib.left) / z; y2 = (b.top - ib.top) / z; return '<path class="is-live" d="M' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + (y1 + 20) + ', ' + x2 + ' ' + (y2 - 20) + ', ' + x2 + ' ' + y2 + '"/>'; }
      var mx = (x1 + x2) / 2, live = agent(d[0]).phase === 1 && agent(d[1]).phase === 1;
      return '<path' + (live ? ' class="is-live"' : '') + ' d="M' + x1 + ' ' + y1 + ' C ' + mx + ' ' + y1 + ', ' + mx + ' ' + y2 + ', ' + x2 + ' ' + y2 + '"/>';
    }).join('');
  }

  /* -------------------------------------------------------------- sự cố -- */
  function vIncidents() {
    var list = S.incidents.filter(function (i) { return inScope(i.br); });
    if (!list.length) return card('Sự cố', empty('Không có sự cố', 'Kết nối hỏng, chạm trần hay chế độ dự phòng sẽ tự tạo sự cố ở đây.'));
    return '<section class="card"><div class="card__h"><h2>P1–P3 · ' + brName(S.cs) + '</h2><span class="muted">Kết nối hỏng và chế độ dự phòng được tạo thành sự cố tự động</span></div><div>' + list.map(function (i) {
      var tl = i.lv === 'P1' ? [[i.at, 'Dừng khẩn bởi ' + i.by], [i.at, 'Zalo báo BGĐ và admin']] : [[i.at, 'Tự tạo từ ' + (i.flows[0] === 'K5' ? 'lỗi kết nối Meta Ads' : 'cảnh báo hệ thống')], ['07:05', 'Thông báo nhóm Zalo admin'], ['07:20', i.state === 'Mở' ? 'Chờ người nhận' : 'Minh nhận xử lý']];
      return '<details style="border-bottom:1px solid var(--line)"><summary class="row" style="padding:12px 16px;cursor:pointer;min-height:48px"><span class="lv lv--' + i.lv + '">' + i.lv + '</span><b style="flex:1 1 14rem">' + esc(i.title) + '</b><span class="tag">' + esc(i.state) + '</span><span class="muted">' + brName(i.br) + ' · ' + i.at + '</span></summary>' +
        '<div style="padding:0 16px 14px 56px" class="stack"><p class="muted">Luồng bị ảnh hưởng: ' + i.flows.join(', ') + '</p><ol style="margin:0;padding-left:18px">' + tl.map(function (t) { return '<li><span class="mono">' + t[0] + '</span> ' + esc(t[1]) + '</li>'; }).join('') + '</ol>' +
        (i.lv === 'P1' && S.stopped ? '<div><button type="button" class="btn" data-act="unstop"' + (can.admin() ? '' : ' disabled') + '>Bật lại</button> <span class="why">' + (can.admin() ? 'Ghi chú bắt buộc khi bật lại' : 'Chỉ admin được bật lại') + '</span></div>' : '') +
        (i.flows[0] === 'K5' && can.admin() ? '<div><a class="btn btn--sm" href="#/connections">Mở kết nối</a></div>' : '') + '</div></details>';
    }).join('') + '</div></section>';
  }

  /* ---------------------------------------------------------- hàng duyệt -- */
  function markWrong(s, x) {
    var t = esc(s);
    return x.id === '8KX2' ? t.replace(/18\.500\.000đ|18\.000\.000đ/g, function (m) { return '<span class="badnum">' + m + '</span>'; }) : t;
  }
  function vApprovals(id) {
    var f = S.qf || { risk: '', agent: '' };
    var list = approvalsScoped().filter(function (x) { return (!f.risk || x.risk === f.risk) && (!f.agent || x.agent === f.agent); });
    var sel = id ? list.filter(function (x) { return x.id === id; })[0] : (!small.matches ? list[0] : null);
    var agentsIn = {}; approvalsScoped().forEach(function (x) { agentsIn[x.agent] = 1; });
    var filters = '<div class="qfilters"><label class="sr" for="qfRisk">Lọc theo rủi ro</label><select class="sel" id="qfRisk" data-in="qf-risk"><option value="">Mọi mức rủi ro</option>' + ['high', 'mid', 'low'].map(function (r) { return '<option value="' + r + '"' + (f.risk === r ? ' selected' : '') + '>' + T.RISK[r].label + '</option>'; }).join('') + '</select>' +
      '<label class="sr" for="qfAg">Lọc theo agent</label><select class="sel" id="qfAg" data-in="qf-agent"><option value="">Mọi agent</option>' + Object.keys(agentsIn).map(function (c) { return '<option' + (f.agent === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>';
    var items = list.map(function (x) {
      return '<button type="button" class="qitem' + (x.slaMin < 0 ? ' is-over' : '') + '" data-act="href" data-arg="#/approvals/' + x.id + '"' + (sel && sel.id === x.id ? ' aria-current="true"' : '') + '>' +
        riskTag(x.risk) + '<span class="qitem__t">' + esc(x.agent) + ' · ' + esc(x.kind) + '</span>' + slaTxt(x.slaMin) +
        '<span class="qitem__s">' + brName(x.branch) + ' · ' + esc(x.who) + ' · ' + esc(x.reason) + (x.stale ? ' · <b style="color:var(--warn)">Đã cũ</b>' : '') + '</span></button>';
    }).join('');
    var left = '<div class="qlist">' + filters + (items || empty('Chưa có nháp chờ duyệt', 'AI đang tự xử lý tốt. Nháp mới sẽ hiện ở đây kèm tin trong nhóm Zalo.')) +
      '<p class="why" style="padding:10px 12px">Phím tắt: <span class="kbd">J</span>/<span class="kbd">K</span> di chuyển · <span class="kbd">A</span> duyệt · <span class="kbd">E</span> sửa · <span class="kbd">R</span> từ chối</p></div>';
    return '<div class="split' + (sel ? ' has-sel' : '') + '">' + left + (sel ? qDetail(sel) : '<div class="qdetail">' + empty('Chọn một nháp', 'Chọn nháp bên trái để xem ngữ cảnh, nguồn KB và lý do rủi ro.') + '</div>') + '</div>';
  }
  function qDetail(x) {
    var a = agent(x.agent), m = S.mode[x.id] || 'view';
    var srcs = x.kb.map(function (k) {
      var r = S.kb.filter(function (y) { return y.id === k; })[0]; if (!r) return '';
      var mismatch = x.id === '8KX2' && k === 'kb1';
      return '<li><span class="tag' + (r.scope !== 'all' ? ' tag--ov' : '') + '">' + (r.scope === 'all' ? 'Chung' : brName(r.scope) + ' ghi đè') + '</span><b>' + esc(r.topic) + '</b><span>' + esc(r.text) + '</span>' + (mismatch ? '<span class="risk risk--high">Nháp đã dùng, không khớp cơ sở</span>' : '') + (x.id === '8KX2' && k === 'kb1-bh' ? '<span class="risk risk--low">Bản hiệu lực tại cơ sở</span>' : '') + '</li>';
    }).join('') || '<li class="muted">Không có nguồn KB phù hợp</li>';
    var draft = x.stale ? '<div class="bubble bubble--ai is-stale">' + esc(x.draft) + '</div><div class="note note--warn">Đã cũ: khách vừa nhắn thêm. Nút Duyệt bị khóa. <button type="button" class="btn btn--sm" data-act="q-fresh" data-arg="' + x.id + '">Xem nháp mới</button></div>' : '<div class="bubble bubble--ai">' + markWrong(x.draft, x) + '</div>';
    var body;
    if (m === 'edit') {
      body = '<h3>Sửa rồi gửi</h3><label class="sr" for="qEdit">Nội dung sẽ gửi</label><textarea class="input" id="qEdit" rows="6">' + esc(S.editText || x.draft) + '</textarea>' +
        (x.fixed ? '<div><button type="button" class="btn btn--sm" data-act="q-usekb" data-arg="' + x.id + '">Dùng giá KB của ' + brName(x.branch) + '</button></div>' : '') +
        '<label class="check"><input type="checkbox" id="qEval" checked> Thêm vào ca eval</label>';
    } else if (m === 'reject') {
      body = '<h3>Từ chối · lý do (bắt buộc)</h3><div class="reasons" role="radiogroup" aria-label="Lý do">' + ['Sai giá', 'Không phù hợp', 'Để nhân viên trả lời', 'Khác'].map(function (r) { return '<label><input class="sr" type="radio" name="qrj" value="' + r + '">' + r + '</label>'; }).join('') + '</div>' +
        '<h3>Bước tiếp theo</h3><label class="check"><input type="radio" name="qnext" value="staff" checked> Chuyển nhân viên trả lời</label><label class="check"><input type="radio" name="qnext" value="none"> Không gửi gì</label><label class="check"><input type="checkbox" id="qEval2" checked> Thêm vào ca eval</label>';
    } else if (m === 'transfer') {
      body = '<h3>Chuyển người khác</h3><label class="field">Người nhận<select class="sel" id="qTo"><option>Thảo · Tư vấn viên ' + T.branch(x.branch).short + '</option><option>Minh · Admin</option><option>Anh Quang · BGĐ</option></select></label>';
    } else {
      body = '<h3>Ngữ cảnh</h3><div class="bubble">' + esc(x.ctx) + '</div><h3>Nháp của AI</h3>' + draft + '<h3>Nguồn KB đã dùng</h3><ul class="srcs">' + srcs + '</ul><h3>Lý do vào duyệt</h3><p>' + esc(x.reason) + (x.id === '8KX2' ? ': nháp ghi 18.500.000đ, KB CS Biên Hòa ghi 17.900.000đ.' : '') + '</p><p class="muted">Phiên bản luồng: ' + esc(x.ver) + ' · vào hàng lúc ' + x.at + '</p>';
    }
    var noApprove = !can.approve() ? ' disabled title="BGĐ chỉ xem; trưởng BP hoặc admin duyệt nháp"' : '';
    var acts;
    if (m === 'edit') acts = '<button type="button" class="btn" data-act="q-mode" data-arg="view">Hủy</button><button type="button" class="btn btn--go" data-act="q-send" data-arg="' + x.id + '">Gửi bản đã sửa</button>';
    else if (m === 'reject') acts = '<button type="button" class="btn" data-act="q-mode" data-arg="view">Hủy</button><button type="button" class="btn btn--danger" data-act="q-reject" data-arg="' + x.id + '">Từ chối</button>';
    else if (m === 'transfer') acts = '<button type="button" class="btn" data-act="q-mode" data-arg="view">Hủy</button><button type="button" class="btn btn--go" data-act="q-transfer" data-arg="' + x.id + '">Chuyển</button>';
    else acts = '<button type="button" class="btn btn--go" data-act="q-approve" data-arg="' + x.id + '"' + (x.stale ? ' disabled title="Nháp đã cũ"' : noApprove) + '>Duyệt <span class="kbd">A</span></button>' +
      '<button type="button" class="btn" data-act="q-mode" data-arg="edit"' + noApprove + '>Sửa rồi gửi <span class="kbd">E</span></button>' +
      '<button type="button" class="btn" data-act="q-mode" data-arg="reject"' + noApprove + '>Từ chối <span class="kbd">R</span></button>' +
      '<button type="button" class="btn wide" data-act="q-mode" data-arg="transfer"' + noApprove + '>Chuyển người khác</button>' + (!can.approve() ? '<span class="why wide">BGĐ chỉ xem hàng duyệt.</span>' : '');
    return '<div class="qdetail" id="qd" data-id="' + x.id + '"><div class="qdetail__h"><a class="btn btn--sm btn--ghost menu-only" href="#/approvals" aria-label="Về danh sách">' + ic('back') + '</a>' + riskTag(x.risk) + '<span class="plate">' + a.code + '</span><b>' + esc(a.name) + '</b><span class="muted">' + brName(x.branch) + ' · ' + esc(x.who) + '</span><span class="spacer">' + slaTxt(x.slaMin) + '</span></div>' +
      '<div class="qdetail__b">' + body + '</div><div class="actbar">' + acts + '</div></div>';
  }
  function qRemove(id, msg, undoable) {
    var idx = -1, item;
    S.approvals.forEach(function (x, i) { if (x.id === id) { idx = i; item = x; } });
    if (idx < 0) return;
    S.approvals.splice(idx, 1); S.mode[id] = 'view'; S.editText = null;
    var next = approvalsScoped()[0];
    go(next && !small.matches ? '#/approvals/' + next.id : '#/approvals');
    toast(msg, undoable ? { fn: function () { S.approvals.splice(idx, 0, item); S.audit.shift(); toast('Đã hoàn tác, nháp quay lại hàng duyệt'); go('#/approvals/' + id); } } : null);
  }

  /* ------------------------------------------------------------- hộp thư -- */
  var TOPIC = [[/giá|học phí|bao nhiêu|tiền/i, 'Học phí hạng B (số tự động)'], [/địa chỉ|ở đâu|đường nào|chỗ nào/i, 'Địa chỉ'], [/khai giảng|khi nào|lịch/i, 'Lịch khai giảng'], [/hồ sơ|giấy tờ|cần gì/i, 'Hồ sơ đăng ký']];
  function vInbox(id) {
    var list = S.convs.filter(function (c) { return inScope(c.branch); });
    var sel = id ? list.filter(function (c) { return c.id === id; })[0] : (!small.matches ? list[0] : null);
    var items = list.map(function (c) {
      return '<button type="button" class="qitem" data-act="href" data-arg="#/inbox/' + c.id + '"' + (sel && sel.id === c.id ? ' aria-current="true"' : '') + '><span class="tag">' + esc(c.chan) + '</span><span class="qitem__t">' + esc(c.name) + '</span><span class="tag' + (c.state === 'ai' ? ' tag--ov">AI' : '">Người') + '</span><span class="qitem__s">' + brName(c.branch) + ' · ' + esc(c.msgs[c.msgs.length - 1].t.slice(0, 60)) + '</span></button>';
    }).join('');
    var right = '<div class="qdetail">' + empty('Chọn một hội thoại', 'Danh sách gộp Zalo, Fanpage, TikTok của các cơ sở trong phạm vi.') + '</div>';
    if (sel) {
      var tik = sel.chan === 'TikTok';
      var who = { c: sel.name, ai: 'AI · K1', staff: 'Nhân viên', sys: '' };
      var log = sel.msgs.map(function (m, i) {
        if (m.a === 'sys') return '<div class="cm cm--sys">' + esc(m.t) + '</div>';
        return '<div class="cm cm--' + m.a + '"><span class="cm__who"><b>' + esc(who[m.a]) + '</b>' + (m.time ? '<span class="mono">' + m.time + '</span>' : '') + (m.note ? '<span>' + esc(m.note) + '</span>' : '') +
          (m.a === 'ai' ? (m.flag ? '<span class="risk risk--high">Đã đánh dấu sai</span>' : '<button type="button" class="flag" data-act="flag" data-arg="' + sel.id + ':' + i + '">Đánh dấu sai</button>') : '') + '</span>' +
          '<div class="bubble' + (m.a === 'ai' ? ' bubble--ai' : m.a === 'staff' ? ' bubble--staff' : '') + '">' + esc(m.t) + '</div></div>';
      }).join('');
      var head = '<div class="qdetail__h"><a class="btn btn--sm btn--ghost menu-only" href="#/inbox" aria-label="Về danh sách">' + ic('back') + '</a><b>' + esc(sel.name) + '</b><span class="tag">' + esc(sel.chan) + '</span><span class="muted">' + brName(sel.branch) + '</span>' +
        (tik ? '<span class="tag">TikTok: gợi ý AI, nhân viên gửi</span>' : '') + '<span class="spacer"></span>' +
        (sel.state === 'ai' ? '<button type="button" class="btn btn--sm" data-act="takeover" data-arg="' + sel.id + '">Tiếp quản</button>' : '<button type="button" class="btn btn--sm" data-act="giveback" data-arg="' + sel.id + '">Trả lại AI</button>') + '</div>';
      var comp = '<form class="composer" data-form="say" data-arg="' + sel.id + '"><label class="sr" for="say">' + (sel.state === 'ai' ? 'Mô phỏng tin của khách' : 'Tin của nhân viên') + '</label><input class="input" id="say" autocomplete="off" placeholder="' + (sel.state === 'ai' ? 'Gõ vai khách, ví dụ: học phí bao nhiêu?' : 'Nhân viên trả lời khách…') + '"><button type="submit" class="btn btn--go">Gửi</button></form>';
      right = '<div class="qdetail">' + head + '<div class="chatlog" aria-live="polite">' + log + '</div>' + comp + '</div>';
    }
    return '<div class="split' + (sel ? ' has-sel' : '') + '"><div class="qlist">' + items + '</div>' + right + '</div>';
  }
  function aiReply(c, text) {
    var topic = null;
    TOPIC.forEach(function (t) { if (!topic && t[0].test(text)) topic = t[1]; });
    if (/khiếu nại|hoàn tiền|phản ánh|đăng ký/i.test(text)) { c.state = 'human'; c.msgs.push({ a: 'sys', t: 'K1 chuyển cho tư vấn viên · rủi ro cao (khiếu nại/đăng ký)' }); audit('K1', 'Chuyển người: ' + c.name, c.branch, 'engine'); return; }
    if (!topic) {
      c.msgs.push({ a: 'sys', t: 'Ngoài KB → nháp vào hàng duyệt (rủi ro TB)' });
      S.approvals.push({ id: 'N' + Math.random().toString(36).slice(2, 5).toUpperCase(), agent: 'K1', branch: c.branch, risk: 'mid', kind: 'Trả lời ngoài kho tri thức', who: c.name, ctx: '"' + text + '"', draft: 'Dạ em ghi nhận câu hỏi và nhờ tư vấn viên trả lời anh/chị trong giờ làm việc ạ.', reason: 'Không có trong KB', kb: [], ver: 'K1 · v3', at: 'vừa xong', slaMin: 30, slaTotal: 30 });
      return;
    }
    var r = null, own = null, all = null;
    S.kb.forEach(function (k) { if (k.topic === topic) { if (k.scope === c.branch) own = k; else if (k.scope === 'all') all = k; } });
    r = own || all;
    c.msgs.push({ a: 'ai', t: 'Dạ ' + r.text.charAt(0).toLowerCase() + r.text.slice(1) + ' ạ.', time: 'vừa xong', note: 'KB: ' + (r.scope === 'all' ? 'chung' : brName(r.scope) + ' ghi đè') + ' · tự gửi (rủi ro thấp)' });
  }

  /* ---------------------------------------------------------- trang agent -- */
  var BLOCKS = {
    F: ['F', 'Lọc & phân loại', 'kênh, ý định'], KB: ['KB', 'Tra kho tri thức', 'theo cơ sở, còn hiệu lực'], L: ['L', 'Soạn trả lời (LLM)', 'Sonnet · tối đa 4 câu'],
    X: ['X', 'Đối chiếu số tiền với KB', 'chênh > 0đ → rủi ro TB'], R: ['R', 'Chấm rủi ro', 'ma trận Thấp/TB/Cao', 1], G: ['G', 'Cổng duyệt', 'tự gửi ≤ TB nếu khớp KB', 1],
    S: ['S', 'Gửi tin', 'Zalo OA / Fanpage'], H: ['H', 'Chuyển người', 'đăng ký, khiếu nại'], W: ['W', 'Chờ', '5 phút'], C: ['C', 'Ghi CRM', 'crm.upsert_lead'], T: ['T', 'Gọi tool', 'schedule.next_openings']
  };
  function cfgOf(code) {
    if (!S.cfg[code]) S.cfg[code] = { mode: 'basic', chain: ['F', 'KB', 'L', 'X', 'R', 'G', 'S'], tested: false, evalOk: false, published: false, sample: 'bh', hours: '24/7', maxRisk: 'mid', sla: 30, retry: 2, tone: 'em – anh/chị', len: 4, askPhone: 2, cap: code === 'K1' || code === 'V5' ? 'down' : 'warn', saved: false };
    return S.cfg[code];
  }
  function validate(chain) {
    var e = {};
    var at = function (k) { return chain.indexOf(k); };
    if (at('S') > -1 && at('G') > -1 && at('S') < at('G')) e.S = '"Gửi tin" phải đứng sau "Cổng duyệt"';
    if (at('R') > -1 && at('G') > -1 && at('R') > at('G')) e.R = '"Chấm rủi ro" phải đứng trước "Cổng duyệt"';
    if (at('X') > -1 && at('L') > -1 && at('X') < at('L')) e.X = '"Đối chiếu" cần bản nháp của "Soạn trả lời" đứng trước';
    if (at('G') < 0) e.G = 'Thiếu "Cổng duyệt"';
    return e;
  }
  function vAgent(code, tab) {
    var a = agent(code);
    if (!a) return card('Không tìm thấy', empty('Không có agent ' + esc(code), 'Kiểm tra lại đường dẫn.'));
    tab = tab || 'overview';
    var tabs = [['overview', 'Tổng quan'], ['config', 'Cấu hình'], ['versions', 'Phiên bản & eval'], ['runs', 'Lượt chạy'], ['cost', 'Chi phí'], ['approvals', 'Duyệt']];
    var head = '<div class="ahead"><span class="plate plate--lg">' + a.code + '</span><h2>' + esc(a.name) + '</h2>' + (a.phase > 1 ? '<span class="tag">GĐ' + a.phase + ' · chưa triển khai</span>' : stBadge(stAgg(a))) + '<span class="muted">' + OWNER[a.dept] + '</span></div>';
    var nav = '<nav class="tabs" aria-label="Tab của agent">' + tabs.map(function (t) { return '<a href="#/agent/' + a.code + '/' + t[0] + '" aria-selected="' + (tab === t[0]) + '"' + (tab === t[0] ? ' aria-current="page"' : '') + '>' + t[1] + '</a>'; }).join('') + '</nav>';
    var ro = !can.see(a) ? '<div class="note">Bạn đang xem agent của bộ phận khác ở chế độ chỉ xem.</div>' : '';
    var body;
    if (a.phase > 1 && tab !== 'overview') body = card('Chưa triển khai', empty('Agent dự kiến ở giai đoạn ' + a.phase, 'Phụ thuộc còn thiếu: ' + esc(NEED[a.code] || '—') + '. Khi đủ điều kiện, admin tạo luồng từ template và bắt đầu ở chế độ nháp.'));
    else if (tab === 'overview') body = agOverview(a);
    else if (tab === 'config') body = agConfig(a);
    else if (tab === 'versions') body = agVersions(a);
    else if (tab === 'runs') body = agRuns(a);
    else if (tab === 'cost') body = agCost(a);
    else body = agApprovals(a);
    return head + nav + ro + body;
  }
  function agOverview(a) {
    var rows = ['td', 'gv', 'bh'].map(function (b) { return '<tr><td>' + brName(b) + '</td><td data-l="Chế độ">' + (a.phase > 1 ? '<span class="muted">GĐ' + a.phase + '</span>' : stBadge(stAt(a, b))) + '</td><td data-l="Phiên bản">' + (a.phase > 1 ? '—' : a.code === 'K1' ? (b === 'bh' ? 'v4 (shadow) · v3 live' : 'v3') : 'v2') + '</td></tr>'; }).join('');
    var info = '<dl class="fcard__meta" style="font-size:13.5px;gap:8px 16px"><span>Chủ sở hữu</span><b>' + OWNER[a.dept] + '</b><span>Giai đoạn</span><b>GĐ' + a.phase + '</b><span>Kích hoạt</span><b>' + esc(a.mode) + '</b><span>Model</span><b>' + esc(a.model) + '</b><span>Mức rủi ro đầu ra</span><b>' + riskTag(a.risk) + '</b><span>KPI tác động</span><b>' + esc(a.kpi[0]) + ': ' + esc(a.kpi[1] || 'chưa có số') + '</b></dl>';
    return '<div class="grid2">' + card('Mô tả', '<p style="margin-bottom:14px">' + esc(DESC[a.code]) + '</p>' + info) + card('Trạng thái theo cơ sở', '<table class="tbl tbl--stack"><thead><tr><th>Cơ sở</th><th>Chế độ</th><th>Phiên bản</th></tr></thead><tbody>' + rows + '</tbody></table>', '', true) + '</div>' +
      (a.phase > 1 ? '<div class="note note--warn"><b>Chưa triển khai.</b> Phụ thuộc còn thiếu: ' + esc(NEED[a.code] || '') + '</div>' : '');
  }
  function agConfig(a) {
    var c = cfgOf(a.code), errs = validate(c.chain), nErr = Object.keys(errs).length;
    var editable = can.edit(a);
    var adv = c.mode === 'adv';
    var steps = [['Nháp v5', 'dựa trên v3', c.saved || true ? 'done' : 'now'], ['Chạy thử', c.tested ? 'đã chạy' : 'chưa chạy', c.tested ? 'done' : 'now'], ['Eval', c.evalOk ? '24/24 · 88%' : 'tự chạy sau chạy thử', c.evalOk ? 'done' : c.tested ? 'now' : ''], ['Phát hành', c.published ? 'BH · ghi chú có' : 'chọn cơ sở', c.published ? 'done' : c.evalOk ? 'now' : ''], ['Shadow', c.published ? '0/50 lượt' : '24h / 50 lượt', c.published ? 'now' : ''], ['Live', '', '']];
    if (nErr) steps[1] = ['Chạy thử', 'bị chặn: ' + nErr + ' lỗi kiểm tra', 'block'];
    var life = '<ol class="life" aria-label="Vòng đời">' + steps.map(function (s) { return '<li class="' + (s[2] === 'done' ? 'is-done' : s[2] === 'now' ? 'is-now' : s[2] === 'block' ? 'is-block' : '') + '"' + (s[2] === 'now' ? ' aria-current="step"' : '') + '><b>' + (s[2] === 'done' ? '✓ ' : s[2] === 'block' ? '✕ ' : '') + s[0] + '</b><span>' + s[1] + '</span></li>'; }).join('') + '</ol>';
    var modeSeg = '<div class="seg" role="group" aria-label="Chế độ cấu hình"><button type="button" aria-pressed="' + !adv + '" data-act="cfgmode" data-arg="basic">Cơ bản</button><button type="button" aria-pressed="' + adv + '" data-act="cfgmode" data-arg="adv"' + (can.admin() ? '' : ' disabled') + '>Nâng cao</button></div>' + (can.admin() ? '' : '<span class="why">Chỉ admin hoặc người được cấp quyền bật chế độ Nâng cao</span>');
    var top = '<div class="row"><span class="tag tag--ov">Bạn đang sửa Nháp v5, dựa trên v3</span><span class="muted">● Live v3 (Thủ Đức, Gò Vấp) · ◐ Shadow v4 (Biên Hòa)</span><span class="spacer"></span>' + modeSeg + '</div>';
    var dis = editable ? '' : ' disabled';
    var ov = '<span class="ov">Ghi đè theo cơ sở</span>';
    var form = '<form class="card__b" data-form="cfg" data-arg="' + a.code + '">' +
      '<fieldset class="fs"><legend>Khi nào chạy</legend><div class="fgrid"><label class="field">Giờ hoạt động' + ov + '<select class="sel" data-in="cfg-hours"' + dis + '><option' + (c.hours === '24/7' ? ' selected' : '') + '>24/7</option><option' + (c.hours === '7h–21h' ? ' selected' : '') + '>7h–21h</option></select></label>' +
      '<div class="field">Kênh<span class="row"><label class="check"><input type="checkbox" checked' + dis + '> Zalo</label><label class="check"><input type="checkbox" checked' + dis + '> Fanpage</label><label class="check"><input type="checkbox" checked' + dis + '> TikTok</label></span></div></div></fieldset>' +
      '<fieldset class="fs"><legend>Trả lời thế nào</legend><div class="fgrid"><label class="field">Xưng hô<select class="sel"' + dis + '><option>em – anh/chị</option><option>trung tâm – bạn</option></select></label><label class="field">Độ dài tối đa <small>(câu)</small><input type="number" min="1" max="8" value="' + c.len + '"' + dis + '></label><label class="field">Xin SĐT sau <small>(tin)</small><input type="number" min="1" max="5" value="' + c.askPhone + '"' + dis + '></label></div></fieldset>' +
      '<fieldset class="fs"><legend>Duyệt</legend><div class="fgrid"><label class="field">Tự gửi tối đa ở mức rủi ro' + ov + '<select class="sel" data-in="cfg-risk"' + dis + '><option value="low"' + (c.maxRisk === 'low' ? ' selected' : '') + '>Thấp</option><option value="mid"' + (c.maxRisk === 'mid' ? ' selected' : '') + '>TB (khi khớp KB)</option><option disabled>Cao (vượt trần template)</option></select><small>Template ' + a.code + ' giới hạn ở TB. Rủi ro cao luôn duyệt.</small></label>' +
      '<label class="field">Nhóm Zalo nhận duyệt' + ov + '<select class="sel"' + dis + '><option>KD · CS Biên Hòa</option><option>KD · CS Thủ Đức</option><option>KD · CS Gò Vấp</option></select></label><label class="field">Hạn duyệt (SLA) <small>(phút)</small><input type="number" min="5" max="1440" value="' + c.sla + '"' + dis + '></label></div></fieldset>' +
      '<fieldset class="fs"><legend>Lỗi & giới hạn</legend><div class="fgrid"><label class="field">Thử lại khi lỗi <small>(lần)</small><input type="number" min="0" max="5" value="' + c.retry + '"' + dis + '></label>' +
      '<label class="field">Khi chạm trần chi phí<select class="sel"' + dis + '><option value="down" selected>Hạ model rồi chuyển người</option><option value="pause"' + (a.code === 'K1' || a.code === 'V5' ? ' disabled' : '') + '>Tạm dừng</option><option value="warn">Chỉ cảnh báo</option></select>' + (a.code === 'K1' || a.code === 'V5' ? '<small>Luồng hướng khách không được tạm dừng khi chạm trần.</small>' : '') + '</label></div></fieldset></form>';
    var chain = '<ol class="chain">' + c.chain.map(function (k, i) {
      var b = BLOCKS[k], lock = b[3], err = errs[k];
      return '<li class="blk' + (err ? ' is-err' : '') + '"><span class="blk__sym">' + b[0] + '</span><span class="blk__n">' + esc(b[1]) + (lock ? ' 🔒<span class="sr">khóa</span>' : '') + '</span>' +
        (adv ? '<span class="blk__acts"><button type="button" aria-label="Đưa ' + esc(b[1]) + ' lên" data-act="blk" data-arg="up:' + i + '"' + (lock || i === 0 ? ' disabled' : '') + '>' + ic('up') + '</button><button type="button" aria-label="Đưa ' + esc(b[1]) + ' xuống" data-act="blk" data-arg="down:' + i + '"' + (lock || i === c.chain.length - 1 ? ' disabled' : '') + '>' + ic('down') + '</button><button type="button" aria-label="Xóa ' + esc(b[1]) + '" data-act="blk" data-arg="del:' + i + '"' + (lock ? ' disabled title="Khối khóa không xóa được"' : '') + '>' + ic('x') + '</button></span>' : '<span></span>') +
        '<span class="blk__p">' + esc(b[2]) + '</span>' + (err ? '<span class="blk__err" role="alert">' + esc(err) + '</span>' : '') + '</li>';
    }).join('') + '<li class="blk blk--branch"><span class="blk__sym">H</span><span class="blk__n">Nhánh: Chuyển người</span><span></span><span class="blk__p">đăng ký, khiếu nại</span></li></ol>' +
      (adv ? '<div class="row" style="margin-top:10px"><label class="sr" for="addBlk">Thêm khối</label><select class="sel" id="addBlk"><option value="W">Chờ</option><option value="C">Ghi CRM</option><option value="T">Gọi tool</option></select><button type="button" class="btn btn--sm" data-act="blk" data-arg="add:0">' + ic('plus') + 'Thêm khối</button></div>' : '<p class="why" style="margin-top:10px">Chỉ đọc ở chế độ Cơ bản.</p>');
    var test = '';
    if (c.tested) {
      test = card('Kết quả chạy thử <span class="dry">Không gửi thật</span>', '<ol class="steps">' + c.chain.map(function (k) {
        var out = { F: 'Zalo · hỏi giá · CS Biên Hòa', KB: 'Học phí hạng B · ghi đè BH 17.900.000đ', L: '"Dạ tại CS Biên Hòa, học phí…"', X: 'Khớp KB cơ sở', R: 'Thấp', G: 'Tự gửi', S: 'dry-run: không gửi', W: 'chờ 5 phút', C: 'upsert lead (dry-run)', T: 'gọi tool (dry-run)', H: '—' }[k];
        return '<li><span class="blk__sym">' + BLOCKS[k][0] + '</span><span>' + esc(BLOCKS[k][1]) + ': <span class="muted">' + esc(out) + '</span></span><span class="ok">✓ ' + (80 + k.length * 37) + 'ms</span></li>';
      }).join('') + '</ol><div class="note note--ok" style="margin-top:12px"><b>Eval tự chạy:</b> ca bắt buộc 24/24 đạt (100%) · ca chất lượng 88% (ngưỡng 85%)' + (S.evalCases.some(function (e) { return e.id === 'ec-bh'; }) ? ' · gồm ca mới "giá CS Biên Hòa"' : '') + '</div>');
    }
    var foot = '<div class="actbar"><button type="button" class="btn" data-act="cfg-save" data-arg="' + a.code + '"' + dis + '>Lưu nháp</button><label class="sr" for="tsample">Dữ liệu chạy thử</label><select class="sel" id="tsample"' + dis + '><option>Mẫu: khách Zalo CS Biên Hòa hỏi học phí</option><option>20 sự kiện gần nhất</option></select>' +
      '<button type="button" class="btn" data-act="cfg-test" data-arg="' + a.code + '"' + (nErr || !editable ? ' disabled' : '') + '>' + ic('play') + 'Chạy thử</button><button type="button" class="btn btn--go" data-act="pub-open" data-arg="' + a.code + '"' + (!c.evalOk || nErr || !editable ? ' disabled' : '') + '>Phát hành…</button>' +
      '<span class="spacer why">Lỗi kiểm tra: ' + nErr + ' · Cảnh báo: 1' + (!c.evalOk ? ' · Phát hành mở sau khi eval đạt' : '') + '</span></div>';
    return life + top + (editable ? '' : '<div class="note">Bạn chỉ có quyền xem cấu hình agent này.</div>') + '<div class="cfg"><section class="card">' + (adv ? '<div class="card__h"><h2>Tham số</h2><span class="muted">vẫn sửa được ở Nâng cao</span></div>' : '<div class="card__h"><h2>Tham số</h2><span class="muted">sinh từ param_schema</span></div>') + form + '</section>' + card('Chuỗi khối' + (adv ? '' : ' <span class="muted" style="font-weight:400">(chỉ đọc)</span>'), chain) + '</div>' + test + '<section class="card">' + foot + '</section>';
  }
  function agVersions(a) {
    var vs = [['v5', 'Nháp', '06/11 08:41', 'Minh', 'Giờ hoạt động 24/7'], ['v4', 'Đã thử · Shadow (BH)', '04/11 10:02', 'Chị Lan', 'Thêm khối Đối chiếu số tiền'], ['v3', 'Phát hành · Live (TĐ, GV, BH)', '28/10 15:30', 'Minh', 'Ngưỡng tự gửi TB khi khớp KB'], ['v2', 'Ngừng', '15/10 09:10', 'Minh', 'Xin SĐT sau 2 tin'], ['v1', 'Ngừng', '01/10 08:00', 'admin', 'Khởi tạo']];
    var t = '<table class="tbl tbl--stack"><thead><tr><th>Phiên bản</th><th>Trạng thái</th><th>Ngày</th><th>Người</th><th>Ghi chú</th><th></th></tr></thead><tbody>' + vs.map(function (v) {
      return '<tr><td><b class="mono">' + v[0] + '</b></td><td data-l="Trạng thái">' + v[1] + '</td><td data-l="Ngày">' + v[2] + '</td><td data-l="Người">' + v[3] + '</td><td data-l="Ghi chú">' + v[4] + '</td><td>' + (v[0] === 'v3' || v[0] === 'v2' ? '<button type="button" class="btn btn--sm" data-act="rollback" data-arg="' + a.code + ':' + v[0] + '"' + (can.edit(a) ? '' : ' disabled') + '>Quay về ' + v[0] + '</button>' : '') + '</td></tr>';
    }).join('') + '</tbody></table>';
    var diff = '<div class="diff stack" style="gap:8px;font-size:13.5px"><p><b>Tham số</b></p><p>Giờ hoạt động: <del>7h–21h</del> → <ins>24/7</ins></p><p>Hạn duyệt: <del>15 phút</del> → <ins>30 phút</ins></p><p><b>Khối</b></p><p><ins>+ X · Đối chiếu số tiền với KB</ins> (sau L, trước R)</p></div>';
    var ev = T.EVAL.K1;
    var evB = '<div class="kpis"><div class="kpi"><span class="kpi__k">Ca bắt buộc (phải 100%)</span><span class="kpi__v">' + ev.must[0] + '/' + ev.must[1] + '</span><span class="kpi__t"><span class="kpi__ok">✓ Đạt</span></span></div><div class="kpi"><span class="kpi__k">Ca chất lượng (≥ 85%)</span><span class="kpi__v">' + Math.round(ev.quality * 100) + '%</span><span class="kpi__t"><span class="kpi__ok">✓ Đạt</span></span></div><div class="kpi"><span class="kpi__k">Shadow v4 so với live</span><span class="kpi__v">' + Math.round(ev.shadow.agree * 100) + '%</span><span class="kpi__t">' + ev.shadow.runs + '/50 lượt · ' + ev.shadow.hours + '/24 giờ</span></div></div>';
    return card('Phiên bản', t, '', true) + '<div class="grid2 grid2--even">' + card('So sánh v3 ↔ v5', diff) + card('Kết quả eval · v5', evB) + '</div>';
  }
  function agRuns(a) {
    var R = [['08:12:04', 'td', 'live', 'Thành công', 1840, 2310, 410], ['08:11:40', 'bh', 'shadow', 'Thành công', 2120, 2480, 0], ['07:58:13', 'gv', 'live', 'Thành công', 1510, 1980, 350], ['07:55:02', 'gv', 'live', 'Chuyển người', 990, 1220, 210], ['02:14:09', 'bh', 'live', 'Vào hàng duyệt', 2400, 2650, 470], ['02:13:31', 'bh', 'live', 'Thành công', 1620, 2010, 380], ['02:11:12', 'bh', 'live', 'Lỗi (thử lại OK)', 4100, 2100, 390]];
    var sel = S.runSel;
    var t = '<table class="tbl tbl--stack"><thead><tr><th>Giờ</th><th>Cơ sở</th><th>Chế độ</th><th>Kết quả</th><th class="r">ms</th><th class="r">Token</th><th class="r">Chi phí</th></tr></thead><tbody>' + R.filter(function (r) { return inScope(r[1]); }).map(function (r, i) {
      return '<tr class="is-click" tabindex="0" data-act="run" data-arg="' + i + '"><td class="mono">' + r[0] + '</td><td data-l="Cơ sở">' + brName(r[1]) + '</td><td data-l="Chế độ">' + stBadge(r[2]) + '</td><td data-l="Kết quả">' + r[3] + '</td><td class="r mono" data-l="ms">' + vnd(r[4]) + '</td><td class="r mono" data-l="Token">' + vnd(r[5]) + '</td><td class="r mono" data-l="Chi phí">' + vnd(r[6]) + ' đ</td></tr>';
    }).join('') + '</tbody></table>';
    var det = '';
    if (sel != null) {
      det = card('Chi tiết lượt chạy ' + R[sel][0] + ' · đã che PII', '<ol class="steps">' + ['F', 'KB', 'L', 'X', 'R', 'G', 'S'].map(function (k, i) {
        var io = { F: 'in: tin Zalo từ khách SĐT •••• 4214 → out: ý định "hỏi giá"', KB: 'out: Học phí hạng B · ' + brName(R[sel][1]), L: 'out: nháp 3 câu · 412 token', X: 'so khớp số tiền: ' + (R[sel][3] === 'Vào hàng duyệt' ? 'lệch 600.000đ' : 'khớp'), R: R[sel][3] === 'Vào hàng duyệt' ? 'TB' : 'Thấp', G: R[sel][3] === 'Vào hàng duyệt' ? 'giữ → hàng duyệt' : 'tự gửi', S: R[sel][2] === 'shadow' ? 'shadow: không gửi' : 'đã gửi' }[k];
        return '<li><span class="blk__sym">' + k + '</span><span>' + esc(BLOCKS[k][1]) + ': <span class="muted">' + esc(io) + '</span></span><span class="mono">' + (60 + i * 140) + 'ms</span></li>';
      }).join('') + '</ol>' + (S.raw ? '<div class="note note--warn" style="margin-top:12px">Bản gốc (đã ghi audit): SĐT 0901 234 214 · tên Lê Thị Mai</div>' : can.admin() ? '<button type="button" class="btn btn--sm" style="margin-top:12px" data-act="raw">Xem bản gốc…</button>' : '<p class="why" style="margin-top:12px">Chỉ admin xem được bản gốc, phải nêu lý do.</p>'));
    }
    return card('Lượt chạy · ' + a.code, t, '<span class="muted">bấm một dòng để xem từng bước</span>', true) + det;
  }
  function agCost(a) {
    var days = [0.62, 0.71, 0.58, 0.83, 0.77, 0.69, 0.74], mx = Math.max.apply(null, days);
    var labels = ['31/10', '01/11', '02/11', '03/11', '04/11', '05/11', '06/11'];
    var per = a.spent / 6;
    var bars = '<div class="bars" role="img" aria-label="Chi phí 7 ngày gần nhất">' + days.map(function (d, i) { return '<div><span class="mono">' + vnd(per * d / 0.7 / 1000) + 'k</span><i style="height:' + (d / mx * 100) + '%"></i><span>' + labels[i] + '</span></div>'; }).join('') + '</div>';
    var p = a.spent / a.budget;
    var split = '<table class="tbl"><tbody><tr><td>LLM</td><td class="r mono">' + vnd(a.spent * 0.82) + ' đ</td></tr><tr><td>ZNS</td><td class="r mono">' + vnd(a.spent * 0.14) + ' đ</td></tr><tr><td>OCR</td><td class="r mono">' + vnd(a.spent * 0.04) + ' đ</td></tr><tr><td><b>Tháng 11 / trần</b></td><td class="r mono"><b>' + vnd(a.spent) + ' / ' + vnd(a.budget) + ' đ</b></td></tr></tbody></table>' + meter(p) +
      '<p class="why" style="margin-top:8px">Khi chạm trần: ' + (a.code === 'K1' || a.code === 'V5' ? 'hạ model rồi chuyển người (luồng hướng khách)' : a.code === 'K4' ? 'tạm dừng' : 'chỉ cảnh báo') + '. Cảnh báo Zalo ở 80%.</p>';
    return '<div class="grid2">' + card('Theo ngày · ' + brName(S.cs), bars) + card('Cơ cấu & trần', split) + '</div>';
  }
  function agApprovals(a) {
    var l = approvalsScoped().filter(function (x) { return x.agent === a.code; });
    return card('Nháp chờ duyệt của ' + a.code, l.length ? '<table class="tbl tbl--stack"><tbody>' + l.map(function (x) { return '<tr class="is-click" data-act="href" data-arg="#/approvals/' + x.id + '"><td>' + riskTag(x.risk) + '</td><td>' + esc(x.kind) + ' · ' + esc(x.who) + '</td><td class="r">' + slaTxt(x.slaMin) + '</td></tr>'; }).join('') + '</tbody></table>' : empty('Không có nháp chờ', 'Agent này đang tự xử lý trong ngưỡng cho phép.'), '', true);
  }

  /* ---------------------------------------------- thiết lập & kiểm soát -- */
  function daysTo(d) { if (!d) return null; var p = d.split('/'); return Math.round((new Date(+p[2], +p[1] - 1, +p[0]) - TODAY) / 864e5); }
  function vKb() {
    var tabs = '<div class="tabs" role="tablist"><button type="button" role="tab" aria-selected="' + (S.kbTab === 'docs') + '" data-act="kbtab" data-arg="docs">Tài liệu</button><button type="button" role="tab" aria-selected="' + (S.kbTab === 'faq') + '" data-act="kbtab" data-arg="faq">Gợi ý FAQ</button></div>';
    if (S.kbTab === 'faq') return '<section class="card">' + tabs + '<div class="card__b"><ul style="list-style:none;margin:0;padding:0">' + S.faq.map(function (f, i) { return '<li class="row" style="padding:10px 0;border-bottom:1px solid var(--line)"><span style="flex:1 1 14rem">' + esc(f.q) + ' <span class="muted">· ' + f.n + ' lần / 7 ngày</span></span>' + (f.done ? '<span class="tag tag--ov">Đã tạo nháp</span>' : '<button type="button" class="btn btn--sm" data-act="faq" data-arg="' + i + '">Tạo FAQ</button>') + '</li>'; }).join('') + '</ul></div></section>';
    var rows = S.kb.filter(function (k) { return inScope(k.scope); }).map(function (k) {
      var d = daysTo(k.validTo);
      return '<tr><td><b>' + esc(k.topic) + '</b><br><span class="muted">' + esc(k.text) + '</span></td><td data-l="Phạm vi"><span class="tag' + (k.scope !== 'all' ? ' tag--ov' : '') + '">' + (k.scope === 'all' ? 'Chung' : brName(k.scope) + ' ghi đè') + '</span></td><td data-l="Loại">' + esc(k.kind) + '</td><td data-l="Hiệu lực" class="mono">' + k.valid + (k.validTo ? ' → ' + k.validTo : '') + (d != null ? '<br><span class="tag" style="color:var(--warn)">Hết hạn sau ' + d + ' ngày</span>' : '') + '</td><td><button type="button" class="btn btn--sm" data-act="kb-edit" data-arg="' + k.id + '"' + (S.role === 'bgd' ? ' disabled title="BGĐ chỉ xem"' : '') + '>Sửa</button></td></tr>';
    }).join('');
    return '<section class="card">' + tabs + '<table class="tbl tbl--stack"><thead><tr><th>Tài liệu</th><th>Phạm vi</th><th>Loại</th><th>Hiệu lực</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></section>';
  }
  function vBudget() {
    var rows = S.agents.filter(function (a) { return a.phase === 1 && can.see(a); }).map(function (a) {
      var p = a.spent / a.budget, face = a.code === 'K1' || a.code === 'V5';
      return '<tr><td><span class="plate">' + a.code + '</span> ' + esc(a.name) + '</td><td class="r mono" data-l="Trần">' + vnd(a.budget) + ' đ</td><td class="r mono" data-l="Đã dùng">' + vnd(a.spent) + ' đ</td><td data-l="Tiến độ">' + meter(p) + '<span class="why">' + Math.round(p * 100) + '% · mốc 80%</span></td>' +
        '<td data-l="Khi chạm trần"><label class="sr" for="cap-' + a.code + '">Hành vi khi chạm trần ' + a.code + '</label><select class="sel" id="cap-' + a.code + '"' + (S.role === 'kd' ? ' disabled' : '') + '><option>Hạ model rồi chuyển người</option><option' + (face ? ' disabled' : '') + (a.code === 'K4' ? ' selected' : '') + '>Tạm dừng</option><option' + (!face && a.code !== 'K4' ? ' selected' : '') + '>Chỉ cảnh báo</option></select>' + (face ? '<span class="why">Luồng hướng khách: không được tạm dừng</span>' : '') + '</td>' +
        '<td>' + (can.raise() ? '<button type="button" class="btn btn--sm" data-act="raise" data-arg="' + a.code + '">Nâng trần tháng này</button>' : '') + '</td></tr>';
    }).join('');
    return '<div class="note">Trần tính theo agent × cơ sở × tháng, gồm LLM + ZNS + OCR. Bảng đang gộp ' + brName(S.cs) + '.</div>' + card('Ngân sách tháng 11', '<table class="tbl tbl--stack"><thead><tr><th>Agent</th><th class="r">Trần</th><th class="r">Đã dùng</th><th>Tiến độ</th><th>Khi chạm trần</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>', '', true);
  }
  function vConnections() {
    var lab = { ok: ['ok', '✓ Hoạt động'], warn: ['warn', '△ Sắp hết hạn'], bad: ['bad', '✕ Hỏng'] };
    return '<div class="kpis" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">' + S.connections().map(function (c) {
      var l = lab[c.st];
      return '<section class="card"><div class="card__h"><h2>' + esc(c.kind) + '</h2><span style="color:var(--' + l[0] + ');font-weight:700">' + l[1] + '</span></div><div class="card__b stack" style="gap:8px"><p class="mono muted">' + esc(c.id) + '</p><p>Cơ sở: ' + brName(c.br) + ' · lần OK gần nhất: ' + esc(c.last) + '</p><p>Luồng đang dùng: ' + c.flows.join(', ') + '</p>' +
        (c.id === 'conn:meta-gv' ? (S.connErr ? '<div class="note note--bad">Không tải được lịch sử kiểm tra. <button type="button" class="btn btn--sm" data-act="conn-retry">Thử lại</button></div>' : '<p class="why">Token Meta hết hạn hôm qua 22:10 → K5 GV đang chạy dự phòng.</p>') : '') +
        (c.kind.indexOf('Zalo OA') === 0 ? '<p class="why">Khung nhắn tin tư vấn: 48 giờ sau tin cuối của khách (cấu hình được)</p>' : '') +
        '<div class="row"><button type="button" class="btn btn--sm" data-act="conn-test" data-arg="' + c.id + '">Kiểm tra lại</button></div></div></section>';
    }).join('') + '</div>';
  }
  S.connections = function () { return T.CONNECTIONS.filter(function (c) { return inScope(c.br); }); };
  function vQuality() {
    var live = S.agents.filter(function (a) { return a.phase === 1; });
    var t = '<table class="tbl tbl--stack"><thead><tr><th>Agent</th><th>Bắt buộc</th><th>Chất lượng</th><th>Xu hướng hằng đêm</th></tr></thead><tbody>' + live.map(function (a, i) {
      var qv = [0.88, 0.91, 0, 0.86, 0.93, 0, 0.87][i] || 0.9;
      return '<tr><td><span class="plate">' + a.code + '</span> ' + esc(a.name) + '</td><td data-l="Bắt buộc"><span class="kpi__ok">✓ 100%</span></td><td data-l="Chất lượng">' + Math.round(qv * 100) + '%' + (qv < 0.87 ? ' <span class="tag" style="color:var(--warn)">gần ngưỡng</span>' : '') + '</td><td data-l="Xu hướng">' + spark([qv - 0.02, qv - 0.01, qv, qv - 0.03, qv, qv + 0.01, qv].map(function (x) { return x * 100; })) + '</td></tr>';
    }).join('') + '</tbody></table>';
    var smp = S.sample.map(function (s) { return '<li class="stack" style="gap:6px;padding:10px 0;border-bottom:1px solid var(--line)"><span class="muted">' + s.ag + ' · ' + brName(s.br) + '</span><span>Khách: ' + esc(s.q) + '</span><span class="bubble bubble--ai">' + esc(s.a) + '</span>' + (s.v ? '<span class="tag">' + s.v + '</span>' : '<span class="row"><button type="button" class="btn btn--sm" data-act="grade" data-arg="' + s.id + ':Đạt">Đạt</button><button type="button" class="btn btn--sm" data-act="grade" data-arg="' + s.id + ':Không đạt">Không đạt</button></span>') + '</li>'; }).join('');
    var ec = S.evalCases.map(function (e) { return '<li class="row" style="padding:10px 0;border-bottom:1px solid var(--line)"><span style="flex:1 1 14rem"><b>' + esc(e.text) + '</b><br><span class="muted">' + esc(e.from) + '</span></span>' + (e.st === 'chờ' ? '<button type="button" class="btn btn--sm" data-act="ec-ok" data-arg="' + e.id + '">Xác nhận làm ca bắt buộc</button>' : '<span class="tag tag--ov">Đã thêm</span>') + '</li>'; }).join('');
    return card('Điểm eval theo agent', t, '', true) + '<div class="grid2 grid2--even">' + card('Lấy mẫu 5% để người chấm', '<ul style="list-style:none;margin:0;padding:0">' + smp + '</ul>') + card('Ca mới sinh từ nháp bị sửa', '<ul style="list-style:none;margin:0;padding:0">' + ec + '</ul>') + '</div>';
  }
  function vAudit() {
    var f = S.af || '';
    var rows = S.audit.filter(function (r) { return inScope(r.br) && (!f || (r.who + ' ' + r.what).toLowerCase().indexOf(f.toLowerCase()) > -1); });
    return '<section class="card"><div class="card__h"><h2>Nhật ký · chỉ thêm, không sửa</h2><label class="sr" for="af">Lọc nhật ký</label><input class="input" id="af" data-in="af" value="' + esc(f) + '" placeholder="Lọc theo người, hành động" style="max-width:260px"><button type="button" class="btn btn--sm" data-act="csv">Xuất CSV</button></div>' +
      '<table class="tbl tbl--stack"><thead><tr><th>Giờ</th><th>Người / agent</th><th>Hành động</th><th>Cơ sở</th><th>Kênh</th></tr></thead><tbody>' + rows.map(function (r) { return '<tr' + (r.you ? ' class="is-you"' : '') + '><td class="mono">' + r.t + '</td><td data-l="Ai">' + esc(r.who) + '</td><td data-l="Hành động">' + esc(r.what) + '</td><td data-l="Cơ sở">' + brName(r.br) + '</td><td data-l="Kênh" class="mono">' + r.ch + '</td></tr>'; }).join('') + '</tbody></table></section>';
  }
  function vUsers() {
    var U = [['Anh Quang', 'BGĐ', 'Toàn chuỗi', 'Không'], ['Chị Lan', 'Trưởng BP Kinh doanh', 'CS Biên Hòa', 'Không'], ['Anh Tâm', 'Trưởng BP Kinh doanh', 'CS Thủ Đức, CS Gò Vấp', 'Không'], ['Chị Hạnh', 'Trưởng BP Vận hành', 'Toàn chuỗi', 'Không'], ['Minh', 'Admin', 'Toàn chuỗi', 'Có']];
    var G = [['KD · CS Biên Hòa', 'Duyệt + cảnh báo K1–K7'], ['KD · CS Thủ Đức', 'Duyệt + cảnh báo K1–K7'], ['VH · Toàn chuỗi', 'Cảnh báo V1–V8'], ['BGĐ & Admin', 'P1, chạm trần 80%/100%']];
    return '<div class="grid2">' + card('Người dùng × vai trò × cơ sở', '<table class="tbl tbl--stack"><thead><tr><th>Người</th><th>Vai trò</th><th>Cơ sở</th><th>Chế độ Nâng cao</th></tr></thead><tbody>' + U.map(function (u, i) { return '<tr><td><b>' + u[0] + '</b></td><td data-l="Vai trò">' + u[1] + '</td><td data-l="Cơ sở">' + u[2] + '</td><td data-l="Nâng cao"><label class="check"><input type="checkbox"' + (u[3] === 'Có' ? ' checked disabled' : '') + ' data-act="perm" data-arg="' + i + '"> ' + (u[3] === 'Có' ? 'Mặc định (admin)' : 'Cấp quyền') + '</label></td></tr>'; }).join('') + '</tbody></table>', '', true) +
      card('Nhóm Zalo nhận cảnh báo & duyệt', '<ul style="list-style:none;margin:0;padding:0">' + G.map(function (g) { return '<li style="padding:10px 0;border-bottom:1px solid var(--line)"><b>' + g[0] + '</b><br><span class="muted">' + g[1] + '</span></li>'; }).join('') + '</ul>') + '</div>';
  }
  function vNoPerm(what) {
    return card('Không có quyền', empty('Bạn không có quyền xem ' + what, 'Mục này chỉ dành cho admin kỹ thuật. Liên hệ Minh (admin) để xin quyền. Mọi lần mở mục nhạy cảm đều được ghi nhật ký.', '<a class="btn" href="#/home">Về Trang chủ</a>'));
  }

  /* ------------------------------------------ trang điện thoại /d và /stop -- */
  function pageD(code) {
    var x = T.APPROVALS.filter(function (a) { return a.id === code; })[0] || T.APPROVALS[0];
    var st = S.dState || (S.tram && S.tram !== 'cho' ? 'mine' : 'cho');
    var a = T.agent(x.agent);
    var h = '<div class="mpage"><header class="mpage__h"><span class="plate">' + a.code + '</span><b>' + esc(brName(x.branch)) + '</b>' + riskTag(x.risk) + '<span class="spacer sla">⏱ ' + (x.id === '8KX2' ? '48′' : x.slaMin + '′') + '</span></header><main class="mpage__b" id="main">';
    var bar = '';
    if (st === 'cho' || st === 'stale') {
      var m = S.dMode || 'view';
      if (m === 'edit') {
        h += '<h2>Sửa rồi gửi</h2><label class="sr" for="dEdit">Nội dung</label><textarea class="input" id="dEdit" rows="9">' + esc(S.dText || x.draft) + '</textarea>' + (x.fixed ? '<button type="button" class="btn" data-act="d-usekb">Dùng giá KB của ' + brName(x.branch) + '</button>' : '') + '<label class="check"><input type="checkbox" checked> Thêm vào ca eval</label>';
        bar = '<button type="button" class="btn" data-act="d-mode" data-arg="view">Hủy</button><button type="button" class="btn btn--go" data-act="d-done" data-arg="sua">Gửi bản đã sửa</button>';
      } else if (m === 'reject') {
        h += '<h2>Lý do từ chối</h2><div class="reasons" role="radiogroup" aria-label="Lý do">' + ['Sai giá', 'Không phù hợp', 'Để nhân viên trả lời', 'Khác'].map(function (r) { return '<label><input class="sr" type="radio" name="drj" value="' + r + '">' + r + '</label>'; }).join('') + '</div><h2>Bước tiếp theo</h2><label class="check"><input type="radio" name="dnext" checked> Chuyển nhân viên trả lời</label><label class="check"><input type="radio" name="dnext"> Không gửi gì</label><p class="err" id="dErr" role="alert"></p>';
        bar = '<button type="button" class="btn" data-act="d-mode" data-arg="view">Hủy</button><button type="button" class="btn btn--danger" data-act="d-done" data-arg="tuchoi">Từ chối</button>';
      } else {
        h += '<h2>Hội thoại (5 tin gần nhất)</h2><div class="bubble"><b>' + esc(x.who) + '</b><br>' + esc(x.ctx) + '</div>' + (x.id === '8KX2' ? '<div class="bubble bubble--ai">AI đã gửi (mẫu): ' + esc(T.HELD.holding) + '</div>' : '') +
          '<h2>Nháp AI chờ duyệt</h2>' + (st === 'stale' ? '<div class="bubble bubble--ai is-stale">' + esc(x.draft) + '</div><div class="note note--warn">Đã cũ: khách vừa nhắn thêm. <button type="button" class="btn btn--sm" data-act="d-state" data-arg="cho">Xem nháp mới</button></div>' : '<div class="bubble bubble--ai">' + markWrong(x.draft, x) + '</div>') +
          '<details><summary style="min-height:44px;display:flex;align-items:center;color:var(--info)">Nguồn KB (' + x.kb.length + ')</summary><ul class="srcs">' + x.kb.map(function (k) { var r = T.kb(k); return '<li><span class="tag">' + (r.scope === 'all' ? 'Chung' : brName(r.scope)) + '</span>' + esc(r.text) + '</li>'; }).join('') + '</ul></details>' +
          '<h2>Lý do rủi ro</h2><p>' + esc(x.reason) + (x.id === '8KX2' ? ': nháp ghi 18.500.000đ, KB CS Biên Hòa ghi 17.900.000đ.' : '') + '</p>';
        bar = '<button type="button" class="btn wide" data-act="d-mode" data-arg="edit">Sửa</button><button type="button" class="btn btn--danger" data-act="d-mode" data-arg="reject">Từ chối</button><button type="button" class="btn btn--go" data-act="d-done" data-arg="duyet"' + (st === 'stale' ? ' disabled' : '') + '>Duyệt</button>';
      }
    } else {
      var msg = {
        mine: ['note--ok', 'Bạn đã xử lý mục này', 'Thao tác từ trang giới thiệu đã được ghi nhật ký với kênh zalo_link.'],
        sua: ['note--ok', '✓ Đã gửi bản đã sửa', 'Bot báo trong nhóm: "✓ Đã duyệt bởi Lan · 07:12". Nháp gốc vào ca eval.'],
        duyet: ['note--warn', '✓ Đã gửi', 'Đã gửi nguyên văn. Nếu nháp lệch KB, hệ thống tạo ca eval và sự cố P3.'],
        tuchoi: ['note', '↷ Đã từ chối', 'Hội thoại chuyển tư vấn viên, hạn gọi lại 08:30.'],
        other: ['note', 'Đã được người khác xử lý', 'Anh Tâm đã duyệt lúc 07:09. Nội dung đã gửi: "' + x.draft.slice(0, 80) + '…"'],
        expired: ['note--warn', 'Link đã hết hạn', 'Link duyệt hết hạn theo SLA (tối đa 24 giờ). Mở Hàng duyệt để xử lý.'],
        error: ['note--bad', 'Gửi không thành công', 'Kênh Zalo OA không phản hồi. Nháp vẫn ở hàng duyệt.']
      }[st];
      h += '<div class="note ' + msg[0] + '" role="status"><b>' + msg[1] + '</b><p>' + msg[2] + '</p></div>' + (st === 'error' ? '<button type="button" class="btn btn--go" data-act="d-state" data-arg="cho">Thử lại</button>' : '<a class="btn" href="#/approvals">Mở Hàng duyệt</a>');
    }
    h += '</main>' + (bar ? '<div class="mbar">' + bar + '</div>' : '<div></div>') + '</div>';
    h += '<div class="demo-state" style="max-width:448px;margin-inline:auto"><label class="field">Xem trạng thái khác (chỉ có trong demo)<select class="sel" data-in="dstate">' + [['cho', 'Đang chờ'], ['stale', 'Đã cũ: khách nhắn thêm'], ['other', 'Đã được người khác xử lý'], ['expired', 'Link hết hạn'], ['error', 'Lỗi gửi']].map(function (o) { return '<option value="' + o[0] + '"' + (st === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label><a href="#/home">Về dashboard</a></div>';
    return h;
  }
  function pageStop(code) {
    var done = S.stopDone;
    var h = '<div class="mpage"><header class="mpage__h">' + ic('stop') + '<b>Dừng khẩn từ cảnh báo P1</b></header><main class="mpage__b" id="main">';
    if (done) h += '<div class="note note--bad" role="status"><b>■ K1 tại CS Biên Hòa đã tắt khẩn</b><p>Hội thoại chuyển người. BGĐ và admin đã nhận tin Zalo.</p></div><a class="btn" href="#/incidents">Mở Sự cố</a>';
    else h += '<p>Cảnh báo <span class="mono">' + esc(code || 'P1') + '</span>: K1 tại CS Biên Hòa gửi 3 báo giá lệch KB trong 10 phút.</p><label class="field">Gõ <span class="mono">K1</span> để xác nhận<input class="input" id="sConf" autocomplete="off"></label><label class="field">Lý do<textarea class="input" id="sWhy" rows="3"></textarea></label><p class="err" id="sErr" role="alert"></p>';
    h += '</main>' + (done ? '<div></div>' : '<div class="mbar"><a class="btn" href="#/home">Hủy</a><button type="button" class="btn btn--danger" data-act="stop-mobile">Dừng ngay</button></div>') + '</div>';
    return h;
  }

  /* -------------------------------------------------------------- dialog -- */
  var DLG = null;
  function openDlg(html, onSubmit) {
    var d = $('#dlg');
    d.innerHTML = '<form class="dlg" data-form="dlg">' + html + '<p class="err" id="dlgErr" role="alert"></p><div class="acts"><button type="button" class="btn" data-act="dlg-close">Hủy</button>' + (onSubmit ? '<button type="submit" class="btn btn--go" id="dlgOk">Xác nhận</button>' : '') + '</div></form>';
    DLG = { onSubmit: onSubmit, back: document.activeElement };
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
    var f = d.querySelector('input:not([type=hidden]):not([disabled]), textarea, select'); if (f) f.focus();
  }
  function closeDlg() { var d = $('#dlg'); if (d.open) d.close(); if (DLG && DLG.back && document.contains(DLG.back)) DLG.back.focus(); DLG = null; }
  function dlgErr(m) { $('#dlgErr').textContent = m; }

  function stopDialog() {
    var scopes = [['flow', 'Một luồng tại cơ sở đang chọn: K1 tại ' + brName(S.cs === 'all' ? 'bh' : S.cs), 'K1'], ['agent', 'Một agent tại mọi cơ sở: K1 tại 3 cơ sở', 'K1'], ['all', 'Toàn hệ thống (15 agent)', 'TOÀN HỆ THỐNG']];
    openDlg('<h2>⛔ Dừng khẩn</h2><p class="muted">Luồng bị dừng chuyển mọi hội thoại cho người. Hệ thống tạo sự cố P1 và báo BGĐ, admin qua Zalo.</p>' +
      '<label class="field">Phạm vi<select class="sel" id="stScope">' + scopes.map(function (s) { return '<option value="' + s[0] + '" data-w="' + s[2] + '">' + s[1] + '</option>'; }).join('') + '</select></label>' +
      '<label class="field">Gõ tên phạm vi để xác nhận <small id="stWordHint">(gõ: K1)</small><input id="stWord" autocomplete="off" spellcheck="false"></label><label class="field">Lý do (bắt buộc)<textarea id="stWhy" rows="2"></textarea></label>',
      function () {
        var sel = $('#stScope'), w = sel.options[sel.selectedIndex].getAttribute('data-w');
        if ($('#stWord').value.trim().toUpperCase() !== w) return dlgErr('Gõ đúng "' + w + '" để xác nhận.');
        if (!$('#stWhy').value.trim()) return dlgErr('Cần ghi lý do.');
        var v = sel.value, br = S.cs === 'all' ? 'bh' : S.cs;
        S.stopped = { scope: v === 'all' ? 'all' : 'agent', code: 'K1', br: v === 'flow' ? br : 'all', label: v === 'all' ? 'Toàn hệ thống' : v === 'flow' ? 'K1 tại ' + brName(br) : 'K1 tại 3 cơ sở', reason: $('#stWhy').value.trim(), by: me() };
        S.incidents.unshift({ id: 'P1-0611', lv: 'P1', state: 'Mở', title: 'Dừng khẩn: ' + S.stopped.label, at: 'vừa xong', flows: v === 'all' ? ['Tất cả'] : ['K1'], br: v === 'flow' ? br : 'all', by: me() });
        audit(me(), 'Dừng khẩn: ' + S.stopped.label + ' (lý do: ' + S.stopped.reason + ')', S.stopped.br);
        closeDlg(); render(); toast('Đã dừng khẩn ' + S.stopped.label + '. Sự cố P1 đã tạo.');
      });
    $('#stScope').addEventListener('change', function () { var s = this.options[this.selectedIndex]; $('#stWordHint').textContent = '(gõ: ' + s.getAttribute('data-w') + ')'; });
  }
  function unstop() {
    if (!can.admin()) return;
    openDlg('<h2>Bật lại ' + esc(S.stopped.label) + '</h2><label class="field">Ghi chú (bắt buộc)<textarea id="unWhy" rows="2"></textarea></label>', function () {
      if (!$('#unWhy').value.trim()) return dlgErr('Cần ghi chú khi bật lại.');
      audit(me(), 'Bật lại sau dừng khẩn: ' + S.stopped.label + ' · ' + $('#unWhy').value.trim(), S.stopped.br);
      S.incidents.forEach(function (i) { if (i.lv === 'P1') i.state = 'Đóng'; });
      S.stopped = null; closeDlg(); render(); toast('Đã bật lại. Sự cố P1 đóng.');
    });
  }
  function publishDialog(code) {
    var brs = S.role === 'kd' ? ['bh'] : ['td', 'gv', 'bh'];
    openDlg('<h2>Phát hành ' + code + ' · Nháp v5</h2><div class="note diff" style="font-size:13px">So với live v3: giờ hoạt động <del>7h–21h</del> → <ins>24/7</ins> · hạn duyệt <del>15</del> → <ins>30 phút</ins> · <ins>+ khối X</ins></div>' +
      '<fieldset class="fs"><legend>Cơ sở</legend>' + brs.map(function (b) { return '<label class="check"><input type="checkbox" name="pb" value="' + b + '"' + (b === 'bh' ? ' checked' : '') + '> ' + brName(b) + '</label>'; }).join('') + (S.role === 'kd' ? '<span class="why">Trưởng BP chỉ thấy cơ sở được giao.</span>' : '') + '</fieldset>' +
      '<fieldset class="fs"><legend>Chế độ</legend><label class="check"><input type="radio" name="pm" value="shadow" checked> Shadow (mặc định, chạy song song, không gửi)</label><label class="check"><input type="radio" name="pm" value="live" disabled> Live ngay</label><span class="why">Live ngay chỉ dành cho admin và chỉ khi thay đổi là tham số không rủi ro. Bản này có thêm khối nên phải qua shadow.</span></fieldset>' +
      '<label class="field">Ghi chú (bắt buộc)<textarea id="pNote" rows="2"></textarea></label>', function () {
        var b = $$('input[name=pb]:checked').map(function (i) { return i.value; });
        if (!b.length) return dlgErr('Chọn ít nhất một cơ sở.');
        if (!$('#pNote').value.trim()) return dlgErr('Cần ghi chú phát hành.');
        cfgOf(code).published = true;
        audit(me(), 'Phát hành ' + code + ' v5 → shadow tại ' + b.map(function (x) { return T.branch(x).short; }).join(', ') + ' · ' + $('#pNote').value.trim(), b.length > 1 ? 'all' : b[0]);
        closeDlg(); render(); toast(code + ' v5 đang shadow. Đủ 24 giờ và 50 lượt sẽ hiện nút Chuyển Live.');
      });
  }
  function rollbackDialog(code, v) {
    openDlg('<h2>Quay về ' + v + '?</h2><p>Có hiệu lực từ lượt chạy kế tiếp tại: <b>' + (S.cs === 'all' ? 'Thủ Đức, Gò Vấp, Biên Hòa' : brName(S.cs)) + '</b>. Thao tác được ghi nhật ký.</p>', function () {
      audit(me(), 'Rollback ' + code + ' về ' + v, S.cs); closeDlg(); render(); toast('Đã quay về ' + v + '.');
    });
  }
  function kbDialog(id) {
    var k = S.kb.filter(function (x) { return x.id === id; })[0];
    openDlg('<h2>Sửa: ' + esc(k.topic) + '</h2><p class="muted">' + (k.scope === 'all' ? 'Chung' : brName(k.scope) + ' ghi đè') + ' · ' + esc(k.kind) + '</p><label class="field">Nội dung<textarea id="kbText" rows="4">' + esc(k.text) + '</textarea></label>' +
      (k.kind === 'Giá/ưu đãi' ? '<div class="note note--warn">Thay đổi này ảnh hưởng <b>K1, K7</b> tại <b>' + (k.scope === 'all' ? 'mọi cơ sở không có bản ghi đè' : brName(k.scope)) + '</b>.</div><label class="check"><input type="checkbox" checked disabled> Chạy lại ca eval bắt buộc (không tắt được với loại giá/ưu đãi)</label>' : ''), function () {
        k.text = $('#kbText').value.trim();
        audit(me(), 'Sửa KB "' + k.topic + '"' + (k.kind === 'Giá/ưu đãi' ? ' · chạy lại ca eval bắt buộc K1, K7' : ''), k.scope);
        closeDlg(); render(); toast(k.kind === 'Giá/ưu đãi' ? 'Đã lưu. Eval bắt buộc K1, K7 đang chạy lại; kết quả hiện trong Việc của tôi.' : 'Đã lưu tài liệu.');
      });
  }
  function reasonDialog(title, label, done) {
    openDlg('<h2>' + title + '</h2><label class="field">' + label + '<textarea id="rWhy" rows="2"></textarea></label>', function () {
      var v = $('#rWhy').value.trim(); if (!v) return dlgErr('Cần ghi lý do.');
      done(v); closeDlg(); render();
    });
  }

  /* -------------------------------------------------------------- render -- */
  var root = $('#root');
  function focusKey(el) { if (!el || el === document.body) return null; return el.id ? '#' + el.id : el.getAttribute('data-act') ? '[data-act="' + el.getAttribute('data-act') + '"]' + (el.getAttribute('data-arg') ? '[data-arg="' + el.getAttribute('data-arg') + '"]' : '') : null; }
  function render(navigated) {
    var r = route();
    var key = navigated ? null : focusKey(document.activeElement);
    if (r.name === 'd' || r.name === 'stop') {
      document.title = (r.name === 'd' ? 'Duyệt nháp ' + (r.a || '') : 'Dừng khẩn') + ' · Trạm';
      root.innerHTML = '<a class="skip" href="#main">Bỏ qua tới nội dung</a>' + (r.name === 'd' ? pageD(r.a) : pageStop(r.a));
      restore(key, navigated); return;
    }
    var title = TITLES[r.name] || 'Trang chủ', content;
    if (r.name === 'home') title = S.role === 'bgd' ? 'Tổng quan' : S.role === 'kd' ? 'Việc của tôi' : 'Sơ đồ luồng';
    if (r.name === 'agent') { var ag = agent(r.a); title = ag ? ag.code + ' · ' + ag.name : 'Agent'; }
    switch (r.name) {
      case 'flow': content = vFlow(); break;
      case 'incidents': content = vIncidents(); break;
      case 'approvals': content = vApprovals(r.a); break;
      case 'inbox': content = vInbox(r.a); break;
      case 'agent': content = vAgent(r.a, r.b); break;
      case 'kb': content = vKb(); break;
      case 'budget': content = vBudget(); break;
      case 'connections': content = can.admin() ? vConnections() : vNoPerm('Kết nối'); break;
      case 'quality': content = vQuality(); break;
      case 'audit': content = vAudit(); break;
      case 'users': content = can.admin() ? vUsers() : vNoPerm('Người dùng & quyền'); break;
      default: content = vHome();
    }
    document.title = title + ' · Trạm';
    root.innerHTML = '<a class="skip" href="#main">Bỏ qua tới nội dung</a><div class="app"><aside class="rail" id="rail" aria-label="Menu">' + rail(r) + '</aside><div class="main"><header class="top">' + topbar(title, r) + '</header>' + stopBanner() + '<main class="view" id="main" tabindex="-1">' + content + '</main></div></div><div class="scrim" hidden data-act="nav-close"></div>';
    if (r.name === 'flow' || (r.name === 'home' && S.role === 'admin')) requestAnimationFrame(drawLinks);
    if (POP === 'search') { var si = $('#searchIn'); if (si) si.focus(); }
    restore(key, navigated);
  }
  function restore(key, navigated) {
    if (navigated) { var h = $('#pageTitle') || $('#main'); if (h) h.focus({ preventScroll: true }); return; }
    if (key) { var el = null; try { el = $(key); } catch (e) { el = null; } if (el) el.focus({ preventScroll: true }); }
  }
  function skeleton() {
    var m = $('#main'); if (!m || reduce) return false;
    m.innerHTML = '<div class="kpis">' + '<div class="sk" style="height:84px"></div>'.repeat(4) + '</div><div class="sk" style="height:280px"></div>';
    return true;
  }

  /* -------------------------------------------------------------- events -- */
  function curApproval() { var d = $('#qd'); return d ? d.getAttribute('data-id') : null; }
  function findAp(id) { return S.approvals.filter(function (x) { return x.id === id; })[0]; }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]');
    if (POP && !e.target.closest('.pop') && !(t && t.getAttribute('data-act') === 'pop')) { POP = null; if (!t) { render(); return; } }
    if (S.menu && !e.target.closest('.menu') && !(t && t.getAttribute('data-act') === 'fmenu')) { S.menu = null; if (!t) { render(); return; } }
    if (!t || t.disabled || t.getAttribute('aria-disabled') === 'true') return;
    var act = t.getAttribute('data-act'), arg = t.getAttribute('data-arg');
    if (t.tagName === 'INPUT') { if (act === 'perm') toast('Đã ' + (t.checked ? 'cấp' : 'thu hồi') + ' quyền Nâng cao. Ghi nhật ký.'); return; }
    var x, c;
    switch (act) {
      case 'navgrp': S.open[arg] = !S.open[arg]; render(); break;
      case 'nav-open': $('#rail').classList.add('is-open'); $('.scrim').hidden = false; t.setAttribute('aria-expanded', 'true'); var fa = $('#rail a'); if (fa) fa.focus(); break;
      case 'nav-close': $('#rail').classList.remove('is-open'); $('.scrim').hidden = true; break;
      case 'pop': POP = POP === arg ? null : arg; render(); break;
      case 'role': S.role = arg; if (arg === 'kd') S.cs = 'bh'; POP = null; syncUrl(); go('#/home'); break;
      case 'theme': S.theme = arg; try { localStorage.setItem('tram-theme', arg); } catch (er) { /* bỏ qua */ } applyTheme(); POP = null; render(); break;
      case 'href': POP = null; S.menu = null; if (arg.charAt(0) === '#') go(arg); else location.href = arg; break;
      case 'stop-open': stopDialog(); break;
      case 'unstop': unstop(); break;
      case 'dismiss-carry': CARRIED = null; render(); break;
      case 'faq': S.faq[+arg].done = true; audit(me(), 'Tạo nháp FAQ từ gợi ý: ' + S.faq[+arg].q, S.cs); render(); toast('Đã tạo nháp FAQ trong Kho tri thức.'); break;
      case 'zoom':
        if (arg === 'in') S.zoom = Math.min(1.3, S.zoom + 0.1);
        else if (arg === 'out') S.zoom = Math.max(0.5, S.zoom - 0.1);
        else { var cv = $('#canvas'), ci = $('#cinner'); S.zoom = Math.min(1, (cv.clientWidth - 20) / (ci.scrollWidth)); }
        render(); break;
      case 'fsel': S.flowSel = arg; S.flowTab = 'luong'; render(); break;
      case 'fmenu': S.menu = S.menu === arg ? null : arg; render(); break;
      case 'ftab': S.flowTab = arg; render(); break;
      case 'frun': S.menu = null; audit(me(), 'Chạy ngay ' + arg + ' (thủ công)', S.cs); render(); toast('Đã xếp ' + arg + ' chạy ngay.'); break;
      case 'fmode':
        S.menu = null;
        if (S.cs === 'all') { render(); toast('Chọn một cơ sở ở thanh trên trước khi đổi chế độ.'); break; }
        x = agent(arg); var from = x.st[S.cs]; x.st[S.cs] = from === 'shadow' ? 'live' : 'shadow';
        audit(me(), 'Chuyển ' + arg + ' sang ' + T.STATUS[x.st[S.cs]].label + ' tại ' + brName(S.cs), S.cs); render(); toast(arg + ' tại ' + brName(S.cs) + ': ' + T.STATUS[x.st[S.cs]].label); break;
      case 'foff':
        S.menu = null; x = agent(arg);
        openDlg('<h2>Tắt ' + arg + (S.cs === 'all' ? ' tại mọi cơ sở' : ' tại ' + brName(S.cs)) + '?</h2><p class="muted">Hội thoại chuyển người. Có thể bật lại từ menu ⋯.</p>', function () {
          (S.cs === 'all' ? ['td', 'gv', 'bh'] : [S.cs]).forEach(function (b) { x.st[b] = 'off'; });
          audit(me(), 'Tắt ' + arg + (S.cs === 'all' ? ' (mọi cơ sở)' : ' tại ' + brName(S.cs)), S.cs); closeDlg(); render(); toast('Đã tắt ' + arg + '.');
        }); break;
      case 'q-mode': S.mode[curApproval()] = arg; S.editText = null; render(); if (arg === 'edit') { var qe = $('#qEdit'); if (qe) qe.focus(); } break;
      case 'q-usekb': x = findAp(arg); S.editText = x.fixed; render(); $('#qEdit').focus(); break;
      case 'q-fresh': x = findAp(arg); x.stale = false; x.ctx += '\nKhách nhắn thêm: "Vậy thi rớt thì sao em?"'; x.draft = 'Dạ trung tâm không cam kết bao đậu ạ. Nếu chưa đạt, anh/chị được thi lại theo lịch của Sở và trung tâm hỗ trợ ôn thêm miễn phí.'; render(); break;
      case 'q-approve': x = findAp(arg); audit(me(), 'Duyệt nháp #' + arg + ' (' + x.agent + ')', x.branch); qRemove(arg, 'Đã gửi · hoàn tác trong 10 giây', true); break;
      case 'q-send':
        x = findAp(arg); var txt = $('#qEdit').value.trim(); if (!txt) { toast('Nội dung trống.'); break; }
        audit(me(), 'Sửa rồi gửi nháp #' + arg + ($('#qEval').checked ? ', thêm ca eval' : ''), x.branch);
        if ($('#qEval').checked) S.evalCases.unshift({ id: 'ec-' + arg, from: 'Nháp #' + arg + ' bị sửa (vừa xong)', text: x.kind + ': dùng nội dung đã sửa', st: 'chờ' });
        qRemove(arg, 'Đã gửi bản đã sửa'); break;
      case 'q-reject':
        x = findAp(arg); c = $('input[name=qrj]:checked');
        if (!c) { toast('Chọn lý do từ chối.'); var r1 = $('input[name=qrj]'); if (r1) r1.focus(); break; }
        var nx = $('input[name=qnext]:checked').value;
        audit(me(), 'Từ chối nháp #' + arg + ' (lý do: ' + c.value + ')' + (nx === 'staff' ? ' → chuyển nhân viên' : ' · không gửi'), x.branch);
        qRemove(arg, 'Đã từ chối' + (nx === 'staff' ? ', chuyển nhân viên trả lời' : '')); break;
      case 'q-transfer': x = findAp(arg); audit(me(), 'Chuyển nháp #' + arg + ' cho ' + $('#qTo').value, x.branch); qRemove(arg, 'Đã chuyển cho ' + $('#qTo').value.split(' · ')[0]); break;
      case 'takeover': case 'giveback':
        c = S.convs.filter(function (v) { return v.id === arg; })[0];
        c.state = act === 'takeover' ? 'human' : 'ai';
        c.msgs.push({ a: 'sys', t: act === 'takeover' ? me() + ' tiếp quản · AI tạm dừng trong hội thoại này' : 'Trả lại AI · K1 tiếp tục trả lời' });
        audit(me(), (act === 'takeover' ? 'Tiếp quản' : 'Trả lại AI') + ' hội thoại ' + c.name, c.branch); render(); break;
      case 'flag':
        var p = arg.split(':'); c = S.convs.filter(function (v) { return v.id === p[0]; })[0]; c.msgs[+p[1]].flag = true;
        S.evalCases.unshift({ id: 'ec-f' + Date.now(), from: 'Đánh dấu sai trong Hộp thư', text: 'Câu trả lời cho ' + c.name + ' cần sửa', st: 'chờ' });
        audit(me(), 'Đánh dấu câu trả lời AI sai · ' + c.name, c.branch); render(); toast('Đã đánh dấu sai. Ca eval mới chờ xác nhận ở Chất lượng.'); break;
      case 'cfgmode': if (arg === 'adv' && !can.admin()) break; cfgOf(route().a).mode = arg; render(); break;
      case 'blk':
        c = cfgOf(route().a); p = arg.split(':'); var i = +p[1], ch = c.chain;
        if (p[0] === 'up') { var u = ch[i - 1]; if (BLOCKS[u][3]) { toast('Không vượt qua khối khóa.'); break; } ch[i - 1] = ch[i]; ch[i] = u; }
        if (p[0] === 'down') { var dn = ch[i + 1]; if (BLOCKS[dn][3]) { toast('Không vượt qua khối khóa.'); break; } ch[i + 1] = ch[i]; ch[i] = dn; }
        if (p[0] === 'del') ch.splice(i, 1);
        if (p[0] === 'add') ch.splice(ch.indexOf('S'), 0, $('#addBlk').value);
        c.tested = false; c.evalOk = false; render(); break;
      case 'cfg-save': cfgOf(arg).saved = true; audit(me(), 'Lưu nháp v5 của ' + arg, S.cs); render(); toast('Đã lưu Nháp v5.'); break;
      case 'cfg-test': c = cfgOf(arg); c.tested = true; c.evalOk = true; audit(me(), 'Chạy thử ' + arg + ' v5 (dry-run) · eval 24/24, 88%', S.cs); render(); toast('Chạy thử xong. Eval đạt, có thể phát hành.'); break;
      case 'pub-open': publishDialog(arg); break;
      case 'rollback': p = arg.split(':'); rollbackDialog(p[0], p[1]); break;
      case 'run': S.runSel = +arg; S.raw = false; render(); break;
      case 'raw': reasonDialog('Xem bản gốc (PII)', 'Lý do (bắt buộc, ghi nhật ký)', function (v) { S.raw = true; audit(me(), 'Xem bản gốc PII lượt chạy (lý do: ' + v + ')', S.cs); }); break;
      case 'kbtab': S.kbTab = arg; render(); break;
      case 'kb-edit': kbDialog(arg); break;
      case 'raise': reasonDialog('Nâng trần tháng này · ' + arg, 'Lý do (bắt buộc)', function (v) { x = agent(arg); x.budget = Math.round(x.budget * 1.2); audit(me(), 'Nâng trần ' + arg + ' lên ' + vnd(x.budget) + 'đ (lý do: ' + v + ')', S.cs); toast('Đã nâng trần ' + arg + ' thêm 20%.'); }); break;
      case 'conn-test': S.connErr = arg === 'conn:meta-gv'; render(); toast(arg === 'conn:meta-gv' ? 'Meta trả lỗi 190: token hết hạn.' : 'Kết nối hoạt động.'); break;
      case 'conn-retry': S.connErr = false; render(); break;
      case 'grade': p = arg.split(':'); S.sample.forEach(function (s) { if (s.id === p[0]) s.v = p[1]; }); render(); break;
      case 'ec-ok': S.evalCases.forEach(function (e2) { if (e2.id === arg) e2.st = 'ok'; }); audit(me(), 'Xác nhận ca eval bắt buộc mới', S.cs); render(); break;
      case 'csv':
        var rows = [['Giờ', 'Ai', 'Hành động', 'Cơ sở', 'Kênh']].concat(S.audit.map(function (r) { return [r.t, r.who, r.what, brName(r.br), r.ch]; }));
        var blob = new Blob(['﻿' + rows.map(function (r) { return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(','); }).join('\n')], { type: 'text/csv' });
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'nhat-ky-tram.csv'; document.body.appendChild(a); a.click(); a.remove(); break;
      case 'd-mode': S.dMode = arg; render(); var de = $('#dEdit'); if (de) de.focus(); break;
      case 'd-usekb': S.dText = T.HELD.fixed; render(); $('#dEdit').focus(); break;
      case 'd-state': S.dState = arg; S.dMode = 'view'; render(); break;
      case 'd-done':
        if (arg === 'tuchoi' && !$('input[name=drj]:checked')) { $('#dErr').textContent = 'Chọn lý do từ chối.'; break; }
        S.dState = arg; S.dMode = 'view'; S.approvals = S.approvals.filter(function (z) { return z.id !== (route().a || '8KX2'); });
        audit(me(), { duyet: 'Duyệt', sua: 'Sửa rồi gửi', tuchoi: 'Từ chối' }[arg] + ' nháp #' + (route().a || '8KX2'), 'bh', 'zalo_link'); render(); break;
      case 'stop-mobile':
        if ($('#sConf').value.trim().toUpperCase() !== 'K1') { $('#sErr').textContent = 'Gõ đúng "K1" để xác nhận.'; break; }
        if (!$('#sWhy').value.trim()) { $('#sErr').textContent = 'Cần ghi lý do.'; break; }
        S.stopped = { scope: 'agent', code: 'K1', br: 'bh', label: 'K1 tại CS Biên Hòa', reason: $('#sWhy').value.trim(), by: me() };
        S.incidents.unshift({ id: 'P1-0611', lv: 'P1', state: 'Mở', title: 'Dừng khẩn: K1 tại CS Biên Hòa', at: 'vừa xong', flows: ['K1'], br: 'bh', by: me() });
        audit(me(), 'Dừng khẩn K1 tại CS Biên Hòa từ link Zalo', 'bh', 'zalo_link'); S.stopDone = true; render(); break;
      case 'dlg-close': closeDlg(); break;
    }
  });
  document.addEventListener('change', function (e) {
    var t = e.target, k = t.getAttribute && t.getAttribute('data-in'); if (!k) return;
    if (k === 'cs') { S.cs = t.value; syncUrl(); render(); }
    if (k === 'qf-risk' || k === 'qf-agent') { S.qf = S.qf || { risk: '', agent: '' }; S.qf[k.slice(3)] = t.value; render(); }
    if (k === 'dstate') { S.dState = t.value; S.dMode = 'view'; render(); }
    if (k === 'cfg-hours') cfgOf(route().a).hours = t.value;
    if (k === 'cfg-risk') cfgOf(route().a).maxRisk = t.value;
  });
  document.addEventListener('input', function (e) {
    var k = e.target.getAttribute && e.target.getAttribute('data-in');
    if (k === 'search') $('#searchRes').innerHTML = searchResults(e.target.value);
    if (k === 'af') { S.af = e.target.value; var pos = e.target.selectionStart; render(); var f = $('#af'); f.focus(); f.setSelectionRange(pos, pos); }
  });
  document.addEventListener('submit', function (e) {
    var f = e.target, k = f.getAttribute('data-form'); if (!k) return;
    e.preventDefault();
    if (k === 'dlg' && DLG && DLG.onSubmit) DLG.onSubmit(f);
    if (k === 'say') {
      var c = S.convs.filter(function (v) { return v.id === f.getAttribute('data-arg'); })[0], v = $('#say').value.trim(); if (!v) return;
      if (c.state === 'ai') { c.msgs.push({ a: 'c', t: v, time: 'vừa xong' }); aiReply(c, v); }
      else c.msgs.push({ a: 'staff', t: v, time: 'vừa xong' });
      render(); $('#say').focus();
    }
  });
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase(), typing = tag === 'input' || tag === 'textarea' || tag === 'select';
    if (e.key === 'Escape') {
      if (POP || S.menu) { POP = null; S.menu = null; render(); }
      var rl = $('#rail'); if (rl && rl.classList.contains('is-open')) { rl.classList.remove('is-open'); $('.scrim').hidden = true; var mb = $('.menu-btn'); if (mb) mb.focus(); }
      return;
    }
    if (typing || e.metaKey || e.ctrlKey || e.altKey || $('#dlg').open) return;
    if (e.key === '/') { e.preventDefault(); POP = 'search'; render(); return; }
    var r = route(); if (r.name !== 'approvals') return;
    var list = approvalsScoped(), cur = curApproval(), idx = list.map(function (x) { return x.id; }).indexOf(cur);
    var key = e.key.toLowerCase();
    if (key === 'j' || key === 'k') { var n = list[Math.max(0, Math.min(list.length - 1, idx + (key === 'j' ? 1 : -1)))]; if (n) go('#/approvals/' + n.id); }
    if (cur && (S.mode[cur] || 'view') === 'view') {
      var b = key === 'a' ? $('[data-act="q-approve"]') : key === 'e' ? $('[data-act="q-mode"][data-arg="edit"]') : key === 'r' ? $('[data-act="q-mode"][data-arg="reject"]') : null;
      if (b && !b.disabled) { e.preventDefault(); b.click(); }
    }
  });
  window.addEventListener('hashchange', function () {
    POP = null; S.menu = null; S.runSel = null; S.raw = false;
    var r = route();
    if (r.name !== 'd' && r.name !== 'stop' && skeleton()) { setTimeout(function () { render(true); }, 160); } else render(true);
    window.scrollTo(0, 0);
  });
  addEventListener('resize', function () { requestAnimationFrame(drawLinks); });
  small.addEventListener && small.addEventListener('change', function () { render(); });

  syncUrl();
  render();
})();
