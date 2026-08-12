/* ============================================================
   views.js — 화면 컴포넌트 (1)
   Dashboard / 일정 / 준비물 / 여행 체크리스트 / 반도체 프로젝트
   각 View는 { title, sub, render(), mount() } 형태.
   render()는 HTML 문자열을 반환하고, mount()에서 이벤트를 바인딩한다.
   ============================================================ */

const Views = {};

/* 뷰 로컬 상태 (탭 내부 필터 등 — 저장 대상 아님) */
const vs = {
  scheduleDay: 0,
  packCat: '전체',
  packQuery: '',
  packFilter: 'all',        // all | todo | done
  checkPhase: '전체',
  projectSection: 'overview',
  projectPreview: false,
  companyId: null,
  questionCid: 'lam',
  questionFilter: 'all',    // all | todo | fav
  engCat: '공항',
  engFavOnly: false,
  shopPlace: '전체',
  diaryDate: ymd(),
  guideOpen: 'weather',
};

/* ============================================================
   1. DASHBOARD
   ============================================================ */
Views.dashboard = {
  title: '실리콘밸리 마스터',
  sub: TRIP.program,

  render() {
    const dday = ddayCount();
    const { day, isToday } = todaySchedule();
    const overall = stats.overall();
    const pk = stats.packing();
    const tc = stats.travelCheck();
    const qs = stats.questions();
    const sc = stats.schedule();

    // 오늘의 영어 / 기업 — 날짜 기반으로 매일 바뀌도록 결정적 선택
    const seed = new Date().getDate() + new Date().getMonth() * 31;
    const allPhrases = ENGLISH.flatMap((g) => g.phrases.map((p) => ({ ...p, cat: g.cat })));
    const todayPhrase = allPhrases[seed % allPhrases.length];
    const todayCompany = COMPANIES[seed % COMPANIES.length];

    const ddayLabel = dday > 0 ? `D-${dday}` : dday === 0 ? 'D-DAY' : `여행 ${Math.abs(dday) + 1}일차`;

    return `
      <!-- HERO: D-Day -->
      <section class="hero">
        <div class="hero-eyebrow">${esc(TRIP.departAirport)}</div>
        <div class="hero-dday">${ddayLabel}${dday > 0 ? '<small>남음</small>' : ''}</div>
        <div class="hero-sub">${esc(TRIP.flightOut)}</div>
        <div class="hero-sub" style="margin-top:2px">${esc(TRIP.cities)}</div>
        <div class="hero-count" id="countdown"></div>
      </section>

      <!-- 준비 진행률 -->
      <div class="card">
        <div class="flex items-center gap-12">
          <div style="position:relative;flex:none">
            ${progressRing(overall, 72, 7)}
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
                        font-size:17px;font-weight:800" id="overallPct">0%</div>
          </div>
          <div class="flex-1">
            <div class="card-title">${icon('trending-up')} 전체 준비 진행률</div>
            <p class="small muted mt-8">준비물 · 체크리스트 · 질문 · 프로젝트를 합산한 지표입니다.</p>
            <div class="flex gap-8 mt-8">
              <span class="badge t-company">준비물 ${pct(pk.done, pk.total)}%</span>
              <span class="badge t-tour">체크 ${pct(tc.done, tc.total)}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 세부 진행률 -->
      <div class="stat-grid">
        ${statCard('준비물', pk, 'shopping-bag', 'var(--blue)', 'packing')}
        ${statCard('체크리스트', tc, 'check-square', 'var(--green)', 'checklist')}
        ${statCard('질문 준비', qs, 'help-circle', 'var(--purple)', 'questions')}
        ${statCard('일정 완료', sc, 'calendar', 'var(--orange)', 'schedule')}
      </div>

      <!-- 오늘 일정 -->
      <div class="section-label">${icon('calendar')} ${isToday ? '오늘 일정' : '다가오는 일정'}</div>
      <div class="card pressable" data-goto="schedule">
        <div class="flex items-center justify-between mb-8">
          <div>
            <div class="card-title">${esc(day.day)} · ${esc(prettyDate(day.date))}</div>
            <p class="small muted mt-8">${esc(day.city)}</p>
          </div>
          ${icon('chevron-right')}
        </div>
        <div class="mt-12">
          ${day.items.slice(0, 4).map((it) => {
            const t = SCHED_TYPES[it.type];
            const done = state.schedule[it.id]?.done;
            return `<div class="flex items-center gap-10" style="padding:7px 0;${done ? 'opacity:.5' : ''}">
              <span class="tl-time" style="width:42px">${esc(it.time)}</span>
              <span class="badge ${t.cls}">${icon(t.icon)}${esc(t.label)}</span>
              <span class="small flex-1 ellipsis">${esc(it.title)}</span>
            </div>`;
          }).join('')}
          ${day.items.length > 4 ? `<p class="small muted-3 mt-8">+ ${day.items.length - 4}개 더보기</p>` : ''}
        </div>
      </div>

      ${this.renderMissionDue()}

      <!-- 이번주 할 일 -->
      <div class="section-label">${icon('list-todo')} 지금 해야 할 일</div>
      ${this.renderTodos()}

      <!-- 오늘의 영어 -->
      <div class="section-label">${icon('languages')} 오늘의 영어</div>
      <div class="card pressable" data-goto="english">
        <span class="badge t-company mb-8" style="display:inline-flex">${esc(todayPhrase.cat)}</span>
        <div class="phrase-en mt-8">${esc(todayPhrase.en)}</div>
        <div class="phrase-ko">${esc(todayPhrase.ko)}</div>
        ${todayPhrase.tip ? `<div class="phrase-tip">${icon('lightbulb')}<span>${esc(todayPhrase.tip)}</span></div>` : ''}
      </div>

      <!-- 오늘의 기업 -->
      <div class="section-label">${icon('building')} 오늘의 기업</div>
      <div class="card pressable" data-company="${todayCompany.id}">
        <div class="flex gap-12">
          ${companyLogo(todayCompany)}
          <div class="flex-1">
            <div class="card-title">${esc(todayCompany.name)}</div>
            <p class="small muted">${esc(todayCompany.field)}</p>
            <p class="small muted-3 mt-8" style="line-height:1.55">
              ${esc(todayCompany.intro.slice(0, 90))}…</p>
          </div>
        </div>
      </div>
    `;
  },

  /** 미션수행 계획서 마감 알림 — 마감 전까지만 표시 */
  renderMissionDue() {
    const due = new Date(TRIP.missionDue);
    const now = new Date();
    if (now > due) return '';

    const days = Math.ceil((due - now) / 86400000);
    const urgent = days <= 3;
    return `
      <div class="card pressable" data-goto="project"
           style="border-color:${urgent ? 'rgba(255,69,58,.45)' : 'rgba(255,159,10,.4)'};
                  background:linear-gradient(135deg, ${urgent ? 'rgba(255,69,58,.16)' : 'rgba(255,159,10,.14)'}, transparent)">
        <div class="flex items-center gap-12">
          <div class="stat-icon" style="margin:0;background:${urgent ? 'rgba(255,69,58,.2)' : 'rgba(255,159,10,.2)'};
               color:${urgent ? 'var(--red)' : 'var(--orange)'}">${icon('alert-triangle')}</div>
          <div class="flex-1">
            <div class="card-title" style="font-size:14px">미션수행 계획서 제출 D-${days}</div>
            <p class="small muted mt-8" style="line-height:1.55">
              8/13(목) 12:00까지 · ${esc(TRIP.missionEmail)}
            </p>
          </div>
          ${icon('chevron-right')}
        </div>
      </div>`;
  },

  /** 지금 해야 할 일 — 미완료 항목에서 우선순위 높은 것들 추출 */
  renderTodos() {
    const todos = [];
    state.packing.filter((p) => !p.checked && p.priority === 'high')
      .slice(0, 3).forEach((p) => todos.push({ text: p.name, sub: `준비물 · ${p.cat}`, tab: 'packing' }));
    state.travelCheck.filter((c) => !c.done && c.phase === '출국 전')
      .slice(0, 3).forEach((c) => todos.push({ text: c.name, sub: '출국 전 체크', tab: 'checklist' }));
    const emptySections = PROJECT_SECTIONS.filter((s) => !(state.project[s.id] || '').trim()).slice(0, 2);
    emptySections.forEach((s) => todos.push({ text: `${s.title} 작성하기`, sub: '반도체 프로젝트', tab: 'project' }));

    if (!todos.length) return `<div class="card">${emptyState('모두 완료했습니다!', '준비 완벽 👏', 'check-square')}</div>`;
    return `<div class="stagger">${todos.slice(0, 6).map((t) => `
      <div class="row" data-goto="${t.tab}">
        <div class="checkbox"></div>
        <div class="row-main">
          <div class="row-title">${esc(t.text)}</div>
          <div class="row-sub">${esc(t.sub)}</div>
        </div>
        ${icon('chevron-right')}
      </div>`).join('')}</div>`;
  },

  mount() {
    // 카운트다운 타이머
    const cd = $('#countdown');
    const tick = () => {
      if (!document.contains(cd)) return;
      const { d, h, m, s } = countdownParts();
      cd.innerHTML = [['일', d], ['시간', h], ['분', m], ['초', s]]
        .map(([label, v]) => `<div class="count-cell"><b>${v}</b><span>${label}</span></div>`).join('');
      setTimeout(tick, 1000);
    };
    tick();

    // 진행률 카운트업
    const pctEl = $('#overallPct');
    if (pctEl) countUp(pctEl, stats.overall(), 900, '%');

    // 이동
    $$('[data-goto]').forEach((el) => {
      el.onclick = () => switchTab(el.dataset.goto);
    });
    $$('[data-company]').forEach((el) => {
      el.onclick = () => { vs.companyId = el.dataset.company; switchTab('companies'); };
    });
  },
};

/** 대시보드 통계 카드 */
function statCard(label, s, iconName, color, tab) {
  const p = pct(s.done, s.total);
  return `
    <div class="card stat-card pressable" data-goto="${tab}">
      <div class="stat-icon" style="background:${color}22;color:${color}">${icon(iconName)}</div>
      <b>${p}%</b>
      <span>${esc(label)} · ${s.done}/${s.total}</span>
      ${progressBar(s.done, s.total, color === 'var(--green)' ? 'green' : color === 'var(--orange)' ? 'orange' : color === 'var(--purple)' ? 'purple' : '')}
    </div>`;
}

/* ============================================================
   2. 일정
   ============================================================ */
Views.schedule = {
  title: '일정',
  sub: `${SCHEDULE.length}일 · ${TRIP.cities}`,

  render() {
    const day = SCHEDULE[vs.scheduleDay];
    const s = stats.schedule();

    return `
      <div class="card mb-12">
        <div class="flex items-center justify-between">
          <div class="card-title">${icon('calendar')} 일정 진행률</div>
          <b class="tabular">${pct(s.done, s.total)}%</b>
        </div>
        ${progressBar(s.done, s.total)}
        <p class="small muted-3 mt-8">${s.done} / ${s.total} 완료</p>
      </div>

      <div class="chip-row" id="dayChips">
        ${SCHEDULE.map((d, i) => {
          const dn = d.items.filter((it) => state.schedule[it.id]?.done).length;
          const all = dn === d.items.length;
          return `<button class="chip ${i === vs.scheduleDay ? 'active' : ''}" data-day="${i}">
            ${all ? icon('check') : ''}${esc(d.day)}
          </button>`;
        }).join('')}
      </div>

      <div class="card mb-12" style="background:linear-gradient(135deg, rgba(10,132,255,.14), rgba(191,90,242,.10))">
        <div class="card-title">${esc(day.day)} · ${esc(prettyDate(day.date))}</div>
        <p class="small muted mt-8">${icon('map')} ${esc(day.city)}</p>
        ${(() => {
          const h = HOTELS.find((x) => x.id === day.hotel);
          return h ? `<p class="small muted-3" style="margin-top:4px">${icon('bed')} ${esc(h.name)}</p>` : '';
        })()}
      </div>

      <div class="timeline stagger">
        ${day.items.map((it) => this.itemCard(it)).join('')}
      </div>
    `;
  },

  itemCard(it) {
    const t = SCHED_TYPES[it.type];
    const e = state.schedule[it.id] || {};
    const hasMemo = (e.memo || '').trim().length > 0;
    const photoCount = (e.photos || []).length;
    return `
      <div class="tl-item ${e.done ? 'done' : ''}">
        <div class="tl-dot"></div>
        <div class="card pressable mb-0" data-sched="${it.id}">
          <div class="flex items-center gap-10 mb-8">
            <span class="tl-time">${esc(it.time)}</span>
            <span class="badge ${t.cls}">${icon(t.icon)}${esc(t.label)}</span>
            <div class="flex-1"></div>
            ${e.done ? `<span class="badge t-tour">${icon('check')}완료</span>` : ''}
          </div>
          <div class="row-title" style="${e.done ? 'text-decoration:line-through;opacity:.55' : ''}">
            ${esc(it.title)}
          </div>
          ${it.place ? `<div class="row-sub">${icon('map')} ${esc(it.place)}</div>` : ''}
          ${it.desc ? `<p class="small muted mt-8" style="line-height:1.6">${esc(it.desc)}</p>` : ''}
          ${(hasMemo || photoCount) ? `
            <div class="flex gap-8 mt-8">
              ${hasMemo ? `<span class="badge p-low">${icon('pencil')}메모</span>` : ''}
              ${photoCount ? `<span class="badge p-low">${icon('camera')}${photoCount}</span>` : ''}
            </div>` : ''}
        </div>
      </div>`;
  },

  mount() {
    $$('[data-day]').forEach((el) => {
      el.onclick = () => { vs.scheduleDay = +el.dataset.day; render(); };
    });
    $$('[data-sched]').forEach((el) => {
      el.onclick = () => this.openDetail(el.dataset.sched);
    });
  },

  /** 일정 상세 바텀시트 */
  openDetail(id) {
    const item = SCHEDULE.flatMap((d) => d.items).find((i) => i.id === id);
    const dayInfo = SCHEDULE.find((d) => d.items.some((i) => i.id === id));
    const e = schedEntry(id);
    const t = SCHED_TYPES[item.type];
    const co = item.companyId ? COMPANIES.find((c) => c.id === item.companyId) : null;

    openSheet(`
      <div class="flex items-center gap-10 mb-12">
        <span class="badge ${t.cls}">${icon(t.icon)}${esc(t.label)}</span>
        <span class="tl-time">${esc(dayInfo.day)} ${esc(item.time)}</span>
      </div>
      <h3>${esc(item.title)}</h3>
      ${item.place ? `<div class="kv"><b>장소</b><span>${esc(item.place)}</span></div>` : ''}
      <div class="kv"><b>날짜</b><span>${esc(prettyDate(dayInfo.date))}</span></div>
      ${item.desc ? `<div class="kv"><b>안내</b><span>${esc(item.desc)}</span></div>` : ''}

      ${co ? `<button class="btn ghost block mt-12" data-open-co="${co.id}">
        ${icon('building')} ${esc(co.name)} 정보 보기</button>` : ''}

      <button class="btn ${e.done ? 'ghost' : 'green'} block mt-12" data-toggle-done>
        ${icon(e.done ? 'rotate-ccw' : 'check')} ${e.done ? '완료 취소' : '완료로 표시'}
      </button>

      <div class="field mt-16">
        <label class="field-label">메모</label>
        <textarea class="textarea" id="schedMemo" placeholder="여기서 보고 느낀 것을 기록하세요">${esc(e.memo)}</textarea>
      </div>

      <label class="field-label">사진</label>
      ${photoGrid(e.photos || [], 'data-add-photo', 'data-del-photo')}

      <button class="btn ghost block mt-16" data-close-sheet>닫기</button>
    `);

    const rerender = () => { this.openDetail(id); render(); };

    $('[data-toggle-done]').onclick = () => {
      e.done = !e.done; save();
      toast(e.done ? '완료했습니다!' : '완료를 취소했습니다', e.done ? 'check' : 'rotate-ccw');
      rerender();
    };
    $('#schedMemo').oninput = (ev) => { e.memo = ev.target.value; save(); };
    const openCo = $('[data-open-co]');
    if (openCo) openCo.onclick = () => {
      closeSheet();
      vs.companyId = openCo.dataset.openCo;
      switchTab('companies');
    };
    $('[data-add-photo]').onchange = (ev) => {
      readPhoto(ev.target.files[0], (data) => {
        e.photos = e.photos || [];
        e.photos.push(data); save();
        toast('사진을 추가했습니다', 'camera');
        rerender();
      });
    };
    $$('[data-del-photo]').forEach((b) => {
      b.onclick = () => { e.photos.splice(+b.dataset.delPhoto, 1); save(); rerender(); };
    });
    $('[data-close-sheet]').onclick = closeSheet;
  },
};

/* ============================================================
   3. 준비물
   ============================================================ */
Views.packing = {
  title: '준비물',
  sub: '카테고리별 체크리스트',

  render() {
    const s = stats.packing();
    const totalCost = state.packing.filter((p) => !p.bought).reduce((a, p) => a + (p.price || 0), 0);

    let list = state.packing;
    if (vs.packCat !== '전체') list = list.filter((p) => p.cat === vs.packCat);
    if (vs.packFilter === 'todo') list = list.filter((p) => !p.checked);
    if (vs.packFilter === 'done') list = list.filter((p) => p.checked);
    if (vs.packQuery.trim()) {
      const q = vs.packQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.note || '').toLowerCase().includes(q));
    }
    // 우선순위 정렬
    const order = { high: 0, mid: 1, low: 2 };
    list = [...list].sort((a, b) => (order[a.priority] ?? 9) - (order[b.priority] ?? 9));

    return `
      <div class="card mb-12">
        <div class="flex items-center justify-between mb-8">
          <div class="card-title">${icon('shopping-bag')} 준비물 진행률</div>
          <b class="tabular">${pct(s.done, s.total)}%</b>
        </div>
        ${progressBar(s.done, s.total)}
        <div class="flex justify-between mt-8">
          <span class="small muted-3">${s.done} / ${s.total} 완료</span>
          <span class="small muted-3">미구매 예상 ${won(totalCost)}</span>
        </div>
      </div>

      <div class="searchbar">
        ${icon('search')}
        <input id="packSearch" placeholder="준비물 검색" value="${esc(vs.packQuery)}">
        ${vs.packQuery ? `<button data-clear-search>${icon('x')}</button>` : ''}
      </div>

      <div class="segment">
        ${[['all', '전체'], ['todo', '미완료'], ['done', '완료']].map(([k, v]) =>
          `<button class="${vs.packFilter === k ? 'active' : ''}" data-pfilter="${k}">${v}</button>`).join('')}
      </div>

      <div class="chip-row">
        <button class="chip ${vs.packCat === '전체' ? 'active' : ''}" data-pcat="전체">전체</button>
        ${PACK_CATS.map((c) => {
          const items = state.packing.filter((p) => p.cat === c);
          const d = items.filter((p) => p.checked).length;
          return `<button class="chip ${vs.packCat === c ? 'active' : ''}" data-pcat="${esc(c)}">
            ${esc(c)} ${d}/${items.length}</button>`;
        }).join('')}
      </div>

      ${list.length ? `<div class="stagger">${list.map((p) => this.itemRow(p)).join('')}</div>`
        : emptyState('해당하는 준비물이 없습니다', '필터를 바꿔보세요', 'search')}

      <button class="btn ghost block mt-16" data-add-pack>${icon('plus')} 준비물 직접 추가</button>
    `;
  },

  itemRow(p) {
    const pcls = { high: 'p-high', mid: 'p-mid', low: 'p-low' }[p.priority] || 'p-low';
    return `
      <div class="row ${p.checked ? 'done' : ''}">
        <button data-pcheck="${p.id}" aria-label="체크">${checkbox(p.checked)}</button>
        <div class="row-main" data-pdetail="${p.id}">
          <div class="row-title">${esc(p.name)}</div>
          <div class="row-sub flex items-center gap-6" style="flex-wrap:wrap">
            <span class="badge ${pcls}">${PRIORITIES[p.priority] || '보통'}</span>
            <span>${esc(p.cat)}</span>
            ${p.price ? `<span>· ${won(p.price)}</span>` : ''}
            ${p.bought ? `<span class="badge t-tour">${icon('check')}구매완료</span>` : ''}
            ${p.note ? `<span>· ${esc(p.note)}</span>` : ''}
          </div>
        </div>
        <button class="icon-btn" data-pdetail="${p.id}" aria-label="상세">${icon('chevron-right')}</button>
      </div>`;
  },

  mount() {
    const search = $('#packSearch');
    if (search) {
      search.oninput = (e) => {
        vs.packQuery = e.target.value;
        const pos = e.target.selectionStart;
        render();
        const s2 = $('#packSearch');
        if (s2) { s2.focus(); s2.setSelectionRange(pos, pos); }
      };
    }
    const clear = $('[data-clear-search]');
    if (clear) clear.onclick = () => { vs.packQuery = ''; render(); };

    $$('[data-pfilter]').forEach((el) => {
      el.onclick = () => { vs.packFilter = el.dataset.pfilter; render(); };
    });
    $$('[data-pcat]').forEach((el) => {
      el.onclick = () => { vs.packCat = el.dataset.pcat; render(); };
    });
    $$('[data-pcheck]').forEach((el) => {
      el.onclick = (ev) => {
        ev.stopPropagation();
        const p = state.packing.find((x) => x.id === el.dataset.pcheck);
        p.checked = !p.checked; save();
        haptic();
        render();
      };
    });
    $$('[data-pdetail]').forEach((el) => {
      el.onclick = () => this.openDetail(el.dataset.pdetail);
    });
    const add = $('[data-add-pack]');
    if (add) add.onclick = () => this.openAdd();
  },

  openDetail(id) {
    const p = state.packing.find((x) => x.id === id);
    if (!p) return;
    openSheet(`
      <h3>${esc(p.name)}</h3>
      <div class="grid-2 mb-12">
        <button class="btn ${p.checked ? 'green' : 'ghost'}" data-tg-check>
          ${icon('check')} ${p.checked ? '챙김' : '안 챙김'}
        </button>
        <button class="btn ${p.bought ? 'green' : 'ghost'}" data-tg-buy>
          ${icon('shopping-bag')} ${p.bought ? '구매완료' : '미구매'}
        </button>
      </div>
      <div class="field">
        <label class="field-label">카테고리</label>
        <select class="select" id="pCat">
          ${PACK_CATS.map((c) => `<option ${c === p.cat ? 'selected' : ''}>${esc(c)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label class="field-label">우선순위</label>
        <select class="select" id="pPri">
          ${Object.entries(PRIORITIES).map(([k, v]) =>
            `<option value="${k}" ${k === p.priority ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label class="field-label">예상 가격 (원)</label>
        <input class="input" id="pPrice" type="number" inputmode="numeric" value="${p.price || 0}">
      </div>
      <div class="field">
        <label class="field-label">구매 링크</label>
        <input class="input" id="pLink" type="url" placeholder="https://" value="${esc(p.link || '')}">
      </div>
      ${p.link ? `<a class="btn ghost block mb-12" href="${esc(p.link)}" target="_blank" rel="noopener">
        ${icon('external-link')} 링크 열기</a>` : ''}
      <div class="field">
        <label class="field-label">메모</label>
        <textarea class="textarea" id="pNote" style="min-height:70px">${esc(p.note || '')}</textarea>
      </div>
      <div class="flex gap-8 mt-12">
        <button class="btn danger flex-1" data-del-pack>${icon('trash')} 삭제</button>
        <button class="btn flex-1" data-close-sheet>완료</button>
      </div>
    `);

    $('[data-tg-check]').onclick = () => { p.checked = !p.checked; save(); this.openDetail(id); render(); };
    $('[data-tg-buy]').onclick = () => { p.bought = !p.bought; save(); this.openDetail(id); render(); };
    $('#pCat').onchange = (e) => { p.cat = e.target.value; save(); render(); };
    $('#pPri').onchange = (e) => { p.priority = e.target.value; save(); render(); };
    $('#pPrice').oninput = (e) => { p.price = +e.target.value || 0; save(); };
    $('#pLink').oninput = (e) => { p.link = e.target.value; save(); };
    $('#pNote').oninput = (e) => { p.note = e.target.value; save(); };
    $('[data-del-pack]').onclick = () => {
      confirmModal('준비물 삭제', `"${p.name}"을(를) 삭제할까요?`, () => {
        state.packing = state.packing.filter((x) => x.id !== id);
        save(); closeSheet(); render();
        toast('삭제했습니다', 'trash');
      });
    };
    $('[data-close-sheet]').onclick = closeSheet;
  },

  openAdd() {
    openSheet(`
      <h3>준비물 추가</h3>
      <div class="field">
        <label class="field-label">이름</label>
        <input class="input" id="naName" placeholder="예: 여행용 어댑터">
      </div>
      <div class="field">
        <label class="field-label">카테고리</label>
        <select class="select" id="naCat">${PACK_CATS.map((c) => `<option>${esc(c)}</option>`).join('')}</select>
      </div>
      <div class="field">
        <label class="field-label">우선순위</label>
        <select class="select" id="naPri">
          ${Object.entries(PRIORITIES).map(([k, v]) => `<option value="${k}" ${k === 'mid' ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label class="field-label">예상 가격 (원)</label>
        <input class="input" id="naPrice" type="number" inputmode="numeric" placeholder="0">
      </div>
      <button class="btn block mt-12" data-save-pack>${icon('plus')} 추가하기</button>
    `);
    $('#naName').focus();
    $('[data-save-pack]').onclick = () => {
      const name = $('#naName').value.trim();
      if (!name) { toast('이름을 입력해주세요', 'alert-triangle'); return; }
      state.packing.unshift({
        id: uid(), name, cat: $('#naCat').value, priority: $('#naPri').value,
        price: +$('#naPrice').value || 0, checked: false, bought: false, link: '', note: '',
      });
      save(); closeSheet(); render();
      toast('준비물을 추가했습니다');
    };
  },
};

/* ============================================================
   4. 여행 체크리스트
   ============================================================ */
Views.checklist = {
  title: '여행 체크리스트',
  sub: '출국 전 → 귀국까지 단계별',

  render() {
    const s = stats.travelCheck();
    const phases = vs.checkPhase === '전체' ? CHECK_PHASES : [vs.checkPhase];
    const phaseIcons = {
      '출국 전': 'list-todo', '공항': 'plane', '비행기': 'plane',
      '입국': 'shield-check', '호텔': 'bed', '귀국': 'home',
    };

    return `
      <div class="card mb-12">
        <div class="flex items-center justify-between mb-8">
          <div class="card-title">${icon('check-square')} 전체 진행률</div>
          <b class="tabular">${pct(s.done, s.total)}%</b>
        </div>
        ${progressBar(s.done, s.total, 'green')}
        <p class="small muted-3 mt-8">${s.done} / ${s.total} 완료</p>
      </div>

      <div class="chip-row">
        <button class="chip ${vs.checkPhase === '전체' ? 'active' : ''}" data-phase="전체">전체</button>
        ${CHECK_PHASES.map((ph) => {
          const items = state.travelCheck.filter((c) => c.phase === ph);
          const d = items.filter((c) => c.done).length;
          return `<button class="chip ${vs.checkPhase === ph ? 'active' : ''}" data-phase="${esc(ph)}">
            ${esc(ph)} ${d}/${items.length}</button>`;
        }).join('')}
      </div>

      ${phases.map((ph) => {
        const items = state.travelCheck.filter((c) => c.phase === ph);
        if (!items.length) return '';
        const d = items.filter((c) => c.done).length;
        return `
          <div class="section-label">${icon(phaseIcons[ph] || 'check-square')} ${esc(ph)}
            <span style="margin-left:auto;font-weight:700">${d}/${items.length}</span></div>
          <div class="card" style="padding:8px">
            ${progressBar(d, items.length, 'green')}
          </div>
          <div class="stagger">
            ${items.map((c) => `
              <div class="row ${c.done ? 'done' : ''}" data-check="${c.id}">
                ${checkbox(c.done)}
                <div class="row-main"><div class="row-title">${esc(c.name)}</div></div>
                <button class="icon-btn" data-del-check="${c.id}" aria-label="삭제">${icon('trash')}</button>
              </div>`).join('')}
          </div>`;
      }).join('')}

      <button class="btn ghost block mt-16" data-add-check>${icon('plus')} 항목 추가</button>
    `;
  },

  mount() {
    $$('[data-phase]').forEach((el) => {
      el.onclick = () => { vs.checkPhase = el.dataset.phase; render(); };
    });
    $$('[data-check]').forEach((el) => {
      el.onclick = () => {
        const c = state.travelCheck.find((x) => x.id === el.dataset.check);
        c.done = !c.done; save(); haptic();
        if (c.done) toast('완료!');
        render();
      };
    });
    $$('[data-del-check]').forEach((el) => {
      el.onclick = (ev) => {
        ev.stopPropagation();
        state.travelCheck = state.travelCheck.filter((x) => x.id !== el.dataset.delCheck);
        save(); render(); toast('삭제했습니다', 'trash');
      };
    });
    const add = $('[data-add-check]');
    if (add) add.onclick = () => {
      openSheet(`
        <h3>체크 항목 추가</h3>
        <div class="field">
          <label class="field-label">내용</label>
          <input class="input" id="ncName" placeholder="예: 인솔자 연락처 저장">
        </div>
        <div class="field">
          <label class="field-label">단계</label>
          <select class="select" id="ncPhase">
            ${CHECK_PHASES.map((p) => `<option ${p === vs.checkPhase ? 'selected' : ''}>${esc(p)}</option>`).join('')}
          </select>
        </div>
        <button class="btn block mt-12" data-save-check>${icon('plus')} 추가하기</button>`);
      $('#ncName').focus();
      $('[data-save-check]').onclick = () => {
        const name = $('#ncName').value.trim();
        if (!name) { toast('내용을 입력해주세요', 'alert-triangle'); return; }
        state.travelCheck.push({ id: uid(), phase: $('#ncPhase').value, name, done: false });
        save(); closeSheet(); render(); toast('추가했습니다');
      };
    };
  },
};

/* ============================================================
   5. 반도체 프로젝트
   ============================================================ */
Views.project = {
  title: '팀 프로젝트',
  get sub() {
    const t = PROJECT_TOPICS.find((x) => x.id === state.projectTopic);
    return t ? t.title : '주제 미정 · 추천 주제 6개 준비됨';
  },

  render() {
    const s = stats.project();
    const topic = PROJECT_TOPICS.find((x) => x.id === state.projectTopic);

    return `
      <div class="card mb-12" style="background:linear-gradient(135deg, rgba(94,92,230,.18), rgba(10,132,255,.12))">
        <div class="card-title">${icon('cpu')} ${esc(topic ? topic.title : '팀 프로젝트')}</div>
        <p class="small muted mt-8">${esc(TRIP.team)}</p>
        <div class="flex gap-8 mt-12" style="flex-wrap:wrap">
          <span class="badge t-company">${icon('users')}팀원 ${TRIP.memberCount}명</span>
          <span class="badge t-activity">${icon('file-text')}${s.done}/${s.total} 섹션 작성</span>
          ${topic ? `<span class="badge t-tour">${icon('check')}주제 확정</span>`
            : `<span class="badge p-mid">${icon('help-circle')}주제 미정</span>`}
        </div>
        ${progressBar(s.done, s.total, 'purple')}
      </div>

      ${!topic ? `
        <div class="card pressable" data-open-topics
             style="border-color:rgba(191,90,242,.45);background:linear-gradient(135deg, rgba(191,90,242,.16), rgba(10,132,255,.08))">
          <div class="flex items-center gap-12">
            <div class="stat-icon" style="margin:0;background:rgba(191,90,242,.22);color:var(--purple)">
              ${icon('sparkles')}
            </div>
            <div class="flex-1">
              <div class="card-title">아직 주제를 안 정했나요?</div>
              <p class="small muted mt-8" style="line-height:1.6">
                이번 일정에 맞춰 짠 <b>추천 주제 ${PROJECT_TOPICS.length}개</b>가 준비되어 있습니다.
                고르면 개요·자료조사·발표구성·역할분담 초안이 자동으로 채워집니다.
              </p>
            </div>
            ${icon('chevron-right')}
          </div>
        </div>` : `
        <div class="card pressable" data-open-topics>
          <div class="flex items-center gap-10">
            ${icon('sparkles')}
            <div class="flex-1">
              <div class="row-title">${esc(topic.emoji)} ${esc(topic.title)}</div>
              <div class="row-sub">주제 변경 · 다른 후보 보기</div>
            </div>
            ${icon('chevron-right')}
          </div>
        </div>`}

      ${this.renderEditor()}

      <div class="section-label">${icon('lightbulb')} 프로젝트 팁</div>
      <div class="card">
        <p class="small muted" style="line-height:1.7">
          · 주제를 고르면 <b>개요 · 자료조사 · 발표자료 · 역할분담</b> 4개 섹션이 초안으로 채워집니다.<br>
          · 탐방 중에는 <b>회의록</b>과 <b>기업별 조사</b>를 그날그날 채우는 게 가장 효율적입니다.<br>
          · 현장에서 들은 말은 <b>[질문] 탭의 답변 메모</b>에 바로 적어두면 보고서로 옮기기 쉽습니다.<br>
          · 귀국 후 <b>보고서 초안</b>은 각 섹션을 이어 붙이면 바로 완성됩니다.
        </p>
      </div>
    `;
  },

  /** 섹션 편집기 */
  renderEditor() {
    const sec = PROJECT_SECTIONS.find((s) => s.id === vs.projectSection) || PROJECT_SECTIONS[0];
    const val = state.project[sec.id] || '';

    return `
      <div class="chip-row mt-12">
        ${PROJECT_SECTIONS.map((x) => {
          const filled = (state.project[x.id] || '').trim().length > 20;
          return `<button class="chip ${x.id === vs.projectSection ? 'active' : ''}" data-psec="${x.id}">
            ${filled ? icon('check') : icon(x.icon)}${esc(x.title)}</button>`;
        }).join('')}
      </div>

      <div class="card">
        <div class="flex items-center justify-between mb-12">
          <div class="card-title">${icon(sec.icon)} ${esc(sec.title)}</div>
          <button class="btn small ghost" data-toggle-preview>
            ${icon(vs.projectPreview ? 'pencil' : 'eye')} ${vs.projectPreview ? '편집' : '미리보기'}
          </button>
        </div>

        ${vs.projectPreview
          ? `<div class="md-preview">${renderMarkdown(val)}</div>`
          : `<textarea class="textarea" id="projArea" style="min-height:320px;font-size:14px"
               placeholder="${esc(sec.placeholder)}">${esc(val)}</textarea>
             <p class="small muted-3 mt-8">${icon('info')} Markdown 지원 · 입력 즉시 자동 저장됩니다</p>`}

        <div class="flex gap-8 mt-12">
          ${!vs.projectPreview && !val.trim()
            ? `<button class="btn ghost small" data-fill-template>${icon('sparkles')} 템플릿 채우기</button>` : ''}
          <button class="btn ghost small" data-copy-sec>${icon('copy')} 복사</button>
        </div>
      </div>`;
  },

  /** 추천 주제 목록 시트 */
  openTopics() {
    openSheet(`
      <h3>${icon('sparkles')} 추천 주제 ${PROJECT_TOPICS.length}개</h3>
      <p class="small muted mb-12" style="line-height:1.6">
        이번 연수 방문지를 기준으로 짠 가안입니다. 회의 때 팀원 ${TRIP.memberCount}명이 함께 보고 고르세요.
        고른 뒤에도 언제든 바꿀 수 있습니다.
      </p>
      ${PROJECT_TOPICS.map((t) => `
        <div class="card pressable" data-topic="${t.id}" style="border-color:${t.color}44">
          <div class="flex gap-10">
            <div class="co-logo" style="background:${t.color}22;color:${t.color};width:40px;height:40px;font-size:19px">
              ${t.emoji}
            </div>
            <div class="flex-1">
              <div class="card-title" style="font-size:14.5px;line-height:1.4">${esc(t.title)}</div>
              <p class="small muted-3" style="margin-top:3px">${esc(t.tagline)}</p>
              <div class="flex gap-6 mt-8" style="flex-wrap:wrap">
                <span class="badge ${t.fit === '높음' ? 't-tour' : 'p-mid'}">일정 적합도 ${esc(t.fit)}</span>
                <span class="badge p-low">${icon('building')}방문지 ${t.visits.length}곳</span>
                ${state.projectTopic === t.id ? `<span class="badge t-company">${icon('check')}선택됨</span>` : ''}
              </div>
            </div>
            ${icon('chevron-right')}
          </div>
        </div>`).join('')}
      <button class="btn ghost block mt-12" data-close-sheet>닫기</button>
    `);

    $$('[data-topic]').forEach((el) => {
      el.onclick = () => this.openTopicDetail(el.dataset.topic);
    });
    $('[data-close-sheet]').onclick = closeSheet;
  },

  /** 주제 상세 + 적용 */
  openTopicDetail(id) {
    const t = PROJECT_TOPICS.find((x) => x.id === id);
    const visits = t.visits.map((v) => COMPANIES.find((c) => c.id === v)).filter(Boolean);
    const bullet = (items, color) => items.map((x) =>
      `<div class="flex gap-8" style="padding:5px 0">
        <span style="color:${color};flex:none">•</span>
        <span class="small" style="line-height:1.6">${esc(x)}</span></div>`).join('');

    openSheet(`
      <button class="btn ghost small mb-12" data-topic-back>${icon('arrow-left')} 목록으로</button>

      <div class="flex gap-10 mb-12">
        <div class="co-logo" style="background:${t.color}22;color:${t.color};width:44px;height:44px;font-size:21px">
          ${t.emoji}
        </div>
        <div class="flex-1">
          <h3 style="margin-bottom:2px">${esc(t.title)}</h3>
          <p class="small muted-3">${esc(t.tagline)}</p>
        </div>
      </div>

      <div class="card" style="border-color:${t.color}55;background:${t.color}10">
        <label class="field-label">핵심 질문</label>
        <p class="small" style="line-height:1.7;font-weight:600">${esc(t.core)}</p>
      </div>

      <div class="section-label">${icon('lightbulb')} 왜 이 주제인가</div>
      <div class="card"><p class="small" style="line-height:1.75">${esc(t.why)}</p></div>

      <div class="section-label">${icon('building')} 활용 방문지</div>
      <div class="card">
        <div class="flex gap-6" style="flex-wrap:wrap">
          ${visits.map((c) => `<span class="badge p-low">${c.emoji} ${esc(c.name)}</span>`).join('')}
        </div>
      </div>

      <div class="section-label">${icon('search')} 조사 방법</div>
      <div class="card">${bullet(t.method, t.color)}</div>

      <div class="section-label">${icon('file-text')} 예상 결과물</div>
      <div class="card">${bullet(t.outcome, t.color)}</div>

      <div class="section-label">${icon('mic')} 발표 목차 (가안)</div>
      <div class="card">
        ${t.outline.map((x, i) => `<div class="flex gap-8" style="padding:5px 0">
          <span class="tabular" style="color:${t.color};flex:none;font-weight:700;width:18px">${i + 1}</span>
          <span class="small" style="line-height:1.6">${esc(x)}</span></div>`).join('')}
      </div>

      <div class="section-label">${icon('users')} 역할분담 (3인)</div>
      <div class="card">${bullet(t.roles, t.color)}</div>

      <div class="section-label">${icon('alert-triangle')} 주의할 점</div>
      <div class="card" style="border-color:rgba(255,159,10,.3)">
        <p class="small" style="line-height:1.75">${esc(t.risk)}</p>
      </div>

      <button class="btn block mt-16" data-apply-topic="${t.id}">
        ${icon('sparkles')} 이 주제로 시작하기
      </button>
      <p class="small muted-3 mt-8" style="text-align:center">
        개요 · 자료조사 · 발표자료 · 역할분담 4개 섹션이 초안으로 채워집니다
      </p>
    `);

    $('[data-topic-back]').onclick = () => this.openTopics();
    $('[data-apply-topic]').onclick = () => this.applyTopic(t);
  },

  /** 주제 초안을 프로젝트 섹션에 채워 넣는다 */
  applyTopic(t) {
    const targets = ['overview', 'research', 'slides', 'roles'];
    const hasContent = targets.some((k) => (state.project[k] || '').trim().length > 20);

    const write = () => {
      targets.forEach((k) => { if (t.seed[k]) state.project[k] = t.seed[k]; });
      state.projectTopic = t.id;
      vs.projectSection = 'overview';
      vs.projectPreview = true;
      save();
      closeSheet();
      render();
      window.scrollTo(0, 0);
      toast('주제와 초안을 적용했습니다', 'sparkles');
    };

    if (hasContent) {
      confirmModal('초안 덮어쓰기',
        '개요 · 자료조사 · 발표자료 · 역할분담에 이미 작성한 내용이 있습니다. 초안으로 덮어쓸까요?',
        write);
    } else {
      write();
    }
  },

  mount() {
    const openT = $('[data-open-topics]');
    if (openT) openT.onclick = () => this.openTopics();

    $$('[data-psec]').forEach((el) => {
      el.onclick = () => { vs.projectSection = el.dataset.psec; render(); };
    });
    const tg = $('[data-toggle-preview]');
    if (tg) tg.onclick = () => { vs.projectPreview = !vs.projectPreview; render(); };

    const area = $('#projArea');
    if (area) {
      area.oninput = (e) => { state.project[vs.projectSection] = e.target.value; save(); };
      // 자동 높이
      area.style.height = 'auto';
      area.style.height = Math.max(320, area.scrollHeight) + 'px';
      area.addEventListener('input', () => {
        area.style.height = 'auto';
        area.style.height = Math.max(320, area.scrollHeight) + 'px';
      });
    }
    const fill = $('[data-fill-template]');
    if (fill) fill.onclick = () => {
      const sec = PROJECT_SECTIONS.find((s) => s.id === vs.projectSection);
      state.project[sec.id] = sec.placeholder;
      save(); render(); toast('템플릿을 불러왔습니다', 'sparkles');
    };
    const copy = $('[data-copy-sec]');
    if (copy) copy.onclick = async () => {
      try {
        await navigator.clipboard.writeText(state.project[vs.projectSection] || '');
        toast('클립보드에 복사했습니다', 'copy');
      } catch { toast('복사에 실패했습니다', 'alert-triangle'); }
    };
  },
};
