/** เนื้อหาในสมุดโน้ตสอนเล่น (English only) — แก้ข้อความที่นี่ได้เลย */
export const notebook = {
  title: 'CASE NOTES',
  sub: 'how to work this room',
  steps: [
    { n: 1, head: 'Look around', body: 'Move the mouse and the whole room leans with you.' },
    { n: 2, head: 'Inspect', body: 'Click anything that glows. Each object holds a piece of the story.' },
    { n: 3, head: 'Step back', body: 'Click empty space or press ESC to put it down. The camera goes back to the room.' },
    { n: 4, head: 'Keep going', body: 'Scroll to be walked to the next clue, or open the menu (top left) to jump straight to one.' },
    { n: 5, head: 'Find the key', body: 'Somewhere on the side table by the door. It opens more than a lock.' },
  ],
  scribbles: ['don\u2019t trust the coffee', 'it\u2019s all connected?', 'ask about the missing page'],
  stamp: 'READ ME',
  close: 'GOT IT',
  hint: 'Closing me puts me in your inventory \u2014 click the notebook there to read me again.',
} as const;
