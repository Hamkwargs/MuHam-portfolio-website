/** กระเป๋า (inventory) มุมซ้ายล่าง: เก็บของที่หยิบจากฉาก เช่น กุญแจ · สมุดโน้ต (คลิกเพื่อเปิดอีกครั้ง) */
import './pixel-css';
const ICONS: Record<string, string> = {
  key: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10' shape-rendering='crispEdges'><path fill='%23f4b73c' d='M1 1h3v1h1v2H4v1H1V4H0V2h1z'/><path fill='%23120d14' d='M2 2h1v1H2z'/><path fill='%23f4b73c' d='M4 3h5v1H4z M7 4h1v2H7z M9 4h1v1H9z'/></svg>",
  notebook: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10' shape-rendering='crispEdges'><path fill='%238a4b2a' d='M1 0h8v10H1z'/><path fill='%235a2f18' d='M1 0h2v10H1z'/><path fill='%23d8d1bd' d='M0 1h2v1H0z M0 4h2v1H0z M0 7h2v1H0z'/><path fill='%23f4ecd6' d='M4 2h4v3H4z'/><path fill='%238a4b2a' d='M5 3h2v1H5z'/><path fill='%23f4b73c' d='M7 7h1v3H7z'/></svg>",
};
const el = document.createElement('div'); el.id = 'inventory'; el.setAttribute('data-keep', ''); el.hidden = true;
el.innerHTML = '<div class="inv-title">INVENTORY</div><div class="inv-slots"></div>'; document.body.appendChild(el);
export const inventory = {
  items: new Set<string>(),
  has: (k: string) => inventory.items.has(k),
  /** onUse = ถ้ามี ช่องนี้คลิกได้ (เช่น เปิดสมุดโน้ตอีกครั้ง) */
  add(k: string, label: string, onUse?: () => void) { inventory.items.add(k); this.labels[k] = label; if (onUse) this.uses[k] = onUse; render(); },
  /** ตำแหน่งช่องของไอเท็มบนหน้าจอ (ใช้ทำอนิเมชันบินเข้ากระเป๋า) */
  slotRect(k: string): DOMRect | null { const i = [...inventory.items].indexOf(k); const s = el.querySelectorAll('.slot')[i] as HTMLElement | undefined; return s ? s.getBoundingClientRect() : null; },
  labels: {} as Record<string, string>,
  uses: {} as Record<string, () => void>,
};
function render() {
  const slots = el.querySelector('.inv-slots') as HTMLElement; slots.replaceChildren();
  for (let i = 0; i < 3; i++) {
    const k = [...inventory.items][i]; const s = document.createElement('div'); s.className = 'slot' + (k ? ' full' : '');
    if (k) {
      s.innerHTML = `<img alt="" src="data:image/svg+xml;utf8,${ICONS[k] ?? ''}">`; s.title = inventory.labels[k] ?? k;
      const use = inventory.uses[k];
      if (use) { s.classList.add('use'); s.tabIndex = 0; s.setAttribute('role', 'button'); s.setAttribute('aria-label', inventory.labels[k] ?? k); s.addEventListener('click', e => { e.stopPropagation(); use(); }); s.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); use(); } }); }
    }
    slots.append(s);
  }
  el.hidden = inventory.items.size === 0;
}
