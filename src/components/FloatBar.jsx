import { Copy, GripVertical, Network, Trash2 } from 'lucide-react';

export default function FloatBar({ position, multiSelected, onDragStart, onDragMove, onDragEnd, onDuplicate, onConnect, onDelete }) {
  return (
    <div className="floatbar" style={{ left: position.x, top: position.y }} onPointerDown={(e) => e.stopPropagation()}>
      <button
        className="floatbar-drag"
        title="Drag to move this toolbar"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
      >
        <GripVertical size={15} />
      </button>
      <button title="Duplicate" onClick={onDuplicate}>
        <Copy />
      </button>
      {multiSelected && (
        <button className="hub-connect" title="Connect selected shapes as a top-to-bottom flow" onClick={onConnect}>
          <Network />
        </button>
      )}
      <button title="Delete" onClick={onDelete}>
        <Trash2 />
      </button>
    </div>
  );
}
