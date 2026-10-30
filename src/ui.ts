
/** Hamburger menu + object interactions */
import { S } from './state';
import { interactiveObjects } from './interactables';
import { cycleMood } from './weather';
import { showCoffeeToast } from './interaction';
import { skipIntro } from './intro';
import { stage, layer } from './stage';
import { TOUR_ORDER, type StopId } from './shots';
import { goTo, openStop, hudClickLogical } from './tour';
import { useDoor } from './door';

/** Open the selected object directly; camera movement remains handled by openStop(). */
export function activateItem(obj: any) {
  // Close the case menu before starting the camera pan / opening details.
  setMenu(false);
  activateItemNow(obj);
}

function activateItemNow(obj: any) {
  const type = obj.userData.info.type;

  if (type === 'window') {
    cycleMood();
    return;
  }

  if (type === 'coffee') {
    showCoffeeToast();
    return;
  }

  if (type === 'door') {
    useDoor();
    return;
  }

  if (type === 'music' || TOUR_ORDER.includes(type)) {
    setMenu(false);
    openStop(type as StopId);
  }
}

const menuBtn = document.getElementById('menu-btn')!;
const menuPanel = document.getElementById('menu-panel')!;
const menuList = document.getElementById('menu-list')!;
const menuTitle = document.getElementById('menu-title')!;

const MENU_ORDER = [
  'board',
  'trophy',
  'pc',
  'desk',
  'resume',
  'music',
  'coffee',
  'window',
];

const MENU_ICON: Record<string, string> = {
  pc: '🖥️',
  board: '📌',
  resume: '🖼️',
  tools: '🗂️',
  trophy: '🏆',
  desk: '☎️',
  music: '💿',
  coffee: '☕',
  window: '🪟',
};

// Decorative background overlay
const scrim = document.createElement('div');
scrim.id = 'detective-menu-scrim';
scrim.setAttribute('aria-hidden', 'true');
document.body.appendChild(scrim);

// Header decoration
const header = document.createElement('div');
header.className = 'detective-menu-header';

const headerCopy = document.createElement('div');
headerCopy.className = 'detective-menu-header-copy';

const kicker = document.createElement('div');
kicker.className = 'detective-menu-kicker';
kicker.textContent = 'CLASSIFIED // CASE FILE 001';

const heading = document.createElement('div');
heading.className = 'detective-menu-heading';
heading.textContent = "THE DETECTIVE'S DINER";

headerCopy.append(kicker, heading);
header.appendChild(headerCopy);

menuTitle.textContent = 'THE CASE MENU · EST. 2026';
menuPanel.insertBefore(header, menuTitle);

// Close button
const closeBtn = document.createElement('button');
closeBtn.type = 'button';
closeBtn.className = 'detective-menu-close';
closeBtn.setAttribute('aria-label', 'Close menu');
closeBtn.textContent = '×';
menuPanel.appendChild(closeBtn);

// Footer
const footer = document.createElement('div');
footer.className = 'detective-menu-footer';
footer.textContent = 'SELECT A CASE FILE · ESC TO CLOSE';
menuPanel.appendChild(footer);

const stamp = document.createElement('div');
stamp.className = 'detective-menu-stamp';
stamp.textContent = 'TOP SECRET';
menuPanel.appendChild(stamp);

menuBtn.setAttribute('aria-label', 'Toggle navigation menu');
menuBtn.setAttribute('aria-expanded', 'false');
menuPanel.setAttribute('aria-label', 'Explore the room');

function setMenu(open: boolean) {
  menuBtn.classList.toggle('open', open);
  menuPanel.classList.toggle('open', open);
  scrim.classList.toggle('open', open);

  menuBtn.setAttribute('aria-expanded', String(open));
  menuPanel.setAttribute('aria-hidden', String(!open));

  if ('inert' in menuPanel) {
    menuPanel.inert = !open;
  }

  if (open && !document.getElementById('back-btn')?.hasAttribute('hidden')) {
    // A detail view is active: never layer the case menu over it.
    open = false;
    menuBtn.classList.remove('open');
    menuPanel.classList.remove('open');
    scrim.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuPanel.setAttribute('aria-hidden', 'true');
    menuPanel.inert = true;
  }

  if (open) {
    menuPanel.querySelector<HTMLButtonElement>('.menu-item')?.focus();
  } else if (menuPanel.contains(document.activeElement)) {
    menuBtn.focus();
  }
}

setMenu(false);

const seenType = new Set<string>();

[...interactiveObjects]
  .filter(o => MENU_ORDER.includes(o.userData.info.type))
  .sort(
    (a, b) =>
      MENU_ORDER.indexOf(a.userData.info.type) -
      MENU_ORDER.indexOf(b.userData.info.type)
  )
  .forEach(obj => {
    const info = obj.userData.info;

    if (seenType.has(info.type)) return;
    seenType.add(info.type);

    const li = document.createElement('li');
    const btn = document.createElement('button');

    btn.className = 'menu-item';
    btn.type = 'button';

    const number = document.createElement('span');
    number.className = 'menu-number';
    number.textContent = String(seenType.size).padStart(2, '0');

    const ico = document.createElement('span');
    ico.className = 'ico';
    ico.textContent = MENU_ICON[info.type] || '•';

    const txt = document.createElement('span');
    txt.className = 'menu-copy';

    const t = document.createElement('span');
    t.className = 't';
    t.textContent = info.title;

    const n = document.createElement('span');
    n.className = 'n';
    n.textContent = info.name;

    const arrow = document.createElement('span');
    arrow.className = 'menu-arrow';
    arrow.textContent = '›';
    arrow.setAttribute('aria-hidden', 'true');

    txt.append(t, n);
    btn.append(number, ico, txt, arrow);

    btn.addEventListener('click', () => {
      setMenu(false);
      activateItem(obj);
    });

    li.appendChild(btn);
    menuList.appendChild(li);
  });

menuBtn.addEventListener('click', () => {
  setMenu(!menuPanel.classList.contains('open'));
});

closeBtn.addEventListener('click', () => setMenu(false));
scrim.addEventListener('click', () => setMenu(false));

addEventListener('keydown', e => {
  if (S.introActive) {
    skipIntro();
    return;
  }

  if (e.key === 'Escape' && menuPanel.classList.contains('open')) {
    setMenu(false);
    return;
  }

  if (stage.active) return;
});

addEventListener('click', e => {
  if (S.introActive) {
    skipIntro();
    return;
  }

  if (
    (e.target as HTMLElement).closest(
      '#vision-btn, #menu-btn, #menu-panel, ' +
      '#detective-menu-scrim, #notebook, #inventory, ' +
      '#tour-bar, #back-btn'
    )
  ) return;

  if (stage.active) return;

  if (menuPanel.classList.contains('open')) {
    setMenu(false);
    return;
  }

  const p = layer.toLogical(e.clientX, e.clientY);

  if (hudClickLogical(p.x, p.y)) return;

  if (S.hoveredItem) {
    activateItem(S.hoveredItem);
    return;
  }

  S.lampOn = !S.lampOn;
});

export { goTo };
