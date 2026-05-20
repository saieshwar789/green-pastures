import React, { useState, useEffect } from 'react';
import { api } from '../apiConfig';
import { 
  Plus, 
  Search, 
  Filter, 
  X, 
  Trash2, 
  Milk, 
  Heart, 
  Stethoscope, 
  FileText,
  Calendar,
  User,
  Activity
} from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

export default function HerdManagement() {
  const [cattleList, setCattleList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Selected cow details drawer
  const [selectedCowId, setSelectedCowId] = useState(null);
  const [cowDetails, setCowDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Add Cow Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCow, setNewCow] = useState({
    tag_id: '',
    name: '',
    breed: 'Holstein Friesian',
    dob: '',
    gender: 'Cow',
    status: 'Milking',
    notes: ''
  });
  const [formError, setFormError] = useState(null);

  useBodyScrollLock(isAddModalOpen);

  useEffect(() => {
    fetchCattle();
  }, []);

  useEffect(() => {
    if (selectedCowId) {
      fetchCowDetails(selectedCowId);
    } else {
      setCowDetails(null);
    }
  }, [selectedCowId]);

  const fetchCattle = async () => {
    try {
      setLoading(true);
      const res = await fetch(api('/api/cattle'));
      if (!res.ok) throw new Error('Failed to load cattle registry');
      const data = await res.json();
      setCattleList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCowDetails = async (id) => {
    try {
      setDetailsLoading(true);
      const res = await fetch(api(`/api/cattle/${id}`));
      if (!res.ok) throw new Error('Failed to load cattle details');
      const data = await res.json();
      setCowDetails(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleAddCow = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!newCow.tag_id || !newCow.dob || !newCow.breed) {
      setFormError('Please fill in all required fields (Tag ID, Breed, Date of Birth)');
      return;
    }
    
    try {
      const res = await fetch(api('/api/cattle'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCow)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register cattle');
      }
      
      setIsAddModalOpen(false);
      setNewCow({
        tag_id: '',
        name: '',
        breed: 'Holstein Friesian',
        dob: '',
        gender: 'Cow',
        status: 'Milking',
        notes: ''
      });
      fetchCattle();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDeleteCow = async (id) => {
    if (!window.confirm('Are you sure you want to delete this cattle? This will delete all its milking, breeding, and health records.')) {
      return;
    }
    try {
      const res = await fetch(api(`/api/cattle/${id}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete cattle');
      setSelectedCowId(null);
      fetchCattle();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (cowId, newStatus) => {
    try {
      const res = await fetch(api(`/api/cattle/${cowId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      
      // Update local state list
      setCattleList(cattleList.map(c => c.id === cowId ? { ...c, status: newStatus } : c));
      // Refresh details
      fetchCowDetails(cowId);
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter list
  const filteredCattle = cattleList.filter(cow => {
    const matchesSearch = 
      cow.tag_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (cow.name && cow.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      cow.breed.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || cow.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate age helper
  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    const years = Math.abs(ageDate.getUTCFullYear() - 1970);
    const months = ageDate.getUTCMonth();
    
    if (years === 0) {
      return `${months}m`;
    }
    return `${years}y ${months}m`;
  };

  return (
    <div className="herd-wrapper animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem' }}>Herd Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Register, monitor, and audit your livestock profile.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          <span>Register Cattle</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card controls-card">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by Tag ID, Name or Breed..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        
        <div className="filter-group">
          <Filter size={18} className="filter-icon" />
          <div className="filter-badges">
            {['All', 'Milking', 'Pregnant', 'Dry', 'Sick', 'Calf', 'Bull'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`filter-badge-btn ${statusFilter === status ? 'active' : ''}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="cattle-content-layout">
        {/* Cattle List Grid */}
        <div className="cattle-grid-panel">
          {loading ? (
            <div className="text-center" style={{ padding: '4rem 0' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
              <p style={{ color: 'var(--text-secondary)' }}>Loading cattle registry...</p>
            </div>
          ) : filteredCattle.length === 0 ? (
            <div className="glass-card text-center" style={{ padding: '4rem 1rem' }}>
              <User size={48} className="text-muted" style={{ margin: '0 auto 1rem' }} />
              <h3>No Cattle Found</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                No records match your filters. Register a new cow to get started.
              </p>
            </div>
          ) : (
            <div className="grid-layout">
              {filteredCattle.map((cow) => (
                <div 
                  key={cow.id} 
                  className={`glass-card glass-card-interactive cow-card ${selectedCowId === cow.id ? 'active' : ''}`}
                  onClick={() => setSelectedCowId(cow.id)}
                >
                  <div className="cow-card-header">
                    <div>
                      <span className="tag-label">Tag ID</span>
                      <h4 className="cow-tag">{cow.tag_id}</h4>
                    </div>
                    <span className={`badge badge-${cow.status.toLowerCase()}`}>{cow.status}</span>
                  </div>
                  
                  <div className="cow-card-body">
                    <div className="body-row">
                      <span className="label">Name:</span>
                      <span className="val">{cow.name || 'Unnamed'}</span>
                    </div>
                    <div className="body-row">
                      <span className="label">Breed:</span>
                      <span className="val">{cow.breed}</span>
                    </div>
                    <div className="body-row">
                      <span className="label">Age:</span>
                      <span className="val">{calculateAge(cow.dob)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Cow Details Drawer (Pushes in from right or displays alongside) */}
        {selectedCowId && (
          <div className="glass-card details-drawer animate-fade-in">
            <div className="drawer-header">
              <h3>Cattle Ledger</h3>
              <button className="close-btn" onClick={() => setSelectedCowId(null)}>
                <X size={20} />
              </button>
            </div>

            {detailsLoading || !cowDetails ? (
              <div className="text-center" style={{ padding: '5rem 0' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                <p style={{ color: 'var(--text-secondary)' }}>Loading ledger history...</p>
              </div>
            ) : (
              <div className="drawer-body">
                <div className="drawer-top-info">
                  <div className="drawer-avatar">
                    <Activity size={32} />
                  </div>
                  <div>
                    <h2>{cowDetails.tag_id}</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>{cowDetails.name || 'Unnamed Cow'}</p>
                  </div>
                </div>

                <div className="detail-rows">
                  <div className="detail-row">
                    <span className="label">Breed</span>
                    <span className="val">{cowDetails.breed}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Age</span>
                    <span className="val">{calculateAge(cowDetails.dob)} ({cowDetails.dob})</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Gender</span>
                    <span className="val">{cowDetails.gender}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Current Status</span>
                    <select 
                      value={cowDetails.status} 
                      onChange={(e) => handleStatusChange(cowDetails.id, e.target.value)}
                      className="form-select status-select-inline"
                    >
                      {['Milking', 'Dry', 'Pregnant', 'Sick', 'Calf', 'Bull'].map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  {cowDetails.notes && (
                    <div className="detail-row-vertical">
                      <span className="label">Notes</span>
                      <p className="val notes-box">{cowDetails.notes}</p>
                    </div>
                  )}
                </div>

                {/* Sub Tab: Milk History */}
                <div className="drawer-tab-section">
                  <div className="section-title">
                    <Milk size={16} className="text-cyan" />
                    <h4>Recent Milk Yields</h4>
                  </div>
                  {cowDetails.milk_history && cowDetails.milk_history.length > 0 ? (
                    <table className="mini-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Session</th>
                          <th>Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cowDetails.milk_history.map((record) => (
                          <tr key={record.id}>
                            <td>{record.date}</td>
                            <td>{record.session}</td>
                            <td>{record.quantity.toFixed(1)} L</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="no-records-text">No milk records logged for this cow.</p>
                  )}
                </div>

                {/* Sub Tab: Breeding History */}
                {cowDetails.gender === 'Cow' && (
                  <div className="drawer-tab-section">
                    <div className="section-title">
                      <Heart size={16} className="text-violet" />
                      <h4>Reproduction & Breeding</h4>
                    </div>
                    {cowDetails.breeding_history && cowDetails.breeding_history.length > 0 ? (
                      <div className="breeding-logs">
                        {cowDetails.breeding_history.map((rec) => (
                          <div key={rec.id} className="breeding-log-item">
                            <div className="log-row">
                              <span>Inseminated: <strong>{rec.insemination_date}</strong></span>
                              <span className={`badge badge-${rec.pregnancy_status.toLowerCase()}`}>{rec.pregnancy_status}</span>
                            </div>
                            <div className="log-row subtext">
                              <span>Sire ID: {rec.sire_id || 'N/A'}</span>
                              {rec.pregnancy_status === 'Positive' && (
                                <span>Calving Due: <strong>{rec.expected_calving_date}</strong></span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-records-text">No breeding events logged.</p>
                    )}
                  </div>
                )}

                {/* Sub Tab: Health & Veterinary History */}
                <div className="drawer-tab-section">
                  <div className="section-title">
                    <Stethoscope size={16} className="text-red" />
                    <h4>Vet & Medical Logs</h4>
                  </div>
                  {cowDetails.health_history && cowDetails.health_history.length > 0 ? (
                    <div className="health-logs">
                      {cowDetails.health_history.map((rec) => (
                        <div key={rec.id} className="health-log-item">
                          <div className="log-row">
                            <span><strong>{rec.record_type}</strong> - {rec.date}</span>
                            <span>₹{rec.cost.toFixed(2)}</span>
                          </div>
                          <p className="health-desc">{rec.details}</p>
                          {rec.next_due_date && (
                            <span className="health-due text-amber">Next Due: {rec.next_due_date}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-records-text">No health treatments logged.</p>
                  )}
                </div>

                <div className="drawer-actions">
                  <button 
                    className="btn btn-danger btn-full"
                    onClick={() => handleDeleteCow(cowDetails.id)}
                  >
                    <Trash2 size={16} />
                    <span>Deregister Cattle</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Cattle Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop">
          <div className="glass-card modal-container animate-fade-in">
            <div className="modal-header">
              <h3>Register New Cattle</h3>
              <button className="close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddCow} className="modal-form">
              {formError && (
                <div className="form-error-banner">
                  <AlertTriangle size={16} />
                  <span>{formError}</span>
                </div>
              )}
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Tag ID *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. C008" 
                    className="form-input"
                    value={newCow.tag_id}
                    onChange={(e) => setNewCow({ ...newCow, tag_id: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Name / Nickname</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Daisy II" 
                    className="form-input"
                    value={newCow.name}
                    onChange={(e) => setNewCow({ ...newCow, name: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Breed *</label>
                  <select 
                    className="form-select"
                    value={newCow.breed}
                    onChange={(e) => setNewCow({ ...newCow, breed: e.target.value })}
                    required
                  >
                    <option value="Holstein Friesian">Holstein Friesian</option>
                    <option value="Jersey">Jersey</option>
                    <option value="Brown Swiss">Brown Swiss</option>
                    <option value="Guernsey">Guernsey</option>
                    <option value="Ayrshire">Ayrshire</option>
                    <option value="Gir">Gir</option>
                    <option value="Sahiwal">Sahiwal</option>
                    <option value="Crossbred">Crossbred</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Date of Birth *</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={newCow.dob}
                    onChange={(e) => setNewCow({ ...newCow, dob: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select 
                    className="form-select"
                    value={newCow.gender}
                    onChange={(e) => setNewCow({ ...newCow, gender: e.target.value })}
                  >
                    <option value="Cow">Cow (Female)</option>
                    <option value="Bull">Bull (Male)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-select"
                    value={newCow.status}
                    onChange={(e) => setNewCow({ ...newCow, status: e.target.value })}
                  >
                    <option value="Milking">Milking</option>
                    <option value="Dry">Dry</option>
                    <option value="Pregnant">Pregnant</option>
                    <option value="Sick">Sick</option>
                    <option value="Calf">Calf</option>
                    <option value="Bull">Bull</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Notes / Identification details</label>
                <textarea 
                  rows="3" 
                  placeholder="E.g., white patch on forehead, extra large udder..."
                  className="form-textarea"
                  value={newCow.notes}
                  onChange={(e) => setNewCow({ ...newCow, notes: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .controls-card {
          display: flex;
          gap: 2rem;
          margin-bottom: 2rem;
          align-items: center;
          flex-wrap: wrap;
          background: #ffffff;
          border: 1px solid #dadce0;
        }

        .search-box {
          position: relative;
          flex: 1;
          min-width: 250px;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .search-box input {
          padding-left: 2.75rem;
          background: #ffffff;
          border: 1px solid #dadce0;
          color: var(--text-primary);
          border-radius: 4px;
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
          width: 100%;
          outline: none;
          font-family: var(--font-primary);
        }

        .search-box input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 1px var(--color-primary);
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .filter-icon {
          color: var(--text-muted);
        }

        .filter-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .filter-badge-btn {
          background: #ffffff;
          border: 1px solid #dadce0;
          color: var(--text-secondary);
          padding: 0.4rem 1rem;
          border-radius: 24px;
          font-family: var(--font-primary);
          font-size: 0.85rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .filter-badge-btn:hover {
          background: #f8f9fa;
          color: var(--text-primary);
        }

        .filter-badge-btn.active {
          background: var(--color-primary-glow);
          color: var(--color-primary-dark);
          border-color: var(--color-primary-border);
          font-weight: 600;
        }

        .cattle-content-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        /* Responsive Grid change when Cow drawer is open */
        @media (min-width: 1200px) {
          .cattle-content-layout {
            grid-template-columns: 7fr 5fr;
          }
        }

        .grid-layout {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1.25rem;
        }

        .cow-card {
          padding: 1.25rem;
          border: 1px solid #dadce0;
          background: #ffffff;
        }

        .cow-card.active {
          border-color: var(--color-primary);
          background-color: var(--color-primary-glow);
        }

        .cow-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .tag-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .cow-tag {
          font-size: 1.15rem;
          font-weight: 600;
          line-height: 1.2;
          color: var(--text-primary);
        }

        .cow-card-body {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .body-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
        }

        .body-row .label {
          color: var(--text-secondary);
        }

        .body-row .val {
          font-weight: 500;
          color: var(--text-primary);
        }

        /* Drawer container */
        .details-drawer {
          background: #ffffff;
          border: 1px solid #dadce0;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 2rem;
          position: sticky;
          top: 2rem;
          max-height: 85vh;
          overflow-y: auto;
        }

        .drawer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #dadce0;
          padding-bottom: 1rem;
        }

        .drawer-body {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .drawer-top-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .drawer-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--color-primary-glow);
          border: 1px solid var(--color-primary-border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-primary);
        }

        .drawer-top-info h2 {
          font-size: 1.5rem;
          line-height: 1.2;
          font-weight: 600;
        }

        .detail-rows {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #dadce0;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
        }

        .detail-row .label {
          color: var(--text-secondary);
        }

        .detail-row .val {
          font-weight: 500;
        }

        .status-select-inline {
          padding: 0.25rem 0.5rem;
          width: auto;
          font-size: 0.85rem;
        }

        .detail-row-vertical {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          border-top: 1px solid #dadce0;
          padding-top: 0.75rem;
          margin-top: 0.25rem;
        }

        .notes-box {
          font-size: 0.85rem;
          color: var(--text-secondary);
          background: #ffffff;
          padding: 0.5rem;
          border-radius: 4px;
          border: 1px solid #dadce0;
        }

        .drawer-tab-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          border-top: 1px solid #dadce0;
          padding-top: 1.25rem;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .section-title h4 {
          font-size: 0.95rem;
          font-weight: 600;
        }

        .mini-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8rem;
        }

        .mini-table th {
          text-align: left;
          color: var(--text-secondary);
          padding: 0.5rem;
          border-bottom: 1px solid #dadce0;
        }

        .mini-table td {
          padding: 0.5rem;
          border-bottom: 1px solid #dadce0;
          color: var(--text-primary);
        }

        .no-records-text {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-style: italic;
          padding: 0.25rem 0;
        }

        .breeding-logs, .health-logs {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .breeding-log-item, .health-log-item {
          background: #f8f9fa;
          border: 1px solid #dadce0;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 0.85rem;
        }

        .log-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }

        .log-row.subtext {
          color: var(--text-secondary);
          font-size: 0.8rem;
        }

        .health-desc {
          color: var(--text-secondary);
          margin: 0.25rem 0;
        }

        .health-due {
          font-size: 0.75rem;
          font-weight: 500;
        }

        .drawer-actions {
          margin-top: 1.5rem;
          border-top: 1px solid #dadce0;
          padding-top: 1.5rem;
        }

        .btn-full {
          width: 100%;
        }
      `}</style>
    </div>
  );
}
