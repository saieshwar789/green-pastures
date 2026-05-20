import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Milk, 
  Heart, 
  Warehouse, 
  IndianRupee,
  CheckCircle2
} from 'lucide-react';

export default function Sidebar({ activePage, setActivePage }) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'herd', name: 'Herd Management', icon: ClipboardList },
    { id: 'milk', name: 'Milk Production', icon: Milk },
    { id: 'breeding', name: 'Breeding & Calving', icon: Heart },
    { id: 'feed', name: 'Feed Stock & Logs', icon: Warehouse },
    { id: 'finance', name: 'Financial Ledger', icon: IndianRupee },
  ];

  return (
    <aside className="sidebar-container">
      <div className="brand-logo">
        <div className="logo-icon-wrapper">
          <Milk className="logo-icon" />
        </div>
        <div className="brand-text">
          <h2>GreenPastures</h2>
          <span>Dairy Management</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="nav-icon" size={20} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="system-status">
          <CheckCircle2 size={16} className="text-success" />
          <span>Database Connected</span>
        </div>
      </div>

      <style>{`
        .sidebar-container {
          width: 280px;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          background: #f8f9fa; /* Google Workspace sidebar background */
          border-right: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          padding: 2rem 0; /* Pad nav items from edges */
          z-index: 100;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2.5rem;
          padding: 0 1.5rem;
        }

        .logo-icon-wrapper {
          background-color: var(--color-primary);
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-icon {
          color: white;
          width: 22px;
          height: 22px;
        }

        .brand-text h2 {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .brand-text span {
          font-size: 0.7rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
          padding: 0 0.75rem; /* Google style margins for nav items */
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 0.75rem 1.25rem;
          border-radius: 24px; /* Fully rounded Google sidebar item */
          cursor: pointer;
          text-align: left;
          font-family: var(--font-primary);
          font-size: 0.9rem;
          font-weight: 500;
          width: 100%;
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }

        .nav-item:hover {
          color: var(--text-primary);
          background-color: #f1f3f4;
        }

        .nav-item.active {
          color: var(--color-primary-dark);
          background-color: var(--color-primary-glow);
          font-weight: 600;
        }

        .nav-item.active .nav-icon {
          color: var(--color-primary);
        }

        .nav-icon {
          color: #5f6368;
          transition: color var(--transition-fast);
        }

        .sidebar-footer {
          padding: 1.5rem;
          border-top: 1px solid var(--glass-border);
        }

        .system-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .text-success {
          color: var(--color-primary);
        }

        @media (max-width: 1024px) {
          .sidebar-container {
            transform: translateX(-100%);
            transition: transform var(--transition-normal);
          }
          
          .sidebar-container.open {
            transform: translateX(0);
          }
        }
      `}</style>
    </aside>
  );
}
