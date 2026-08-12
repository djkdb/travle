/* ============================================================
   views2.js — 화면 컴포넌트 (2)
   기업탐방 / 질문 / 영어 / 가이드 / 쇼핑 / 경비 / 일기 / 자료실 / 회의 / 설정
   ============================================================ */

/* ============================================================
   6. 기업탐방
   ============================================================ */
Views.companies = {
  title: '기업탐방',
  sub: `${COMPANIES.length}개 방문지`,

  render() {
    if (vs.companyId) return this.detail(vs.companyId);

    const rated = COMPANIES.filter((c) => (state.companies[c.id]?.rating || 0) > 0).length;
    return `
      <div class="card mb-12">
        <div class="flex items-center justify-between mb-8">
          <div class="card-title">${icon('building')} 탐방 기록</div>
          <b class="tabular">${rated}/${COMPANIES.length}</b>
        </div>
        ${progressBar(rated, COMPANIES.length)}
        <p class="small muted-3 mt-8">방문 후 평가와 메모를 남겨보세요</p>
      </div>

      <div class="stagger">
        ${COMPANIES.map((c) => this.card(c)).join('')}
      </div>`;
  },

  card(c) {
    const e = state.companies[c.id] || {};
    const hasNote = (e.memo || e.impressive || e.learned || '').trim().length > 0;
    return `
      <div class="card co-card pressable" data-co="${c.id}">
        <div class="flex gap-12">
          ${companyLogo(c)}
          <div class="flex-1">
            <div class="flex items-center gap-8">
              <div class="card-title">${esc(c.name)}</div>
              ${e.rating ? `<span class="badge p-mid">${icon('star')}${e.rating}</span>` : ''}
            </div>
            <p class="small muted">${esc(c.ko)} · ${esc(c.field)}</p>
            <p class="small muted-3" style="margin-top:3px">${icon('calendar')} ${esc(c.visit)}</p>
            <div class="co-tags">
              ${c.tags.map((t) => `<span class="badge p-low">${esc(t)}</span>`).join('')}
              ${hasNote ? `<span class="badge t-tour">${icon('pencil')}기록됨</span>` : ''}
            </div>
          </div>
          ${icon('chevron-right')}
        </div>
      </div>`;
  },

  detail(id) {
    const c = COMPANIES.find((x) => x.id === id);
    const e = companyEntry(id);
    const qCount = (QUESTIONS[id] || []).length;
    const qDone = (QUESTIONS[id] || []).filter((_, i) => state.questions[`${id}:${i}`]?.checked).length;

    const section = (title, iconName, items) => `
      <div class="section-label">${icon(iconName)} ${esc(title)}</div>
      <div class="card">
        ${items.map((t) => `<div class="flex gap-8" style="padding:6px 0">
          <span style="color:${c.color};flex:none">•</span>
          <span class="small" style="line-height:1.6">${esc(t)}</span></div>`).join('')}
      </div>`;

    return `
      <button class="btn ghost small mb-12" data-co-back>${icon('arrow-left')} 목록으로</button>

      <div class="card" style="background:linear-gradient(135deg, ${c.color}26, ${c.color}0d)">
        <div class="flex gap-12">
          <button data-co-logo aria-label="로고 변경">${companyLogo(c, 56)}</button>
          <div class="flex-1">
            <div class="card-title" style="font-size:17px">${esc(c.name)}</div>
            <p class="small muted">${esc(c.ko)}</p>
            <div class="co-tags">${c.tags.map((t) => `<span class="badge p-low">${esc(t)}</span>`).join('')}</div>
          </div>
        </div>
        <p class="small muted-3 mt-8">${icon('camera')} 로고를 탭하면 실제 로고 이미지로 바꿀 수 있습니다</p>
        <div class="mt-12">
          <div class="kv"><b>방문</b><span>${esc(c.visit)}</span></div>
          <div class="kv"><b>위치</b><span>${esc(c.location)}</span></div>
          <div class="kv"><b>설립</b><span>${esc(c.founded)}</span></div>
          <div class="kv"><b>분야</b><span>${esc(c.field)}</span></div>
        </div>
      </div>

      <div class="section-label">${icon('info')} 기업 소개</div>
      <div class="card"><p class="small" style="line-height:1.75">${esc(c.intro)}</p></div>

      ${section('핵심 기술', 'cpu', c.tech)}
      ${section('대표 제품 · 성과', 'zap', c.products)}
      ${section('최근 이슈', 'trending-up', c.issues)}

      <div class="section-label">${icon('globe')} 한국과의 관계</div>
      <div class="card"><p class="small" style="line-height:1.75">${esc(c.korea)}</p></div>

      <div class="section-label">${icon('bookmark')} 탐방 목적</div>
      <div class="card" style="border-color:${c.color}55">
        <p class="small" style="line-height:1.75">${esc(c.purpose)}</p>
      </div>

      <div class="card pressable mt-12" data-go-questions="${c.id}">
        <div class="flex items-center gap-10">
          ${icon('help-circle')}
          <div class="flex-1">
            <div class="row-title">준비 질문 ${qCount}개</div>
            <div class="row-sub">${qDone}개 체크 완료</div>
          </div>
          ${icon('chevron-right')}
        </div>
        ${progressBar(qDone, qCount, 'purple')}
      </div>

      <!-- 나의 기록 -->
      <div class="section-label">${icon('pencil')} 나의 탐방 기록</div>
      <div class="card">
        <label class="field-label">평가</label>
        <div class="flex items-center gap-10 mb-12">
          ${ratingStars(e.rating || 0, 'data-rate')}
          <span class="small muted-3">${e.rating ? `${e.rating} / 5` : '아직 평가 없음'}</span>
        </div>

        <div class="field">
          <label class="field-label">인상 깊었던 점</label>
          <textarea class="textarea" id="coImp" style="min-height:78px"
            placeholder="가장 기억에 남는 장면이나 이야기">${esc(e.impressive)}</textarea>
        </div>
        <div class="field">
          <label class="field-label">배운 점</label>
          <textarea class="textarea" id="coLearn" style="min-height:78px"
            placeholder="새로 알게 된 기술·산업 지식">${esc(e.learned)}</textarea>
        </div>
        <div class="field">
          <label class="field-label">자유 메모</label>
          <textarea class="textarea" id="coMemo" style="min-height:78px"
            placeholder="담당자 이름, 질문 답변, 후속 확인할 것">${esc(e.memo)}</textarea>
        </div>

        <label class="field-label">사진</label>
        ${photoGrid(e.photos || [], 'data-co-photo', 'data-co-delphoto')}
      </div>`;
  },

  /** 로고 교체 시트 */
  openLogoSheet(id) {
    const c = COMPANIES.find((x) => x.id === id);
    const e = companyEntry(id);
    openSheet(`
      <h3>${esc(c.name)} 로고</h3>
      <div style="display:flex;justify-content:center;padding:8px 0 16px">
        ${companyLogo(c, 84)}
      </div>
      <p class="small muted mb-12" style="line-height:1.65">
        기업 홈페이지나 검색에서 로고 이미지를 저장한 뒤 올리면 교체됩니다.
        배경이 투명한 PNG가 가장 깔끔합니다. 이미지는 이 기기에만 저장됩니다.
      </p>
      <label class="btn block">
        ${icon('upload')} 로고 이미지 올리기
        <input type="file" accept="image/*" id="coLogoFile" hidden>
      </label>
      ${e.logo ? `<button class="btn danger block mt-8" data-co-logo-reset>
        ${icon('rotate-ccw')} 기본 로고로 되돌리기</button>` : ''}
      <button class="btn ghost block mt-8" data-close-sheet>닫기</button>`);

    $('#coLogoFile').onchange = (ev) => {
      readPhoto(ev.target.files[0], (data) => {
        e.logo = data; save(); closeSheet(); render();
        toast('로고를 변경했습니다', 'check');
      });
    };
    const reset = $('[data-co-logo-reset]');
    if (reset) reset.onclick = () => {
      delete e.logo; save(); closeSheet(); render();
      toast('기본 로고로 되돌렸습니다', 'rotate-ccw');
    };
    $('[data-close-sheet]').onclick = closeSheet;
  },

  mount() {
    $$('[data-co]').forEach((el) => {
      el.onclick = () => { vs.companyId = el.dataset.co; render(); window.scrollTo(0, 0); };
    });
    const back = $('[data-co-back]');
    if (back) back.onclick = () => { vs.companyId = null; render(); window.scrollTo(0, 0); };

    const goQ = $('[data-go-questions]');
    if (goQ) goQ.onclick = () => {
      vs.questionCid = goQ.dataset.goQuestions;
      vs.companyId = null;
      switchTab('questions');
    };

    if (!vs.companyId) return;
    const e = companyEntry(vs.companyId);

    // 로고 교체 (기기에만 저장)
    const logoBtn = $('[data-co-logo]');
    if (logoBtn) logoBtn.onclick = () => this.openLogoSheet(vs.companyId);

    $$('[data-rate]').forEach((b) => {
      b.onclick = () => {
        const n = +b.dataset.rate;
        e.rating = e.rating === n ? 0 : n;
        save(); haptic(12); render();
        if (e.rating) toast(`${e.rating}점으로 평가했습니다`, 'star');
      };
    });
    const bind = (sel, key) => {
      const el = $(sel);
      if (el) el.oninput = (ev) => { e[key] = ev.target.value; save(); };
    };
    bind('#coImp', 'impressive');
    bind('#coLearn', 'learned');
    bind('#coMemo', 'memo');

    const addPhoto = $('[data-co-photo]');
    if (addPhoto) addPhoto.onchange = (ev) => {
      readPhoto(ev.target.files[0], (data) => {
        e.photos = e.photos || [];
        e.photos.push(data); save(); render();
        toast('사진을 추가했습니다', 'camera');
      });
    };
    $$('[data-co-delphoto]').forEach((b) => {
      b.onclick = () => { e.photos.splice(+b.dataset.coDelphoto, 1); save(); render(); };
    });
  },
};

/* ============================================================
   7. 질문 리스트
   ============================================================ */
Views.questions = {
  title: '질문 리스트',
  sub: '방문지별 준비 질문',

  render() {
    const cid = vs.questionCid;
    const co = COMPANIES.find((c) => c.id === cid);
    let list = (QUESTIONS[cid] || []).map((q, i) => ({ q, i, e: state.questions[`${cid}:${i}`] || {} }));
    if (vs.questionFilter === 'todo') list = list.filter((x) => !x.e.checked);
    if (vs.questionFilter === 'fav') list = list.filter((x) => x.e.fav);

    const all = QUESTIONS[cid] || [];
    const done = all.filter((_, i) => state.questions[`${cid}:${i}`]?.checked).length;
    const s = stats.questions();

    return `
      <div class="card mb-12">
        <div class="flex items-center justify-between mb-8">
          <div class="card-title">${icon('help-circle')} 전체 질문 준비</div>
          <b class="tabular">${pct(s.done, s.total)}%</b>
        </div>
        ${progressBar(s.done, s.total, 'purple')}
        <p class="small muted-3 mt-8">${s.done} / ${s.total} 질문 체크</p>
      </div>

      <div class="chip-row">
        ${COMPANIES.filter((c) => QUESTIONS[c.id]).map((c) => {
          const n = QUESTIONS[c.id].length;
          const d = QUESTIONS[c.id].filter((_, i) => state.questions[`${c.id}:${i}`]?.checked).length;
          return `<button class="chip ${c.id === cid ? 'active' : ''}" data-qco="${c.id}">
            ${c.emoji} ${esc(c.name.split(' ')[0])} ${d}/${n}</button>`;
        }).join('')}
      </div>

      <div class="card mb-12" style="background:linear-gradient(135deg, ${co.color}22, ${co.color}0a)">
        <div class="flex items-center gap-12">
          ${companyLogo(co)}
          <div class="flex-1">
            <div class="card-title">${esc(co.name)}</div>
            <p class="small muted">${esc(co.visit)}</p>
          </div>
          <b class="tabular">${done}/${all.length}</b>
        </div>
        ${progressBar(done, all.length, 'purple')}
      </div>

      <div class="segment">
        ${[['all', `전체 ${all.length}`], ['todo', '미체크'], ['fav', '즐겨찾기']].map(([k, v]) =>
          `<button class="${vs.questionFilter === k ? 'active' : ''}" data-qfilter="${k}">${v}</button>`).join('')}
      </div>

      ${list.length ? `<div class="stagger">${list.map(({ q, i, e }) => `
        <div class="row ${e.checked ? 'done' : ''}" style="align-items:flex-start">
          <button data-qcheck="${i}" style="margin-top:2px">${checkbox(e.checked, true)}</button>
          <div class="row-main" data-qmemo="${i}">
            <div class="row-title" style="font-size:14px;line-height:1.55;white-space:normal">
              <span class="muted-3">Q${i + 1}.</span> ${esc(q)}
            </div>
            ${e.memo ? `<div class="row-sub" style="white-space:normal;margin-top:5px">
              ${icon('pencil')} ${esc(e.memo)}</div>` : ''}
          </div>
          <button class="star-btn ${e.fav ? 'on' : ''}" data-qfav="${i}" aria-label="즐겨찾기">${icon('star')}</button>
        </div>`).join('')}</div>`
        : emptyState('해당하는 질문이 없습니다', '필터를 바꿔보세요', 'help-circle')}

      <div class="card mt-16">
        <div class="card-title">${icon('lightbulb')} 질문 잘하는 법</div>
        <p class="small muted mt-8" style="line-height:1.75">
          · 먼저 <b>영어로 질문할 문장</b>을 [영어] 탭에서 확인하세요.<br>
          · 즐겨찾기(★)로 <b>꼭 물어볼 3개</b>를 골라두면 현장에서 헤매지 않습니다.<br>
          · 답변은 각 질문의 <b>메모</b>에 바로 적어두면 보고서 작성이 쉬워집니다.
        </p>
      </div>`;
  },

  mount() {
    $$('[data-qco]').forEach((el) => {
      el.onclick = () => { vs.questionCid = el.dataset.qco; render(); window.scrollTo(0, 0); };
    });
    $$('[data-qfilter]').forEach((el) => {
      el.onclick = () => { vs.questionFilter = el.dataset.qfilter; render(); };
    });
    $$('[data-qcheck]').forEach((el) => {
      el.onclick = (ev) => {
        ev.stopPropagation();
        const e = questionEntry(`${vs.questionCid}:${el.dataset.qcheck}`);
        e.checked = !e.checked; save(); haptic(); render();
      };
    });
    $$('[data-qfav]').forEach((el) => {
      el.onclick = (ev) => {
        ev.stopPropagation();
        const e = questionEntry(`${vs.questionCid}:${el.dataset.qfav}`);
        e.fav = !e.fav; save(); haptic(12); render();
        if (e.fav) toast('즐겨찾기에 추가했습니다', 'star');
      };
    });
    $$('[data-qmemo]').forEach((el) => {
      el.onclick = () => {
        const i = +el.dataset.qmemo;
        const key = `${vs.questionCid}:${i}`;
        const e = questionEntry(key);
        const q = QUESTIONS[vs.questionCid][i];
        openSheet(`
          <h3>Q${i + 1}</h3>
          <p class="small" style="line-height:1.65;margin-bottom:14px">${esc(q)}</p>
          <div class="field">
            <label class="field-label">답변 · 메모</label>
            <textarea class="textarea" id="qMemo" style="min-height:130px"
              placeholder="현장에서 들은 답변을 기록하세요">${esc(e.memo)}</textarea>
          </div>
          <div class="grid-2">
            <button class="btn ${e.checked ? 'green' : 'ghost'}" data-q-tg-check>
              ${icon('check')} ${e.checked ? '체크됨' : '체크'}
            </button>
            <button class="btn ${e.fav ? '' : 'ghost'}" data-q-tg-fav>
              ${icon('star')} ${e.fav ? '즐겨찾기' : '즐겨찾기 추가'}
            </button>
          </div>
          <button class="btn ghost block mt-12" data-close-sheet>닫기</button>`);
        $('#qMemo').oninput = (ev) => { e.memo = ev.target.value; save(); };
        $('[data-q-tg-check]').onclick = () => { e.checked = !e.checked; save(); closeSheet(); render(); };
        $('[data-q-tg-fav]').onclick = () => { e.fav = !e.fav; save(); closeSheet(); render(); };
        $('[data-close-sheet]').onclick = () => { closeSheet(); render(); };
      };
    });
  },
};

/* ============================================================
   8. 영어
   ============================================================ */
Views.english = {
  title: '영어',
  sub: '여행 · 비즈니스 · 기술 영어',

  render() {
    const group = ENGLISH.find((g) => g.cat === vs.engCat) || ENGLISH[0];
    const favCount = Object.values(state.englishFav).filter(Boolean).length;

    let phrases = group.phrases.map((p, i) => ({ ...p, key: `${group.cat}:${i}` }));
    if (vs.engFavOnly) {
      phrases = ENGLISH.flatMap((g) => g.phrases.map((p, i) => ({ ...p, cat: g.cat, key: `${g.cat}:${i}` })))
        .filter((p) => state.englishFav[p.key]);
    }

    return `
      <div class="card mb-12" style="background:linear-gradient(135deg, rgba(100,210,255,.18), rgba(10,132,255,.10))">
        <div class="flex items-center justify-between">
          <div>
            <div class="card-title">${icon('languages')} 영어 회화</div>
            <p class="small muted mt-8">
              총 ${ENGLISH.reduce((a, g) => a + g.phrases.length, 0)}개 표현 · 즐겨찾기 ${favCount}개
            </p>
          </div>
          ${icon('mic')}
        </div>
        <div class="grid-2 mt-12">
          <button class="btn small" data-quiz>${icon('sparkles')} 퀴즈 풀기</button>
          <button class="btn small ${vs.engFavOnly ? '' : 'ghost'}" data-fav-only>
            ${icon('star')} 즐겨찾기${vs.engFavOnly ? ' 보는 중' : ''}
          </button>
        </div>
        ${state.quiz.played ? `<p class="small muted-3 mt-8">
          퀴즈 ${state.quiz.played}회 · 최고 ${state.quiz.best}점</p>` : ''}
      </div>

      ${vs.engFavOnly ? '' : `
        <div class="chip-row">
          ${ENGLISH.map((g) => `<button class="chip ${g.cat === vs.engCat ? 'active' : ''}" data-engcat="${esc(g.cat)}">
            ${icon(g.icon)}${esc(g.cat)}</button>`).join('')}
        </div>`}

      ${phrases.length ? `<div class="stagger">${phrases.map((p) => `
        <div class="card">
          <div class="flex gap-10">
            <div class="flex-1">
              ${vs.engFavOnly ? `<span class="badge t-company mb-8" style="display:inline-flex">${esc(p.cat)}</span>` : ''}
              <div class="phrase-en">${esc(p.en)}</div>
              <div class="phrase-ko">${esc(p.ko)}</div>
              ${p.tip ? `<div class="phrase-tip">${icon('lightbulb')}<span>${esc(p.tip)}</span></div>` : ''}
            </div>
            <div class="flex" style="flex-direction:column;gap:2px">
              <button class="star-btn ${state.englishFav[p.key] ? 'on' : ''}" data-engfav="${esc(p.key)}"
                aria-label="즐겨찾기">${icon('star')}</button>
              <button class="star-btn" data-speak="${esc(p.en)}" aria-label="발음 듣기">${icon('mic')}</button>
            </div>
          </div>
        </div>`).join('')}</div>`
        : emptyState('즐겨찾기한 표현이 없습니다', '★ 버튼으로 추가해보세요', 'star')}
    `;
  },

  mount() {
    $$('[data-engcat]').forEach((el) => {
      el.onclick = () => { vs.engCat = el.dataset.engcat; render(); window.scrollTo(0, 0); };
    });
    const fo = $('[data-fav-only]');
    if (fo) fo.onclick = () => { vs.engFavOnly = !vs.engFavOnly; render(); };

    $$('[data-engfav]').forEach((el) => {
      el.onclick = () => {
        const k = el.dataset.engfav;
        state.englishFav[k] = !state.englishFav[k];
        save(); haptic(12); render();
      };
    });
    $$('[data-speak]').forEach((el) => {
      el.onclick = () => {
        const text = el.dataset.speak;
        if (!('speechSynthesis' in window)) { toast('이 기기는 음성을 지원하지 않습니다', 'alert-triangle'); return; }
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US'; u.rate = 0.92;
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      };
    });
    const q = $('[data-quiz]');
    if (q) q.onclick = () => this.startQuiz();
  },

  /** 영↔한 4지선다 퀴즈 (10문항) */
  startQuiz() {
    const pool = ENGLISH.flatMap((g) => g.phrases);
    const questions = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
    let idx = 0, score = 0;

    const show = () => {
      const q = questions[idx];
      const wrong = pool.filter((p) => p.ko !== q.ko).sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [q, ...wrong].sort(() => Math.random() - 0.5);

      openModal(`퀴즈 ${idx + 1} / ${questions.length}`, `
        <div class="card mb-12" style="text-align:center;padding:22px 16px">
          <div class="phrase-en" style="font-size:17px">${esc(q.en)}</div>
        </div>
        <p class="small muted-3 mb-8">알맞은 뜻을 고르세요</p>
        <div id="quizOpts">
          ${options.map((o) => `<button class="quiz-option" data-ans="${esc(o.ko)}">${esc(o.ko)}</button>`).join('')}
        </div>
        <div class="flex justify-between mt-12">
          <span class="small muted-3">점수 ${score}</span>
          <span class="small muted-3">${idx + 1} / ${questions.length}</span>
        </div>`, 'sparkles');

      $$('[data-ans]').forEach((btn) => {
        btn.onclick = () => {
          const correct = btn.dataset.ans === q.ko;
          if (correct) { btn.classList.add('correct'); score++; haptic(10); }
          else {
            btn.classList.add('wrong');
            $$('[data-ans]').find((b) => b.dataset.ans === q.ko)?.classList.add('correct');
            haptic(30);
          }
          $$('[data-ans]').forEach((b) => { b.onclick = null; });
          setTimeout(() => {
            idx++;
            if (idx < questions.length) show();
            else finish();
          }, 780);
        };
      });
    };

    const finish = () => {
      state.quiz.played++;
      state.quiz.best = Math.max(state.quiz.best, score);
      save();
      const msg = score >= 9 ? '완벽합니다! 🎉' : score >= 7 ? '훌륭해요! 👏' : score >= 5 ? '좋아요, 조금만 더!' : '복습이 필요해요 💪';
      openModal('퀴즈 완료', `
        <div style="text-align:center;padding:14px 0 20px">
          <div class="money-big">${score} <span class="muted-3" style="font-size:18px">/ ${questions.length}</span></div>
          <p class="muted mt-8">${msg}</p>
          <p class="small muted-3 mt-8">최고 기록 ${state.quiz.best}점 · 총 ${state.quiz.played}회</p>
        </div>
        <div class="flex gap-8">
          <button class="btn ghost flex-1" data-quiz-close>닫기</button>
          <button class="btn flex-1" data-quiz-again>${icon('repeat')} 다시 풀기</button>
        </div>`, 'sparkles');
      $('[data-quiz-close]').onclick = () => { closeModal(); render(); };
      $('[data-quiz-again]').onclick = () => { closeModal(); this.startQuiz(); };
    };

    show();
  },
};

/* ============================================================
   9. 캘리포니아 가이드
   ============================================================ */
Views.guide = {
  title: '캘리포니아 가이드',
  sub: '날씨 · 문화 · 안전 · 비상연락',

  render() {
    return `
      <div class="card mb-12" style="background:linear-gradient(135deg, rgba(255,159,10,.18), rgba(255,214,10,.10))">
        <div class="card-title">${icon('map')} 캘리포니아 생존 가이드</div>
        <p class="small muted mt-8" style="line-height:1.65">
          8월 중순 미국 서부는 낮엔 덥고 아침저녁엔 서늘합니다.<br>
          <b>레이어링 · 선크림 · 팁 문화</b> 세 가지만 기억하세요.
        </p>
      </div>

      ${GUIDE.map((g) => `
        <div class="card pressable" data-guide="${g.id}">
          <div class="flex items-center gap-10">
            <div class="stat-icon" style="background:${g.color}22;color:${g.color};margin:0">${icon(g.icon)}</div>
            <div class="flex-1">
              <div class="card-title" style="font-size:14.5px">${esc(g.title)}</div>
              <p class="small muted-3">${g.rows.length}개 항목</p>
            </div>
            <span style="transition:transform .25s;display:inline-flex;${vs.guideOpen === g.id ? 'transform:rotate(90deg)' : ''}">
              ${icon('chevron-right')}
            </span>
          </div>
          ${vs.guideOpen === g.id ? `<div class="mt-12">
            ${g.rows.map(([k, v]) => `<div class="kv"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join('')}
          </div>` : ''}
        </div>`).join('')}

      <div class="section-label">${icon('bed')} 숙소 연락처</div>
      ${HOTELS.map((h) => `
        <div class="card">
          <div class="flex items-center justify-between mb-8">
            <div class="flex-1">
              <div class="card-title" style="font-size:14px">${esc(h.name)}</div>
              <p class="small muted-3" style="margin-top:2px">${esc(h.city)} · ${esc(h.nights)}</p>
            </div>
          </div>
          <p class="small muted" style="line-height:1.6">${icon('map')} ${esc(h.addr)}</p>
          <div class="flex gap-6 mt-8" style="flex-wrap:wrap">
            ${h.amenities.map((a) => `<span class="badge p-low">${esc(a)}</span>`).join('')}
          </div>
          ${h.note ? `<p class="small muted-3 mt-8" style="line-height:1.55">${icon('info')} ${esc(h.note)}</p>` : ''}
          <a class="btn ghost small block mt-12" href="tel:${esc(h.tel.replace(/[^+\d]/g, ''))}">
            ${icon('phone')} ${esc(h.tel)}
          </a>
        </div>`).join('')}

      <div class="card mt-12" style="border-color:rgba(255,69,58,.35)">
        <div class="card-title" style="color:var(--red)">${icon('phone')} 긴급 상황 시</div>
        <div class="grid-2 mt-12">
          <a class="btn danger" href="tel:911">${icon('ambulance')} 911</a>
          <a class="btn ghost" href="tel:+82232100404">${icon('phone')} 영사콜센터</a>
        </div>
        <p class="small muted-3 mt-8">번호를 누르면 바로 전화 앱이 열립니다</p>
      </div>`;
  },

  mount() {
    $$('[data-guide]').forEach((el) => {
      el.onclick = (ev) => {
        if (ev.target.closest('a')) return;
        vs.guideOpen = vs.guideOpen === el.dataset.guide ? null : el.dataset.guide;
        render();
      };
    });
  },
};

/* ============================================================
   10. 쇼핑
   ============================================================ */
Views.shopping = {
  title: '쇼핑',
  sub: '기념품 · 선물 리스트',

  render() {
    const s = stats.shopping();
    const places = ['전체', ...new Set(state.shopping.map((x) => x.place))];
    let list = state.shopping;
    if (vs.shopPlace !== '전체') list = list.filter((x) => x.place === vs.shopPlace);

    const totalUsd = list.reduce((a, x) => a + (x.price || 0), 0);
    const boughtUsd = list.filter((x) => x.checked).reduce((a, x) => a + (x.price || 0), 0);

    return `
      <div class="card mb-12">
        <div class="flex items-center justify-between mb-8">
          <div class="card-title">${icon('shopping-bag')} 쇼핑 진행률</div>
          <b class="tabular">${pct(s.done, s.total)}%</b>
        </div>
        ${progressBar(s.done, s.total, 'orange')}
        <div class="flex justify-between mt-8">
          <span class="small muted-3">구매 ${usd(boughtUsd)}</span>
          <span class="small muted-3">전체 예상 ${usd(totalUsd)} ≈ ${won(totalUsd * state.budget.rate)}</span>
        </div>
      </div>

      <div class="chip-row">
        ${places.map((p) => `<button class="chip ${vs.shopPlace === p ? 'active' : ''}" data-shopplace="${esc(p)}">
          ${esc(p)}</button>`).join('')}
      </div>

      <div class="stagger">
        ${list.map((x) => `
          <div class="row ${x.checked ? 'done' : ''}">
            <button data-shopcheck="${x.id}">${checkbox(x.checked)}</button>
            <div class="row-main">
              <div class="row-title">${esc(x.name)}</div>
              <div class="row-sub">
                <span class="badge p-low">${esc(x.place)}</span>
                ${x.price ? ` ${usd(x.price)}` : ''}
                ${x.note ? ` · ${esc(x.note)}` : ''}
              </div>
            </div>
            <button class="icon-btn" data-shopdel="${x.id}" aria-label="삭제">${icon('trash')}</button>
          </div>`).join('')}
      </div>

      <button class="btn ghost block mt-16" data-shopadd>${icon('plus')} 쇼핑 항목 추가</button>

      <div class="card mt-16">
        <div class="card-title">${icon('info')} 쇼핑 팁</div>
        <p class="small muted mt-8" style="line-height:1.75">
          · 미국은 <b>가격표에 세금이 없습니다</b>. 계산 시 약 9~10%가 더 붙습니다.<br>
          · 액체류(꿀·잼·와인)는 반드시 <b>위탁수하물</b>로 부치세요.<br>
          · 면세 한도는 1인 <b>$800</b>입니다.<br>
          · 캐리어 여유 공간을 미리 확보하거나 접이식 가방을 챙기세요.
        </p>
      </div>`;
  },

  mount() {
    $$('[data-shopplace]').forEach((el) => {
      el.onclick = () => { vs.shopPlace = el.dataset.shopplace; render(); };
    });
    $$('[data-shopcheck]').forEach((el) => {
      el.onclick = () => {
        const x = state.shopping.find((y) => y.id === el.dataset.shopcheck);
        x.checked = !x.checked; save(); haptic(); render();
      };
    });
    $$('[data-shopdel]').forEach((el) => {
      el.onclick = () => {
        state.shopping = state.shopping.filter((y) => y.id !== el.dataset.shopdel);
        save(); render(); toast('삭제했습니다', 'trash');
      };
    });
    const add = $('[data-shopadd]');
    if (add) add.onclick = () => {
      openSheet(`
        <h3>쇼핑 항목 추가</h3>
        <div class="field"><label class="field-label">품목</label>
          <input class="input" id="nsName" placeholder="예: 스탠퍼드 머그컵"></div>
        <div class="field"><label class="field-label">장소</label>
          <input class="input" id="nsPlace" placeholder="예: Stanford" value="${esc(vs.shopPlace === '전체' ? '' : vs.shopPlace)}"></div>
        <div class="field"><label class="field-label">예상 가격 ($)</label>
          <input class="input" id="nsPrice" type="number" inputmode="decimal" placeholder="0"></div>
        <div class="field"><label class="field-label">메모</label>
          <input class="input" id="nsNote" placeholder="선택"></div>
        <button class="btn block mt-12" data-shopsave>${icon('plus')} 추가하기</button>`);
      $('#nsName').focus();
      $('[data-shopsave]').onclick = () => {
        const name = $('#nsName').value.trim();
        if (!name) { toast('품목을 입력해주세요', 'alert-triangle'); return; }
        state.shopping.unshift({
          id: uid(), name, place: $('#nsPlace').value.trim() || '기타',
          price: +$('#nsPrice').value || 0, note: $('#nsNote').value.trim(), checked: false,
        });
        save(); closeSheet(); render(); toast('추가했습니다');
      };
    };
  },
};

/* ============================================================
   11. 경비
   ============================================================ */
Views.budget = {
  title: '경비',
  sub: '예산 · 지출 · 환율 계산기',

  render() {
    const rate = state.budget.rate;
    const spentWon = stats.spent();
    const remain = state.budget.total - spentWon;
    const spentUsd = state.expenses.reduce((a, e) => a + e.amountUsd, 0);

    const byCat = EXPENSE_CATS.map((c) => ({
      cat: c,
      sum: state.expenses.filter((e) => e.cat === c).reduce((a, e) => a + e.amountUsd, 0),
    })).filter((x) => x.sum > 0).sort((a, b) => b.sum - a.sum);

    const byMethod = ['카드', '현금'].map((m) => ({
      m, sum: state.expenses.filter((e) => e.method === m).reduce((a, e) => a + e.amountUsd, 0),
    }));

    const sorted = [...state.expenses].sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));

    return `
      <div class="card" style="background:linear-gradient(135deg, rgba(48,209,88,.18), rgba(10,132,255,.10))">
        <p class="small muted">남은 예산</p>
        <div class="money-big ${remain >= 0 ? 'money-pos' : 'money-neg'}">${won(remain)}</div>
        <p class="small muted-3 mt-8">
          예산 ${won(state.budget.total)} · 사용 ${won(spentWon)} (${usd(spentUsd)})
        </p>
        ${progressBar(Math.min(spentWon, state.budget.total), state.budget.total,
          spentWon > state.budget.total * 0.85 ? 'orange' : 'green')}
        <div class="grid-2 mt-12">
          <button class="btn small ghost" data-edit-budget>${icon('pencil')} 예산 설정</button>
          <button class="btn small" data-add-exp>${icon('plus')} 지출 추가</button>
        </div>
      </div>

      <!-- 환율 계산기 -->
      <div class="section-label">${icon('repeat')} 환율 계산기</div>
      <div class="card">
        <div class="exch-box mb-12">
          <div class="flex-1">
            <label class="field-label">USD</label>
            <input class="input" id="exUsd" type="number" inputmode="decimal" placeholder="0" value="10">
          </div>
          <div class="exch-mid" style="margin-top:18px">${icon('repeat')}</div>
          <div class="flex-1">
            <label class="field-label">KRW</label>
            <input class="input" id="exKrw" type="number" inputmode="numeric" placeholder="0">
          </div>
        </div>
        <label class="field-label">적용 환율 (1 USD = ? KRW)</label>
        <input class="input" id="exRate" type="number" inputmode="numeric" value="${rate}">
        <div class="chip-row mt-12" style="padding-bottom:0">
          ${[1, 5, 10, 20, 50, 100].map((v) => `<button class="chip" data-quick-usd="${v}">$${v}</button>`).join('')}
        </div>
        <p class="small muted-3 mt-8">
          ${icon('info')} 팁 계산: 식사 금액 × 1.2 ≈ 팁 포함 총액 (20% 기준)
        </p>
      </div>

      <!-- 카테고리별 -->
      ${byCat.length ? `
        <div class="section-label">${icon('pie-chart')} 카테고리별 지출</div>
        <div class="card">
          ${byCat.map((x) => `
            <div style="margin-bottom:10px">
              <div class="flex justify-between mb-8">
                <span class="small">${esc(x.cat)}</span>
                <span class="small tabular muted">${usd(x.sum)} · ${won(x.sum * rate)}</span>
              </div>
              ${progressBar(x.sum, spentUsd || 1)}
            </div>`).join('')}
          <div class="kv mt-8"><b>카드</b><span class="tabular">${usd(byMethod[0].sum)}</span></div>
          <div class="kv"><b>현금</b><span class="tabular">${usd(byMethod[1].sum)}</span></div>
        </div>` : ''}

      <!-- 지출 내역 -->
      <div class="section-label">${icon('wallet')} 지출 내역 ${state.expenses.length ? `(${state.expenses.length})` : ''}</div>
      ${sorted.length ? `<div class="stagger">${sorted.map((e) => `
        <div class="row">
          <div class="stat-icon" style="margin:0;background:var(--chip-bg);width:38px;height:38px">
            ${icon(e.method === '카드' ? 'banknote' : 'dollar-sign')}
          </div>
          <div class="row-main">
            <div class="row-title">${esc(e.title)}</div>
            <div class="row-sub">${esc(e.date)} · ${esc(e.cat)} · ${esc(e.method)}</div>
          </div>
          <div class="text-right">
            <div class="row-title tabular">${usd(e.amountUsd)}</div>
            <div class="row-sub tabular">${won(e.amountUsd * rate)}</div>
          </div>
          <button class="icon-btn" data-expdel="${e.id}" aria-label="삭제">${icon('trash')}</button>
        </div>`).join('')}</div>`
        : `<div class="card">${emptyState('지출 내역이 없습니다', '+ 버튼으로 추가하세요', 'wallet')}</div>`}
    `;
  },

  mount() {
    const usdEl = $('#exUsd'), krwEl = $('#exKrw'), rateEl = $('#exRate');
    const sync = (from) => {
      const r = +rateEl.value || 1;
      if (from === 'usd') krwEl.value = Math.round((+usdEl.value || 0) * r);
      else usdEl.value = ((+krwEl.value || 0) / r).toFixed(2);
    };
    if (usdEl) {
      sync('usd');
      usdEl.oninput = () => sync('usd');
      krwEl.oninput = () => sync('krw');
      rateEl.oninput = () => {
        state.budget.rate = +rateEl.value || 1390; save(); sync('usd');
      };
      $$('[data-quick-usd]').forEach((b) => {
        b.onclick = () => { usdEl.value = b.dataset.quickUsd; sync('usd'); haptic(); };
      });
    }

    const eb = $('[data-edit-budget]');
    if (eb) eb.onclick = () => {
      openSheet(`
        <h3>예산 설정</h3>
        <div class="field"><label class="field-label">전체 예산 (원)</label>
          <input class="input" id="bTotal" type="number" inputmode="numeric" value="${state.budget.total}"></div>
        <div class="field"><label class="field-label">적용 환율 (1 USD = ? KRW)</label>
          <input class="input" id="bRate" type="number" inputmode="numeric" value="${state.budget.rate}"></div>
        <button class="btn block mt-12" data-bsave>${icon('check')} 저장</button>`);
      $('[data-bsave]').onclick = () => {
        state.budget.total = +$('#bTotal').value || 0;
        state.budget.rate = +$('#bRate').value || 1390;
        save(); closeSheet(); render(); toast('예산을 저장했습니다');
      };
    };

    const ae = $('[data-add-exp]');
    if (ae) ae.onclick = () => {
      openSheet(`
        <h3>지출 추가</h3>
        <div class="field"><label class="field-label">내용</label>
          <input class="input" id="neTitle" placeholder="예: In-N-Out 점심"></div>
        <div class="field"><label class="field-label">금액 (USD)</label>
          <input class="input" id="neAmt" type="number" inputmode="decimal" placeholder="0.00"></div>
        <div class="field"><label class="field-label">카테고리</label>
          <select class="select" id="neCat">${EXPENSE_CATS.map((c) => `<option>${esc(c)}</option>`).join('')}</select></div>
        <div class="field"><label class="field-label">결제 수단</label>
          <select class="select" id="neMethod"><option>카드</option><option>현금</option></select></div>
        <div class="field"><label class="field-label">날짜</label>
          <input class="input" id="neDate" type="date" value="${ymd()}"></div>
        <button class="btn block mt-12" data-esave>${icon('plus')} 추가하기</button>`);
      $('#neTitle').focus();
      $('[data-esave]').onclick = () => {
        const title = $('#neTitle').value.trim();
        const amt = +$('#neAmt').value;
        if (!title || !amt) { toast('내용과 금액을 입력해주세요', 'alert-triangle'); return; }
        state.expenses.push({
          id: uid(), title, amountUsd: amt, cat: $('#neCat').value,
          method: $('#neMethod').value, date: $('#neDate').value,
        });
        save(); closeSheet(); render(); toast('지출을 추가했습니다');
      };
    };

    $$('[data-expdel]').forEach((el) => {
      el.onclick = () => {
        state.expenses = state.expenses.filter((x) => x.id !== el.dataset.expdel);
        save(); render(); toast('삭제했습니다', 'trash');
      };
    });
  },
};

/* ============================================================
   12. 일기
   ============================================================ */
Views.diary = {
  title: '일기',
  sub: '하루의 기록',

  render() {
    const d = diaryEntry(vs.diaryDate);
    const written = Object.entries(state.diary)
      .filter(([, v]) => (v.text || v.oneline || v.learned || '').trim() || (v.photos || []).length)
      .map(([k]) => k).sort().reverse();

    const tripDates = SCHEDULE.map((s) => s.date);

    return `
      <div class="card mb-12" style="background:linear-gradient(135deg, rgba(191,90,242,.18), rgba(255,55,95,.10))">
        <div class="flex items-center justify-between">
          <div>
            <div class="card-title">${icon('book-open')} 여행 일기</div>
            <p class="small muted mt-8">${written.length}일 기록 완료</p>
          </div>
          ${icon('heart')}
        </div>
      </div>

      <div class="chip-row">
        ${tripDates.map((dt, i) => {
          const has = written.includes(dt);
          return `<button class="chip ${dt === vs.diaryDate ? 'active' : ''}" data-diarydate="${dt}">
            ${has ? icon('check') : ''}D${i + 1} ${dt.slice(5).replace('-', '/')}</button>`;
        }).join('')}
        <button class="chip ${!tripDates.includes(vs.diaryDate) ? 'active' : ''}" data-diarydate="${ymd()}">오늘</button>
      </div>

      <div class="card">
        <div class="card-title mb-12">${icon('calendar')} ${esc(prettyDate(vs.diaryDate))}</div>

        <label class="field-label">오늘의 기분</label>
        <div class="mood-row mb-12">
          ${MOODS.map((m) => `<button class="mood-btn ${d.mood === m ? 'on' : ''}" data-mood="${m}">${m}</button>`).join('')}
        </div>

        <div class="field">
          <label class="field-label">${icon('pencil')} 오늘의 한 줄</label>
          <input class="input" id="dOne" placeholder="오늘을 한 문장으로" value="${esc(d.oneline)}">
        </div>
        <div class="field">
          <label class="field-label">${icon('lightbulb')} 오늘 배운 것</label>
          <textarea class="textarea" id="dLearn" style="min-height:78px"
            placeholder="기업탐방·강연에서 새로 알게 된 것">${esc(d.learned)}</textarea>
        </div>
        <div class="field">
          <label class="field-label">${icon('users')} 오늘 만난 사람</label>
          <textarea class="textarea" id="dMet" style="min-height:70px"
            placeholder="이름 / 소속 / 나눈 이야기 — 나중에 연락할 때 큰 도움이 됩니다">${esc(d.met)}</textarea>
        </div>
        <div class="field">
          <label class="field-label">${icon('book-open')} 자유 기록</label>
          <textarea class="textarea" id="dText" style="min-height:120px"
            placeholder="오늘 있었던 일, 느낀 점">${esc(d.text)}</textarea>
        </div>

        <label class="field-label">${icon('camera')} 사진</label>
        ${photoGrid(d.photos || [], 'data-diary-photo', 'data-diary-delphoto')}
      </div>

      ${written.length ? `
        <div class="section-label">${icon('clock')} 지난 기록</div>
        <div class="stagger">
          ${written.filter((k) => k !== vs.diaryDate).map((k) => {
            const v = state.diary[k];
            return `<div class="row" data-diaryopen="${k}">
              <span style="font-size:22px">${v.mood || '📝'}</span>
              <div class="row-main">
                <div class="row-title">${esc(prettyDate(k))}</div>
                <div class="row-sub ellipsis">${esc(v.oneline || v.text || v.learned || '기록됨')}</div>
              </div>
              ${(v.photos || []).length ? `<span class="badge p-low">${icon('camera')}${v.photos.length}</span>` : ''}
              ${icon('chevron-right')}
            </div>`;
          }).join('')}
        </div>` : ''}
    `;
  },

  mount() {
    const d = diaryEntry(vs.diaryDate);
    $$('[data-diarydate]').forEach((el) => {
      el.onclick = () => { vs.diaryDate = el.dataset.diarydate; render(); window.scrollTo(0, 0); };
    });
    $$('[data-diaryopen]').forEach((el) => {
      el.onclick = () => { vs.diaryDate = el.dataset.diaryopen; render(); window.scrollTo(0, 0); };
    });
    $$('[data-mood]').forEach((el) => {
      el.onclick = () => {
        d.mood = d.mood === el.dataset.mood ? '' : el.dataset.mood;
        save(); haptic(12); render();
      };
    });
    const bind = (sel, key) => {
      const el = $(sel);
      if (el) el.oninput = (ev) => { d[key] = ev.target.value; save(); };
    };
    bind('#dOne', 'oneline');
    bind('#dLearn', 'learned');
    bind('#dMet', 'met');
    bind('#dText', 'text');

    const add = $('[data-diary-photo]');
    if (add) add.onchange = (ev) => {
      readPhoto(ev.target.files[0], (data) => {
        d.photos = d.photos || [];
        d.photos.push(data); save(); render();
        toast('사진을 추가했습니다', 'camera');
      });
    };
    $$('[data-diary-delphoto]').forEach((b) => {
      b.onclick = () => { d.photos.splice(+b.dataset.diaryDelphoto, 1); save(); render(); };
    });
  },
};

/* ============================================================
   13. 자료실
   ============================================================ */
Views.resources = {
  title: '자료실',
  sub: '링크 · 파일 · 사진',

  render() {
    const links = state.resources.filter((r) => r.type === 'link');
    const files = state.resources.filter((r) => r.type === 'file');

    return `
      <div class="card mb-12">
        <div class="card-title">${icon('folder')} 자료실</div>
        <p class="small muted mt-8">링크 ${links.length}개 · 파일 ${files.length}개</p>
        <div class="grid-2 mt-12">
          <button class="btn small ghost" data-add-link>${icon('link')} 링크 추가</button>
          <label class="btn small">
            ${icon('upload')} 파일 추가
            <input type="file" id="resFile" hidden accept="image/*,.pdf,.txt,.md">
          </label>
        </div>
        <p class="small muted-3 mt-8">${icon('info')} 파일은 기기에만 저장됩니다 (5MB 이하 권장)</p>
      </div>

      ${state.resources.length ? `<div class="stagger">${
        [...state.resources].reverse().map((r) => `
          <div class="row">
            <div class="stat-icon" style="margin:0;width:38px;height:38px;background:var(--chip-bg)">
              ${icon(r.type === 'link' ? 'link' : r.mime?.startsWith('image') ? 'camera' : 'file-text')}
            </div>
            <div class="row-main" data-res-open="${r.id}">
              <div class="row-title ellipsis">${esc(r.title)}</div>
              <div class="row-sub ellipsis">${esc(r.memo || r.url || r.mime || '')}</div>
            </div>
            <button class="icon-btn" data-res-del="${r.id}" aria-label="삭제">${icon('trash')}</button>
          </div>`).join('')}</div>`
        : `<div class="card">${emptyState('저장된 자료가 없습니다', '링크나 파일을 추가해보세요', 'folder')}</div>`}

      <div class="section-label">${icon('bookmark')} 추천 링크</div>
      <div class="card">
        ${[
          ['LAM Research 공식', 'https://www.lamresearch.com'],
          ['Apple Park Visitor Center', 'https://www.apple.com/retail/appleparkvisitorcenter/'],
          ['Intel Museum', 'https://www.intel.com/content/www/us/en/company-overview/intel-museum.html'],
          ['Genentech', 'https://www.gene.com'],
          ['HP', 'https://www.hp.com'],
          ['Stanford University', 'https://www.stanford.edu'],
          ['UCLA', 'https://www.ucla.edu'],
          ['요세미티 국립공원 (NPS)', 'https://www.nps.gov/yose/'],
          ['ESTA 신청 (공식)', 'https://esta.cbp.dhs.gov'],
          ['주샌프란시스코 총영사관', 'https://overseas.mofa.go.kr/us-sanfrancisco-ko/index.do'],
          ['주LA 총영사관', 'https://overseas.mofa.go.kr/us-losangeles-ko/index.do'],
        ].map(([t, u]) => `
          <a class="kv" href="${u}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">
            <span class="flex-1">${esc(t)}</span>
            <span style="color:var(--blue)">${icon('external-link')}</span>
          </a>`).join('')}
      </div>`;
  },

  mount() {
    const addLink = $('[data-add-link]');
    if (addLink) addLink.onclick = () => {
      openSheet(`
        <h3>링크 추가</h3>
        <div class="field"><label class="field-label">제목</label>
          <input class="input" id="nrTitle" placeholder="예: 반도체 산업 리포트"></div>
        <div class="field"><label class="field-label">URL</label>
          <input class="input" id="nrUrl" type="url" placeholder="https://"></div>
        <div class="field"><label class="field-label">메모</label>
          <input class="input" id="nrMemo" placeholder="선택"></div>
        <button class="btn block mt-12" data-rsave>${icon('plus')} 추가하기</button>`);
      $('#nrTitle').focus();
      $('[data-rsave]').onclick = () => {
        const title = $('#nrTitle').value.trim();
        const url = $('#nrUrl').value.trim();
        if (!title || !url) { toast('제목과 URL을 입력해주세요', 'alert-triangle'); return; }
        state.resources.push({ id: uid(), type: 'link', title, url, memo: $('#nrMemo').value.trim(), createdAt: Date.now() });
        save(); closeSheet(); render(); toast('링크를 추가했습니다');
      };
    };

    const fileInput = $('#resFile');
    if (fileInput) fileInput.onchange = (ev) => {
      const file = ev.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { toast('5MB 이하 파일만 가능합니다', 'alert-triangle'); return; }
      if (file.type.startsWith('image/')) {
        readPhoto(file, (data) => {
          state.resources.push({ id: uid(), type: 'file', title: file.name, mime: file.type, data, memo: '', createdAt: Date.now() });
          save(); render(); toast('파일을 추가했습니다', 'upload');
        });
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          state.resources.push({ id: uid(), type: 'file', title: file.name, mime: file.type, data: reader.result, memo: '', createdAt: Date.now() });
          save(); render(); toast('파일을 추가했습니다', 'upload');
        };
        reader.readAsDataURL(file);
      }
    };

    $$('[data-res-open]').forEach((el) => {
      el.onclick = () => {
        const r = state.resources.find((x) => x.id === el.dataset.resOpen);
        if (r.type === 'link') { window.open(r.url, '_blank', 'noopener'); return; }
        if (r.mime?.startsWith('image')) {
          openModal(r.title, `<img src="${r.data}" style="width:100%;border-radius:14px">`, 'camera');
        } else {
          const a = document.createElement('a');
          a.href = r.data; a.download = r.title; a.click();
        }
      };
    });
    $$('[data-res-del]').forEach((el) => {
      el.onclick = () => {
        state.resources = state.resources.filter((x) => x.id !== el.dataset.resDel);
        save(); render(); toast('삭제했습니다', 'trash');
      };
    });
  },
};

/* ============================================================
   14. 회의
   ============================================================ */
Views.meetings = {
  title: '회의',
  sub: `팀 ${TRIP.memberCount}인 · 회의록과 할 일`,

  render() {
    const all = state.meetings;
    const todos = all.flatMap((m) => (m.todos || []).map((t) => ({ ...t, meeting: m.title, mid: m.id })));
    const openTodos = todos.filter((t) => !t.done);
    const sorted = [...all].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    return `
      <div class="card mb-12" style="background:linear-gradient(135deg, rgba(10,132,255,.18), rgba(48,209,88,.10))">
        <div class="flex items-center justify-between">
          <div>
            <div class="card-title">${icon('users')} 팀 회의</div>
            <p class="small muted mt-8">회의 ${all.length}회 · 미완료 할 일 ${openTodos.length}개</p>
          </div>
          ${icon('message-circle')}
        </div>
        <button class="btn block mt-12" data-add-meeting>${icon('plus')} 새 회의 만들기</button>
      </div>

      ${!all.length ? `
        <div class="card">
          ${emptyState('아직 회의 기록이 없습니다', '첫 킥오프 회의를 만들어보세요', 'users')}
          <button class="btn ghost block" data-kickoff>${icon('sparkles')} 킥오프 회의 템플릿으로 시작</button>
        </div>` : ''}

      ${openTodos.length ? `
        <div class="section-label">${icon('list-todo')} 미완료 할 일</div>
        <div class="stagger">
          ${openTodos.map((t) => `
            <div class="row" data-todo="${t.mid}:${t.id}">
              ${checkbox(false)}
              <div class="row-main">
                <div class="row-title">${esc(t.text)}</div>
                <div class="row-sub">
                  <span class="badge ${t.priority === 'high' ? 'p-high' : t.priority === 'low' ? 'p-low' : 'p-mid'}">
                    ${PRIORITIES[t.priority] || '보통'}</span>
                  ${t.owner ? ` ${esc(t.owner)} · ` : ' '}${esc(t.meeting)}
                </div>
              </div>
            </div>`).join('')}
        </div>` : ''}

      ${sorted.length ? `<div class="section-label">${icon('file-text')} 회의록</div>` : ''}
      <div class="stagger">
        ${sorted.map((m) => {
          const done = (m.todos || []).filter((t) => t.done).length;
          return `
            <div class="card pressable" data-meeting="${m.id}">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="card-title">${esc(m.title)}</div>
                  <p class="small muted mt-8">${esc(m.date)} · 참석 ${esc(m.attendees || '-')}</p>
                </div>
                ${icon('chevron-right')}
              </div>
              ${m.notes ? `<p class="small muted-3 mt-8 ellipsis">${esc(m.notes.split('\n')[0])}</p>` : ''}
              ${(m.todos || []).length ? `
                <div class="flex items-center gap-8 mt-8">
                  <span class="badge p-low">${icon('list-todo')}할 일 ${done}/${m.todos.length}</span>
                </div>` : ''}
            </div>`;
        }).join('')}
      </div>`;
  },

  mount() {
    const add = $('[data-add-meeting]');
    if (add) add.onclick = () => this.openEdit(null);

    const kick = $('[data-kickoff]');
    if (kick) kick.onclick = () => {
      state.meetings.push({
        id: uid(), date: ymd(), title: '킥오프 회의',
        attendees: '팀원 3인',
        notes: '## 안건\n- 주제 구체화: 미국 vs 한국 반도체 산업 비교\n- 역할 분담 (3인)\n- 탐방 전 사전조사 범위\n- 미션수행 계획서 작성 일정\n\n## 결정사항\n- \n\n## 논의 내용\n- ',
        todos: [
          { id: uid(), text: '미션수행 계획서 초안 작성', owner: '', done: false, priority: 'high' },
          { id: uid(), text: '기업별 사전조사 분담', owner: '', done: false, priority: 'high' },
          { id: uid(), text: '질문 리스트 3개씩 추리기', owner: '', done: false, priority: 'mid' },
        ],
      });
      save(); render(); toast('킥오프 회의를 만들었습니다', 'sparkles');
    };

    $$('[data-meeting]').forEach((el) => {
      el.onclick = () => this.openDetail(el.dataset.meeting);
    });
    $$('[data-todo]').forEach((el) => {
      el.onclick = () => {
        const [mid, tid] = el.dataset.todo.split(':');
        const m = state.meetings.find((x) => x.id === mid);
        const t = m.todos.find((x) => x.id === tid);
        t.done = !t.done; save(); haptic(); render();
        if (t.done) toast('완료했습니다!');
      };
    });
  },

  openEdit(id) {
    const m = id ? state.meetings.find((x) => x.id === id) : null;
    openSheet(`
      <h3>${m ? '회의 수정' : '새 회의'}</h3>
      <div class="field"><label class="field-label">제목</label>
        <input class="input" id="nmTitle" placeholder="예: 2차 회의 — 발표 준비" value="${esc(m?.title || '')}"></div>
      <div class="field"><label class="field-label">날짜</label>
        <input class="input" id="nmDate" type="date" value="${m?.date || ymd()}"></div>
      <div class="field"><label class="field-label">참석자</label>
        <input class="input" id="nmAtt" placeholder="예: 팀원 3인" value="${esc(m?.attendees || '')}"></div>
      <button class="btn block mt-12" data-msave>${icon('check')} ${m ? '저장' : '만들기'}</button>`);
    $('#nmTitle').focus();
    $('[data-msave]').onclick = () => {
      const title = $('#nmTitle').value.trim();
      if (!title) { toast('제목을 입력해주세요', 'alert-triangle'); return; }
      if (m) {
        m.title = title; m.date = $('#nmDate').value; m.attendees = $('#nmAtt').value.trim();
      } else {
        state.meetings.push({
          id: uid(), title, date: $('#nmDate').value,
          attendees: $('#nmAtt').value.trim() || '팀원 3인', notes: '', todos: [],
        });
      }
      save(); closeSheet(); render();
      toast(m ? '수정했습니다' : '회의를 만들었습니다');
    };
  },

  openDetail(id) {
    const m = state.meetings.find((x) => x.id === id);
    if (!m) return;
    openSheet(`
      <h3>${esc(m.title)}</h3>
      <p class="small muted mb-12">${esc(m.date)} · 참석 ${esc(m.attendees || '-')}</p>

      <div class="field">
        <label class="field-label">회의록 (Markdown)</label>
        <textarea class="textarea" id="mNotes" style="min-height:170px"
          placeholder="## 안건&#10;- &#10;&#10;## 결정사항&#10;- ">${esc(m.notes || '')}</textarea>
      </div>

      <label class="field-label">할 일</label>
      <div id="mTodos">
        ${(m.todos || []).map((t) => `
          <div class="row" style="margin-bottom:6px">
            <button data-mtodo="${t.id}">${checkbox(t.done)}</button>
            <div class="row-main">
              <div class="row-title" style="${t.done ? 'text-decoration:line-through;opacity:.5' : ''}">${esc(t.text)}</div>
              <div class="row-sub">
                <span class="badge ${t.priority === 'high' ? 'p-high' : t.priority === 'low' ? 'p-low' : 'p-mid'}">
                  ${PRIORITIES[t.priority] || '보통'}</span>
                ${t.owner ? ` ${esc(t.owner)}` : ''}
              </div>
            </div>
            <button class="icon-btn" data-mtododel="${t.id}">${icon('trash')}</button>
          </div>`).join('') || '<p class="small muted-3 mb-12">등록된 할 일이 없습니다</p>'}
      </div>

      <div class="card" style="padding:12px">
        <input class="input mb-8" id="mtText" placeholder="할 일 내용">
        <div class="flex gap-8">
          <input class="input flex-1" id="mtOwner" placeholder="담당자">
          <select class="select" id="mtPri" style="width:100px">
            <option value="high">높음</option><option value="mid" selected>보통</option><option value="low">낮음</option>
          </select>
        </div>
        <button class="btn small block mt-8" data-mtodoadd>${icon('plus')} 할 일 추가</button>
      </div>

      <div class="flex gap-8 mt-16">
        <button class="btn ghost flex-1" data-medit>${icon('pencil')} 정보 수정</button>
        <button class="btn danger flex-1" data-mdel>${icon('trash')} 삭제</button>
      </div>
      <button class="btn block mt-8" data-close-sheet>닫기</button>`);

    $('#mNotes').oninput = (e) => { m.notes = e.target.value; save(); };
    $$('[data-mtodo]').forEach((b) => {
      b.onclick = () => {
        const t = m.todos.find((x) => x.id === b.dataset.mtodo);
        t.done = !t.done; save(); this.openDetail(id); render();
      };
    });
    $$('[data-mtododel]').forEach((b) => {
      b.onclick = () => {
        m.todos = m.todos.filter((x) => x.id !== b.dataset.mtododel);
        save(); this.openDetail(id); render();
      };
    });
    $('[data-mtodoadd]').onclick = () => {
      const text = $('#mtText').value.trim();
      if (!text) { toast('할 일을 입력해주세요', 'alert-triangle'); return; }
      m.todos = m.todos || [];
      m.todos.push({ id: uid(), text, owner: $('#mtOwner').value.trim(), priority: $('#mtPri').value, done: false });
      save(); this.openDetail(id); render(); toast('할 일을 추가했습니다');
    };
    $('[data-medit]').onclick = () => this.openEdit(id);
    $('[data-mdel]').onclick = () => {
      confirmModal('회의 삭제', `"${m.title}" 회의록을 삭제할까요?`, () => {
        state.meetings = state.meetings.filter((x) => x.id !== id);
        save(); closeSheet(); render(); toast('삭제했습니다', 'trash');
      });
    };
    $('[data-close-sheet]').onclick = () => { closeSheet(); render(); };
  },
};

/* ============================================================
   15. 설정
   ============================================================ */
Views.settings = {
  title: '설정',
  sub: '데이터 백업 · 앱 정보',

  render() {
    const size = (() => {
      try { return (localStorage.getItem(STORAGE_KEY) || '').length; } catch { return 0; }
    })();
    const sizeKb = (size / 1024).toFixed(1);

    return `
      <div class="card mb-12" style="background:linear-gradient(135deg, rgba(10,132,255,.18), rgba(94,92,230,.12))">
        <div class="card-title">${icon('plane')} ${esc(TRIP.program)}</div>
        <div class="mt-12">
          <div class="kv"><b>소속</b><span>${esc(TRIP.team)}</span></div>
          <div class="kv"><b>출국</b><span>${esc(TRIP.departAirport)}</span></div>
          <div class="kv"><b>가는 편</b><span>${esc(TRIP.flightOut)}</span></div>
          <div class="kv"><b>오는 편</b><span>${esc(TRIP.flightIn)}</span></div>
          <div class="kv"><b>방문 도시</b><span>${esc(TRIP.cities)}</span></div>
        </div>
      </div>

      <div class="section-label">${icon('users')} 내 정보</div>
      <div class="card">
        <div class="field">
          <label class="field-label">이름 (영문 자기소개용)</label>
          <input class="input" id="setName" placeholder="예: Junho Kim" value="${esc(state.settings.name || '')}">
        </div>
        <div class="field">
          <label class="field-label">개인 메모 (인솔자 연락처 등)</label>
          <textarea class="textarea" id="setMemo" style="min-height:90px"
            placeholder="인솔자 연락처, 호텔명, 룸메이트 등">${esc(state.settings.memo || '')}</textarea>
        </div>
      </div>

      <div class="section-label">${icon('moon')} 화면</div>
      <div class="card">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="row-title">다크 모드</div>
            <div class="row-sub">눈이 편한 어두운 테마</div>
          </div>
          <button class="btn small ghost" data-toggle-theme>
            ${icon(state.theme === 'dark' ? 'moon' : 'sun')} ${state.theme === 'dark' ? '다크' : '라이트'}
          </button>
        </div>
      </div>

      <div class="section-label">${icon('plane')} 앱으로 설치</div>
      <div class="card">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="row-title">홈 화면에 추가</div>
            <div class="row-sub">${isStandalone() ? '이미 앱으로 실행 중입니다 ✓' : '전체화면 · 오프라인 실행'}</div>
          </div>
          <button class="btn small ${isStandalone() ? 'ghost' : ''}" data-install-guide>
            ${icon('download')} 방법 보기
          </button>
        </div>
      </div>

      <div class="section-label">${icon('info')} 앱 사용법</div>
      <div class="card">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="row-title">기능 소개 다시 보기</div>
            <div class="row-sub">15개 메뉴와 숨은 기능 안내</div>
          </div>
          <button class="btn small ghost" data-show-intro>${icon('sparkles')} 보기</button>
        </div>
      </div>

      <div class="section-label">${icon('download')} 데이터 백업</div>
      <div class="card">
        <p class="small muted mb-12" style="line-height:1.65">
          모든 데이터는 이 기기(LocalStorage)에만 저장됩니다.<br>
          브라우저 데이터를 지우면 사라지므로 <b>주기적으로 내보내기</b>를 권장합니다.
        </p>
        <div class="grid-2">
          <button class="btn ghost" data-export>${icon('download')} JSON 내보내기</button>
          <label class="btn ghost">
            ${icon('upload')} JSON 가져오기
            <input type="file" id="importFile" accept="application/json" hidden>
          </label>
        </div>
        <p class="small muted-3 mt-8">현재 사용량: 약 ${sizeKb} KB</p>
      </div>

      <div class="section-label">${icon('pie-chart')} 데이터 요약</div>
      <div class="card">
        <div class="kv"><b>일정 완료</b><span>${stats.schedule().done} / ${stats.schedule().total}</span></div>
        <div class="kv"><b>준비물</b><span>${stats.packing().done} / ${stats.packing().total}</span></div>
        <div class="kv"><b>체크리스트</b><span>${stats.travelCheck().done} / ${stats.travelCheck().total}</span></div>
        <div class="kv"><b>질문 체크</b><span>${stats.questions().done} / ${stats.questions().total}</span></div>
        <div class="kv"><b>회의록</b><span>${state.meetings.length}건</span></div>
        <div class="kv"><b>지출 내역</b><span>${state.expenses.length}건</span></div>
        <div class="kv"><b>일기</b><span>${Object.keys(state.diary).length}일</span></div>
        <div class="kv"><b>자료실</b><span>${state.resources.length}개</span></div>
      </div>

      <div class="section-label">${icon('alert-triangle')} 위험 구역</div>
      <div class="card" style="border-color:rgba(255,69,58,.3)">
        <p class="small muted mb-12">모든 기록이 삭제되고 초기 상태로 되돌아갑니다.</p>
        <button class="btn danger block" data-reset>${icon('rotate-ccw')} 전체 초기화</button>
      </div>

      <p class="small muted-3" style="text-align:center;margin:24px 0 8px;line-height:1.7">
        실리콘밸리 마스터 v1.0<br>
        ${esc(TRIP.program)}<br>
        오프라인에서도 동작합니다 ✈️
      </p>`;
  },

  mount() {
    const nameEl = $('#setName');
    if (nameEl) nameEl.oninput = (e) => { state.settings.name = e.target.value; save(); };
    const memoEl = $('#setMemo');
    if (memoEl) memoEl.oninput = (e) => { state.settings.memo = e.target.value; save(); };

    const tt = $('[data-toggle-theme]');
    if (tt) tt.onclick = () => toggleTheme();

    const ig = $('[data-install-guide]');
    if (ig) ig.onclick = () => showInstallGuide();

    const si = $('[data-show-intro]');
    if (si) si.onclick = () => showIntro();

    const ex = $('[data-export]');
    if (ex) ex.onclick = () => { exportJSON(); toast('백업 파일을 저장했습니다', 'download'); };

    const imp = $('#importFile');
    if (imp) imp.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      confirmModal('데이터 가져오기', '현재 데이터를 덮어씁니다. 계속할까요?', () => {
        importJSON(file, (ok, err) => {
          if (ok) {
            applyTheme();
            render(); renderTabbar(); renderInstallBanner();
            toast('데이터를 가져왔습니다', 'upload');
          } else {
            toast(`가져오기 실패: ${err}`, 'alert-triangle');
          }
        });
      });
    };

    const rs = $('[data-reset]');
    if (rs) rs.onclick = () => {
      confirmModal('전체 초기화', '모든 기록이 삭제됩니다. 정말 초기화할까요?', () => {
        resetAll(); applyTheme(); render(); renderTabbar(); renderInstallBanner();
        toast('초기화했습니다', 'rotate-ccw');
      });
    };
  },
};
