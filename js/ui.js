/* ============================================================
   ui.js — 재사용 UI 컴포넌트 & 유틸
   Toast / Modal / Sheet / Progress / Markdown / 사진 업로드
   ============================================================ */

/* ---------- DOM 헬퍼 ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** XSS 방지용 escape */
function esc(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** 햅틱 (지원 기기) */
function haptic(ms = 8) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

/* ---------- Toast ---------- */
function toast(msg, iconName = 'check') {
  const wrap = $('#toastWrap');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${icon(iconName)}<span>${esc(msg)}</span>`;
  wrap.appendChild(el);
  haptic();
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 300);
  }, 1900);
}

/* ---------- Bottom Sheet ---------- */
function openSheet(html) {
  const sheet = $('#sheet');
  sheet.innerHTML = `<div class="sheet-grabber"></div>${html}`;
  $('#sheetBackdrop').classList.add('show');
  sheet.classList.add('show');
  sheet.scrollTop = 0;
}
function closeSheet() {
  $('#sheet').classList.remove('show');
  $('#sheetBackdrop').classList.remove('show');
}

/* ---------- Modal ---------- */
function openModal(title, html, iconName = 'info') {
  const modal = $('#modal');
  modal.innerHTML = `
    <div class="modal-head">
      ${icon(iconName)}
      <h3>${esc(title)}</h3>
      <button class="icon-btn" data-close-modal aria-label="닫기">${icon('x')}</button>
    </div>
    <div class="modal-body">${html}</div>`;
  $('#modalBackdrop').classList.add('show');
  modal.classList.add('show');
  modal.scrollTop = 0;
  $('[data-close-modal]', modal).onclick = closeModal;
}
function closeModal() {
  $('#modal').classList.remove('show');
  $('#modalBackdrop').classList.remove('show');
}

/** 확인 다이얼로그 */
function confirmModal(title, message, onConfirm, danger = true) {
  openModal(title, `
    <p class="muted" style="font-size:14px;line-height:1.6;margin-bottom:18px">${esc(message)}</p>
    <div class="flex gap-8">
      <button class="btn ghost flex-1" data-cancel>취소</button>
      <button class="btn ${danger ? 'danger' : ''} flex-1" data-ok>확인</button>
    </div>`, danger ? 'alert-triangle' : 'help-circle');
  $('[data-cancel]').onclick = closeModal;
  $('[data-ok]').onclick = () => { closeModal(); onConfirm(); };
}

/* ---------- Progress 컴포넌트 ---------- */

/** 선형 진행바 */
function progressBar(done, total, color = '') {
  const p = pct(done, total);
  return `<div class="progress-track"><div class="progress-fill ${color}" style="width:${p}%"></div></div>`;
}

/** 원형 진행 링 */
function progressRing(percent, size = 64, stroke = 6, color = 'var(--blue)') {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - percent / 100);
  return `
    <svg class="progress-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle class="ring-bg" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"/>
      <circle class="ring-fg" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none"
              stroke="${color}" stroke-width="${stroke}"
              stroke-dasharray="${c}" stroke-dashoffset="${offset}"/>
    </svg>`;
}

/* ---------- 체크박스 ---------- */
function checkbox(on, blue = false) {
  return `<div class="checkbox ${blue ? 'blue' : ''} ${on ? 'on' : ''}">${icon('check')}</div>`;
}

/* ---------- 별점 ---------- */
function ratingStars(value, dataAttr) {
  return `<div class="rating">${[1, 2, 3, 4, 5].map((n) =>
    `<button ${dataAttr}="${n}" class="${n <= value ? 'on' : ''}" aria-label="${n}점">${icon('star')}</button>`
  ).join('')}</div>`;
}

/* ---------- 빈 상태 ---------- */
function emptyState(text, sub = '', iconName = 'folder') {
  return `<div class="empty">${icon(iconName)}<p>${esc(text)}</p>${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;
}

/* ---------- 간단 Markdown 렌더러 ---------- */
/* 지원: # 헤딩, **볼드**, *이탤릭*, `코드`, - 목록, 1. 순서목록,
        > 인용, --- 구분선, [텍스트](링크), 표(간이), 체크박스 */
function renderMarkdown(src = '') {
  if (!src.trim()) return '<p class="muted-3">내용이 없습니다.</p>';
  const lines = esc(src).split('\n');
  let html = '';
  let listType = null;   // 'ul' | 'ol' | null
  let inTable = false;

  const closeList = () => { if (listType) { html += `</${listType}>`; listType = null; } };
  const closeTable = () => { if (inTable) { html += '</tbody></table>'; inTable = false; } };

  const inline = (t) => t
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  lines.forEach((raw) => {
    const line = raw.trimEnd();

    // 표
    if (/^\|.*\|$/.test(line)) {
      const cells = line.slice(1, -1).split('|').map((c) => c.trim());
      if (/^[-: ]+$/.test(cells.join(''))) return; // 구분행 스킵
      if (!inTable) {
        closeList();
        html += '<table style="width:100%;border-collapse:collapse;font-size:13px;margin:8px 0"><tbody>';
        inTable = true;
      }
      html += `<tr>${cells.map((c) =>
        `<td style="padding:7px 9px;border-bottom:1px solid var(--stroke)">${inline(c)}</td>`).join('')}</tr>`;
      return;
    }
    closeTable();

    if (!line.trim()) { closeList(); return; }
    if (/^---+$/.test(line)) { closeList(); html += '<hr>'; return; }

    let m;
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
      closeList();
      const lv = m[1].length;
      html += `<h${lv}>${inline(m[2])}</h${lv}>`;
      return;
    }
    if ((m = line.match(/^>\s?(.*)$/))) {
      closeList();
      html += `<blockquote>${inline(m[1])}</blockquote>`;
      return;
    }
    // 체크박스 목록
    if ((m = line.match(/^[-*]\s+\[( |x|X)\]\s+(.*)$/))) {
      if (listType !== 'ul') { closeList(); html += '<ul style="list-style:none;margin-left:2px">'; listType = 'ul'; }
      const on = m[1].toLowerCase() === 'x';
      html += `<li style="display:flex;gap:7px;align-items:flex-start">
        <span style="color:${on ? 'var(--green)' : 'var(--text-3)'};font-size:13px">${on ? '☑' : '☐'}</span>
        <span style="${on ? 'opacity:.55;text-decoration:line-through' : ''}">${inline(m[2])}</span></li>`;
      return;
    }
    if ((m = line.match(/^[-*]\s+(.*)$/))) {
      if (listType !== 'ul') { closeList(); html += '<ul>'; listType = 'ul'; }
      html += `<li>${inline(m[1])}</li>`;
      return;
    }
    if ((m = line.match(/^\d+\.\s+(.*)$/))) {
      if (listType !== 'ol') { closeList(); html += '<ol>'; listType = 'ol'; }
      html += `<li>${inline(m[1])}</li>`;
      return;
    }
    closeList();
    html += `<p>${inline(line)}</p>`;
  });
  closeList();
  closeTable();
  return html;
}

/* ---------- 사진 업로드 (리사이즈 후 base64) ---------- */

/**
 * 파일을 최대 900px로 리사이즈하고 JPEG base64로 변환한다.
 * LocalStorage 용량을 아끼기 위해 필수.
 */
function readPhoto(file, cb) {
  if (!file || !file.type.startsWith('image/')) {
    toast('이미지 파일만 가능합니다', 'alert-triangle');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 900;
      let { width: w, height: h } = img;
      if (w > max || h > max) {
        const ratio = Math.min(max / w, max / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      cb(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => toast('이미지를 읽을 수 없습니다', 'alert-triangle');
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

/** 사진 그리드 (추가/삭제 지원) — photos는 base64 배열 */
function photoGrid(photos, addAttr, delAttr) {
  return `<div class="photo-grid">
    ${photos.map((p, i) => `
      <div class="ph">
        <img src="${p}" alt="사진 ${i + 1}" loading="lazy">
        <button class="ph-del" ${delAttr}="${i}" aria-label="사진 삭제">${icon('x')}</button>
      </div>`).join('')}
    <label class="photo-add">
      ${icon('camera')}<span>추가</span>
      <input type="file" accept="image/*" ${addAttr} hidden>
    </label>
  </div>`;
}

/* ---------- 숫자 포맷 ---------- */
const won = (n) => `₩${Math.round(n).toLocaleString('ko-KR')}`;
const usd = (n) => `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

/* ---------- 애니메이션 카운트업 ---------- */
function countUp(el, target, dur = 800, suffix = '') {
  const start = performance.now();
  const step = (t) => {
    const p = Math.min(1, (t - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased) + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
