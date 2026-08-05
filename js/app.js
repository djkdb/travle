/* ============================================================
   app.js — 앱 셸: 라우팅 · 탭바 · 전역 검색 · FAB · 테마 · PWA
   ============================================================ */

/* ---------- 탭 정의 ---------- */
/* primary: 하단 탭바에 노출 / 나머지는 "더보기" 시트에 표시 */
const TABS = [
  { id: 'dashboard',  label: '홈',       icon: 'home',         primary: true,  color: 'var(--blue)' },
  { id: 'schedule',   label: '일정',     icon: 'calendar',     primary: true,  color: 'var(--orange)' },
  { id: 'packing',    label: '준비물',   icon: 'shopping-bag', primary: true,  color: 'var(--blue)' },
  { id: 'companies',  label: '기업',     icon: 'building',     primary: true,  color: 'var(--indigo)' },
  { id: 'checklist',  label: '체크리스트', icon: 'check-square', color: 'var(--green)' },
  { id: 'project',    label: '프로젝트', icon: 'cpu',          color: 'var(--purple)' },
  { id: 'questions',  label: '질문',     icon: 'help-circle',  color: 'var(--purple)' },
  { id: 'english',    label: '영어',     icon: 'languages',    color: 'var(--teal)' },
  { id: 'guide',      label: '가이드',   icon: 'map',          color: 'var(--orange)' },
  { id: 'shopping',   label: '쇼핑',     icon: 'tag',          color: 'var(--pink)' },
  { id: 'budget',     label: '경비',     icon: 'wallet',       color: 'var(--green)' },
  { id: 'diary',      label: '일기',     icon: 'book-open',    color: 'var(--purple)' },
  { id: 'resources',  label: '자료실',   icon: 'folder',       color: 'var(--teal)' },
  { id: 'meetings',   label: '회의',     icon: 'users',        color: 'var(--blue)' },
  { id: 'settings',   label: '설정',     icon: 'settings',     color: 'var(--text-2)' },
];

const tabById = (id) => TABS.find((t) => t.id === id);

/* ---------- 렌더링 ---------- */

/** 현재 탭 화면을 그리고 이벤트를 바인딩한다 */
function render() {
  const view = Views[state.tab] || Views.dashboard;
  const app = $('#app');
  app.innerHTML = view.render();
  app.classList.remove('view-enter');
  void app.offsetWidth;         // reflow — 애니메이션 재시작
  app.classList.add('view-enter');

  // 헤더 갱신
  $('#headerTitle').textContent = view.title;
  $('#headerSub').textContent = view.sub;

  view.mount?.();
  renderTabbar();
}

/** 하단 탭바 */
function renderTabbar() {
  const primaries = TABS.filter((t) => t.primary);
  const isMore = !primaries.some((t) => t.id === state.tab);
  const current = tabById(state.tab);

  $('#tabbar').innerHTML = `
    ${primaries.map((t) => `
      <button class="tab-item ${state.tab === t.id ? 'active' : ''}" data-tab="${t.id}" role="tab">
        ${icon(t.icon)}<span>${t.label}</span>
      </button>`).join('')}
    <button class="tab-item ${isMore ? 'active' : ''}" id="btnMore" role="tab">
      ${icon(isMore ? current.icon : 'grid')}<span>${isMore ? current.label : '더보기'}</span>
    </button>`;

  $$('[data-tab]').forEach((el) => {
    el.onclick = () => switchTab(el.dataset.tab);
  });
  $('#btnMore').onclick = openMoreSheet;
}

/** 탭 전환 */
function switchTab(id) {
  if (!Views[id]) return;
  state.tab = id;
  save();
  closeSheet();
  closeModal();
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  render();
  haptic();
}

/** 더보기 시트 */
function openMoreSheet() {
  const rest = TABS.filter((t) => !t.primary);
  openSheet(`
    <h3>모든 메뉴</h3>
    <div class="more-grid">
      ${rest.map((t) => `
        <button class="more-cell ${state.tab === t.id ? 'active' : ''}" data-more="${t.id}">
          <span class="mc-icon" style="background:${t.color}22;color:${t.color}">${icon(t.icon)}</span>
          <span>${t.label}</span>
        </button>`).join('')}
    </div>
    <div class="section-label">${icon('search')} 빠른 이동</div>
    <div class="more-grid">
      ${TABS.filter((t) => t.primary).map((t) => `
        <button class="more-cell ${state.tab === t.id ? 'active' : ''}" data-more="${t.id}">
          <span class="mc-icon" style="background:${t.color}22;color:${t.color}">${icon(t.icon)}</span>
          <span>${t.label}</span>
        </button>`).join('')}
    </div>`);
  $$('[data-more]').forEach((el) => {
    el.onclick = () => { closeSheet(); switchTab(el.dataset.more); };
  });
}

/* ---------- 테마 ---------- */
function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = state.theme === 'dark' ? '#0a0a12' : '#eef1f7';
  const btn = $('#btnTheme');
  if (btn) btn.innerHTML = icon(state.theme === 'dark' ? 'sun' : 'moon');
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  save();
  applyTheme();
  render();
  toast(state.theme === 'dark' ? '다크 모드' : '라이트 모드', state.theme === 'dark' ? 'moon' : 'sun');
}

/* ============================================================
   전역 검색 — 모든 탭의 데이터를 한 번에 찾는다
   ============================================================ */
function buildSearchIndex() {
  const idx = [];

  SCHEDULE.forEach((d) => d.items.forEach((it) => {
    idx.push({
      type: '일정', icon: 'calendar', tab: 'schedule',
      title: it.title, sub: `${d.day} ${it.time} · ${it.place || ''}`,
      text: `${it.title} ${it.place || ''} ${it.desc || ''}`,
      action: () => {
        vs.scheduleDay = SCHEDULE.indexOf(d);
        switchTab('schedule');
        setTimeout(() => Views.schedule.openDetail(it.id), 260);
      },
    });
  }));

  COMPANIES.forEach((c) => idx.push({
    type: '기업', icon: 'building', tab: 'companies',
    title: c.name, sub: `${c.ko} · ${c.field}`,
    text: `${c.name} ${c.ko} ${c.field} ${c.intro} ${c.tags.join(' ')} ${c.tech.join(' ')} ${c.korea}`,
    action: () => { vs.companyId = c.id; switchTab('companies'); },
  }));

  Object.entries(QUESTIONS).forEach(([cid, arr]) => {
    const co = COMPANIES.find((c) => c.id === cid);
    arr.forEach((q, i) => idx.push({
      type: '질문', icon: 'help-circle', tab: 'questions',
      title: q, sub: `${co?.name || cid} · Q${i + 1}`, text: q,
      action: () => { vs.questionCid = cid; vs.questionFilter = 'all'; switchTab('questions'); },
    }));
  });

  ENGLISH.forEach((g) => g.phrases.forEach((p) => idx.push({
    type: '영어', icon: 'languages', tab: 'english',
    title: p.en, sub: `${g.cat} · ${p.ko}`, text: `${p.en} ${p.ko} ${p.tip || ''}`,
    action: () => { vs.engCat = g.cat; vs.engFavOnly = false; switchTab('english'); },
  })));

  state.packing.forEach((p) => idx.push({
    type: '준비물', icon: 'shopping-bag', tab: 'packing',
    title: p.name, sub: `${p.cat}${p.note ? ' · ' + p.note : ''}`, text: `${p.name} ${p.cat} ${p.note || ''}`,
    action: () => { vs.packCat = '전체'; vs.packQuery = p.name; switchTab('packing'); },
  }));

  state.travelCheck.forEach((c) => idx.push({
    type: '체크리스트', icon: 'check-square', tab: 'checklist',
    title: c.name, sub: c.phase, text: `${c.name} ${c.phase}`,
    action: () => { vs.checkPhase = c.phase; switchTab('checklist'); },
  }));

  GUIDE.forEach((g) => g.rows.forEach(([k, v]) => idx.push({
    type: '가이드', icon: 'map', tab: 'guide',
    title: k, sub: `${g.title} · ${v}`, text: `${g.title} ${k} ${v}`,
    action: () => { vs.guideOpen = g.id; switchTab('guide'); },
  })));

  state.shopping.forEach((s) => idx.push({
    type: '쇼핑', icon: 'tag', tab: 'shopping',
    title: s.name, sub: `${s.place}${s.note ? ' · ' + s.note : ''}`, text: `${s.name} ${s.place} ${s.note || ''}`,
    action: () => { vs.shopPlace = '전체'; switchTab('shopping'); },
  }));

  PROJECT_SECTIONS.forEach((s) => {
    const body = state.project[s.id] || '';
    if (body.trim()) idx.push({
      type: '프로젝트', icon: 'cpu', tab: 'project',
      title: s.title, sub: body.slice(0, 60).replace(/\n/g, ' '), text: `${s.title} ${body}`,
      action: () => { vs.projectSection = s.id; switchTab('project'); },
    });
  });

  state.meetings.forEach((m) => idx.push({
    type: '회의', icon: 'users', tab: 'meetings',
    title: m.title, sub: `${m.date} · ${m.attendees || ''}`, text: `${m.title} ${m.notes || ''}`,
    action: () => { switchTab('meetings'); setTimeout(() => Views.meetings.openDetail(m.id), 260); },
  }));

  return idx;
}

function openSearch() {
  openSheet(`
    <h3>전역 검색</h3>
    <div class="searchbar">
      ${icon('search')}
      <input id="globalSearch" placeholder="일정 · 기업 · 질문 · 영어 · 준비물…" autocomplete="off">
    </div>
    <div id="searchResults">
      <div class="empty">${icon('search')}<p>검색어를 입력하세요</p>
        <small>모든 탭의 내용을 한 번에 찾습니다</small></div>
    </div>`);

  const index = buildSearchIndex();
  const input = $('#globalSearch');
  const results = $('#searchResults');
  setTimeout(() => input.focus(), 250);

  input.oninput = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      results.innerHTML = `<div class="empty">${icon('search')}<p>검색어를 입력하세요</p></div>`;
      return;
    }
    const hits = index.filter((x) => x.text.toLowerCase().includes(q)).slice(0, 40);
    if (!hits.length) {
      results.innerHTML = `<div class="empty">${icon('search')}<p>결과가 없습니다</p>
        <small>"${esc(input.value)}"</small></div>`;
      return;
    }
    results.innerHTML = `<p class="small muted-3 mb-8">${hits.length}개 결과</p>` + hits.map((h, i) => `
      <div class="row" data-hit="${i}">
        <div class="stat-icon" style="margin:0;width:36px;height:36px;background:var(--chip-bg)">${icon(h.icon)}</div>
        <div class="row-main">
          <div class="row-title ellipsis">${esc(h.title)}</div>
          <div class="row-sub ellipsis">${esc(h.sub)}</div>
        </div>
        <span class="badge p-low">${esc(h.type)}</span>
      </div>`).join('');

    $$('[data-hit]').forEach((el) => {
      el.onclick = () => { closeSheet(); hits[+el.dataset.hit].action(); };
    });
  };
}

/* ============================================================
   FAB — 현재 탭에 맞는 빠른 작업
   ============================================================ */
function openFab() {
  const actions = [
    { label: '지출 추가', icon: 'wallet', color: 'var(--green)', run: () => { switchTab('budget'); setTimeout(() => $('[data-add-exp]')?.click(), 300); } },
    { label: '오늘 일기', icon: 'book-open', color: 'var(--purple)', run: () => { vs.diaryDate = ymd(); switchTab('diary'); } },
    { label: '준비물 추가', icon: 'shopping-bag', color: 'var(--blue)', run: () => { switchTab('packing'); setTimeout(() => Views.packing.openAdd(), 300); } },
    { label: '회의 만들기', icon: 'users', color: 'var(--indigo)', run: () => { switchTab('meetings'); setTimeout(() => Views.meetings.openEdit(null), 300); } },
    { label: '체크 항목', icon: 'check-square', color: 'var(--green)', run: () => { switchTab('checklist'); setTimeout(() => $('[data-add-check]')?.click(), 300); } },
    { label: '링크 저장', icon: 'link', color: 'var(--teal)', run: () => { switchTab('resources'); setTimeout(() => $('[data-add-link]')?.click(), 300); } },
    { label: '영어 퀴즈', icon: 'sparkles', color: 'var(--pink)', run: () => { switchTab('english'); setTimeout(() => Views.english.startQuiz(), 300); } },
    { label: '전역 검색', icon: 'search', color: 'var(--orange)', run: () => openSearch() },
  ];

  openSheet(`
    <h3>빠른 작업</h3>
    <div class="more-grid">
      ${actions.map((a, i) => `
        <button class="more-cell" data-fab="${i}">
          <span class="mc-icon" style="background:${a.color}22;color:${a.color}">${icon(a.icon)}</span>
          <span>${a.label}</span>
        </button>`).join('')}
    </div>`);

  $$('[data-fab]').forEach((el) => {
    el.onclick = () => { closeSheet(); setTimeout(() => actions[+el.dataset.fab].run(), 200); };
  });
}

/* ============================================================
   초기화
   ============================================================ */
function init() {
  // 저장된 탭이 더 이상 존재하지 않는 경우(앱 업데이트) 홈으로 복구
  if (!Views[state.tab] || !tabById(state.tab)) state.tab = 'dashboard';

  applyTheme();

  // 헤더 아이콘
  $('#btnSearch').innerHTML = icon('search');
  $('#btnTheme').innerHTML = icon(state.theme === 'dark' ? 'sun' : 'moon');
  $('#headerBack').innerHTML = icon('arrow-left');
  $('#fab').innerHTML = icon('plus');

  $('#btnSearch').onclick = openSearch;
  $('#btnTheme').onclick = toggleTheme;
  $('#fab').onclick = openFab;

  // 오버레이 닫기
  $('#sheetBackdrop').onclick = closeSheet;
  $('#modalBackdrop').onclick = closeModal;

  // 시트 아래로 스와이프해서 닫기
  let touchStartY = 0;
  const sheet = $('#sheet');
  sheet.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
  sheet.addEventListener('touchmove', (e) => {
    const dy = e.touches[0].clientY - touchStartY;
    if (dy > 0 && sheet.scrollTop <= 0) sheet.style.transform = `translateY(${dy}px)`;
  }, { passive: true });
  sheet.addEventListener('touchend', (e) => {
    const dy = e.changedTouches[0].clientY - touchStartY;
    sheet.style.transform = '';
    if (dy > 110 && sheet.scrollTop <= 0) closeSheet();
  });

  // ESC로 닫기 (데스크톱)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeSheet(); closeModal(); }
    // Cmd/Ctrl + K 로 검색
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSearch();
    }
  });

  // 페이지를 떠나기 전 즉시 저장
  window.addEventListener('pagehide', () => save(true));
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(true); });

  render();

  // 첫 방문 안내
  if (!localStorage.getItem('sv-master-welcomed')) {
    localStorage.setItem('sv-master-welcomed', '1');
    setTimeout(() => {
      openModal('환영합니다 ✈️', `
        <p class="small muted" style="line-height:1.8">
          <b>${esc(TRIP.program)}</b>을 위한 올인원 앱입니다.<br><br>
          · 모든 데이터는 <b>이 기기에만</b> 저장되며 오프라인에서도 동작합니다.<br>
          · 하단 <b>더보기</b>에서 15개 메뉴 전체를 볼 수 있습니다.<br>
          · 오른쪽 아래 <b>+ 버튼</b>으로 빠르게 기록하세요.<br>
          · 상단 <b>돋보기</b>로 모든 내용을 한 번에 검색합니다.<br><br>
          출국 준비부터 귀국 보고서까지, 여기서 끝내세요!
        </p>
        <button class="btn block mt-16" data-welcome-ok>${icon('check')} 시작하기</button>`, 'plane');
      $('[data-welcome-ok]').onclick = closeModal;
    }, 700);
  }
}

/* ---------- Service Worker (오프라인) ---------- */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* 오프라인/파일 실행 시 무시 */ });
  });
}

document.addEventListener('DOMContentLoaded', init);
