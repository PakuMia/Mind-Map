import { Sparkles } from 'lucide-react';
import { edgePath } from './utils/board.js';

// Read-only renderer for boards shared via the base64-encoded `?view=`
// query param (see zt() / "Share view" in App.jsx).
export default function SharedView({ board }) {
  return (
    <div className="shared-view">
      <header>
        <div className="brand">
          <div className="logo">
            <Sparkles size={18} />
          </div>
          <div>
            <strong>Kaj Kam</strong>
            <span>VIEW ONLY</span>
          </div>
        </div>
        <div className="shared-title">{board.name}</div>
        <div className="read-only-badge">Read only</div>
      </header>
      <section className="board shared-board">
        <div className="dotgrid shared-canvas">
          <svg className="lines" width="1600" height="900">
            {board.edges.map((edge) => {
              const a = board.nodes.find((n) => n.id === edge.a);
              const b = board.nodes.find((n) => n.id === edge.b);
              if (!a || !b) return null;
              return <path key={edge.id} d={edgePath(a, b, edge.style)} />;
            })}
          </svg>
          {board.nodes.map((node) => (
            <div
              key={node.id}
              className={`node ${node.type}`}
              style={{
                left: node.x,
                top: node.y,
                width: node.w,
                height: node.h,
                background: node.color,
                color: node.textColor,
              }}
            >
              <div className="node-text" style={{ fontSize: node.fontSize || 14 }}>
                {node.text}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
