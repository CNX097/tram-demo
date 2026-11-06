/* Trạm · DỮ LIỆU MẪU dùng chung cho index.html (trang cuộn) và app.html (app).
   Lấy lại từ demo/agent-control.html: cơ sở, tên agent, ngân sách, số lượt, KPI.
   Mọi con số ở đây là số liệu mẫu để trình bày thiết kế, không phải số thật. */
(function (g) {
  'use strict';

  var BRANCHES = [
    { id: 'all', name: 'Toàn chuỗi', short: 'Chuỗi' },
    { id: 'td', name: 'CS Thủ Đức', short: 'TĐ' },
    { id: 'gv', name: 'CS Gò Vấp', short: 'GV' },
    { id: 'bh', name: 'CS Biên Hòa', short: 'BH' }
  ];

  var ROLES = {
    bgd:   { id: 'bgd', name: 'Ban giám đốc', person: 'Anh Quang', home: 'home' },
    kd:    { id: 'kd', name: 'Trưởng BP Kinh doanh', person: 'Chị Lan', home: 'home', dept: 'kd', branches: ['bh'] },
    admin: { id: 'admin', name: 'Admin kỹ thuật', person: 'Minh', home: 'flow' }
  };

  /* status theo cơ sở: live | shadow | draft | off | error | fallback | plan */
  function A(code, name, dept, phase, model, budget, spent, runs, st, kpi, risk, mode, lastRun, errors) {
    return { code: code, name: name, dept: dept, phase: phase, model: model, budget: budget, spent: spent,
      runs: runs, st: st, kpi: kpi, risk: risk, mode: mode, lastRun: lastRun, errors: errors || 0 };
  }
  var AGENTS = [
    A('K1', 'Trợ lý tin nhắn 24/7', 'kd', 1, 'Sonnet', 6000000, 3420000, 4812, { td: 'live', gv: 'live', bh: 'shadow' }, ['Phản hồi TB', '38 giây'], 'mid', 'Khi có tin mới', '12 giây trước', 2),
    A('K2', 'Quản lý khách hàng (CRM)', 'kd', 1, 'Haiku', 1500000, 610000, 3920, { td: 'live', gv: 'live', bh: 'live' }, ['Lead có SĐT', '96%'], 'low', 'Khi kết thúc hội thoại', '2 phút trước'),
    A('K3', 'Chấm chất lượng tư vấn', 'kd', 2, 'Opus (batch)', 3000000, 0, 0, { td: 'plan', gv: 'plan', bh: 'plan' }, ['Điểm TB', null], 'low', 'Thứ Hai 08:00', null),
    A('K4', 'Sản xuất nội dung có AI', 'kd', 1, 'Sonnet', 2000000, 880000, 214, { td: 'live', gv: 'shadow', bh: 'off' }, ['Nội dung/tuần', '23'], 'high', 'Theo yêu cầu', '1 giờ trước'),
    A('K5', 'Báo cáo quảng cáo tự động', 'kd', 1, 'Haiku', 500000, 145000, 93, { td: 'live', gv: 'fallback', bh: 'live' }, ['CPA thực', '1,42 tr'], 'low', 'Hằng ngày 07:00', '2 giờ trước', 1),
    A('K6', 'Cổng cộng tác viên', 'kd', 2, 'Haiku', 800000, 0, 0, { td: 'plan', gv: 'plan', bh: 'plan' }, ['Lead CTV', null], 'high', 'Khi HV đóng tiền', null),
    A('K7', 'Xin đánh giá & giới thiệu', 'kd', 1, 'Sonnet', 700000, 262000, 388, { td: 'live', gv: 'live', bh: 'shadow' }, ['Review mới/tháng', '71'], 'high', 'Khi HV nhận bằng', '40 phút trước'),
    A('V1', 'Hồ sơ số', 'vh', 2, 'Sonnet', 2500000, 0, 0, { td: 'plan', gv: 'plan', bh: 'plan' }, ['Hồ sơ đủ lần 1', null], 'high', 'Khi HV gửi ảnh', null),
    A('V2', 'Học phí tự đối soát', 'vh', 2, 'Haiku', 600000, 0, 0, { td: 'plan', gv: 'plan', bh: 'plan' }, ['Tự khớp', null], 'high', 'Khi có giao dịch', null),
    A('V3', 'Thông báo tự động', 'vh', 1, 'Mẫu cố định', 300000, 121000, 11240, { td: 'live', gv: 'live', bh: 'live' }, ['Tin đã gửi', '11.240'], 'low', 'Theo lịch', '06:30'),
    A('V4', 'Xếp lịch thực hành', 'vh', 3, 'Solver + Haiku', 2000000, 0, 0, { td: 'plan', gv: 'plan', bh: 'plan' }, ['Ca trùng', null], 'mid', 'Khi HV đặt lịch', null),
    A('V5', 'Trợ lý ôn lý thuyết', 'vh', 3, 'Haiku', 1500000, 0, 0, { td: 'plan', gv: 'plan', bh: 'plan' }, ['Đậu thi thử', null], 'low', 'Khi HV hỏi', null),
    A('V6', 'Cảnh báo HV nguy cơ trượt', 'vh', 3, 'Haiku', 500000, 0, 0, { td: 'plan', gv: 'plan', bh: 'plan' }, ['HV được cảnh báo', null], 'low', 'Hằng tuần', null),
    A('V7', 'Khảo sát hài lòng', 'vh', 2, 'Haiku', 600000, 0, 0, { td: 'plan', gv: 'plan', bh: 'plan' }, ['Phàn nàn phát hiện', null], 'mid', 'Sau mỗi giai đoạn', null),
    A('V8', 'Quản lý xe tập', 'vh', 3, 'Haiku', 400000, 0, 0, { td: 'plan', gv: 'plan', bh: 'plan' }, ['Xe quá hạn', null], 'low', 'Hằng ngày', null)
  ];

  var GROUPS = [
    ['Tiếp nhận khách', 'Tin nhắn đa kênh, CRM, chấm tư vấn', ['K1', 'K2', 'K3']],
    ['Marketing', 'Nội dung, báo cáo quảng cáo', ['K4', 'K5']],
    ['Giới thiệu & uy tín', 'Cộng tác viên, đánh giá Google', ['K6', 'K7']],
    ['Hồ sơ & học phí', 'Hồ sơ số, đối soát chuyển khoản', ['V1', 'V2']],
    ['Đào tạo', 'Thông báo, lịch thực hành, ôn thi, cảnh báo trượt', ['V3', 'V4', 'V5', 'V6']],
    ['Chất lượng & xe', 'Khảo sát hài lòng, quản lý xe tập', ['V7', 'V8']]
  ];
  var DEPS = [['K1', 'K2'], ['K2', 'K3'], ['K2', 'K5'], ['K2', 'K6'], ['V2', 'K6'], ['V5', 'V6'], ['V4', 'V6'], ['K1', 'V7']];

  var STATUS = {
    live:     { label: 'Live', sym: '●', tok: 'st-live' },
    shadow:   { label: 'Shadow', sym: '◐', tok: 'st-shadow' },
    draft:    { label: 'Nháp', sym: '○', tok: 'st-draft' },
    off:      { label: 'Tắt', sym: '–', tok: 'st-off' },
    error:    { label: 'Lỗi', sym: '✕', tok: 'st-error' },
    fallback: { label: 'Dự phòng', sym: '△', tok: 'st-fallback' },
    plan:     { label: 'Chưa triển khai', sym: '·', tok: 'st-off' },
    stopped:  { label: 'Tắt khẩn', sym: '■', tok: 'st-error' }
  };
  var RISK = {
    low:  { label: 'Thấp', sym: '▽', tok: 'risk-low' },
    mid:  { label: 'TB', sym: '◇', tok: 'risk-mid' },
    high: { label: 'Cao', sym: '▲', tok: 'risk-high' }
  };

  var KB = [
    { id: 'kb1', topic: 'Học phí hạng B (số tự động)', kind: 'Giá/ưu đãi', scope: 'all', text: 'Học phí trọn gói hạng B số tự động: 18.500.000đ, đóng 3 đợt.', price: 18500000, valid: '01/10/2026' },
    { id: 'kb1-bh', topic: 'Học phí hạng B (số tự động)', kind: 'Giá/ưu đãi', scope: 'bh', text: 'Tại CS Biên Hòa, học phí hạng B số tự động: 17.900.000đ, đóng 3 đợt.', price: 17900000, valid: '15/10/2026' },
    { id: 'kb2', topic: 'Hồ sơ đăng ký', kind: 'Quy trình', scope: 'all', text: 'CCCD bản gốc để chụp, 4 ảnh 3x4 nền xanh, giấy khám sức khỏe lái xe. Trung tâm hỗ trợ khám tại chỗ.', valid: '01/09/2026' },
    { id: 'kb3', topic: 'Lịch khai giảng', kind: 'FAQ', scope: 'all', text: 'Khóa hạng B tiếp theo khai giảng 18/11/2026 và 02/12/2026.', valid: '01/11/2026' },
    { id: 'kb4-td', topic: 'Địa chỉ', kind: 'FAQ', scope: 'td', text: 'CS Thủ Đức: 120 Võ Văn Ngân, TP Thủ Đức. Mở cửa 7h–20h.', valid: '01/01/2026' },
    { id: 'kb4-gv', topic: 'Địa chỉ', kind: 'FAQ', scope: 'gv', text: 'CS Gò Vấp: 45 Phan Văn Trị, Gò Vấp. Mở cửa 7h–20h.', valid: '01/01/2026' },
    { id: 'kb4-bh', topic: 'Địa chỉ', kind: 'FAQ', scope: 'bh', text: 'CS Biên Hòa: 88 Đồng Khởi, Biên Hòa. Mở cửa 7h30–19h.', valid: '01/01/2026' },
    { id: 'kb5', topic: 'Ưu đãi tháng 11', kind: 'Giá/ưu đãi', scope: 'all', text: 'Tháng 11: giảm 500.000đ/người khi đăng ký nhóm từ 2 người.', discount: 500000, valid: '01/11/2026', validTo: '30/11/2026' }
  ];

  /* Ca đêm 02:14 tại CS Biên Hòa: tin vào và cách K1 xử lý (dùng cho hero) */
  var NIGHT = [
    { t: '02:09', who: 'Trần M. Khoa', chan: 'Fanpage', q: 'Khi nào khai giảng khóa mới vậy?', a: 'Dạ khóa hạng B tiếp theo khai giảng 18/11 và 02/12 ạ.', risk: 'low', kb: 'kb3', ms: 31 },
    { t: '02:11', who: 'Phạm T. Hồng', chan: 'Zalo', q: 'Trung tâm Biên Hòa ở đường nào em?', a: 'Dạ 88 Đồng Khởi, Biên Hòa, mở cửa 7h30 đến 19h ạ.', risk: 'low', kb: 'kb4-bh', ms: 24 },
    { t: '02:13', who: 'Võ Q. Bảo', chan: 'TikTok', q: 'Hồ sơ cần những gì?', a: 'Dạ gồm CCCD, 4 ảnh 3x4 nền xanh và giấy khám sức khỏe ạ.', risk: 'low', kb: 'kb2', ms: 42 },
    { t: '02:14', who: 'Lê T. Mai', chan: 'Zalo', q: 'Học bằng B số tự động bên Biên Hòa bao nhiêu? Mình đi 2 người có giảm không?', a: null, risk: 'mid', kb: 'kb1', ms: 0, held: true }
  ];

  /* Nháp bị giữ ở vạch dừng: điểm đỉnh của trang cuộn, và mục đầu hàng duyệt trong app */
  var HELD = {
    id: '8KX2', agent: 'K1', branch: 'bh', risk: 'mid', customer: 'Lê T. Mai', chan: 'Zalo', at: '02:14',
    reason: 'Số tiền không khớp KB của cơ sở',
    question: 'Học bằng B số tự động bên Biên Hòa bao nhiêu? Mình đi 2 người có giảm không?',
    holding: 'Dạ em kiểm tra lại học phí cho CS Biên Hòa và báo anh/chị trước 8h sáng nay ạ.',
    draft: 'Dạ học phí trọn gói hạng B số tự động là 18.500.000đ, đóng 3 đợt. Anh/chị đăng ký nhóm 2 người thì được giảm 500.000đ/người, còn 18.000.000đ/người ạ.',
    fixed: 'Dạ tại CS Biên Hòa, học phí trọn gói hạng B số tự động là 17.900.000đ, đóng 3 đợt. Anh/chị đăng ký nhóm 2 người thì được giảm 500.000đ/người, còn 17.400.000đ/người ạ.',
    used: 'kb1', should: 'kb1-bh', flow: 'K1 · Live v3', sla: 'trước 08:00', approver: 'Chị Lan'
  };

  var APPROVALS = [
    { id: '8KX2', agent: 'K1', branch: 'bh', risk: 'mid', kind: 'Báo giá ngoài KB cơ sở', who: 'Lê T. Mai', ctx: HELD.question, draft: HELD.draft, fixed: HELD.fixed, reason: HELD.reason, kb: ['kb1', 'kb1-bh', 'kb5'], ver: 'K1 · v3', at: '02:14', slaMin: 34, slaTotal: 360 },
    { id: '3QF7', agent: 'K7', branch: 'td', risk: 'high', kind: 'Phản hồi đánh giá Google (2★)', who: 'Phạm Q.', ctx: '"Chờ lịch thi lâu quá, không ai báo."', draft: 'Dạ trung tâm rất tiếc vì anh/chị phải chờ lâu mà không nhận được thông tin. Từ tháng 11 trung tâm đã gửi lịch sát hạch tự động qua Zalo. Mong anh/chị nhắn tin để em kiểm tra và báo ngày thi cụ thể ạ.', reason: 'Đăng công khai', kb: ['kb3'], ver: 'K7 · v2', at: '09:02', slaMin: 9, slaTotal: 60 },
    { id: '5MT1', agent: 'K4', branch: 'gv', risk: 'high', kind: 'Kịch bản video TikTok', who: 'Nội bộ', ctx: 'Chủ đề: 3 lỗi hay trượt bài ghép ngang', draft: '[0–3s] "Nhiều học viên trượt bài ghép ngang vì lỗi này!"\n[3–15s] Lỗi 1: đánh lái quá sớm.\n[15–30s] Lỗi 2: không canh gương.\n[30–40s] Đăng ký khóa B tháng 11, giảm 500.000đ cho nhóm 2 người.', reason: 'Nội dung công khai', kb: ['kb5'], ver: 'K4 · v1', at: '08:40', slaMin: -6, slaTotal: 120 },
    { id: '2PB9', agent: 'K1', branch: 'bh', risk: 'mid', kind: 'Trả lời ngoài kho tri thức', who: 'Đỗ V. Phúc', ctx: '"Học xong có bao đậu không em?"', draft: 'Dạ trung tâm không cam kết bao đậu ạ, nhưng có buổi thi thử miễn phí và giáo viên kèm thêm cho học viên chưa vững.', reason: 'Không có trong KB', kb: [], ver: 'K1 · v3', at: '08:15', slaMin: 22, slaTotal: 30, stale: true }
  ];

  var CONVS = [
    { id: 'c1', name: 'Lê T. Mai', chan: 'Zalo', branch: 'bh', state: 'ai', msgs: [
      { a: 'c', t: HELD.question, time: '02:14' },
      { a: 'ai', t: HELD.holding, time: '02:14', note: 'Trả lời mẫu (rủi ro thấp) · nháp báo giá chờ duyệt #8KX2' }] },
    { id: 'c2', name: 'Trần M. Khoa', chan: 'Fanpage', branch: 'gv', state: 'ai', msgs: [
      { a: 'c', t: 'Cho anh hỏi khi nào khai giảng khóa mới?', time: '07:55' },
      { a: 'ai', t: 'Dạ khóa hạng B tiếp theo khai giảng 18/11/2026 và 02/12/2026 ạ. Anh cho em xin số điện thoại để tư vấn viên giữ chỗ nhé?', time: '07:55' },
      { a: 'c', t: '09•• ••• 214', time: '07:58' }] },
    { id: 'c3', name: 'Nguyễn T. Hà', chan: 'Zalo', branch: 'td', state: 'ai', msgs: [
      { a: 'c', t: 'Chào em, học bằng B số tự động bao nhiêu tiền vậy?', time: '08:12' }] },
    { id: 'c4', name: 'Lê V. Phúc', chan: 'TikTok', branch: 'bh', state: 'human', msgs: [
      { a: 'c', t: 'Thầy dạy quát học viên quá, tôi muốn phản ánh!', time: 'Hôm qua' },
      { a: 'sys', t: 'K1 chuyển cho tư vấn viên · rủi ro cao (khiếu nại) · đã báo V7' },
      { a: 'staff', t: 'Dạ em là Thảo bên tư vấn, em xin lỗi anh về trải nghiệm này. Em gọi lại anh trong 15 phút nhé.', time: 'Hôm qua' }] }
  ];

  var AUDIT = [
    { t: '09:02', who: 'K7', what: 'Tạo nháp phản hồi đánh giá → hàng duyệt', br: 'td', ch: 'engine' },
    { t: '08:41', who: 'Minh (admin)', what: 'Sửa cấu hình K1: giờ hoạt động 24/7 (Nháp v5)', br: 'all', ch: 'web' },
    { t: '08:15', who: 'K1', what: 'Câu trả lời ngoài KB → hàng duyệt (rủi ro TB)', br: 'bh', ch: 'engine' },
    { t: '07:00', who: 'K5', what: 'Gửi báo cáo quảng cáo sáng vào nhóm Zalo "KD Toàn chuỗi"', br: 'all', ch: 'engine' },
    { t: '06:30', who: 'V3', what: 'Gửi 312 tin ZNS lịch học tuần', br: 'all', ch: 'engine' },
    { t: '02:14', who: 'K1', what: 'Giữ nháp báo giá #8KX2: số tiền không khớp KB CS Biên Hòa', br: 'bh', ch: 'engine' }
  ];

  var INCIDENTS = [
    { id: 'P2-0611', lv: 'P2', state: 'Đang xử lý', title: 'K5 tại CS Gò Vấp chạy chế độ dự phòng: Meta Ads API trả lỗi 190 (token hết hạn)', at: '07:00', flows: ['K5'], br: 'gv' },
    { id: 'P3-0611a', lv: 'P3', state: 'Mở', title: 'TikTok: quyền nhắn tin CS Biên Hòa hết hạn ngày 12/11', at: '06:00', flows: ['K1'], br: 'bh' },
    { id: 'P3-0611b', lv: 'P3', state: 'Mở', title: 'K4 đã dùng 44% ngân sách tháng sau 6 ngày, dự báo chạm trần 14/11', at: '05:00', flows: ['K4'], br: 'all' }
  ];

  var CONNECTIONS = [
    { id: 'conn:zalo-oa-td', kind: 'Zalo OA', br: 'td', st: 'ok', last: '1 phút trước', flows: ['K1', 'V3'] },
    { id: 'conn:zalo-oa-bh', kind: 'Zalo OA', br: 'bh', st: 'ok', last: '1 phút trước', flows: ['K1', 'V3'] },
    { id: 'conn:zns', kind: 'Zalo ZNS', br: 'all', st: 'ok', last: '06:30', flows: ['V3', 'K7'] },
    { id: 'conn:meta-gv', kind: 'Meta (Fanpage + Ads)', br: 'gv', st: 'bad', last: 'Hôm qua 22:10', flows: ['K1', 'K5'] },
    { id: 'conn:tiktok-bh', kind: 'TikTok Business', br: 'bh', st: 'warn', last: '3 phút trước', flows: ['K1'] }
  ];

  var KPI = [
    { k: 'Phản hồi tin đầu', v: '38 giây', target: '< 1 phút', ok: true, spark: [52, 47, 44, 41, 40, 39, 38] },
    { k: 'FAQ AI tự xử lý', v: '74%', target: '≥ 70%', ok: true, spark: [61, 64, 66, 69, 71, 73, 74] },
    { k: 'Lead có SĐT', v: '96%', target: '≥ 95%', ok: true, spark: [91, 93, 94, 95, 95, 96, 96] },
    { k: 'Tin rủi ro cao gửi chưa duyệt', v: '0', target: '= 0', ok: true, spark: [0, 0, 0, 0, 0, 0, 0] },
    { k: 'Chi phí AI / HV nhập học', v: '41.300 đ', target: '≤ 60.000 đ', ok: true, spark: [48, 46, 45, 44, 42, 42, 41] }
  ];

  var EVAL = { K1: { must: [24, 24], quality: 0.88, shadow: { runs: 31, need: 50, hours: 14, needH: 24, agree: 0.94 } } };

  function fmtVnd(n) { return n.toLocaleString('vi-VN').replace(/,/g, '.') + ' đ'; }
  function agent(c) { for (var i = 0; i < AGENTS.length; i++) if (AGENTS[i].code === c) return AGENTS[i]; return null; }
  function branch(id) { for (var i = 0; i < BRANCHES.length; i++) if (BRANCHES[i].id === id) return BRANCHES[i]; return BRANCHES[0]; }
  function kb(id) { for (var i = 0; i < KB.length; i++) if (KB[i].id === id) return KB[i]; return null; }
  /* KB hiệu lực cho một chủ đề tại một cơ sở: bản ghi đè của cơ sở thắng bản chung */
  function kbFor(topic, br) {
    var own = null, all = null;
    KB.forEach(function (r) { if (r.topic === topic) { if (r.scope === br) own = r; else if (r.scope === 'all') all = r; } });
    return own || all;
  }

  g.TRAM = { BRANCHES: BRANCHES, ROLES: ROLES, AGENTS: AGENTS, GROUPS: GROUPS, DEPS: DEPS, STATUS: STATUS, RISK: RISK,
    KB: KB, NIGHT: NIGHT, HELD: HELD, APPROVALS: APPROVALS, CONVS: CONVS, AUDIT: AUDIT, INCIDENTS: INCIDENTS,
    CONNECTIONS: CONNECTIONS, KPI: KPI, EVAL: EVAL, fmtVnd: fmtVnd, agent: agent, branch: branch, kb: kb, kbFor: kbFor };
})(window);
