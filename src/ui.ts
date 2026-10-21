/** เมนู hamburger + คลิกวัตถุในฉาก → เปิดโมดูล (board/trophy/pc/tools/desk/resume) */
import { S } from './state';
import { interactiveObjects } from './interactables';
import { cycleMood } from './weather';
import { showCoffeeToast } from './interaction';
import { skipIntro } from './intro';
import { stage, layer } from './stage';
import { TOUR_ORDER, type StopId } from './shots';
import { goTo, openStop, hudClickLogical } from './tour';
import { useDoor } from './door';

export function activateItem(obj: any) {
  const type = obj.userData.info.type;
  if (type === 'window') { cycleMood(); return; }
  if (type === 'coffee') { showCoffeeToast(); return; }
  if (type === 'door') { useDoor(); return; }
  if (type === 'music' || TOUR_ORDER.includes(type)) { setMenu(false); openStop(type as StopId); }
}

const menuBtn = document.getElementById('menu-btn')!;
const menuPanel = document.getElementById('menu-panel')!;
const menuList = document.getElementById('menu-list')!;
const MENU_ORDER = ['board', 'trophy', 'pc', 'desk', 'resume', 'music', 'coffee', 'window'];
const MENU_ICON: Record<string, string> = { pc: '🖥️', board: '📌', resume: '🖼️', tools: '🗂️', trophy: '🏆', desk: '☎️', music: '💿', coffee: '☕', window: '🪟' };
function setMenu(open: boolean) {
  menuBtn.classList.toggle('open', open); menuPanel.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
}
const seenType = new Set<string>();
[...interactiveObjects]
  .filter(o => MENU_ORDER.includes(o.userData.info.type))
  .sort((a, b) => MENU_ORDER.indexOf(a.userData.info.type) - MENU_ORDER.indexOf(b.userData.info.type))
  .forEach(obj => {
    const info = obj.userData.info; if (seenType.has(info.type)) return; seenType.add(info.type);
    const li = document.createElement('li'), btn = document.createElement('button');
    btn.className = 'menu-item'; btn.type = 'button';
    const ico = document.createElement('span'); ico.className = 'ico'; ico.textContent = MENU_ICON[info.type] || '•';
    const txt = document.createElement('span');
    const t = document.createElement('span'); t.className = 't'; t.textContent = info.title;
    const n = document.createElement('span'); n.className = 'n'; n.textContent = info.name;
    txt.append(t, n); btn.append(ico, txt);
    btn.addEventListener('click', () => activateItem(obj));
    li.appendChild(btn); menuList.appendChild(li);
  });
menuBtn.addEventListener('click', () => setMenu(!menuPanel.classList.contains('open')));

addEventListener('keydown', e => {
  if (S.introActive) { skipIntro(); return; }
  if (stage.active) return;
  if (e.key === 'Escape') setMenu(false);
});
addEventListener('click', e => {
  if (S.introActive) { skipIntro(); return; }
  if ((e.target as HTMLElement).closest('#vision-btn, #menu-btn, #menu-panel, #notebook, #inventory, #tour-bar, #back-btn')) return;
  if (stage.active) return;                       // โมดูลรับคลิกเองผ่าน stage
  if (menuPanel.classList.contains('open')) { setMenu(false); return; }
  const p = layer.toLogical(e.clientX, e.clientY);
  if (hudClickLogical(p.x, p.y)) return;
  if (S.hoveredItem) { activateItem(S.hoveredItem); return; }
  S.lampOn = !S.lampOn;
});
export { goTo };
