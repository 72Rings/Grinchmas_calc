// ---------- DATA MODEL ----------

// Item definitions (for scoring)
const ITEM_DEFS = [
  { key: 'redGift', label: 'R🎁', color: 'red', kind: 'gift' },
  { key: 'blueGift', label: 'B🎁', color: 'blue', kind: 'gift' },
  { key: 'redOrn', label: 'R❄', color: 'red', kind: 'orn' },
  { key: 'blueOrn', label: 'B❄', color: 'blue', kind: 'orn' }
];

// Multiplier card definitions (you can add more later)
const CARD_DEFS = [
  {
    key: 'x3RedAll',
    label: 'x3 for RED items',
    factor: 3,
    appliesTo: item => item.color === 'red'
  },
  {
    key: 'x2BlueAll',
    label: 'x2 for BLUE items',
    factor: 2,
    appliesTo: item => item.color === 'blue'
  },
  {
    key: 'x4RedGift',
    label: 'x4 for RED gifts',
    factor: 4,
    appliesTo: item => item.color === 'red' && item.kind === 'gift'
  }
];

// canonical color order used across UI and data
const COLORS = ['orange', 'pink', 'red', 'yellow'];

function normalizeColor(raw) {
  if (!raw) return raw;
  return String(raw).trim().toLowerCase();
}

// 8 houses – board order: O,P,R,Y,O,P,R,Y
// ensure colors are normalized here
const houses = [
  makeEmptyHouse('Orange 1', normalizeColor('orange')),
  makeEmptyHouse('Pink 1',   normalizeColor('pink')),
  makeEmptyHouse('Red 1',    normalizeColor('red')),
  makeEmptyHouse('Yellow 1', normalizeColor('yellow')),
  makeEmptyHouse('Orange 2', normalizeColor('orange')),
  makeEmptyHouse('Pink 2',   normalizeColor('pink')),
  makeEmptyHouse('Red 2',    normalizeColor('red')),
  makeEmptyHouse('Yellow 2', normalizeColor('yellow'))
];

// ---------- PER-COLOR PERMANENT BONUSES ----------
// persistent bonuses that affect base value of items in houses of that color
// keys match ITEM_DEFS[].key and values are additive to the base value (base=1)
const COLOR_BONUSES = {
  yellow: { redGift: 0, blueGift: 0, redOrn: 0, blueOrn: 0 },
  red:    { redGift: 0, blueGift: 0, redOrn: 0, blueOrn: 0 },
  orange: { redGift: 0, blueGift: 0, redOrn: 0, blueOrn: 0 },
  pink:   { redGift: 0, blueGift: 0, redOrn: 0, blueOrn: 0 }
};

// ensure COLOR_BONUSES keys exist for canonical colors
COLORS.forEach(c => ensureColorBonuses(c));



function makeEmptyHouse(name, color) {
  const items = {};
  ITEM_DEFS.forEach(d => { items[d.key] = 0; });

  const cards = {};
  CARD_DEFS.forEach(d => { cards[d.key] = 0; });

  return {
    name,
    color,
    items,
    cards,
    points: 0
  };
}

// ---------- SCORING ----------

function calculateHousePoints(house) {
  let total = 0;

  ITEM_DEFS.forEach(itemDef => {
    const count = house.items[itemDef.key] || 0;
    if (!count) return;

    // base value is 1 point + any permanent color bonus for this house's color
    const colorBonuses = COLOR_BONUSES[house.color] || {};
    const bonusForItem = colorBonuses[itemDef.key] || 0;
    let baseValue = 1 + bonusForItem;

    // apply per-house multiplier cards
    let itemMultiplier = 1;
    CARD_DEFS.forEach(cardDef => {
      const cardCount = house.cards[cardDef.key] || 0;
      if (!cardCount) return;
      if (cardDef.appliesTo(itemDef)) {
        // multiply by factor for each copy of the card
        for (let i = 0; i < cardCount; i++) {
          itemMultiplier *= cardDef.factor;
        }
      }
    });

    total += count * baseValue * itemMultiplier;
  });

  house.points = total;
  return total;
}

function calculateTotalPoints() {
  return houses.reduce((sum, h) => sum + calculateHousePoints(h), 0);
}

// ---------- UI WIRING ----------

// modal mode tracking
let modalMode = 'house'; // 'house' or 'color'
let currentHouseIndex = null;
let currentColor = null;

// safe element lookup helper (returns null if element not found)
function $id(id) { return document.getElementById(id) || null; }

// ----- modal elements -----
// note: use defensive null checks before accessing properties of these
const modalOverlay = $id('modal-overlay');
const modalTitle   = $id('modal-title');

const sectionItems        = $id('section-items');
const sectionCards        = $id('section-cards');
const sectionColorBonuses = $id('section-color-bonuses');

const inpRedGift   = $id('inp-redGift');
const inpBlueGift  = $id('inp-blueGift');
const inpRedOrn    = $id('inp-redOrn');
const inpBlueOrn   = $id('inp-blueOrn');

const inpX3RedAll  = $id('inp-x3RedAll');
const inpX2BlueAll = $id('inp-x2BlueAll');
const inpX4RedGift = $id('inp-x4RedGift');

const inpBonusRedGift  = $id('inp-bonus-redGift');
const inpBonusBlueGift = $id('inp-bonus-blueGift');
const inpBonusRedOrn   = $id('inp-bonus-redOrn');
const inpBonusBlueOrn  = $id('inp-bonus-blueOrn');

const btnCancel = $id('btn-cancel');
const btnSave   = $id('btn-save');

// ----- open modals -----

// Single-house modal: items + per-house cards, NO color bonuses
function openHouseModal(index) {
  console.log('openHouseModal called for index', index);
  modalMode = 'house';
  currentHouseIndex = index;
  currentColor = null;

  const house = houses[index];
  if (modalTitle) modalTitle.textContent = house.name;

  // do fresh lookups (handles fallback-created DOM)
  const sectionItemsLocal = document.getElementById('section-items');
  const sectionCardsLocal = document.getElementById('section-cards');
  const sectionColorBonusesLocal = document.getElementById('section-color-bonuses');

  const inpRedGiftL   = document.getElementById('inp-redGift');
  const inpBlueGiftL  = document.getElementById('inp-blueGift');
  const inpRedOrnL    = document.getElementById('inp-redOrn');
  const inpBlueOrnL   = document.getElementById('inp-blueOrn');

  const inpX3RedAllL  = document.getElementById('inp-x3RedAll');
  const inpX2BlueAllL = document.getElementById('inp-x2BlueAll');
  const inpX4RedGiftL = document.getElementById('inp-x4RedGift');

  if (sectionItemsLocal) sectionItemsLocal.classList.remove('hidden');
  if (sectionCardsLocal) sectionCardsLocal.classList.remove('hidden');
  if (sectionColorBonusesLocal) sectionColorBonusesLocal.classList.add('hidden');

  if (inpRedGiftL) inpRedGiftL.value   = house.items.redGift;
  if (inpBlueGiftL) inpBlueGiftL.value  = house.items.blueGift;
  if (inpRedOrnL) inpRedOrnL.value    = house.items.redOrn;
  if (inpBlueOrnL) inpBlueOrnL.value   = house.items.blueOrn;

  if (inpX3RedAllL) inpX3RedAllL.value  = house.cards.x3RedAll;
  if (inpX2BlueAllL) inpX2BlueAllL.value = house.cards.x2BlueAll;
  if (inpX4RedGiftL) inpX4RedGiftL.value = house.cards.x4RedGift;

  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.remove('hidden');
}

// Color modal: add items to BOTH houses + edit permanent bonuses, NO per-house cards
function openColorModal(color) {
  console.log('openColorModal called for color', color);
  modalMode = 'color';
  currentHouseIndex = null;
  currentColor = color;

  if (modalTitle) modalTitle.textContent = `Add to ${capitalize(color)} houses`;

  // fresh lookups to handle dynamic modal creation
  const sectionItemsLocal = document.getElementById('section-items');
  const sectionCardsLocal = document.getElementById('section-cards');
  const sectionColorBonusesLocal = document.getElementById('section-color-bonuses');

  const inpRedGiftL   = document.getElementById('inp-redGift');
  const inpBlueGiftL  = document.getElementById('inp-blueGift');
  const inpRedOrnL    = document.getElementById('inp-redOrn');
  const inpBlueOrnL   = document.getElementById('inp-blueOrn');

  const inpX3RedAllL  = document.getElementById('inp-x3RedAll');
  const inpX2BlueAllL = document.getElementById('inp-x2BlueAll');
  const inpX4RedGiftL = document.getElementById('inp-x4RedGift');

  if (sectionItemsLocal) sectionItemsLocal.classList.remove('hidden');
  // IMPORTANT: hide per-house cards for color modal
  if (sectionCardsLocal) sectionCardsLocal.classList.add('hidden');
  if (sectionColorBonusesLocal) sectionColorBonusesLocal.classList.remove('hidden');

  // color-shortcut behaves as a "delta" editor: start item increments at zero
  if (inpRedGiftL) inpRedGiftL.value   = 0;
  if (inpBlueGiftL) inpBlueGiftL.value  = 0;
  if (inpRedOrnL) inpRedOrnL.value    = 0;
  if (inpBlueOrnL) inpBlueOrnL.value   = 0;

  // load existing permanent bonuses for this color (if inputs exist)
  const bonuses = COLOR_BONUSES[color] || {};
  if (inpBonusRedGiftL)  inpBonusRedGiftL.value  = bonuses.redGift || 0;
  if (inpBonusBlueGiftL) inpBonusBlueGiftL.value = bonuses.blueGift || 0;
  if (inpBonusRedOrnL)   inpBonusRedOrnL.value   = bonuses.redOrn || 0;
  if (inpBonusBlueOrnL)  inpBonusBlueOrnL.value  = bonuses.blueOrn || 0;

  if (inpX3RedAllL) inpX3RedAllL.value  = 0;
  if (inpX2BlueAllL) inpX2BlueAllL.value = 0;
  if (inpX4RedGiftL) inpX4RedGiftL.value = 0;

  // render persistent toggles into modal UI
  renderColorBonuses(color);

  // Attach explicit click handlers so toggles always work for this color
  ['redGift','blueGift','redOrn','blueOrn'].forEach(k => {
    const btn = document.getElementById(`bonus-btn-${k}`);
    if (btn) {
      // remove previous handler if any
      btn.onclick = () => toggleColorBonus(color, k);
    }
  });

  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.remove('hidden');
}

function closeHouseModal() {
  if (modalOverlay) modalOverlay.classList.add('hidden');
  currentHouseIndex = null;
  currentColor = null;
  modalMode = 'house';
}

// ----- save / cancel / outside click -----

if (btnSave) {
  btnSave.addEventListener('click', () => {
    const deltaRedGift   = toNonNegativeInt(inpRedGift ? inpRedGift.value : 0);
    const deltaBlueGift  = toNonNegativeInt(inpBlueGift ? inpBlueGift.value : 0);
    const deltaRedOrn    = toNonNegativeInt(inpRedOrn ? inpRedOrn.value : 0);
    const deltaBlueOrn   = toNonNegativeInt(inpBlueOrn ? inpBlueOrn.value : 0);

    const deltaX3RedAll  = toNonNegativeInt(inpX3RedAll ? inpX3RedAll.value : 0);
    const deltaX2BlueAll = toNonNegativeInt(inpX2BlueAll ? inpX2BlueAll.value : 0);
    const deltaX4RedGift = toNonNegativeInt(inpX4RedGift ? inpX4RedGift.value : 0);

    if (modalMode === 'house') {
      if (currentHouseIndex === null) return;
      const house = houses[currentHouseIndex];

      house.items.redGift   = deltaRedGift;
      house.items.blueGift  = deltaBlueGift;
      house.items.redOrn    = deltaRedOrn;
      house.items.blueOrn   = deltaBlueOrn;

      house.cards.x3RedAll  = deltaX3RedAll;
      house.cards.x2BlueAll = deltaX2BlueAll;
      house.cards.x4RedGift = deltaX4RedGift;

      calculateHousePoints(house);
      updateHouseSummary(currentHouseIndex);

    } else if (modalMode === 'color') {
      if (!currentColor) return;

      // DO NOT overwrite COLOR_BONUSES here — toggles are the single source of truth.
      // only apply the item increments from the inputs to both houses of this color
      houses.forEach((house, idx) => {
        if (house.color !== currentColor) return;

        house.items.redGift   += deltaRedGift;
        house.items.blueGift  += deltaBlueGift;
        house.items.redOrn    += deltaRedOrn;
        house.items.blueOrn   += deltaBlueOrn;

        calculateHousePoints(house);
        updateHouseSummary(idx);
      });
    }

    closeHouseModal();
  });
}

if (btnCancel) btnCancel.addEventListener('click', closeHouseModal);
if (modalOverlay) {
  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) closeHouseModal();
  });
}

// Score Round button: recalc all houses and show total
const btnScoreRound = $id('btn-score-round');
if (btnScoreRound) {
  btnScoreRound.addEventListener('click', () => {
    // calculate all houses and update summaries
    houses.forEach(h => calculateHousePoints(h));
    houses.forEach((_, i) => updateHouseSummary(i));

    const total = calculateTotalPoints();
    const totalEl = $id('total-points');
    if (totalEl) {
      animateNumber(totalEl, parseInt(totalEl.textContent, 10) || 0, total, 700);
    }

    // After scoring, clear non-permanent items/cards from each house
    houses.forEach((house, idx) => {
      // permanent bonuses are stored in COLOR_BONUSES; clear only house-specific items/cards
      house.items = Object.fromEntries(ITEM_DEFS.map(d => [d.key, 0]));
      house.cards = Object.fromEntries(CARD_DEFS.map(c => [c.key, 0]));
      calculateHousePoints(house);
      updateHouseSummary(idx);
    });
  });
}

// animate number from fromVal to toVal in duration ms
function animateNumber(el, fromVal, toVal, duration) {
  const start = performance.now();
  const diff = toVal - fromVal;
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = easeOutQuad(t);
    const current = Math.round(fromVal + diff * eased);
    el.textContent = String(current);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function easeOutQuad(t) { return t * (2 - t); }

// ----- utility: create modal UI if missing and attach handlers ----

function createModalFallback() {
  // Build modal DOM using createElement to avoid injecting HTML strings (CSP-friendly)
  let overlay = document.getElementById('modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'modal-overlay hidden';
    document.body.appendChild(overlay);
  }

  // if modal already present, return overlay
  if (overlay.querySelector('.modal')) return overlay;

  const modal = document.createElement('div');
  modal.className = 'modal';

  const h2 = document.createElement('h2');
  h2.id = 'modal-title';
  modal.appendChild(h2);

  // section: items
  const sectionItemsEl = document.createElement('div');
  sectionItemsEl.id = 'section-items';
  sectionItemsEl.className = 'modal-section';
  ['redGift','blueGift','redOrn','blueOrn'].forEach(key => {
    const label = document.createElement('label');
    const text = key === 'redGift' ? 'Red Gifts:' : key === 'blueGift' ? 'Blue Gifts:' : key === 'redOrn' ? 'Red Ornaments:' : 'Blue Ornaments:';
    label.textContent = text;
    const input = document.createElement('input');
    input.type = 'number'; input.id = `inp-${key}`; input.min = '0';
    input.style.width = '60px';
    label.appendChild(input);
    sectionItemsEl.appendChild(label);
  });
  modal.appendChild(sectionItemsEl);

  // section: cards
  const sectionCardsEl = document.createElement('div');
  sectionCardsEl.id = 'section-cards';
  sectionCardsEl.className = 'modal-section';
  const cardDefs = [
    {id: 'inp-x3RedAll', label: 'x3 for RED items:'},
    {id: 'inp-x2BlueAll', label: 'x2 for BLUE items:'},
    {id: 'inp-x4RedGift', label: 'x4 for RED gifts:'}
  ];
  cardDefs.forEach(c => {
    const label = document.createElement('label');
    label.textContent = c.label;
    const input = document.createElement('input'); input.type = 'number'; input.id = c.id; input.min = '0'; input.style.width = '60px';
    label.appendChild(input);
    sectionCardsEl.appendChild(label);
  });
  modal.appendChild(sectionCardsEl);

  // section: color bonuses placeholder (index.html may provide toggle buttons)
  const sectionColorEl = document.createElement('div');
  sectionColorEl.id = 'section-color-bonuses';
  sectionColorEl.className = 'modal-section hidden';
  modal.appendChild(sectionColorEl);

  // buttons
  const btnWrap = document.createElement('div');
  btnWrap.className = 'modal-actions';
  const btnCancelEl = document.createElement('button'); btnCancelEl.id = 'btn-cancel'; btnCancelEl.textContent = 'Cancel';
  const btnSaveEl = document.createElement('button'); btnSaveEl.id = 'btn-save'; btnSaveEl.textContent = 'Save';
  btnWrap.appendChild(btnCancelEl); btnWrap.appendChild(btnSaveEl);
  modal.appendChild(btnWrap);

  overlay.appendChild(modal);
  attachModalHandlers();
  return overlay;
}

function attachModalHandlers() {
  // detach existing to avoid double-binding (simple approach: ignore)
  const btnSaveLocal = document.getElementById('btn-save');
  const btnCancelLocal = document.getElementById('btn-cancel');
  const overlayLocal = document.getElementById('modal-overlay');

  if (btnSaveLocal) {
    btnSaveLocal.addEventListener('click', () => {
      const inpRedGiftL   = document.getElementById('inp-redGift');
      const inpBlueGiftL  = document.getElementById('inp-blueGift');
      const inpRedOrnL    = document.getElementById('inp-redOrn');
      const inpBlueOrnL   = document.getElementById('inp-blueOrn');

      const inpX3RedAllL  = document.getElementById('inp-x3RedAll');
      const inpX2BlueAllL = document.getElementById('inp-x2BlueAll');
      const inpX4RedGiftL = document.getElementById('inp-x4RedGift');

      const inpBonusRedGiftL  = document.getElementById('inp-bonus-redGift');
      const inpBonusBlueGiftL = document.getElementById('inp-bonus-blueGift');
      const inpBonusRedOrnL   = document.getElementById('inp-bonus-redOrn');
      const inpBonusBlueOrnL  = document.getElementById('inp-bonus-blueOrn');

      const deltaRedGift   = toNonNegativeInt(inpRedGiftL ? inpRedGiftL.value : 0);
      const deltaBlueGift  = toNonNegativeInt(inpBlueGiftL ? inpBlueGiftL.value : 0);
      const deltaRedOrn    = toNonNegativeInt(inpRedOrnL ? inpRedOrnL.value : 0);
      const deltaBlueOrn   = toNonNegativeInt(inpBlueOrnL ? inpBlueOrnL.value : 0);

      const deltaX3RedAll  = toNonNegativeInt(inpX3RedAllL ? inpX3RedAllL.value : 0);
      const deltaX2BlueAll = toNonNegativeInt(inpX2BlueAllL ? inpX2BlueAllL.value : 0);
      const deltaX4RedGift = toNonNegativeInt(inpX4RedGiftL ? inpX4RedGiftL.value : 0);

      if (modalMode === 'house') {
        if (currentHouseIndex === null) return;
        const house = houses[currentHouseIndex];

        house.items.redGift   = deltaRedGift;
        house.items.blueGift  = deltaBlueGift;
        house.items.redOrn    = deltaRedOrn;
        house.items.blueOrn   = deltaBlueOrn;

        house.cards.x3RedAll  = deltaX3RedAll;
        house.cards.x2BlueAll = deltaX2BlueAll;
        house.cards.x4RedGift = deltaX4RedGift;

        calculateHousePoints(house);
        updateHouseSummary(currentHouseIndex);

      } else if (modalMode === 'color') {
        if (!currentColor) return;

        // DO NOT overwrite COLOR_BONUSES here — toggles are the single source of truth.
        // only apply the item increments from the inputs to both houses of this color
        houses.forEach((house, idx) => {
          if (house.color !== currentColor) return;

          house.items.redGift   += deltaRedGift;
          house.items.blueGift  += deltaBlueGift;
          house.items.redOrn    += deltaRedOrn;
          house.items.blueOrn   += deltaBlueOrn;

          calculateHousePoints(house);
          updateHouseSummary(idx);
        });
      }

      closeHouseModal();
    });
  }

  if (btnCancelLocal) btnCancelLocal.addEventListener('click', closeHouseModal);

  if (overlayLocal) {
    overlayLocal.addEventListener('click', e => {
      if (e.target === overlayLocal) closeHouseModal();
    });
  }
}

// wire shortcut buttons: elements with data-color -> openColorModal(color)
// and elements with data-house-index -> openHouseModal(index)
function wireShortcutButtons() {
  document.body.addEventListener('click', (e) => {
    // look for an element with data-color or data-house-index in the click path
    let el = e.target;
    while (el && el !== document.body) {
      if (el.hasAttribute && el.hasAttribute('data-color')) {
        const raw = el.getAttribute('data-color');
        const color = normalizeColor(raw);
        console.log('delegated click -> color shortcut:', raw, '->', color);
        createModalFallback();
        openColorModal(color);
        return;
      }
      if (el.hasAttribute && el.hasAttribute('data-house-index')) {
        const idx = parseInt(el.getAttribute('data-house-index'), 10);
        console.log('delegated click -> house index:', idx);
        createModalFallback();
        openHouseModal(idx);
        return;
      }
      el = el.parentElement;
    }
  }, { capture: false });
}

// call wiring at startup
createModalFallback();   // ensure overlay + modal markup exists (and handlers attached)
attachModalHandlers();   // safe no-op if already wired
wireShortcutButtons();   // delegated click -> openHouseModal / openColorModal
wireBonusButtons();      // delegated click -> toggleColorBonus

// ----- helpers -----

function toNonNegativeInt(value) {
  const n = parseInt(value, 10);
  return isNaN(n) || n < 0 ? 0 : n;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ----- update summaries -----

function updateHouseSummary(index) {
  const summaryEl = document.getElementById(`summary-${index}`);
  const house = houses[index];

  const itemParts = ITEM_DEFS
    .map(def => {
      const count = house.items[def.key];
      return count ? `${def.label}:${count}` : null;
    })
    .filter(Boolean);

  const cardParts = CARD_DEFS
    .map(def => {
      const count = house.cards[def.key];
      return count ? `${def.label} x${count}` : null;
    })
    .filter(Boolean);

  const lines = [];
  if (itemParts.length) lines.push(itemParts.join(' | '));
  if (cardParts.length) lines.push(cardParts.join(' | '));
  lines.push(`Pts: ${house.points}`);

  summaryEl.textContent = lines.join('\n');
}

// initialize all summaries at startup
houses.forEach((_, i) => updateHouseSummary(i));

// helper: ensure COLOR_BONUSES has structure for a color
function ensureColorBonuses(color) {
  if (!COLOR_BONUSES[color]) {
    COLOR_BONUSES[color] = { redGift: 0, blueGift: 0, redOrn: 0, blueOrn: 0 };
  }
  return COLOR_BONUSES[color];
}

// render current bonus toggles into modal for currentColor
function renderColorBonuses(color) {
  if (!color) return;
  ensureColorBonuses(color);
  const keys = ['redGift', 'blueGift', 'redOrn', 'blueOrn'];
  keys.forEach(k => {
    const btn = document.getElementById(`bonus-btn-${k}`);
    const val = (COLOR_BONUSES[color] && COLOR_BONUSES[color][k]) ? 1 : 0;
    if (btn) {
      btn.setAttribute('aria-pressed', val ? 'true' : 'false');
      btn.classList.toggle('active', !!val);
      btn.textContent = val ? 'ON' : 'OFF';
    }
  });
}

// toggle a color bonus ON/OFF (binary). Recalculates affected houses immediately.
function toggleColorBonus(color, itemKey) {
  if (!color || !itemKey) return;
  ensureColorBonuses(color);
  COLOR_BONUSES[color][itemKey] = COLOR_BONUSES[color][itemKey] ? 0 : 1;
  renderColorBonuses(color);
  houses.forEach((house, idx) => {
    if (house.color === color) {
      calculateHousePoints(house);
      updateHouseSummary(idx);
    }
  });
}

// wire delegated handlers for the toggle buttons (call once at startup)
function wireBonusButtons() {
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('.btn-bonus-toggle');
    if (!btn) return;
    const item = btn.getAttribute('data-item');
    // try currentColor first, otherwise infer from modal title
    let color = currentColor;
    if (!color) {
      const titleEl = document.getElementById('modal-title');
      if (titleEl && titleEl.textContent) {
        const m = titleEl.textContent.match(/Add to (\w+) houses/i);
        if (m) color = normalizeColor(m[1]);
      }
    }
    if (color && item) toggleColorBonus(color, item);
  });
}

// ensure renderColorBonuses is called when opening color modal
function openColorModal(color) {
  modalMode = 'color';
  currentHouseIndex = null;
  currentColor = color;

  if (modalTitle) modalTitle.textContent = `Add to ${capitalize(color)} houses`;

  // fresh lookups to handle dynamic modal creation
  const sectionItemsLocal = document.getElementById('section-items');
  const sectionCardsLocal = document.getElementById('section-cards');
  const sectionColorBonusesLocal = document.getElementById('section-color-bonuses');

  const inpRedGiftL   = document.getElementById('inp-redGift');
  const inpBlueGiftL  = document.getElementById('inp-blueGift');
  const inpRedOrnL    = document.getElementById('inp-redOrn');
  const inpBlueOrnL   = document.getElementById('inp-blueOrn');

  const inpX3RedAllL  = document.getElementById('inp-x3RedAll');
  const inpX2BlueAllL = document.getElementById('inp-x2BlueAll');
  const inpX4RedGiftL = document.getElementById('inp-x4RedGift');

  if (sectionItemsLocal) sectionItemsLocal.classList.remove('hidden');
  if (sectionCardsLocal) sectionCardsLocal.classList.add('hidden');
  if (sectionColorBonusesLocal) sectionColorBonusesLocal.classList.remove('hidden');

  // color-shortcut behaves as a "delta" editor: start item increments at zero
  if (inpRedGiftL) inpRedGiftL.value   = 0;
  if (inpBlueGiftL) inpBlueGiftL.value  = 0;
  if (inpRedOrnL) inpRedOrnL.value    = 0;
  if (inpBlueOrnL) inpBlueOrnL.value   = 0;

  if (inpX3RedAllL) inpX3RedAllL.value  = 0;
  if (inpX2BlueAllL) inpX2BlueAllL.value = 0;
  if (inpX4RedGiftL) inpX4RedGiftL.value = 0;

  // render persistent toggles into modal UI
  renderColorBonuses(color);

  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.remove('hidden');
}

// ensure save handler for color modal only applies item deltas (do not overwrite COLOR_BONUSES)
if (btnSave) {
  btnSave.addEventListener('click', () => {
    const deltaRedGift   = toNonNegativeInt(inpRedGift ? inpRedGift.value : 0);
    const deltaBlueGift  = toNonNegativeInt(inpBlueGift ? inpBlueGift.value : 0);
    const deltaRedOrn    = toNonNegativeInt(inpRedOrn ? inpRedOrn.value : 0);
    const deltaBlueOrn   = toNonNegativeInt(inpBlueOrn ? inpBlueOrn.value : 0);

    const deltaX3RedAll  = toNonNegativeInt(inpX3RedAll ? inpX3RedAll.value : 0);
    const deltaX2BlueAll = toNonNegativeInt(inpX2BlueAll ? inpX2BlueAll.value : 0);
    const deltaX4RedGift = toNonNegativeInt(inpX4RedGift ? inpX4RedGift.value : 0);

    if (modalMode === 'house') {
      if (currentHouseIndex === null) return;
      const house = houses[currentHouseIndex];

      house.items.redGift   = deltaRedGift;
      house.items.blueGift  = deltaBlueGift;
      house.items.redOrn    = deltaRedOrn;
      house.items.blueOrn   = deltaBlueOrn;

      house.cards.x3RedAll  = deltaX3RedAll;
      house.cards.x2BlueAll = deltaX2BlueAll;
      house.cards.x4RedGift = deltaX4RedGift;

      calculateHousePoints(house);
      updateHouseSummary(currentHouseIndex);

    } else if (modalMode === 'color') {
      if (!currentColor) return;

      // DO NOT overwrite COLOR_BONUSES here — toggles are the single source of truth.
      // only apply the item increments from the inputs to both houses of this color
      houses.forEach((house, idx) => {
        if (house.color !== currentColor) return;

        house.items.redGift   += deltaRedGift;
        house.items.blueGift  += deltaBlueGift;
        house.items.redOrn    += deltaRedOrn;
        house.items.blueOrn   += deltaBlueOrn;

        calculateHousePoints(house);
        updateHouseSummary(idx);
      });
    }

    closeHouseModal();
  });
}

// call wiring at startup
createModalFallback();   // ensure overlay + modal markup exists (and handlers attached)
attachModalHandlers();   // safe no-op if already wired
wireShortcutButtons();   // delegated click -> openHouseModal / openColorModal
wireBonusButtons();      // delegated click -> toggleColorBonus
