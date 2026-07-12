import { X } from 'lucide-react';

export default function ConnectionPanel({ connections, onClose, onRemove }) {
  return (
    <div className="connection-panel" onPointerDown={(e) => e.stopPropagation()}>
      <div>
        <b>Connections</b>
        <button onClick={onClose}>
          <X size={14} />
        </button>
      </div>
      <p>Click another box to connect it.</p>
      {connections.length === 0 ? (
        <small>No connections yet</small>
      ) : (
        connections.map(({ edgeId, label }) => (
          <div className="connection-row" key={edgeId}>
            <span>{label}</span>
            <button title="Remove connection" onClick={() => onRemove(edgeId)}>
              <X size={13} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
