# Kaj Kam Mind Map

A mind-mapping / flowchart board editor: multiple projects, each holding
several boards ("tabs") of draggable, connectable shapes.

## Getting started

```bash
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
npm run preview  # preview the production build
```

## Feature overview

- Projects (folders) containing boards; drag to reorder/reassign, rename
  inline or via the right-click menu.
- Shapes: rounded, rectangle, square, circle. Insert with the toolbar, the
  right-click menu, or keyboard shortcuts (see the Shortcuts modal).
- Select (click / shift-click / marquee-drag / `Ctrl`+click for the whole
  connected tree), multi-select tool, connect tool, alt-drag to duplicate.
- Connections between shapes, with dashed/solid and arrowhead styling from
  the connection panel.
- Align, distribute, match size, change shape, recolor, and resize font for
  a whole selection at once — from the toolbar or the right-click menu.
- Layer ordering (bring to front / send to back), lock shapes, opacity,
  border color/width, corner radius, bold/italic and font family — the
  usual graphic-design-tool basics, layered onto the original app.
- Snap-to-grid and a grid toggle, zoom controls, and "fit board" (`\`).
- Undo (`Ctrl/⌘+Z`), copy/paste of a selection or the whole board
  (`Ctrl/⌘+Shift+C` / `V`), duplicate (`Ctrl/⌘+D`).
- Archive/restore boards, export everything as JSON, and share a
  read-only, base64-encoded link to a single board (`?view=...`).
- Customizable keyboard shortcuts, persisted along with every board to
  `localStorage`.

## Project layout

```
src/
  App.jsx              Main app: state, interaction handlers, render tree
  SharedView.jsx        Read-only renderer for `?view=` shared links
  main.jsx              Entry point; picks App vs. SharedView
  constants.js           Palette, shortcuts, canvas sizing, storage keys
  styles.css             Full stylesheet (light/dark via prefers-color-scheme)
  utils/                 id generation, shortcut matching, board helpers
  data/recoveredBoards.js Seed boards merged into local storage once
  components/             Header, TopActionBar, TabsBar, Sidebar,
                           BoardCanvas, FloatBar, ConnectionPanel, ZoomBar
```
