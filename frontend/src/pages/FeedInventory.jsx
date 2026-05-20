import React, { useState, useEffect } from 'react';
import { api } from '../apiConfig';
import { Warehouse, Plus, Calendar, AlertTriangle, FileText, Activity } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

export default function FeedInventory() {
  const [inventory, setInventory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [activeModal, setActiveModal] = useState(null); // 'addStock', 'logFeeding'
  const [formError, setFormError] = useState(null);

  useBodyScrollLock(activeModal !== null);

  // Add Stock Form State
  const [stockForm, setStockForm] = useState({
    feed_name: '',
    quantity_kg: '',
    unit_cost_per_kg: '25.00',
    reorder_level_kg: '200',
    add_to_stock: true
  });

  // Log Feeding Form State
  const [feedLogForm, setFeedLogForm] = useState({
    feed_id: '',
    date: new Date().toISOString().split('T')[0],
    quantity_used_kg: '',
    group_fed: 'Milking Herd'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, logsRes] = await Promise.all([
        fetch(api('/api/feed/inventory')),
        fetch(api('/api/feed/logs'))
      ]);

      if (!invRes.ok || !logsRes.ok) throw new Error('Error loading feed database');

      const invData = await invRes.json();
      const logsData = await logsRes.json();

      setInventory(invData);
      setLogs(logsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!stockForm.feed_name || !stockForm.quantity_kg || parseFloat(stockForm.quantity_kg) <= 0) {
      setFormError('Please enter a valid feed name and quantity.');
      return;
    }

    try {
      const res = await fetch(api('/api/feed/inventory'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stockForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update stock');

      setActiveModal(null);
      setStockForm({
        feed_name: '',
        quantity_kg: '',
        unit_cost_per_kg: '25.00',
        reorder_level_kg: '200',
        add_to_stock: true
      });
      fetchData();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleLogFeeding = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!feedLogForm.feed_id || !feedLogForm.quantity_used_kg || parseFloat(feedLogForm.quantity_used_kg) <= 0) {
      setFormError('Please select feed type and enter feeding quantity.');
      return;
    }

    try {
      const res = await fetch(api('/api/feed/logs'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedLogForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to log feeding event');

      setActiveModal(null);
      setFeedLogForm({
        feed_id: '',
        date: new Date().toISOString().split('T')[0],
        quantity_used_kg: '',
        group_fed: 'Milking Herd'
      });
      fetchData();
    } catch (err) {
      setFormError(err.message);
    }
  };

  // Stock gauge colors helper
  const getProgressColor = (stock, reorder) => {
    if (stock <= reorder) return '#d93025'; // Low stock - red
    if (stock <= reorder * 1.5) return '#e37400'; // warning - orange
    return '#1e8e3e'; // healthy - green
  };

  return (
    <div className="feed-wrapper animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem' }}>Feed Inventory & Logs</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Monitor silage/grain reserves, log daily feeds, and configure reorder levels.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => setActiveModal('logFeeding')}>
            <Activity size={18} />
            <span>Log Daily Feeding</span>
          </button>
          <button className="btn btn-primary" onClick={() => setActiveModal('addStock')}>
            <Plus size={18} />
            <span>Add Feed Stock</span>
          </button>
        </div>
      </div>

      {/* Visual Stock Levels Gauges */}
      <div className="feed-stock-section">
        <h3>Current Feed Reserves</h3>
        <div className="feed-gauge-grid" style={{ marginTop: '1.25rem' }}>
          {inventory.length === 0 ? (
            <p className="empty-text" style={{ gridColumn: 'span 3' }}>No feed reserves configured. Click 'Add Feed Stock' to create feed items.</p>
          ) : (
            inventory.map(item => {
              const maxVal = Math.max(item.quantity_kg, item.reorder_level_kg * 4); // Simulated capacity for visual representation
              const percent = Math.min((item.quantity_kg / maxVal) * 100, 100);
              const color = getProgressColor(item.quantity_kg, item.reorder_level_kg);
              const isLow = item.quantity_kg <= item.reorder_level_kg;

              return (
                <div key={item.id} className="glass-card gauge-card">
                  <div className="gauge-header">
                    <h4>{item.feed_name}</h4>
                    {isLow && (
                      <span className="badge badge-sick" style={{ gap: '0.25rem' }}>
                        <AlertTriangle size={12} />
                        <span>Low Stock</span>
                      </span>
                    )}
                  </div>
                  
                  <div className="gauge-metrics">
                    <span className="stock-qty"><strong>{item.quantity_kg.toFixed(0)}</strong> kg</span>
                    <span className="reorder-lvl">Reorder level: {item.reorder_level_kg.toFixed(0)} kg</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="progress-track">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${percent}%`,
                        backgroundColor: color
                      }}
                    ></div>
                  </div>

                  <div className="gauge-footer">
                    <span>Est. Cost: ₹{item.unit_cost_per_kg.toFixed(2)}/kg</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Feeding Logs Ledger */}
      <div className="glass-card" style={{ marginTop: '2rem' }}>
        <h3>Feeding Ledger</h3>
        <div className="table-container" style={{ marginTop: '1.25rem' }}>
          {loading ? (
            <div className="text-center" style={{ padding: '2rem 0' }}>
              <div className="spinner" style={{ margin: '0 auto' }}></div>
            </div>
          ) : logs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>No feeding logs logged yet.</p>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Feeding Date</th>
                  <th>Feed Name</th>
                  <th>Quantity Consumed</th>
                  <th>Cattle Group Fed</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td data-label="Feeding Date">{log.date}</td>
                    <td data-label="Feed Name"><strong>{log.feed_name}</strong></td>
                    <td data-label="Quantity Consumed"><span className="text-amber" style={{ fontWeight: 600 }}>{log.quantity_used_kg.toFixed(1)} kg</span></td>
                    <td data-label="Cattle Group Fed"><span className="badge badge-milking">{log.group_fed}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL 1: Add Feed Stock */}
      {activeModal === 'addStock' && (
        <div className="modal-backdrop">
          <div className="glass-card modal-container animate-fade-in">
            <div className="modal-header">
              <h3>Add Feed Stock</h3>
              <button className="close-btn" onClick={() => setActiveModal(null)}>Cancel</button>
            </div>
            
            <form onSubmit={handleAddStock} className="modal-form">
              {formError && <div className="form-error-banner"><AlertTriangle size={16} /><span>{formError}</span></div>}

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Feed Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Corn Silage, Alfalfa Hay"
                    className="form-input"
                    value={stockForm.feed_name}
                    onChange={(e) => setStockForm({ ...stockForm, feed_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity to Add (kg) *</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 500"
                    className="form-input"
                    value={stockForm.quantity_kg}
                    onChange={(e) => setStockForm({ ...stockForm, quantity_kg: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unit Cost per kg (₹)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-input"
                    value={stockForm.unit_cost_per_kg}
                    onChange={(e) => setStockForm({ ...stockForm, unit_cost_per_kg: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reorder Alert Level (kg)</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={stockForm.reorder_level_kg}
                    onChange={(e) => setStockForm({ ...stockForm, reorder_level_kg: e.target.value })}
                  />
                </div>
              </div>
              
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                Note: Saving stock automatically records an Expense record in the Financial ledger representing this purchase.
              </small>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Log Daily Feeding */}
      {activeModal === 'logFeeding' && (
        <div className="modal-backdrop">
          <div className="glass-card modal-container animate-fade-in">
            <div className="modal-header">
              <h3>Log Daily Feeding</h3>
              <button className="close-btn" onClick={() => setActiveModal(null)}>Cancel</button>
            </div>
            
            <form onSubmit={handleLogFeeding} className="modal-form">
              {formError && <div className="form-error-banner"><AlertTriangle size={16} /><span>{formError}</span></div>}

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Select Feed Type *</label>
                  <select 
                    className="form-select"
                    value={feedLogForm.feed_id}
                    onChange={(e) => setFeedLogForm({ ...feedLogForm, feed_id: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Feed --</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.id}>{item.feed_name} (Stock: {item.quantity_kg.toFixed(0)} kg)</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Date Fed</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={feedLogForm.date}
                    onChange={(e) => setFeedLogForm({ ...feedLogForm, date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity Consumed (kg) *</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 100"
                    className="form-input"
                    value={feedLogForm.quantity_used_kg}
                    onChange={(e) => setFeedLogForm({ ...feedLogForm, quantity_used_kg: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cattle Group Fed</label>
                  <select 
                    className="form-select"
                    value={feedLogForm.group_fed}
                    onChange={(e) => setFeedLogForm({ ...feedLogForm, group_fed: e.target.value })}
                  >
                    <option value="Milking Herd">Milking Herd</option>
                    <option value="Dry Cows">Dry Cows</option>
                    <option value="Pregnant Cows">Pregnant Cows</option>
                    <option value="Calves">Calves</option>
                    <option value="All">All Herd</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Log Feeding</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .feed-stock-section h3 {
          font-size: 1.25rem;
        }

        .feed-gauge-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .gauge-card {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: #ffffff;
          border: 1px solid #dadce0;
        }

        .gauge-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .gauge-metrics {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .stock-qty {
          font-size: 1.75rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .reorder-lvl {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .progress-track {
          width: 100%;
          height: 8px;
          background: #f1f3f4;
          border-radius: 999px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 999px;
          transition: width var(--transition-normal);
        }

        .gauge-footer {
          font-size: 0.8rem;
          color: var(--text-muted);
          border-top: 1px solid #dadce0;
          padding-top: 0.5rem;
        }
      `}</style>
    </div>
  );
}
