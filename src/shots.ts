/** ตำแหน่งกล้องของแต่ละ element: tour = มุมกว้างตอนเลื่อนผ่าน · focus = มุมใกล้ตอนเปิดดู */
import { shot, type Shot } from './rig';

export type StopId = 'board' | 'trophy' | 'pc' | 'desk' | 'resume' | 'music';
export const TOUR_ORDER: StopId[] = ['board', 'trophy', 'pc', 'desk', 'resume'];

export const SHOTS: Record<StopId, { tour: Shot; focus: Shot }> = {
  board: { tour: shot(-0.55, 1.98, 0.25, -3.62, 1.98, 0.0), focus: shot(-0.85, 1.98, 0.0, -3.62, 1.98, 0.0, 0.02) },
  trophy: { tour: shot(-1.5, 2.3, 0.5, -3.0, 2.1, -1.8), focus: shot(-2.35, 2.35, -0.55, -3.0, 2.15, -1.8, 0.02) },
  pc: { tour: shot(-1.2, 1.3, 2.6, -1.7, 1.05, 1.2), focus: shot(-1.7, 1.08, 1.72, -1.7, 1.08, 1.19, 0) },
  desk: { tour: shot(1.5, 2.3, -0.3, 3.3, 1.1, 0.8), focus: shot(2.3, 3.0, 0.85, 3.3, 1.1, 0.85, 0.02) },
  music: { tour: shot(1.4, 1.5, 4.9, 1.85, 0.3, 2.45), focus: shot(1.85, 1.55, 3.55, 1.82, 0.28, 2.42, 0.02) },
  resume: { tour: shot(1.6, 1.9, 0.4, 2.3, 2.0, -2.4), focus: shot(2.25, 2.05, -1.2, 2.25, 2.05, -2.48, 0.01) },
};
