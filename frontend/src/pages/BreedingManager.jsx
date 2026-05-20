import React, { useState, useEffect } from 'react';
import { api } from '../apiConfig';
import { Heart, Plus, Calendar, Activity, AlertTriangle, Check, ArrowRight, UserCheck } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

export default function BreedingManager() {
  const [records, setRecords] = useState([]);
  const [cows, setCows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Action Forms
  const [activeModal, setActiveModal] = useState(null); // 'inseminate', 'pregCheck', 'calving'
  const [selectedRecord, setSelectedRecord] = useState(null); // for pregnancy check or calving

  useBodyScrollLock(activeModal !== null);
  
  // Inseminate Form State
  const [insemForm, setInsemForm] = useState({
    cattle_id: '',
    insemination_date: new Date().toISOString().split('T')[0],
    breeding_method: 'Artificial Insemination',
    sire_id: '',
    notes: ''
  });

  // Pregnancy Check Form State
  const [pregForm, setPregForm] = useState({
    pregnancy_status: 'Positive',
    pregnancy_check_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Calving Form State
  const [calvingForm, setCalvingForm] = useState({
    actual_calving_date: new Date().toISOString().split('T')[0],
    register_calf: true,
    calf_gender: 'Cow',
    notes: ''
  });

  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [breedRes, cattleRes] = await Promise.all([
        fetch(api('/api/breeding')),
        fetch(api('/api/cattle'))
      ]);
      
      if (!breedRes.ok || !cattleRes.ok) throw new Error('Failed to load breeding data');
      
      const breedData = await breedRes.json();
      const cattleData = await cattleRes.json();
      
      setRecords(breedData);
      // Filter only females (Cows) that are not calves
      setCows(cattleData.filter(c => c.gender === 'Cow' && c.status !== 'Calf'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInseminate = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!insemForm.cattle_id || !insemForm.insemination_date) {
      setFormError('Please select a cow and insemination date.');
      return;
    }

    try {
      const res = await fetch(api('/api/breeding'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(insemForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record breeding');
      
      setActiveModal(null);
      setInsemForm({
        cattle_id: '',
        insemination_date: new Date().toISOString().split('T')[0],
        breeding_method: 'Artificial Insemination',
        sire_id: '',
        notes: ''
      });
      fetchData();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handlePregCheck = async (e) => {
    e.preventDefault();
    setFormError(null);
    
    try {
      const res = await fetch(api(`/api/breeding/${selectedRecord.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pregForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update pregnancy status');
      
      setActiveModal(null);
      setSelectedRecord(null);
      setPregForm({
        pregnancy_status: 'Positive',
        pregnancy_check_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      fetchData();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleCalving = async (e) => {
    e.preventDefault();
    setFormError(null);

    try {
      const res = await fetch(api(`/api/breeding/${selectedRecord.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calvingForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to log calving event');
      
      setActiveModal(null);
      setSelectedRecord(null);
      setCalvingForm({
        actual_calving_date: new Date().toISOString().split('T')[0],
        register_calf: true,
        calf_gender: 'Cow',
        notes: ''
      });
      fetchData();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this breeding record?')) return;
    try {
      const res = await fetch(api(`/api/breeding/${id}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete breeding record');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Get active lists
  const pendingRecords = records.filter(r => r.pregnancy_status === 'Pending');
  const positiveRecords = records.filter(r => r.pregnancy_status === 'Positive' && !r.actual_calving_date);
  const archivedRecords = records.filter(r => r.pregnancy_status === 'Negative' || r.actual_calving_date);

  return (
    <div className="breeding-wrapper animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem' }}>Breeding & Reproduction</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Log inseminations, confirm pregnancy scans, and track calving cycles.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setActiveModal('inseminate')}>
          <Plus size={18} />
          <span>Record Insemination</span>
        </button>
      </div>

      {/* Grid of Workflows: Pending Checks vs Pregnant Cows */}
      <div className="breeding-grid-sections">
        {/* Section 1: Pending Preg Checks */}
        <div className="glass-card section-card">
          <div className="card-header" style={{ marginBottom: '1.25rem' }}>
            <h3>Pregnancy Checks Pending</h3>
            <span className="badge badge-dry">{pendingRecords.length} pending</span>
          </div>
          
          <div className="list-container">
            {pendingRecords.length === 0 ? (
              <p className="empty-text">No pending checks. Record inseminations to track progress.</p>
            ) : (
              pendingRecords.map(rec => (
                <div key={rec.id} className="breeding-item-card">
                  <div className="item-meta">
                    <span className="cow-tag">Cow Tag: {rec.cattle_tag}</span>
                    <span className="insem-date">Inseminated: {rec.insemination_date}</span>
                  </div>
                  <div className="item-calculations">
                    <span>Sire: {rec.sire_id || 'N/A'}</span>
                    <span className="text-amber">Check Due: {rec.pregnancy_check_date}</span>
                  </div>
                  <button 
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: '0.75rem', width: '100%' }}
                    onClick={() => {
                      setSelectedRecord(rec);
                      setActiveModal('pregCheck');
                    }}
                  >
                    <UserCheck size={14} />
                    <span>Record Pregnancy Result</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 2: Confirmed Pregnancies */}
        <div className="glass-card section-card">
          <div className="card-header" style={{ marginBottom: '1.25rem' }}>
            <h3>Pregnant Cows (Active Cycles)</h3>
            <span className="badge badge-pregnant">{positiveRecords.length} active</span>
          </div>

          <div className="list-container">
            {positiveRecords.length === 0 ? (
              <p className="empty-text">No confirmed pregnancies currently active.</p>
            ) : (
              positiveRecords.map(rec => (
                <div key={rec.id} className="breeding-item-card">
                  <div className="item-meta">
                    <span className="cow-tag">Cow Tag: {rec.cattle_tag}</span>
                    <span className="badge badge-pregnant">Confirmed</span>
                  </div>
                  <div className="item-calculations">
                    <span>Sire: {rec.sire_id || 'N/A'}</span>
                    <span className="text-emerald">Expected Calving: {rec.expected_calving_date}</span>
                  </div>
                  <button 
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: '0.75rem', width: '100%' }}
                    onClick={() => {
                      setSelectedRecord(rec);
                      setActiveModal('calving');
                    }}
                  >
                    <Activity size={14} />
                    <span>Log Calving / Birth</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Historical Records Ledger */}
      <div className="glass-card" style={{ marginTop: '2rem' }}>
        <h3>Reproduction History</h3>
        <div className="table-container" style={{ marginTop: '1rem' }}>
          {loading ? (
            <div className="text-center" style={{ padding: '2rem 0' }}>
              <div className="spinner" style={{ margin: '0 auto' }}></div>
            </div>
          ) : records.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>No breeding logs registered.</p>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Insemination Date</th>
                  <th>Cattle Tag</th>
                  <th>Sire ID</th>
                  <th>Method</th>
                  <th>Preg. Status</th>
                  <th>Calving Expected</th>
                  <th>Calving Actual</th>
                  <th>Notes</th>
                  <th style={{ width: '80px' }}>Actions</th>
                </tr>
              </thead>
               <tbody>
                {records.map((rec) => (
                  <tr key={rec.id}>
                    <td data-label="Insemination Date">{rec.insemination_date}</td>
                    <td data-label="Cattle Tag"><span className="badge badge-milking">Tag: {rec.cattle_tag}</span></td>
                    <td data-label="Sire ID">{rec.sire_id || '-'}</td>
                    <td data-label="Method">{rec.breeding_method}</td>
                    <td data-label="Preg. Status">
                      <span className={`badge badge-${rec.pregnancy_status.toLowerCase()}`}>
                        {rec.pregnancy_status}
                      </span>
                    </td>
                    <td data-label="Calving Expected">{rec.expected_calving_date || '-'}</td>
                    <td data-label="Calving Actual">
                      {rec.actual_calving_date ? (
                        <span className="text-emerald" style={{ fontWeight: 600 }}>{rec.actual_calving_date}</span>
                      ) : rec.pregnancy_status === 'Positive' ? (
                        <span className="text-amber">Pending Calving</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td data-label="Notes" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '200px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {rec.notes || '-'}
                    </td>
                    <td data-label="Actions">
                      <button className="btn-link-danger" onClick={() => handleDelete(rec.id)}>
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

      {/* MODAL 1: Inseminate */}
      {activeModal === 'inseminate' && (
        <div className="modal-backdrop">
          <div className="glass-card modal-container animate-fade-in">
            <div className="modal-header">
              <h3>Record Insemination</h3>
              <button className="close-btn" onClick={() => setActiveModal(null)}>Cancel</button>
            </div>
            <form onSubmit={handleInseminate} className="modal-form">
              {formError && <div className="form-error-banner"><AlertTriangle size={16} /><span>{formError}</span></div>}
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Select Cow (Female)</label>
                  <select 
                    className="form-select"
                    value={insemForm.cattle_id}
                    onChange={(e) => setInsemForm({ ...insemForm, cattle_id: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Cow --</option>
                    {cows.map(c => (
                      <option key={c.id} value={c.id}>Tag: {c.tag_id} ({c.name || 'Unnamed'}) - Status: {c.status}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Insemination Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={insemForm.insemination_date}
                    onChange={(e) => setInsemForm({ ...insemForm, insemination_date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Breeding Method</label>
                  <select 
                    className="form-select"
                    value={insemForm.breeding_method}
                    onChange={(e) => setInsemForm({ ...insemForm, breeding_method: e.target.value })}
                  >
                    <option value="Artificial Insemination">Artificial Insemination (AI)</option>
                    <option value="Natural Service">Natural Service</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Sire Bull ID / Breed Used</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Bull J-505"
                    className="form-input"
                    value={insemForm.sire_id}
                    onChange={(e) => setInsemForm({ ...insemForm, sire_id: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea 
                  rows="3" 
                  placeholder="E.g., Insemination went smoothly, dose lot number..."
                  className="form-textarea"
                  value={insemForm.notes}
                  onChange={(e) => setInsemForm({ ...insemForm, notes: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Insemination</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Pregnancy Check */}
      {activeModal === 'pregCheck' && selectedRecord && (
        <div className="modal-backdrop">
          <div className="glass-card modal-container animate-fade-in">
            <div className="modal-header">
              <h3>Pregnancy Check Result</h3>
              <button className="close-btn" onClick={() => setActiveModal(null)}>Cancel</button>
            </div>
            <form onSubmit={handlePregCheck} className="modal-form">
              {formError && <div className="form-error-banner"><AlertTriangle size={16} /><span>{formError}</span></div>}
              
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Recording pregnancy scan/check result for <strong>Cow Tag {selectedRecord.cattle_tag}</strong>. 
                Inseminated on {selectedRecord.insemination_date}.
              </p>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Scan/Check Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={pregForm.pregnancy_check_date}
                    onChange={(e) => setPregForm({ ...pregForm, pregnancy_check_date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Result Status</label>
                  <select 
                    className="form-select"
                    value={pregForm.pregnancy_status}
                    onChange={(e) => setPregForm({ ...pregForm, pregnancy_status: e.target.value })}
                  >
                    <option value="Positive">Positive (Confirmed Pregnant)</option>
                    <option value="Negative">Negative (Not Pregnant)</option>
                    <option value="Pending">Pending (Re-check needed later)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Observations / Notes</label>
                <textarea 
                  rows="3" 
                  placeholder="E.g., Twin vesicles observed, strong pulse..."
                  className="form-textarea"
                  value={pregForm.notes}
                  onChange={(e) => setPregForm({ ...pregForm, notes: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Check</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Calving */}
      {activeModal === 'calving' && selectedRecord && (
        <div className="modal-backdrop">
          <div className="glass-card modal-container animate-fade-in">
            <div className="modal-header">
              <h3>Log Calving Event</h3>
              <button className="close-btn" onClick={() => setActiveModal(null)}>Cancel</button>
            </div>
            <form onSubmit={handleCalving} className="modal-form">
              {formError && <div className="form-error-banner"><AlertTriangle size={16} /><span>{formError}</span></div>}

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Recording calving details for <strong>Cow Tag {selectedRecord.cattle_tag}</strong>. 
                Insemination Date: {selectedRecord.insemination_date}. Expected due date was: {selectedRecord.expected_calving_date}.
              </p>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Calving Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={calvingForm.actual_calving_date}
                    onChange={(e) => setCalvingForm({ ...calvingForm, actual_calving_date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Calf Gender</label>
                  <select 
                    className="form-select"
                    value={calvingForm.calf_gender}
                    onChange={(e) => setCalvingForm({ ...calvingForm, calf_gender: e.target.value })}
                    disabled={!calvingForm.register_calf}
                  >
                    <option value="Cow">Heifer (Female Calf)</option>
                    <option value="Bull">Bull (Male Calf)</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="reg_calf" 
                  checked={calvingForm.register_calf}
                  onChange={(e) => setCalvingForm({ ...calvingForm, register_calf: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="reg_calf" className="form-label" style={{ marginBottom: 0, cursor: 'pointer', color: 'var(--text-primary)' }}>
                  Automatically register newborn calf in Herd registry database
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Calving Notes</label>
                <textarea 
                  rows="3" 
                  placeholder="E.g., Easy calving, single calf, healthy birth weight..."
                  className="form-textarea"
                  value={calvingForm.notes}
                  onChange={(e) => setCalvingForm({ ...calvingForm, notes: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Log Birth</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .breeding-grid-sections {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 1.5rem;
        }

        .section-card {
          min-height: 350px;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border: 1px solid #dadce0;
        }

        .list-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 400px;
          overflow-y: auto;
          flex: 1;
        }

        .empty-text {
          font-style: italic;
          color: var(--text-muted);
          text-align: center;
          padding: 3rem 1rem;
          border: 1px dashed #dadce0;
          border-radius: 8px;
        }

        .breeding-item-card {
          background: #ffffff;
          border: 1px solid #dadce0;
          padding: 1rem;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
        }

        .item-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .item-meta .cow-tag {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .item-meta .insem-date {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .item-calculations {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
        }

        .btn-link-danger {
          background: transparent;
          border: none;
          color: #d93025;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .btn-link-danger:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
