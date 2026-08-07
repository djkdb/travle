/* ============================================================
   store.js — LocalStorage 기반 상태 관리 (자동 저장)
   단일 키에 전체 상태를 저장하고, 변경 시 debounce 저장한다.
   ============================================================ */

const STORAGE_KEY = 'sv-master-v1';
const SCHEMA_VERSION = 3;

/** 고유 ID 생성 */
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** 초기(기본) 상태 생성 — 시드 데이터를 사용자 데이터로 변환 */
function createInitialState() {
  return {
    _v: SCHEMA_VERSION,
    theme: 'dark',
    tab: 'dashboard',

    // 일정: id → { done, memo, photos[] }
    schedule: {},

    // 준비물
    packing: PACKING_SEED.map((p) => ({
      id: uid(), ...p, checked: false, bought: false, link: '', note: p.note || '',
    })),

    // 여행 체크리스트
    travelCheck: TRAVEL_CHECK_SEED.map((c) => ({ id: uid(), ...c, done: false })),

    // 반도체 프로젝트: sectionId → markdown
    project: PROJECT_SECTIONS.reduce((acc, s) => { acc[s.id] = ''; return acc; }, {}),
    projectTopic: '',        // 선택한 추천 주제 id

    // 홈 화면 추가 안내 배너를 닫았는지
    installDismissed: false,

    // 기업탐방: companyId → { memo, rating, impressive, learned, photos[] }
    companies: {},

    // 질문: `${companyId}:${index}` → { checked, fav, memo }
    questions: {},

    // 영어: 즐겨찾기 문장 키 집합, 퀴즈 기록
    englishFav: {},
    quiz: { best: 0, played: 0 },

    // 쇼핑
    shopping: SHOPPING_SEED.map((s) => ({ id: uid(), ...s, checked: false })),

    // 경비
    budget: { total: 1500000, rate: 1390 },
    expenses: [],   // { id, date, cat, title, amountUsd, method }

    // 일기: date → { mood, photos[], text, learned, met, oneline }
    diary: {},

    // 자료실
    resources: [],  // { id, type:'link'|'file', title, url, memo, data?, mime?, createdAt }

    // 회의
    meetings: [],   // { id, date, title, attendees, notes, todos:[{id,text,done,owner,priority}] }

    // 앱 설정
    settings: { name: '', memo: '' },
  };
}

/* ---------- 마이그레이션 ----------
   시드 데이터가 바뀌어도 사용자가 체크해둔 기록은 유지한다.
   버전별 변환 함수를 순서대로 적용한다. */
const MIGRATIONS = {
  // v3: 입국심사 답변을 인솔자 안내대로 "Tour." 한 단어로 통일
  3: (s) => {
    if (!Array.isArray(s.travelCheck)) return;
    s.travelCheck = s.travelCheck.map((c) =>
      (c.name === '입국심사: 방문목적 "University business tour" 답변 준비'
        ? { ...c, name: '입국심사: 방문목적은 "Tour." 한 단어로 (인솔자 안내)' }
        : c));
  },
  // v2: 대행사 제공 품목(어댑터)·개인 지참 제외 품목(노트북) 정리, 현금/팁 항목 축소
  2: (s) => {
    const removed = [
      '노트북 + 충전기',
      '노트북 충전기 (프리볼트 확인)',
      '110V 돼지코 어댑터 x2',
    ];
    const renamed = {
      '속옷·양말 6세트': { name: '속옷 · 양말 세트', note: '9박 10일 — 넉넉하게' },
      '달러 현금 ($300~500)': {
        name: '$1 지폐 10~15장 (호텔 팁용)', price: 20000,
        note: '식사·교통·입장료 팁은 대행사 처리. 호텔 체크아웃 시 침대 위 $1만 필요',
      },
    };
    if (Array.isArray(s.packing)) {
      s.packing = s.packing
        .filter((p) => !removed.includes(p.name))
        .map((p) => (renamed[p.name] ? { ...p, ...renamed[p.name] } : p));
    }
    if (Array.isArray(s.travelCheck)) {
      const checkRenamed = {
        '달러 현금 환전 (소액권 포함)': '$1 지폐 10~15장 환전 (호텔 팁용)',
        '트래블카드 달러 충전': '트래블카드 달러 충전 (개인 쇼핑용)',
        '팁: 침대 위 $1~2 (하우스키핑)': '체크아웃 시 침대 위 $1 놓기 (하우스키핑 팁)',
      };
      s.travelCheck = s.travelCheck.map((c) =>
        (checkRenamed[c.name] ? { ...c, name: checkRenamed[c.name] } : c));
    }
  },
};

/** 저장된 상태 로드 + 마이그레이션 */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const saved = JSON.parse(raw);

    // 저장된 버전 이후의 마이그레이션을 순서대로 적용
    const from = saved._v || 1;
    for (let v = from + 1; v <= SCHEMA_VERSION; v++) {
      MIGRATIONS[v]?.(saved);
    }

    // 얕은 병합으로 신규 필드 보강 (앱 업데이트 대응)
    return { ...createInitialState(), ...saved, _v: SCHEMA_VERSION };
  } catch (e) {
    console.warn('상태 로드 실패, 초기화합니다.', e);
    return createInitialState();
  }
}

const state = loadState();

/* ---------- 저장 (debounce) ---------- */
let saveTimer = null;
let saveListeners = [];

function save(immediate = false) {
  clearTimeout(saveTimer);
  const doSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      saveListeners.forEach((fn) => fn());
    } catch (e) {
      // 용량 초과(사진 다수) 대응
      if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
        toast('저장 공간이 가득 찼습니다. 사진을 줄여주세요.', 'alert-triangle');
      } else {
        console.error(e);
      }
    }
  };
  if (immediate) doSave();
  else saveTimer = setTimeout(doSave, 320);
}

function onSave(fn) { saveListeners.push(fn); }

/* ---------- 상태 접근 헬퍼 ---------- */

/** 일정 항목의 사용자 데이터 (없으면 생성) */
function schedEntry(id) {
  if (!state.schedule[id]) state.schedule[id] = { done: false, memo: '', photos: [] };
  return state.schedule[id];
}

/** 기업 사용자 데이터 */
function companyEntry(id) {
  if (!state.companies[id]) {
    state.companies[id] = { memo: '', rating: 0, impressive: '', learned: '', photos: [] };
  }
  return state.companies[id];
}

/** 질문 사용자 데이터 */
function questionEntry(key) {
  if (!state.questions[key]) state.questions[key] = { checked: false, fav: false, memo: '' };
  return state.questions[key];
}

/** 일기 항목 */
function diaryEntry(date) {
  if (!state.diary[date]) {
    state.diary[date] = { mood: '', photos: [], text: '', learned: '', met: '', oneline: '' };
  }
  return state.diary[date];
}

/* ---------- 통계 / 진행률 ---------- */

const pct = (done, total) => (total === 0 ? 0 : Math.round((done / total) * 100));

const stats = {
  packing() {
    const t = state.packing.length;
    return { done: state.packing.filter((p) => p.checked).length, total: t };
  },
  travelCheck() {
    const t = state.travelCheck.length;
    return { done: state.travelCheck.filter((c) => c.done).length, total: t };
  },
  schedule() {
    const all = SCHEDULE.flatMap((d) => d.items);
    return { done: all.filter((i) => state.schedule[i.id]?.done).length, total: all.length };
  },
  questions() {
    let done = 0, total = 0;
    Object.entries(QUESTIONS).forEach(([cid, arr]) => {
      total += arr.length;
      arr.forEach((_, i) => { if (state.questions[`${cid}:${i}`]?.checked) done++; });
    });
    return { done, total };
  },
  shopping() {
    const t = state.shopping.length;
    return { done: state.shopping.filter((s) => s.checked).length, total: t };
  },
  project() {
    const total = PROJECT_SECTIONS.length;
    const done = PROJECT_SECTIONS.filter((s) => (state.project[s.id] || '').trim().length > 20).length;
    return { done, total };
  },
  /** 전체 준비 진행률 — 준비물·체크리스트·질문·프로젝트 가중 평균 */
  overall() {
    const parts = [
      { s: this.packing(), w: 3 },
      { s: this.travelCheck(), w: 3 },
      { s: this.questions(), w: 2 },
      { s: this.project(), w: 2 },
    ];
    const num = parts.reduce((a, p) => a + (p.s.total ? (p.s.done / p.s.total) * p.w : 0), 0);
    const den = parts.reduce((a, p) => a + p.w, 0);
    return Math.round((num / den) * 100);
  },
  /** 경비 합계 (원화 환산) */
  spent() {
    return state.expenses.reduce((a, e) => a + e.amountUsd * state.budget.rate, 0);
  },
};

/* ---------- 날짜 유틸 ---------- */

const KST_OFFSET = 9 * 60; // 분

/** YYYY-MM-DD (로컬) */
function ymd(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 출국까지 남은 일수 (음수면 여행 중/종료) */
function ddayCount() {
  const dep = new Date(TRIP.depart);
  const now = new Date();
  const depDay = new Date(dep.getFullYear(), dep.getMonth(), dep.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((depDay - today) / 86400000);
}

/** 출국까지 남은 시:분:초 */
function countdownParts() {
  const diff = Math.max(0, new Date(TRIP.depart) - new Date());
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

/** 오늘(또는 가장 가까운) 일정 반환 */
function todaySchedule() {
  const today = ymd();
  const exact = SCHEDULE.find((d) => d.date === today);
  if (exact) return { day: exact, isToday: true };
  const upcoming = SCHEDULE.find((d) => d.date > today);
  return { day: upcoming || SCHEDULE[0], isToday: false };
}

/** 날짜 문자열 → "8월 17일 (월)" */
function prettyDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const w = ['일', '월', '화', '수', '목', '금', '토'][dt.getDay()];
  return `${m}월 ${d}일 (${w})`;
}

/* ---------- 데이터 백업 ---------- */

function exportJSON() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `silicon-valley-master-${ymd()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importJSON(file, done) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || typeof data !== 'object') throw new Error('형식 오류');
      Object.keys(state).forEach((k) => delete state[k]);
      Object.assign(state, createInitialState(), data);
      save(true);
      done(true);
    } catch (e) {
      done(false, e.message);
    }
  };
  reader.readAsText(file);
}

function resetAll() {
  localStorage.removeItem(STORAGE_KEY);
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, createInitialState());
  save(true);
}
