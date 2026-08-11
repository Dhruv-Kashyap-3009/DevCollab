import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppLayout() {
  return (
    <div className="app-shell" style={{ background: 'var(--bg)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <TopBar />
        <main className="app-main" style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
