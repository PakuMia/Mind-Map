import { useEffect, useRef, useState } from 'react';
import { Archive, Download, X } from 'lucide-react';

import Header from './components/Header.jsx';
import TopActionBar from './components/TopActionBar.jsx';
import TabsBar from './components/TabsBar.jsx';
import Sidebar from './components/Sidebar.jsx';
import BoardCanvas from './components/BoardCanvas.jsx';
import FloatBar from './components/FloatBar.jsx';
import ConnectionPanel from './components/ConnectionPanel.jsx';
import ZoomBar from './components/ZoomBar.jsx';

import {
  ALIGN_OPTIONS,
  CANVAS,
  COLOR_NAMES,
  CORNER_RADIUS_PRESETS,
  DEFAULT_PROJECT_ID,
  DEFAULT_SHORTCUTS,
  DEFAULT_ZOOM,
  FONT_FAMILIES,
  FONT_SIZE_PRESETS,
  GRID_STEP,
  OPACITY_PRESETS,
  PALETTE,
  RECOVERY_FLAG_KEY,
  SHAPE_LABELS,
  STORAGE_KEYS,
  STROKE_WIDTH_PRESETS,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  textColorFor,
} from './constants.js';
import { uid } from './utils/id.js';
import { matchesShortcut } from './utils/shortcuts.js';
import { createDefaultBoard, loadRecoveredBoards } from './utils/board.js';

function loadInitialBoards() {
  try {
    const storedRaw = JSON.parse(localStorage.getItem(STORAGE_KEYS.boards));
    const stored = (storedRaw || [createDefaultBoard()]).map((b) => ({ ...b, projectId: b.projectId || DEFAULT_PROJECT_ID }));
    const recovered = loadRecoveredBoards().map((b) => ({ ...b, projectId: b.projectId || DEFAULT_PROJECT_ID }));
    if (recovered.length && localStorage.getItem(RECOVERY_FLAG_KEY) !== 'done') {
      localStorage.setItem(RECOVERY_FLAG_KEY, 'done');
      const existingIds = new Set(stored.map((b) => b.id));
      return [...recovered.filter((b) => !existingIds.has(b.id)), ...stored];
    }
    return stored;
  } catch {
    const recovered = loadRecoveredBoards();
    return recovered.length
      ? recovered.map((b) => ({ ...b, projectId: b.projectId || DEFAULT_PROJECT_ID }))
      : [{ ...createDefaultBoard(), projectId: DEFAULT_PROJECT_ID }];
  }
}

function loadInitialProjects() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.folders)) || [{ id: DEFAULT_PROJECT_ID, name: 'My first project' }];
  } catch {
    return [{ id: DEFAULT_PROJECT_ID, name: 'My first project' }];
  }
}

function loadInitialShortcuts() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.keys)) || {};
  } catch {
    saved = {};
  }
  delete saved.pan;
  return { ...DEFAULT_SHORTCUTS, ...saved, multi: saved.multi === '+' ? 'm' : saved.multi || 'm' };
}

export default function App() {
  const initialBoardsRef = useRef(null);
  if (initialBoardsRef.current === null) initialBoardsRef.current = loadInitialBoards();
  const initialProjectsRef = useRef(null);
  if (initialProjectsRef.current === null) initialProjectsRef.current = loadInitialProjects();

  const [boards, setBoards] = useState(initialBoardsRef.current);
  const [projects, setProjects] = useState(initialProjectsRef.current);

  const [activeTabId, setActiveTabId] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.activeTab);
    const list = initialBoardsRef.current;
    return list.some((b) => b.id === saved) ? saved : list[0].id;
  });
  const [activeProjectId, setActiveProjectId] = useState(() => {
    const savedTab = localStorage.getItem(STORAGE_KEYS.activeTab);
    const savedProject = localStorage.getItem(STORAGE_KEYS.activeProject);
    const tabProject = initialBoardsRef.current.find((b) => b.id === savedTab)?.projectId;
    const list = initialProjectsRef.current;
    if (tabProject && list.some((p) => p.id === tabProject)) return tabProject;
    if (list.some((p) => p.id === savedProject)) return savedProject;
    return DEFAULT_PROJECT_ID;
  });

  const [selection, setSelection] = useState([]);
  const [tool, setTool] = useState('select');
  const [connectSource, setConnectSource] = useState(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modal, setModal] = useState(null); // 'keys' | 'files' | null
  const [contextMenu, setContextMenu] = useState(null); // { type, id, x, y }
  const [marquee, setMarquee] = useState(null);
  const [savedStatus, setSavedStatus] = useState('All changes saved');
  const [archives, setArchives] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.archives)) || [];
    } catch {
      return [];
    }
  });
  const [shortcuts, setShortcuts] = useState(loadInitialShortcuts);
  const [renamingTabId, setRenamingTabId] = useState(null);
  const [renamingProjectId, setRenamingProjectId] = useState(null);
  const [floatbarPos, setFloatbarPos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.floatbarPos)) || { x: 24, y: 18 };
    } catch {
      return { x: 24, y: 18 };
    }
  });
  const [showGrid, setShowGrid] = useState(() => localStorage.getItem('kkmm-grid') !== 'off');
  const [snapEnabled, setSnapEnabled] = useState(() => localStorage.getItem('kkmm-snap') === 'on');

  const floatbarDragRef = useRef(null);
  const gestureRef = useRef(null);
  const undoStackRef = useRef([]);
  const boardScrollRef = useRef(null);
  const fitViewRef = useRef(null);
  const spaceHeldRef = useRef(false);

  const board = boards.find((b) => b.id === activeTabId) || boards[0];
  const primaryId = selection.at(-1);
  const projectBoards = boards.filter((b) => b.projectId === activeProjectId);
  const boardCountByProject = Object.fromEntries(projects.map((p) => [p.id, boards.filter((b) => b.projectId === p.id).length]));

  // --- persistence -----------------------------------------------------

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.boards, JSON.stringify(boards));
    setSavedStatus('Saving…');
    const t = setTimeout(() => setSavedStatus('All changes saved'), 400);
    return () => clearTimeout(t);
  }, [boards]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.folders, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.activeTab, activeTabId);
  }, [activeTabId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.activeProject, activeProjectId);
  }, [activeProjectId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.floatbarPos, JSON.stringify(floatbarPos));
  }, [floatbarPos]);

  useEffect(() => {
    localStorage.setItem('kkmm-grid', showGrid ? 'on' : 'off');
  }, [showGrid]);

  useEffect(() => {
    localStorage.setItem('kkmm-snap', snapEnabled ? 'on' : 'off');
  }, [snapEnabled]);

  // hold Space to pan
  useEffect(() => {
    function down(e) {
      if (
        e.code === 'Space' &&
        !document.activeElement?.isContentEditable &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)
      ) {
        spaceHeldRef.current = true;
        e.preventDefault();
      }
    }
    function up(e) {
      if (e.code === 'Space') spaceHeldRef.current = false;
    }
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (boardScrollRef.current) {
        boardScrollRef.current.scrollLeft = CANVAS.offsetX * zoom - 180;
        boardScrollRef.current.scrollTop = CANVAS.offsetY * zoom - 120;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabId]);

  // --- undo -------------------------------------------------------------

  function pushUndoSnapshot(json) {
    undoStackRef.current.push(json);
    if (undoStackRef.current.length > 80) undoStackRef.current.shift();
  }
  function pushUndo() {
    pushUndoSnapshot(JSON.stringify(boards));
  }
  function undo() {
    const snapshot = undoStackRef.current.pop();
    if (!snapshot) {
      setSavedStatus('Nothing to undo');
      return;
    }
    setBoards(JSON.parse(snapshot));
    setSelection([]);
    setSavedStatus('Undone');
  }

  function updateBoard(updater, shouldPushUndo = true) {
    if (shouldPushUndo) pushUndo();
    setBoards((bs) => bs.map((b) => (b.id === activeTabId ? updater(b) : b)));
  }

  function updateNode(nodeId, patch, shouldPushUndo = true) {
    updateBoard(
      (b) => ({
        ...b,
        nodes: b.nodes.map((n) =>
          n.id === nodeId ? { ...n, ...patch, ...(patch.color ? { textColor: textColorFor(patch.color) } : {}) } : n
        ),
      }),
      shouldPushUndo
    );
  }

  // --- shapes -------------------------------------------------------------

  function addShape(kind) {
    // Insert shortcuts always create the friendly rounded box; a true sharp
    // rectangle is only reachable through the "Change shape" context menu.
    const type = kind === 'rectangle' ? 'rounded' : kind;
    const id = uid();
    const isCircle = kind === 'circle';
    const isSquare = kind === 'square';
    updateBoard((b) => {
      const color = PALETTE[b.nodes.length % PALETTE.length];
      return {
        ...b,
        nodes: [
          ...b.nodes,
          {
            id,
            x: 600 + Math.random() * 100,
            y: 260 + Math.random() * 100,
            w: isCircle ? 116 : isSquare ? 130 : 190,
            h: isCircle ? 116 : isSquare ? 130 : 82,
            type,
            text: 'নতুন বিষয়',
            color,
            textColor: textColorFor(color),
            fontSize: 14,
          },
        ],
      };
    });
    setSelection([id]);
    setTool('select');
  }

  function deleteSelection() {
    if (!selection.length) return;
    const lockedCount = board.nodes.filter((n) => selection.includes(n.id) && n.locked).length;
    const ids = new Set(board.nodes.filter((n) => selection.includes(n.id) && !n.locked).map((n) => n.id));
    if (!ids.size) {
      setSavedStatus('Selected shapes are locked');
      return;
    }
    updateBoard((b) => ({
      ...b,
      nodes: b.nodes.filter((n) => !ids.has(n.id)),
      edges: b.edges.filter((e) => !ids.has(e.a) && !ids.has(e.b)),
    }));
    setSelection((sel) => sel.filter((id) => !ids.has(id)));
    if (lockedCount) setSavedStatus(`${lockedCount} locked shape(s) skipped`);
  }

  function duplicateSelection(offset = 24) {
    if (!selection.length) return [];
    const idMap = {};
    const clones = board.nodes
      .filter((n) => selection.includes(n.id))
      .map((n) => {
        const newId = uid();
        idMap[n.id] = newId;
        return { ...n, id: newId, x: n.x + offset, y: n.y + offset, locked: false };
      });
    updateBoard((b) => ({ ...b, nodes: [...b.nodes, ...clones] }));
    setSelection(clones.map((n) => n.id));
    return clones;
  }

  function connectNodes(aId, bId) {
    if (aId === bId) return;
    updateBoard((b) =>
      b.edges.some((e) => (e.a === aId && e.b === bId) || (e.a === bId && e.b === aId))
        ? b
        : { ...b, edges: [...b.edges, { id: uid(), a: aId, b: bId, style: 'curve' }] }
    );
  }
  function disconnectEdge(aId, bId) {
    updateBoard((b) => ({
      ...b,
      edges: b.edges.filter((e) => !((e.a === aId && e.b === bId) || (e.a === bId && e.b === aId))),
    }));
  }
  function removeEdge(edgeId) {
    updateBoard((b) => ({ ...b, edges: b.edges.filter((e) => e.id !== edgeId) }));
    setSavedStatus('Connection removed');
  }
  function setEdgeDashed(edgeId, dashed) {
    updateBoard((b) => ({ ...b, edges: b.edges.map((e) => (e.id === edgeId ? { ...e, dashed } : e)) }));
  }
  function cycleEdgeArrow(edgeId) {
    const order = ['none', 'end', 'both'];
    updateBoard((b) => ({
      ...b,
      edges: b.edges.map((e) => (e.id === edgeId ? { ...e, arrow: order[(order.indexOf(e.arrow || 'none') + 1) % order.length] } : e)),
    }));
  }

  function connectSelectedAsFlow() {
    if (selection.length < 2) return;
    const ordered = board.nodes.filter((n) => selection.includes(n.id)).sort((a, b) => a.y - b.y || a.x - b.x);
    updateBoard((b) => {
      const edges = [...b.edges];
      for (let i = 0; i < ordered.length - 1; i++) {
        const a = ordered[i].id;
        const bId = ordered[i + 1].id;
        if (!edges.some((e) => (e.a === a && e.b === bId) || (e.a === bId && e.b === a))) {
          edges.push({ id: uid(), a, b: bId, style: 'curve' });
        }
      }
      return { ...b, edges };
    });
    setSavedStatus(`${selection.length} shapes connected as a flow`);
  }

  function alignSelected(direction) {
    if (selection.length < 2) return;
    const anchor = board.nodes.find((n) => n.id === primaryId);
    if (!anchor) return;
    updateBoard(
      (b) => ({
        ...b,
        nodes: b.nodes.map((n) => {
          if (!selection.includes(n.id) || n.id === primaryId) return n;
          switch (direction) {
            case 'left':
              return { ...n, x: anchor.x };
            case 'hcenter':
              return { ...n, x: anchor.x + anchor.w / 2 - n.w / 2 };
            case 'right':
              return { ...n, x: anchor.x + anchor.w - n.w };
            case 'top':
              return { ...n, y: anchor.y };
            case 'vcenter':
              return { ...n, y: anchor.y + anchor.h / 2 - n.h / 2 };
            case 'bottom':
              return { ...n, y: anchor.y + anchor.h - n.h };
            default:
              return n;
          }
        }),
      }),
      false
    );
    setSavedStatus('Shapes aligned');
  }

  function distributeSelected(axis) {
    if (selection.length < 3) return;
    const nodes = board.nodes.filter((n) => selection.includes(n.id));
    const sorted = [...nodes].sort((a, b) => (axis === 'h' ? a.x - b.x : a.y - b.y));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const span = axis === 'h' ? last.x - first.x : last.y - first.y;
    const step = span / (sorted.length - 1);
    updateBoard((b) => ({
      ...b,
      nodes: b.nodes.map((n) => {
        const idx = sorted.findIndex((s) => s.id === n.id);
        if (idx <= 0 || idx >= sorted.length - 1) return n;
        return axis === 'h' ? { ...n, x: first.x + step * idx } : { ...n, y: first.y + step * idx };
      }),
    }));
    setSavedStatus('Shapes distributed evenly');
  }

  function changeShapeForIds(ids, type) {
    const idSet = new Set(ids);
    updateBoard((b) => ({
      ...b,
      nodes: b.nodes.map((n) => {
        if (!idSet.has(n.id)) return n;
        if (type === 'circle' || type === 'square') {
          const side = Math.max(n.w, n.h);
          return { ...n, type, w: side, h: side };
        }
        return { ...n, type };
      }),
    }));
    setSavedStatus('Shape changed');
    setContextMenu(null);
  }

  function setColorForIds(ids, color) {
    const idSet = new Set(ids);
    updateBoard((b) => ({ ...b, nodes: b.nodes.map((n) => (idSet.has(n.id) ? { ...n, color, textColor: textColorFor(color) } : n)) }));
    setSavedStatus('Color applied');
    setContextMenu(null);
  }

  function setFontSizeForIds(ids, rawSize) {
    const size = Math.max(6, Math.min(240, Number(rawSize) || 14));
    const idSet = new Set(ids);
    updateBoard((b) => ({ ...b, nodes: b.nodes.map((n) => (idSet.has(n.id) ? { ...n, fontSize: size } : n)) }));
    setSavedStatus('Font size updated');
    setContextMenu(null);
  }

  function setOpacityForIds(ids, opacity) {
    const idSet = new Set(ids);
    updateBoard((b) => ({ ...b, nodes: b.nodes.map((n) => (idSet.has(n.id) ? { ...n, opacity } : n)) }));
    setContextMenu(null);
  }
  function setStrokeForIds(ids, stroke) {
    const idSet = new Set(ids);
    updateBoard((b) => ({ ...b, nodes: b.nodes.map((n) => (idSet.has(n.id) ? { ...n, stroke } : n)) }));
    setContextMenu(null);
  }
  function setStrokeWidthForIds(ids, strokeWidth) {
    const idSet = new Set(ids);
    updateBoard((b) => ({ ...b, nodes: b.nodes.map((n) => (idSet.has(n.id) ? { ...n, strokeWidth } : n)) }));
    setContextMenu(null);
  }
  function setRadiusForIds(ids, radius) {
    const idSet = new Set(ids);
    updateBoard((b) => ({ ...b, nodes: b.nodes.map((n) => (idSet.has(n.id) ? { ...n, radius } : n)) }));
    setContextMenu(null);
  }
  function toggleTextStyleForIds(ids, key) {
    const idSet = new Set(ids);
    updateBoard((b) => ({ ...b, nodes: b.nodes.map((n) => (idSet.has(n.id) ? { ...n, [key]: !n[key] } : n)) }));
  }
  function setFontFamilyForIds(ids, fontFamily) {
    const idSet = new Set(ids);
    updateBoard((b) => ({ ...b, nodes: b.nodes.map((n) => (idSet.has(n.id) ? { ...n, fontFamily } : n)) }));
    setContextMenu(null);
  }

  function bringToFront(nodeId) {
    updateBoard((b) => {
      const node = b.nodes.find((n) => n.id === nodeId);
      if (!node) return b;
      return { ...b, nodes: [...b.nodes.filter((n) => n.id !== nodeId), node] };
    });
    setContextMenu(null);
  }
  function sendToBack(nodeId) {
    updateBoard((b) => {
      const node = b.nodes.find((n) => n.id === nodeId);
      if (!node) return b;
      return { ...b, nodes: [node, ...b.nodes.filter((n) => n.id !== nodeId)] };
    });
    setContextMenu(null);
  }
  function toggleLock(nodeId) {
    updateBoard((b) => ({ ...b, nodes: b.nodes.map((n) => (n.id === nodeId ? { ...n, locked: !n.locked } : n)) }));
    setSelection((sel) => sel.filter((id) => id === nodeId));
    setContextMenu(null);
  }

  function matchDimensionForAll(referenceId, dim) {
    const ref = board.nodes.find((n) => n.id === referenceId);
    if (!ref) return;
    updateBoard((b) => ({
      ...b,
      nodes: b.nodes.map((n) =>
        dim === 'width' ? { ...n, w: ref.w } : dim === 'height' ? { ...n, h: ref.h } : { ...n, w: ref.w, h: ref.h }
      ),
    }));
    setSavedStatus('Box sizes matched');
    setContextMenu(null);
  }

  function matchDimensionForTargets(referenceId, dim) {
    const ref = board.nodes.find((n) => n.id === referenceId);
    if (!ref) return;
    const idSet = new Set(selection.includes(referenceId) ? selection : [referenceId]);
    updateBoard((b) => ({
      ...b,
      nodes: b.nodes.map((n) => {
        if (!idSet.has(n.id)) return n;
        if (dim === 'width') return { ...n, w: ref.w };
        if (dim === 'height') return { ...n, h: ref.h };
        return { ...n, w: ref.w, h: ref.h };
      }),
    }));
    setSavedStatus('Selected box sizes matched');
    setContextMenu(null);
  }

  function targetIdsFor(nodeId) {
    return selection.includes(nodeId) ? selection : [nodeId];
  }

  function getConnectedTree(startId) {
    const visited = new Set([startId]);
    const queue = [startId];
    while (queue.length) {
      const current = queue.shift();
      board.edges.forEach((edge) => {
        const other = edge.a === current ? edge.b : edge.b === current ? edge.a : null;
        if (other && !visited.has(other)) {
          visited.add(other);
          queue.push(other);
        }
      });
    }
    return [...visited];
  }

  // --- pointer interaction -----------------------------------------------

  function snapValue(v) {
    return snapEnabled ? Math.round(v / GRID_STEP) * GRID_STEP : v;
  }

  function handleNodePointerDown(e, node) {
    e.stopPropagation();
    if (spaceHeldRef.current || e.button === 1) {
      const container = boardScrollRef.current;
      gestureRef.current = { kind: 'pan', sx: e.clientX, sy: e.clientY, left: container?.scrollLeft || 0, top: container?.scrollTop || 0 };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    if (tool === 'connect') {
      if (connectSource) {
        connectNodes(connectSource, node.id);
        setConnectSource(null);
      } else {
        setConnectSource(node.id);
      }
      setSelection([node.id]);
      return;
    }

    const beforeSnapshot = JSON.stringify(boards);
    let nextSelection;
    if (e.ctrlKey) nextSelection = getConnectedTree(node.id);
    else if (e.shiftKey) nextSelection = selection.includes(node.id) ? selection.filter((id) => id !== node.id) : [...selection, node.id];
    else if (tool === 'multi') nextSelection = selection.includes(node.id) ? selection : [...selection, node.id];
    else nextSelection = selection.includes(node.id) ? selection : [node.id];

    setSelection(nextSelection);

    if (node.locked) return; // locked shapes can be selected but not moved

    let movingNodes = board.nodes.filter((n) => nextSelection.includes(n.id) && !n.locked);

    if (e.altKey) {
      const clones = movingNodes.map((n) => ({ ...n, id: uid(), x: n.x + 18, y: n.y + 18 }));
      updateBoard((b) => ({ ...b, nodes: [...b.nodes, ...clones] }), false);
      nextSelection = clones.map((n) => n.id);
      setSelection(nextSelection);
      movingNodes = clones;
    }

    gestureRef.current = {
      kind: 'move',
      before: beforeSnapshot,
      changed: e.altKey,
      sx: e.clientX,
      sy: e.clientY,
      items: movingNodes.map((n) => ({ id: n.id, x: n.x, y: n.y })),
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleResizePointerDown(e, node, corner) {
    e.stopPropagation();
    if (node.locked) return;
    setSelection([node.id]);
    gestureRef.current = {
      kind: 'resize',
      before: JSON.stringify(boards),
      changed: false,
      corner,
      sx: e.clientX,
      sy: e.clientY,
      id: node.id,
      x: node.x,
      y: node.y,
      w: node.w,
      h: node.h,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePortPointerDown(e, node) {
    e.stopPropagation();
    gestureRef.current = { kind: 'link', source: node.id, disconnect: e.ctrlKey };
    setSelection([node.id]);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.kind === 'link') return;

    if (gesture.kind === 'pan') {
      const container = boardScrollRef.current;
      if (container) {
        container.scrollLeft = gesture.left - (e.clientX - gesture.sx);
        container.scrollTop = gesture.top - (e.clientY - gesture.sy);
      }
      return;
    }

    if (gesture.kind === 'marquee') {
      const nx = gesture.lx + (e.clientX - gesture.sx);
      const ny = gesture.ly + (e.clientY - gesture.sy);
      const left = Math.min(gesture.lx, nx);
      const top = Math.min(gesture.ly, ny);
      const width = Math.abs(nx - gesture.lx);
      const height = Math.abs(ny - gesture.ly);
      setMarquee({ x: left, y: top, w: width, h: height });

      const worldX = left / zoom - CANVAS.offsetX;
      const worldY = top / zoom - CANVAS.offsetY;
      const worldW = width / zoom;
      const worldH = height / zoom;
      const hits = board.nodes
        .filter((n) => n.x < worldX + worldW && n.x + n.w > worldX && n.y < worldY + worldH && n.y + n.h > worldY)
        .map((n) => n.id);
      setSelection(gesture.base?.length ? [...new Set([...gesture.base, ...hits])] : hits);
      return;
    }

    const dx = (e.clientX - gesture.sx) / zoom;
    const dy = (e.clientY - gesture.sy) / zoom;
    if ((gesture.kind === 'move' || gesture.kind === 'resize') && (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5)) {
      gesture.changed = true;
    }

    if (gesture.kind === 'move') {
      const positions = new Map(gesture.items.map((item) => [item.id, item]));
      updateBoard(
        (b) => ({
          ...b,
          nodes: b.nodes.map((n) => {
            const item = positions.get(n.id);
            return item ? { ...n, x: snapValue(item.x + dx), y: snapValue(item.y + dy) } : n;
          }),
        }),
        false
      );
    } else if (gesture.kind === 'resize') {
      const patch =
        gesture.corner === 'se'
          ? { w: Math.max(54, gesture.w + dx), h: Math.max(54, gesture.h + dy) }
          : {
              x: snapValue(gesture.x + dx),
              y: snapValue(gesture.y + dy),
              w: Math.max(54, gesture.w - dx),
              h: Math.max(54, gesture.h - dy),
            };
      if (gesture.corner === 'se') {
        patch.w = snapValue(patch.w);
        patch.h = snapValue(patch.h);
      }
      if (board.nodes.find((n) => n.id === gesture.id)?.type === 'circle') {
        const side = Math.max(patch.w ?? gesture.w, patch.h ?? gesture.h);
        patch.w = side;
        patch.h = side;
      }
      updateNode(gesture.id, patch, false);
    }
  }

  function handleBoardPointerDown(e) {
    setContextMenu(null);
    if (document.activeElement?.isContentEditable && !e.target.closest?.('.node-text')) {
      document.activeElement.blur();
    }
    if (spaceHeldRef.current || e.button === 1 || e.altKey) {
      gestureRef.current = { kind: 'pan', sx: e.clientX, sy: e.clientY, left: e.currentTarget.scrollLeft, top: e.currentTarget.scrollTop };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    if (tool !== 'multi' && tool !== 'select') {
      setSelection([]);
      return;
    }
    if (tool === 'select' && !e.shiftKey) setSelection([]);

    const rect = e.currentTarget.getBoundingClientRect();
    const lx = e.clientX - rect.left + e.currentTarget.scrollLeft;
    const ly = e.clientY - rect.top + e.currentTarget.scrollTop;
    gestureRef.current = { kind: 'marquee', sx: e.clientX, sy: e.clientY, lx, ly, base: e.shiftKey ? [...selection] : [] };
    setMarquee({ x: lx, y: ly, w: 0, h: 0 });
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerUp(e) {
    const gesture = gestureRef.current;
    if (gesture?.kind === 'link') {
      const targetId = document.elementFromPoint(e.clientX, e.clientY)?.closest('.node')?.dataset.nodeId;
      if (targetId && targetId !== gesture.source) {
        if (gesture.disconnect) {
          disconnectEdge(gesture.source, targetId);
          setSavedStatus('Shapes disconnected');
        } else {
          connectNodes(gesture.source, targetId);
          setSavedStatus('Shapes connected');
        }
        setConnectSource(null);
        setTool('select');
      } else {
        setConnectSource(gesture.source);
        setTool('connect');
        setSelection([gesture.source]);
      }
    }
    if ((gesture?.kind === 'move' || gesture?.kind === 'resize') && gesture.changed && gesture.before) {
      pushUndoSnapshot(gesture.before);
    }
    gestureRef.current = null;
    setMarquee(null);
  }

  function handleBoardContextMenu(e) {
    e.preventDefault();
    setContextMenu({ type: 'board', x: e.clientX, y: e.clientY });
  }
  function handleNodeContextMenu(e, node) {
    e.preventDefault();
    e.stopPropagation();
    if (!selection.includes(node.id)) setSelection([node.id]);
    setContextMenu({ type: 'node', id: node.id, x: e.clientX, y: e.clientY });
  }

  function handleNodeTextBlur(nodeId, text) {
    updateNode(nodeId, { text });
  }

  // --- floating toolbar drag ----------------------------------------------

  function startFloatbarDrag(e) {
    e.stopPropagation();
    floatbarDragRef.current = { sx: e.clientX, sy: e.clientY, x: floatbarPos.x, y: floatbarPos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function dragFloatbar(e) {
    const drag = floatbarDragRef.current;
    const container = boardScrollRef.current;
    if (!drag || !container) return;
    setFloatbarPos({
      x: Math.max(8, Math.min(container.clientWidth - 210, drag.x + e.clientX - drag.sx)),
      y: Math.max(8, Math.min(container.clientHeight - 70, drag.y + e.clientY - drag.sy)),
    });
  }
  function endFloatbarDrag() {
    floatbarDragRef.current = null;
  }

  // --- tabs / projects -----------------------------------------------------

  function createTab(projectId = activeProjectId) {
    const newBoard = { ...createDefaultBoard(), id: uid(), projectId };
    setBoards((bs) => [...bs, newBoard]);
    setActiveProjectId(projectId);
    setActiveTabId(newBoard.id);
    setSelection([]);
    setModal(null);
  }

  function createProject() {
    const projectId = uid();
    const project = { id: projectId, name: `Project ${projects.length + 1}` };
    const newBoard = { ...createDefaultBoard(), id: uid(), projectId };
    setProjects((p) => [...p, project]);
    setBoards((bs) => [...bs, newBoard]);
    setActiveProjectId(projectId);
    setActiveTabId(newBoard.id);
    setSelection([]);
  }

  function switchProject(projectId) {
    setActiveProjectId(projectId);
    const firstBoard = boards.find((b) => b.projectId === projectId);
    if (firstBoard) setActiveTabId(firstBoard.id);
    setSelection([]);
  }

  function switchTab(tabId) {
    const targetBoard = boards.find((b) => b.id === tabId);
    setActiveTabId(tabId);
    if (targetBoard) setActiveProjectId(targetBoard.projectId);
    setSelection([]);
  }

  function handleProjectDragStart(e, projectId) {
    e.dataTransfer.setData('kind', 'project');
    e.dataTransfer.setData('id', projectId);
  }
  function handleTabDragStart(e, tabId) {
    e.dataTransfer.setData('kind', 'tab');
    e.dataTransfer.setData('id', tabId);
  }

  function handleProjectDrop(e, targetProjectId) {
    e.preventDefault();
    const kind = e.dataTransfer.getData('kind');
    const draggedId = e.dataTransfer.getData('id');
    if (kind === 'project' && draggedId !== targetProjectId) {
      setProjects((list) => {
        const next = [...list];
        const from = next.findIndex((p) => p.id === draggedId);
        const to = next.findIndex((p) => p.id === targetProjectId);
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
    } else if (kind === 'tab') {
      setBoards((bs) => bs.map((b) => (b.id === draggedId ? { ...b, projectId: targetProjectId } : b)));
      setActiveProjectId(targetProjectId);
      setActiveTabId(draggedId);
    }
  }

  function handleTabDropOnTab(e, targetTabId) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.getData('kind') !== 'tab') return;
    const draggedId = e.dataTransfer.getData('id');
    if (draggedId === targetTabId) return;
    setBoards((list) => {
      const next = [...list];
      const target = next.find((b) => b.id === targetTabId);
      const from = next.findIndex((b) => b.id === draggedId);
      const [moved] = next.splice(from, 1);
      moved.projectId = target?.projectId || activeProjectId;
      const to = next.findIndex((b) => b.id === targetTabId);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function handleTabDropOnPanel(e) {
    e.preventDefault();
    if (e.dataTransfer.getData('kind') !== 'tab') return;
    const draggedId = e.dataTransfer.getData('id');
    setBoards((list) => [
      ...list.filter((b) => b.id !== draggedId),
      ...list.filter((b) => b.id === draggedId).map((b) => ({ ...b, projectId: activeProjectId })),
    ]);
  }

  function deleteTab(tabId) {
    const target = boards.find((b) => b.id === tabId);
    if (!target || !window.confirm(`Permanently delete "${target.name}"?`)) return;
    const siblings = boards.filter((b) => b.projectId === target.projectId && b.id !== tabId);
    if (siblings.length) {
      setBoards((bs) => bs.filter((b) => b.id !== tabId));
      if (activeTabId === tabId) setActiveTabId(siblings[0].id);
    } else {
      const fresh = { ...createDefaultBoard(), id: uid(), projectId: target.projectId };
      setBoards((bs) => [...bs.filter((b) => b.id !== tabId), fresh]);
      setActiveTabId(fresh.id);
    }
    setSelection([]);
    setContextMenu(null);
  }

  function duplicateTab(tabId) {
    const source = boards.find((b) => b.id === tabId);
    if (!source) return;
    const idMap = {};
    const nodes = source.nodes.map((n) => {
      const newId = `${n.id}-${uid()}`;
      idMap[n.id] = newId;
      return { ...n, id: newId };
    });
    const edges = source.edges.map((e) => ({ ...e, id: uid(), a: idMap[e.a], b: idMap[e.b] }));
    const clone = { ...source, id: uid(), name: `${source.name} copy`, nodes, edges };
    setBoards((bs) => [...bs, clone]);
    setActiveTabId(clone.id);
    setContextMenu(null);
  }

  function renameTabPrompt(tabId) {
    const tab = boards.find((b) => b.id === tabId);
    if (!tab) return;
    const name = window.prompt('Rename tab', tab.name);
    if (name?.trim()) setBoards((bs) => bs.map((b) => (b.id === tabId ? { ...b, name: name.trim() } : b)));
    setContextMenu(null);
  }

  function renameProjectPrompt(projectId) {
    const project = projects.find((p) => p.id === projectId);
    const name = window.prompt('Rename project', project?.name);
    if (name?.trim()) setProjects((list) => list.map((p) => (p.id === projectId ? { ...p, name: name.trim() } : p)));
    setContextMenu(null);
  }

  function deleteProject(projectId) {
    const project = projects.find((p) => p.id === projectId);
    if (!project || projects.length === 1) return;
    if (!window.confirm(`Permanently delete project "${project.name}" and all its tabs?`)) return;
    const remainingProjects = projects.filter((p) => p.id !== projectId);
    const remainingBoards = boards.filter((b) => b.projectId !== projectId);
    const nextProjectId = remainingProjects[0].id;
    const nextBoard = remainingBoards.find((b) => b.projectId === nextProjectId);
    setProjects(remainingProjects);
    setBoards(remainingBoards);
    setActiveProjectId(nextProjectId);
    if (nextBoard) setActiveTabId(nextBoard.id);
    setSelection([]);
    setContextMenu(null);
  }

  // --- clipboard / files ----------------------------------------------------

  function copyToClipboard(ids = null) {
    const scopeIds = ids?.length ? new Set(ids) : null;
    const nodes = scopeIds ? board.nodes.filter((n) => scopeIds.has(n.id)) : board.nodes;
    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = board.edges.filter((e) => nodeIds.has(e.a) && nodeIds.has(e.b));
    if (!nodes.length) {
      setSavedStatus('Select shapes to copy');
      setContextMenu(null);
      return;
    }
    const payload = { name: board.name, scope: scopeIds ? 'selection' : 'board', nodes, edges, copiedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.clipboard, JSON.stringify(payload));
    setSavedStatus(scopeIds ? `${nodes.length} shapes copied` : 'Mind map copied');
    setContextMenu(null);
  }

  function pasteFromClipboard() {
    let clip;
    try {
      clip = JSON.parse(localStorage.getItem(STORAGE_KEYS.clipboard));
    } catch {
      clip = null;
    }
    if (!clip?.nodes?.length) {
      setSavedStatus('No copied map found');
      setContextMenu(null);
      return;
    }
    const idMap = Object.fromEntries(clip.nodes.map((n) => [n.id, uid()]));
    const nodes = clip.nodes.map((n) => ({
      ...n,
      id: idMap[n.id],
      x: clip.scope === 'selection' ? n.x + 42 : n.x,
      y: clip.scope === 'selection' ? n.y + 42 : n.y,
    }));
    const edges = (clip.edges || []).filter((e) => idMap[e.a] && idMap[e.b]).map((e) => ({ ...e, id: uid(), a: idMap[e.a], b: idMap[e.b] }));
    updateBoard((b) =>
      clip.scope === 'selection' ? { ...b, nodes: [...b.nodes, ...nodes], edges: [...b.edges, ...edges] } : { ...b, nodes, edges }
    );
    setSelection(clip.scope === 'selection' ? nodes.map((n) => n.id) : []);
    setSavedStatus(clip.scope === 'selection' ? `${nodes.length} shapes pasted` : 'Copied mind map pasted into this tab');
    setContextMenu(null);
  }

  async function shareBoardLink() {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(board))));
    const url = `${location.origin}${location.pathname}?view=${encodeURIComponent(encoded)}`;
    try {
      await navigator.clipboard.writeText(url);
      setSavedStatus('Read-only link copied');
    } catch {
      window.prompt('Copy this read-only link', url);
    }
  }

  function archiveCurrentBoard() {
    const next = [{ ...board, archivedAt: new Date().toISOString() }, ...archives];
    setArchives(next);
    localStorage.setItem(STORAGE_KEYS.archives, JSON.stringify(next));
    setSavedStatus('Board archived');
    setModal(null);
  }

  function restoreArchive(archive) {
    const restored = { ...archive, id: uid() };
    setBoards((bs) => [...bs, restored]);
    setActiveTabId(restored.id);
    setModal(null);
  }

  function exportAll() {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify({ boards, archives }, null, 2)], { type: 'application/json' }));
    link.download = 'kaj-kam-mind-map.json';
    link.click();
  }

  // --- view ------------------------------------------------------------------

  function toggleFitView() {
    const container = boardScrollRef.current;
    if (!container || !board.nodes.length) return;
    if (fitViewRef.current) {
      const prev = fitViewRef.current;
      fitViewRef.current = null;
      setZoom(prev.zoom);
      requestAnimationFrame(() => {
        container.scrollLeft = prev.left;
        container.scrollTop = prev.top;
      });
      setSavedStatus('Previous view restored');
      return;
    }
    fitViewRef.current = { zoom, left: container.scrollLeft, top: container.scrollTop };
    const minX = Math.min(...board.nodes.map((n) => n.x));
    const minY = Math.min(...board.nodes.map((n) => n.y));
    const maxX = Math.max(...board.nodes.map((n) => n.x + n.w));
    const maxY = Math.max(...board.nodes.map((n) => n.y + n.h));
    const fitZoom = Math.max(
      ZOOM_MIN,
      Math.min(1.5, (container.clientWidth - 100) / (maxX - minX + 100), (container.clientHeight - 100) / (maxY - minY + 100))
    );
    setZoom(fitZoom);
    requestAnimationFrame(() => {
      container.scrollLeft = (CANVAS.offsetX + minX - 50) * fitZoom;
      container.scrollTop = (CANVAS.offsetY + minY - 50) * fitZoom;
    });
    setSavedStatus('Full board fitted');
  }

  function zoomIn() {
    fitViewRef.current = null;
    setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100));
  }
  function zoomOut() {
    fitViewRef.current = null;
    setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100));
  }
  function zoomReset() {
    fitViewRef.current = null;
    setZoom(DEFAULT_ZOOM);
  }

  // --- keyboard shortcuts ------------------------------------------------------

  useEffect(() => {
    function handleKeyDown(e) {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable) return;
      const key = e.key.toLowerCase();

      if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') {
        e.preventDefault();
        zoomIn();
        return;
      }
      if (e.key === '-' || e.code === 'NumpadSubtract') {
        e.preventDefault();
        zoomOut();
        return;
      }
      if (e.key === '\\' || e.code === 'Backslash') {
        e.preventDefault();
        toggleFitView();
        return;
      }

      const alignMatch = ALIGN_OPTIONS.find(([, , shortcutKey]) => matchesShortcut(e, shortcuts[shortcutKey]));
      if (alignMatch) {
        e.preventDefault();
        alignSelected(alignMatch[0]);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && key === 'z') {
        e.preventDefault();
        undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'c') {
        e.preventDefault();
        copyToClipboard(selection.length ? selection : null);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'v') {
        e.preventDefault();
        pasteFromClipboard();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && key === 'a') {
        e.preventDefault();
        setSelection(board.nodes.map((n) => n.id));
        return;
      }
      if (e.key === shortcuts.delete || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelection();
        return;
      }

      if (key === shortcuts.select.toLowerCase()) setTool('select');
      else if (key === shortcuts.multi.toLowerCase()) setTool('multi');
      else if (key === shortcuts.connect.toLowerCase()) {
        if (selection.length > 1) connectSelectedAsFlow();
        else setTool('connect');
      } else if (key === shortcuts.circle.toLowerCase()) addShape('circle');
      else if (key === shortcuts.rectangle.toLowerCase()) addShape('rectangle');
      else if (key === shortcuts.rounded.toLowerCase()) addShape('rounded');
      else if (key === shortcuts.square.toLowerCase()) addShape('square');
      else if ((e.ctrlKey || e.metaKey) && key === 'd') {
        e.preventDefault();
        duplicateSelection();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, selection, shortcuts, zoom, snapEnabled]);

  // --- derived render helpers --------------------------------------------------

  const contextNode = contextMenu?.type === 'node' ? board.nodes.find((n) => n.id === contextMenu.id) : null;
  const connections =
    connectSource &&
    board.edges
      .filter((e) => e.a === connectSource || e.b === connectSource)
      .map((e) => {
        const otherId = e.a === connectSource ? e.b : e.a;
        return { edgeId: e.id, label: board.nodes.find((n) => n.id === otherId)?.text || 'Shape' };
      });

  function menuPlacement(menu) {
    if (!menu) return { style: {}, className: 'context-menu' };
    const estHeight = menu.type === 'node' ? 480 : menu.type === 'board' ? 335 : 180;
    const overflowsRight = menu.x + 236 + 10 > window.innerWidth;
    const overflowsBottom = menu.y + estHeight + 10 > window.innerHeight;
    return {
      style: {
        left: overflowsRight ? Math.max(10, menu.x - 236 - 10) : Math.min(menu.x, window.innerWidth - 236 - 10),
        top: overflowsBottom ? Math.max(10, window.innerHeight - estHeight - 10) : Math.min(menu.y, window.innerHeight - estHeight - 10),
        maxHeight: 'calc(100vh - 20px)',
      },
      className: `context-menu ${overflowsRight ? 'edge-right ' : ''}${overflowsBottom ? 'edge-bottom ' : ''}`,
    };
  }
  const placement = menuPlacement(contextMenu);

  return (
    <div className="app">
      <Header
        boardName={board.name}
        onRenameBoard={(name) => updateBoard((b) => ({ ...b, name }))}
        savedStatus={savedStatus}
        onUndo={undo}
        onOpenShortcuts={() => setModal('keys')}
        onOpenMaps={() => setModal('files')}
        onShare={shareBoardLink}
        onSave={() => setSavedStatus('Saved')}
      />

      <TopActionBar
        visible={selection.length > 0}
        canAlign={selection.length > 1}
        shortcuts={shortcuts}
        activeFontSize={board.nodes.find((n) => n.id === primaryId)?.fontSize || 14}
        onAlign={alignSelected}
        onCopy={() => copyToClipboard(selection)}
        onPaste={pasteFromClipboard}
        onConnect={connectSelectedAsFlow}
        onChangeShape={(type) => changeShapeForIds(selection, type)}
        onColor={(color) => setColorForIds(selection, color)}
        onFontSize={(size) => setFontSizeForIds(selection, size)}
        onDelete={deleteSelection}
      />

      <TabsBar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        boards={projectBoards}
        activeId={activeTabId}
        onSelect={switchTab}
        onNewBoard={() => createTab()}
      />

      <main>
        {sidebarOpen && (
          <Sidebar
            projects={projects}
            activeProjectId={activeProjectId}
            boardCountByProject={boardCountByProject}
            onSelectProject={switchProject}
            onNewProject={createProject}
            renamingProjectId={renamingProjectId}
            onRenameProjectStart={setRenamingProjectId}
            onRenameProjectChange={(id, name) => setProjects((list) => list.map((p) => (p.id === id ? { ...p, name } : p)))}
            onRenameProjectStop={() => setRenamingProjectId(null)}
            onProjectDragStart={handleProjectDragStart}
            onProjectDrop={handleProjectDrop}
            onProjectContextMenu={(e, id) => {
              e.preventDefault();
              setContextMenu({ type: 'project', id, x: e.clientX, y: e.clientY });
            }}
            tabs={projectBoards}
            activeTabId={activeTabId}
            onSelectTab={switchTab}
            onNewTab={() => createTab()}
            renamingTabId={renamingTabId}
            onRenameTabStart={setRenamingTabId}
            onRenameTabChange={(id, name) => setBoards((list) => list.map((b) => (b.id === id ? { ...b, name } : b)))}
            onRenameTabStop={() => setRenamingTabId(null)}
            onTabDragStart={handleTabDragStart}
            onTabDropOnTab={handleTabDropOnTab}
            onTabDropOnPanel={handleTabDropOnPanel}
            onTabContextMenu={(e, id) => {
              e.preventDefault();
              setContextMenu({ type: 'tab', id, x: e.clientX, y: e.clientY });
            }}
            onDeleteTab={deleteTab}
          />
        )}

        <BoardCanvas
          ref={boardScrollRef}
          board={board}
          zoom={zoom}
          selection={selection}
          primaryId={primaryId}
          connectSourceId={connectSource}
          connecting={tool === 'connect'}
          marquee={marquee}
          showGrid={showGrid}
          canvasBackground={board.background}
          onPointerDown={handleBoardPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onContextMenu={handleBoardContextMenu}
          onNodePointerDown={handleNodePointerDown}
          onNodeContextMenu={handleNodeContextMenu}
          onNodeTextBlur={handleNodeTextBlur}
          onResizePointerDown={handleResizePointerDown}
          onPortPointerDown={handlePortPointerDown}
        >
          {connectSource && (
            <ConnectionPanel connections={connections || []} onClose={() => { setConnectSource(null); setTool('select'); }} onRemove={removeEdge} />
          )}
          {selection.length > 0 && (
            <FloatBar
              position={floatbarPos}
              multiSelected={selection.length > 1}
              onDragStart={startFloatbarDrag}
              onDragMove={dragFloatbar}
              onDragEnd={endFloatbarDrag}
              onDuplicate={() => duplicateSelection()}
              onConnect={connectSelectedAsFlow}
              onDelete={deleteSelection}
            />
          )}
          <ZoomBar
            zoom={zoom}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onZoomReset={zoomReset}
            onFit={toggleFitView}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid((v) => !v)}
            snapEnabled={snapEnabled}
            onToggleSnap={() => setSnapEnabled((v) => !v)}
          />
        </BoardCanvas>
      </main>

      {contextMenu && (
        <div className="context-shield" onPointerDown={() => setContextMenu(null)}>
          <div className={placement.className} style={placement.style} onPointerDown={(e) => e.stopPropagation()}>
            {contextMenu.type === 'board' && (
              <>
                <button onClick={() => { undo(); setContextMenu(null); }}>
                  Undo <kbd>Ctrl Z</kbd>
                </button>
                <button onClick={() => { setSelection(board.nodes.map((n) => n.id)); setContextMenu(null); }}>
                  Select all <kbd>Ctrl A</kbd>
                </button>
                <button disabled={!selection.length} onClick={() => { duplicateSelection(); setContextMenu(null); }}>
                  Duplicate selection <kbd>Ctrl D</kbd>
                </button>
                <button onClick={() => copyToClipboard(selection.length ? selection : null)}>
                  {selection.length ? 'Copy selected part' : 'Copy this mind map'} <kbd>Ctrl Shift C</kbd>
                </button>
                <button onClick={() => copyToClipboard(null)}>Copy full mind map</button>
                <button onClick={pasteFromClipboard}>
                  Paste map into this tab <kbd>Ctrl Shift V</kbd>
                </button>
                <button disabled={selection.length < 2} onClick={() => { connectSelectedAsFlow(); setContextMenu(null); }}>
                  Connect selected <kbd>{shortcuts.connect.toUpperCase()}</kbd>
                </button>
                <span className="menu-separator" />
                <button onClick={() => { addShape('rectangle'); setContextMenu(null); }}>
                  Add rounded rectangle <kbd>{shortcuts.rectangle}</kbd>
                </button>
                <button onClick={() => { addShape('circle'); setContextMenu(null); }}>
                  Add circle <kbd>{shortcuts.circle}</kbd>
                </button>
                <button onClick={() => { toggleFitView(); setContextMenu(null); }}>Fit board</button>
                <button className="menu-danger" disabled={!selection.length} onClick={() => { deleteSelection(); setContextMenu(null); }}>
                  Delete selection
                </button>
              </>
            )}

            {contextMenu.type === 'node' && contextNode && (
              <>
                <button onClick={() => { setSelection(getConnectedTree(contextNode.id)); setContextMenu(null); }}>
                  Select connected tree <kbd>Ctrl+Drag</kbd>
                </button>
                <span className="menu-separator" />

                <div className="menu-cascade">
                  <button>
                    Change shape <span className="menu-arrow">›</span>
                  </button>
                  <div className="context-menu submenu level-one">
                    {Object.entries(SHAPE_LABELS).map(([type, label]) => (
                      <button key={type} onClick={() => changeShapeForIds(targetIdsFor(contextNode.id), type)}>
                        {label} <span className={`shape-preview ${type}-preview`} />
                      </button>
                    ))}
                  </div>
                </div>

                <span className="menu-separator" />

                <div className="menu-cascade">
                  <button>
                    Color <span className="menu-arrow">›</span>
                  </button>
                  <div className="context-menu submenu level-one">
                    {PALETTE.map((color, i) => (
                      <button key={color} onClick={() => setColorForIds(targetIdsFor(contextNode.id), color)}>
                        <span>{COLOR_NAMES[i]}</span>
                        <span className="color-chip" style={{ background: color }} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="menu-cascade">
                  <button>
                    Font size <span className="menu-arrow">›</span>
                  </button>
                  <div className="context-menu submenu level-one compact-submenu">
                    {FONT_SIZE_PRESETS.map((size) => (
                      <button key={size} onClick={() => setFontSizeForIds(targetIdsFor(contextNode.id), size)}>
                        {size}px
                      </button>
                    ))}
                    <label className="menu-number">
                      <span>Custom</span>
                      <input
                        type="number"
                        min="6"
                        max="240"
                        defaultValue={contextNode.fontSize || 14}
                        onPointerDown={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setFontSizeForIds(targetIdsFor(contextNode.id), e.currentTarget.value);
                          if (e.key === 'Escape') setContextMenu(null);
                        }}
                        onBlur={(e) => setFontSizeForIds(targetIdsFor(contextNode.id), e.currentTarget.value)}
                      />
                    </label>
                  </div>
                </div>

                <div className="menu-cascade">
                  <button>
                    Text style <span className="menu-arrow">›</span>
                  </button>
                  <div className="context-menu submenu level-one">
                    <button onClick={() => toggleTextStyleForIds(targetIdsFor(contextNode.id), 'bold')}>
                      {contextNode.bold ? 'Remove bold' : 'Bold'}
                    </button>
                    <button onClick={() => toggleTextStyleForIds(targetIdsFor(contextNode.id), 'italic')}>
                      {contextNode.italic ? 'Remove italic' : 'Italic'}
                    </button>
                    <span className="menu-separator" />
                    {FONT_FAMILIES.map((f) => (
                      <button key={f.label} onClick={() => setFontFamilyForIds(targetIdsFor(contextNode.id), f.value)}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="menu-cascade">
                  <button>
                    Style <span className="menu-arrow">›</span>
                  </button>
                  <div className="context-menu submenu level-one compact-submenu">
                    <div className="menu-label">Opacity</div>
                    {OPACITY_PRESETS.map((op) => (
                      <button key={op} onClick={() => setOpacityForIds(targetIdsFor(contextNode.id), op)}>
                        {op}%
                      </button>
                    ))}
                    <span className="menu-separator" />
                    <div className="menu-label">Border color</div>
                    {PALETTE.map((color) => (
                      <button key={color} onClick={() => setStrokeForIds(targetIdsFor(contextNode.id), color)}>
                        <span>Border</span>
                        <span className="color-chip" style={{ background: color }} />
                      </button>
                    ))}
                    <button onClick={() => setStrokeForIds(targetIdsFor(contextNode.id), null)}>No border</button>
                    <span className="menu-separator" />
                    <div className="menu-label">Border width</div>
                    {STROKE_WIDTH_PRESETS.map((w) => (
                      <button key={w} onClick={() => setStrokeWidthForIds(targetIdsFor(contextNode.id), w)}>
                        {w}px
                      </button>
                    ))}
                    {(contextNode.type === 'rectangle' || contextNode.type === 'rounded') && (
                      <>
                        <span className="menu-separator" />
                        <div className="menu-label">Corner radius</div>
                        {CORNER_RADIUS_PRESETS.map((r) => (
                          <button key={r} onClick={() => setRadiusForIds(targetIdsFor(contextNode.id), r)}>
                            {r >= 999 ? 'Pill' : `${r}px`}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                <div className="menu-cascade">
                  <button disabled={selection.length < 2}>
                    Alignment <span className="menu-arrow">›</span>
                  </button>
                  <div className="context-menu submenu level-one">
                    {ALIGN_OPTIONS.map(([key, label, shortcutKey]) => (
                      <button key={key} onClick={() => { alignSelected(key); setContextMenu(null); }}>
                        {label} <kbd>{shortcuts[shortcutKey]}</kbd>
                      </button>
                    ))}
                    <span className="menu-separator" />
                    <button disabled={selection.length < 3} onClick={() => { distributeSelected('h'); setContextMenu(null); }}>
                      Distribute horizontally
                    </button>
                    <button disabled={selection.length < 3} onClick={() => { distributeSelected('v'); setContextMenu(null); }}>
                      Distribute vertically
                    </button>
                  </div>
                </div>

                <button disabled={selection.length < 2} onClick={() => changeShapeForIds(selection, contextNode.type)}>
                  Make selected shapes the same
                </button>

                <div className="menu-cascade">
                  <button>
                    Make every box the same <span className="menu-arrow">›</span>
                  </button>
                  <div className="context-menu submenu level-one">
                    <div className="menu-cascade">
                      <button>
                        Color <span className="menu-arrow">›</span>
                      </button>
                      <div className="context-menu submenu level-two">
                        {PALETTE.map((color, i) => (
                          <button key={color} onClick={() => setColorForIds(board.nodes.map((n) => n.id), color)}>
                            <span>{COLOR_NAMES[i]}</span>
                            <span className="color-chip" style={{ background: color }} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="menu-cascade">
                      <button>
                        Shape <span className="menu-arrow">›</span>
                      </button>
                      <div className="context-menu submenu level-two">
                        {Object.entries(SHAPE_LABELS).map(([type, label]) => (
                          <button key={type} onClick={() => changeShapeForIds(board.nodes.map((n) => n.id), type)}>
                            {label} <span className={`shape-preview ${type}-preview`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="menu-cascade">
                      <button>
                        Size <span className="menu-arrow">›</span>
                      </button>
                      <div className="context-menu submenu level-two">
                        <button disabled={selection.length < 2} onClick={() => matchDimensionForTargets(contextNode.id, 'width')}>
                          Same width for selected
                        </button>
                        <button disabled={selection.length < 2} onClick={() => matchDimensionForTargets(contextNode.id, 'height')}>
                          Same height for selected
                        </button>
                        <button disabled={selection.length < 2} onClick={() => matchDimensionForTargets(contextNode.id, 'both')}>
                          Same size for selected
                        </button>
                        <span className="menu-separator" />
                        <button onClick={() => matchDimensionForAll(contextNode.id, 'width')}>
                          Same width <kbd>{Math.round(contextNode.w)}px</kbd>
                        </button>
                        <button onClick={() => matchDimensionForAll(contextNode.id, 'height')}>
                          Same height <kbd>{Math.round(contextNode.h)}px</kbd>
                        </button>
                        <button onClick={() => matchDimensionForAll(contextNode.id, 'both')}>Same width & height</button>
                      </div>
                    </div>
                  </div>
                </div>

                <span className="menu-separator" />
                <button onClick={() => bringToFront(contextNode.id)}>Bring to front</button>
                <button onClick={() => sendToBack(contextNode.id)}>Send to back</button>
                <button onClick={() => toggleLock(contextNode.id)}>{contextNode.locked ? 'Unlock shape' : 'Lock shape'}</button>

                <span className="menu-separator" />
                <button onClick={() => copyToClipboard(targetIdsFor(contextNode.id))}>
                  Copy selected part <kbd>Ctrl Shift C</kbd>
                </button>
                <button onClick={pasteFromClipboard}>
                  Paste copied part/map <kbd>Ctrl Shift V</kbd>
                </button>
                <button onClick={() => { duplicateSelection(); setContextMenu(null); }}>
                  Duplicate selection <kbd>Ctrl D</kbd>
                </button>
                <button className="menu-danger" onClick={() => { deleteSelection(); setContextMenu(null); }}>
                  Delete selection
                </button>
              </>
            )}

            {contextMenu.type === 'tab' && (
              <>
                <button onClick={() => renameTabPrompt(contextMenu.id)}>Rename tab</button>
                <button onClick={() => duplicateTab(contextMenu.id)}>Duplicate tab</button>
                <button onClick={() => createTab()}>New tab</button>
                <span className="menu-separator" />
                <button className="menu-danger" onClick={() => deleteTab(contextMenu.id)}>
                  Delete permanently
                </button>
              </>
            )}

            {contextMenu.type === 'project' && (
              <>
                <button onClick={() => renameProjectPrompt(contextMenu.id)}>Rename project</button>
                <button onClick={() => createTab(contextMenu.id)}>New tab in project</button>
                <span className="menu-separator" />
                <button className="menu-danger" disabled={projects.length === 1} onClick={() => deleteProject(contextMenu.id)}>
                  Delete project permanently
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {modal && (
        <div className="overlay" onMouseDown={() => setModal(null)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setModal(null)}>
              <X />
            </button>
            {modal === 'keys' ? (
              <>
                <p className="eyebrow">KEYBOARD</p>
                <h2>Keyboard shortcuts</h2>
                <p className="sub">Click a field and type the key you want.</p>
                <div className="key-grid">
                  {Object.entries(shortcuts).map(([key, value]) => (
                    <label key={key}>
                      <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                      <input
                        value={value}
                        onChange={(e) => {
                          const next = { ...shortcuts, [key]: e.target.value };
                          setShortcuts(next);
                          localStorage.setItem(STORAGE_KEYS.keys, JSON.stringify(next));
                        }}
                      />
                    </label>
                  ))}
                </div>
                <p className="shortcut-note">
                  Built in: Shift+click multi-select · Alt+drag duplicate · Ctrl/⌘+D duplicate · Ctrl/⌘+A select all · Ctrl/⌘+Z undo ·
                  +/- zoom · \ fit board
                </p>
              </>
            ) : (
              <>
                <p className="eyebrow">YOUR WORKSPACE</p>
                <h2>Maps & archives</h2>
                <div className="file-actions">
                  <button onClick={exportAll}>
                    <Download /> Export all
                  </button>
                  <button onClick={archiveCurrentBoard}>
                    <Archive /> Archive current
                  </button>
                </div>
                <h3>Archived maps</h3>
                {archives.length ? (
                  archives.map((a) => (
                    <div className="archive-row" key={a.id}>
                      <b>{a.name}</b>
                      <button onClick={() => restoreArchive(a)}>Restore</button>
                    </div>
                  ))
                ) : (
                  <div className="empty">No archived maps yet.</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
