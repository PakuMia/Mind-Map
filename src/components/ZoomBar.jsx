import { Grid3x3, Magnet, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';

export default function ZoomBar({ zoom, onZoomIn, onZoomOut, onZoomReset, onFit, showGrid, onToggleGrid, snapEnabled, onToggleSnap }) {
  return (
    <div className="zoom">
      <button title="Zoom out (-)" onClick={onZoomOut}>
        <ZoomOut />
      </button>
      <span onClick={onZoomReset} title="Reset zoom">
        {Math.round(zoom * 100)}%
      </span>
      <button title="Zoom in (+)" onClick={onZoomIn}>
        <ZoomIn />
      </button>
      <button title="Fit board (\\)" onClick={onFit}>
        <Maximize2 />
      </button>
      <button className={showGrid ? 'active' : ''} title="Toggle grid" onClick={onToggleGrid}>
        <Grid3x3 />
      </button>
      <button className={snapEnabled ? 'active' : ''} title="Snap to grid" onClick={onToggleSnap}>
        <Magnet />
      </button>
    </div>
  );
}
