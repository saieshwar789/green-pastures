import React, { useState, useEffect } from 'react';
import { api } from '../apiConfig';
import { 
  ClipboardList, 
  Milk, 
  Warehouse, 
  IndianRupee, 
  AlertTriangle,
  Calendar,
  CheckCircle,
  TrendingUp,
  Stethoscope
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(api('/api/dashboard/stats'));
      if (!res.ok) throw new Error('Failed to load dashboard statistics');
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)' }}>Gathering farm metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card text-center" style={{ padding: '3rem', margin: '2rem 0' }}>
        <AlertTriangle size={48} className="text-red-500" style={{ margin: '0 auto 1rem' }} />
        <h3>System Connection Error</h3>
        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1.5rem' }}>{error}</p>
        <button className="btn btn-primary" onClick={fetchStats}>Retry Connection</button>
      </div>
    );
  }

  const { herd, milk_today, milk_trend, feed, low_feed_count, finance, reminders } = stats;

  return (
    <div className="dashboard-wrapper animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem' }}>Farm Overview</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Real-time metrics for your herd, production, and financials.</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchStats} style={{ height: 'fit-content' }}>
          Refresh Stats
        </button>
      </div>

      {/* Metric Cards Row */}
      <div className="metrics-grid">
        {/* Card 1: Total Cattle */}
        <div className="glass-card metric-card">
          <div className="metric-icon-wrapper text-emerald bg-emerald-glow">
            <ClipboardList size={24} />
          </div>
          <div className="metric-details">
            <span>Total Herd</span>
            <h2>{herd.total}</h2>
            <div className="metric-subtext">
              <span>{herd.milking} Milking</span>
              <span className="dot">•</span>
              <span>{herd.pregnant} Pregnant</span>
            </div>
          </div>
        </div>

        {/* Card 2: Milk Yield Today */}
        <div className="glass-card metric-card">
          <div className="metric-icon-wrapper text-cyan bg-cyan-glow">
            <Milk size={24} />
          </div>
          <div className="metric-details">
            <span>Today's Milk</span>
            <h2>{milk_today.total.toFixed(1)} L</h2>
            <div className="metric-subtext">
              <span>Morn: {milk_today.morning.toFixed(1)}L</span>
              <span className="dot">•</span>
              <span>Eve: {milk_today.evening.toFixed(1)}L</span>
            </div>
          </div>
        </div>

        {/* Card 3: Low Feed Alert */}
        <div className="glass-card metric-card">
          <div className={`metric-icon-wrapper ${low_feed_count > 0 ? 'text-amber bg-amber-glow animate-bounce' : 'text-emerald bg-emerald-glow'}`}>
            <Warehouse size={24} />
          </div>
          <div className="metric-details">
            <span>Feed Stock Status</span>
            <h2>{feed.length} Items</h2>
            <div className="metric-subtext">
              {low_feed_count > 0 ? (
                <span className="text-amber">{low_feed_count} Below Reorder Level</span>
              ) : (
                <span className="text-emerald">All stock levels normal</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Monthly Finances */}
        <div className="glass-card metric-card">
          <div className="metric-icon-wrapper text-violet bg-violet-glow">
            <IndianRupee size={24} />
          </div>
          <div className="metric-details">
            <span>Net {finance.month_name} Cash</span>
            <h2 className={finance.profit >= 0 ? 'text-emerald' : 'text-red'}>
              ₹{finance.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <div className="metric-subtext">
              <span>Inc: ₹{finance.income.toFixed(0)}</span>
              <span className="dot">•</span>
              <span>Exp: ₹{finance.expense.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Left Side: Graphs */}
        <div className="dashboard-left-panel">
          {/* Milk Yield Graph */}
          <div className="glass-card graph-card">
            <div className="card-header">
              <h3>Milk Production (Last 7 Days)</h3>
              <div className="flex-align-center text-emerald" style={{ gap: '0.25rem', fontSize: '0.85rem' }}>
                <TrendingUp size={16} />
                <span>Yield Trend</span>
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={milk_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="milkColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e8e3e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#1e8e3e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                  <YAxis stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} unit="L" />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#ffffff', 
                      border: '1px solid #dadce0',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)'
                    }}
                  />
                  <Area type="monotone" dataKey="quantity" name="Quantity (Liters)" stroke="#1e8e3e" strokeWidth={2} fillOpacity={1} fill="url(#milkColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Feed Stock Chart */}
          <div className="glass-card graph-card">
            <h3>Feed Stock Levels (kg)</h3>
            <div className="chart-container" style={{ marginTop: '1.5rem' }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={feed} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                  <YAxis type="category" dataKey="name" stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#ffffff', 
                      border: '1px solid #dadce0',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)'
                    }}
                  />
                  <Bar dataKey="stock" name="Current Stock (kg)" fill="#1a73e8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Side: Alerts & Reminders */}
        <div className="dashboard-right-panel">
          <div className="glass-card action-center-card">
            <div className="card-header" style={{ marginBottom: '1.5rem' }}>
              <h3>Reminders & Alerts</h3>
              <span className="badge" style={{ background: '#fef7e0', color: '#b06000', border: '1px solid #feebc8' }}>
                {reminders.length} Active
              </span>
            </div>
            
            <div className="reminders-list">
              {reminders.length === 0 ? (
                <div className="no-reminders text-center">
                  <CheckCircle size={32} className="text-emerald" style={{ margin: '0 auto 0.75rem' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>All caught up! No urgent alerts or veterinary tasks.</p>
                </div>
              ) : (
                reminders.map((reminder, idx) => {
                  let Icon = AlertTriangle;
                  let colorClass = 'alert-danger';
                  if (reminder.category === 'Pregnancy Check') {
                    Icon = Calendar;
                    colorClass = reminder.type === 'danger' ? 'alert-danger' : 'alert-warning';
                  } else if (reminder.category === 'Calving Due') {
                    Icon = Calendar;
                    colorClass = 'alert-warning';
                  } else if (reminder.category === 'Health / Vet Due') {
                    Icon = Stethoscope;
                    colorClass = 'alert-info';
                  }

                  return (
                    <div key={idx} className={`reminder-item ${colorClass}`}>
                      <div className="reminder-icon-box">
                        <Icon size={18} />
                      </div>
                      <div className="reminder-text">
                        <div className="reminder-meta">
                          <span className="reminder-category">{reminder.category}</span>
                          <span className="reminder-date">Due: {reminder.date}</span>
                        </div>
                        <p>{reminder.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-wrapper {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
        }

        .metric-card {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          background: #ffffff;
          border: 1px solid #dadce0;
        }

        .metric-icon-wrapper {
          width: 50px;
          height: 50px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .text-emerald { color: #1e8e3e; }
        .bg-emerald-glow { background: #e6f4ea; border: 1px solid #ceead6; }
        .text-cyan { color: #1a73e8; }
        .bg-cyan-glow { background: #e8f0fe; border: 1px solid #d2e3fc; }
        .text-amber { color: #b06000; }
        .bg-amber-glow { background: #fef7e0; border: 1px solid #feebc8; }
        .text-violet { color: #a142f4; }
        .bg-violet-glow { background: #f3e8fd; border: 1px solid #e9d8fd; }
        .text-red { color: #d93025; }

        .metric-details span {
          font-size: 0.8rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .metric-details h2 {
          font-size: 1.6rem;
          font-weight: 600;
          line-height: 1.2;
          margin: 0.15rem 0;
          color: var(--text-primary);
        }

        .metric-subtext {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .dot {
          font-size: 1.2rem;
          line-height: 1;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 1.5rem;
        }

        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .dashboard-left-panel {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chart-container {
          width: 100%;
        }

        .action-center-card {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #ffffff;
        }

        .reminders-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          flex: 1;
          max-height: 520px;
          overflow-y: auto;
          padding-right: 0.25rem;
        }

        .no-reminders {
          padding: 3rem 1rem;
          border: 1px dashed #dadce0;
          border-radius: 8px;
        }

        .reminder-item {
          display: flex;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid transparent;
          border-left: 4px solid transparent;
        }

        .reminder-icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          align-self: flex-start;
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }

        .reminder-text {
          flex: 1;
        }

        .reminder-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .reminder-category {
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .reminder-date {
          color: var(--text-secondary);
        }

        .reminder-text p {
          font-size: 0.85rem;
          color: var(--text-primary);
        }

        /* Reminder Type Colors */
        .alert-danger {
          background: #fce8e6;
          border: 1px solid #fad2cf;
          border-left-color: #d93025;
        }
        .alert-danger .reminder-icon-box { color: #d93025; background: #fad2cf; }
        .alert-danger .reminder-category { color: #d93025; }

        .alert-warning {
          background: #fef7e0;
          border: 1px solid #feebc8;
          border-left-color: #b06000;
        }
        .alert-warning .reminder-icon-box { color: #b06000; background: #feebc8; }
        .alert-warning .reminder-category { color: #b06000; }

        .alert-info {
          background: #e8f0fe;
          border: 1px solid #d2e3fc;
          border-left-color: #1a73e8;
        }
        .alert-info .reminder-icon-box { color: #1a73e8; background: #d2e3fc; }
        .alert-info .reminder-category { color: #1a73e8; }

        .flex-center {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .flex-align-center {
          display: flex;
          align-items: center;
        }
        .text-center {
          text-align: center;
        }
        
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e6f4ea;
          border-radius: 50%;
          border-top-color: var(--color-primary);
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
