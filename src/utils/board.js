import { uid } from './id.js';

export function createDefaultBoard() {
  return {
    id: uid(),
    name: 'নতুন আইডিয়া',
    nodes: [
      {
        id: 'n1',
        x: 640,
        y: 300,
        w: 210,
        h: 96,
        type: 'rounded',
        text: 'আমার নতুন আইডিয়া',
        color: '#f2f2f0',
        textColor: '#111',
        fontSize: 15,
      },
      {
        id: 'n2',
        x: 330,
        y: 160,
        w: 176,
        h: 76,
        type: 'rounded',
        text: 'গবেষণা',
        color: '#343433',
        textColor: '#fff',
        fontSize: 14,
      },
      {
        id: 'n3',
        x: 960,
        y: 150,
        w: 176,
        h: 76,
        type: 'rounded',
        text: 'পরিকল্পনা',
        color: '#d9d9d6',
        textColor: '#111',
        fontSize: 14,
      },
      {
        id: 'n4',
        x: 970,
        y: 470,
        w: 116,
        h: 116,
        type: 'circle',
        text: 'পরবর্তী ধাপ',
        color: '#747472',
        textColor: '#fff',
        fontSize: 13,
      },
    ],
    edges: [
      { id: 'e1', a: 'n1', b: 'n2', style: 'curve' },
      { id: 'e2', a: 'n1', b: 'n3', style: 'curve' },
      { id: 'e3', a: 'n1', b: 'n4', style: 'straight' },
    ],
  };
}

// window.__KKMM_RECOVERED__ is populated in main.jsx from the bundled seed
// data so any boards recovered from a previous version of the app get
// merged into local storage exactly once (see RECOVERY_FLAG_KEY).
export function loadRecoveredBoards() {
  const raw = globalThis.__KKMM_RECOVERED__;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.boards)) return raw.boards;
  return [];
}

export function edgePoint(node) {
  return { x: node.x + node.w / 2, y: node.y + node.h / 2 };
}

export function edgePath(a, b, style, offset = { x: 0, y: 0 }) {
  const p1 = edgePoint(a);
  const p2 = edgePoint(b);
  const x1 = p1.x + offset.x;
  const y1 = p1.y + offset.y;
  const x2 = p2.x + offset.x;
  const y2 = p2.y + offset.y;
  if (style === 'curve') {
    const midX = (x1 + x2) / 2;
    return `M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`;
  }
  return `M${x1},${y1} L${x2},${y2}`;
}
