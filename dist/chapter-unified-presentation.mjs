export const CHAPTER_METADATA = Object.freeze({
  1: {
    numberLabel: '第一章',
    title: '議場前哨 · 奪回神麥',
    subtitle: '突圍議場街區，迎戰搶麥小頭目與三戰兩勝首關頭目。',
    tips: [
      '穩定視野會鎖定倍率、不因跳躍晃動；動態視野則柔和跟隨走位。',
      '手機直向與橫向皆保持清晰人物比例，先看清對手起手再格擋或反擊。',
      '街頭路段善用上下走位閃避障礙，撿拾補給保持最佳狀態。'
    ]
  },
  2: {
    numberLabel: '第二章',
    title: '街口開講 · 追逐神麥',
    subtitle: '穿越熱鬧市集街區，迎戰搶話小頭目並守住現場節奏。',
    tips: [
      '跳躍只會移動角色高度，天空與遠景背景會保持固定不縮放。',
      '頭目戰採用三戰兩勝制，留心發光警告與地板落點提示。',
      '適時呼叫助拳夥伴，可打斷對手強勢招式並爭取反攻空檔。'
    ]
  },
  3: {
    numberLabel: '第三章',
    title: '巷戰接力 · 柯P加入',
    subtitle: '街巷交鋒升級，小心伏兵與高台障礙，一路追回神麥。',
    tips: [
      '上下切換車道能閃開直線衝刺，跳上攤台可拉開安全距離。',
      '觀察敵人頭頂出招字卡預告，抓準破綻再交出高傷梗技。',
      '不論選擇穩定或動態視野，起跳時畫面都不會忽大忽小。'
    ]
  },
  4: {
    numberLabel: '第四章',
    title: '護車推進 · 小馬哥加入',
    subtitle: '緊守音響車輪鎖與護送路線，突破重圍奪回主動權。',
    tips: [
      '護送路段留意多方向來襲的搗蛋鬼，保持節奏別被包夾。',
      '手機橫向已調整至與直向相近的人物大小，走位判定更直覺。',
      '集滿氣勢條可召喚群眾應援，瞬間扭轉戰場局勢。'
    ]
  },
  5: {
    numberLabel: '第五章',
    title: '終局清點 · 阿扁仔加入',
    subtitle: '七人到齊迎向最終對決，穩定視野拿下神麥歸屬。',
    tips: [
      '最終戰對手招式變化多，保留至少一格耐力應對突襲格擋。',
      '動態視野在遠距離交鋒會微幅拉遠，近身時維持清晰人物尺度。',
      '全章節採用一致的鏡頭與載入體驗，準備好就上場開吵！'
    ]
  }
});

const LOADING_STYLE_ID = 'chapter-loading-overlay-style';

function injectLoadingStyles(doc) {
  if (!doc?.head || doc.getElementById(LOADING_STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = LOADING_STYLE_ID;
  style.textContent = `
.chapter-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 95;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(16px, env(safe-area-inset-top, 16px)) max(16px, env(safe-area-inset-right, 16px)) max(16px, env(safe-area-inset-bottom, 16px)) max(16px, env(safe-area-inset-left, 16px));
  background: rgba(16, 40, 48, 0.88);
  color: #142b32;
  font-family: "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif;
  opacity: 1;
  transition: opacity 220ms cubic-bezier(0.16, 1, 0.3, 1);
  box-sizing: border-box;
}
.chapter-loading-overlay[hidden] {
  display: none !important;
}
.chapter-loading-overlay[data-loading-state="ready"] {
  opacity: 0;
  pointer-events: none;
}
.chapter-loading-card {
  width: min(100%, 540px);
  max-height: 100%;
  overflow: auto;
  background: #fff7e5;
  border: 3px solid #142b32;
  border-radius: 10px;
  box-shadow: 6px 6px 0 #142b32;
  padding: 20px 22px 18px;
  box-sizing: border-box;
  display: grid;
  gap: 14px;
}
.chapter-loading-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.chapter-loading-titles {
  min-width: 0;
  display: grid;
  gap: 4px;
}
.chapter-loading-kicker {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #355860;
  letter-spacing: 0.02em;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.chapter-loading-title {
  margin: 0;
  font-size: clamp(20px, 3.6vw, 28px);
  line-height: 1.2;
  font-weight: 900;
  color: #142b32;
  text-wrap: balance;
}
.chapter-loading-subtitle {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #264850;
}
.chapter-loading-emblem {
  flex: 0 0 64px;
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  background: #f5e6c3;
  border: 2.5px solid #142b32;
  border-radius: 8px;
  box-shadow: 3px 3px 0 #142b32;
}
.chapter-loading-emblem svg {
  width: 48px;
  height: 48px;
  display: block;
}
.chapter-loading-progress-block {
  display: grid;
  gap: 7px;
}
.chapter-loading-progress-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
  font-weight: 800;
  color: #142b32;
}
.chapter-loading-percent {
  font-variant-numeric: tabular-nums;
  font-size: 16px;
  font-weight: 900;
  color: #be4033;
  white-space: nowrap;
}
.chapter-loading-track {
  position: relative;
  height: 16px;
  width: 100%;
  background: #e5d8b8;
  border: 2.5px solid #142b32;
  border-radius: 6px;
  overflow: hidden;
  box-sizing: border-box;
}
.chapter-loading-fill {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #e4aa37 0%, #ffcd76 100%);
  transform-origin: left center;
  transform: scaleX(0);
  transition: transform 140ms cubic-bezier(0.16, 1, 0.3, 1);
}
.chapter-loading-divider {
  height: 1px;
  background: rgba(20, 43, 50, 0.16);
  margin: 0;
  border: 0;
}
.chapter-loading-tip {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.55;
  color: #1f3f47;
}
.chapter-loading-tip strong {
  color: #be4033;
  font-weight: 900;
}
.chapter-loading-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.chapter-loading-actions[hidden] {
  display: none !important;
}
.chapter-loading-retry {
  min-height: 44px;
  padding: 8px 18px;
  font: inherit;
  font-size: 14px;
  font-weight: 900;
  color: #142b32;
  background: #ffcd76;
  border: 2.5px solid #142b32;
  border-radius: 7px;
  box-shadow: 2px 2px 0 #142b32;
  cursor: pointer;
  white-space: nowrap;
}
.chapter-loading-retry:hover {
  background: #ffd992;
}
.chapter-loading-retry:focus-visible {
  outline: 3px solid #be4033;
  outline-offset: 2px;
}
@media (max-height: 460px) {
  .chapter-loading-card {
    padding: 14px 16px;
    gap: 10px;
    width: min(100%, 560px);
  }
  .chapter-loading-emblem {
    flex: 0 0 52px;
    width: 52px;
    height: 52px;
  }
  .chapter-loading-emblem svg {
    width: 38px;
    height: 38px;
  }
  .chapter-loading-subtitle {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .chapter-loading-overlay,
  .chapter-loading-fill {
    transition: none;
  }
}
`;
  doc.head.appendChild(style);
}

/**
 * Unified comic-style loading overlay shared across Challenge Mode Chapters 1-5.
 */
export function mountChapterLoadingOverlay({
  document: doc = globalThis.document,
  chapter = 1,
  chapterNumber,
  chapterTitle,
  subtitle,
  tips,
  onRetry
} = {}) {
  if (!doc?.body) {
    return {
      setProgress() {},
      setPhase() {},
      setReady() {},
      setError() {},
      show() {},
      destroy() {}
    };
  }
  injectLoadingStyles(doc);
  const meta = CHAPTER_METADATA[chapter] || CHAPTER_METADATA[1];
  const resolvedNumber = chapterNumber || meta.numberLabel;
  const resolvedTitle = chapterTitle || meta.title;
  const resolvedSubtitle = subtitle || meta.subtitle;
  const resolvedTips = Array.isArray(tips) && tips.length ? tips : meta.tips;

  const existing = doc.getElementById('chapter-loading-overlay');
  if (existing) existing.remove();

  const overlay = doc.createElement('section');
  overlay.id = 'chapter-loading-overlay';
  overlay.className = 'chapter-loading-overlay';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');
  overlay.dataset.loadingState = 'loading';
  overlay.dataset.chapter = String(chapter);

  overlay.innerHTML = `
    <div class="chapter-loading-card">
      <div class="chapter-loading-header">
        <div class="chapter-loading-titles">
          <p class="chapter-loading-kicker">
            <span class="chapter-loading-num"></span>
            <span aria-hidden="true">·</span>
            <span class="chapter-loading-phase">準備中</span>
          </p>
          <h2 class="chapter-loading-title"></h2>
          <p class="chapter-loading-subtitle"></p>
        </div>
        <div class="chapter-loading-emblem" aria-hidden="true">
          <svg viewBox="0 0 64 64" fill="none">
            <path d="M8 20L20 14L17 24L27 20L24 31" stroke="#be4033" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="27" y="12" width="16" height="24" rx="8" fill="#ffcd76" stroke="#142b32" stroke-width="3"/>
            <line x1="29" y1="20" x2="41" y2="20" stroke="#142b32" stroke-width="2.5"/>
            <line x1="29" y1="26" x2="41" y2="26" stroke="#142b32" stroke-width="2.5"/>
            <path d="M22 29C22 36.2 27.8 42 35 42C42.2 42 48 36.2 48 29" stroke="#142b32" stroke-width="3" stroke-linecap="round"/>
            <line x1="35" y1="42" x2="35" y2="53" stroke="#142b32" stroke-width="3.5" stroke-linecap="round"/>
            <line x1="24" y1="53" x2="46" y2="53" stroke="#142b32" stroke-width="3.5" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
      <div class="chapter-loading-progress-block">
        <div class="chapter-loading-progress-meta">
          <span class="chapter-loading-status-text">正在載入關卡素材…</span>
          <span class="chapter-loading-percent">0%</span>
        </div>
        <div class="chapter-loading-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
          <div class="chapter-loading-fill"></div>
        </div>
      </div>
      <hr class="chapter-loading-divider">
      <p class="chapter-loading-tip"><strong>實戰提示：</strong><span class="chapter-loading-tip-text"></span></p>
      <div class="chapter-loading-actions" hidden>
        <button type="button" class="chapter-loading-retry">重新整理再試</button>
      </div>
    </div>
  `;

  doc.body.appendChild(overlay);

  const numEl = overlay.querySelector('.chapter-loading-num');
  const phaseEl = overlay.querySelector('.chapter-loading-phase');
  const titleEl = overlay.querySelector('.chapter-loading-title');
  const subtitleEl = overlay.querySelector('.chapter-loading-subtitle');
  const statusEl = overlay.querySelector('.chapter-loading-status-text');
  const percentEl = overlay.querySelector('.chapter-loading-percent');
  const trackEl = overlay.querySelector('.chapter-loading-track');
  const fillEl = overlay.querySelector('.chapter-loading-fill');
  const tipEl = overlay.querySelector('.chapter-loading-tip-text');
  const actionsEl = overlay.querySelector('.chapter-loading-actions');
  const retryBtn = overlay.querySelector('.chapter-loading-retry');

  numEl.textContent = resolvedNumber;
  titleEl.textContent = resolvedTitle;
  subtitleEl.textContent = resolvedSubtitle;

  let tipIndex = 0;
  let hideTimer = null;
  let tipTimer = null;

  const setTip = (idx) => {
    if (!resolvedTips.length) return;
    tipEl.textContent = resolvedTips[idx % resolvedTips.length];
  };
  setTip(0);

  if (resolvedTips.length > 1 && typeof doc.defaultView?.setInterval === 'function') {
    tipTimer = doc.defaultView.setInterval(() => {
      if (overlay.hidden || overlay.dataset.loadingState !== 'loading') return;
      tipIndex = (tipIndex + 1) % resolvedTips.length;
      setTip(tipIndex);
    }, 3200);
  }

  retryBtn.onclick = () => {
    if (typeof onRetry === 'function') onRetry();
    else doc.defaultView?.location?.reload?.();
  };

  function clearHideTimer() {
    if (hideTimer != null && typeof doc.defaultView?.clearTimeout === 'function') {
      doc.defaultView.clearTimeout(hideTimer);
      hideTimer = null;
    }
  }

  function show(phaseLabel = '準備中') {
    clearHideTimer();
    overlay.hidden = false;
    overlay.dataset.loadingState = 'loading';
    phaseEl.textContent = phaseLabel;
    actionsEl.hidden = true;
  }

  function setProgress(ratio, { phaseLabel, statusText } = {}) {
    show(phaseLabel || phaseEl.textContent || '載入中');
    const clamped = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
    const pct = Math.round(clamped * 100);
    percentEl.textContent = `${pct}%`;
    trackEl.setAttribute('aria-valuenow', String(pct));
    fillEl.style.transform = `scaleX(${clamped})`;
    if (statusText) statusEl.textContent = statusText;
  }

  function setPhase(phaseLabel, statusText) {
    show(phaseLabel);
    if (statusText) statusEl.textContent = statusText;
  }

  function setReady() {
    clearHideTimer();
    percentEl.textContent = '100%';
    trackEl.setAttribute('aria-valuenow', '100');
    fillEl.style.transform = 'scaleX(1)';
    phaseEl.textContent = '載入完成';
    statusEl.textContent = '舞台已就緒，即將進入現場';
    overlay.dataset.loadingState = 'ready';
    const setTimer = doc.defaultView?.setTimeout;
    if (typeof setTimer === 'function') {
      hideTimer = setTimer(() => {
        if (overlay.dataset.loadingState === 'ready') overlay.hidden = true;
      }, 240);
    } else {
      overlay.hidden = true;
    }
  }

  function setError(message = '素材載入失敗，請檢查連線後再試。') {
    clearHideTimer();
    overlay.hidden = false;
    overlay.dataset.loadingState = 'error';
    phaseEl.textContent = '載入中斷';
    statusEl.textContent = message;
    actionsEl.hidden = false;
  }

  function destroy() {
    clearHideTimer();
    if (tipTimer != null && typeof doc.defaultView?.clearInterval === 'function') {
      doc.defaultView.clearInterval(tipTimer);
      tipTimer = null;
    }
    overlay.remove();
  }

  return {
    element: overlay,
    show,
    setProgress,
    setPhase,
    setReady,
    setError,
    destroy
  };
}

/**
 * Fixed sky / horizon backdrop scale that never varies with actor jumps or horizontal separation.
 */
export function fixedBackdropPresentation(width, height, basePresentation = {}) {
  const w = Math.max(1, Number(width) || 960);
  const h = Math.max(1, Number(height) || 540);
  const portrait = w < h;
  const horizonZoom = portrait
    ? Math.min(1.25, w / 520, h / 680)
    : Math.min(1.25, w / 520, (h * 0.72) / 328);
  return {
    ...basePresentation,
    horizonZoom: Math.max(0.35, horizonZoom),
    lockSkyScale: true
  };
}

/**
 * Shared initial arena/boss projection across Challenge Mode chapters so desktop,
 * mobile portrait, and mobile landscape maintain balanced, readable character sizes.
 */
export function unifiedChallengeBackdropFrame(width, height, world, { portrait = width < height, touch = false } = {}) {
  const w = Math.max(1, Number(width) || 960);
  const h = Math.max(1, Number(height) || 540);
  const player = world?.player ?? { x: 260 };
  const enemy = world?.enemy ?? { x: 700 };
  const spread = Math.abs((enemy.x ?? 700) - (player.x ?? 260));
  const pairSpan = Math.max(480, spread + 280);
  const mobileLandscape = !portrait && (touch || h <= 500);

  let zoom;
  if (portrait) {
    zoom = Math.min(1.15, (w - 20) / pairSpan, (h - 140) / 520);
  } else if (mobileLandscape) {
    // Match portrait standing character proportion rather than shrinking into a narrow band
    const portraitSized = Math.min(1.2, w / 480, (h * 0.74) / 328);
    const pairFit = (w - 24) / pairSpan;
    zoom = Math.min(portraitSized, Math.max(portraitSized * 0.85, pairFit));
  } else {
    zoom = Math.min(1.2, (w - 36) / Math.max(820, pairSpan), (h - 120) / 480);
  }

  zoom = Math.max(0.35, zoom);
  const viewWorldWidth = w / zoom;
  const midX = ((player.x ?? 260) + (enemy.x ?? 700)) / 2;
  const maxLeft = Math.max(0, 960 - viewWorldWidth);
  const left = viewWorldWidth >= 960
    ? (960 - viewWorldWidth) / 2
    : Math.max(0, Math.min(maxLeft, midX - viewWorldWidth / 2));
  const base = portrait ? h * 0.78 : mobileLandscape ? h * 0.84 : h - 115;

  return {
    zoom,
    left,
    base,
    backdropZoom: fixedBackdropPresentation(w, h).horizonZoom
  };
}
