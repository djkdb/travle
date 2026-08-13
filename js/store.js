/* ============================================================
   store.js — LocalStorage 기반 상태 관리 (자동 저장)
   단일 키에 전체 상태를 저장하고, 변경 시 debounce 저장한다.
   ============================================================ */

const STORAGE_KEY = 'sv-master-v1';
const SCHEMA_VERSION = 7;

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
  // v7: 준비물·체크리스트를 OT 자료 원문 기준으로 교체.
  //     ※ 사용자가 직접 추가한 항목과 직접 쓴 메모는 그대로 보존한다.
  //        아래 목록은 과거 버전의 시드 항목이며, 이것만 정리 대상이다.
  7: (s) => {
    const OLD_PACK = [
      "$1 지폐 10~15장 (호텔 팁용)", "110V 돼지코 어댑터 x2", "ESTA 승인서 출력본", "USB-C 케이블 x2", "감기약 · 해열제", "개인 처방약",
      "국제학생증 (ISIC)", "기내용 가방", "기내용 백팩", "긴바지 3벌", "긴팔 / 가디건 2장", "노트북 + 충전기", "노트북 충전기 (프리볼트 확인)",
      "달러 현금 ($300~500)", "멀티탭 (USB 포트형)", "면도기", "명함 (네트워킹용)", "모자 · 선글라스", "목베개", "바람막이 / 경량패딩",
      "반팔 티셔츠 5장", "밴드 · 연고", "보조배터리 (100Wh 이하)", "보조배터리 (160Wh 이하)", "비즈니스 캐주얼 1벌", "샴푸·바디워시 (100ml 이하)",
      "소화제 · 지사제", "속옷 · 양말 세트", "속옷·양말 6세트", "수건 1장", "수면 안대 · 귀마개", "수첩 · 펜", "수첩 · 필기도구", "스마트워치 충전기",
      "스킨케어 · 선크림 SPF50+", "앞이 막힌 편한 운동화", "여권 (유효기간 6개월+)", "여권용 증명사진 2매 (예비)", "여행자보험 증서",
      "영문 진단서 · 처방전", "우비 / 여벌 옷", "유심 / eSIM (미국 10일)", "유심 / eSIM / 로밍", "이어폰 / 에어팟", "자기소개 30초 스크립트",
      "작은 한국 기념품", "잠옷", "접이식 에코백", "증명사진 2매", "지퍼백 · 압축팩", "치약 · 칫솔", "카메라 (선택)", "캐리어 (위탁용)",
      "캐리어 자물쇠 (TSA 인증)", "컵라면 · 햇반 (소량)", "텀블러 / 물병", "트래블카드 (트래블월렛 등)", "편한 운동화",
      "항공권 e-티켓 (YP111/YP102)", "호텔 바우처 · 일정표 출력본", "휴대용 우산 / 양산", "휴대용 저울", "휴대폰 고속충전기"
    ];
    const OLD_CHECK = [
      "$1 지폐 10~15장 환전 (호텔 팁용)", "14:30 인천공항 집결 (여유있게 도착!)", "15:30 인천공항 T1 3층 C카운터 집결 (에어프레미아)",
      "ESTA 신청 및 승인 확인 (출발 72시간 전 필수)", "가이드 미팅 장소 확인", "객실 잊은 물건 최종 확인 (충전기!)",
      "구글맵 오프라인 지도 다운로드 (SF · LA · 요세미티)", "귀국 후: 미션수행 결과보고서 제출", "귀중품 금고 보관",
      "기내 가방 확인 (10kg · 55×40×20cm · 액체 100ml 지퍼백)", "기내 입국서류 · 세관신고서 작성", "기업탐방 질문 리스트 최종 정리",
      "달러 현금 환전 (소액권 포함)", "데이터 백업 (설정 탭 → JSON Export)", "도착 시간 기준으로 수면 계획 세우기", "로밍 / 유심 최종 확인",
      "면세 한도 확인 ($800 / 1인)", "명찰 뒷면 호텔명·연락처 확인 (입국심사·비상시 사용)", "명함 / 링크드인 QR 준비", "모닝콜 / 알람 설정 (시차 주의)",
      "모자 벗고 사진 · 양손 지문 촬영", "물 구매 (보안검색 후)", "보안검색 · 출국심사", "보조배터리 기내 가방으로 이동",
      "비거주자(Non-resident) 줄에 도착순으로 서기", "비상구 위치 확인", "성과공유회 결과보고서 작성 (팀별 15분 발표 · PPT 또는 영상)",
      "세관 신고 (과일 · 육류 반입 금지)", "수분 섭취 & 스트레칭", "수하물 수취 (Baggage Claim 번호 확인)", "스마트패스 앱 설치 · 여권/얼굴 등록",
      "시차 적응: 현지 시간으로 시계 변경 (-16시간)", "액체류(와인 · 화장품)는 위탁수하물로", "에어프레미아 홈페이지 회원가입 + 예약 조회",
      "여권 · ESTA · e티켓 소지 확인", "여권 유효기간 6개월 이상 확인", "여행자보험 가입 확인", "영문 자기소개 30초 버전 준비 (네트워킹용)",
      "영문 자기소개 30초 준비 (이름 · 관심분야 — 기업방문마다 필요)", "오픈채팅방 참여 확인 (실시간 공지 채널)", "와이파이 연결 확인",
      "위탁수하물 부치기 (보조배터리 · 라이터 · 전자담배는 빼서 휴대!)", "위탁수하물 부치기 (보조배터리 빼기!)", "유심 / eSIM 구매 및 QR 저장",
      "유심 활성화 & 가족에게 도착 연락", "입국심사 예상 질문 복습 ([영어] 탭)", "입국심사: 방문목적 \"University business tour\" 답변 준비",
      "입국심사: 방문목적은 \"Tour.\" 한 단어로 (인솔자 안내)",
      "지급물품 수령 (명찰 · 소책자 · ESTA · 슬리퍼 · 배기지택 · 110V 플러그 · E-Ticket)", "지문 · 사진 촬영",
      "체크아웃 시 침대 위 $1 놓기 (하우스키핑 팁)", "체크인 & 여권 제시", "카드사에 해외사용 알림 등록", "캐리어 무게 측정",
      "캐리어 무게 측정 (위탁 23kg · 삼면합 158cm 이내)", "캐리어 무게 확인 (쇼핑 후 초과 주의)", "탑승구 위치·시간 확인 (YP111)",
      "트래블카드 달러 충전", "트래블카드 달러 충전 (개인 쇼핑용)", "팀 미팅 최소 1회 진행 (전원 인증샷 → 오픈채팅방, 커피쿠폰 지원)",
      "팀프로젝트 미션수행 계획서 제출", "팁: 침대 위 $1~2 (하우스키핑)"
    ];

    // 이름이 바뀐 항목은 체크 상태를 이어받도록 연결한다 (1:N 허용)
    const RENAMED_PACK = {
      '여권 (유효기간 6개월+)': '여권 / 신분증',
      '여권용 증명사진 2매 (예비)': '여권사진 2매 (예비)',
      '증명사진 2매': '여권사진 2매 (예비)',
      '유심 / eSIM / 로밍': '통신 (유심 / 포켓)',
      '유심 / eSIM (미국 10일)': '통신 (유심 / 포켓)',
      '$1 지폐 10~15장 (호텔 팁용)': '현지화폐 (달러)',
      '달러 현금 ($300~500)': '현지화폐 (달러)',
      '보조배터리 (160Wh 이하)': '보조배터리',
      '보조배터리 (100Wh 이하)': '보조배터리',
      '휴대폰 고속충전기': '충전기',
      '이어폰 / 에어팟': '이어폰',
      '카메라 (선택)': '카메라',
      '목베개': '목 베개',
      '모자 · 선글라스': '모자 / 선글라스',
      '앞이 막힌 편한 운동화': '운동화 / 로퍼',
      '편한 운동화': '운동화 / 로퍼',
      '긴팔 / 가디건 2장': '얇은 외투',
      '바람막이 / 경량패딩': '외투',
      '반팔 티셔츠 5장': '상 / 하의',
      '긴바지 3벌': '상 / 하의',
      '잠옷': '속옷 / 잠옷',
      '속옷 · 양말 세트': ['속옷 / 잠옷', '양말'],
      '속옷·양말 6세트': ['속옷 / 잠옷', '양말'],
      '기타 여벌 옷 / 신발': '기타 여벌 옷 / 신발',
      '우비 / 여벌 옷': '기타 여벌 옷 / 신발',
      '치약 · 칫솔': ['치약', '칫솔'],
      '샴푸·바디워시 (100ml 이하)': '샴푸 / 린스 / 바디',
      '스킨케어 · 선크림 SPF50+': '선크림',
      '개인 처방약': '개인 상비약 (진단서)',
      '소화제 · 지사제': '소화제',
      '감기약 · 해열제': '종합감기약',
      '밴드 · 연고': '밴드',
      '휴대용 우산 / 양산': '휴대용 우산',
      '접이식 에코백': '접이식 간이가방',
      '수첩 · 필기도구': ['수첩', '필기도구'],
      '수첩 · 펜': ['수첩', '필기도구'],
    };
    const RENAMED_CHECK = {
      '유심 / eSIM 구매 및 QR 저장': '통신 준비 — 로밍 · 유심 · 이심 중 선택하여 사전 가입',
      '에어프레미아 홈페이지 회원가입 + 예약 조회': '에어프레미아 홈페이지 회원가입 · 예약 조회 (예약번호 + 영문명)',
      '스마트패스 앱 설치 · 여권/얼굴 등록': '스마트패스 앱 설치 · 여권/얼굴/탑승권 등록',
      '오픈채팅방 참여 확인 (실시간 공지 채널)': '오픈채팅방 참여 확인 (연수 중 실시간 공지 채널)',
      '팀 미팅 최소 1회 진행 (전원 인증샷 → 오픈채팅방, 커피쿠폰 지원)':
        '팀 미팅 최소 1회 진행 (전원 인증샷 → 오픈채팅방, 커피쿠폰 지원 · 팀당 2회)',
      '기업탐방 질문 리스트 최종 정리': '기업방문 전 간략한 자기소개(이름, 관심분야) 및 질문 사전 준비',
      '영문 자기소개 30초 준비 (이름 · 관심분야 — 기업방문마다 필요)':
        '기업방문 전 간략한 자기소개(이름, 관심분야) 및 질문 사전 준비',
      '캐리어 무게 측정 (위탁 23kg · 삼면합 158cm 이내)': '위탁수하물 확인 (1개 · 23kg · 삼면합 158cm)',
      '기내 가방 확인 (10kg · 55×40×20cm · 액체 100ml 지퍼백)':
        '기내 수하물 확인 (1개 · 10kg · 55×40×20cm · 액체 100ml 지퍼백 1개)',
      '15:30 인천공항 T1 3층 C카운터 집결 (에어프레미아)':
        '15:30 인천국제공항 제1터미널 3층 C카운터 집결 (에어프레미아)',
      '지급물품 수령 (명찰 · 소책자 · ESTA · 슬리퍼 · 배기지택 · 110V 플러그 · E-Ticket)':
        '지급물품 수령 (명찰 · 소책자 · ESTA · 호텔용 슬리퍼 · 배기지택 · 110V 플러그 · 항공 E-Ticket)',
      '명찰 뒷면 호텔명·연락처 확인 (입국심사·비상시 사용)': '명찰 뒷면의 호텔명 · 가이드/인솔자 연락처 확인',
      '위탁수하물 부치기 (보조배터리 · 라이터 · 전자담배는 빼서 휴대!)':
        '위탁수하물 부치기 — 보조배터리 · 라이터 · 전자담배는 빼서 휴대',
      '입국심사 예상 질문 복습 ([영어] 탭)': '입국심사 모범답안 복습 ([영어] 탭)',
      '입국심사: 방문목적은 "Tour." 한 단어로 (인솔자 안내)':
        '방문 목적은 "Tour" — 기업방문·교육·대학·연수·프로그램 언급 금지',
      '비거주자(Non-resident) 줄에 도착순으로 서기': '입국심사장 비거주자 줄에 도착순으로 서기',
      '모자 벗고 사진 · 양손 지문 촬영': '모자 벗고 사진 촬영 · 양손 지문 촬영',
      '와이파이 연결 확인': '와이파이 비밀번호 · 조식당 위치 확인',
      '체크아웃 시 침대 위 $1 놓기 (하우스키핑 팁)': '아침 외출 시 베개 위에 1인당 $1 매너팁',
      '캐리어 무게 확인 (쇼핑 후 초과 주의)': '캐리어 무게 확인 (쇼핑 후 23kg 초과 주의)',
      '보조배터리 기내 가방으로 이동': '보조배터리 · 라이터 · 전자담배를 기내 가방으로 이동',
      '액체류(와인 · 화장품)는 위탁수하물로': '출국 시 산 면세품 중 액체는 캐리어에 넣어 위탁',
      '데이터 백업 (설정 탭 → JSON Export)': '데이터 백업 (설정 탭 → JSON 내보내기)',
      '성과공유회 결과보고서 작성 (팀별 15분 발표 · PPT 또는 영상)':
        '성과공유회 결과보고서 작성 (팀별 15분 이내 · PPT 또는 영상)',
      '귀국 후: 미션수행 결과보고서 제출': '성과공유회 결과보고서 작성 (팀별 15분 이내 · PPT 또는 영상)',
    };

    /** 옛 목록을 새 시드에 이어붙인다. 이름이 같거나 RENAMED로 연결되면 상태를 물려받고,
     *  과거 시드에 없던 항목(= 사용자가 직접 추가)은 그대로 남긴다. */
    const merge = (oldArr, seed, renameMap, oldNames, kind) => {
      const items = Array.isArray(oldArr) ? oldArr : [];
      const exact = new Map(items.map((x) => [x.name, x]));
      const viaRename = new Map();
      items.forEach((x) => {
        const t = renameMap[x.name];
        if (!t) return;
        (Array.isArray(t) ? t : [t]).forEach((n) => { if (!viaRename.has(n)) viaRename.set(n, x); });
      });
      const consumed = new Set();
      const merged = seed.map((item) => {
        const prev = exact.get(item.name) || viaRename.get(item.name);
        if (prev) consumed.add(prev);
        if (kind === 'pack') {
          return {
            id: prev?.id || uid(), ...item,
            checked: prev ? !!prev.checked : false,
            bought: prev ? !!prev.bought : false,
            link: prev?.link || '',
            price: prev && prev.price ? prev.price : item.price,
            note: (prev && prev.note) ? prev.note : (item.note || ''),
          };
        }
        return { id: prev?.id || uid(), ...item, done: prev ? !!prev.done : false };
      });
      const custom = items
        .filter((x) => !consumed.has(x) && !oldNames.includes(x.name))
        .map((x) => (kind === 'pack'
          ? { ...x, cat: PACK_CATS.includes(x.cat) ? x.cat : '생필품' }
          : { ...x, phase: CHECK_PHASES.includes(x.phase) ? x.phase : '출국 전' }));
      return [...merged, ...custom];
    };

    s.packing = merge(s.packing, PACKING_SEED, RENAMED_PACK, OLD_PACK, 'pack');
    s.travelCheck = merge(s.travelCheck, TRAVEL_CHECK_SEED, RENAMED_CHECK, OLD_CHECK, 'check');
  },
  // v6: 확인되지 않은 여행자보험 항목 제거 (단체보험 포함 여부 미확인)
  6: (s) => {
    if (Array.isArray(s.packing)) {
      s.packing = s.packing.filter((p) => p.name !== '여행자보험 증서');
    }
    if (Array.isArray(s.travelCheck)) {
      s.travelCheck = s.travelCheck.filter((c) => c.name !== '여행자보험 가입 확인');
    }
  },
  // v5: 8/12 변경 일정표 반영 — Newracom 제외, HP 추가, LAM 날짜 이동, 마감 연장
  5: (s) => {
    if (Array.isArray(s.travelCheck)) {
      s.travelCheck = s.travelCheck.map((c) =>
        (c.name.includes('8/13(목) 12:00까지 팀별 미션수행 계획서')
          ? { ...c, name: '★ 8/14(금) 12:00까지 팀별 미션수행 계획서 제출 (2307soul@naver.com)' }
          : c));
    }
    // 일정에서 빠진 방문지의 질문 기록 정리
    if (s.questions) {
      Object.keys(s.questions)
        .filter((k) => k.startsWith('newracom:') || k.startsWith('phantomai:'))
        .forEach((k) => delete s.questions[k]);
    }
    // 성립하지 않게 된 추천 주제를 골랐다면 해제
    if (s.projectTopic === 'autonomy') s.projectTopic = '';
  },
  // v4: OT 자료(2026.08.04) 반영 — 대행사 지급품 제외, 일정·기업 변경
  4: (s) => {
    // 대행사에서 배부하는 품목은 준비물에서 제거
    const agencyProvided = [
      'ESTA 승인서 출력본',
      '항공권 e-티켓 (YP111/YP102)',
      '호텔 바우처 · 일정표 출력본',
    ];
    if (Array.isArray(s.packing)) {
      s.packing = s.packing.filter((p) => !agencyProvided.includes(p.name));
    }
    if (Array.isArray(s.travelCheck)) {
      const renamed = {
        '14:30 인천공항 집결 (여유있게 도착!)': '15:30 인천공항 T1 3층 C카운터 집결 (에어프레미아)',
        '여권 · ESTA · e티켓 소지 확인': '지급물품 수령 (명찰 · 소책자 · ESTA · 슬리퍼 · 배기지택 · 110V 플러그 · E-Ticket)',
      };
      s.travelCheck = s.travelCheck.map((c) =>
        (renamed[c.name] ? { ...c, name: renamed[c.name] } : c));
    }
    // 일정에서 사라진 기업의 기록은 남겨두되, 참조가 끊긴 질문 기록만 정리
    if (s.questions) {
      Object.keys(s.questions)
        .filter((k) => k.startsWith('enovix:') || k.startsWith('berkeley:'))
        .forEach((k) => delete s.questions[k]);
    }
    // 사라진 추천 주제를 고른 상태였다면 해제
    if (s.projectTopic === 'deathvalley') s.projectTopic = '';
  },
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

/* ---------- 방문 정보 ----------
   기업 카드의 방문 일시는 일정표(SCHEDULE)에서 직접 계산한다.
   기업 쪽에 날짜를 따로 적어두면 일정이 바뀔 때 표기가 어긋나므로,
   출처를 일정표 하나로 고정한다. */

/** 해당 기업이 등장하는 모든 일정 항목 */
function companySchedule(id) {
  const out = [];
  SCHEDULE.forEach((d) => d.items.forEach((it) => {
    if (it.companyId === id) out.push({ ...it, day: d.day, date: d.date });
  }));
  return out;
}

/** "DAY 4 · 8/20 16:30 — 기업방문 4" 형태의 방문 표기 */
function companyVisitLabel(id) {
  const items = companySchedule(id);
  if (!items.length) return '일정 미정';
  const [y, m, d] = items[0].date.split('-').map(Number);
  const times = items.map((i) => i.time).join(' / ');
  // 제목 앞머리의 "기업방문 3 ·" / "프로그램 1 ·" 같은 표기를 뽑아 붙인다
  const tag = (items[0].title.match(/^(기업방문\s*\d+|프로그램\s*\d+)/) || [])[1];
  return `${items[0].day} · ${m}/${d} ${times}${tag ? ` — ${tag}` : ''}`;
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
