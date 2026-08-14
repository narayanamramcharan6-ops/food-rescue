import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const DonorDashboard = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/donations/my');
      setDonations(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this donation?')) return;
    try {
      await api.put(`/donations/${id}/cancel`);
      fetchDonations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel');
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

  const stats = {
    total: donations.length,
    pending: donations.filter((d) => d.status === 'pending').length,
    delivered: donations.filter((d) => d.status === 'delivered').length,
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Donor Dashboard</h1>
          <p>Welcome back, {user?.name}! Manage your food donations here.</p>
        </div>
        <Link to="/donor/new" className="btn btn-primary">
          + New Donation
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total Donations</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.pending}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.delivered}</span>
          <span className="stat-label">Delivered</span>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="section">
        <h2>Your Donations</h2>

        {loading ? (
          <div className="loading">Loading donations...</div>
        ) : donations.length === 0 ? (
          <div className="empty-state">
            <p>You haven't posted any donations yet.</p>
            <Link to="/donor/new" className="btn btn-primary">
              Post Your First Donation
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Food</th>
                  <th>Quantity</th>
                  <th>Pickup Address</th>
                  <th>Available Until</th>
                  <th>Status</th>
                  <th>Volunteer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d._id}>
                    <td>
                      <strong>{d.foodType}</strong>
                      {d.description && <div className="text-muted small">{d.description}</div>}
                    </td>
                    <td>{d.quantity}</td>
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
                      {d.assignedVolunteer ? (
                        <div>
                          <div>{d.assignedVolunteer.name}</div>
                          <div className="text-muted small">{d.assignedVolunteer.phone}</div>
                        </div>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <div className="action-btns">
                        <Link to={`/donations/${d._id}`} className="btn btn-sm btn-outline">
                          View
                        </Link>
                        {['pending', 'accepted'].includes(d.status) && (
                          <button
                            onClick={() => handleCancel(d._id)}
                            className="btn btn-sm btn-danger"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorDashboard;
