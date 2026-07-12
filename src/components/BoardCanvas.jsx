import { forwardRef } from 'react';
import { Lock } from 'lucide-react';
import { CANVAS } from '../constants.js';
import { edgePath } from '../utils/board.js';

const BoardCanvas = forwardRef(function BoardCanvas(
  {
    board,
    zoom,
    selection,
    primaryId,
    connectSourceId,
    connecting,
    marquee,
    showGrid,
    canvasBackground,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onContextMenu,
    onNodePointerDown,
    onNodeContextMenu,
    onNodeTextBlur,
    onResizePointerDown,
    onPortPointerDown,
    children,
  },
  ref
) {
  const selected = new Set(selection);
  return (
    <section
      ref={ref}
      className={`board ${connecting ? 'connecting' : ''} ${showGrid ? '' : 'no-grid'}`}
      style={{ backgroundColor: canvasBackground || undefined }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onContextMenu={onContextMenu}
    >
      <div className="dotgrid" style={{ transform: `scale(${zoom})`, width: CANVAS.width, height: CANVAS.height }}>
        <svg className="lines" width={CANVAS.width} height={CANVAS.height}>
          <defs>
            <marker id="arrow-end" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" />
            </marker>
          </defs>
          {board.edges.map((edge) => {
            const a = board.nodes.find((n) => n.id === edge.a);
            const b = board.nodes.find((n) => n.id === edge.b);
            if (!a || !b) return null;
            return (
              <path
                key={edge.id}
                d={edgePath(a, b, edge.style, { x: CANVAS.offsetX, y: CANVAS.offsetY })}
                className={edge.dashed ? 'dashed' : ''}
                markerEnd={edge.arrow === 'end' || edge.arrow === 'both' ? 'url(#arrow-end)' : undefined}
                markerStart={edge.arrow === 'both' ? 'url(#arrow-end)' : undefined}
              />
            );
          })}
        </svg>

        {board.nodes.map((node) => (
          <div
            key={node.id}
            data-node-id={node.id}
            className={`node ${node.type} ${selected.has(node.id) ? 'selected' : ''} ${primaryId === node.id ? 'primary-node' : ''} ${
              connectSourceId === node.id ? 'source' : ''
            } ${node.locked ? 'locked' : ''}`}
            style={{
              left: node.x + CANVAS.offsetX,
              top: node.y + CANVAS.offsetY,
              width: node.w,
              height: node.h,
              background: node.color,
              color: node.textColor,
              opacity: node.opacity == null ? 1 : node.opacity / 100,
              borderColor: node.stroke || undefined,
              borderWidth: node.strokeWidth ?? undefined,
              borderStyle: node.strokeWidth ? 'solid' : undefined,
              borderRadius: node.type === 'rectangle' || node.type === 'rounded' ? node.radius ?? undefined : undefined,
            }}
            onPointerDown={(e) => onNodePointerDown(e, node)}
            onPointerMove={(e) => {
              e.stopPropagation();
              onPointerMove(e);
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              onPointerUp(e);
            }}
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => onNodeContextMenu(e, node)}
          >
            <div
              className="node-text"
              contentEditable={!node.locked}
              draggable={false}
              suppressContentEditableWarning
              style={{
                fontSize: node.fontSize || 14,
                fontWeight: node.bold ? 700 : undefined,
                fontStyle: node.italic ? 'italic' : undefined,
                fontFamily: node.fontFamily || undefined,
              }}
              onDoubleClick={(e) => e.stopPropagation()}
              onBlur={(e) => onNodeTextBlur(node.id, e.currentTarget.textContent)}
            >
              {node.text}
            </div>
            {node.locked && <Lock className="lock-badge" size={12} />}
            {!node.locked && (
              <>
                <button
                  className="port"
                  title="Drag to connect · Ctrl+drag to disconnect"
                  onPointerDown={(e) => onPortPointerDown(e, node)}
                />
                <span className="handle nw" title="Resize from top-left" onPointerDown={(e) => onResizePointerDown(e, node, 'nw')} />
                <span className="handle se" title="Resize from bottom-right" onPointerDown={(e) => onResizePointerDown(e, node, 'se')} />
              </>
            )}
          </div>
        ))}
      </div>

      {marquee && (
        <div className="marquee" style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }} />
      )}

      {children}
    </section>
  );
});

export default BoardCanvas;
