import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import HerdManagement from './pages/HerdManagement';
import MilkTracker from './pages/MilkTracker';
import BreedingManager from './pages/BreedingManager';
import FeedInventory from './pages/FeedInventory';
import FinanceTracker from './pages/FinanceTracker';

import { Menu, X } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'herd':
        return <HerdManagement />;
      case 'milk':
        return <MilkTracker />;
      case 'breeding':
        return <BreedingManager />;
      case 'feed':
        return <FeedInventory />;
      case 'finance':
        return <FinanceTracker />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      {/* Mobile Top Navbar */}
      <header className="mobile-header">
        <div className="mobile-brand">
          <h3>GreenPastures</h3>
        </div>
        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Navigation Sidebar */}
      <div className={`sidebar-wrapper ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <Sidebar 
          activePage={activePage} 
          setActivePage={(page) => {
            setActivePage(page);
            setIsMobileMenuOpen(false); // Close sidebar on mobile select
          }}
        />
        {/* Backdrop for closing mobile sidebar */}
        {isMobileMenuOpen && (
          <div className="mobile-backdrop-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="main-content">
        {renderPage()}
      </main>

      <style>{`
        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 60px;
          background: #ffffff;
          border-bottom: 1px solid var(--glass-border);
          padding: 0 1.5rem;
          align-items: center;
          justify-content: space-between;
          z-index: 150;
        }

        .mobile-brand h3 {
          font-family: var(--font-secondary);
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--color-primary);
        }

        .mobile-menu-toggle {
          background: transparent;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mobile-backdrop-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.3);
          z-index: 90;
        }

        @media (max-width: 1024px) {
          .mobile-header {
            display: flex;
          }

          .mobile-backdrop-overlay {
            display: block;
          }

          .sidebar-wrapper {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 180;
            transform: translateX(-100%);
            transition: transform var(--transition-normal);
          }

          .sidebar-wrapper.mobile-open {
            transform: translateX(0);
          }
          
          .sidebar-wrapper.mobile-open .sidebar-container {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
