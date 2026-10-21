/** พาเลตสี 8-bit ของ UI ทั้งหมด (noir detective: ม่วงดำ + กระดาษ + เหลืองอำพัน + แดงปากกา + เขียว CRT) */
export const PAL = {
  ink: '#120d14', night: '#1d1526', plum: '#2e2038', dusk: '#4a3550', mauve: '#6d5273',
  paper: '#efe3c2', paper2: '#d6c49a', paper3: '#a8956a', paperShade: '#bfae84',
  cork: '#b07c45', corkDark: '#7a5230', corkLight: '#c99a5f', wood: '#5a3520', woodDark: '#34200f',
  amber: '#f4b73c', orange: '#e07a2c', red: '#d23a2f', redDark: '#8c231f',
  green: '#6be39a', greenMid: '#2f9e63', greenDark: '#164d32', crt: '#0c2218', crtMid: '#123a28',
  teal: '#3cb4ac', blue: '#4a74c9', navy: '#233b73',
  white: '#fff8e8', gray: '#8b8394', grayDark: '#554a5c', yellow: '#ffe066',
} as const;
export type PalKey = keyof typeof PAL;
