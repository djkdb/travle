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
  enhanceChipRows(app);
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

/* ============================================================
   홈 화면 추가 안내 배너
   - 이미 홈 화면에서 실행 중(standalone)이면 표시하지 않는다
   - 사용자가 닫으면 다시 표시하지 않는다
   ============================================================ */

/** 홈 화면에서 실행 중인지 (iOS Safari / 표준 PWA 모두 대응) */
function isStandalone() {
  return window.navigator.standalone === true ||
         window.matchMedia('(display-mode: standalone)').matches;
}

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function renderInstallBanner() {
  const old = $('#installBanner');
  if (old) old.remove();
  document.body.classList.remove('has-install-banner');
  if (state.installDismissed || isStandalone()) return;
  document.body.classList.add('has-install-banner');

  const el = document.createElement('div');
  el.id = 'installBanner';
  el.className = 'install-banner glass-strong';
  el.innerHTML = `
    <div class="ib-icon">${icon('plane')}</div>
    <div class="ib-text">
      <b>앱처럼 쓰세요</b>
      <span>${isIOS
        ? `공유 ${icon('share')} → 홈 화면에 추가`
        : '브라우저 메뉴 → 홈 화면에 추가'}</span>
    </div>
    <button class="btn small" id="ibHow">방법</button>
    <button class="icon-btn" id="ibClose" aria-label="닫기">${icon('x')}</button>`;
  document.body.appendChild(el);

  requestAnimationFrame(() => el.classList.add('show'));

  $('#ibClose').onclick = () => {
    el.classList.remove('show');
    document.body.classList.remove('has-install-banner');
    setTimeout(() => el.remove(), 300);
    state.installDismissed = true;
    save();
  };
  $('#ibHow').onclick = showInstallGuide;
}

/** 설치 방법 상세 안내 */
function showInstallGuide() {
  const steps = isIOS
    ? [
        ['Safari로 이 페이지를 엽니다', '크롬·인앱 브라우저에서는 홈 화면 추가가 되지 않습니다'],
        [`화면 아래 공유 버튼 ${icon('share')} 을 누릅니다`, '네모에서 화살표가 위로 나오는 아이콘'],
        ['목록을 내려 <b>홈 화면에 추가</b>를 선택', '"Add to Home Screen"'],
        ['오른쪽 위 <b>추가</b>를 누릅니다', '홈 화면에 아이콘이 생깁니다'],
      ]
    : [
        ['브라우저 메뉴(⋮)를 엽니다', ''],
        ['<b>앱 설치</b> 또는 <b>홈 화면에 추가</b>를 선택', ''],
        ['설치를 확인합니다', ''],
      ];

  openModal('홈 화면에 추가하기', `
    <p class="small muted mb-12" style="line-height:1.7">
      홈 화면에 추가하면 <b>주소창 없는 전체화면</b>으로 실행되고,
      비행기 안처럼 인터넷이 없어도 그대로 동작합니다.
    </p>
    ${steps.map(([t, sub], i) => `
      <div class="flex gap-10" style="padding:10px 0;border-bottom:1px solid var(--stroke)">
        <span class="ib-step">${i + 1}</span>
        <div class="flex-1">
          <div class="small" style="font-weight:600;line-height:1.5">${t}</div>
          ${sub ? `<div class="small muted-3" style="margin-top:2px">${sub}</div>` : ''}
        </div>
      </div>`).join('')}
    <button class="btn block mt-16" data-ig-ok>${icon('check')} 알겠습니다</button>`, 'plane');

  $('[data-ig-ok]').onclick = closeModal;
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

  PROJECT_TOPICS.forEach((t) => idx.push({
    type: '추천 주제', icon: 'sparkles', tab: 'project',
    title: t.title, sub: t.tagline,
    text: `${t.title} ${t.tagline} ${t.core} ${t.why} ${t.outline.join(' ')}`,
    action: () => { switchTab('project'); setTimeout(() => Views.project.openTopicDetail(t.id), 280); },
  }));

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
  renderInstallBanner();

  // 첫 방문 기능 소개
  if (!localStorage.getItem('sv-master-welcomed')) {
    localStorage.setItem('sv-master-welcomed', '1');
    setTimeout(showIntro, 650);
  }
}

/* ============================================================
   기능 소개 — 2페이지
   "더보기"에 숨어 있는 메뉴가 많아 첫 진입 시 한 번만 보여준다.
   ============================================================ */
function showIntro() {
  const pages = [
    {
      icon: 'plane', title: '준비부터 보고서까지, 여기서',
      body: `<p class="small muted" style="line-height:1.75">
          <b>${esc(TRIP.program)}</b>을 위한 올인원 앱입니다.
          모든 기록은 <b>이 기기에만</b> 저장되고, 비행기 안에서도 오프라인으로 동작합니다.
        </p>
        <div class="intro-grid mt-16">
          ${[
            ['calendar', '일정', '10일 타임라인 · 메모 · 사진'],
            ['shopping-bag', '준비물', '49개 체크리스트'],
            ['building', '기업', '11개 방문지 상세 정보'],
            ['help-circle', '질문', '방문지별 227개 질문'],
          ].map(([ic, t, s]) => `
            <div class="intro-cell">
              <span class="ic">${icon(ic)}</span>
              <b>${t}</b><span>${s}</span>
            </div>`).join('')}
        </div>`,
    },
    {
      icon: 'grid', title: '숨어 있는 메뉴가 더 있어요',
      body: `<p class="small muted" style="line-height:1.75">
          하단 <b>더보기</b>를 누르면 아래 메뉴가 모두 나옵니다.
        </p>
        <div class="intro-grid mt-12">
          ${[
            ['cpu', '프로젝트', '추천 주제 6개 + 초안'],
            ['languages', '영어', '회화 · 발음 · 퀴즈'],
            ['map', '가이드', '팁 · 치안 · 비상연락'],
            ['wallet', '경비', '지출 · 환율 계산기'],
            ['book-open', '일기', '하루 기록 · 사진'],
            ['users', '회의', '회의록 · 할 일'],
          ].map(([ic, t, s]) => `
            <div class="intro-cell">
              <span class="ic">${icon(ic)}</span>
              <b>${t}</b><span>${s}</span>
            </div>`).join('')}
        </div>
        <div class="card mt-12" style="padding:12px">
          <div class="flex items-center gap-10" style="padding:4px 0">
            <span class="intro-hint">${icon('search')}</span>
            <span class="small">상단 <b>돋보기</b> — 모든 탭을 한 번에 검색</span>
          </div>
          <div class="flex items-center gap-10" style="padding:4px 0">
            <span class="intro-hint">${icon('plus')}</span>
            <span class="small">오른쪽 아래 <b>+ 버튼</b> — 지출·일기 빠른 기록</span>
          </div>
        </div>`,
    },
  ];

  let i = 0;
  const show = () => {
    const p = pages[i];
    const last = i === pages.length - 1;
    openModal(p.title, `
      ${p.body}
      <div class="intro-actions">
        <div class="intro-dots">
          ${pages.map((_, n) => `<span class="${n === i ? 'on' : ''}"></span>`).join('')}
        </div>
        <div class="flex gap-8">
          ${i > 0 ? '<button class="btn ghost flex-1" data-intro-prev>이전</button>' : ''}
          <button class="btn flex-1" data-intro-next>
            ${last ? `${icon('check')} 시작하기` : '다음'}
          </button>
        </div>
      </div>`, p.icon);

    $('[data-intro-next]').onclick = () => {
      if (last) { closeModal(); return; }
      i++; show();
    };
    const prev = $('[data-intro-prev]');
    if (prev) prev.onclick = () => { i--; show(); };
  };
  show();
}

/* ---------- Service Worker (오프라인) ---------- */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* 오프라인/파일 실행 시 무시 */ });
  });
}

document.addEventListener('DOMContentLoaded', init);
