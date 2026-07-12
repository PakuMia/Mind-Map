import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import SharedView from './SharedView.jsx';
import recoveredBoards from './data/recoveredBoards.js';
import './styles.css';

// Preserved for backwards compatibility with the recovery mechanism boards
// were seeded through in earlier builds of the app.
globalThis.__KKMM_RECOVERED__ = recoveredBoards;

function readSharedBoard() {
  try {
    const encoded = new URLSearchParams(location.search).get('view');
    if (!encoded) return null;
    return JSON.parse(decodeURIComponent(escape(atob(encoded))));
  } catch {
    return null;
  }
}

const sharedBoard = readSharedBoard();

createRoot(document.getElementById('root')).render(
  sharedBoard ? <SharedView board={sharedBoard} /> : <App />
);
