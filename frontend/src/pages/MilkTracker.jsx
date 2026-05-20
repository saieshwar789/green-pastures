import React, { useState, useEffect } from 'react';
import { api } from '../apiConfig';
import { Milk, Plus, Calendar, AlertTriangle, TrendingUp, IndianRupee } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export default function MilkTracker() {
  const [records, setRecords] = useState([]);
  const [cattle, setCattle] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    cattle_id: '',
    date: new Date().toISOString().split('T')[0],
    session: 'Morning',
    quantity: '',
    fat_percentage: '',
    snf_percentage: '',
    price_per_liter: '40.00' // default cooperative standard rate in Telangana
  });
  const [formError, setFormError] = useState(null);

  useBodyScrollLock(isFormOpen);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [milkRes, cattleRes] = await Promise.all([
        fetch(api('/api/milk')),
        fetch(api('/api/cattle'))
      ]);
      
      if (!milkRes.ok || !cattleRes.ok) throw new Error('Error loading milk data');
      
      const milkData = await milkRes.json();
      const cattleData = await cattleRes.json();
      
      setRecords(milkData);
      // Only show milking/pregnant/sick cows in dropdown for entry
      setCattle(cattleData.filter(c => c.gender === 'Cow' && c.status !== 'Calf'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      setFormError('Please enter a valid milk quantity.');
      return;
    }

    try {
      const res = await fetch(api('/api/milk'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record milk production');
      
      setIsFormOpen(false);
      setFormData({
        cattle_id: '',
        date: new Date().toISOString().split('T')[0],
        session: 'Morning',
        quantity: '',
        fat_percentage: '',
        snf_percentage: '',
        price_per_liter: '40.00'
      });
      fetchData();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this milk record?')) return;
    try {
      const res = await fetch(api(`/api/milk/${id}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete record');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Process data for Recharts (group last 7 days session-wise)
  const getChartData = () => {
    const dailyMap = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      dailyMap[dateString] = { date: label, morning: 0, evening: 0 };
    }

    // Populate with records
    records.forEach(rec => {
      const dateStr = rec.date;
      if (dailyMap[dateStr]) {
        if (rec.session.toLowerCase() === 'morning') {
          dailyMap[dateStr].morning += rec.quantity;
        } else if (rec.session.toLowerCase() === 'evening') {
          dailyMap[dateStr].evening += rec.quantity;
        }
      }
    });

    return Object.keys(dailyMap).sort().map(key => dailyMap[key]);
  };

  // Calculations for summary boxes
  const totalYield = records.reduce((sum, r) => sum + r.quantity, 0);
  const avgYield = records.length > 0 ? (totalYield / records.length) : 0;
  
  const fatRecords = records.filter(r => r.fat_percentage !== null);
  const avgFat = fatRecords.length > 0 
    ? (fatRecords.reduce((sum, r) => sum + r.fat_percentage, 0) / fatRecords.length) 
    : 0;

  const snfRecords = records.filter(r => r.snf_percentage !== null);
  const avgSnf = snfRecords.length > 0 
    ? (snfRecords.reduce((sum, r) => sum + r.snf_percentage, 0) / snfRecords.length) 
    : 0;

  const totalEarnings = records.reduce((sum, r) => sum + (r.quantity * (r.price_per_liter || 0)), 0);

  return (
    <div className="milk-wrapper animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem' }}>Milk Production</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Log milk yields, evaluate fat/SNF stats, and track cooperative billing.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsFormOpen(true)}>
          <Plus size={18} />
          <span>Log Milking Yield</span>
        </button>
      </div>

      {/* Summary KPI Panel */}
      <div className="milk-kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-icon-box text-cyan">
            <Milk size={20} />
          </div>
          <div>
            <span>Total Milk Logged</span>
            <h3>{totalYield.toFixed(1)} Liters</h3>
          </div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-icon-box text-emerald">
            <TrendingUp size={20} />
          </div>
          <div>
            <span>Avg Session Yield</span>
            <h3>{avgYield.toFixed(1)} L / cow</h3>
          </div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-icon-box text-amber">
            <PercentIcon />
          </div>
          <div>
            <span>Avg Quality (Fat / SNF)</span>
            <h3>{avgFat > 0 ? `${avgFat.toFixed(1)}%` : 'N/A'} / {avgSnf > 0 ? `${avgSnf.toFixed(1)}%` : 'N/A'}</h3>
          </div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-icon-box text-violet">
            <IndianRupee size={20} />
          </div>
          <div>
            <span>Est. Sales Revenue</span>
            <h3>₹{totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="glass-card graph-card" style={{ marginBottom: '2rem' }}>
        <h3>Milking Sessions Comparison (Last 7 Days)</h3>
        <div style={{ width: '100%', height: 300, marginTop: '1.5rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              <Legend wrapperStyle={{ fontSize: '0.85rem', paddingTop: '0.5rem' }} />
              <Bar dataKey="morning" name="Morning Milking (L)" fill="#1e8e3e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="evening" name="Evening Milking (L)" fill="#1a73e8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card">
        <h3>Production Ledger</h3>
        <div className="table-container" style={{ marginTop: '1rem' }}>
          {loading ? (
            <div className="text-center" style={{ padding: '2rem 0' }}>
              <div className="spinner" style={{ margin: '0 auto' }}></div>
            </div>
          ) : records.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>No milking logs registered yet.</p>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Cattle / Source</th>
                  <th>Session</th>
                  <th>Quantity</th>
                  <th>Fat %</th>
                  <th>SNF %</th>
                  <th>Price / L</th>
                  <th>Gross Total</th>
                  <th style={{ width: '80px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.id}>
                    <td>{rec.date}</td>
                    <td>
                      {rec.cattle_id ? (
                        <span className="badge badge-milking" style={{ textTransform: 'none' }}>
                          Tag: {rec.cattle_tag}
                        </span>
                      ) : (
                        <span className="badge badge-dry" style={{ textTransform: 'none' }}>
                          General Farm
                        </span>
                      )}
                    </td>
                    <td>{rec.session}</td>
                    <td><strong>{rec.quantity.toFixed(1)} L</strong></td>
                    <td>{rec.fat_percentage ? `${rec.fat_percentage.toFixed(1)}%` : '-'}</td>
                    <td>{rec.snf_percentage ? `${rec.snf_percentage.toFixed(1)}%` : '-'}</td>
                    <td>{rec.price_per_liter ? `₹${rec.price_per_liter.toFixed(2)}` : '-'}</td>
                    <td><strong>₹{rec.total_price.toFixed(2)}</strong></td>
                    <td>
                      <button 
                        className="delete-icon-btn" 
                        onClick={() => handleDelete(rec.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Log Milking Modal */}
      {isFormOpen && (
        <div className="modal-backdrop">
          <div className="glass-card modal-container animate-fade-in">
            <div className="modal-header">
              <h3>Log Milking Yield</h3>
              <button className="close-btn" onClick={() => setIsFormOpen(false)}>
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {formError && (
                <div className="form-error-banner">
                  <AlertTriangle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Cattle Tag ID</label>
                  <select 
                    className="form-select"
                    value={formData.cattle_id}
                    onChange={(e) => setFormData({ ...formData, cattle_id: e.target.value })}
                  >
                    <option value="">General Farm (Collective entry)</option>
                    {cattle.map(c => (
                      <option key={c.id} value={c.id}>Tag: {c.tag_id} ({c.name || 'Unnamed'})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Milking Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Session</label>
                  <select 
                    className="form-select"
                    value={formData.session}
                    onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                    required
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity Logged (Liters) *</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    placeholder="e.g. 14.5"
                    className="form-input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fat Percentage % (Optional)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="e.g. 4.2"
                    className="form-input"
                    value={formData.fat_percentage}
                    onChange={(e) => setFormData({ ...formData, fat_percentage: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">SNF Percentage % (Optional)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="e.g. 8.6"
                    className="form-input"
                    value={formData.snf_percentage}
                    onChange={(e) => setFormData({ ...formData, snf_percentage: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Price per Liter (₹) (Optional)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="40.00"
                    className="form-input"
                    value={formData.price_per_liter}
                    onChange={(e) => setFormData({ ...formData, price_per_liter: e.target.value })}
                  />
                  <small style={{ color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Note: If price is logged, the system automatically registers a matching transaction in your Financial ledger.
                  </small>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Yield</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .milk-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .kpi-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: #ffffff;
          border: 1px solid #dadce0;
        }

        .kpi-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          background: #f8f9fa;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kpi-card span {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .kpi-card h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .delete-icon-btn {
          background: transparent;
          border: none;
          color: #d93025;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity var(--transition-fast);
        }

        .delete-icon-btn:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

// Small helper svg for percent
function PercentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="5" x2="5" y2="19"></line>
      <circle cx="6.5" cy="6.5" r="2.5"></circle>
      <circle cx="17.5" cy="17.5" r="2.5"></circle>
    </svg>
  );
}
