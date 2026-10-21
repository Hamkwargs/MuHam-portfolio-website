/** แถบ "Now playing" มุมขวาล่าง (ขึ้นเมื่อเริ่มเล่นเพลง) */
import './pixel-css';
import { player } from '../music';
const el = document.createElement('div'); el.id = 'nowplaying'; el.setAttribute('data-keep', ''); el.hidden = true;
el.innerHTML = '<div class="np-disc"></div><div class="np-text"><div class="np-k">NOW PLAYING</div><div class="np-t"></div><div class="np-a"></div></div><div class="np-btns"><button data-a="prev" title="Previous" type="button">◀</button><button data-a="play" title="Play / pause" type="button">▮▮</button><button data-a="next" title="Next" type="button">▶</button></div>';
document.body.appendChild(el);
const $ = (s: string) => el.querySelector(s) as HTMLElement;
el.addEventListener('click', e => { const a = (e.target as HTMLElement).closest('button')?.dataset.a; if (a === 'prev') player.prev(); else if (a === 'next') player.next(); else if (a === 'play') player.toggle(); });
player.onChange(() => {
  if (!player.track) return; el.hidden = player.stopped; if (player.stopped) return; el.classList.toggle('spin', player.playing);
  $('.np-t').textContent = player.track.title; ($('.np-t') as HTMLElement).title = player.track.file; $('.np-a').textContent = `${player.album!.title} · ${player.album!.artist} · ${player.trackIdx + 1}/${player.album!.tracks.length}`; ($('[data-a=play]') as HTMLElement).textContent = player.playing ? '▮▮' : '▶';
  $('.np-disc').style.setProperty('--c', player.album!.color);
});
