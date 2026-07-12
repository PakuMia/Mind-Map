import { PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react';

export default function TabsBar({ sidebarOpen, onToggleSidebar, boards, activeId, onSelect, onNewBoard }) {
  return (
    <div className="tabs">
      <button className="sidebar-toggle" onClick={onToggleSidebar}>
        {sidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
      </button>
      {boards.map((board) => (
        <button key={board.id} className={`tab ${board.id === activeId ? 'active' : ''}`} onClick={() => onSelect(board.id)}>
          {board.name}
        </button>
      ))}
      <button className="newtab" onClick={onNewBoard}>
        <Plus size={16} /> New board
      </button>
    </div>
  );
}
