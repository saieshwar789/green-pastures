import React, { useState, useEffect } from 'react';
import { api } from '../apiConfig';
import { IndianRupee, Plus, Calendar, AlertTriangle, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

export default function FinanceTracker() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState(null);

  useBodyScrollLock(isFormOpen);
  
  // Transaction Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Income',
    category: 'Milk Sale',
    amount: '',
    description: ''
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch(api('/api/finance'));
      if (!res.ok) throw new Error('Failed to load transaction ledger');
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setFormError('Please enter a valid amount.');
      return;
    }

    try {
      const res = await fetch(api('/api/finance'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record transaction');

      setIsFormOpen(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'Income',
        category: 'Milk Sale',
        amount: '',
        description: ''
      });
      fetchTransactions();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction record?')) return;
    try {
      const res = await fetch(api(`/api/finance/${id}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete transaction');
      fetchTransactions();
    } catch (err) {
      alert(err.message);
    }
  };

  // Calculations for summary metrics
  const totalIncome = transactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  return (
    <div className="finance-wrapper animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem' }}>Financial Ledger</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track income from milk and cattle sales against utility, feed, and veterinary expenses.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsFormOpen(true)}>
          <Plus size={18} />
          <span>Record Transaction</span>
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="finance-summary-grid">
        {/* Income Card */}
        <div className="glass-card balance-card income">
          <div className="balance-icon text-emerald">
            <TrendingUp size={24} />
          </div>
          <div>
            <span>Total Earnings (Income)</span>
            <h2>₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="glass-card balance-card expense">
          <div className="balance-icon text-red">
            <TrendingDown size={24} />
          </div>
          <div>
            <span>Total Spend (Expenses)</span>
            <h2>₹{totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="glass-card balance-card net">
          <div className={`balance-icon ${netBalance >= 0 ? 'text-emerald' : 'text-red'}`}>
            <IndianRupee size={24} />
          </div>
          <div>
            <span>Net Operating Balance</span>
            <h2 className={netBalance >= 0 ? 'text-emerald' : 'text-red'}>
              ₹{netBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <div className="glass-card">
        <h3>Transaction Ledger</h3>
        <div className="table-container" style={{ marginTop: '1.25rem' }}>
          {loading ? (
            <div className="text-center" style={{ padding: '2rem 0' }}>
              <div className="spinner" style={{ margin: '0 auto' }}></div>
            </div>
          ) : transactions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>No transactions recorded yet.</p>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th style={{ width: '80px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>
                      <span className={`badge ${t.type === 'Income' ? 'badge-milking' : 'badge-sick'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td><strong>{t.category}</strong></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '350px' }}>
                      {t.description || '-'}
                    </td>
                    <td>
                      <span className={t.type === 'Income' ? 'text-emerald' : 'text-red'} style={{ fontWeight: 700 }}>
                        {t.type === 'Income' ? '+' : '-'}₹{t.amount.toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-link-danger" 
                        onClick={() => handleDelete(t.id)}
                        title="Delete transaction"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Record Transaction Modal */}
      {isFormOpen && (
        <div className="modal-backdrop">
          <div className="glass-card modal-container animate-fade-in">
            <div className="modal-header">
              <h3>Record Transaction</h3>
              <button className="close-btn" onClick={() => setIsFormOpen(false)}>Cancel</button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              {formError && <div className="form-error-banner"><AlertTriangle size={16} /><span>{formError}</span></div>}

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Transaction Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Flow Type</label>
                  <select 
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setFormData({ 
                        ...formData, 
                        type: newType,
                        category: newType === 'Income' ? 'Milk Sale' : 'Feed Purchase'
                      });
                    }}
                    required
                  >
                    <option value="Income">Income (Money In)</option>
                    <option value="Expense">Expense (Money Out)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Category *</label>
                  {formData.type === 'Income' ? (
                    <select 
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    >
                      <option value="Milk Sale">Milk Sale</option>
                      <option value="Cattle Sale">Cattle Sale</option>
                      <option value="Other">Other Revenue</option>
                    </select>
                  ) : (
                    <select 
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    >
                      <option value="Feed Purchase">Feed Purchase</option>
                      <option value="Veterinary">Veterinary / Medicine</option>
                      <option value="Labor">Labor Wages</option>
                      <option value="Utilities">Utilities (Water/Electricity)</option>
                      <option value="Other">Other Expense</option>
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="e.g. 250.00"
                    className="form-input"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  rows="3" 
                  placeholder="E.g. Sold 4 bags organic manure to cooperative, utility bill for June..."
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .finance-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .balance-card {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          background: #ffffff;
          border: 1px solid #dadce0;
        }

        .balance-icon {
          width: 50px;
          height: 50px;
          border-radius: 8px;
          background: #f8f9fa;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .balance-card span {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .balance-card h2 {
          font-size: 1.6rem;
          font-weight: 600;
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
