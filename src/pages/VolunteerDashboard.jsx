import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const VolunteerDashboard = () => {
  const { user } = useAuth();
  const [nearby, setNearby] = useState([]);
  const [myPickups, setMyPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [coords, setCoords] = useState({ longitude: null, latitude: null });
  const [activeTab, setActiveTab] = useState('nearby');

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          longitude: pos.coords.longitude,
          latitude: pos.coords.latitude,
        });
      },
      (err) => setError('Location error: ' + err.message),
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (coords.longitude && coords.latitude) {
        params.longitude = coords.longitude;
        params.latitude = coords.latitude;
      }

      const [nearbyRes, pickupsRes] = await Promise.all([
        api.get('/donations/nearby', { params }),
        api.get('/donations/my-pickups'),
      ]);

      setNearby(nearbyRes.data.data);
      setMyPickups(pickupsRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [coords.longitude, coords.latitude]);

  const handleAccept = async (id) => {
    try {
      await api.put(`/donations/${id}/accept`);
      fetchData();
      setActiveTab('mypickups');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/donations/${id}/status`, { status });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
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

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Volunteer Dashboard</h1>
          <p>Hi {user?.name}! Find nearby surplus food and help deliver it.</p>
        </div>
        <button onClick={getLocation} className="btn btn-outline">
          📍 Refresh Location
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'nearby' ? 'active' : ''}`}
          onClick={() => setActiveTab('nearby')}
        >
          Nearby Requests ({nearby.length})
        </button>
        <button
          className={`tab ${activeTab === 'mypickups' ? 'active' : ''}`}
          onClick={() => setActiveTab('mypickups')}
        >
          My Pickups ({myPickups.length})
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : activeTab === 'nearby' ? (
        <div className="section">
          {nearby.length === 0 ? (
            <div className="empty-state">
              <p>No nearby pending donations right now.</p>
              <p className="text-muted">Try refreshing your location or check back later.</p>
            </div>
          ) : (
            <div className="card-grid">
              {nearby.map((d) => (
                <div key={d._id} className="donation-card">
                  <div className="card-header">
                    <h3>{d.foodType}</h3>
                    <span className={`status-badge ${getStatusClass(d.status)}`}>
                      {d.status}
                    </span>
                  </div>
                  <p className="quantity">{d.quantity}</p>
                  {d.description && <p className="text-muted">{d.description}</p>}
                  <p className="address">📍 {d.pickupLocation?.address}</p>
                  <p className="time">
                    Available until:{' '}
                    {d.availableUntil
                      ? format(new Date(d.availableUntil), 'dd MMM, hh:mm a')
                      : '-'}
                  </p>
                  <p className="donor">
                    Donor: {d.donor?.name} {d.donor?.phone && `• ${d.donor.phone}`}
                  </p>
                  <div className="card-actions">
                    <Link to={`/donations/${d._id}`} className="btn btn-sm btn-outline">
                      Details
                    </Link>
                    <button
                      onClick={() => handleAccept(d._id)}
                      className="btn btn-sm btn-primary"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="section">
          {myPickups.length === 0 ? (
            <div className="empty-state">
              <p>You haven't accepted any donations yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Food</th>
                    <th>Quantity</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th>Donor</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myPickups.map((d) => (
                    <tr key={d._id}>
                      <td>
                        <strong>{d.foodType}</strong>
                      </td>
                      <td>{d.quantity}</td>
                      <td className="address-cell">{d.pickupLocation?.address}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(d.status)}`}>
                          {d.status}
                        </span>
                      </td>
                      <td>
                        {d.donor?.name}
                        <div className="text-muted small">{d.donor?.phone}</div>
                      </td>
                      <td>
                        <div className="action-btns">
                          <Link to={`/donations/${d._id}`} className="btn btn-sm btn-outline">
                            View
                          </Link>
                          {d.status === 'accepted' && (
                            <button
                              onClick={() => handleStatusUpdate(d._id, 'picked')}
                              className="btn btn-sm btn-primary"
                            >
                              Mark Picked
                            </button>
                          )}
                          {d.status === 'picked' && (
                            <button
                              onClick={() => handleStatusUpdate(d._id, 'delivered')}
                              className="btn btn-sm btn-success"
                            >
                              Mark Delivered
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
      )}
    </div>
  );
};

export default VolunteerDashboard;
