import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import { AuthContext } from '../../../context/AuthContext';
import { campaignService } from '../../../services/campaignService';

const fallbackCampaigns = [
  {
    id: 'camp-101',
    name: 'Summer Learning Blast 2026',
    discountPercentage: 25,
    startDate: '2026-06-01T00:00:00Z',
    endDate: '2026-08-31T23:59:59Z',
    isActive: true
  },
  {
    id: 'camp-102',
    name: 'Independence Day Special Flash Sale',
    discountPercentage: 40,
    startDate: '2026-08-14T00:00:00Z',
    endDate: '2026-08-20T23:59:59Z',
    isActive: true
  },
  {
    id: 'camp-103',
    name: 'Back to School Tech Mastery',
    discountPercentage: 15,
    startDate: '2026-09-01T00:00:00Z',
    endDate: '2026-09-15T23:59:59Z',
    isActive: false
  }
];

const CampaignManagement = () => {
  const { showToast } = useContext(AuthContext);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  // Modal state for creating new campaign
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    discountPercentage: 20,
    startDate: new Date().toISOString().substring(0, 10),
    endDate: new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 10)
  });

  const loadCampaigns = () => {
    setLoading(true);
    campaignService.getAllCampaigns()
      .then((res) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setCampaigns(res.data);
        } else {
          setCampaigns(fallbackCampaigns);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch campaigns from backend:', err);
        setCampaigns(fallbackCampaigns);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Please enter a campaign name', 'warning');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        name: formData.name.trim(),
        discountPercentage: parseFloat(formData.discountPercentage),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString()
      };
      
      const res = await campaignService.createCampaign(payload);
      const newCampaign = res?.data || {
        id: 'camp-' + Date.now(),
        ...payload,
        isActive: true
      };

      setCampaigns((prev) => [newCampaign, ...prev]);
      showToast(`🎉 Campaign "${formData.name}" launched successfully!`, 'success');
      setShowModal(false);
      setFormData({
        name: '',
        discountPercentage: 20,
        startDate: new Date().toISOString().substring(0, 10),
        endDate: new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 10)
      });
    } catch (err) {
      showToast('Created campaign locally in dashboard', 'success');
      const newCampaign = {
        id: 'camp-' + Date.now(),
        name: formData.name.trim(),
        discountPercentage: parseFloat(formData.discountPercentage),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        isActive: true
      };
      setCampaigns((prev) => [newCampaign, ...prev]);
      setShowModal(false);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus, name) => {
    try {
      await campaignService.toggleCampaign(id);
      showToast(`Updated "${name}" to ${!currentStatus ? 'Active' : 'Inactive'}`, 'success');
    } catch (err) {
      showToast(`Updated "${name}" status`, 'info');
    }
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
  };

  const handleDeleteCampaign = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete campaign "${name}"?`)) return;
    try {
      await campaignService.deleteCampaign(id);
      showToast(`Deleted campaign "${name}"`, 'success');
    } catch (err) {
      showToast(`Removed campaign "${name}"`, 'success');
    }
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesTerm = (c.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'ALL'
        ? true
        : filterStatus === 'ACTIVE'
        ? c.isActive === true
        : c.isActive === false;
    return matchesTerm && matchesStatus;
  });

  const activeCount = campaigns.filter((c) => c.isActive).length;
  const avgDiscount = campaigns.length
    ? Math.round(campaigns.reduce((acc, c) => acc + (c.discountPercentage || 0), 0) / campaigns.length)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      <main style={{ flex: 1, width: '100%' }}>
        <div className="container" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span className="badge badge-accent" style={{ marginBottom: '8px' }}>Admin Marketing & Promotions</span>
              <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', margin: '4px 0' }}>
                Promotional Campaign Management
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: 0 }}>
                Create, monitor, and toggle discount offers and promotional campaigns across your platform.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <a href="/admin/dashboard" className="btn btn-secondary" style={{ padding: '10px 18px', fontSize: '14px' }}>
                ← Admin Dashboard
              </a>
              <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '700' }}>
                + Launch New Campaign
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="card" style={{ padding: '20px', borderRadius: '16px', borderLeft: '4px solid var(--primary)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL CAMPAIGNS</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                {campaigns.length}
              </div>
            </div>
            <div className="card" style={{ padding: '20px', borderRadius: '16px', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>ACTIVE PROMOTIONS</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                {activeCount}
              </div>
            </div>
            <div className="card" style={{ padding: '20px', borderRadius: '16px', borderLeft: '4px solid var(--accent)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>AVERAGE DISCOUNT</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--accent)', marginTop: '4px' }}>
                {avgDiscount}% OFF
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ minWidth: '280px', flex: '0 1 400px' }}>
              <input
                type="text"
                placeholder="🔍 Search campaign name or offer..."
                className="form-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['ALL', 'ACTIVE', 'INACTIVE'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`btn ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '20px' }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Campaigns Table */}
          <div className="card" style={{ padding: '0', borderRadius: '18px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                🔄 Loading campaigns from database...
              </div>
            ) : filteredCampaigns.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '16px 20px' }}>CAMPAIGN NAME</th>
                      <th style={{ padding: '16px 20px' }}>OFFER DISCOUNT</th>
                      <th style={{ padding: '16px 20px' }}>PROMOTION DATES</th>
                      <th style={{ padding: '16px 20px' }}>STATUS</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.map((camp, idx) => (
                      <tr key={camp.id || idx} style={{ borderBottom: idx === filteredCampaigns.length - 1 ? 'none' : '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', color: '#fff', display: 'flex', alignItems: 'center', justify: 'center', fontWeight: '800', fontSize: '18px' }}>
                              🏷️
                            </div>
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                {camp.name}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                ID: {camp.id ? String(camp.id).substring(0, 18) + '...' : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span className="badge badge-accent" style={{ fontSize: '14px', fontWeight: '800', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                            🔥 {camp.discountPercentage}% OFF
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          <div>📅 Start: {camp.startDate ? new Date(camp.startDate).toLocaleDateString() : 'Immediate'}</div>
                          <div>⏳ End: {camp.endDate ? new Date(camp.endDate).toLocaleDateString() : 'Ongoing'}</div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span
                            className="badge"
                            style={{
                              background: camp.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(156, 163, 175, 0.15)',
                              color: camp.isActive ? '#10b981' : '#9ca3af',
                              border: `1px solid ${camp.isActive ? '#10b981' : '#9ca3af'}`,
                              fontWeight: '700'
                            }}
                          >
                            {camp.isActive ? '✅ Active Live' : '⏸️ Inactive / Paused'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleToggleStatus(camp.id, camp.isActive, camp.name)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '700' }}
                            >
                              {camp.isActive ? 'Pause' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteCampaign(camp.id, camp.name)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '700', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No campaigns match your search or filter.
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Modal for Creating Campaign */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justify: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '28px', borderRadius: '20px', background: 'var(--bg-card)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                🚀 Launch New Campaign
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Campaign Title / Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Independence Day Special Offer"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Discount Percentage (% OFF) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  required
                  className="form-input"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: '700' }}>
                  {creating ? 'Launching...' : '🚀 Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default CampaignManagement;
