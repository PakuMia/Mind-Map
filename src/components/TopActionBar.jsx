import {
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  Circle,
  Copy,
  CornerUpRight,
  Network,
  RectangleHorizontal,
  Square,
  Trash2,
  Type,
} from 'lucide-react';
import { ALIGN_OPTIONS, PALETTE, SHAPE_LABELS } from '../constants.js';

const ALIGN_ICONS = {
  top: AlignVerticalJustifyStart,
  vcenter: AlignVerticalJustifyCenter,
  bottom: AlignVerticalJustifyEnd,
  left: AlignHorizontalJustifyStart,
  hcenter: AlignHorizontalJustifyCenter,
  right: AlignHorizontalJustifyEnd,
};

const SHAPE_ICONS = { circle: Circle, square: Square, rounded: RectangleHorizontal, rectangle: RectangleHorizontal };

export default function TopActionBar({
  visible,
  canAlign,
  shortcuts,
  activeFontSize,
  onAlign,
  onCopy,
  onPaste,
  onConnect,
  onChangeShape,
  onColor,
  onFontSize,
  onDelete,
}) {
  if (!visible) return null;
  return (
    <div className="top-action-bar">
      <div className="top-action-group align-grid" aria-label="Align selected">
        {ALIGN_OPTIONS.map(([key, label, shortcutKey]) => {
          const Icon = ALIGN_ICONS[key];
          return (
            <button key={key} disabled={!canAlign} title={`${label} (${shortcuts[shortcutKey]})`} onClick={() => onAlign(key)}>
              <Icon size={16} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
      <span className="top-action-divider" />
      <div className="top-action-group">
        <button title="Copy selected part" onClick={onCopy}>
          <Copy size={16} />
          <span>Copy</span>
        </button>
        <button title="Paste copied map/part" onClick={onPaste}>
          <CornerUpRight size={16} />
          <span>Paste</span>
        </button>
        <button disabled={!canAlign} title="Connect selected as flow" onClick={onConnect}>
          <Network size={16} />
          <span>Connect</span>
        </button>
      </div>
      <span className="top-action-divider" />
      <div className="top-action-group">
        {Object.entries(SHAPE_LABELS).map(([type, label]) => {
          const Icon = SHAPE_ICONS[type];
          return (
            <button key={type} title={`Change shape to ${label}`} onClick={() => onChangeShape(type)}>
              <Icon size={16} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
      <span className="top-action-divider" />
      <div className="top-action-group top-color-group">
        {PALETTE.map((color) => (
          <button key={color} className="top-color" title={`Color ${color}`} onClick={() => onColor(color)}>
            <i style={{ background: color }} />
          </button>
        ))}
      </div>
      <label className="top-font-control">
        <Type size={15} />
        <input type="number" min="6" max="240" value={activeFontSize} onChange={(e) => onFontSize(e.target.value)} title="Font size" />
      </label>
      <button className="top-danger" title="Delete selected" onClick={onDelete}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}
