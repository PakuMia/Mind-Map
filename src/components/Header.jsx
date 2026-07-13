import { Check, Keyboard, FolderOpen, Save, Share2, Sparkles, Undo2 } from 'lucide-react';

export default function Header({ boardName, onRenameBoard, savedStatus, onUndo, onOpenShortcuts, onOpenMaps, onShare, onSave, userEmail, onSignOut }) {
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'TU';
  return (
    <header>
      <div className="brand">
        <div className="logo">
          <Sparkles size={18} />
        </div>
        <div>
          <strong>Kaj Kam</strong>
          <span>Mind Map</span>
        </div>
      </div>
      <div className="crumb">
        <span>Workspace</span>
        <b>/</b>
        <input value={boardName} onChange={(e) => onRenameBoard(e.target.value)} />
      </div>
      <div className="head-actions">
        <span className="saved">
          <Check size={14} />
          {savedStatus}
        </span>
        <button className="ghost" onClick={onUndo} title="Undo (Ctrl/⌘ + Z)">
          <Undo2 size={17} /> Undo
        </button>
        <button className="ghost" onClick={onOpenShortcuts}>
          <Keyboard size={17} /> Shortcuts
        </button>
        <button className="ghost" onClick={onOpenMaps}>
          <FolderOpen size={17} /> My maps
        </button>
        <button className="ghost" onClick={onShare}>
          <Share2 size={17} /> Share view
        </button>
        <button className="primary" onClick={onSave}>
          <Save size={16} /> Save
        </button>
        <button
          className="avatar"
          title={onSignOut ? `${userEmail} — click to sign out` : 'User profile'}
          onClick={onSignOut}
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
