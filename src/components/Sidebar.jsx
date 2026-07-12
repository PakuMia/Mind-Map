import { Folder, FolderPlus, Plus, X } from 'lucide-react';

export default function Sidebar({
  projects,
  activeProjectId,
  boardCountByProject,
  onSelectProject,
  onNewProject,
  renamingProjectId,
  onRenameProjectStart,
  onRenameProjectChange,
  onRenameProjectStop,
  onProjectDragStart,
  onProjectDrop,
  onProjectContextMenu,

  tabs,
  activeTabId,
  onSelectTab,
  onNewTab,
  renamingTabId,
  onRenameTabStart,
  onRenameTabChange,
  onRenameTabStop,
  onTabDragStart,
  onTabDropOnTab,
  onTabDropOnPanel,
  onTabContextMenu,
  onDeleteTab,
}) {
  return (
    <aside className="workspace-panel">
      <div className="project-heading">
        <div>
          <span>PROJECT FOLDERS</span>
          <small>{projects.length} projects</small>
        </div>
        <button onClick={onNewProject} title="Create project">
          <FolderPlus size={17} />
        </button>
      </div>

      <div className="project-list">
        {projects.map((project) => (
          <div
            key={project.id}
            className={`project-row ${project.id === activeProjectId ? 'active' : ''}`}
            onClick={() => onSelectProject(project.id)}
            draggable
            onDragStart={(e) => onProjectDragStart(e, project.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onProjectDrop(e, project.id)}
            onContextMenu={(e) => onProjectContextMenu(e, project.id)}
          >
            <Folder size={17} />
            {renamingProjectId === project.id ? (
              <input
                autoFocus
                value={project.name}
                aria-label="Rename project"
                onClick={(e) => e.stopPropagation()}
                onBlur={onRenameProjectStop}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key === 'Escape') {
                    onRenameProjectStop();
                    e.currentTarget.blur();
                  }
                }}
                onChange={(e) => onRenameProjectChange(project.id, e.target.value)}
              />
            ) : (
              <span
                className="editable-name"
                title="Click to rename"
                onClick={(e) => {
                  e.stopPropagation();
                  onRenameProjectStart(project.id);
                }}
              >
                {project.name}
              </span>
            )}
            <small>{boardCountByProject[project.id] || 0}</small>
          </div>
        ))}
      </div>

      <div className="workspace-tabs-heading">
        <span>TABS IN THIS PROJECT</span>
        <button onClick={onNewTab}>
          <Plus size={15} />
        </button>
      </div>

      <div className="workspace-tabs" onDragOver={(e) => e.preventDefault()} onDrop={onTabDropOnPanel}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`workspace-tab ${tab.id === activeTabId ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
            draggable
            onDragStart={(e) => onTabDragStart(e, tab.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onTabDropOnTab(e, tab.id)}
            onContextMenu={(e) => onTabContextMenu(e, tab.id)}
          >
            <span className="tab-dot" />
            {renamingTabId === tab.id ? (
              <input
                autoFocus
                value={tab.name}
                aria-label="Rename tab"
                onClick={(e) => e.stopPropagation()}
                onBlur={onRenameTabStop}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key === 'Escape') {
                    onRenameTabStop();
                    e.currentTarget.blur();
                  }
                }}
                onChange={(e) => onRenameTabChange(tab.id, e.target.value)}
              />
            ) : (
              <span
                className="editable-name"
                title="Click to rename"
                onClick={(e) => {
                  e.stopPropagation();
                  onRenameTabStart(tab.id);
                  onSelectTab(tab.id);
                }}
              >
                {tab.name}
              </span>
            )}
            <button
              className="tab-remove"
              title="Delete tab"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTab(tab.id);
              }}
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
