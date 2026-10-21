/** โหลดเนื้อหา HTML ทั้งหมดใน src/content เป็นข้อมูลพร้อมใช้ (เพิ่ม/แก้ไฟล์ .html แล้วเว็บอัปเดตเอง) */
import { loadDocs, type Doc } from './doc';
import { albumTracks, assetUrl, type Track } from './assets';

const g = (m: Record<string, string>) => loadDocs(m);
export const profileDoc: Doc = g(import.meta.glob('./content/profile/*.html', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>)[0];
export const education = g(import.meta.glob('./content/education/*.html', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>);
export const experience = g(import.meta.glob('./content/experience/*.html', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>);
export const awards = g(import.meta.glob('./content/awards/*.html', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>);
export const projects = g(import.meta.glob('./content/projects/*.html', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>);
export const docSheets = g(import.meta.glob('./content/docs/*.html', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>);
const albumDocs = g(import.meta.glob('./content/albums/*.html', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>);

const siteDoc = g(import.meta.glob('./content/site.html', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>)[0];
const contactDoc = g(import.meta.glob('./content/contact/*.html', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>)[0];
export const site = { nextLabel: siteDoc.meta.nextLabel, nextPage: siteDoc.meta.nextPage, doorLocked: siteDoc.meta.doorLocked, doorOpen: siteDoc.meta.doorOpen };
export interface Contact { label: string; value: string; href: string }
export const contacts: Contact[] = Array.from(contactDoc.root.querySelectorAll('a[href]')).map(a => ({ label: a.getAttribute('data-label') || a.textContent!.trim(), value: a.textContent!.trim(), href: a.getAttribute('href')! }));

export interface Album { id: string; title: string; artist: string; color: string; cover?: string; tracks: Track[]; note: string }
export const albums: Album[] = albumDocs.map(d => ({ id: d.id, title: d.meta.title, artist: d.meta.artist || '', color: d.meta.color || '#d23a2f', cover: assetUrl(d.meta.cover), tracks: albumTracks(d.meta.folder || d.id), note: d.body }));
export const profile = { name: profileDoc.meta.name, role: profileDoc.meta.role, tagline: profileDoc.meta.tagline, cls: profileDoc.meta.class, level: parseInt(profileDoc.meta.level) || 1, photo: assetUrl(profileDoc.meta.photo), photoPixel: assetUrl(profileDoc.meta.photoPixel), body: profileDoc.body };
export const cv = { image: assetUrl('cv.png'), pdf: assetUrl('cv.pdf') };
