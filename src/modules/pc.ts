/** โมดูล "คอมพิวเตอร์ CRT": ซูมเข้าจอจริง → เมนู [PROJECTS] [SKILLS] → folder carousel / case file (HTML) / skill sheet · ตัวอักษรอ่านง่าย (ไม่ pixel) */
import * as THREE from 'three';
import { camera } from '../core';
import { pcGroup, pcX, pcZ } from '../furniture';
import { registerModule } from '../stage';
import type { Rect } from '../px/pixel';
import { projects } from '../data';
import { hydrateImages } from '../doc';

// ---------- จอจริงในฉาก (texture ตอน idle) ----------
const SW = 0.36, SH = 0.26, SZ = pcZ + 0.24 + 0.012;
const idle = document.createElement('canvas'); idle.width = 136; idle.height = 96; const ictx = idle.getContext('2d')!;
function paintIdle(on: boolean) {
  ictx.fillStyle = '#0c2218'; ictx.fillRect(0, 0, 136, 96); ictx.fillStyle = '#6be39a'; ictx.font = 'bold 11px monospace'; ictx.fillText('DETECTIVE OS', 8, 16);
  ictx.fillStyle = '#2f9e63'; ictx.fillRect(8, 22, 120, 1); ictx.font = '9px monospace'; ictx.fillStyle = '#6be39a';
  ['> PROJECTS.EXE', '> ' + projects.length + ' CASE FILES', '> CLICK TO OPEN'].forEach((l, i) => ictx.fillText(l, 8, 38 + i * 12));
  if (on) { ictx.fillStyle = '#6be39a'; ictx.fillRect(8, 78, 6, 9); } ictx.fillStyle = '#d8b158'; ictx.fillRect(98, 60, 28, 20); ictx.fillRect(98, 56, 12, 4);
}
paintIdle(true);
const idleTex = new THREE.CanvasTexture(idle); idleTex.magFilter = idleTex.minFilter = THREE.NearestFilter;
const screen = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: idleTex, color: 0xcfe9d6 }));
screen.position.set(pcX, 1.08, SZ); pcGroup.add(screen);
setInterval(() => { paintIdle(Math.floor(performance.now() / 600) % 2 === 0); idleTex.needsUpdate = true; }, 600);
const corners = [[-SW / 2, SH / 2], [SW / 2, SH / 2], [-SW / 2, -SH / 2], [SW / 2, -SH / 2]].map(([x, y]) => new THREE.Vector3(x, y, 0));
function screenRectPx(): Rect {
  screen.updateWorldMatrix(true, false); const v = new THREE.Vector3(); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  corners.forEach(c => { v.copy(c).applyMatrix4(screen.matrixWorld).project(camera); const x = (v.x * 0.5 + 0.5) * innerWidth, y = (-v.y * 0.5 + 0.5) * innerHeight; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

// ---------- DOM บนจอ ----------
const el = document.createElement('div'); el.id = 'crt-ui'; el.setAttribute('data-keep', ''); el.hidden = true;
el.innerHTML = `
<div class="crt-top"><span class="crt-brand">DETECTIVE OS 1.0</span><span class="crt-path"></span><span class="crt-prog"></span></div>
<div class="crt-view v-list"><div class="crt-split"><div class="crt-list"></div><aside class="crt-peek"></aside></div></div>
<div class="crt-view v-detail"><div class="d-head"><h3 class="d-title"></h3><span class="d-stamp"></span></div><div class="d-meta"></div><div class="d-stats"></div><div class="d-tags"></div><div class="md d-body"></div><div class="d-actions"></div></div>
<div class="crt-nav"><button class="crt-back" type="button">◂ BACK TO LIST</button></div>`;
document.body.appendChild(el);
const $ = <T extends HTMLElement>(s: string) => el.querySelector(s) as T;
const pips = (n: number, max = 5) => '<span class="pips">' + Array.from({ length: max }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('') + '</span>';
const firstSentence = (text: string) => { const t = text.trim(); return t.length > 170 ? t.slice(0, 167) + '…' : t; };

$('.crt-list').innerHTML = projects.map((d, i) => `<button class="row" data-i="${i}" type="button"><span class="st st-${(d.meta.status || '').toLowerCase()}">${d.meta.status ?? ''}</span><b title="${d.meta.title}">${d.meta.title}</b><small>${d.meta.year}</small></button>`).join('');
const peekDefault = '<div class="peek-hint">▸ Hover a project for a sneak peek<br>▸ Click to open the case file</div>';
$('.crt-peek').innerHTML = peekDefault;
function peek(i: number) {
  const d = projects[i]; $('.crt-peek').innerHTML = `<div class="peek-t">${d.meta.title}</div><div class="hook">“${d.meta.hook ?? ''}”</div><p class="peek-p">${firstSentence(d.summary || d.text)}</p><div class="meta"><span>${d.meta.role}</span><span class="lab">DIFFICULTY</span>${pips(+d.meta.difficulty || 0)}<span class="lab">IMPACT</span>${pips(+d.meta.impact || 0)}</div><div class="d-tags">${d.list('tags').map(t => `<em>${t}</em>`).join('')}</div><div class="peek-hint">Click to open ▸</div>`;
}
type View = 'list' | 'detail';
let view: View = 'list', ready = false; const opened = new Set<string>();
function setView(v: View) {
  view = v; el.querySelectorAll('.crt-view').forEach(n => n.classList.remove('on')); $('.v-' + v).classList.add('on');
  $('.crt-path').textContent = 'C:\\PORTFOLIO\\PROJECTS' + (v === 'detail' ? '\\CASE' : ''); $('.crt-nav').toggleAttribute('hidden', v === 'list');
}
function progress() { const n = opened.size, N = projects.length; $('.crt-prog').textContent = `CASES OPENED ${n}/${N}${n === N && N ? ' · BADGE: MASTER DETECTIVE ★' : ''}`; $('.crt-prog').classList.toggle('done', n === N && N > 0); }
function openCase(i: number) {
  const d = projects[i]; opened.add(d.id); progress(); setView('detail');
  $('.d-title').textContent = d.meta.title; ($('.d-title') as HTMLElement).title = d.meta.title; $('.d-stamp').textContent = d.meta.status || '';
  $('.d-meta').textContent = `${d.meta.year} · ${d.meta.role}`;
  $('.d-stats').innerHTML = `<span class="lab">DIFFICULTY</span>${pips(+d.meta.difficulty || 0)} <span class="lab">IMPACT</span>${pips(+d.meta.impact || 0)}`;
  $('.d-tags').innerHTML = d.list('tags').map(t => `<em>${t}</em>`).join('');
  $('.d-body').innerHTML = (d.meta.hook ? `<blockquote>${d.meta.hook}</blockquote>` : '') + d.body; hydrateImages($('.d-body'));
  $('.d-actions').innerHTML = d.meta.link ? `<a class="crt-open" href="${d.meta.link}" target="_blank" rel="noopener">↗ OPEN PROJECT</a>` : '';
  $('.v-detail').scrollTop = 0;
}
const list = $('.crt-list');
list.addEventListener('pointerover', e => { const r = (e.target as HTMLElement).closest('.row') as HTMLElement | null; if (r) peek(+r.dataset.i!); });
list.addEventListener('pointerleave', () => { $('.crt-peek').innerHTML = peekDefault; });
list.addEventListener('focusin', e => { const r = (e.target as HTMLElement).closest('.row') as HTMLElement | null; if (r) peek(+r.dataset.i!); });
list.addEventListener('click', e => { const r = (e.target as HTMLElement).closest('.row') as HTMLElement | null; if (r) openCase(+r.dataset.i!); });
el.addEventListener('click', e => { if ((e.target as HTMLElement).closest('.crt-back')) back(); });
function back(): boolean { if (view === 'detail') { setView('list'); return true; } return false; }

registerModule({
  id: 'pc', flightDur: 1.7,
  inner: () => view === 'detail',
  open() { ready = true; progress(); setView('list'); $('.crt-peek').innerHTML = peekDefault; el.hidden = false; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); },
  close() { ready = false; el.hidden = true; el.classList.remove('on'); },
  back,
  update() {
    if (!ready) return;
    // จอ CRT (DOM) วางทับจอจริงในฉาก — ถ้าจอจริงเล็กเกินอ่าน/คำนวณพิกัดพลาด (หน้าต่างเล็ก, มือถือ, จอแปลก ๆ) ให้ขยาย/วางกลางจอแทน
    const compact = innerWidth < 760 || innerHeight < 540;
    let r = screenRectPx();
    const ok = [r.x, r.y, r.w, r.h].every(Number.isFinite) && r.w > 20 && r.h > 20;
    if (compact) r = { x: 8, y: 66, w: innerWidth - 16, h: Math.max(180, innerHeight - 66 - 84) };
    else if (!ok) { const h = Math.min(innerHeight * 0.7, 440); r = { x: (innerWidth - h * 1.385) / 2, y: (innerHeight - h) / 2, w: h * 1.385, h }; }
    else if (r.h < 360) {
      const k = Math.min(360 / r.h, (innerWidth * 0.9) / r.w, (innerHeight - 140) / r.h), cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      r = { x: cx - (r.w * k) / 2, y: cy - (r.h * k) / 2, w: r.w * k, h: r.h * k };
    }
    el.classList.toggle('compact', compact);
    Object.assign(el.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px', fontSize: '16px' });
    el.style.setProperty('--u', (compact ? Math.max(0.95, r.w / 400) : r.h / 300) + 'px');
  },
  pointer() { /* คลิกนอกจอ = ถอยหนึ่งชั้น (stage) */ },
});
