// Fill colors offered throughout the app, from lightest to darkest.
export const PALETTE = ['#f2f2f0', '#d9d9d6', '#b8b8b4', '#747472', '#343433', '#171717'];

export const COLOR_NAMES = [
  'Soft white',
  'Light grey',
  'Silver grey',
  'Medium grey',
  'Charcoal',
  'Black',
];

// Fills dark enough that white text reads better than the default dark text.
const DARK_FILLS = new Set(['#343433', '#171717', '#747472']);
export const textColorFor = (fill) => (DARK_FILLS.has(fill) ? '#fff' : '#111');

export const SHAPE_LABELS = {
  rectangle: 'Rectangle',
  rounded: 'Rounded rectangle',
  square: 'Square',
  circle: 'Circle',
};

export const FONT_SIZE_PRESETS = [10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64, 72];

export const DEFAULT_SHORTCUTS = {
  select: 'v',
  multi: 'm',
  connect: 'c',
  circle: 'o',
  rectangle: 'r',
  rounded: 'u',
  square: 's',
  delete: 'Delete',
  selectAll: 'a',
  alignLeft: 'Alt+L',
  alignHCenter: 'Alt+H',
  alignRight: 'Alt+R',
  alignTop: 'Alt+T',
  alignVCenter: 'Alt+V',
  alignBottom: 'Alt+B',
};

export const ALIGN_OPTIONS = [
  ['top', 'Top', 'alignTop'],
  ['vcenter', 'Middle', 'alignVCenter'],
  ['bottom', 'Bottom', 'alignBottom'],
  ['left', 'Left', 'alignLeft'],
  ['hcenter', 'Center', 'alignHCenter'],
  ['right', 'Right', 'alignRight'],
];

// Virtual canvas the board is laid out on; nodes are positioned relative to
// (offsetX, offsetY) so a board's stored coordinates can stay small numbers.
export const CANVAS = { width: 5000, height: 3500, offsetX: 1200, offsetY: 800 };

export const DEFAULT_PROJECT_ID = 'project-main';

// Bumping this key re-runs the one-time merge of any recovered boards found
// on window.__KKMM_RECOVERED__ into local storage.
export const RECOVERY_FLAG_KEY = 'kkmm-recovered-2026-07-12-v2';

export const STORAGE_KEYS = {
  boards: 'kkmm-project',
  activeTab: 'kkmm-active-tab',
  activeProject: 'kkmm-active-project',
  folders: 'kkmm-folders',
  archives: 'kkmm-archives',
  keys: 'kkmm-keys',
  floatbarPos: 'kkmm-floatbar-pos',
  clipboard: 'kkmm-map-clipboard',
};

export const ZOOM_MIN = 0.18;
export const ZOOM_MAX = 1.5;
export const ZOOM_STEP = 0.1;
export const DEFAULT_ZOOM = 0.82;

// --- Graphic-design-tool basics layered on top of the original app -------

export const GRID_STEP = 10; // world units a shape snaps to when snapping is on

export const FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Sans', value: '"DM Sans", sans-serif' },
  { label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Mono', value: '"SFMono-Regular", Menlo, monospace' },
];

export const STROKE_WIDTH_PRESETS = [0, 1, 2, 3, 4, 6, 8];

export const CORNER_RADIUS_PRESETS = [0, 4, 8, 12, 20, 999];

export const OPACITY_PRESETS = [100, 75, 50, 25, 10];

export const DISTRIBUTE_OPTIONS = [
  ['h', 'Distribute horizontally'],
  ['v', 'Distribute vertically'],
];
