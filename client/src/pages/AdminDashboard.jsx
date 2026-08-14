import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [donors, setDonors] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [pendingDonations, setPendingDonations] = useState([]);
  const [completedDonations, setCompletedDonations] = useState([]);
  const [allDonations, setAllDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('overview'); // overview | donors | volunteers | pending | completed | all

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError('');

      const [statsRes, donorsRes, volunteersRes, pendingRes, completedRes, allRes] =
        await Promise.all([
          api.get('/donations/stats'),
          api.get('/admin/users?role=donor&limit=100'),
          api.get('/admin/users?role=volunteer&limit=100'),
          api.get('/donations?status=pending&limit=50'),
          api.get('/donations?status=delivered&limit=50'),
          api.get('/donations?limit=50'),
        ]);

      setStats(statsRes.data.data);
      setDonors(donorsRes.data.data || []);
      setVolunteers(volunteersRes.data.data || []);
      setPendingDonations(pendingRes.data.data || []);
      setCompletedDonations(completedRes.data.data || []);
      setAllDonations(allRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const toggleUserActive = async (userId, currentStatus) => {
    try {
      await api.put(`/admin/users/${userId}`, { isActive: !currentStatus });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user');
    }
  };

  const getStatusClass = (status) => {
    const map = {
      pending: 'status-pending',
      accepted: 'status-accepted',
      picked: 'status-picked',
      delivered: 'status-delivered',
      expired: 'status-expired',
      cancelled: 'status-cancelled',
    };
    return map[status] || '';
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>🛡️ Admin Dashboard</h1>
          <p>
            Welcome, <strong>{user?.name}</strong>. Manage donors, volunteers & donations.
          </p>
        </div>
        <button onClick={fetchAll} className="btn btn-outline">
          🔄 Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* ===== LIST BUTTONS ===== */}
      <div className="admin-menu-buttons">
        <button
          className={`admin-menu-btn ${activeView === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveView('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`admin-menu-btn ${activeView === 'donors' ? 'active' : ''}`}
          onClick={() => setActiveView('donors')}
        >
          🍽️ Donors List
          <span className="menu-count">{donors.length}</span>
        </button>
        <button
          className={`admin-menu-btn ${activeView === 'volunteers' ? 'active' : ''}`}
          onClick={() => setActiveView('volunteers')}
        >
          🚚 Volunteers List
          <span className="menu-count">{volunteers.length}</span>
        </button>
        <button
          className={`admin-menu-btn ${activeView === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveView('pending')}
        >
          ⏳ Pending
          <span className="menu-count pending-count">{pendingDonations.length}</span>
        </button>
        <button
          className={`admin-menu-btn ${activeView === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveView('completed')}
        >
          ✅ Completed Deliveries
          <span className="menu-count success-count">{completedDonations.length}</span>
        </button>
        <button
          className={`admin-menu-btn ${activeView === 'all' ? 'active' : ''}`}
          onClick={() => setActiveView('all')}
        >
          📋 All Donations
          <span className="menu-count">{allDonations.length}</span>
        </button>
      </div>

      {/* ===== OVERVIEW ===== */}
      {activeView === 'overview' && stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{stats.donations?.total || 0}</span>
              <span className="stat-label">Total Donations</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.donations?.pending || 0}</span>
              <span className="stat-label">Pending</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.donations?.delivered || 0}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.users?.donors || 0}</span>
              <span className="stat-label">Donors</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.users?.volunteers || 0}</span>
              <span className="stat-label">Volunteers</span>
            </div>
          </div>

          <div className="two-col">
            <div className="section">
              <h2>Top Donors</h2>
              {stats.topDonors?.length > 0 ? (
                <ul className="leaderboard">
                  {stats.topDonors.map((d, i) => (
                    <li key={d._id}>
                      <span className="rank">#{i + 1}</span>
                      <span className="name">{d.name}</span>
                      <span className="score">{d.totalDonations} donations</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No data yet</p>
              )}
            </div>
            <div className="section">
              <h2>Top Volunteers</h2>
              {stats.topVolunteers?.length > 0 ? (
                <ul className="leaderboard">
                  {stats.topVolunteers.map((v, i) => (
                    <li key={v._id}>
                      <span className="rank">#{i + 1}</span>
                      <span className="name">{v.name}</span>
                      <span className="score">{v.totalPickups} deliveries</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No data yet</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* ===== DONORS LIST ===== */}
      {activeView === 'donors' && (
        <div className="section">
          <h2>🍽️ Donors List ({donors.length})</h2>
          {donors.length === 0 ? (
            <div className="empty-state">
              <p>No donors registered yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Total Donations</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {donors.map((d, idx) => (
                    <tr key={d._id}>
                      <td>{idx + 1}</td>
                      <td>
                        <strong>{d.name}</strong>
                      </td>
                      <td>{d.email}</td>
                      <td>{d.phone || '-'}</td>
                      <td>{d.totalDonations || 0}</td>
                      <td>
                        <span className={d.isActive ? 'text-success' : 'text-danger'}>
                          {d.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {d.createdAt ? format(new Date(d.createdAt), 'dd MMM yyyy') : '-'}
                      </td>
                      <td>
                        {d._id !== user?.id && (
                          <button
                            onClick={() => toggleUserActive(d._id, d.isActive)}
                            className={`btn btn-sm ${d.isActive ? 'btn-danger' : 'btn-success'}`}
                          >
                            {d.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== VOLUNTEERS LIST ===== */}
      {activeView === 'volunteers' && (
        <div className="section">
          <h2>🚚 Volunteers List ({volunteers.length})</h2>
          {volunteers.length === 0 ? (
            <div className="empty-state">
              <p>No volunteers registered yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Completed Deliveries</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteers.map((v, idx) => (
                    <tr key={v._id}>
                      <td>{idx + 1}</td>
                      <td>
                        <strong>{v.name}</strong>
                      </td>
                      <td>{v.email}</td>
                      <td>{v.phone || '-'}</td>
                      <td>
                        <strong className="text-success">{v.totalPickups || 0}</strong>
                      </td>
                      <td>
                        <span className={v.isActive ? 'text-success' : 'text-danger'}>
                          {v.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {v.createdAt ? format(new Date(v.createdAt), 'dd MMM yyyy') : '-'}
                      </td>
                      <td>
                        {v._id !== user?.id && (
                          <button
                            onClick={() => toggleUserActive(v._id, v.isActive)}
                            className={`btn btn-sm ${v.isActive ? 'btn-danger' : 'btn-success'}`}
                          >
                            {v.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== PENDING DONATIONS ===== */}
      {activeView === 'pending' && (
        <div className="section">
          <h2>⏳ Pending Donations ({pendingDonations.length})</h2>
          {pendingDonations.length === 0 ? (
            <div className="empty-state">
              <p>No pending donations right now.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Food</th>
                    <th>Quantity</th>
                    <th>Donor</th>
                    <th>Pickup Address</th>
                    <th>Available Until</th>
                    <th>Status</th>
                    <th>Posted</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDonations.map((d) => (
                    <tr key={d._id}>
                      <td>
                        <strong>{d.foodType}</strong>
                      </td>
                      <td>{d.quantity}</td>
                      <td>{d.donor?.name || '-'}</td>
                      <td className="address-cell">{d.pickupLocation?.address}</td>
                      <td>
                        {d.availableUntil
                          ? format(new Date(d.availableUntil), 'dd MMM, hh:mm a')
                          : '-'}
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusClass(d.status)}`}>
                          {d.status}
                        </span>
                      </td>
                      <td>
                        {d.createdAt ? format(new Date(d.createdAt), 'dd MMM yyyy') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== COMPLETED DELIVERIES ===== */}
      {activeView === 'completed' && (
        <div className="section">
          <h2>✅ Completed Deliveries ({completedDonations.length})</h2>
          {completedDonations.length === 0 ? (
            <div className="empty-state">
              <p>No completed deliveries yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Food</th>
                    <th>Quantity</th>
                    <th>Donor</th>
                    <th>Volunteer</th>
                    <th>Address</th>
                    <th>Delivered At</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {completedDonations.map((d) => (
                    <tr key={d._id}>
                      <td>
                        <strong>{d.foodType}</strong>
                      </td>
                      <td>{d.quantity}</td>
                      <td>{d.donor?.name || '-'}</td>
                      <td>
                        {d.assignedVolunteer?.name || '-'}
                        {d.assignedVolunteer?.phone && (
                          <div className="text-muted small">{d.assignedVolunteer.phone}</div>
                        )}
                      </td>
                      <td className="address-cell">{d.pickupLocation?.address}</td>
                      <td>
                        {d.deliveredAt
                          ? format(new Date(d.deliveredAt), 'dd MMM yyyy, hh:mm a')
                          : d.updatedAt
                            ? format(new Date(d.updatedAt), 'dd MMM yyyy')
                            : '-'}
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusClass(d.status)}`}>
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== ALL DONATIONS ===== */}
      {activeView === 'all' && (
        <div className="section">
          <h2>📋 All Donations ({allDonations.length})</h2>
          {allDonations.length === 0 ? (
            <div className="empty-state">
              <p>No donations yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Food</th>
                    <th>Quantity</th>
                    <th>Donor</th>
                    <th>Volunteer</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {allDonations.map((d) => (
                    <tr key={d._id}>
                      <td>
                        <strong>{d.foodType}</strong>
                      </td>
                      <td>{d.quantity}</td>
                      <td>{d.donor?.name || '-'}</td>
                      <td>{d.assignedVolunteer?.name || '-'}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(d.status)}`}>
                          {d.status}
                        </span>
                      </td>
                      <td>
                        {d.createdAt ? format(new Date(d.createdAt), 'dd MMM yyyy') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
