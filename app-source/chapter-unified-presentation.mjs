export const CHAPTER_METADATA = Object.freeze({
  1: {
    numberLabel: '第一章',
    title: '議場前哨 · 奪回神麥',
    subtitle: '突圍議場街區，迎戰搶麥小頭目與三戰兩勝首關頭目。',
    tips: [
      '看清對手起手動作再格擋或跳蹲閃招，貪拳容易吃到反擊。',
      '後退可自動格擋，K 鍵或防守鍵能原地穩穩擋下正面攻勢。',
      '街頭路段善用上下走位閃避障礙，撿拾補給保持最佳狀態。'
    ]
  },
  2: {
    numberLabel: '第二章',
    title: '街口開講 · 追逐神麥',
    subtitle: '穿越熱鬧市集街區，迎戰搶話小頭目並守住現場節奏。',
    tips: [
      '街頭路段可利用場上推車阻擋並反制敵人衝鋒，留意補給品回復血量。',
      '頭目戰採用三戰兩勝制，注意對手蓄力預告與發光提醒。',
      '適時呼叫助拳夥伴，可打斷對手強勢招式並爭取反攻空檔。'
    ]
  },
  3: {
    numberLabel: '第三章',
    title: '巷戰接力 · 追逐神麥',
    subtitle: '街巷交鋒升級，小心伏兵與高台障礙，一路追回神麥。',
    tips: [
      '上下切換車道能閃開直線攻勢，跳上攤台可拉開安全距離。',
      '觀察敵人頭頂出招預告，抓準破綻再交出高傷梗技。',
      '善用技能配點強化慣用招式與基礎能力，闖關會更順手。'
    ]
  },
  4: {
    numberLabel: '第四章',
    title: '護車推進 · 突破重圍',
    subtitle: '緊守音響車輪鎖與護送路線，突破重圍奪回主動權。',
    tips: [
      '護送路段留意多方向來襲的搗蛋鬼，保持節奏別被包夾。',
      '集滿氣勢條可召喚群眾應援，瞬間扭轉戰場局勢。',
      '留意敵方抓取與突進招式，抓準收招空檔再上前輸出。'
    ]
  },
  5: {
    numberLabel: '第五章',
    title: '終局清點 · 回到議場',
    subtitle: '七人到齊迎向最終對決，拿下神麥歸屬。',
    tips: [
      '最終戰對手招式變化多，保留至少一格防守耐力應對突襲。',
      '助拳冷卻完畢即可再次呼叫支援，幫你解圍或接續連段。',
      '調整好搭檔與技能配點後再上場，祝你一鼓作氣拿下神麥！'
    ]
  }
});

const LOADING_STYLE_ID = 'chapter-loading-overlay-style';
const DEFAULT_BACKDROP_GRADIENT = 'linear-gradient(155deg, rgba(16, 34, 40, 0.96) 0%, rgba(28, 56, 65, 0.94) 55%, rgba(20, 42, 49, 0.98) 100%)';

function injectLoadingStyles(doc) {
  if (!doc?.head || doc.getElementById(LOADING_STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = LOADING_STYLE_ID;
  style.textContent = `
html[data-campaign-loading="true"] #trial-app #menu,
html[data-campaign-loading="true"] #trial-app #menu .card,
html[data-campaign-loading="true"] #trial-app #menu .card::after,
html[data-chapter-overlay-loading="true"] #trial-app #menu,
html[data-chapter-overlay-loading="true"] #trial-app #menu .card,
html[data-chapter-overlay-loading="true"] #trial-app #menu .card::after {
  display: none !important;
  content: none !important;
  visibility: hidden !important;
}
body:has(#chapter-loading-overlay:not([hidden])) #trial-app #menu,
body:has(#chapter-loading-overlay:not([hidden])) #trial-app #menu .card,
body:has(#chapter-loading-overlay:not([hidden])) #trial-app #menu .card::after {
  display: none !important;
  content: none !important;
  visibility: hidden !important;
}
html[data-campaign-loading="true"] #trial-app > #stage,
html[data-chapter-overlay-loading="true"] #trial-app > #stage {
  visibility: visible !important;
}
body:has(#chapter-loading-overlay:not([hidden])) #trial-app > #stage {
  visibility: visible !important;
}
.chapter-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 95;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: max(16px, env(safe-area-inset-top, 16px)) max(16px, env(safe-area-inset-right, 16px)) max(16px, env(safe-area-inset-bottom, 16px)) max(16px, env(safe-area-inset-left, 16px));
  background: #182e35;
  color: #142b32;
  font-family: "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif;
  opacity: 1;
  transition: opacity 280ms cubic-bezier(0.22, 1, 0.36, 1);
  box-sizing: border-box;
}
.chapter-loading-overlay[hidden] {
  display: none !important;
}
.chapter-loading-overlay[data-loading-state="ready"] {
  opacity: 0;
  pointer-events: none;
}
.chapter-loading-backdrop {
  position: absolute;
  inset: 0;
  background-image: ${DEFAULT_BACKDROP_GRADIENT};
  background-size: cover;
  background-position: center 58%;
  filter: brightness(0.76) saturate(1.04);
  transform: scale(1.01);
  transition: opacity 260ms ease;
  pointer-events: none;
}
.chapter-loading-scrim {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(16, 34, 40, 0.16) 0%, rgba(16, 34, 40, 0.56) 100%);
  pointer-events: none;
}
.chapter-loading-card {
  position: relative;
  z-index: 1;
  width: min(100%, 400px);
  max-height: 100%;
  overflow: auto;
  background: rgba(255, 247, 229, 0.94);
  backdrop-filter: blur(8px);
  border: 2.5px solid #142b32;
  border-radius: 12px;
  box-shadow: 0 18px 38px rgba(10, 24, 30, 0.32), 4px 4px 0 #142b32;
  padding: 20px 22px 18px;
  box-sizing: border-box;
  display: grid;
  gap: 12px;
}
.chapter-loading-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.chapter-loading-num {
  display: inline-flex;
  align-items: center;
  padding: 2px 9px;
  background: #bc3f31;
  color: #fff7e5;
  border: 2px solid #142b32;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.04em;
  line-height: 1.3;
  white-space: nowrap;
}
.chapter-loading-phase {
  display: none !important;
  font-size: 12.5px;
  font-weight: 700;
  color: #355860;
  white-space: nowrap;
}
.chapter-loading-title {
  margin: 0;
  font-size: clamp(19px, 3.2vw, 24px);
  line-height: 1.24;
  font-weight: 900;
  color: #142b32;
  text-wrap: balance;
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
  font-size: 13px;
  font-weight: 800;
  color: #214149;
}
.chapter-loading-percent {
  font-variant-numeric: tabular-nums;
  font-size: 15px;
  font-weight: 900;
  color: #bc3f31;
  white-space: nowrap;
}
.chapter-loading-track {
  position: relative;
  height: 11px;
  width: 100%;
  background: #e7dbc0;
  border: 2px solid #142b32;
  border-radius: 999px;
  overflow: hidden;
  box-sizing: border-box;
}
.chapter-loading-fill {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #bc3f31 0%, #e4aa37 100%);
  transform-origin: left center;
  transform: scaleX(0);
  transition: transform 140ms cubic-bezier(0.16, 1, 0.3, 1);
}
.chapter-loading-tip {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.5;
  color: #355860;
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
  min-height: 40px;
  padding: 6px 16px;
  font: inherit;
  font-size: 13.5px;
  font-weight: 900;
  color: #fff7e5;
  background: #bc3f31;
  border: 2px solid #142b32;
  border-radius: 7px;
  box-shadow: 2px 2px 0 #142b32;
  cursor: pointer;
  white-space: nowrap;
}
.chapter-loading-retry:hover {
  background: #d14c3d;
}
.chapter-loading-retry:focus-visible {
  outline: 3px solid #e4aa37;
  outline-offset: 2px;
}
@media (max-height: 460px) {
  .chapter-loading-card {
    padding: 15px 18px 14px;
    gap: 10px;
    width: min(100%, 420px);
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
 * Clean, blurred-backdrop loading overlay shared across Challenge Mode Chapters 2-5.
 */
export function mountChapterLoadingOverlay({
  document: doc = globalThis.document,
  chapter = 1,
  chapterNumber,
  chapterTitle,
  tips,
  backdropUrl = '',
  onRetry
} = {}) {
  if (!doc?.body) {
    return {
      setProgress() {},
      setPhase() {},
      setBackdrop() {},
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
    <div class="chapter-loading-backdrop" aria-hidden="true"></div>
    <div class="chapter-loading-scrim" aria-hidden="true"></div>
    <div class="chapter-loading-card">
      <div class="chapter-loading-header">
        <span class="chapter-loading-num"></span>
        <span class="chapter-loading-phase" hidden></span>
      </div>
      <h2 class="chapter-loading-title"></h2>
      <div class="chapter-loading-progress-block">
        <div class="chapter-loading-progress-meta">
          <span class="chapter-loading-status-text">正在載入關卡素材…</span>
          <span class="chapter-loading-percent">0%</span>
        </div>
        <div class="chapter-loading-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
          <div class="chapter-loading-fill"></div>
        </div>
      </div>
      <p class="chapter-loading-tip"><span class="chapter-loading-tip-text"></span></p>
      <div class="chapter-loading-actions" hidden>
        <button type="button" class="chapter-loading-retry">重新整理再試</button>
      </div>
    </div>
  `;

  doc.body.appendChild(overlay);
  if (doc.documentElement?.dataset) {
    doc.documentElement.dataset.chapterOverlayLoading = 'true';
  }

  const backdropEl = overlay.querySelector('.chapter-loading-backdrop');
  const numEl = overlay.querySelector('.chapter-loading-num');
  const phaseEl = overlay.querySelector('.chapter-loading-phase');
  const titleEl = overlay.querySelector('.chapter-loading-title');
  const statusEl = overlay.querySelector('.chapter-loading-status-text');
  const percentEl = overlay.querySelector('.chapter-loading-percent');
  const trackEl = overlay.querySelector('.chapter-loading-track');
  const fillEl = overlay.querySelector('.chapter-loading-fill');
  const tipEl = overlay.querySelector('.chapter-loading-tip-text');
  const actionsEl = overlay.querySelector('.chapter-loading-actions');
  const retryBtn = overlay.querySelector('.chapter-loading-retry');

  numEl.textContent = resolvedNumber;
  titleEl.textContent = resolvedTitle;

  function setBackdrop(url) {
    if (!backdropEl?.style) return;
    if (typeof url === 'string' && url.trim()) {
      const safe = url.trim().replace(/"/g, '\\"');
      backdropEl.style.backgroundImage = `url("${safe}"), ${DEFAULT_BACKDROP_GRADIENT}`;
    } else {
      backdropEl.style.backgroundImage = DEFAULT_BACKDROP_GRADIENT;
    }
  }
  setBackdrop(backdropUrl);

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
    }, 3600);
  }

  if (typeof onRetry === 'function') retryBtn.textContent = '重試載入';
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
    if (doc.documentElement?.dataset) {
      doc.documentElement.dataset.chapterOverlayLoading = 'true';
    }
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

  function hideOverlayNow() {
    overlay.hidden = true;
    if (doc.documentElement?.dataset) {
      delete doc.documentElement.dataset.chapterOverlayLoading;
      delete doc.documentElement.dataset.campaignLoading;
    }
  }

  function setReady() {
    clearHideTimer();
    percentEl.textContent = '100%';
    trackEl.setAttribute('aria-valuenow', '100');
    fillEl.style.transform = 'scaleX(1)';
    phaseEl.textContent = '載入完成';
    statusEl.textContent = '舞台已就緒';
    overlay.dataset.loadingState = 'ready';
    const setTimer = doc.defaultView?.setTimeout;
    if (typeof setTimer === 'function') {
      hideTimer = setTimer(() => {
        if (overlay.dataset.loadingState === 'ready') hideOverlayNow();
      }, 300);
    } else {
      hideOverlayNow();
    }
  }

  function setError(message = '素材載入失敗，請檢查連線後再試。') {
    clearHideTimer();
    overlay.hidden = false;
    overlay.dataset.loadingState = 'error';
    phaseEl.textContent = '載入中斷';
    statusEl.textContent = message;
    actionsEl.hidden = false;
    if (doc.documentElement?.dataset) {
      doc.documentElement.dataset.chapterOverlayLoading = 'true';
    }
  }

  function destroy() {
    clearHideTimer();
    if (tipTimer != null && typeof doc.defaultView?.clearInterval === 'function') {
      doc.defaultView.clearInterval(tipTimer);
      tipTimer = null;
    }
    if (doc.documentElement?.dataset) {
      delete doc.documentElement.dataset.chapterOverlayLoading;
    }
    overlay.remove();
  }

  return {
    element: overlay,
    show,
    setProgress,
    setPhase,
    setBackdrop,
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
