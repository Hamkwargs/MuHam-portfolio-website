/**
 * ระบบเพลง: อัลบั้ม = ไฟล์ src/content/albums/*.html + โฟลเดอร์เสียง src/assets/audio/<folder>/
 * ชื่อเพลงมาจากชื่อไฟล์ (01-my-song.mp3 → "my song") · ลำดับตามชื่อไฟล์ · เพลงต่างอัลบั้มชื่อซ้ำกันได้ (แยกด้วยโฟลเดอร์)
 */
import { albums, type Album } from './data';
const audio = new Audio(); audio.volume = 0.55;
const listeners: Array<() => void> = [];
export const player = {
  albumIdx: -1, trackIdx: 0, playing: false,
  get album(): Album | undefined { return albums[this.albumIdx]; },
  get track() { return this.album?.tracks[this.trackIdx]; },
  onChange(f: () => void) { listeners.push(f); },
  play(a: number, t = 0) {
    const al = albums[a]; if (!al?.tracks.length) return false; this.albumIdx = a; this.trackIdx = Math.max(0, Math.min(al.tracks.length - 1, t));
    this.stopped = false; audio.src = al.tracks[this.trackIdx].url; audio.play().then(() => { this.playing = true; emit(); }).catch(() => { this.playing = false; emit(); }); this.playing = true; emit(); return true;
  },
  stopped: true,
  stop() { audio.pause(); audio.currentTime = 0; this.playing = false; this.stopped = true; emit(); },
  toggle() { if (!this.track) return; if (audio.paused) audio.play(); else audio.pause(); },
  next() { const al = this.album; if (al) this.play(this.albumIdx, (this.trackIdx + 1) % al.tracks.length); },
  prev() { const al = this.album; if (al) this.play(this.albumIdx, (this.trackIdx + al.tracks.length - 1) % al.tracks.length); },
};
const emit = () => listeners.forEach(f => f());
audio.addEventListener('play', () => { player.playing = true; emit(); }); audio.addEventListener('pause', () => { player.playing = false; emit(); });
audio.addEventListener('ended', () => player.next());
